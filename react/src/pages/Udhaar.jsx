
import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, DollarSign, RefreshCw, Loader2, AlertCircle, Building } from 'lucide-react';
import ApiService from '../services/api.js';
import AddUdharModal from '../components/AddUdhariModal';
import UdhariCard from '../components/UdhariCard';
import UdhariDetailModal from '../components/UdhariDetailModal';
import UdhariPaymentModal from '../components/UdhariPaymentModal';

const Udhaar = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddUdhariModal, setShowAddUdhariModal] = useState(false);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [selectedUdhari, setSelectedUdhari] = useState(null);
  const [udhariType, setUdhariType] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receivableUdharis, setReceivableUdharis] = useState([]);
  const [payableUdharis, setPayableUdharis] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUdharis();
  }, []);

  const loadUdharis = async () => {
    try {
      setLoading(true);
      setError(null);
      const [receivableResponse, payableResponse] = await Promise.all([
        ApiService.getOutstandingToCollectUdhari(),
        ApiService.getOutstandingToPayUdhari(),
      ]);
      if (receivableResponse.success) {
        const receivableData = receivableResponse.data.customerWise.map(item => ({
          customer: item.customer,
          totalOutstanding: item.totalOutstanding,
          transactions: item.udhars || [],
          type: 'receivable',
          transactionCount: (item.udhars || item.transactions || []).length,
        }));
        setReceivableUdharis(receivableData);
      }
      if (payableResponse.success) {
        const payableData = payableResponse.data.customerWise.map(item => ({
          customer: item.customer,
          totalOutstanding: item.totalOutstanding,
          transactions: item.udhars || item.transactions || [],
          type: 'payable',
          transactionCount: (item.udhars || item.transactions || []).length,
        }));
        setPayableUdharis(payableData);
      }
    } catch (error) {
      console.error('Error loading udharis:', error);
      setError('Failed to load udhari data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUdhariSuccess = () => {
    loadUdharis();
  };

  const handleViewUdhari = (customerUdhariData) => {
    setSelectedCustomerData(customerUdhariData);
    setUdhariType(customerUdhariData.type);
    setShowDetailModal(true);
  };

  const handlePayment = (transaction) => {
    setSelectedUdhari(transaction);
    setShowDetailModal(false);
    setShowPaymentModal(true);
  };

  const handleDirectPayment = (customerUdhariData) => {
    if (customerUdhariData.transactions && customerUdhariData.transactions.length === 1) {
      setSelectedUdhari(customerUdhariData.transactions[0]);
      setShowPaymentModal(true);
    } else {
      handleViewUdhari(customerUdhariData);
    }
  };

  const handlePaymentSuccess = () => {
    loadUdharis();
    setShowPaymentModal(false);
    setShowDetailModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filterUdharis = (udharis) => {
    if (!searchTerm) return udharis;
    return udharis.filter(udhari =>
      udhari.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      udhari.customer?.phone?.includes(searchTerm)
    );
  };

  const filteredReceivableUdharis = filterUdharis(receivableUdharis);
  const filteredPayableUdharis = filterUdharis(payableUdharis);

  const totalToCollect = receivableUdharis.reduce((sum, udhari) => sum + udhari.totalOutstanding, 0);
  const totalToPay = payableUdharis.reduce((sum, udhari) => sum + udhari.totalOutstanding, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Udhari Management</h1>
            <p className="text-gray-600 text-sm sm:text-base">Track and manage your credit transactions seamlessly</p>
          </div>
          <button
            onClick={() => setShowAddUdhariModal(true)}
            className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md"
          >
            <Plus size={20} />
            Add Udhari
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">To Collect</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(totalToCollect)}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">{filteredReceivableUdharis.length} customers</p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingDown size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">To Pay</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalToPay)}</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">{filteredPayableUdharis.length} customers</p>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Net Balance</p>
                <p className={`text-xl sm:text-2xl font-bold ${(totalToCollect - totalToPay) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalToCollect - totalToPay)}
                </p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500">Overall position</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6">
          <div className="relative w-full">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by customer name or phone..."
              className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={loadUdharis}
            className="p-2 sm:p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={20} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'receivable' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            To Collect ({filteredReceivableUdharis.length})
          </button>
          <button
            onClick={() => setActiveTab('payable')}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
              activeTab === 'payable' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            To Pay ({filteredPayableUdharis.length})
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-10 w-10 sm:h-12 sm:w-12 text-blue-600 mx-auto" />
              <p className="text-gray-500 mt-4 text-sm sm:text-base">Loading udharis...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto" />
              <p className="text-red-600 mt-4 text-sm sm:text-base">{error}</p>
              <button
                onClick={loadUdharis}
                className="mt-4 px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6 sm:space-y-8">
                  {filteredReceivableUdharis.length > 0 && (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                          <TrendingUp size={14} className="text-red-600" />
                        </div>
                        To Collect ({filteredReceivableUdharis.length})
                      </h2>
                      <div className="space-y-4">
                        {filteredReceivableUdharis.map((customerData, index) => (
                          <UdhariCard
                            key={`receivable-${customerData.customer._id}-${index}`}
                            udhari={customerData}
                            type="receivable"
                            onView={() => handleViewUdhari(customerData)}
                            onPayment={() => handleDirectPayment(customerData)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPayableUdharis.length > 0 && (
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingDown size={14} className="text-green-600" />
                        </div>
                        To Pay ({filteredPayableUdharis.length})
                      </h2>
                      <div className="space-y-4">
                        {filteredPayableUdharis.map((customerData, index) => (
                          <UdhariCard
                            key={`payable-${customerData.customer._id}-${index}`}
                            udhari={customerData}
                            type="payable"
                            onView={() => handleViewUdhari(customerData)}
                            onPayment={() => handleDirectPayment(customerData)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredReceivableUdharis.length === 0 && filteredPayableUdharis.length === 0 && (
                    <div className="text-center py-12">
                      <Building size={40} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Udharis Found</h3>
                      <p className="text-gray-500 mb-6 text-sm sm:text-base">Start by adding your first udhari transaction</p>
                      <button
                        onClick={() => setShowAddUdhariModal(true)}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                      >
                        <Plus size={18} className="inline mr-2" />
                        Add Your First Udhari
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'receivable' && (
                <div className="space-y-4">
                  {filteredReceivableUdharis.length > 0 ? (
                    filteredReceivableUdharis.map((customerData, index) => (
                      <UdhariCard
                        key={`receivable-${customerData.customer._id}-${index}`}
                        udhari={customerData}
                        type="receivable"
                        onView={() => handleViewUdhari(customerData)}
                        onPayment={() => handleDirectPayment(customerData)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp size={40} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Receivable Udharis</h3>
                      <p className="text-gray-500 text-sm sm:text-base">No udharis to collect from customers</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payable' && (
                <div className="space-y-4">
                  {filteredPayableUdharis.length > 0 ? (
                    filteredPayableUdharis.map((customerData, index) => (
                      <UdhariCard
                        key={`payable-${customerData.customer._id}-${index}`}
                        udhari={customerData}
                        type="payable"
                        onView={() => handleViewUdhari(customerData)}
                        onPayment={() => handleDirectPayment(customerData)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <TrendingDown size={40} className="text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Payable Udharis</h3>
                      <p className="text-gray-500 text-sm sm:text-base">No udharis to pay to customers</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modals */}
        <AddUdharModal
          isOpen={showAddUdhariModal}
          onClose={() => setShowAddUdhariModal(false)}
          onSuccess={handleAddUdhariSuccess}
        />
        <UdhariDetailModal
          isOpen={showDetailModal}
          customerData={selectedCustomerData}
          udhariType={udhariType}
          onClose={() => setShowDetailModal(false)}
          onPayment={handlePayment}
        />
        <UdhariPaymentModal
          isOpen={showPaymentModal}
          udhari={selectedUdhari}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default Udhaar;