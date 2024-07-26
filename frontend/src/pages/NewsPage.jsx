import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './ArticleList.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase'; 
import { updateDoc, doc, arrayUnion, arrayRemove, addDoc, getDoc, query, collection, where, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import Poll from '../components/Poll.jsx';

const randomNormal = (mean, stdDev) => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  num = num * stdDev + mean;
  return Math.round(num);
};

const simulateLikesDislikes = (articles) => {
  return articles.map(article => {
    if (!article.simulated) {
      const qualityScore = article.qualityScore || 0;
      const meanLikes = qualityScore * 10;
      const stdDevLikes = 5;
      const meanDislikes = (10 - qualityScore) * 2; 
      const stdDevDislikes = 2; 

      const simulatedLikes = Math.max(0, randomNormal(meanLikes, stdDevLikes));
      const simulatedDislikes = Math.max(0, randomNormal(meanDislikes, stdDevDislikes));

      return {
        ...article,
        likes: simulatedLikes,
        dislikes: simulatedDislikes,
        simulated: true,
        relevance: calculateRelevance(simulatedLikes, simulatedDislikes, article.published.getTime())
      };
    }
    return article;
  });
};

const calculateRelevance = (likes, dislikes, publishedTimestamp) => {
  const timeSincePublished = (Date.now() - publishedTimestamp) / (1000 * 60 * 60); 
  return ((2 * likes) - (3 * dislikes)) / timeSincePublished;
};

const NewsPage = () => {
  
  const [articles, setArticles] = useState([]);
  const [savedArticles, setSavedArticles] = useState([]);
  const [user, loading, error] = useAuthState(auth);
  const [isSaved, setIsSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); 
  const [articleToDelete, setArticleToDelete] = useState(null);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('Date'); 

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState([]);

  const [filteredSources, setFilteredSources] = useState([]);

  const sources = ["Fox News", "New York Times", "Politico"]; // List of sources


  const [currentPage, setCurrentPage] = useState(1);
  const articlesPerPage = 10;

  const calculateRelevance = (likes, dislikes, publishedTimestamp) => {
    const timeSincePublished = (Date.now() - publishedTimestamp) / (1000 * 60 * 60); 
    return ((2 * likes) - (3 *dislikes)) / timeSincePublished;
  };


  const countLinks = (htmlContent, articleLink, source, category) => {
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
  
    if (article_score == 6) {
      const rando = Math.floor(Math.random()* 10) + 1;
      if ((source === "nyt" || source === "politico") && category === "politics") {
        if (rando > 0) {
          article_score = 7;
        }
      } else {
        if (rando > 5) {
          article_score = 7;
        }
      }
    }

    if (htmlContent.length < 50) {
      article_score = 0;
    }
    return article_score;
    
  };
  useEffect(() => {
    
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/articles');
        let articlesWithFormattedDates = response.data.map(article => {
          const publishedTimestamp = article.published._seconds * 1000; 
          const publishedDate = new Date(publishedTimestamp);
          return {
            ...article,
            published: publishedDate,
            qualityScore: countLinks(article.content, article.link, article.source, article.category),
            relevance: calculateRelevance(article.likes || 0, article.dislikes || 0, publishedTimestamp),
            likes: article.likes || 0,
            dislikes: article.dislikes || 0,
            totalLikes: (article.likes || 0) - (article.dislikes || 0)
          };
        });

        articlesWithFormattedDates = simulateLikesDislikes(articlesWithFormattedDates);


        //Handle automatic deletion of low quality articles
        const lowquality = articlesWithFormattedDates.filter(article => article.qualityScore < 7 && !article.isRecovered);
        console.log(lowquality);
        const deleteLowQualityArticles = async () => {
          const batchSize = 500;
          const numBatch = Math.ceil(lowquality.length / batchSize);

          for (let i = 0; i < numBatch; i++) {
            const batch = writeBatch(db);
            const start = i * batchSize;
            const end = start + batchSize
            const currentBatch = lowquality.slice(start, end);

            for (const article of currentBatch) {
              try {
                const deleted = new Date().toISOString();
                const { id, ...articleWithoutId } = article;
                await addDoc(collection(db, 'deleted_articles'), {
                  ...articleWithoutId, 
                  deletedBy: 'Automatically',
                  reason: 'Quality',
                  deletedOn: deleted,
                  article_id: article.id
                });
                console.log(`Article '${article.title}' deleted successfully`);
  
                const articleRef = doc(db, 'articles', article.id);
                batch.delete(articleRef);
              } catch (error) {
                console.error(`Error deleting article '${article.title}':`, error);
              }
            }
            try {
              await batch.commit(); // Commit the batch write
              setArticles(articles.filter(temparticle => !lowquality.some(lq => lq.id === temparticle.id)));
              console.log('Batch delete completed successfully');
            } catch (error) {
              console.error('Error committing batch delete:', error);
            }
          }   
        };

        await deleteLowQualityArticles();

        let sortedArticles = articlesWithFormattedDates.sort((a, b) => b.published - a.published);

        if (filter === 'Relevance') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => b.relevance - a.relevance);
        } else if (filter === 'Most Popular') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        } else if (filter === 'Controversial') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes));
        } else if (filter == 'Date') {
          sortedArticles = articlesWithFormattedDates.sort((a, b) => b.published - a.published);
        }
  
        setArticles(sortedArticles);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
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
    if (query.startsWith("source:")) {
      const sourceName = query.split("source:")[1].trim().toLowerCase();
      const filteredBySource = articles.filter(article => article.source && article.source.includes(sourceName));
      const filtered = sources.filter(source => source.toLowerCase().includes(sourceName));
      setFilteredSources(filtered);
      setFilteredArticles(filteredBySource);
    } else {
  
    const filtered = articles.filter(article => 
      article.title.toLowerCase().includes(query.toLowerCase()));
      setFilteredArticles(filtered);

  }
  };

  const handleSuggestionClick = (source) => {
    setSearchQuery(`source:${source}`);
    setFilteredSources([]);
  };
  

  const formatRelevanceScore = (article) => {
    const likes = article.likes || 0;
    const dislikes = article.dislikes || 0;
    const publishedTimestamp = new Date(article.published).getTime();
    const currentTimestamp = Date.now();
    const timeDifferenceHours = (currentTimestamp - publishedTimestamp) / (1000 * 60 * 60);

    const numerator = 2 * likes - 3 * dislikes;
    const denominator = timeDifferenceHours.toFixed(2);
    const relevanceScore = (numerator / timeDifferenceHours).toFixed(2);

    return { numerator, denominator, relevanceScore };
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
    const selected = e.target.value;
    setFilter(e.target.value);

    let sortedArticles = [...articles];

    if (selected === 'Relevance') {
       sortedArticles.sort((a, b) => b.relevance - a.relevance);
       setArticles(sortedArticles);
     } else if (selected === 'Most Popular'){
       sortedArticles.sort((a, b) => {
        if (a.totalLikes > 0 && b.totalLikes > 0) {
          return b.likes - a.likes; // Sort by likes descending
        } else if (a.totalLikes === 0 && b.totalLikes === 0) {
          return b.published - a.published; // Sort by date descending
        } else {
          return b.totalLikes - a.totalLikes; // Sort by likes descending
        }
      });
   // let topArticles = sortedArticles.slice(0,10);
    setArticles(sortedArticles);
    }
    else if (selected === 'Controversial') {
      sortedArticles.sort((a, b) => {
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
   // let topArticles = sortedArticles.slice(0,10);
    setArticles(sortedArticles);
    } else if (selected === 'Date') {
      sortedArticles.sort((a, b) => b.published - a.published);
      setArticles(sortedArticles);
    }
  };



return (
  <div className="article-list">
    {isLoading ? (
      <div className="loading">Loading...</div>
    ) : (
      <>
    <h1>News Articles</h1>

    <div className="search-filter-container"> 
    <div className="filter-container">
      <label htmlFor="filter">Filter by: </label>
      <select id="filter" value={filter} onChange={handleFilterChange}>
        <option value="Date">Date</option> 
        <option value="Relevance">Relevance</option>
        <option value="Most Popular">Most Popular</option>
        <option value="Controversial">Controversial</option>
      </select>
    </div>

    {/* Search bar moved inside search-filter-container */}
    <div className="search-container">
      <div className="search-tip">Search sources with "source:[name]" prefix.</div>
      <input
        type="text"
        placeholder="Search articles by title or source"
        value={searchQuery}
        onChange={handleSearchChange}
        className='search-input'
      />
      <br></br>
        <textarea
        className='source-textarea'
        rows="3"
        cols="50"
        value={filteredSources.join(', ')}
        readOnly
      />
         {/* {filteredSources.length > 0 && (
                <div className="suggestions">
                  {filteredSources.map((source, index) => (
                    <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(source)}>
                      {source}
                    </div>
                  ))}
                </div>
              )} */}
    </div>
  </div>

    {/* Other news page content */}
    <Poll isAdmin={isAdmin} />
    
    {searchQuery ? (
      <div className="search-results">
        {filteredArticles.length > 0 ? (

        filteredArticles.map((article, index) => {
          const { numerator, denominator, relevanceScore } = formatRelevanceScore(article);

          return (

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
              {isAdmin &&
              <span>
                      Relevance Score: (2 * {article.likes} - 3 * {article.dislikes}) / {denominator} hours
                      <br />
                      Calculated: ({numerator}/{denominator}) {relevanceScore}
                    </span>  
            }    </div>
            <Link 
              to={`/article/${article.id}`} // Example route path within FactStream
              className="read-more"
            >
              Read more
            </Link>
          </div>
        )})
      ) : (
        <div className="no-results"> 
          {searchQuery.startsWith("source:") ? (
                    <>Could not find source called "{searchQuery.substring(7)}"</>
                  ) : (
                    <>No results found for query "{searchQuery}"</>
                  )}
        </div>
      )}
    </div>
  ) : (
      currentArticles.map((article, index) => { 
        const { numerator, denominator, relevanceScore } = formatRelevanceScore(article);

        return(

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
            {user && isAdmin && (
                        <span>Quality Score: {article.qualityScore}</span>
                      )}
            {isAdmin &&
            <span>
                      Relevance Score: (2 * {article.likes} - 3 * {article.dislikes}) / {denominator} hours
                      <br />
                      Calculated: ({numerator}/{denominator}) {relevanceScore}
                    </span>
      }
          </div>
          <Link 
            to={`/article/${article.id}`} // Example route path within FactStream
            className="read-more"
          >
            Read more
          </Link>
        </div>
      )})
    )}

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
    </>
      )}
  </div>
);
};

export default NewsPage;

