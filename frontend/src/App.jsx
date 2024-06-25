// src/App.js
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from "./components/Login";
import Register from "./components/Register";
import Reset from "./components/Reset";
import SignIn from './pages/SignIn';
import PageLayout from './contexts/PageLayout';
import NewsPage from './pages/NewsPage';
import {AuthProvider} from './contexts/AuthProvider';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

const App = () => {
  //const [routes, setRoutes] = useState([]);
  const routes = [
    { path: '/', component: NewsPage },
    { path: '/signin', component: SignIn },
    {path: '/home', component: Home}, 
    {path: '/dashboard', component: Dashboard},
    {path: '/register', component: Register}
];
 
return (
<Router>
        <AuthProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <PageLayout>
              <Routes>
                  {routes.map((route, index) => (
                      <Route
                          key={index}
                          path={route.path}
                          element={<route.component />}
                      />
                  ))}
              </Routes>
              </PageLayout>
          </Suspense>
          </AuthProvider>
      </Router>
);
}
export default App;