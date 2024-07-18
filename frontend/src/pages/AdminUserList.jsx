import React, { useEffect, useState } from 'react';
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

      const fetchArticleCount = async () => {
        try {
          const articlesCollection = collection(db, 'articles');
          const articlesSnapshot = await getDocs(articlesCollection);
          setArticleCount(articlesSnapshot.size);
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
      </div>
      <div className="admin-buttons">
        <button onClick={() => navigate('/admin/manage-users')}>Manage Users</button>
        <button onClick={() => navigate('/manage-articles')}>Manage Articles</button>
      </div>
    </div>
  );
};

export default AdminLandingPage;
