import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter,RefreshCw, AlertCircle, X } from 'lucide-react';
import ApiService from '../services/api';
import MetalPriceService from '../services/metalPriceService';
import SilverTransactionForm from '../components/SilverTransactionForm';
import TransactionViewModal from '../components/TransactionViewModal';
import SStatsCards from '../components/SStatsCards';
import SilverRatesDisplay from '../components/SilverRatesDisplay';
import TransactionTable from '../components/TransactionTable';
import EmptyState from '../components/EmptyState';

const SilverBuySell = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [silverRates, setSilverRates] = useState({});
  const [summary, setSummary] = useState({ totalBuy: 0, totalSell: 0, netProfit: 0 });

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load transactions when filters change
  useEffect(() => {
    loadTransactions();
  }, [searchTerm, filterBy, currentPage]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadTransactions(),
        loadSilverRates(),
        loadSummary()
      ]);
    } catch (error) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...(filterBy !== 'all' && { transactionType: filterBy.toUpperCase() }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await ApiService.getSilverTransactions(params);
      
      if (response.success) {
        setTransactions(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      setError('Failed to load transactions');
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSilverRates = async () => {
    try {
      // First try to get from our metal price service
      const priceData = await MetalPriceService.getCurrentPrices();
      if (priceData && priceData.silver) {
        const silverRatesFormatted = {};
        Object.entries(priceData.silver.rates).forEach(([purity, rate]) => {
          silverRatesFormatted[`${purity} Silver`] = Math.round(rate / 100); // Convert from paise to rupees
        });
        setSilverRates(silverRatesFormatted);
        return;
      }

      // Fallback to API service
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
          totalSell: response.data.sell.totalAmount|| 0,
          netProfit: response.data?.netMetrics.netAmount || 0
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
          await Promise.all([loadTransactions(), loadSummary()]);
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
    await Promise.all([loadTransactions(), loadSummary()]);
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  if (loading && transactions.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900">Silver Buy/Sell</h1>
            <p className="text-gray-600">Manage your silver transactions</p>
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
                ×
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <SStatsCards summary={summary} />

        {/* Current Silver Rates Display */}
        <SilverRatesDisplay silverRates={silverRates} />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, bill number..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
        </div>

        {/* Transactions Table */}
        <TransactionTable
          transactions={transactions}
          onView={handleView}
          onDelete={handleDelete}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
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
        {!loading && transactions.length === 0 && (
          <EmptyState onCreateTransaction={() => setShowForm(true)} />
        )}
      </div>
    </div>
  );
};

export default SilverBuySell;