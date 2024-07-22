import cron from 'node-cron';
import FeedParser from 'feedparser';
import request from 'request';
import { db } from './firebase.js';

// No longer used, refactored to store in FB sources collection
// const feeds = {
//   tech: [
//     'https://moxie.foxnews.com/google-publisher/tech.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml',
//   ],
//   politics: [
//     'https://moxie.foxnews.com/google-publisher/politics.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Politics.xml',
//     'https://rss.politico.com/politics-news.xml',
//   ],
//   science: [
//     'https://moxie.foxnews.com/google-publisher/science.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Science.xml',
//   ],
//   health: [
//     'https://moxie.foxnews.com/google-publisher/health.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
//   ],
//   sports: [
//     'https://moxie.foxnews.com/google-publisher/sports.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
//   ],
//   travel: [
//     'https://moxie.foxnews.com/google-publisher/travel.xml',
//     'https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml', 
//   ],
//   general: [
//    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
//   ]
// };

const fetchAndStoreFeeds = async () => {
  const articlesSnapshot = await db.collection('articles').get();
  const articlesCount = articlesSnapshot.size;
  const maxArticles = 230;
  const maxNewArticles = 50;

  let newArticlesCount = 0;
  let totalDuplicateCount = 0;


  const sourcesSnapshot = await db.collection('sources').get();
  const sources = sourcesSnapshot.docs.map(doc => doc.data());

  // groups sources by category
  const groupedSources = sources.reduce((acc, source) => {
    
    const { category, url } = source;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(url);
    return acc;
  }, {});

  console.log('Grouped sources:', groupedSources);

  // loop through sources by category from firestore
  for (const [category, urls] of Object.entries(groupedSources)) {
    for (const url of urls) {
      console.log(`Fetching feed for URL: ${url} under category: ${category}`);

      const { newArticles, duplicates } = await fetchFeed(url, category);
      newArticlesCount += newArticles;
      totalDuplicateCount += duplicates;
    }
  }

  // delete up to 50 articles to make space for new articles
  let articlesDeleted = 0;
  if (articlesCount + newArticlesCount > maxArticles) {
    const articlesToDelete = (articlesCount + newArticlesCount) - maxArticles;
    console.log(`The articles collection has ${articlesCount} documents. Deleting ${articlesToDelete} oldest documents to make room.`);

    const oldestArticlesSnapshot = await db.collection('articles').orderBy('published').limit(articlesToDelete).get();
    const batch = db.batch();

    oldestArticlesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    articlesDeleted = articlesToDelete;
  }

  
};

const fetchFeed = async (feedUrl, category) => {
  const req = request(feedUrl);
  const feedparser = new FeedParser();
  let newArticlesCount = 0;
  let duplicateCount = 0;
  let printedDuplicates = 0;

  req.on('error', function (error) {
    console.error('Request error:', error);
  });

  req.on('response', function (res) {
    if (res.statusCode !== 200) {
      this.emit('error', new Error('Bad status code'));
    } else {
      this.pipe(feedparser);
    }
  });

  feedparser.on('error', function (error) {
    console.error('Feedparser error:', error);
  });

  feedparser.on('readable', async function () {
    let item;

    // Capture image through various RSS formats
    while ((item = this.read()) && newArticlesCount < 50) {
      let imageUrl = '';

      if (item['media:content'] && item['media:content']['@'] && item['media:content']['@'].url) {
        imageUrl = item['media:content']['@'].url;
      }
      else if (item['media:thumbnail'] && item['media:thumbnail']['@'] && item['media:thumbnail']['@'].url) {
        imageUrl = item['media:thumbnail']['@'].url;
      }
      else if (item.image && item.image.url) {
        imageUrl = item.image.url;
      }
      else if (item['media:content'] && item['media:content'].url) {
        imageUrl = item['media:content'].url;
      }
      else {
        console.log('No media:content, media:thumbnail, or image URL found');
      }

      const duplicateCheckSnapshot = await db.collection('articles').where('title', '==', item.title).get();
      if (!duplicateCheckSnapshot.empty) {
        duplicateCount++;
        if (printedDuplicates < 3) {
          console.log(`Duplicate found for title: ${item.title}. Skipping.`);
          printedDuplicates++;
        }
        continue;
      }

    console.log(`Adding new article: ${item.title}`);

      await db.collection('articles').add({
        title: item.title,
        link: item.link,
        published: item.pubDate ? item.pubDate : new Date(),
        content: item.description || '',
        imgUrl: imageUrl,
        category: category
      });

      newArticlesCount++;
    }
  });

  return { newArticles: newArticlesCount, duplicates: duplicateCount };
};

// Set cron expression to once every 2 hours
cron.schedule('0 */2 * * *', () => {
  console.log('Fetching and storing feeds...');
  fetchAndStoreFeeds();
});
