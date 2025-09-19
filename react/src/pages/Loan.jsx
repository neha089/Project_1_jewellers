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
  Percent,
  Building
} from 'lucide-react';
import ApiService from '../services/api.js';
import AddLoanModal from '../components/Loan/AddLoanModal';
import LoanCard from '../components/Loan/LoanCard';
import LoanDetailModal from '../components/Loan/LoanDetailModal';
import LoanPaymentModal from '../components/Loan/LoanPaymentModal';
import LInterstPaymentModal from '../components/Loan/LInterestPaymentModal';
import CustomerSearch from '../components/CustomerSearch.jsx';

const Loan = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receivableLoans, setReceivableLoans] = useState([]);
  const [payableLoans, setPayableLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError(null);

      const [receivableResponse, payableResponse] = await Promise.all([
        ApiService.getOutstandingToCollectLoan(),
        ApiService.getOutstandingToPayLoan()
      ]);

      if (receivableResponse.success) {
        const receivableData = receivableResponse.data.customerWise.map(item => ({
          customer: item.customer,
          totalOutstanding: item.totalOutstanding,
          interestDue: item.interestDue || 0,
          loans: item.loans || [],
          type: 'receivable'
        }));
        setReceivableLoans(receivableData);
      }

      if (payableResponse.success) {
        const payableData = payableResponse.data.customerWise.map(item => ({
          customer: item.customer,
          totalOutstanding: item.totalOutstanding,
          interestDue: item.interestDue || 0,
          loans: item.loans || [],
          type: 'payable'
        }));
        setPayableLoans(payableData);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      setError('Failed to load loan data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLoanSuccess = () => {
    loadLoans();
  };

  const handleViewLoan = (loan) => {
    setSelectedLoan(loan);
    setShowDetailModal(true);
  };
const handlePrincipalPayment = (loan) => {
    if (loan && loan._id) {
      setSelectedLoan(loan);
      setShowPaymentModal(true);
    } else {
      console.error('Invalid loan for principal payment:', loan);
      setError('Cannot process payment: Invalid loan data');
    }
  };

  const handleInterestPayment = (loan) => {
    if (loan && loan._id) {
      setSelectedLoan(loan);
      setShowInterestModal(true);
    } else {
      console.error('Invalid loan for interest payment:', loan);
      setError('Cannot process payment: Invalid loan data');
    }
  };

  const handlePaymentSuccess = () => {
    loadLoans();
    setShowPaymentModal(false);
    setShowInterestModal(false);
    setShowDetailModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filterLoans = (loans) => {
    if (!searchTerm) return loans;
    return loans.filter(loan =>
      loan.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.customer?.phone?.includes(searchTerm)
    );
  };

  const filteredReceivableLoans = filterLoans(receivableLoans);
  const filteredPayableLoans = filterLoans(payableLoans);

  const totalToCollect = receivableLoans.reduce((sum, loan) => sum + loan.totalOutstanding, 0);
  const totalToPay = payableLoans.reduce((sum, loan) => sum + loan.totalOutstanding, 0);
  const totalInterestDue = [...receivableLoans, ...payableLoans].reduce((sum, loan) => sum + (loan.interestDue || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Loan Management</h1>
            <p className="text-slate-600">Manage loans, track payments, and monitor interest</p>
          </div>
          <button
            onClick={() => setShowAddLoanModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg"
          >
            <Plus size={20} />
            Add Loan
          </button>
        </div>

        <div className="flex flex-row flex-wrap gap-6 mb-8">
          <div className="flex-1 min-w-[250px] max-w-[25%] bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">To Collect</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalToCollect)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">{filteredReceivableLoans.length} customers</p>
          </div>

          <div className="flex-1 min-w-[250px] max-w-[25%] bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingDown size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">To Pay</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalToPay)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">{filteredPayableLoans.length} customers</p>
          </div>

          <div className="flex-1 min-w-[250px] max-w-[25%] bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Percent size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Interest Due</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalInterestDue)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Pending interest payments</p>
          </div>

          <div className="flex-1 min-w-[250px] max-w-[25%] bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <DollarSign size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Net Balance</p>
                <p className={`text-2xl font-bold ${(totalToCollect - totalToPay) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalToCollect - totalToPay)}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500">Overall position</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
              <CustomerSearch
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onCustomerSelect={(customer) => {
                  console.log("Selected customer:", customer);
                }}
                onCreateCustomer={() => {
                  console.log("Create new customer clicked");
                }}
              />
            </div>
          <button
            onClick={loadLoans}
            className="p-3 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={20} className={`text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('receivable')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'receivable'
                ? 'bg-red-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            To Collect ({filteredReceivableLoans.length})
          </button>
          <button
            onClick={() => setActiveTab('payable')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'payable'
                ? 'bg-green-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            To Pay ({filteredPayableLoans.length})
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
              <p className="text-slate-500 mt-4">Loading loans...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-red-600 mt-4">{error}</p>
              <button
                onClick={loadLoans}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {filteredReceivableLoans.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center">
                          <TrendingUp size={14} className="text-red-600" />
                        </div>
                        To Collect ({filteredReceivableLoans.length})
                      </h2>
                      <div className="flex flex-row flex-wrap gap-4">
                        {filteredReceivableLoans.map((loan, index) => (
                          <div key={`receivable-${index}`} className="flex-1 min-w-[250px] max-w-[33.33%]">
                            <LoanCard
                              loan={loan}
                              type="receivable"
                              onView={() => handleViewLoan(loan)}
                              onPrincipalPayment={() => handlePrincipalPayment(loan.loans[0])}
                              onInterestPayment={() => handleInterestPayment(loan.loans[0])}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredPayableLoans.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                          <TrendingDown size={14} className="text-green-600" />
                        </div>
                        To Pay ({filteredPayableLoans.length})
                      </h2>
                      <div className="flex flex-row flex-wrap gap-4">
                        {filteredPayableLoans.map((loan, index) => (
                          <div key={`payable-${index}`} className="flex-1 min-w-[250px] max-w-[33.33%]">
                            <LoanCard
                              loan={loan}
                              type="payable"
                              onView={() => handleViewLoan(loan)}
                              onPrincipalPayment={() => handlePrincipalPayment(loan.loans[0])}
                              onInterestPayment={() => handleInterestPayment(loan.loans[0])}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filteredReceivableLoans.length === 0 && filteredPayableLoans.length === 0 && (
                    <div className="text-center py-12">
                      <Building size={48} className="text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Loans Found</h3>
                      <p className="text-slate-500 mb-6">Start by adding your first loan transaction</p>
                      <button
                        onClick={() => setShowAddLoanModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <Plus size={18} className="inline mr-2" />
                        Add Your First Loan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'receivable' && (
                <div className="space-y-4">
                  {filteredReceivableLoans.length > 0 ? (
                    <div className="flex flex-row flex-wrap gap-4">
                      {filteredReceivableLoans.map((loan, index) => (
                        <div key={`receivable-${index}`} className="flex-1 min-w-[250px] max-w-[33.33%]">
                          <LoanCard
                            loan={loan}
                            type="receivable"
                            onView={() => handleViewLoan(loan)}
                            onPrincipalPayment={() => handlePrincipalPayment(loan.loans[0])}
                            onInterestPayment={() => handleInterestPayment(loan.loans[0])}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingUp size={48} className="text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Receivable Loans</h3>
                      <p className="text-slate-500">No loans to collect from customers</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'payable' && (
                <div className="space-y-4">
                  {filteredPayableLoans.length > 0 ? (
                    <div className="flex flex-row flex-wrap gap-4">
                      {filteredPayableLoans.map((loan, index) => (
                        <div key={`payable-${index}`} className="flex-1 min-w-[250px] max-w-[33.33%]">
                          <LoanCard
                            loan={loan}
                            type="payable"
                            onView={() => handleViewLoan(loan)}
                            onPrincipalPayment={() => handlePrincipalPayment(loan.loans[0])}
                            onInterestPayment={() => handleInterestPayment(loan.loans[0])}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <TrendingDown size={48} className="text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payable Loans</h3>
                      <p className="text-slate-500">No loans to pay to customers</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <AddLoanModal
          isOpen={showAddLoanModal}
          onClose={() => setShowAddLoanModal(false)}
          onSuccess={handleAddLoanSuccess}
        />

        <LoanDetailModal
          isOpen={showDetailModal}
          loanData={selectedLoan}
          loanType={selectedLoan?.type}
          onClose={() => setShowDetailModal(false)}
          onPrincipalPayment={() => {
            setShowDetailModal(false);
            handlePrincipalPayment(selectedLoan?.loans[0]);
          }}
          onInterestPayment={() => {
            setShowDetailModal(false);
            handleInterestPayment(selectedLoan?.loans[0]);
          }}
        />

        <LoanPaymentModal
          isOpen={showPaymentModal}
          loan={selectedLoan}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />

        <LInterstPaymentModal
          isOpen={showInterestModal}
          loan={selectedLoan}
          onClose={() => setShowInterestModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};

export default Loan;