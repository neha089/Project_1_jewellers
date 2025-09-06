import React from 'react';
import { Search, User, Menu, Bell, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ toggleSidebar, isMobile, onNotificationClick }) => {
  const location = useLocation();

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/customers':
        return 'Customers';
      case '/udhaar':
        return 'Udhaar';
      case '/gold-loan':
        return 'GoldLoan Management';
      case '/silver-loan':
        return 'SilverLoan Management';
      case '/loan':
        return 'Loan Management';
      case '/bussiness-expense':
        return 'Business - Expense';
      case '/transactions':
        return 'Transactions';
      case '/gold-buy-sell':
        return 'Gold Buy/Sell';
      case '/silver-buy-sell':
        return 'Silver Buy/Sell';
      case '/analysis':
        return 'Business Analysis';
      case '/setting':
        return 'Settings';
      default:
        return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Overview of your business performance';
      case '/customers':
        return 'Manage your customer database';
      case '/udhaar':
        return 'Track udhaar transactions';
      case '/gold-loan':
        return 'Manage goldloan inventory';
      case '/silver-loan':
        return 'Manage silverloan inventory';
      case '/loan':
        return 'Manage customer loans';
      case '/bussiness-expense':
        return 'Financial overview and expenses';
      case '/transactions':
        return 'Manage transactions';
      case '/gold-buy-sell':
        return 'Gold trading operations';
      case '/silver-buy-sell':
        return 'Silver trading operations';
      case '/analysis':
        return 'Business insights and advice';
      case '/setting':
        return 'System configuration';
      default:
        return 'Manage your jewelry business';
    }
  };

  // Mock function - replace with actual balance checking logic
  const hasPendingBalances = true;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          )}
          
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {getPageDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notification Bell */}
          <button 
            onClick={onNotificationClick}
            className={`relative p-2 rounded-lg transition-all duration-200 ${
              hasPendingBalances 
                ? 'bg-red-100 hover:bg-red-200 animate-pulse' 
                : 'hover:bg-gray-100'
            }`}
          >
            <Bell 
              size={20} 
              className={hasPendingBalances ? 'text-red-600' : 'text-gray-600'} 
            />
            {hasPendingBalances && (
              <>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping"></span>
              </>
            )}
          </button>
          
          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">JB</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">Jewelry Business</p>
              <p className="text-xs text-gray-500">Owner</p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
