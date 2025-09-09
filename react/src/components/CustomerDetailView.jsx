import { useState, useEffect } from "react";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, IndianRupee, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import CustomerInfoTab from "./CustomerInfoTab";
import GoldLoanTab from "./GoldLoanTab";
import LoanTab from "./LoanTab";
import UdhariTab from "./UdhariTab";
import GoldTransactionTab from "./GoldTransactionTab";
import SilverTransactionTab from "./SilverTransactionTab";
// import ApiService from "../services/api.js";

const CustomerDetailView = ({ customerId, onBack }) => {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [transactionData, setTransactionData] = useState({
    goldLoans: [],
    loans: [],
    udhari: [],
    goldTransactions: [],
    silverTransactions: []
  });

  // Tab configuration
  const tabs = [
    { id: 'info', label: 'Customer Info', icon: User },
    { id: 'goldLoan', label: 'Gold Loans', icon: TrendingUp, count: transactionData.goldLoans.length },
    { id: 'loan', label: 'Loans', icon: IndianRupee, count: transactionData.loans.length },
    { id: 'udhari', label: 'Udhari', icon: Calendar, count: transactionData.udhari.length },
    { id: 'goldTransaction', label: 'Gold Buy/Sell', icon: TrendingUp, count: transactionData.goldTransactions.length },
    { id: 'silverTransaction', label: 'Silver Buy/Sell', icon: TrendingUp, count: transactionData.silverTransactions.length }
  ];

  // Load customer data
  const loadCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, using dummy data - replace with actual API calls
      const dummyCustomer = {
        _id: customerId,
        name: "Neha Sharma",
        phone: "9866543210",
        email: "neha@example.com",
        address: {
          street: "123 Main St",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001"
        },
        adhaarNumber: "123456789000",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        totalAmountTakenFromJewellers: 500000,
        totalAmountTakenByUs: 300000,
        status: "active",
        createdAt: "2025-08-27T12:48:46.273Z",
        updatedAt: "2025-08-27T12:48:46.273Z"
      };

      // Dummy transaction data
      const dummyTransactionData = {
        goldLoans: [
          {
            id: '1',
            amount: 50000,
            interestRate: 1.5,
            startDate: '2024-01-15',
            dueDate: '2024-07-15',
            status: 'active',
            goldWeight: 25,
            goldPurity: '22K',
            interestPaid: 15000,
            principalPaid: 10000,
            remainingAmount: 40000,
            payments: [
              { date: '2024-02-15', type: 'interest', amount: 5000 },
              { date: '2024-03-15', type: 'interest', amount: 5000 },
              { date: '2024-04-15', type: 'principal', amount: 10000 }
            ]
          },
          {
            id: '2',
            amount: 75000,
            interestRate: 1.5,
            startDate: '2024-03-01',
            dueDate: '2024-09-01',
            status: 'active',
            goldWeight: 35,
            goldPurity: '18K',
            interestPaid: 7500,
            principalPaid: 0,
            remainingAmount: 75000,
            payments: [
              { date: '2024-04-01', type: 'interest', amount: 3750 },
              { date: '2024-05-01', type: 'interest', amount: 3750 }
            ]
          }
        ],
        loans: [
          {
            id: '1',
            amount: 25000,
            interestRate: 2,
            startDate: '2024-02-01',
            dueDate: '2024-08-01',
            status: 'completed',
            purpose: 'Business',
            collateral: 'Property Documents',
            totalPaid: 25000,
            interestPaid: 3000
          }
        ],
        udhari: [
          {
            id: '1',
            amount: 5000,
            date: '2024-08-15',
            description: 'Emergency cash',
            status: 'pending',
            dueDate: '2024-09-15'
          },
          {
            id: '2',
            amount: 2000,
            date: '2024-08-20',
            description: 'Medical expenses',
            status: 'paid',
            paidDate: '2024-08-25'
          }
        ],
        goldTransactions: [
          {
            id: '1',
            type: 'buy',
            weight: 10,
            purity: '22K',
            rate: 6000,
            amount: 60000,
            date: '2024-07-15',
            invoiceNumber: 'GB001'
          },
          {
            id: '2',
            type: 'sell',
            weight: 5,
            purity: '18K',
            rate: 5800,
            amount: 29000,
            date: '2024-08-10',
            invoiceNumber: 'GS001'
          }
        ],
        silverTransactions: [
          {
            id: '1',
            type: 'buy',
            weight: 100,
            rate: 80,
            amount: 8000,
            date: '2024-06-20',
            invoiceNumber: 'SB001'
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setCustomer(dummyCustomer);
      setTransactionData(dummyTransactionData);

      // Real API calls (uncomment when available)
      /*
      const customerResponse = await ApiService.getCustomerById(customerId);
      if (customerResponse.success) {
        setCustomer(customerResponse.data);
      }

      // Load all transaction data
      const [goldLoansRes, loansRes, udhariRes, goldTransRes, silverTransRes] = await Promise.all([
        ApiService.getGoldLoansByCustomer(customerId),
        ApiService.getLoansByCustomer(customerId),
        ApiService.getUdhariByCustomer(customerId),
        ApiService.getGoldTransactionsByCustomer(customerId),
        ApiService.getSilverTransactionsByCustomer(customerId)
      ]);

      setTransactionData({
        goldLoans: goldLoansRes.success ? goldLoansRes.data : [],
        loans: loansRes.success ? loansRes.data : [],
        udhari: udhariRes.success ? udhariRes.data : [],
        goldTransactions: goldTransRes.success ? goldTransRes.data : [],
        silverTransactions: silverTransRes.success ? silverTransRes.data : []
      });
      */

    } catch (error) {
      console.error('Error loading customer data:', error);
      setError(error.message || 'Failed to load customer data');
    } finally {
      setLoading(false);
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
        return <GoldLoanTab goldLoans={transactionData.goldLoans} customerId={customerId} onRefresh={handleRefresh} />;
      case 'loan':
        return <LoanTab loans={transactionData.loans} customerId={customerId} onRefresh={handleRefresh} />;
      case 'udhari':
        return <UdhariTab udhari={transactionData.udhari} customerId={customerId} onRefresh={handleRefresh} />;
      case 'goldTransaction':
        return <GoldTransactionTab transactions={transactionData.goldTransactions} customerId={customerId} onRefresh={handleRefresh} />;
      case 'silverTransaction':
        return <SilverTransactionTab transactions={transactionData.silverTransactions} customerId={customerId} onRefresh={handleRefresh} />;
      default:
        return <CustomerInfoTab customer={customer} onRefresh={handleRefresh} />;
    }
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
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Phone size={14} />
                    {customer.phone}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Mail size={14} />
                    {customer.email}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin size={14} />
                    {customer.city}, {customer.state}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                customer.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
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
                  {tab.count !== undefined && (
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
