import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '../firebase';
import './AdminManageUser.css';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, authLoading, authError] = useAuthState(auth);
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

  const handleDelete = async (user) => {
    if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const doc1 = await getDocs(q);
      console.log(doc1);
      const docId = doc1.docs[0].id;
      const userDocRef = doc(db, "users", docId);
      await deleteDoc(userDocRef); 
   //   await deleteUser(auth.user); // Delete user from Firebase Authentication
      setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
      alert("Account deleted successfully");
      navigate("/admin");
    } catch (err) {
      console.log(err)
      //onsole.error(err);
      alert(`An error occurred while deleting the account: ${err.message}`);
    }
  }
  };

  useEffect(() => {
    if (loading || authLoading) return;

    if (!user || !isAdmin) {
      navigate('/'); // send to home page if non-admin trying to access
    } else {
      const fetchUsers = async () => {
        try {
          const usersCollection = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollection);
          const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUsers(usersList);
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      };

      fetchUsers();
    }
  }, [user, isAdmin, loading, authLoading, navigate]);

  if (loading || authLoading) {
    return <div>Loading...</div>;
  }

  if (authError) {
    return <div>Error: {authError.message}</div>;
  }

  return (
    <div className="admin-user-list">
      <h1>Admin User List</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Is Anonymous?</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.is_admin ? 'ADMIN' : ''}</td>
              <td>{user.is_private ? 'Yes' : 'No'}</td>
              <td>
                <button className="delete-button" onClick={() => handleDelete(user)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button action=''>Back</button>
    </div>
  );
};

export default AdminUserList;
