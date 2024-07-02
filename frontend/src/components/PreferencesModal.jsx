import React, { useState } from 'react';
import Modal from 'react-modal';
import './PreferencesModal.css'; // Ensure this file exists for custom styles

const categories = ["Tech", "Politics", "Science", "Health", "Sports", "Travel"]; // Your preset categories

Modal.setAppElement('#root'); // Set this to the root element of your React app

const PreferencesModal = ({ isOpen, onClose, onSave }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(item => item !== category)
        : [...prev, category]
    );
  };

  const handleSave = () => {
    onSave(selectedCategories);
    onClose();
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
