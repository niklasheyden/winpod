import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Profile from './pages/Profile';
import PodcastPage from './pages/PodcastPage';
import Auth from './pages/Auth';
import Explore from './pages/Explore';
import Embed from './pages/Embed';
import Toast from './components/Toast';
import { useAuthInit } from './hooks/useAuth';

const queryClient = new QueryClient();

// Wrapper component to conditionally render layout elements
const AppLayout = () => {
  const location = useLocation();
  const isEmbedRoute = location.pathname === '/embed';
  
  useAuthInit();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isEmbedRoute && <Navbar />}
      <main className={`container mx-auto px-4 py-8 flex-grow ${isEmbedRoute ? 'p-0' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/podcast/:id" element={<PodcastPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/embed" element={<Embed />} />
        </Routes>
      </main>
      {!isEmbedRoute && <Footer />}
      <Toast />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppLayout />
      </Router>
    </QueryClientProvider>
  );
}

export default App;