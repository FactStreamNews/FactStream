import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import './PreferencesModal.css'; // Ensure this file exists for custom styles
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { doc, updateDoc, getDocs, query, collection, where, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const categories = ["Tech", "Politics", "Science", "Health", "Sports", "Travel"]; // Your preset categories


Modal.setAppElement('#root'); // Set this to the root element of your React app

const PreferencesModal = ({ isOpen, onClose, onSave }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [user, loading, error] = useAuthState(auth);

  useEffect(() => {
    const fetchUserPreferences = async () => {
      try {
        if (user) {
          const q = query(collection(db, "users"), where("uid", "==", user.uid));
          const doc = await getDocs(q);
          const data = doc.docs[0].data();
          const newpreferences = [];
          if(data.sciencePreference == true){
            newpreferences.push("Science");
          } 
          if (data.politicsPreference == true){
            newpreferences.push("Politics");
          }
          if (data.healthPreference == true){
            newpreferences.push("Health");
          }
          if (data.techPreference == true) {
            newpreferences.push("Tech");
          }
          if (data.sportsPreference == true) {
            newpreferences.push("Sports");
          }
          if (data.travelPreference == true) {
            newpreferences.push("Travel");
          }
          setSelectedCategories(newpreferences);
        }
      } catch (error) {
        console.error("Error fetching user preferences:", error);
      }
    };

    if (isOpen) {
      fetchUserPreferences();
    }
  }, [isOpen, user]);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(item => item !== category)
        : [...prev, category]
    );
  };

  const handleSave = async() => {
    try {
      onSave(selectedCategories);
      const q = query(collection(db, "users"), where("uid", "==", user?.uid));
      const doc1 = await getDocs(q);
      const docId = doc1.docs[0].id;
      const userDocRef = doc(db, "users", docId);

      //Check which topics array includes
      if (selectedCategories.includes("Tech")){
        await updateDoc(userDocRef, {
          techPreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          techPreference: false,
        });
      }
      if (selectedCategories.includes("Politics")){
        await updateDoc(userDocRef, {
          politicsPreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          politicsPreference: false,
        });
      }
      if (selectedCategories.includes("Science")){
        await updateDoc(userDocRef, {
          sciencePreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          sciencePreference: false,
        });
      }
      if (selectedCategories.includes("Health")){
        await updateDoc(userDocRef, {
          healthPreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          healthPreference: false,
        });
      }
      if (selectedCategories.includes("Sports")){
        await updateDoc(userDocRef, {
          sportsPreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          sportsPreference: false,
        });
      }
      if (selectedCategories.includes("Travel")){
        await updateDoc(userDocRef, {
          travelPreference: true,
        });
      } else {
        await updateDoc(userDocRef, {
          travelPreference: false,
        });
      }
     
      onClose();
  } catch (error){
    console.log(error);
  }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Set Preferences"
      className="modal"
      overlayClassName="overlay"
    >
      <h2>Set Preferences</h2>
      <div className="categories">
        {categories.map(category => (
          <label key={category}>
            <input
              type="checkbox"
              value={category}
              checked={selectedCategories.includes(category)}
              onChange={() => handleCategoryChange(category)}
            />
            {category}
          </label>
        ))}
      </div>
      <button onClick={handleSave}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </Modal>
  );
};

export default PreferencesModal;
