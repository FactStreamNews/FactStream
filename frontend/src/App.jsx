// src/App.js
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import SignIn from './pages/SignIn';
import PageLayout from './contexts/PageLayout';
import NewsPage from './pages/NewsPage';
import {AuthProvider} from './contexts/AuthProvider';

const App = () => {
  //const [routes, setRoutes] = useState([]);
  const routes = [
    { path: '/', component: NewsPage },
    { path: '/signin', component: SignIn },
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
};

export default App;