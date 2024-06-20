import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';

const Navbar = () => (
  <AppBar position="static" style={{ backgroundColor: '#ff4f00' }}>
    <Toolbar style={{ display: 'flex', justifyContent: 'space-between' }}>
    <Typography variant="h6" component="div">
        <Button component={Link} to="/" color="inherit">FactStream</Button>
      {/*<Typography variant="h6" component="div">
        FactStream
</Typography>*/}
      </Typography>
      <Button component={Link} to="/signin" color="inherit">Sign In</Button>
    </Toolbar>
  </AppBar>
);

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