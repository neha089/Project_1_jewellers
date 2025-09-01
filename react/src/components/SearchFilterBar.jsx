import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List, ChevronDown, Loader2 } from 'lucide-react';

const SearchFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  sortBy, 
  setSortBy,
  viewMode,
  setViewMode,
  isSearching = false
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            <p className="text-sm text-gray-600 mt-1">Find and organize your customer data efficiently</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isSearching ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`}></div>
            <span>{isSearching ? 'Searching...' : 'Real-time search'}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters - All on one horizontal line */}
      <div className="p-6">
        <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
          {/* Search Input */}
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Customers
            </label>
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 animate-spin" size={16} />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              )}
              <input
                type="text"
                placeholder="Search by name, phone, email, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                disabled={isSearching}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg"
                  disabled={isSearching}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={isSearching}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="min-w-44">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Recently Added</option>
                <option value="loans">Most Loans</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              View:
            </label>
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <Grid3X3 size={16} />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'table' 
                    ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Table View"
              >
                <List size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all' || sortBy !== 'name') && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-900 transition-colors"
                    disabled={isSearching}
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="ml-1 hover:text-green-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {sortBy !== 'name' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Sort: {sortBy === 'date' ? 'Recently Added' : sortBy === 'loans' ? 'Most Loans' : sortBy}
                  <button
                    onClick={() => setSortBy('name')}
                    className="ml-1 hover:text-purple-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('name');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
                disabled={isSearching}
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;