import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, query, where, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '../firebase';
import './AdminUserList.css';

const AdminManageArticles = () => {
  const [deletedArticles, setDeletedArticles] = useState([]);
  const [sources, setSources] = useState([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('');
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceSlant, setNewSourceSlant] = useState('');

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, authLoading, authError] = useAuthState(auth);
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const Modal = ({ article, onClose, onRecover }) => {
    if (!article) return null;
  
    return (
      <div className="modal">
        <div className="modal-content">
          <span className="close-button" onClick={onClose}>&times;</span>
          <h2>Recover Article</h2>
          <p>Would you like to recover the article titled '{article.title}'?</p>
          <button onClick={() => onRecover(article)}>Yes, Recover</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };

  const handleRecover = async (article) => {
    try {
      // Add the article back to the main collection
      await addDoc(collection(db, 'articles'), {
        ...article,
        recoveredOn: new Date(),
        isRecovered: true
      });
  
      // Remove the article from the deleted collection
      await deleteDoc(doc(db, 'deleted_articles', article.id));
  
      // Update the state
      setDeletedArticles(deletedArticles.filter(a => a.id !== article.id));
      alert(`Article '${article.title}' recovered successfully.`);
    } catch (error) {
      console.error('Error recovering article:', error);
      alert('Error recovering article');
    }
  };

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
          const deletedArticlesList = deletedArticlesSnapshot.docs.map(doc => {
            const data = doc.data();
            const deletedOnDate = data.deletedOn ? new Date(data.deletedOn) : null; // Convert ISO string to Date
      
            return {
              id: doc.id,
              ...data,
              deletedOn: deletedOnDate
            };
          });
          const sortedDeletedArticlesList = deletedArticlesList.sort((a, b) => b.deletedOn - a.deletedOn);

          const article_number = deletedArticlesSnapshot.size;
          console.log(article_number);
          if (article_number > 100) {
            console.log("here");
            const articlesToDelete = sortedDeletedArticlesList.slice(100);
            const batch = writeBatch(db);
            articlesToDelete.forEach(article => {
            const articleRef = doc(db, 'deleted_articles', article.id);
            batch.delete(articleRef);
            });
            await batch.commit();
            console.log(`Deleted ${articlesToDelete.length} articles.`);
          }
          const mostrecent = sortedDeletedArticlesList.slice(0, 50);
          setDeletedArticles(mostrecent);
          console.log(mostrecent.length);
        } catch (error) {
          console.error('Error fetching deleted articles:', error);
        }
      };

      const fetchSources = async () => {
        try {
          const sourcesCollection = collection(db, 'sources');
          const sourcesSnapshot = await getDocs(sourcesCollection);
          const sourcesList = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSources(sourcesList);
        } catch (error) {
          console.error('Error fetching sources:', error);
        }
      };

      fetchDeletedArticles();
      fetchSources();
    }
  }, [user, isAdmin, loading, authLoading, navigate]);

  const handleAddSource = async () => {
    if (!newSourceUrl.endsWith('.xml')) {
      alert('The source URL must end with .xml');
      return;
    }
    try {
      await addDoc(collection(db, 'sources'), {
        url: newSourceUrl,
        category: newSourceCategory,
        name: newSourceName,
        slant: newSourceSlant

      });
      setNewSourceUrl('');
      setNewSourceCategory('');
      setNewSourceName('');
      setNewSourceSlant('');

      alert('Source added successfully');
      const sourcesCollection = collection(db, 'sources');
      const sourcesSnapshot = await getDocs(sourcesCollection);
      const sourcesList = sourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSources(sourcesList);
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Error adding source');
    }
  };

  
  const handleRowClick = (article) => {
    console.log(article);
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

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
               <th>Deleted By</th>
               <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {currentArticles.map(article => (
                <tr key={article.id} onClick={() => handleRowClick(article)}>
                  <td>{article.title}</td>
                  <td>{article.category}</td>
                  <td>{article.deletedOn ? article.deletedOn.toLocaleString() : 'Unknown'}</td>
                  <td>{article.deletedBy}</td>
                  <td>{article.reason}</td>
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
      <div className="admin-sources">
        <h1>Sources</h1>
        <ul>
          {sources.map(source => (
            <li key={source.id}>{source.name} | {source.category} - {source.url}</li>
          ))}
        </ul>
        <div className="add-source-form">
          <input
            type="text"
            value={newSourceUrl}
            onChange={(e) => setNewSourceUrl(e.target.value)}
            placeholder="Source URL (must end with .xml)"
          />
          <input
            type="text"
            value={newSourceCategory}
            onChange={(e) => setNewSourceCategory(e.target.value)}
            placeholder="Category"
          />
            <input
            type="text"
            value={newSourceName}
            onChange={(e) => setNewSourceName(e.target.value)}
            placeholder="Name"
          />
            <input
            type="text"
            value={newSourceSlant}
            onChange={(e) => setNewSourceSlant(e.target.value)}
            placeholder="Slant (conservative, liberal, center)"
          />
          <button onClick={handleAddSource}>Add Source</button>
        </div>
      </div>
      {isModalOpen && (
    <Modal 
    article={selectedArticle} 
    onClose={() => setIsModalOpen(false)}
    onRecover={handleRecover} />
  )}
    </div>
  );
};

export default AdminManageArticles;
