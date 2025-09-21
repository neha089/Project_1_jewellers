import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw, AlertCircle, X } from 'lucide-react';
import ApiService from '../services/api';
import MetalPriceService from '../services/metalPriceService';
import SilverTransactionForm from '../components/SilverBuySell/SilverTransactionForm';
import TransactionViewModal from '../components/TransactionViewModal';
import SStatsCards from '../components/SilverBuySell/SStatsCards';
import TransactionTable from '../components/TransactionTable';
import EmptyState from '../components/EmptyState';

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SilverBuySell = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [displayTransactions, setDisplayTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [silverRates, setSilverRates] = useState({});
  const [summary, setSummary] = useState({ totalBuy: 0, totalSell: 0, netProfit: 0 });

  const ITEMS_PER_PAGE = 10;

  // Debounce search term to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Apply filters when search term or filter changes
  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // Reset to first page when filters change
  }, [debouncedSearchTerm, filterBy, allTransactions]);

  // Update display transactions when page changes or filtered results change
  useEffect(() => {
    updateDisplayTransactions();
  }, [filteredTransactions, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadAllTransactions(),
        loadSilverRates(),
        loadSummary(),
      ]);
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllTransactions = async () => {
    try {
      // Load all transactions at once
      const response = await ApiService.getSilverTransactions({ 
        page: 1, 
        limit: 10000 // Large number to get all transactions
      });
      
      if (response.success) {
        setAllTransactions(response.data || []);
        console.log('Loaded all transactions:', response.data?.length);
      } else {
        setError('Failed to fetch transactions');
        setAllTransactions([]);
      }
    } catch (error) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', error);
      setAllTransactions([]);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...allTransactions];

    // Apply transaction type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(transaction => 
        transaction.transactionType === filterBy.toUpperCase()
      );
    }

    // Apply search filter - search in customer and supplier names
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(transaction => {
        // Get customer name
        const customerName = (
          transaction.customer?.name || 
          transaction.customerName || 
          ''
        ).toLowerCase();

        // Get supplier name  
        const supplierName = (
          transaction.supplier?.name || 
          transaction.supplierName || 
          ''
        ).toLowerCase();

        // Get phone numbers
        const customerPhone = (
          transaction.customer?.phone || 
          transaction.customerPhone || 
          ''
        ).toLowerCase();

        const supplierPhone = (
          transaction.supplier?.phone || 
          transaction.supplierPhone || 
          ''
        ).toLowerCase();

        // Get bill number
        const billNumber = (
          transaction.billNumber || 
          transaction.invoiceNumber || 
          ''
        ).toLowerCase();

        return customerName.includes(searchLower) || 
               supplierName.includes(searchLower) ||
               customerPhone.includes(searchLower) ||
               supplierPhone.includes(searchLower) ||
               billNumber.includes(searchLower);
      });
    }

    setFilteredTransactions(filtered);
    setTotalCount(filtered.length);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
  }, [allTransactions, filterBy, debouncedSearchTerm]);

  const updateDisplayTransactions = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    setDisplayTransactions(pageTransactions);
  }, [filteredTransactions, currentPage]);

  const loadSilverRates = async () => {
    try {
      const priceData = await MetalPriceService.getCurrentPrices();
      if (priceData && priceData.silver) {
        const silverRatesFormatted = {};
        Object.entries(priceData.silver.rates).forEach(([purity, rate]) => {
          silverRatesFormatted[`${purity} Silver`] = Math.round(rate / 100);
        });
        setSilverRates(silverRatesFormatted);
        return;
      }

      const response = await ApiService.getCurrentRates();
      if (response.success) {
        setSilverRates(response.data);
      }
    } catch (error) {
      console.error('Error loading silver rates:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await ApiService.getAnalytics_silver();
      setSummary({
        totalBuy: response.data.buy.totalAmount || 0,
        totalSell: response.data.sell.totalAmount || 0,
        netProfit: response.data?.netMetrics.netAmount || 0,
      });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleView = (transaction) => {
    setViewingTransaction(transaction);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        setLoading(true);
        const response = await ApiService.deleteSilverTransaction(id);
        if (response.success) {
          // Remove from local state immediately
          setAllTransactions(prev => prev.filter(t => t._id !== id && t.id !== id));
          await loadSummary(); // Refresh summary
        } else {
          setError('Failed to delete transaction');
        }
      } catch (error) {
        setError('Failed to delete transaction');
        console.error('Error deleting transaction:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTransaction(null);
    setError(null);
    // Reload all transactions to get the updated data
    await Promise.all([loadAllTransactions(), loadSummary()]);
  };

  const refreshData = async () => {
    setSearchTerm('');
    setFilterBy('all');
    setCurrentPage(1);
    await loadInitialData();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading && allTransactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading silver transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-600">Manage your silver transactions</p>
            {totalCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {debouncedSearchTerm.trim() || filterBy !== 'all' 
                  ? `Found ${totalCount} transaction${totalCount !== 1 ? 's' : ''}` 
                  : `Total ${totalCount} transaction${totalCount !== 1 ? 's' : ''}`
                }
              </p>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Transaction
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <SStatsCards summary={summary} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, supplier name, phone, bill number..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
              >
                <option value="all">All Transactions</option>
                <option value="buy">Buy Only</option>
                <option value="sell">Sell Only</option>
              </select>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {(debouncedSearchTerm.trim() || filterBy !== 'all') && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {debouncedSearchTerm.trim() && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Search: "{debouncedSearchTerm}"
                  <button
                    onClick={clearSearch}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filterBy !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Type: {filterBy.charAt(0).toUpperCase() + filterBy.slice(1)}
                  <button
                    onClick={() => setFilterBy('all')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <TransactionTable
          transactions={displayTransactions}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setCurrentPage}
          loading={loading}
        />

        {/* Transaction Form Modal */}
        {showForm && (
          <SilverTransactionForm
            editingTransaction={editingTransaction}
            silverRates={silverRates}
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            onError={setError}
          />
        )}

        {/* View Transaction Modal */}
        {viewingTransaction && (
          <TransactionViewModal
            transaction={viewingTransaction}
            onClose={() => setViewingTransaction(null)}
            onEdit={() => {
              setViewingTransaction(null);
              handleEdit(viewingTransaction);
            }}
          />
        )}

        {/* Empty State */}
        {!loading && displayTransactions.length === 0 && (
          <EmptyState 
            onCreateTransaction={() => setShowForm(true)}
            hasFilters={debouncedSearchTerm.trim() || filterBy !== 'all'}
            onClearFilters={() => {
              setSearchTerm('');
              setFilterBy('all');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SilverBuySell;