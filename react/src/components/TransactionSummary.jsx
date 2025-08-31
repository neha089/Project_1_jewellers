// components/TransactionSummary.jsx - Enhanced Transaction Summary Component
import React from "react";
import { Target, User, DollarSign, Calendar, FileText, Coins, TrendingUp } from "lucide-react";

const TransactionSummary = ({
  selectedCategory,
  selectedCustomer,
  totalAmount,
  isGoldLoan,
  items,
  selectedLoanDetails,
  repaymentOptions,
  isInterestPayment,
  isRepayment
}) => {
  
  // Don't show summary if no meaningful data
  const shouldShowSummary = totalAmount > 0 || (isInterestPayment && selectedLoanDetails) || (isRepayment && repaymentOptions);
  
  if (!shouldShowSummary) return null;

  const renderBasicSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className={`w-10 h-10 bg-${selectedCategory.color}-100 rounded-lg flex items-center justify-center`}>
          <selectedCategory.icon size={18} className={`text-${selectedCategory.color}-600`} />
        </div>
        <div>
          <div className="text-xs text-gray-600">Transaction Type</div>
          <div className="font-medium text-gray-900">{selectedCategory.label}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <DollarSign size={18} className="text-blue-600" />
        </div>
        <div>
          <div className="text-xs text-gray-600">Amount</div>
          <div className="font-bold text-blue-600 text-lg">₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <User size={18} className="text-green-600" />
        </div>
        <div>
          <div className="text-xs text-gray-600">Customer</div>
          <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
          {selectedCustomer.phone && (
            <div className="text-xs text-gray-500">{selectedCustomer.phone}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGoldLoanSummary = () => {
    if (!isGoldLoan || !items?.length) return null;

    const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);
    const totalMarketValue = items.reduce((sum, item) => sum + (item.marketValue || 0), 0);
    const autoCalculatedItems = items.filter(item => item.autoCalculated).length;

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <h6 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
          <Coins size={16} />
          Gold Loan Details
        </h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded p-2 border border-yellow-200">
            <div className="text-xs text-yellow-700">Total Items</div>
            <div className="font-bold text-yellow-900">{items.length}</div>
          </div>
          <div className="bg-white rounded p-2 border border-yellow-200">
            <div className="text-xs text-yellow-700">Total Weight</div>
            <div className="font-bold text-yellow-900">{totalWeight.toFixed(1)}g</div>
          </div>
          <div className="bg-white rounded p-2 border border-yellow-200">
            <div className="text-xs text-yellow-700">Market Value</div>
            <div className="font-bold text-yellow-900">₹{totalMarketValue.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white rounded p-2 border border-yellow-200">
            <div className="text-xs text-yellow-700">Loan Amount</div>
            <div className="font-bold text-green-800">₹{totalAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
        {autoCalculatedItems > 0 && (
          <div className="mt-3 text-xs text-yellow-800 bg-yellow-100 rounded p-2">
            {autoCalculatedItems} of {items.length} items have auto-calculated amounts based on current gold prices.
            Loan-to-value ratio: 85%
          </div>
        )}
      </div>
    );
  };

  const renderLoanSummary = () => {
    if (!selectedLoanDetails) return null;

    const principal = selectedLoanDetails.principalPaise / 100;
    const outstanding = selectedLoanDetails.summary?.outstandingPrincipal / 100 || 0;
    const monthsActive = Math.ceil((Date.now() - new Date(selectedLoanDetails.startDate)) / (1000 * 60 * 60 * 24 * 30));

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h6 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <FileText size={16} />
          Selected Loan Information
        </h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-xs text-blue-700">Loan ID</div>
            <div className="font-mono text-blue-900">#{selectedLoanDetails._id.slice(-8)}</div>
          </div>
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-xs text-blue-700">Principal</div>
            <div className="font-bold text-blue-900">₹{principal.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-xs text-blue-700">Outstanding</div>
            <div className="font-bold text-red-700">₹{outstanding.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-xs text-blue-700">Active Since</div>
            <div className="font-medium text-blue-900">{monthsActive} months</div>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="text-blue-800">
            Interest Rate: <span className="font-medium">{selectedLoanDetails.interestRateMonthlyPct}% per month</span>
          </div>
          <div className="text-blue-800">
            Started: <span className="font-medium">{new Date(selectedLoanDetails.startDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderInterestPaymentSummary = () => {
    if (!isInterestPayment || !selectedLoanDetails) return null;

    const monthlyInterest = (selectedLoanDetails.principalPaise * selectedLoanDetails.interestRateMonthlyPct) / 10000;
    const paymentCoverage = (totalAmount / monthlyInterest) * 100;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
        <h6 className="font-medium text-green-900 mb-3 flex items-center gap-2">
          <TrendingUp size={16} />
          Interest Payment Analysis
        </h6>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="bg-white rounded p-2 border border-green-200">
            <div className="text-xs text-green-700">Monthly Interest</div>
            <div className="font-bold text-green-900">₹{monthlyInterest.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded p-2 border border-green-200">
            <div className="text-xs text-green-700">Payment Amount</div>
            <div className="font-bold text-blue-900">₹{totalAmount.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded p-2 border border-green-200">
            <div className="text-xs text-green-700">Coverage</div>
            <div className={`font-bold ${paymentCoverage >= 100 ? 'text-green-800' : 'text-yellow-800'}`}>
              {paymentCoverage.toFixed(0)}%
            </div>
          </div>
        </div>
        
        {paymentCoverage < 100 && (
          <div className="mt-3 text-xs text-yellow-800 bg-yellow-100 rounded p-2">
            This is a partial payment. Remaining: ₹{(monthlyInterest - totalAmount).toFixed(2)}
          </div>
        )}
        {paymentCoverage > 100 && (
          <div className="mt-3 text-xs text-green-800 bg-green-100 rounded p-2">
            This payment covers full monthly interest plus ₹{(totalAmount - monthlyInterest).toFixed(2)} extra
          </div>
        )}
      </div>
    );
  };

  const renderRepaymentSummary = () => {
    if (!isRepayment || !repaymentOptions) return null;

    const scenario = repaymentOptions.returnScenarios[0];
    const totalLoanValue = repaymentOptions.totalCurrentLoanValue;
    const excessAmount = scenario?.excessAmount / 100 || 0;

    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
        <h6 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
          <Coins size={16} />
          Repayment Summary
        </h6>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white rounded p-2 border border-purple-200">
            <div className="text-xs text-purple-700">Payment</div>
            <div className="font-bold text-purple-900">₹{totalAmount.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white rounded p-2 border border-purple-200">
            <div className="text-xs text-purple-700">Loan Value</div>
            <div className="font-bold text-blue-900">₹{totalLoanValue.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white rounded p-2 border border-purple-200">
            <div className="text-xs text-purple-700">Items to Return</div>
            <div className="font-bold text-purple-900">{scenario?.itemCount || 0}</div>
          </div>
          <div className="bg-white rounded p-2 border border-purple-200">
            <div className="text-xs text-purple-700">Excess Amount</div>
            <div className="font-bold text-green-800">₹{excessAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-purple-800 bg-purple-100 rounded p-2">
          Customer will receive back {scenario?.itemCount || 0} items and ₹{excessAmount.toFixed(2)} in cash
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
        <Target size={16} />
        Transaction Summary
      </h4>
      
      {renderBasicSummary()}
      {renderGoldLoanSummary()}
      {renderLoanSummary()}
      {renderInterestPaymentSummary()}
      {renderRepaymentSummary()}
    </div>
  )};
  export default TransactionSummary;
