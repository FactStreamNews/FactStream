// firebase.js
import admin from 'firebase-admin';

var admin = require("firebase-admin");

var serviceAccount = require("backend/config/factstream-7f50e-firebase-adminsdk-fgu50-a20695255c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://factstream-7f50e-default-rtdb.firebaseio.com"
});


const db = admin.firestore();

export { admin, db };
