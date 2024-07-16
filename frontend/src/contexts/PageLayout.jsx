import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from '../firebase'; 
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';



const Navbar = () => {
  const [user, loading, error] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [techPref, setTechPref] = useState(false);
  const [healthPref, setHealthPref] = useState(false);
  const [sportsPref, setSportsPref] = useState(false);
  const [travelPref, setTravelPref] = useState(false);
  const [politicsPref, setPoliticsPref] = useState(false);
  const [sciencePref, setSciencePref] = useState(false);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (user) {
        console.log(`Fetching admin status for user: ${user.uid}`);
        
        // Query to find the document with the uid field
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const doc1 = await getDocs(q);
        const data = doc1.docs[0].data();
        const docID = doc1.docs[0].id;
        const docRef = doc(db, "users", docID);

        //Check the user pref values
        setTechPref(data.techPreference || false);
        setHealthPref(data.healthPreference || false);
        setSportsPref(data.sportsPreference || false);
        setTravelPref(data.travelPreference || false);
        setPoliticsPref(data.politicsPreference || false);
        setSciencePref(data.sciencePreference || false);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          console.log(`User data: ${JSON.stringify(userDoc.data())}`);
          setIsAdmin(userDoc.data().is_admin || false);
        } else {
          console.log('No such document!');
        }
      }
    };

    fetchAdminStatus();
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <AppBar position="static" style={{ backgroundColor: '#ff4f00' }}>
      <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div">
          <Button component={Link} to="/" color="inherit">FactStream</Button>
        </Typography>
        <div>
         {user && techPref && (
          <Button component={Link} to="/tech" color="inherit">Tech</Button>
         )}
         {user && healthPref && (
          <Button component={Link} to="/health" color="inherit">Health</Button>
         )}
         {user && politicsPref && (
          <Button component={Link} to="/politics" color="inherit">Politics</Button>
         )}
         {user && sportsPref && (
          <Button component={Link} to="/sports" color="inherit">Sports</Button>
         )}
         {user && sciencePref && (
          <Button component={Link} to="/science" color="inherit">Science</Button>
         )}
         {user && travelPref && (
          <Button component={Link} to="/travel" color="inherit">Travel</Button>
         )}
         </div>
        <div>
        {user && (
            <Button component={Link} to="/admin" color="inherit"> {isAdmin && "ADMIN"}</Button>
          
          )}
          {user && (
            <Button component={Link} to="/savedArticles" color="inherit">Saved Articles</Button>
          
          )}
        {user ? (
          <Button component={Link} to="/dashboard" color="inherit">Profile</Button>
        ) : (
          <Button component={Link} to="/signin" color="inherit">Sign In</Button>
        )}
        </div>
      </Toolbar>
    </AppBar>
  );
};
const Footer = () => (
  <Grid item xs={12} sx={{ py: 3, mt: 'auto', backgroundColor: '#f8f8f8' }}>
    <Container maxWidth="sm">
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} FactStream
      </Typography>
    </Container>
  </Grid>
);

const PageLayout = ({ children }) => (
  <Grid container direction="column" minHeight="100vh">
    <Grid item xs={12}>
      <Navbar />
    </Grid>
    <Grid item xs={12} py={4}>
      <Container component="main">
        {children}
      </Container>
    </Grid>
    <Footer />
  </Grid>
);

export default PageLayout;