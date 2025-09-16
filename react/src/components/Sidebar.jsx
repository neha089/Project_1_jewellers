import React from 'react';
import { 
  Gem, 
  PieChart, 
  Users, 
  Coins, 
  ArrowUpDown, 
  Wallet, 
  BarChart3, 
  Settings,
  X,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { NavLink, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, toggleSidebar, isMobile }) => {
  const location = useLocation();
  
  // Reordered menu items based on your paper
  const menuItems = [
    { 
      name: 'Dashboard', 
      icon: PieChart, 
      path: '/dashboard',
      description: 'Overview & Analytics'
    },
    { 
      name: 'Customers', 
      icon: Users, 
      path: '/customers',
      description: 'Customer Management'
    },
    { 
      name: 'Udhaar', 
      icon: DollarSign, 
      path: '/udhaar',
      description: 'Money Transactions'
    },
    { 
      name: 'GoldLoan', 
      icon: Coins, 
      path: '/gold-loan',
      description: 'Gold Management'
    },
    { 
      name: 'SilverLoan', 
      icon: Wallet, 
      path: '/silver-loan',
      description: 'Silver Management'
    },
    { 
      name: 'Loan', 
      icon: ArrowUpDown, 
      path: '/loan',
      description: 'Loan Management'
    },
    { 
      name: 'Bussiness Expense', 
      icon: BarChart3, 
      path: '/business-expense',
      description: 'Financial Overview'
    },
    { 
      name: 'Gold Buy/Sell', 
      icon: TrendingUp, 
      path: '/gold-buy-sell',
      description: 'Gold Trading'
    },
    { 
      name: 'Silver Buy/Sell', 
      icon: Coins, 
      path: '/silver-buy-sell',
      description: 'Silver Bar Management'
    },
    { 
      name: 'Analysis', 
      icon: Settings, 
      path: '/analysis',
      description: 'Business Analysis'
    },
    { 
      name: 'Setting', 
      icon: Settings, 
      path: '/setting',
      description: 'System Settings'
    }
  ];

  const isActivePath = (path) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300
        ${isOpen || !isMobile ? 'translate-x-0' : '-translate-x-full'}
        ${isMobile ? 'shadow-xl' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Gem className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">JewelryPro</h1>
              <p className="text-xs text-gray-500">Business Manager</p>
            </div>
          </div>
          
          {isMobile && (
            <button 
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 h-full overflow-y-auto pb-20">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={isMobile ? toggleSidebar : undefined}
                className={({ isActive: navIsActive }) => `
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group
                  ${navIsActive || isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon 
                  size={20} 
                  className={`${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} 
                />
                <div className="flex-1">
                  <div className={`font-medium ${isActive ? 'text-blue-900' : ''}`}>
                    {item.name}
                  </div>
                  <div className={`text-xs ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.description}
                  </div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
