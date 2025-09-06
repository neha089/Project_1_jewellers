import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNotificationClick = () => {
    navigate('/balance-expense');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile}
      />
      
      <div className={`transition-all duration-300 ${!isMobile ? 'ml-64' : ''}`}>
        <Header 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
          onNotificationClick={handleNotificationClick}
        />
        
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;