import cron from 'node-cron';
import FeedParser from 'feedparser';
import request from 'request';
import { db } from './firebase.js'; 

const fetchAndStoreFeeds = async () => {

  const articlesSnapshot = await db.collection('articles').get();
  // upperbound to 50, in future, would delete oldest and replace with new
    if (articlesSnapshot.size >= 50) {
      console.log('The articles collection already has 50 or more documents. Skipping the fetch.');
      return;
    }
    // TODO change to list of urls
  const req = request('http://feeds.bbci.co.uk/news/rss.xml');
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

  feedparser.on('readable', function() {
    let item;
    while ((item = this.read())) {
      let imageUrl = '';

    // console.log('Processing item:', item);

    // Check if 'media:content' exists and has a URL
    if (item['media:content'] && item['media:content'].url) {
      imageUrl = item['media:content'].url;
    } 
    // Check if 'media:thumbnail' exists and has a URL
    else if (item['media:thumbnail'] && item['media:thumbnail']['@'] && item['media:thumbnail']['@'].url) {
      imageUrl = item['media:thumbnail']['@'].url;
    } 
    // Check if 'image' exists and has a URL
    else if (item.image && item.image.url) {
      imageUrl = item.image.url;
    } else {
      console.log('No media:content, media:thumbnail, or image URL found');
    }

    console.log('Image URL:', imageUrl);


    
      db.collection('articles').add({
        title: item.title,
        link: item.link,
        published: item.pubDate ? item.pubDate : new Date(), 
        content: item.description || '',
        imgUrl: imageUrl 
      }).then(docRef => {
        console.log('Document written with ID: ', docRef.id);
      }).catch(error => {
        console.error('Error adding document: ', error);
      });
    }
  });
};

// set cron expression to once an hour
cron.schedule('0 */2 * * *', () => {
  console.log('Fetching and storing feeds...');
  fetchAndStoreFeeds();
});
