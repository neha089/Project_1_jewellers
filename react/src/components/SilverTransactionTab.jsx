import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle,
  CircleDot,
  Weight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3
} from 'lucide-react';
import ApiService from '../services/api';
import SilverTransactionForm from './SilverBuySell/SilverTransactionForm';
import TransactionViewModal from './TransactionViewModal';
import TransactionTable from './TransactionTable';

const SilverTransactionTab = ({ customerId, onRefresh }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState(null);
  const [summary, setSummary] = useState({
    totalBuy: 0,
    totalSell: 0,
    totalWeight: 0,
    netProfit: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await loadTransactions();
    } catch (error) {
      setError('Failed to load silver transaction data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await ApiService.getSilverTrnsactionByCustomerId(customerId);
      if (response.success) {
        setTransactions(response.data || []);
        if (response.stats) {
          setSummary({
            totalBuy: 0, // Since we're focusing on SELL transactions
            totalSell: response.stats.totalSaleAmount / 100 || 0, // Convert paise to rupees
            totalWeight: response.stats.totalWeight || 0,
            netProfit: 0, // Calculate if needed (e.g., based on market rates)
            transactionCount: response.stats.totalTransactions || 0,
          });
        }
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      throw error;
    }
  };

  const handleView = (transaction) => {
    setViewingTransaction(transaction);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this silver transaction?')) {
      try {
        setLoading(true);
        const response = await ApiService.deleteSilverTransaction(id);
        if (response.success) {
          await loadData();
          if (onRefresh) onRefresh();
        }
      } catch (error) {
        setError('Failed to delete transaction');
        console.error('Error deleting transaction:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    await loadData();
    if (onRefresh) onRefresh();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setError(null);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading silver transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

      {/* Header with Action Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Silver Transactions</h3>
          <p className="text-sm text-gray-500">
            {customerId ? 'Customer silver sell history' : 'All silver transactions'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{(summary.totalSell || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total sales to business</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Weight size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Weight Sold</p>
              <p className="text-2xl font-bold text-gray-900">{(summary.totalWeight || 0).toFixed(2)}g</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Total silver sold</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{summary.transactionCount || 0}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">All sell transactions</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {transactions.length > 0 ? (
          <TransactionTable
            transactions={transactions}
            onView={handleView}
            onDelete={handleDelete}
            loading={loading}
            currentPage={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        ) : (
          <div className="p-12 text-center">
            <CircleDot size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Silver Transactions</h3>
            <p className="text-gray-500 mb-6">
              {customerId 
                ? "This customer hasn't sold any silver yet" 
                : "Get started by creating your first silver transaction"
              }
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            >
              Create First Transaction
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <SilverTransactionForm
          editingTransaction={null}
          silverRates={null} // Add logic to fetch silver rates if needed
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          onError={setError}
        />
      )}

      {viewingTransaction && (
        <TransactionViewModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
          onEdit={null} // Remove edit functionality
        />
      )}
    </div>
  );
};

export default SilverTransactionTab;