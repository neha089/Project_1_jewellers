import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  CreditCard,
  DollarSign,
  FileText
} from 'lucide-react';
import ApiService from '../services/api';
import AddUdharModal from './Udhaar/AddUdhariModal';
import UdhariDetailModal from './Udhaar/UdhariDetailModal';
import UdhariPaymentModal from './Udhaar/UdhariPaymentModal';

const UdhariTab = ({ customerId, onRefresh }) => {
  const [udharis, setUdharis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [selectedUdhari, setSelectedUdhari] = useState(null);
  const [showAddUdhari, setShowAddUdhari] = useState(false);
  const [showUdhariDetail, setShowUdhariDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [udhariType, setUdhariType] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUdharis();
  }, [customerId]);

  const loadUdharis = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load outstanding udharis using the new API endpoints
      const [collectResponse, payResponse] = await Promise.all([
        ApiService.getOutstandingToCollectUdhari(),
        ApiService.getOutstandingToPayUdhari()
      ]);

      let allUdharis = [];

      // Process receivable udharis (to collect)
      if (collectResponse.success && collectResponse.data?.customerWise) {
        collectResponse.data.customerWise.forEach(customerData => {
          if (customerData.udhars && customerData.udhars.length > 0) {
            customerData.udhars.forEach(udhari => {
              allUdharis.push({
                ...udhari,
                type: 'receivable',
                udharType: 'GIVEN',
                customer: customerData.customer,
                status: udhari.status || 'ACTIVE',
                amount: udhari.originalAmount || udhari.principalRupees || 0,
                remainingAmount: udhari.outstandingAmount || udhari.outstandingRupees || udhari.originalAmount || 0,
                totalPaid: (udhari.originalAmount || 0) - (udhari.outstandingAmount || 0),
                startDate: udhari.takenDate || udhari.createdAt,
                dueDate: udhari.dueDate,
                purpose: udhari.note || 'Udhari Given',
                paymentHistory: udhari.paymentHistory || [],
                totalOutstanding: customerData.totalOutstanding
              });
            });
          }
        });
      }

      // Process payable udharis (to pay)
      if (payResponse.success && payResponse.data?.customerWise) {
        payResponse.data.customerWise.forEach(customerData => {
          if (customerData.udhars && customerData.udhars.length > 0) {
            customerData.udhars.forEach(udhari => {
              allUdharis.push({
                ...udhari,
                type: 'payable',
                udharType: 'TAKEN',
                customer: customerData.customer,
                status: udhari.status || 'ACTIVE',
                amount: udhari.originalAmount || udhari.principalRupees || 0,
                remainingAmount: udhari.outstandingAmount || udhari.outstandingRupees || udhari.originalAmount || 0,
                totalPaid: (udhari.originalAmount || 0) - (udhari.outstandingAmount || 0),
                startDate: udhari.takenDate || udhari.createdAt,
                dueDate: udhari.dueDate,
                purpose: udhari.note || 'Udhari Taken',
                paymentHistory: udhari.paymentHistory || [],
                totalOutstanding: customerData.totalOutstanding
              });
            });
          }
        });
      }

      // Filter by customerId if provided
      if (customerId) {
        allUdharis = allUdharis.filter(udhari => 
          udhari.customer?._id === customerId
        );
      }

      setUdharis(allUdharis);
    } catch (error) {
      console.error('Error loading udharis:', error);
      setError('Failed to load udhari data');
    } finally {
      setLoading(false);
    }
  };

  // Filter udharis based on status, type, and search term
  const filteredUdharis = udharis.filter(udhari => {
    const statusMatch = statusFilter === 'all' || udhari.status.toLowerCase() === statusFilter.toLowerCase();
    const typeMatch = typeFilter === 'all' || udhari.type === typeFilter;
    const searchMatch = searchTerm === '' || 
      udhari.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      udhari.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  // Calculate summary statistics
  const summary = {
    totalToCollect: udharis.filter(u => u.type === 'receivable').reduce((sum, u) => sum + u.remainingAmount, 0),
    totalToPay: udharis.filter(u => u.type === 'payable').reduce((sum, u) => sum + u.remainingAmount, 0),
    activeUdharis: udharis.filter(u => u.status === 'ACTIVE').length,
    completedUdharis: udharis.filter(u => u.status === 'PAID' || u.status === 'COMPLETED').length,
    overdueUdharis: udharis.filter(u => u.status === 'OVERDUE').length,
    totalTransactions: udharis.length
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIALLY_PAID': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'receivable': return 'text-red-600';
      case 'payable': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'receivable' ? TrendingUp : TrendingDown;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleView = (udhari) => {
    // Create customer data structure expected by UdhariDetailModal
    const customerData = {
      customer: udhari.customer,
      transactions: [udhari],
      totalOutstanding: udhari.totalOutstanding || udhari.remainingAmount,
      type: udhari.type
    };
    setSelectedCustomerData(customerData);
    setUdhariType(udhari.type);
    setShowUdhariDetail(true);
  };

  const handleDirectPayment = (udhari) => {
    setSelectedUdhari(udhari);
    setShowPaymentModal(true);
  };

  const handlePayment = (transaction) => {
    setSelectedUdhari(transaction);
    setShowUdhariDetail(false);
    setShowPaymentModal(true);
  };

  const handleAddUdhariSuccess = () => {
    loadUdharis();
    if (onRefresh) onRefresh();
    setShowAddUdhari(false);
  };

  const handlePaymentSuccess = () => {
    loadUdharis();
    if (onRefresh) onRefresh();
    setShowPaymentModal(false);
    setShowUdhariDetail(false);
    setSelectedUdhari(null);
  };

  const UdhariCard = ({ udhari }) => {
    const TypeIcon = getTypeIcon(udhari.type);
    const remainingAmount = udhari.remainingAmount || 0;
    const isReceivable = udhari.type === 'receivable';
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isReceivable ? 'bg-red-50' : 'bg-green-50'}`}>
              <TypeIcon size={20} className={getTypeColor(udhari.type)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{udhari.purpose || 'Udhari Transaction'}</h3>
              <p className="text-sm text-gray-500">
                {isReceivable ? 'To Collect from' : 'To Pay to'} {udhari.customer?.name || 'Unknown'}
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(udhari.status)}`}>
            {udhari.status}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Original Amount</p>
            <p className="font-semibold text-gray-900">{formatCurrency(udhari.amount)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Paid Amount</p>
            <p className="font-semibold text-green-600">{formatCurrency(udhari.totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className={`font-semibold ${isReceivable ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            Started: {new Date(udhari.startDate).toLocaleDateString()}
          </div>
          {udhari.dueDate && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              Due: {new Date(udhari.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {udhari.customer?.name || 'Unknown'}
            </span>
            <span className="text-xs text-gray-400">
              ({udhari.paymentHistory?.length || 0} payments)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleView(udhari)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye size={14} />
              View
            </button>
            {remainingAmount > 0 && (
              <button
                onClick={() => handleDirectPayment(udhari)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  isReceivable
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-green-600 hover:bg-green-50'
                }`}
              >
                <CreditCard size={14} />
                {isReceivable ? 'Collect' : 'Pay'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-600" />
          <span className="text-gray-600">Loading udhari data...</span>
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
          <h3 className="text-lg font-medium text-gray-900">Udhari Management</h3>
          <p className="text-sm text-gray-500">
            {customerId ? 'Customer udhari history' : 'All udhari transactions'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadUdharis}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddUdhari(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Udhari
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingUp size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">To Collect</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalToCollect)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Outstanding receivables</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingDown size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">To Pay</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalToPay)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Outstanding payables</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Position</p>
              <p className={`text-2xl font-bold ${(summary.totalToCollect - summary.totalToPay) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(summary.totalToCollect - summary.totalToPay)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Overall balance</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <FileText size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.totalTransactions}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Active: {summary.activeUdharis}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search udharis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="partially_paid">Partially Paid</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="receivable">To Collect</option>
              <option value="payable">To Pay</option>
            </select>
          </div>
        </div>
      </div>

      {/* Udharis List */}
      <div className="space-y-4">
        {filteredUdharis.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <IndianRupee size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Udharis Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No udharis match your current filters.' 
                : customerId 
                  ? 'No udhari records available for this customer.'
                  : 'No udhari records available.'}
            </p>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddUdhari(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Udhari
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUdharis.map(udhari => (
              <UdhariCard key={udhari._id || udhari.id} udhari={udhari} />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddUdhari && (
        <AddUdharModal 
          isOpen={showAddUdhari}
          onClose={() => setShowAddUdhari(false)}
          onSuccess={handleAddUdhariSuccess}
        />
      )}

      {showUdhariDetail && selectedCustomerData && (
        <UdhariDetailModal 
          isOpen={showUdhariDetail}
          customerData={selectedCustomerData}
          udhariType={udhariType}
          onClose={() => {
            setShowUdhariDetail(false);
            setSelectedCustomerData(null);
          }}
          onPayment={handlePayment}
        />
      )}

      {showPaymentModal && selectedUdhari && (
        <UdhariPaymentModal 
          isOpen={showPaymentModal}
          udhari={selectedUdhari}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedUdhari(null);
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default UdhariTab;
