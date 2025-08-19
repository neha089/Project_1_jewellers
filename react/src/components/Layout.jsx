import React, { useState, useEffect } from 'react';
import { 
  Gem, 
  PieChart, 
  Users, 
  Coins, 
  ArrowUpDown, 
  Wallet, 
  Percent, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Search,
  Download,
  UserPlus,
  Edit,
  Eye,
  Plus,
  Trash2,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
// Layout Component
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
        />
        
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
export default Layout;