// routes/articles.js
import express from 'express';
import {getArticleById} from '../models/Article.js';
import { db } from '../config/firebase.js'; 

const router = express.Router();
//get all
router.get('/articles', async (req, res) => {
    try {
      const snapshot = await db.collection('articles').get();
      if (snapshot.empty) {
        res.status(404).send('No articles found');
        return;
      }
      const articles = snapshot.docs.map(doc => {
        return { id: doc.id, ...doc.data() };
      });
      res.status(200).send(articles);
    } catch (error) {
      console.error('Error fetching articles from Firestore:', error); // Log the error
      res.status(500).send({ error: error.message });
    }
  });

// get specific route
router.get('/articles/:id', async (req, res) => {
  try {
    const article = await getArticleById(req.params.id);
    res.status(200).send(article);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



export default router;
