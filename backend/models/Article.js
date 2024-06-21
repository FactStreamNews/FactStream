// models/Article.js
import { db } from '../firebase.js';

const articlesCollection = db.collection('articles');
// new article
export const createArticle = async (article) => {
  const res = await articlesCollection.add(article);
  return res.id;
};

// getter
export const getArticleById = async (id) => {
  const doc = await articlesCollection.doc(id).get();
  if (!doc.exists) {
    throw new Error('Article not found');
  }
  return doc.data();
};

// update for likes count etc
export const updateArticle = async (id, updatedArticle) => {
  await articlesCollection.doc(id).set(updatedArticle, { merge: true });
};


