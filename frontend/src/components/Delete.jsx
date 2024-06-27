import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from '../config/firebase.js';


// to be added to profile
// takes in an email address and deletes the user with the corresponding email address
async function deleteUser(email) {
    
    // Access the users collection
    const userCollection = db.collection('users');

    // Query through the collection and search for matching email
    const q = query(userCollection, where("email", "==", email));

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Check if the document exists
    if (!querySnapshot.empty) {
        // Loop through the documents in the snapshot
        querySnapshot.forEach((docSnapshot) => {
            // Get the document reference
            const userDocRef = doc(db, "users", docSnapshot.id);

            // Delete the document
            deleteDoc(userDocRef)
                .then(() => {
                    console.log(`User deleted successfully.`);
                })
                .catch((error) => {
                    console.error("Error deleting user: ", error);
                });
        });
    } else {
        console.log(`No user found with email ${email}.`);
    }

}

export default Delete;











