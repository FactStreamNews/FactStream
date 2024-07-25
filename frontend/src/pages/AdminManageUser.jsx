import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, deleteDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from '../firebase';
import './AdminManageUser.css';

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, authLoading, authError] = useAuthState(auth);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (user) {
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          setIsAdmin(userDoc.data().is_admin || false);
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
        const docId = doc1.docs[0].id;
        const userDocRef = doc(db, "users", docId);
        await deleteDoc(userDocRef);
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
        alert("Account deleted successfully");
        navigate("/admin");
      } catch (err) {
        console.log(err);
        alert(`An error occurred while deleting the account: ${err.message}`);
      }
    }
  };

  const handleMakeAdmin = async (user) => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userDocRef = doc(db, "users", userDoc.id);
        await updateDoc(userDocRef, { is_admin: true });
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.uid === user.uid ? { ...u, is_admin: true } : u
          )
        );
        alert("User updated to admin successfully");
      }
    } catch (err) {
      console.error(err);
      alert(`An error occurred while updating the user's admin status: ${err.message}`);
    }
  };

  const handleBan = async (user) => {
    if (window.confirm("Are you sure you want to ban this account? This action cannot be undone.")) {
      try {
        // Add user email to banned_users collection
        await setDoc(doc(db, "banned_users", user.email), { email: user.email });
        
        // Delete user from users collection
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const doc1 = await getDocs(q);
        const docId = doc1.docs[0].id;
        const userDocRef = doc(db, "users", docId);
        await deleteDoc(userDocRef);
        
        // Update local state
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
        setBannedUsers(prevBanned => [...prevBanned, user.email]);
        alert("Account banned successfully");
        navigate("/admin");
      } catch (err) {
        console.log(err);
        alert(`An error occurred while banning the account: ${err.message}`);
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

      const fetchBannedUsers = async () => {
        try {
          const bannedCollection = collection(db, 'banned_users');
          const bannedSnapshot = await getDocs(bannedCollection);
          const bannedList = bannedSnapshot.docs.map(doc => doc.data().email);
          setBannedUsers(bannedList);
        } catch (error) {
          console.error('Error fetching banned users:', error);
        }
      };

      fetchUsers();
      fetchBannedUsers();
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
                <button className="make-admin-button" onClick={() => handleMakeAdmin(user)}>Make Admin</button>
                <button className="ban-button" onClick={() => handleBan(user)}>Ban</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2>Banned Users</h2>
      <ul>
        {bannedUsers.map(email => (
          <li key={email}>{email}</li>
        ))}
      </ul>
      <button onClick={() => navigate('/admin')}>Back</button>
    </div>
  );
};

export default AdminUserList;
