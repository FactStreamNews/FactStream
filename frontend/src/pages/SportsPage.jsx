import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 
import { updateDoc, doc, arrayUnion, arrayRemove, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(false);


  const countLinks = (htmlContent, articleLink) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const links = doc.querySelectorAll('a[href^="http"]');
    const host = new URL(articleLink);
    const externalLinks = Array.from(links).filter(link => {
      const url = new URL(link.href);
      return url.host !== host.hostname;
    });

    let article_score = 0;
    if (externalLinks.length > 4) {
      const diff = externalLinks.length - 4;
     // console.log(diff);
      const factor = diff / 4;
      article_score = 10 - factor;
    } else {
      article_score = externalLinks.length + 6;
    }
  
    return article_score;
    
  };
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('/articles');
        const articlesWithFormattedDates = response.data.map(article => ({
          ...article,
          published: article.published && article.published._seconds 
            ? new Date(article.published._seconds * 1000)
            : 'Unknown',
            qualityScore: countLinks(article.content, article.link)
        }));
        const sportsArticles = articlesWithFormattedDates.filter(articlesWithFormattedDates => articlesWithFormattedDates.category === "sports");
        console.log(sportsArticles);

        // sort articles by date
       // const sortedArticles = articlesWithFormattedDates.sort((a, b) => b.published - a.published);

        setArticles(sportsArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };

    fetchArticles();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchSavedArticles = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setSavedArticles(userDoc.data().savedArticles || []);
          }
        } catch (error) {
          console.error('Error fetching saved articles:', error);
        }
      };

      fetchSavedArticles();
    }
  }, [user]);

  
 /* const toggleSave = (index) => {

    setSavedArticles((prevSavedArticles) =>

      prevSavedArticles.includes(index)

        ? prevSavedArticles.filter((item) => item !== index)

        : [...prevSavedArticles, index]

    );

  };*/
  const toggleSave = async (index) => {
    if (!user) return;

    const articleId = articles[index].id;
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
      } else {
        await updateDoc(userDocRef, {
          savedArticles: arrayUnion(articleId)
        });
        setSavedArticles(prevSavedArticles => [...prevSavedArticles, articleId]);
      }
    } catch (error) {
      console.error('Error updating saved articles:', error);
    }
  };

  const useIsArticleSaved = (index) => {
    const [user] = useAuthState(auth);
    useEffect(() => {
      const checkIsSaved = async () => {
        try{
        const articleId = articles[index].id;
        const q = query(collection(db, "users"), where("uid", "==", user?.uid));
        const doc1 = await getDocs(q);
        const docId = doc1.docs[0].id;
        const userDocRef = doc(db, "users", docId);
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const savedArticles = userDocSnap.data().savedArticles || [];
           setIsSaved(savedArticles.includes(articleId));
        }
        } catch (error){
          console.error("Error checking saved articles");
        }
      }
    }, [user]);
    return isSaved;
  };


  return (
    <div className="article-list">
      <h1>Sports</h1>
      {articles.map((article, index) => (
        <div key={index} className="article-item">
          <h2>
            <Link to={`/article/${article.id}`}>{article.title}</Link>
          </h2>
          <h3>{article.category}</h3>
          <div className="img-container">
            <Link to={`/article/${article.id}`}>
              <img src={article.imgUrl} alt={article.title} />
            </Link>
          </div>
          <div className="article-meta">
            <span>Published on: {article.published.toLocaleString()}</span>
            <span>Likes: {article.likes || 0}</span>
            <span>Dislikes: {article.dislikes || 0}</span>
            <span>Quality Score: {article.qualityScore}</span>
          </div>
          <Link 
            to={`/article/${article.id}`} // Example route path within FactStream
            className="read-more"
          >
            Read more
          </Link>
        </div>
      ))}
    </div>
  );
};

export default NewsPage;
