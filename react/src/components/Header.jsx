import React, { useState } from 'react';
import { Search, User, Menu } from 'lucide-react';

const Header = ({ toggleSidebar, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      alert(`Search for: ${searchQuery}`);
    }
  };

  return (
    <header className="bg-white px-8 py-5 border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {isMobile && (
          <button onClick={toggleSidebar} className="text-gray-600 hover:text-gray-900">
            <Menu size={20} />
          </button>
        )}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-600">Today, August 19, 2025</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {!isMobile && (
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="pl-4 pr-10 py-2.5 w-72 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
        )}
        
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors border border-gray-200">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white">
            <User size={14} />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">Rajesh Kumar</div>
            <div className="text-xs text-gray-600">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;