import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 
import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore'; // Import Firestore functions
import { db } from '../firebase'; // Import Firestore database instance

const SavedArticlesPage = () => {
    const [savedArticles, setSavedArticles] = useState([]);
    const [user, loading, error] = useAuthState(auth);
  
    useEffect(() => {
      if (user) {
        // Fetch the user's saved articles if the user is signed in
        const fetchSavedArticles = async () => {
          try {
            const q = query(collection(db, "users"), where("uid", "==", user?.uid));
            const doc1 = await getDocs(q);
            const docId = doc1.docs[0].id;
            const userDoc = await getDoc(doc(db, "users", docId));
            console.log(userDoc.data().savedArticles)
            setSavedArticles(userDoc.data().savedArticles)
            //console.log(savedArticles)
            
          } catch (error) {
            console.error('Error fetching saved articles:', error);
          }
        };
  
        fetchSavedArticles();
      }
    }, [user]);
  
    const [articles, setArticles] = useState([]);
  
    useEffect(() => {
      const fetchArticles = async () => {
        try {
          const response = await axios.get('/articles');
          const articlesWithFormattedDates = response.data.map(article => ({
            ...article,
            published: article.published && article.published._seconds 
              ? new Date(article.published._seconds * 1000)
              : 'Unknown'
          }));
          const newSaved = articlesWithFormattedDates.filter(articlesWithFormattedDates => savedArticles.includes(articlesWithFormattedDates.id));
          console.log(articlesWithFormattedDates);
          console.log(newSaved);
          //console.log(fetchArticles);
          setArticles(newSaved);
        } catch (error) {
          console.error('Error fetching articles:', error);
        }
      };

  
      fetchArticles();
    }, [savedArticles]);
  
    return (
      <div className="article-list">
        <h1>Saved Articles</h1>
        {articles.map((article, index) => (
          <div key={index} className="article-item">
            {(
              <>
                <h2>{article.title}</h2>
                <h3>{article.category}</h3>
                <img src={article.imgUrl} alt={article.title}></img>
                <div className="article-meta">
                <span>Published on: {article.published.toLocaleString()}</span>
                  <span>Likes: {article.likes || 0}</span>
                  <Link 
                    to={`/article/${article.id}`}
                    className="read-more"
                  >
                    Read more
                  </Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  export default SavedArticlesPage;