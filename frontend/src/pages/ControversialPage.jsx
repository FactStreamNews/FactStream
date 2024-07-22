import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 
import { updateDoc, doc, arrayUnion, arrayRemove, addDoc, getDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ControversialPage = () => {
  
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); 
  const [articleToDelete, setArticleToDelete] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;
  useEffect(() => {
    
    const fetchArticles = async () => {
      try {
        const response = await axios.get('/articles');
        const articlesWithFormattedDates = response.data.map(article => ({
          ...article,
          published: article.published && article.published._seconds 
            ? new Date(article.published._seconds * 1000)
            : 'Unknown',
          likes: article.likes || 0,
          dislikes: article.dislikes || 0,
          totalLikes: (article.likes || 0) - (article.dislikes || 0)
        }));


      
        // sort articles by likes
        const sortedArticles = articlesWithFormattedDates.sort((a, b) => {
            if (a.totalLikes < 0 && b.totalLikes < 0) {
              return a.totalLikes - b.totalLikes; // Sort by totalLikes ascending
            } else if (a.totalLikes === 0 && b.totalLikes === 0) {
              return b.published - a.published; // Sort by date descending
            } else if (a.totalLikes === 0 || b.totalLikes === 0) {
              return a.totalLikes - b.totalLikes; // Ensure totalLikes 0 are sorted appropriately
            } else {
              return a.totalLikes - b.totalLikes; // Sort by totalLikes ascending
            }
          });
          console.log(sortedArticles);
       const topArticles = sortedArticles.slice(0,10);
        setArticles(topArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
      }
    };
    const fetchAdminStatus = async () => {
      if (user) {
        console.log(`Fetching admin status for user: ${user.uid}`);
        
        // Query to find the document with the uid field
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const doc1 = await getDocs(q);
        const data = doc1.docs[0].data();
        const docID = doc1.docs[0].id;
        const docRef = doc(db, "users", docID);

    
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          console.log(`User data: ${JSON.stringify(userDoc.data())}`);
          setIsAdmin(userDoc.data().is_admin || false);
        } else {
          console.log('No such document!');
        }
      }
    };

    fetchAdminStatus();

    fetchArticles();
  }, [user, loading]);

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


   const handleDeleteClick = (article) => {
    setArticleToDelete(article);
    setShowConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setArticleToDelete(null);
  };

  // delete article for admin use
  const handleConfirmDelete = async () => {
    if (articleToDelete) {
      try {
        // Add the article to deleted_articles collection
        await addDoc(collection(db, 'deleted_articles'), articleToDelete);
        
        // Delete the article from articles collection
        await deleteDoc(doc(db, 'articles', articleToDelete.id));
        setArticles(articles.filter(article => article.id !== articleToDelete.id));
        console.log('Article deleted successfully');
      } catch (error) {
        console.error('Error deleting article:', error);
      } finally {
        setShowConfirm(false);
        setArticleToDelete(null);
      }
    }
  };

  
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

  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = articles.slice(indexOfFirstArticle, indexOfLastArticle);

  const totalPages = Math.ceil(articles.length / articlesPerPage);

  const handleNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  const handlePreviousPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  };

  return (
    <div className="article-list">
      <h1>Controversial</h1>
      {currentArticles.map((article, index) => (
        <div key={index} className="article-item">
         {user && isAdmin && (
               <button onClick={() => handleDeleteClick(article)} color="inherit" className="delete-button">
               Delete
             </button>
          )}         <h2>
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
          </div>
          <Link 
            to={`/article/${article.id}`} // Example route path within FactStream
            className="read-more"
          >
            Read more
          </Link>
        </div>
      ))}
      {showConfirm && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to delete this article?</p>
          <button onClick={handleConfirmDelete} className="confirm-button">Yes</button>
          <button onClick={handleCancelDelete} className="cancel-button">No</button>
        </div>
      )}
    </div>
  );
};

export default ControversialPage;
