import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { Route, Routes, useLocation } from 'react-router-dom';
import ChatBox from './components/ChatBox';
import Credits from './pages/Credits';
import Community from './pages/Community';
import { assets } from './assets/assets';
import './assets/prism.css';
import Loading from './pages/Loading';
import { useAppContext } from './context/AppContext';
import Login from './pages/Login';

const App = () => {
  const { user } = useAppContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 500); // Increased delay to ensure context is loaded
    
    return () => clearTimeout(timer);
  }, []);

  if (pathname === '/loading') return <Loading />;

  // Show loading until app is definitely ready
  if (!appReady) {
    return (
      <div className="bg-gradient-to-b from-[#242124] to-[#000000] flex items-center justify-center h-screen w-screen">
        <Loading />
      </div>
    );
  }

  return (
    <>
      {/* Menu Icon for small screens */}
      {!isMenuOpen && user && (
        <img
          src={assets.menu_icon}
          className="absolute top-3 left-3 w-8 h-8 cursor-pointer z-50 md:hidden not-dark:invert"
          onClick={() => setIsMenuOpen(true)}
          alt="Menu"
        />
      )}

      {user ? (
        <div className="dark:bg-gradient-to-b from-[#242124] to-[#000000] dark:text-white w-screen h-screen">
          <div className="flex h-full w-full">
            <Sidebar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
            <Routes>
              <Route path="/" element={<ChatBox />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/community" element={<Community />} />
              <Route path="*" element={<ChatBox />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Login />
      )}
    </>
  );
};

export default App;