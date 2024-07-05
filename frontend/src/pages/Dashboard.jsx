import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { auth, db, logout } from "../firebase";
import { updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { query, collection, getDocs, where, updateDoc } from "firebase/firestore";
import { doc, deleteDoc } from "firebase/firestore";
import PreferencesModal from "../components/PreferencesModal";

function Dashboard() {
  const [user, loading, error] = useAuthState(auth);
  
  const navigate = useNavigate();
  const [isInputVisible, setInputVisible] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [updating, setUpdating] = useState(false); // State to manage updating status
  const [newPassword, setNewPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
  const [isPublic, setIsPublic] = useState(true); // State to manage profile visibility
  const [name, setName] = useState("");
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
    const savedIsPublic = localStorage.getItem("isPublic");
    if (savedIsPublic !== null) {
      setIsPublic(JSON.parse(savedIsPublic));
    }
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
    } finally {
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
        navigate("/");
      } catch (err) {
        console.error(err);
        alert(`An error occurred while deleting the account: ${err.message}`);
      }
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    window.location.reload();
  };

  const handleSavePreferences = (selectedCategories) => {
    console.log('Selected categories:', selectedCategories);
    //window.location.reload();
    // Save the selected categories to the user's profile in firebase
  };

  const togglePrivacy = () => {
    const newIsPublic = !isPublic;
    setIsPublic(newIsPublic);
    localStorage.setItem("isPublic", JSON.stringify(newIsPublic));
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
            <button className="dashboard__btn2" onClick={handleNameUpdate}>Save</button>
          </div>
        ) : (
          <button className="dashboard__btn2" onClick={handleNameEdit}>Edit Name</button>
        )}
        <div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <button className="dashboard__btn2" onClick={handleUpdatePassword} disabled={updating}>
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
      <div>
        <button className="dashboard__btn" onClick={handleOpenModal}>
          Set Preferences
        </button>
        <h2>Profile Settings</h2>
        <p>Your profile is {isPublic ? 'public' : 'private'}.</p>
        <button onClick={togglePrivacy}>
          {isPublic ? 'Make Private' : 'Make Public'}
        </button>
      </div>
      <PreferencesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePreferences}
      />
    </div>
  );
}

export default Dashboard;
