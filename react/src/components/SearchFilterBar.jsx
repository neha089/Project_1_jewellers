import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List } from 'lucide-react';

const SearchFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  sortBy, 
  setSortBy,
  viewMode,
  setViewMode 
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, phone, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all duration-200"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none min-w-36"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 appearance-none min-w-40"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Recently Added</option>
              <option value="loans">Most Loans</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Grid View"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              title="Table View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;