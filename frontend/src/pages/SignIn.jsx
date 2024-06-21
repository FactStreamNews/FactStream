// SignIn.jsx
import React, { useState } from "react";
import { Box, Button, Paper } from "@mui/material";
import LoginForm from "../components/Login";
import SignUpForm from "../components/SignUpForm";

const SignIn = () => {
  const [showLoginForm, setShowLoginForm] = useState(true);

  const handleToggleForm = () => {
    setShowLoginForm(!showLoginForm);
  };
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Paper elevation={3} sx={{ p: 4 }}>
        {showLoginForm ? <LoginForm /> : <SignUpForm />}
        <Box mt={2}>
          <Button onClick={handleToggleForm}>
            {showLoginForm
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignIn;