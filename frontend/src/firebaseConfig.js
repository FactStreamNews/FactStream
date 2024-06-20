// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; // Import getAuth from firebase/auth
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAaXbIDcextJiHFBrwxra68foqRcsI8Wlc",
  authDomain: "factstream-7f50e.firebaseapp.com",
  projectId: "factstream-7f50e",
  storageBucket: "factstream-7f50e.appspot.com",
  messagingSenderId: "1074379946644",
  appId: "1:1074379946644:web:354ab09081b00b9e3c5281",
  measurementId: "G-2LE8QC12RD",
  databaseURL: "https://factstream-7f50e-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp (firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export {app, auth, db}