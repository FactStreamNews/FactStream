import React from 'react';

const NewsPage = () => {
  const articles = [
    { title: 'Article 1', content: 'Content for article 1...' },
    { title: 'Article 2', content: 'Content for article 2...' },
    { title: 'Article 3', content: 'Content for article 3...' },
  ];

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

export default NewsPage;
