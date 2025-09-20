import React from 'react';
import { Search, Filter, SortAsc, Grid3X3, List, ChevronDown } from 'lucide-react';

const SilverLoanSearchFilterBar = ({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange, 
  silverTypeFilter,
  onSilverTypeFilterChange,
  sortBy, 
  onSortChange,
  viewMode,
  setViewMode,
  loading
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Silver Loan Search & Filter</h3>
            <p className="text-sm text-gray-600 mt-1">Find and organize your silver loan data efficiently</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span>Real-time search</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-end gap-4 flex-wrap lg:flex-nowrap">
          <div className="flex-1 min-w-72">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search by loan ID, customer name, phone..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
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

          <div className="min-w-40">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="OVERDUE">Overdue</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="min-w-36">
            <label className="block text-sm font-medium text-gray-700 mb-2">Silver Type</label>
            <div className="relative">
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={silverTypeFilter}
                onChange={(e) => onSilverTypeFilterChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="all">All Silver</option>
                <option value="925">925 Silver</option>
                <option value="900">900 Silver</option>
                <option value="800">800 Silver</option>
              </select>
            </div>
          </div>

          <div className="min-w-44">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10" size={16} />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={16} />
              <select
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400"
                disabled={loading}
              >
                <option value="loanId">Sort by Loan ID</option>
                <option value="customer">Customer Name</option>
                <option value="loanamount">Loan Amount</option>
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Created Date</option>
                <option value="weight">Silver Weight</option>
              </select>
            </div>
          </div>

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

        {(searchTerm || statusFilter !== 'all' || silverTypeFilter !== 'all' || sortBy !== 'loanId') && (
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
              {silverTypeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  Silver: {silverTypeFilter}
                  <button
                    onClick={() => onSilverTypeFilterChange('all')}
                    className="ml-1 hover:text-gray-900 transition-colors"
                  >
                    ×
                  </button>
                </span>
              )}
              {sortBy !== 'loanId' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Sort: {sortBy === 'customer' ? 'Customer Name' : sortBy === 'loanamount' ? 'Loan Amount' : sortBy === 'dueDate' ? 'Due Date' : sortBy === 'createdAt' ? 'Created Date' : sortBy === 'weight' ? 'Silver Weight' : sortBy}
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
                  onSilverTypeFilterChange('all');
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

export default SilverLoanSearchFilterBar;