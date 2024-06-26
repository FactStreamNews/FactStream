import cron from 'node-cron';
import FeedParser from 'feedparser';
import request from 'request';
import { db } from './firebase.js'; 


const feeds = {
  tech: [
    'https://moxie.foxnews.com/google-publisher/tech.xml',
  ],
  politics: [
    'https://moxie.foxnews.com/google-publisher/politics.xml',
  ],
  science: [
    'https://moxie.foxnews.com/google-publisher/science.xml',
  ],
  health: [
    'https://moxie.foxnews.com/google-publisher/health.xml',
  ],
  sports: [
    'https://moxie.foxnews.com/google-publisher/sports.xml',
  ],
  travel: [
    'https://moxie.foxnews.com/google-publisher/travel.xml',
  ],
  general: [
    'http://feeds.bbci.co.uk/news/rss.xml',
    'https://moxie.foxnews.com/google-publisher/world.xml',
  ]
};

const fetchAndStoreFeeds = async () => {
  const articlesSnapshot = await db.collection('articles').get();
  if (articlesSnapshot.size >= 230) {
    console.log('The articles collection already has 230 or more documents. Skipping the fetch.');
    return;
  }

  for (const [category, urls] of Object.entries(feeds)) {
    for (const url of urls) {
      await fetchFeed(url, category);
    }
  }
};

const fetchFeed = async (feedUrl, category) => {
  const req = request(feedUrl);
  const feedparser = new FeedParser();

  req.on('error', function(error) {
    console.error('Request error:', error);
  });

  req.on('response', function(res) {
    if (res.statusCode !== 200) {
      this.emit('error', new Error('Bad status code'));
    } else {
      this.pipe(feedparser);
    }
  });

  feedparser.on('error', function(error) {
    console.error('Feedparser error:', error);
  });

  feedparser.on('readable', async function() {
    let item;
    while ((item = this.read())) {
      let imageUrl = '';
      console.log('Processing item:', item);

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
  

      console.log('Image URL:', imageUrl);

      // check for duplicate titles
      const duplicateCheckSnapshot = await db.collection('articles').where('title', '==', item.title).get();
      if (!duplicateCheckSnapshot.empty) {
        console.log(`Duplicate found for title: ${item.title}. Skipping.`);
        continue;
      }

      db.collection('articles').add({
        title: item.title,
        link: item.link,
        published: item.pubDate ? item.pubDate : new Date(),
        content: item.description || '',
        imgUrl: imageUrl,
        category: category  
      }).then(docRef => {
        console.log('Document written with ID: ', docRef.id);
      }).catch(error => {
        console.error('Error adding document: ', error);
      });
    }
  });
};


// set cron expression to once an hour
cron.schedule('* */2 * * *', () => {
  console.log('Fetching and storing feeds...');
  fetchAndStoreFeeds();
});
