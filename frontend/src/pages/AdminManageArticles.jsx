import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '../firebase';
import './AdminUserList.css';

const AdminManageArticles = () => {
  const [deletedArticles, setDeletedArticles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, authLoading, authError] = useAuthState(auth);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;
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
      const fetchDeletedArticles = async () => {
        try {
          const deletedArticlesCollection = collection(db, 'deleted_articles');
          const deletedArticlesSnapshot = await getDocs(deletedArticlesCollection);
          const deletedArticlesList = deletedArticlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setDeletedArticles(deletedArticlesList);
        } catch (error) {
          console.error('Error fetching deleted articles:', error);
        }
      };

      fetchDeletedArticles();
    }
  }, [user, isAdmin, loading, authLoading, navigate]);

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = deletedArticles.slice(indexOfFirstArticle, indexOfLastArticle);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return <div>Error: {authError.message}</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-deleted-articles">
        <h1>Deleted Articles</h1>
        {currentArticles.length === 0 ? (
          <p>No deleted articles found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Deleted On</th>
              </tr>
            </thead>
            <tbody>
              {currentArticles.map(article => (
                <tr key={article.id}>
                  <td>{article.title}</td>
                  <td>{article.category}</td>
                  <td>{article.deletedOn ? new Date(article.deletedOn.seconds * 1000).toLocaleString() : 'Unknown'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pagination">
          {[...Array(Math.ceil(deletedArticles.length / articlesPerPage)).keys()].map(number => (
            <button key={number + 1} onClick={() => paginate(number + 1)} className="pagination-button">
              {number + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminManageArticles;
