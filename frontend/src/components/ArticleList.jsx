// src/components/ArticleList.jsx
import React from 'react';

const ArticleList = ({ articles }) => {
  return (
    <div>
      <h1>News Articles</h1>
      <ul>
        {articles.map((article, index) => (
          <li key={index}>
            <h2>{article.title}</h2>
            <p>{article.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ArticleList;
