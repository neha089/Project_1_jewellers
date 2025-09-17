import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Loader2,
  AlertCircle,
  Filter
} from 'lucide-react';
import ApiService from '../services/api.js';
import AddUdhariModal from '../components/AddUdhariModal';
import UdhariCard from '../components/UdhariCard';
import UdhariDetailModal from '../components/UdhariDetailModal';
import UPaymentModal from '../components/UPaymentModal';

const Udhaar = () => {
  const [receivableUdharis, setReceivableUdharis] = useState([]);
  const [payableUdharis, setPayableUdharis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [businessSummary, setBusinessSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedUdhari, setSelectedUdhari] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadUdhariData(), loadBusinessSummary()]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadUdhariData = async () => {
    try {
      const [collectResponse, payResponse] = await Promise.all([
        ApiService.getOutstandingToCollect(),
        ApiService.getOutstandingToPay()
      ]);

      if (collectResponse.success && collectResponse.data) {
        setReceivableUdharis(collectResponse.data.customerWise || []);
      }

      if (payResponse.success && payResponse.data) {
        setPayableUdharis(payResponse.data.customerWise || []);
      }
    } catch (error) {
      console.error('Error loading udhari data:', error);
      throw error;
    }
  };

  const loadBusinessSummary = async () => {
    try {
      const summaryResponse = await ApiService.getOverallUdhariSummary();
      if (summaryResponse && summaryResponse.success && summaryResponse.data) {
        setBusinessSummary({
          totalToCollect: summaryResponse.data.totalToCollect || 0,
          totalToPay: summaryResponse.data.totalToPay || 0,
          totalTransactions: summaryResponse.data.totalTransactions || 0
        });
      } else {
        setBusinessSummary({
          totalToCollect: 0,
          totalToPay: 0,
          totalTransactions: 0
        });
      }
    } catch (error) {
      console.error('Error loading business summary:', error);
      setBusinessSummary({
        totalToCollect: 0,
        totalToPay: 0,
        totalTransactions: 0
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewUdhari = (udhari, type) => {
    setSelectedUdhari({ ...udhari, type });
    setShowDetailModal(true);
  };

  const handlePayment = (udhari, type) => {
    setSelectedUdhari({ ...udhari, type });
    setShowPaymentModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setShowPaymentModal(false);
    setSelectedUdhari(null);
  };

  const handleUdhariAdded = () => {
    handleModalClose();
    loadAllData(); // Refresh data after adding new udhari
  };

  const handlePaymentComplete = () => {
    handleModalClose();
    loadAllData(); // Refresh data after payment
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getFilteredData = () => {
    let filteredReceivable = receivableUdharis;
    let filteredPayable = payableUdharis;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredReceivable = receivableUdharis.filter(udhari =>
        udhari.customer?.name?.toLowerCase().includes(searchLower) ||
        udhari.customer?.phone?.includes(searchTerm)
      );
      filteredPayable = payableUdharis.filter(udhari =>
        udhari.customer?.name?.toLowerCase().includes(searchLower) ||
        udhari.customer?.phone?.includes(searchTerm)
      );
    }

    return { filteredReceivable, filteredPayable };
  };

  const { filteredReceivable, filteredPayable } = getFilteredData();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Loading Udhari Data</h3>
          <p className="text-slate-600">Fetching outstanding amounts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Error Loading Data</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadAllData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Udhari Management</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:bg-white hover:text-slate-900 rounded-xl transition-colors border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-md"
            >
              <Plus size={18} />
              Add Udhari
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <span className="text-sm font-medium opacity-90">TO COLLECT</span>
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(businessSummary.totalToCollect || 0)}</p>
            <p className="text-sm opacity-90">{receivableUdharis.length} customers owe you</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <TrendingDown size={20} />
              </div>
              <span className="text-sm font-medium opacity-90">TO PAY</span>
            </div>
            <p className="text-3xl font-bold mb-2">{formatCurrency(businessSummary.totalToPay || 0)}</p>
            <p className="text-sm opacity-90">{payableUdharis.length} customers you owe</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <span className="text-sm font-medium opacity-90">NET POSITION</span>
            </div>
            <p className="text-3xl font-bold mb-2">
              {formatCurrency(Math.abs((businessSummary.totalToCollect || 0) - (businessSummary.totalToPay || 0)))}
            </p>
            <p className="text-sm opacity-90">
              {(businessSummary.totalToCollect || 0) > (businessSummary.totalToPay || 0) ? 'Net Receivable' : 'Net Payable'}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'all' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({filteredReceivable.length + filteredPayable.length})
          </button>
          <button
            onClick={() => setFilterType('receivable')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'receivable' 
                ? 'bg-red-500 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Receivable ({filteredReceivable.length})
          </button>
          <button
            onClick={() => setFilterType('payable')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              filterType === 'payable' 
                ? 'bg-green-500 text-white shadow-md' 
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Payable ({filteredPayable.length})
          </button>
        </div>

        {/* Udhari Lists */}
        <div className="space-y-6">
          {/* Receivable Section */}
          {(filterType === 'all' || filterType === 'receivable') && filteredReceivable.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Money to Collect ({filteredReceivable.length})
              </h2>
              <div className="space-y-3">
                {filteredReceivable.map((udhari) => (
                  <UdhariCard
                    key={udhari.customer?._id}
                    udhari={udhari}
                    type="receivable"
                    onView={() => handleViewUdhari(udhari, 'receivable')}
                    onPayment={() => handlePayment(udhari, 'receivable')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Payable Section */}
          {(filterType === 'all' || filterType === 'payable') && filteredPayable.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Money to Pay ({filteredPayable.length})
              </h2>
              <div className="space-y-3">
                {filteredPayable.map((udhari) => (
                  <UdhariCard
                    key={udhari.customer?._id}
                    udhari={udhari}
                    type="payable"
                    onView={() => handleViewUdhari(udhari, 'payable')}
                    onPayment={() => handlePayment(udhari, 'payable')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredReceivable.length === 0 && filteredPayable.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign size={24} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Outstanding Amounts</h3>
            <p className="text-slate-500 mb-6">Start by adding your first udhari transaction</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Add Udhari
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUdhariModal
          isOpen={showAddModal}
          onClose={handleModalClose}
          onSuccess={handleUdhariAdded}
        />
      )}

      {showDetailModal && selectedUdhari && (
        <UdhariDetailModal
          isOpen={showDetailModal}
          udhari={selectedUdhari}
          onClose={handleModalClose}
          onPayment={() => {
            setShowDetailModal(false);
            setShowPaymentModal(true);
          }}
        />
      )}

      {showPaymentModal && selectedUdhari && (
        <UPaymentModal
          isOpen={showPaymentModal}
          udhari={selectedUdhari}
          onClose={handleModalClose}
          onSuccess={handlePaymentComplete}
        />
      )}
    </div>
  );
};

export default Udhaar;