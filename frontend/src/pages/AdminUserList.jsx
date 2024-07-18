import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '../firebase';

import './AdminUserList.css';

const AdminLandingPage = () => {
  const [user, authLoading, authError] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [highQualityCount, sethighQualityCount] = useState(0);
  const [lowQualityCount, setlowQualityCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (user) {
        console.log(`Fetching admin status for user: ${user.uid}`);
        
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          console.log(`True`);
          setIsAdmin(userDoc.data().is_admin || false);
        } else {
          console.log('No such document!');
        }
        setLoading(false);
      }
    };

    fetchAdminStatus();
  }, [user]);

  useEffect(() => {
    if (loading || authLoading) return;

    if (!user || !isAdmin) {
      navigate('/'); // send to home page if non-admin trying to access
    } else {
      const fetchUserCount = async () => {
        try {
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          setUserCount(usersSnapshot.size);
        } catch (error) {
          console.error('Error fetching user count:', error);
        }
      };
      const getScore = (htmlContent, articleLink) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const links = doc.querySelectorAll('a[href^="http"]');
        const host = new URL(articleLink);
        const excludedHosts = ['twitter.com', 'instagram.com', 'linkedin.com'];
    
        const normalizeHost = (hostname) => hostname.replace(/^www\./, '');
    
        const normalizedHost = normalizeHost(host.hostname);
    
        const externalLinks = Array.from(links).filter(link => {
          const url = new URL(link.href);
          const linkHost = url.host;
      
          // Check if the link host is the same as the article host or is in the excluded list
          if (linkHost === host.hostname || linkHost === normalizedHost || excludedHosts.includes(linkHost)) {
            return false;
          }
      
          return true;
        });
        let article_score = 0;
        if (externalLinks.length > 4) {
          const diff = externalLinks.length - 4;
         // console.log(diff);
          const factor = diff / 6;
          article_score = 10 - factor;
        } else {
          article_score = externalLinks.length + 6;
        }
      
        return article_score;
        
      };
      const fetchArticleCount = async () => {
        try {
          const articlesCollection = collection(db, 'articles');
          const articlesSnapshot = await getDocs(articlesCollection);
          setArticleCount(articlesSnapshot.size);
          const response = await axios.get('/articles');
          const articlesWithScores = response.data.map(article => ({
            ...article,
            qualityScore: getScore(article.content, article.link)
          }));
          
          const highquality = articlesWithScores.filter(article => article.qualityScore >= 7);
          const lowquality = articlesWithScores.filter(article => article.qualityScore < 7);
          console.log(lowquality);
          sethighQualityCount(highquality.length);
          setlowQualityCount(lowquality.length);
        } catch (error) {
          console.error('Error fetching article count:', error);
        }
      };

      const fetchCategoryCounts = async () => {
        const categories = ['tech', 'politics', 'science', 'health', 'sports', 'travel', 'general'];
        const counts = {};
        
        try {
          for (const category of categories) {
            const articlesCollection = collection(db, 'articles');
            const q = query(articlesCollection, where('category', '==', category));
            const categorySnapshot = await getDocs(q);
            counts[category] = categorySnapshot.size;
          }
          setCategoryCounts(counts);
        } catch (error) {
          console.error('Error fetching category counts:', error);
        }
      };

      fetchUserCount();
      fetchArticleCount();
      fetchCategoryCounts();
    }
  }, [user, isAdmin, loading, authLoading, navigate]);

  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return <div>Error: {authError.message}</div>;
  }

  return (
    <div className="admin-landing">
      <h1>Admin Dashboard</h1>
      <div className="stats">
        <p>Total Users: {userCount}</p>
        <p>Total Articles: {articleCount}</p>
        {Object.entries(categoryCounts).map(([category, count]) => (
          <p key={category}>Total {category.charAt(0).toUpperCase() + category.slice(1)} Articles: {count}</p>
        ))}
        <p>Total High Quality Articles: {highQualityCount}</p>
        <p>Total Low Quality Articles: {lowQualityCount}</p>
      </div>
      <div className="admin-buttons">
        <button onClick={() => navigate('/admin/manage-users')}>Manage Users</button>
        <button onClick={() => navigate('/manage-articles')}>Manage Articles</button>
      </div>
    </div>
  );
};

export default AdminLandingPage;
