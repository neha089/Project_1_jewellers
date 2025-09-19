import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List, ChevronDown } from 'lucide-react';

const GoldLoanSearchFilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  goldTypeFilter,
  onGoldTypeFilterChange,
  sortBy, 
  onSortChange,
  viewMode,
  setViewMode,
  loading
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Gold Loan Search & Filter</h3>
            <p className="text-sm text-gray-600 mt-1">Find and organize your gold loan data efficiently</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span>Real-time search</span>
          </div>
        </div>
      </div>

      {/* Search and Filters - All on one horizontal line */}
      <div className="p-6">
        <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
          {/* Search Input */}
          <div className="flex-1 min-w-72">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by loan ID, customer name, phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                disabled={loading}
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Gold Type Filter */}
          <div className="min-w-36">
            <label className="block text-sm font-medium text-gray-700 mb-2">Gold Type</label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={goldTypeFilter}
                onChange={(e) => onGoldTypeFilterChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="all">All Gold</option>
                <option value="24">24K Gold</option>
                <option value="22">22K Gold</option>
                <option value="18">18K Gold</option>
                <option value="14">14K Gold</option>
              </select>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="min-w-44">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="loanId">Sort by Loan ID</option>
                <option value="customer">Customer Name</option>
                <option value="loanamount">Loan Amount</option>
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Created Date</option>
                <option value="weight">Gold Weight</option>
              </select>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">View:</label>
            <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-md transition-all duration-200 text-sm font-medium ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-blue-600 border border-gray-200' 
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Grid View"
                disabled={loading}
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
                disabled={loading}
              >
                <List size={16} />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || statusFilter !== 'all' || goldTypeFilter !== 'all' || sortBy !== 'loanId') && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            <div className="flex gap-2 flex-wrap">
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => onSearchChange('')}
                    className="ml-1 hover:text-blue-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Status: {statusFilter}
                  <button
                    onClick={() => onStatusFilterChange('all')}
                    className="ml-1 hover:text-green-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {goldTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                  Gold: {goldTypeFilter}
                  <button
                    onClick={() => onGoldTypeFilterChange('all')}
                    className="ml-1 hover:text-amber-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {sortBy !== 'loanId' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Sort: {sortBy === 'customer' ? 'Customer Name' : sortBy === 'loanamount' ? 'Loan Amount' : sortBy === 'dueDate' ? 'Due Date' : sortBy === 'createdAt' ? 'Created Date' : sortBy === 'weight' ? 'Gold Weight' : sortBy}
                  <button
                    onClick={() => onSortChange('loanId')}
                    className="ml-1 hover:text-purple-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  onSearchChange('');
                  onStatusFilterChange('all');
                  onGoldTypeFilterChange('all');
                  onSortChange('loanId');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline transition-colors"
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

export default GoldLoanSearchFilterBar;