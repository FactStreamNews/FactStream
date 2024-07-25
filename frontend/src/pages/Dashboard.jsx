import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { auth, db, logout } from "../firebase";
import { updateEmail, updatePassword, deleteUser } from "firebase/auth";
import { query, collection, getDocs, where, updateDoc, addDoc } from "firebase/firestore";
import { doc, deleteDoc } from "firebase/firestore";
import PreferencesModal from "../components/PreferencesModal";

function Dashboard() {
  const [user, loading, error] = useAuthState(auth);
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const navigate = useNavigate();
  const [isInputVisible, setInputVisible] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [updating, setUpdating] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [preferences, setPreferences] = useState([]);
  const [activity, setActivity] = useState([]);
  const [feedback, setFeedback] = useState(""); // State for feedback

  const fetchUserName = async () => {
    try {
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc = await getDocs(q);
      const data = doc.docs[0].data();
      const newPreferences = [];
      if (data.sciencePreference === true) {
        newPreferences.push("Science");
      }
      if (data.politicsPreference === true) {
        newPreferences.push("Politics");
      }
      if (data.healthPreference === true) {
        newPreferences.push("Health");
      }
      if (data.techPreference === true) {
        newPreferences.push("Tech");
      }
      if (data.sportsPreference === true) {
        newPreferences.push("Sports");
      }
      if (data.travelPreference === true) {
        newPreferences.push("Travel");
      }
      setName(data.name);
      setProfilePicture(data.profilePictureUrl);
      setPreferences(newPreferences);
      const priv = data.is_private;
      console.log(priv);
      setIsPublic(!priv);
    } catch (err) {
      console.error(err);
      alert("An error occurred while fetching user data");
    }
  };

  const fetchUserActivity = async () => {
    try {
      const q = query(collection(db, "activity"), where("userId", "==", user?.uid));
      const activitySnapshot = await getDocs(q);
      const activityList = activitySnapshot.docs.map(doc => doc.data());
      setActivity(activityList);
    } catch (err) {
      console.error(err);
      alert("An error occurred while fetching user activity");
    }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) return navigate("/");
    fetchUserName();
    fetchUserActivity();
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
      setNewName(name);
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
        await deleteDoc(userDocRef);
        await deleteUser(auth.currentUser);
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
    } catch (err) {
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

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback) {
      alert("Feedback cannot be empty");
      return;
    }
    try {
      await addDoc(collection(db, "feedback"), {
        userId: user?.uid,
        feedback: feedback,
        timestamp: new Date()
      });
      alert("Feedback submitted successfully");
      setFeedback(""); // Clear feedback input after submission
    } catch (err) {
      console.error(err);
      alert(`An error occurred while submitting feedback: ${err.message}`);
    }
  };

  return (
    <div>
      <h1>Welcome {name}</h1>
      <p>Please upload a profile picture before the Choose File button.</p>
      {profilePicture && <img src={profilePicture} alt="Profile" />}
      <input type="file" onChange={handleProfilePictureUpload} />
      <button className="dashboard__btn-small" onClick={handleSaveProfile}>Save</button>
      {/* Other UI elements */}
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
      </div>
      <div>
        <h2>Profile Settings</h2>
        <p>Your profile is {isPublic ? 'public' : 'private'}.</p>
        <button className="dashboard__btn-small" onClick={togglePrivacy}>
          {isPublic ? 'Make Private' : 'Make Public'}
        </button>
        <Link to="/myreports" className="dashboard__btn-small report-btn">My Reports</Link>
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
        <button className="dashboard__btn" onClick={handleOpenModal}>
          Set Preferences
        </button>
      </div>
      <div>
        <h2>Past User Activity</h2>
        {activity.length > 0 ? (
          <ul>
            {activity.map((act, index) => (
              <li key={index}>{act.description}</li>
            ))}
          </ul>
        ) : (
          <p>No past activity found.</p>
        )}
      </div>
      <div>
        <h2>Submit Feedback</h2>
        <textarea
          value={feedback}
          onChange={handleFeedbackChange}
          placeholder="Enter your feedback here"
          rows="4"
          cols="50"
        />
        <button className="dashboard__btn" onClick={handleSubmitFeedback}>
          Submit Feedback
        </button>
      </div>
      <div>
        <button className="dashboard__btn" onClick={logout}>
          Logout
        </button>
        <button className="dashboard__btn" onClick={handleDeleteUser}>
          Delete Account
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
