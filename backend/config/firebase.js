// firebase.js
import admin from 'firebase-admin';
import serviceAccount from './factstream-7f50e-firebase-adminsdk-fgu50-87fb042c27.json' assert { type: 'json' };



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://factstream-7f50e-default-rtdb.firebaseio.com"
});


const db = admin.firestore();

export { admin, db };
