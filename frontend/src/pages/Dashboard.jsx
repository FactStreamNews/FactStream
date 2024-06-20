// Dashboard.jsx
import React, { useContext } from "react";
import { Box, Typography } from "@mui/material";
import { AuthContext } from "../contexts/AuthProvider";

const Dashboard = () => {
  const { currentUser } = useContext(AuthContext);
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
    >
      <Typography variant="h3" mb={3}>
        Welcome to the Dashboard!
  /* // PROBLEM HERE */
  </Typography>
      <Typography variant="h5" mb={2}>
        {currentUser ? `Logged in as ${currentUser.email}` : ""}
      </Typography>
    </Box>
  );
};

export default Dashboard;