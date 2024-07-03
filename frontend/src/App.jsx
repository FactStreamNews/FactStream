// src/App.js
import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from "./components/Login";
import Register from "./components/Register";
import Reset from "./components/Reset";
import PageLayout from './contexts/PageLayout';
import NewsPage from './pages/NewsPage';
import ArticlePage from './pages/ArticlePage';
import TechPage from './pages/TechPage';
import PoliticsPage from './pages/PoliticsPage';
import SportsPage from './pages/SportsPage';
import SciencePage from './pages/SciencePage';
import HealthPage from './pages/HealthPage';
import TravelPage from './pages/TravelPage';
import AdminUserList from './pages/AdminUserList';

import {AuthProvider} from './contexts/AuthProvider';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import SavedArticles from './pages/SavedArticles';

const App = () => {
  //const [routes, setRoutes] = useState([]);
  const routes = [
    { path: '/', component: NewsPage },
    {path: '/article/:id', component: ArticlePage},
    { path: '/signin', component: Login },
    {path: '/home', component: Home}, 
    {path: '/dashboard', component: Dashboard},
    {path: '/register', component: Register},
    {path: '/savedArticles', component: SavedArticles}, 
    {path: '/reset', component: Reset}, 
    {path: '/tech', component: TechPage},
    {path: '/politics', component: PoliticsPage},
    {path: '/sports', component: SportsPage},
    {path: '/science', component: SciencePage},
    {path: '/health', component: HealthPage}, 
    {path: '/travel', component: TravelPage},
    {path: 'admin', component: AdminUserList}
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