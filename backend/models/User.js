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