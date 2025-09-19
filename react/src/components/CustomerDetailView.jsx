import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, IndianRupee, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import CustomerInfoTab from "./CustomerInfoTab";
import GoldLoanTab from "./GoldLoanTab";
import LoanTab from "./LoanTab";
import UdhariTab from "./UdhariTab";
import GoldTransactionTab from "./GoldTransactionTab";
import SilverTransactionTab from "./SilverTransactionTab";
import ApiService from "../services/api";

const CustomerDetailView = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [transactionCounts, setTransactionCounts] = useState({
    goldLoans: 0,
    loans: 0,
    udhari: 0,
    goldTransactions: 0,
    silverTransactions: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'info', label: 'Customer Info', icon: User },
    { id: 'goldLoan', label: 'Gold Loans', icon: TrendingUp, count: transactionCounts.goldLoans },
    { id: 'loan', label: 'Loans', icon: IndianRupee, count: transactionCounts.loans },
    { id: 'udhari', label: 'Udhari', icon: Calendar, count: transactionCounts.udhari },
    { id: 'goldTransaction', label: 'Gold Buy/Sell', icon: TrendingUp, count: transactionCounts.goldTransactions },
    { id: 'silverTransaction', label: 'Silver Buy/Sell', icon: TrendingUp, count: transactionCounts.silverTransactions }
  ];

  // Load customer data
  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load customer details
      const customerResponse = await ApiService.getCustomerById(customerId);
      if (customerResponse.success) {
        setCustomer(customerResponse.data);
      } else {
        throw new Error('Customer not found');
      }

      // Load transaction counts for tabs
      await loadTransactionCounts();

    } catch (error) {
      console.error('Error loading customer data:', error);
      setError(error.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  // Load transaction counts for tab badges
  const loadTransactionCounts = async () => {
    try {
      const counts = { ...transactionCounts };

      // Load gold transactions count
      try {
        const goldResponse = await ApiService.getGoldTransactions({ customerId, limit: 1 });
        if (goldResponse.success) {
          counts.goldTransactions = goldResponse.pagination?.totalCount || goldResponse.data?.length || 0;
        }
      } catch (error) {
        console.error('Error loading gold transactions count:', error);
      }

      // Load silver transactions count
      try {
        const silverResponse = await ApiService.getSilverTransactions({ customerId, limit: 1 });
        if (silverResponse.success) {
          counts.silverTransactions = silverResponse.pagination?.totalCount || silverResponse.data?.length || 0;
        }
      } catch (error) {
        console.error('Error loading silver transactions count:', error);
      }

      // For now, set other counts to 0 (implement when those APIs are ready)
      counts.goldLoans = 0;
      counts.loans = 0;
      counts.udhari = 0;

      setTransactionCounts(counts);
    } catch (error) {
      console.error('Error loading transaction counts:', error);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  const handleRefresh = () => {
    loadCustomerData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Customer Details</h3>
          <p className="text-gray-600">Please wait while we fetch the customer information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Customer</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Not Found</h3>
          <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info':
        return <CustomerInfoTab customer={customer} onRefresh={handleRefresh} />;
      case 'goldLoan':
        return <GoldLoanTab customerId={customerId} onRefresh={handleRefresh} />;
      case 'loan':
        return <LoanTab customerId={customerId} onRefresh={handleRefresh} />;
      case 'udhari':
        return <UdhariTab customerId={customerId} onRefresh={handleRefresh} />;
      case 'goldTransaction':
        return <GoldTransactionTab customerId={customerId} onRefresh={handleRefresh} />;
      case 'silverTransaction':
        return <SilverTransactionTab customerId={customerId} onRefresh={handleRefresh} />;
      default:
        return <CustomerInfoTab customer={customer} onRefresh={handleRefresh} />;
    }
  };

  // Helper function to format customer address
  const getFormattedAddress = () => {
    if (typeof customer.address === 'string') {
      return customer.address;
    }
    if (customer.address && typeof customer.address === 'object') {
      const { street, city, state, pincode } = customer.address;
      return [street, city, state, pincode].filter(Boolean).join(', ');
    }
    return `${customer.city || ''}, ${customer.state || ''}`.replace(/^, |, $/, '');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.name || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A'}
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  {(customer.phone || customer.phoneNumber) && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone size={14} />
                      {customer.phone || customer.phoneNumber}
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Mail size={14} />
                      {customer.email}
                    </div>
                  )}
                  {getFormattedAddress() && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin size={14} />
                      {getFormattedAddress()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                customer.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {customer.status ? customer.status.charAt(0).toUpperCase() + customer.status.slice(1) : 'Active'}
              </span>
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <TrendingUp size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CustomerDetailView;
