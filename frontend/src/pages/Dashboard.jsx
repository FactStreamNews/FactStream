import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { auth, db, logout } from "../firebase";
import { updateEmail, updatePassword } from "firebase/auth";
import { query, collection, getDocs, where, updateDoc } from "firebase/firestore";
import { doc } from "firebase/firestore";

function Dashboard() {
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const [isInputVisible, setInputVisible] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [updating, setUpdating] = useState(false); // State to manage updating status
  const [newPassword, setNewPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");


  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      setName(data.name);
    } catch (err) {
      console.error(err);
      alert("An error occured while fetching user data");
    }
  };
  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");
    fetchUserName();
  }, [user, loading]);

  const handleEditClick = () => {
    setInputVisible(!isInputVisible);
  };

  const handleUpdateEmail = async () => {
    if (!email) {
      alert("Email cannot be empty");
      return;
    }
    try {
      setUpdating(true);
      await updateEmail(auth.currentUser, email);
      alert("Email updated successfully");
      setInputVisible(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      alert("New password cannot be empty");
      return;
    }
    try {
      setUpdating(true);
      await updatePassword(auth.currentUser, newPassword);
      alert("Password updated successfully");
      setNewPassword("");
    } //catch (err) {
    //console.error(err);
    // alert("An error occurred while updating the password");
    finally {
      setUpdating(false);
    }
  };

  const handleNameEdit = () => {
    setEditingName(!editingName);
    if (!editingName) {
      setNewName(name); // Set the input field value to current name
    }
  };

  const handleNameUpdate = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc1 = await getDocs(q);
      const docId = doc1.docs[0].id;
      const userDocRef = doc(db, "users", docId);
      await updateDoc(userDocRef, {
        name: newName
      });
      setName(newName);
      setEditingName(false);
      alert("Name updated successfully");
    } catch (err) {
      console.error(err);
      alert(`An error occurred while updating the name: ${err.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      try {
        const q = query(collection(db, "users"), where("uid", "==", user?.uid));
        const doc1 = await getDocs(q);
        const docId = doc1.docs[0].id;
        const userDocRef = doc(db, "users", docId);
        await deleteDoc(userDocRef); // Delete user data from Firestore
        await deleteUser(auth.currentUser); // Delete user from Firebase Authentication
        alert("Account deleted successfully");
        navigate("/home");
      } catch (err) {
        console.error(err);
        alert(`An error occurred while deleting the account: ${err.message}`);
      }
    }
  };


  return (
    <div>
      <h1>Welcome {name}</h1>
      <div>
        <label>Email: {user?.email}</label>
        {editingName ? (
          <div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
            />
            <button onClick={handleNameUpdate}>Save</button>
          </div>
        ) : (
          <button onClick={handleNameEdit}>Edit Name</button>
        )}
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <button onClick={handleUpdatePassword} disabled={updating}>
            {updating ? "Updating..." : "Update Password"}
          </button>
        </div>
        <div>
          <button className="dashboard__btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
        <button className="dashboard__btn" onClick={handleDeleteUser}>
          Delete Account
        </button>
    </div>
  );
}

export default Dashboard;
