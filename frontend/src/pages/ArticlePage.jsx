// src/components/ArticlePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js'; 
import './ArticlePage.css';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import Modal from 'react-modal'; 
import ReportArticleModal from '../components/ReportArticleModal';


const ArticlePage = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [otherReason, setOtherReason] = useState('');

  const [likes, setLikes] = useState(0); // State to store the likes count
  const [dislikes, setDislikes] = useState(0); // State to store the dislikes count
  const [hasLiked, setHasLiked] = useState(false); // State to track if the user has liked the article
  const [hasDisliked, setHasDisliked] = useState(false); // State to track if the user has disliked the article
  const [hasSaved, setHasSaved] = useState(false); // State to track if the user saved the article
  const [savedArticles, setSavedArticles] = useState([]);
  const [comments, setComments] = useState([]); // list of existing comments 
  const [newComment, setNewComment] = useState(''); // new comment
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');




  const fetchUserName = async () => {
    if (user) {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setName(data.name);

    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  }
  };
  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (user) {
        //console.log(`Fetching admin status for user: ${user.uid}`);
        
        // Query to find the document with the uid field
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const doc1 = await getDocs(q);
        const data = doc1.docs[0].data();
        const docID = doc1.docs[0].id;
        const docRef = doc(db, "users", docID);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          //console.log(`User data: ${JSON.stringify(userDoc.data())}`);
          setIsAdmin(userDoc.data().is_admin || false);
        } else {
          console.log('No such document!');
        }
      }
    };

    fetchAdminStatus();
  }, [user, loading]);



  // Fetch article data
  useEffect(() => {
    fetchUserName(); // test
    const fetchArticle = async () => {
      try {
        const articleRef = doc(db, 'articles', id);
        const articleSnap = await getDoc(articleRef);
        if (articleSnap.exists()) {
          const articleData = articleSnap.data();
          setArticle(articleData);
          setLikes(articleData.likes || 0);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      }
    };

    fetchArticle();
  }, [id]);

  // Fetch comments data
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const commentsRef = collection(db, 'articles', id, 'comments');
        const commentsSnap = await getDocs(commentsRef);
        const commentsList = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(commentsList);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [id]);

  // Handle addition of comments
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to comment.');
      return;
    }



    try {
      const commentsRef = collection(db, 'articles', id, 'comments');
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      console.log(data.is_private);
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: name, // user.displayName
        text: newComment,
        createdAt: new Date(),
        isPrivate: data.is_private
      });
      setNewComment('');
      // Fetch comments again to update the list
      const commentsSnap = await getDocs(commentsRef);
      const commentsList = commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setComments(commentsList);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleCancelComment = () => {
    setNewComment('');
  };

  const handleDeleteComment = async (commentID) => {
    try { 
      const confirm = window.confirm("Are you sure you want to delete this comment?");
      if (confirm) {
      const commentRef = doc(db, 'articles', id, 'comments', commentID);
      const docSnap = await getDoc(commentRef);
    //  console.log(data);
      //Store Deleted comment in Firebase
      await addDoc(collection(db, "deleted_comments"), {
        comment_id: commentID,
        timestamp: docSnap.data().createdAt,
        deleted_by: user.uid,
        content: docSnap.data().text
      });
      await deleteDoc(commentRef);

      setComments(prevComments => prevComments.filter(comment => comment.id !== commentID));
      window.alert("Comment Deleted");
      console.log("here");

      } else{
        window.alert("Comment deletion cancelled");
      }
    } catch (err) {
      console.error("Error Deleting Comment:", error);
    }
  }

  const handleReport = async (e, reason) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to report articles.');
      return;
    }
    try {
      const reportsRef = collection(db, 'reports');
      await addDoc(reportsRef, {
        userId: user.uid,
        articleId: id,
        reason: reason,
        status: 'Pending',
        createdAt: new Date()
      });
      setReportReason('');
      setOtherReason('');
      setIsReportModalOpen(false);
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };
  

  // check if user liked article
  useEffect(() => {
    const checkIfUserLiked = async () => {
      if (user) {
        const likesRef = collection(db, 'likes');
        const q = query(likesRef, where('userId', '==', user.uid), where('articleId', '==', id));
        const querySnapshot = await getDocs(q);
        setHasLiked(!querySnapshot.empty);
      }
    };

    checkIfUserLiked();
  }, [user, id]);


  // Fetch related articles based on the category of the current article
  useEffect(() => {
    if (article) {
      const fetchRelatedArticles = async (category) => {
        try {
          const articlesRef = collection(db, 'articles');
          const q = query(articlesRef, where('category', '==', category));
          const querySnapshot = await getDocs(q);
          const related = [];
          querySnapshot.forEach((doc) => {
            if (doc.id !== id) {
              related.push({ id: doc.id, ...doc.data() });
            }
          });
          const randomArticles = related.sort(() => 0.5 - Math.random()).slice(0, 3);
          setRelatedArticles(randomArticles);
        } catch (error) {
          console.error('Error fetching related articles:', error);
        }
      };

      fetchRelatedArticles(article.category);
    }
  }, [article, id]);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          if (userData.savedArticles && userData.savedArticles.includes(id)) {
            setHasSaved(true);
          }
        }
      }
    };

    checkIfSaved();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      alert('Please sign in to like articles.');
      return;
    }
      const likesRef = collection(db, 'likes');
      const articleRef = doc(db, 'articles', id);
      const userLikeRef = query(likesRef, where('userId', '==', user.uid), where('articleId', '==', id));
      const userLikeSnapshot = await getDocs(userLikeRef);

      try {
        if (userLikeSnapshot.empty) {
          // User is liking the article
          await addDoc(likesRef, {
            userId: user.uid,
            articleId: id
          });
          await updateDoc(articleRef, {
            likes: likes + 1
          });
          setLikes(likes + 1);
          setHasLiked(true);
        } else {
          // User is unliking the article
          const likeDocId = userLikeSnapshot.docs[0].id;
          const likeDocRef = doc(db, 'likes', likeDocId);
          await deleteDoc(likeDocRef);
          await updateDoc(articleRef, {
            likes: likes - 1
          });
          setLikes(likes - 1);
          setHasLiked(false);
        }
      } catch (error) {
        console.error('Error updating likes:', error);
      }
    };

    const handleDislike = async () => {
      if (!user) {
        alert('Please sign in to dislike articles.');
        return;
      }
        const dislikesRef = collection(db, 'dislikes');
        const articleRef = doc(db, 'articles', id);
        const userDislikeRef = query(dislikesRef, where('userId', '==', user.uid), where('articleId', '==', id));
        const userDislikeSnapshot = await getDocs(userDislikeRef);
  
        try {
          if (userDislikeSnapshot.empty) {
            // User is liking the article
            await addDoc(dislikesRef, {
              userId: user.uid,
              articleId: id
            });
            await updateDoc(articleRef, {
              dislikes: dislikes + 1
            });
            setDislikes(dislikes + 1);
            setHasDisliked(false);
          } else {
            // User is unliking the article
            const dislikeDocId = userDislikeSnapshot.docs[0].id;
            const dislikeDocRef = doc(db, 'dislikes', dislikeDocId);
            await deleteDoc(dislikeDocRef);
            await updateDoc(articleRef, {
              dislikes: dislikes - 1
            });
            setDislikes(dislikes - 1);
            setHasDisliked(false);
          }
        } catch (error) {
          console.error('Error updating dislikes:', error);
        }
      };



    const toggleSave = async (index) => {
      if (!user) return;

      const articleId = id;
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
          setHasSaved(false);
        } else {
          await updateDoc(userDocRef, {
            savedArticles: arrayUnion(articleId)
          });
          setSavedArticles(prevSavedArticles => [...prevSavedArticles, articleId]);
          setHasSaved(true);
        }
      } catch (error) {
        console.error('Error updating saved articles:', error);
      }
    };

    if (!article) return <div>Loading...</div>;

    return (
      <div className="article-page">
        <div className="article-content">
          <h1>{article.title}</h1>
          <img src={article.imgUrl} alt={article.title} className="article-image" />
          <div className='button-container'>
            <button
              className={`like-button ${hasLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {hasLiked ? 'Liked' : 'Like'} ({likes})
            </button>

            <button
              className={`dislike-button ${hasDisliked ? 'disliked' : ''}`}
              onClick={handleDislike}
            >
              {hasDisliked ? 'disliked' : 'dislike'} ({dislikes})
            </button>

            <button
              className="save-button"
              onClick={toggleSave}
            >
              {hasSaved ? 'Unsave' : 'Save'}
            </button>
            <button onClick={() => setIsReportModalOpen(true)}>Report Article</button>
            <ReportArticleModal 
              isReportModalOpen={isReportModalOpen}
              setIsReportModalOpen={setIsReportModalOpen}
              handleReport={handleReport}
            />
          </div>

          <div
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          

          <div className="comments-section">
            <h2>Comments</h2>
            {comments.map((comment) => (
              <div key={comment.id} className="comment">
                <p>
                  <strong>
                    {comment.isPrivate ? 'Anonymous' : <Link to={`/profile/${comment.userId}`}>{comment.userName}</Link>}
                    {isAdmin && comment.isPrivate && (
                      <span>
                        {' ('}
                        <Link to={`/profile/${comment.userId}`}>{comment.userName}</Link>
                        {')'}
                      </span>
                    )}
                  </strong>
                  
                  ({new Date(comment.createdAt.toDate()).toLocaleString()}): {comment.text}
                  {isAdmin && (
                  <button className='delete-comment' onClick={() => handleDeleteComment(comment.id)}>Delete</button>
                )}
                </p>
              </div>
            ))}
            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment"
                rows={4}
                cols={50}
                required
              />
              <div className='form-buttons'>
              <button type="submit">Submit</button>
              <button type="button" onClick={handleCancelComment}>Cancel</button>
              </div>
            </form>
          </div>

        </div>
        <div className="related-articles">
          <h2>Related Articles</h2>
          {relatedArticles.map((relatedArticle, index) => (
            <div key={index} className="related-article-item">
              <Link to={`/article/${relatedArticle.id}`}>
                <h3>{relatedArticle.title}</h3>
                <img src={relatedArticle.imgUrl} alt={relatedArticle.title} className="related-article-image" />
              </Link>
            </div>
          ))}
        </div>

        <ReportArticleModal 
  isReportModalOpen={isReportModalOpen}
  setIsReportModalOpen={setIsReportModalOpen}
  handleReport={handleReport}
/>

      </div>
    );
  };

  export default ArticlePage;
