import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Delete from '../components/Delete';

// to be added to profile page
const DeletePopup = ({ email }) => {
    const [showPopup, setShowPopup] = useState(true);
    const history = useHistory();

    const handleDelete = async () => {
        const isDeleted = await Delete(email);
        if (isDeleted) {
            alert('User deleted successfully.');
            history.push('/home');
        } else {
            alert('No user found with that email.');
            setShowPopup(false);
        }
    };

    const handleCancel = () => {
        setShowPopup(false);
    };

    return (
        showPopup && (
            <div className="popup">
                <div className="popup-inner">
                    <h2>Confirm Deletion</h2>
                    <p>Are you sure you want to delete the user with email {email}?</p>
                    <button onClick={handleDelete}>Yes, Delete</button>
                    <button onClick={handleCancel}>Cancel</button>
                </div>
            </div>
        )
    );
};

export default DeletePopup;

