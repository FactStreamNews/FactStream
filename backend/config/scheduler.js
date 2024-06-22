import cron from 'node-cron';
import FeedParser from 'feedparser';
import request from 'request';
import { db } from './firebase.js'; 

const fetchAndStoreFeeds = () => {
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
      db.collection('articles').add({
        title: item.title,
        link: item.link,
        published: item.pubDate ? item.pubDate : new Date(), 
        content: item.description || '', 
      }).then(docRef => {
        console.log('Document written with ID: ', docRef.id);
      }).catch(error => {
        console.error('Error adding document: ', error);
      });
    }
  });
};

// set cron expression to once an hour
cron.schedule('0 * * * *', () => {
  console.log('Fetching and storing feeds...');
  fetchAndStoreFeeds();
});
