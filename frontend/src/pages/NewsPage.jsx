import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 
import { updateDoc, doc, arrayUnion, arrayRemove, addDoc, getDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

const NewsPage = () => {
  
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); 
  const [articleToDelete, setArticleToDelete] = useState(null);
  
  const [filter, setFilter] = useState('Relevance'); 

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState([]);


  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  const countLinks = (htmlContent, articleLink) => {
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

        //Handle automatic deletion of low quality articles
        const lowquality = articlesWithFormattedDates.filter(article => article.qualityScore < 7 && !article.isRecovered);
        console.log(lowquality);
        const deleteLowQualityArticles = async () => {
          for (const article of lowquality) {
            try {
              const deleted = new Date().toLocaleString();
              await addDoc(collection(db, 'deleted_articles'), {
                ...article, 
                deletedBy: 'Automatically',
                reason: 'Quality',
                deletedOn: deleted,
                article_id: article.id
              });
              console.log(`Article '${article.title}' deleted successfully`);

              await deleteDoc(doc(db, 'articles', article.id));
              setArticles(articles.filter(temparticle => temparticle.id !== article.id));
              console.log('Article deleted successfully');
            } catch (error) {
              console.error(`Error deleting article '${article.title}':`, error);
            }
          }
        };

        deleteLowQualityArticles();
  
        let sortedArticles = [];
        // need to create algorthmic way to define relevance weight still
        if (filter === 'Relevance') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => b.published - a.published);
        } else if (filter === 'Most Popular') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else if (filter === 'Controversial') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes));
        }
  
        setArticles(sortedArticles);
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

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredArticles([]);
      return;
    }
  
    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredArticles(filtered);
  };
  

  // delete article for admin use
  const handleConfirmDelete = async () => {
     console.log(articleToDelete);
     const deleted = new Date().toLocaleString();
    if (articleToDelete) {
      try {
        // Add the article to deleted_articles collection
        const {id, ...articlewoID} = articleToDelete;
        const newIdArticle = {...articlewoID, article_id: id};
        await addDoc(collection(db, 'deleted_articles'), {
        ...newIdArticle,
        reason: 'Admin Decision',
        deletedOn: deleted,
        isRecovered: false, 
        deletedBy: 'admin'
      });
        
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

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  
  return (
    <div className="article-list">
      <h1>News Articles</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Search articles by title..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>
      <div className="filter-container">
      <label htmlFor="filter">Filter by: </label>
      <select id="filter" value={filter} onChange={handleFilterChange}>
        <option value="Relevance">Relevance</option>
        <option value="Most Popular">Most Popular</option>
        <option value="Controversial">Controversial</option>
      </select>
    </div>
    {searchQuery ? (
        <div className="search-results">
          {filteredArticles.map((article, index) => (
            <div key={index} className="article-item">
              {user && isAdmin && (
                <button onClick={() => handleDeleteClick(article)} color="inherit" className="delete-button">
                  Delete
                </button>
              )}
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

        ) :currentArticles.map((article, index) => (
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
      {showConfirm && (
        <div className="confirmation-dialog">
          <p>Are you sure you want to delete this article?</p>
          <button onClick={handleConfirmDelete} className="confirm-button">Yes</button>
          <button onClick={handleCancelDelete} className="cancel-button">No</button>
        </div>
      )}
      <div className="pagination">
        <button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default NewsPage;
