// src/components/ArticlePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js'; 
import './ArticlePage.css';

const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [likes, setLikes] = useState(0); // State to store the likes count
  const [hasLiked, setHasLiked] = useState(false); // State to track if the user has liked the article

  // Fetch the article data based on the id from the URL
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const articleRef = doc(db, 'articles', id);
        const articleSnap = await getDoc(articleRef);
        if (articleSnap.exists()) {
          const articleData = articleSnap.data();
          setArticle(articleData);
          setLikes(articleData.likes || 0); // Initialize the likes state with the value from the article data
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    };

    fetchArticle();
  }, [id]);

  // Fetch related articles based on the category of the current article
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

  // Handle the like button click
  const handleLike = async () => {
    if (hasLiked) return; // Prevent multiple likes

    const newLikes = likes + 1;
    setLikes(newLikes);
    setHasLiked(true);
    try {
      const articleRef = doc(db, 'articles', id);
      await updateDoc(articleRef, {
        likes: newLikes
      });
      console.log('Document successfully updated!');
    } catch (error) {
      console.error('Error updating document: ', error);
      setLikes(likes); // Revert likes count in case of an error
      setHasLiked(false);
    }
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-page">
      <div className="article-content">
        <h1>{article.title}</h1>
        <img src={article.imgUrl} alt={article.title} className="article-image" />
         <div>
         <button
            className="like-button" // Apply CSS class
            onClick={handleLike}
            disabled={hasLiked}
          >
            {hasLiked ? 'Liked' : 'Like'} ({likes})
          </button>
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
       
      </div>
      <div className="related-articles">
        <h2>Related Articles</h2>
        {relatedArticles.map((relatedArticle, index) => (
          <div key={index} className="related-article-item">
            <Link to={`/article/${relatedArticle.id}`}>
              <h3>{relatedArticle.title}</h3>
              <img src={relatedArticle.imgUrl} alt={relatedArticle.title} className="related-article-image" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticlePage;
