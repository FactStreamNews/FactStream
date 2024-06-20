//firebase.js

import {initializeApp} from 'firebase/app';
import {getDatabase} from 'firebase/database';
import {getAuth} from 'firebase/auth';

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

const firebase = initializeApp (firebaseConfig);
const auth = getAuth(firebase);
const db = getDatabase(firebase);

export {firebase, auth, db};