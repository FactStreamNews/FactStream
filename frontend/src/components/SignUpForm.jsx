// /components/SignUpForm.jsx
import React, { useState, useContext } from "react";
import { auth } from "../firebase";
import { AuthContext } from "../contexts/AuthProvider";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Typography } from "@mui/material";

const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await auth.createUserWithEmailAndPassword(email, password);
      // Once the user is signed up, you can send additional data to Firebase if needed
      // For example, if you want to store the user's display name, you can do:
      await auth.currentUser.updateProfile({
        displayName: "User Display Name"
      });
      // Navigate to the home page after successful sign up
      navigate("/");
    } catch (error) {
      console.error("Error signing up", error);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <Typography variant="h5">Sign Up</Typography>
      <TextField
        type="email"
        label="Email"
        variant="outlined"
        value={email}
        onChange={e => setEmail (e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        type="password"
        label="Password"
        variant="outlined"
        value={password}
        onChange={e => setPassword (e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Sign Up
      </Button>
    </form>
  );
};

export default SignUpForm;