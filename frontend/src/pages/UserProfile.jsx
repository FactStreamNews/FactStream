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
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState(""); // New state for profile picture URL
  const navigate = useNavigate();
  const [isInputVisible, setInputVisible] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [updating, setUpdating] = useState(false); // State to manage updating status
  const [newPassword, setNewPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State to manage modal visibility
  const [isPublic, setIsPublic] = useState(true); // State to manage profile visibility
  const [preferences, setPreferences] = useState([]);

  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      const newPreferences = [];
      if(data.sciencePreference == true){
        newPreferences.push("Science");
      } 
      if (data.politicsPreference == true){
        newPreferences.push("Politics");
      }
      if (data.healthPreference == true){
        newPreferences.push("Health");
      }
      if (data.techPreference == true) {
        newPreferences.push("Tech");
      }
      if (data.sportsPreference == true) {
        newPreferences.push("Sports");
      }
      if (data.travelPreference == true) {
        newPreferences.push("Travel");
      }
      setName(data.name);
      setProfilePicture(data.profilePictureUrl); // Set profile picture URL
      setPreferences(newPreferences);
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

  const togglePrivacy = async () => {
    const newIsPublic = !isPublic;
    console.log(newIsPublic);
    setIsPublic(newIsPublic);
    localStorage.setItem("isPublic", JSON.stringify(newIsPublic));
    try {
    const q = query(collection(db, "users"), where("uid", "==", user?.uid));
    const doc1 = await getDocs(q);
    const data = doc1.docs[0].id;
    const userDocRef = doc(db, "users", data);
    await updateDoc(userDocRef, {
      is_private: !newIsPublic
    });
    alert(`Profile is now ${newIsPublic ? "public" : "private"}`);
  } catch (err){
    console.error(err);
    alert(`An error occurred while updating privacy settings: ${err.message}`);
  }
    
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    // Handle file upload (e.g., to Firebase Storage)
    // Update profile picture URL in the database
  };

  const handleSaveProfile = () => {
    // Save any other profile changes (e.g., name, bio) if needed
    alert("Profile changes saved successfully!");
  };
  
  return (
    <div>
      <h1>Welcome {name}</h1>
      {/* Other UI elements */}
      <div>
        <label>Email: {user?.email}</label>
        
      </div>
      <div>
        <h2>Profile Settings</h2>
        <p>Your profile is {isPublic ? 'public' : 'private'}.</p>
      </div>
      <PreferencesModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePreferences}
      />
      <div>
        <h2>Your Preferences</h2>
        {preferences.length > 0 ? (
          <ul>
            {preferences.map((preference, index) => (
              <li key={index}>{preference}</li>
            ))}
          </ul>
        ) : (
          <p>You have not set any preferences yet.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
