import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NewsPage = () => {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('/articles');
        const articlesWithFormattedDates = response.data.map(article => ({
          ...article,
          published: new Date(article.published._seconds * 1000).toLocaleString() // convert time stamp to string
        }));
        setArticles(articlesWithFormattedDates);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div>
      <h1>News Articles</h1>
      <ul>
        {articles.map((article, index) => (
          <li key={index}>
            <h2>{article.title}</h2>
            <p>{article.content || 'No content available'}</p>
            <p>Published on: {article.published}</p> {}
            <p>Likes: {article.likes || 0}</p>
            <a href={article.link}>Read more</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NewsPage;
