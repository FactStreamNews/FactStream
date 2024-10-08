import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyAaXbIDcextJiHFBrwxra68foqRcsI8Wlc",
  authDomain: "factstream-7f50e.firebaseapp.com",
  databaseURL: "https://factstream-7f50e-default-rtdb.firebaseio.com",
  projectId: "factstream-7f50e",
  storageBucket: "factstream-7f50e.appspot.com",
  messagingSenderId: "1074379946644",
  appId: "1:1074379946644:web:354ab09081b00b9e3c5281",
  measurementId: "G-2LE8QC12RD"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const docs = await getDocs(q);
    if (docs.docs.length === 0) {
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
      });
    }
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const logInWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const registerWithEmailAndPassword = async (name, email, password) => {
  const q = query(collection(db, "users"), where("email", "==", email));
  const banquery = query(collection(db, "banned_users"), where ("email", "==", email));
  const banQuerySnapshot = await(getDocs(banquery));
  const querySnapshot = await getDocs(q);
    if (!(banQuerySnapshot.empty)){
      alert("All accounts attached to that email have been banned!")
    } else if (!querySnapshot.empty) {
      alert("An account with that email already exists!")
    }
    else
  {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const user = res.user;
      var is_admin = false;
      if (email == "root@root.net") is_admin = true;
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        name,
        authProvider: "local",
        email,
        is_admin,
        savedArticles: [],
        techPreference: false,
        politicsPreference: false,
        sciencePreference: false,
        healthPreference: false,
        sportsPreference: false,
        travelPreference: false, 
        is_private: false,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
}
  
};
const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset link sent!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
const logout = () => {
  signOut(auth);
};
export {
  auth,
  db,
  signInWithGoogle,
  logInWithEmailAndPassword,
  registerWithEmailAndPassword,
  sendPasswordReset,
  logout,
};