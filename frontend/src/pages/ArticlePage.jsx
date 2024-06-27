// src/components/ArticlePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion,arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase.js'; 
import './ArticlePage.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 


const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [likes, setLikes] = useState(0); // State to store the likes count
  const [hasLiked, setHasLiked] = useState(false); // State to track if the user has liked the article
  const [hasSaved, setHasSaved] = useState(false); //State to track if the user saved the article 
  const [savedArticles, setSavedArticles] = useState([]);


  const [user, loading, error] = useAuthState(auth);

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

  useEffect(() => {
    const checkIfSaved = async () => {
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (userData.savedArticles && userData.savedArticles.includes(id)) {
            setHasSaved(true);
          }
        }
      }
    };

    checkIfSaved();
  }, [id]);

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

  const toggleSave = async (index) => {
    if (!user) return;


    const articleId = id;
    console.log("here");
    console.log("articleID:", articleId);
    const q = query(collection(db, "users"), where("uid", "==", user?.uid));
    const doc1 = await getDocs(q);
    const docId = doc1.docs[0].id;
    const userDocRef = doc(db, "users", docId);
    console.log("userDocRef", userDocRef);

    try {
      if (savedArticles.includes(articleId)) {
        await updateDoc(userDocRef, {
          savedArticles: arrayRemove(articleId)
        });
        setSavedArticles(prevSavedArticles => prevSavedArticles.filter(id => id !== articleId));
        setHasSaved(false);
      } else {
        await updateDoc(userDocRef, {
          savedArticles: arrayUnion(articleId)
        });
        setSavedArticles(prevSavedArticles => [...prevSavedArticles, articleId]);
        setHasSaved(true);
      }
    } catch (error) {
      console.error('Error updating saved articles:', error);
    }
  };

  if (!article) return <div>Loading...</div>;

  return (
    <div className="article-page">
      <div className="article-content">
        <h1>{article.title}</h1>
        <img src={article.imgUrl} alt={article.title} className="article-image" />
         <div className='button-container'>
         <button
            className="like-button" // Apply CSS class
            onClick={handleLike}
            disabled={hasLiked}
          >
            {hasLiked ? 'Liked' : 'Like'} ({likes})
          </button>
          <button
            className="save-button" // Apply CSS class
            onClick={toggleSave}
          >
            {hasSaved ? 'Unsave' : 'Save'}
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
