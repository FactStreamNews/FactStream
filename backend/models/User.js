import { db } from '../config/firebase.js';


const userCollection = db.collection('users');



// add user
export const newUser = async (user) => {
    const res = await userCollection.add(user);
    return res.id;
  };


  // get user
export const getUserById = async (userId) => {
    return await userCollection.doc(userId).get().data() || null;

}

// get all users
export const getAllUsers = async () => {
    const snapshot = await userCollection.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};


// delete user
export const deleteUserById = async (userId) => {
    await userCollection.doc(userId).delete(); 
};


// edit user details (patch)
export const updateUserById = async (userId, name, password, bio) => { // add all the fields
    await userCollection.doc(userId).update(name);
    // add more for other fields
};