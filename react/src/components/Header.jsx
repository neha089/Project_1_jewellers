import React from 'react';
import { Search, User, Menu, Bell } from 'lucide-react';
import { getCustomerBalances } from './balanceCalculator';

const Header = ({ toggleSidebar, isMobile, onNotificationClick }) => {
  // Get all customers with balances
  const customerBalances = getCustomerBalances();
  
  // Check if there are any pending balances
  const hasPendingBalances = customerBalances.some(customer => 
    Math.abs(customer.netBalance) > 0
  );

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-4">
        {isMobile && (
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={20} />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {window.location.pathname.substring(1).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {window.location.pathname === '/customers' ? 'Manage your customer database' : 
             window.location.pathname === '/dashboard' ? 'Overview of your business' : 
             window.location.pathname === '/balances' ? 'Manage customer balances' :
             'Manage your jewelry business'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
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
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>

        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">A</span>
        </div>
      </div>
    </header>
  );
};

export default Header;