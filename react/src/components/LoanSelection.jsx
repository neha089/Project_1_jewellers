// components/LoanSelection.jsx - Fixed with Better API Integration
import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle, Coins, RefreshCw, Info } from "lucide-react";

const LoanSelection = ({
  availableLoans,
  loadingLoans,
  selectedLoanId,
  onLoanChange,
  errors,
  isInterestPayment,
  isRepayment,
  interestHistory,
  repaymentOptions,
  transactionData,
  setTransactionData
}) => {
  const [hoveredLoan, setHoveredLoan] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Enhanced Loan Tooltip Component with real-time data
  const LoanTooltip = ({ loan, isVisible }) => {
    if (!isVisible || !loan) return null;

    const principal = loan.principalPaise ? (loan.principalPaise / 100) : 0;
    const totalPaid = loan.summary?.totalPrincipalPaid ? (loan.summary.totalPrincipalPaid / 100) : 0;
    const outstanding = loan.summary?.outstandingPrincipal ? (loan.summary.outstandingPrincipal / 100) : (principal - totalPaid);
    const monthlyInterest = principal ? Math.round((principal * (loan.interestRateMonthlyPct || 2.5)) / 100) : 0;
    const activeItems = loan.items?.filter(item => !item.returnDate) || [];
    const returnedItems = loan.items?.filter(item => item.returnDate) || [];

    return (
      <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 mt-2 w-96 max-w-sm left-0">
        <div className="space-y-3">
          <div className="font-semibold text-gray-900 border-b pb-2">
            Loan #{loan._id?.slice(-8) || 'Unknown'}
          </div>
          
          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded p-2">
              <span className="text-xs text-blue-600">Principal Amount</span>
              <div className="font-semibold text-blue-900">₹{principal.toFixed(2)}</div>
            </div>
            <div className="bg-red-50 rounded p-2">
              <span className="text-xs text-red-600">Outstanding</span>
              <div className="font-semibold text-red-800">₹{outstanding.toFixed(2)}</div>
            </div>
            <div className="bg-green-50 rounded p-2">
              <span className="text-xs text-green-600">Interest Rate</span>
              <div className="font-semibold text-green-800">{loan.interestRateMonthlyPct || 2.5}%/month</div>
            </div>
            <div className="bg-yellow-50 rounded p-2">
              <span className="text-xs text-yellow-600">Monthly Interest</span>
              <div className="font-semibold text-yellow-800">₹{monthlyInterest}</div>
            </div>
          </div>
          
          {/* Items Summary for Gold Loans */}
          {loan.items && loan.items.length > 0 && (
            <div className="border-t pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-700">Items Summary</span>
                <span className="text-xs text-gray-500">
                  {activeItems.length} active, {returnedItems.length} returned
                </span>
              </div>
              
              {activeItems.length > 0 && (
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {activeItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="text-xs bg-gray-50 rounded p-2 flex justify-between">
                      <span className="font-medium">{item.name || 'Unnamed Item'}</span>
                      <span className="text-gray-600">
                        {item.weightGram || 0}g ({item.purityK || 22}K)
                      </span>
                    </div>
                  ))}
                  {activeItems.length > 4 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{activeItems.length - 4} more items
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Loan Timeline */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <div>Started: {new Date(loan.startDate).toLocaleDateString()}</div>
            {loan.dueDate && (
              <div>Due: {new Date(loan.dueDate).toLocaleDateString()}</div>
            )}
            <div className="mt-1">
              Status: <span className={`font-medium ${loan.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                {loan.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Interest Payment History Component
  const InterestPaymentHistory = ({ history }) => {
    if (!history) return null;

    const summary = history.summary || {};
    const recentPayments = history.interestHistory?.slice(0, 6) || [];
    const monthlyAmount = summary.monthlyInterestAmount || 0;
    const totalReceived = summary.totalInterestReceivedRupees || 0;
    const totalPending = summary.totalPendingInterestRupees || 0;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
          <Clock size={16} />
          Interest Payment Summary
          {loadingDetails && <RefreshCw size={14} className="animate-spin" />}
        </h5>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Monthly Interest</div>
            <div className="font-bold text-blue-900 text-lg">
              ₹{monthlyAmount.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="text-xs text-green-600 mb-1">Total Received</div>
            <div className="font-bold text-green-800 text-lg">
              ₹{totalReceived.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-red-100">
            <div className="text-xs text-red-600 mb-1">Pending Amount</div>
            <div className="font-bold text-red-700 text-lg">
              ₹{totalPending.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-100">
            <div className="text-xs text-gray-600 mb-1">Payment Status</div>
            <div className="font-bold text-gray-800 text-lg">
              {summary.paidMonths || 0}/{summary.totalMonths || 0}
            </div>
            <div className="text-xs text-gray-500">months</div>
          </div>
        </div>

        {/* Recent Payments */}
        {recentPayments.length > 0 ? (
          <div className="space-y-2">
            <div className="text-sm font-medium text-blue-800 flex items-center gap-2">
              Recent Payments:
              <Info size={14} className="text-blue-600" />
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {recentPayments.map((payment, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-100 hover:border-blue-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-blue-900">
                        {payment.monthName} {payment.year}
                      </span>
                      {payment.status === 'PAID' && (
                        <CheckCircle size={14} className="text-green-600" />
                      )}
                      {payment.status === 'PARTIAL' && (
                        <AlertCircle size={14} className="text-yellow-600" />
                      )}
                      {payment.status === 'PENDING' && (
                        <Clock size={14} className="text-red-600" />
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₹{((payment.interestPaid || 0) / 100).toFixed(2)}
                      </div>
                      {payment.remainingAmount > 0 && (
                        <div className="text-xs text-red-600">
                          Pending: ₹{(payment.remainingAmount / 100).toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                  {payment.payments && payment.payments.length > 0 && (
                    <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
                      Last payment: {new Date(payment.payments[0].date).toLocaleDateString()}
                      {payment.payments[0].notes && (
                        <span className="ml-2 italic">"{payment.payments[0].notes}"</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle size={16} />
              <span className="text-sm">No interest payment history found</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Enhanced Repayment Options Component
  const RepaymentOptionsDisplay = ({ options }) => {
    if (!options || !options.returnScenarios?.length) return null;

    const recommendedScenario = options.returnScenarios[0];
    const allItems = options.allItems || [];
    const hasCustomSelection = transactionData.selectedItems.length > 0;

    // Calculate selected items value
    const selectedItemsValue = hasCustomSelection 
      ? allItems
          .filter(item => transactionData.selectedItems.includes(item.itemId))
          .reduce((sum, item) => sum + item.currentValueRupees, 0)
      : 0;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
          <Coins size={16} />
          Repayment Analysis
          {loadingDetails && <RefreshCw size={14} className="animate-spin" />}
        </h5>
        
        {/* Loan Value Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg p-3 border border-green-100">
            <div className="text-xs text-green-600 mb-1">Payment Amount</div>
            <div className="font-bold text-green-900 text-lg">
              ₹{(options.repaymentAmount || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="text-xs text-blue-600 mb-1">Current Loan Value</div>
            <div className="font-bold text-blue-900 text-lg">
              ₹{(options.totalCurrentLoanValue || 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-purple-100">
            <div className="text-xs text-purple-600 mb-1">Active Items</div>
            <div className="font-bold text-purple-900 text-lg">
              {allItems.length}
            </div>
            <div className="text-xs text-purple-500">items</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-orange-100">
            <div className="text-xs text-orange-600 mb-1">Total Weight</div>
            <div className="font-bold text-orange-900 text-lg">
              {allItems.reduce((sum, item) => sum + (item.weightGram || 0), 0).toFixed(1)}
            </div>
            <div className="text-xs text-orange-500">grams</div>
          </div>
        </div>

        {/* Recommended Scenario */}
        {recommendedScenario && (
          <div className="bg-white border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium text-green-800">Recommended Return</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                Best Option
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div className="bg-green-50 rounded p-2">
                <span className="text-green-700 font-medium">Items to Return:</span>
                <div className="font-bold text-green-900">{recommendedScenario.itemCount} items</div>
              </div>
              <div className="bg-green-50 rounded p-2">
                <span className="text-green-700 font-medium">Excess Amount:</span>
                <div className="font-bold text-green-900">
                  ₹{((recommendedScenario.excessAmount || 0) / 100).toFixed(2)}
                </div>
              </div>
            </div>
            
            {recommendedScenario.items?.length > 0 && (
              <div>
                <div className="text-xs text-green-700 mb-2 font-medium">Items to be returned:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {recommendedScenario.items.map((item, idx) => (
                    <div key={idx} className="text-xs bg-green-50 rounded-lg p-2 flex justify-between items-center hover:bg-green-100 transition-colors">
                      <div className="flex-1">
                        <span className="font-medium text-green-900">{item.name || 'Unnamed Item'}</span>
                        <div className="text-green-700">
                          {item.weightGram}g, {item.purityK}K
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-900">₹{((item.currentValuePaise || 0) / 100).toFixed(2)}</div>
                        {item.originalValuePaise !== item.currentValuePaise && (
                          <div className="text-xs text-gray-600">
                            (Was: ₹{((item.originalValuePaise || 0) / 100).toFixed(2)})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Item Selection */}
        {allItems.length > 0 && (
          <div className="border-t border-green-200 pt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium text-green-800">
                Select specific items to return:
              </div>
              {hasCustomSelection && (
                <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Selected: ₹{selectedItemsValue.toFixed(2)}
                </div>
              )}
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {allItems.map((item, idx) => {
                const isSelected = transactionData.selectedItems.includes(item.itemId);
                const currentValue = item.currentValueRupees || 0;
                const priceChange = item.priceChangeRupees || 0;
                
                return (
                  <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
                      : 'bg-white border-gray-200 hover:bg-green-50 hover:border-green-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const itemId = item.itemId;
                        if (e.target.checked) {
                          setTransactionData(prev => ({
                            ...prev,
                            selectedItems: [...prev.selectedItems, itemId]
                          }));
                        } else {
                          setTransactionData(prev => ({
                            ...prev,
                            selectedItems: prev.selectedItems.filter(id => id !== itemId)
                          }));
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {item.name || 'Unnamed Item'}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.weightGram}g, {item.purityK}K
                        {item.pledgedDate && (
                          <span className="ml-2">
                            • Pledged: {new Date(item.pledgedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
                        ₹{currentValue.toFixed(2)}
                      </div>
                      {Math.abs(priceChange) > 0.01 && (
                        <div className={`text-xs font-medium ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceChange > 0 ? '+' : ''}₹{priceChange.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            
            {hasCustomSelection && (
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-800">
                {transactionData.selectedItems.length} item(s) selected • 
                Total value: ₹{selectedItemsValue.toFixed(2)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Loading state for loan selection
  if (loadingLoans) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="text-center text-gray-500 text-sm">Loading available loans...</div>
      </div>
    );
  }

  // No loans available
  if (availableLoans.length === 0) {
    return (
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Loan *
        </label>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">
              No active loans found for this customer
            </span>
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            {isInterestPayment && "Interest payments can only be made on active loans."}
            {isRepayment && "Repayments can only be made on active loans."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Loan *
          <span className="text-xs text-gray-500 ml-2">
            ({availableLoans.length} active loan{availableLoans.length > 1 ? 's' : ''} • Hover for details)
          </span>
        </label>
        
        <div className="relative">
          <select
            name="selectedLoanId"
            value={selectedLoanId}
            onChange={(e) => onLoanChange(e.target.value)}
            onMouseEnter={(e) => {
              if (e.target.value) {
                const loan = availableLoans.find(l => l._id === e.target.value);
                setHoveredLoan(loan);
              }
            }}
            onMouseLeave={() => setHoveredLoan(null)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              errors.selectedLoanId ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
            }`}
            disabled={loading}
          >
            <option value="">Choose a loan...</option>
            {availableLoans.map((loan) => {
              const principal = loan.principalPaise ? (loan.principalPaise / 100) : 0;
              const outstanding = loan.summary?.outstandingPrincipal ? 
                (loan.summary.outstandingPrincipal / 100) : principal;
              const activeItems = loan.items?.filter(item => !item.returnDate) || [];
              
              return (
                <option key={loan._id} value={loan._id}>
                  Loan #{loan._id.slice(-6)} • ₹{principal.toFixed(0)} 
                  (Outstanding: ₹{outstanding.toFixed(0)}) • {activeItems.length} item{activeItems.length !== 1 ? 's' : ''}
                </option>
              );
            })}
          </select>
          
          {hoveredLoan && (
            <LoanTooltip loan={hoveredLoan} isVisible={true} />
          )}
        </div>
        
        {errors.selectedLoanId && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.selectedLoanId}
          </p>
        )}
        {errors.loans && (
          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
            <AlertCircle size={12} />
            {errors.loans}
          </p>
        )}
      </div>

      {/* Show Interest Payment History */}
      {isInterestPayment && interestHistory && (
        <InterestPaymentHistory history={interestHistory} />
      )}

      {/* Show Repayment Options */}
      {isRepayment && repaymentOptions && (
        <RepaymentOptionsDisplay options={repaymentOptions} />
      )}
    </div>
  );
};

export default LoanSelection;