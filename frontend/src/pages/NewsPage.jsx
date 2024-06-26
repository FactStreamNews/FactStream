import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; // Ensure you have your firebase setup

const NewsPage = () => {
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('/articles');
        const articlesWithFormattedDates = response.data.map(article => ({
          ...article,
          published: new Date(article.published._seconds * 1000).toLocaleString() // convert timestamp to string
        }));
        setArticles(articlesWithFormattedDates);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };

    fetchArticles();
  }, []);

  const toggleSave = (index) => {
    setSavedArticles((prevSavedArticles) =>
      prevSavedArticles.includes(index)
        ? prevSavedArticles.filter((item) => item !== index)
        : [...prevSavedArticles, index]
    );
  };

  return (
    <div className="article-list">
      <h1>News Articles</h1>
      {articles.map((article, index) => (
        <div key={index} className="article-item">
          <h2>{article.title}</h2>
          <img src={article.imgUrl} alt={article.title}></img>
          <p>{article.content || 'No content available'}</p>
          <div className="article-meta">
            <span>Published on: {article.published}</span>
            <span>Likes: {article.likes || 0}</span>
            {user && (
            <button onClick={() => toggleSave(index)}>
              {savedArticles.includes(index) ? 'Unsave' : 'Save'}
            </button>
      )}
          </div>
          <Link 
            to={`/articles/${article.id}`} // Example route path within FactStream
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
