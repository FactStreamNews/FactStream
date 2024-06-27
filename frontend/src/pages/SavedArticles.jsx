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

    useEffect(() => {
        console.log(savedArticles);
    }, [savedArticles]);

  
    const [articles, setArticles] = useState([]);
  
    useEffect(() => {
      const fetchArticles = async () => {
        try {
          const response = await axios.get('/articles');
          const fetchArticles = response.data;
          console.log(fetchArticles);
          setArticles(response.data);
        } catch (error) {
          console.error('Error fetching articles:', error);
        }
      };
  
      fetchArticles();
    }, []);
  
    return (
      <div className="article-list">
        <h1>Saved Articles</h1>
        {articles.map((article, index) => (
          <div key={index} className="article-item">
            {savedArticles.includes(article.id) && (
              <>
                <h2>{article.title}</h2>
                <h3>{article.category}</h3>
                <img src={article.imgUrl} alt={article.title}></img>
                <div className="article-meta">
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