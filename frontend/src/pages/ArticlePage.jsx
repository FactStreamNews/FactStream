// src/components/ArticlePage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js'; 
import './ArticlePage.css';

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleRef = doc(db, 'articles', id);
        const articleSnap = await getDoc(articleRef);
        if (articleSnap.exists()) {
          setArticle(articleSnap.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    };

    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (article) {
      const fetchRelatedArticles = async (category) => {
        try {
          const articlesRef = collection(db, 'articles');
          const q = query(articlesRef, where('category', '==', category));
          const querySnapshot = await getDocs(q);
          const related = [];
          querySnapshot.forEach((doc) => {
            if (doc.id !== id) {
              related.push({ id: doc.id, ...doc.data() });
            }
          });
          const randomArticles = related.sort(() => 0.5 - Math.random()).slice(0, 3);
          setRelatedArticles(randomArticles);
        } catch (error) {
          console.error('Error fetching related articles:', error);
        }
      };

      fetchRelatedArticles(article.category);
    }
  }, [article, id]);

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-page">
      <div className="article-content">
        <h1>{article.title}</h1>
        <img src={article.imgUrl} alt={article.title} className="article-image" />
        <p>{article.content}</p>
      </div>
      <div className="related-articles">
        <h2>Related Articles</h2>
        {relatedArticles.map((relatedArticle, index) => (
          <div key={index} className="related-article-item">
            <h3>{relatedArticle.title}</h3>
            <img src={relatedArticle.imgUrl} alt={relatedArticle.title} className="related-article-image" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlePage;
