import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { getUserById, deleteUserById } from '../services/userService';


// contains multiple components
const Profile = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState(null);
    const [bio, setBio] = useState(null);
    useEffect(() => {
        // Fetch user data from API call
        const fetchUserData = async () => {
            // Ask how to read in data from Firebase

            const response = await fetch()
            // setUser()
            // setName
            // setBio
        }
        fetchUserData();

    }, [])
    
    if(!user) {
        return <div>Error Loading User</div>;
    }
    

    return 
};
// display profile information

// edit profile information

// delete profile 


export default Profile;