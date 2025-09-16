import React, { useState, useEffect } from "react";
import { Check, X, Eye, Calculator, Package, AlertCircle, DollarSign } from "lucide-react";
import ApiService from "../services/api";

const GoldLoanRepayment = ({ selectedLoan, currentGoldPrice, onSuccess, onCancel }) => {
  const [loanItems, setLoanItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedLoan) {
      loadLoanItems();
    }
  }, [selectedLoan]);

  const loadLoanItems = async () => {
    if (!selectedLoan?.items) return;

    // Filter only unreturned items and calculate current market value
    const unreturnedItems = selectedLoan.items.filter(item => !item.returnDate);
    
    const itemsWithCurrentValue = unreturnedItems.map(item => {
      const currentValue = currentGoldPrice 
        ? (item.weightGram * (item.purityK / 24) * currentGoldPrice.pricePerGram)
        : item.amountPaise / 100;

      return {
        ...item,
        originalAmount: item.amountPaise / 100,
        currentMarketValue: currentValue,
        appreciation: currentValue - (item.amountPaise / 100),
        appreciationPct: ((currentValue - (item.amountPaise / 100)) / (item.amountPaise / 100)) * 100,
      };
    });

    setLoanItems(itemsWithCurrentValue);
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(itemId);
      if (isSelected) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
    // Clear errors when user makes selection
    if (errors.selection) {
      setErrors(prev => ({ ...prev, selection: null }));
    }
  };

  const selectAllItems = () => {
    setSelectedItems(loanItems.map(item => item._id));
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const calculateSelectedValue = () => {
    return selectedItems.reduce((total, itemId) => {
      const item = loanItems.find(i => i._id === itemId);
      return total + (item?.currentMarketValue || 0);
    }, 0);
  };

  const calculateRepaymentSummary = () => {
    const selectedValue = calculateSelectedValue();
    const enteredAmount = parseFloat(paymentAmount) || 0;
    const currentPrincipal = selectedLoan.currentPrincipalPaise ? 
      selectedLoan.currentPrincipalPaise / 100 : 
      selectedLoan.principalPaise / 100;
    
    // Calculate outstanding interest
    const monthlyRate = selectedLoan.interestRateMonthlyPct / 100;
    const startDate = new Date(selectedLoan.startDate);
    const monthsDiff = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const outstandingInterest = currentPrincipal * monthlyRate * monthsDiff;

    const totalDue = currentPrincipal + outstandingInterest;
    const totalCredit = selectedValue + enteredAmount;
    const remaining = Math.max(0, totalDue - totalCredit);
    const excess = Math.max(0, totalCredit - totalDue);

    // Payment allocation (interest first, then principal)
    const interestPayment = Math.min(enteredAmount, outstandingInterest);
    const principalPayment = Math.max(0, enteredAmount - interestPayment);

    return {
      selectedValue,
      enteredAmount,
      currentPrincipal,
      outstandingInterest,
      totalDue,
      totalCredit,
      remaining,
      excess,
      interestPayment,
      principalPayment,
      canClose: remaining <= 0,
      monthsDiff,
      selectedItemsCount: selectedItems.length,
      totalItemsCount: loanItems.length,
      selectedItems
    };
  };

  const validateRepayment = () => {
    const newErrors = {};
    const summary = calculateRepaymentSummary();
    
    if (selectedItems.length === 0 && (!paymentAmount || parseFloat(paymentAmount) <= 0)) {
      newErrors.selection = "Please select items to return or enter a payment amount";
    }

    if (paymentAmount && parseFloat(paymentAmount) < 0) {
      newErrors.amount = "Payment amount cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRepayment = async () => {
    if (!validateRepayment()) {
      return;
    }

    setLoading(true);
    try {
      const summary = calculateRepaymentSummary();
      
      // Use the correct API call that matches your backend
      const response = await ApiService.processGoldLoanRepayment({
        loanId: selectedLoan._id,
        selectedItemIds: selectedItems,
        cashPayment: parseFloat(paymentAmount) || 0,
        notes: `${selectedItems.length > 0 ? `Items returned: ${selectedItems.length}` : ''}${paymentAmount ? ` | Cash payment: ₹${paymentAmount}` : ''}`,
        autoSelectItems: false,
        photos: [],
        summary: summary
      });
      
      if (response.success) {
        console.log('Repayment successful:', response);
        onSuccess(response);
      } else {
        throw new Error(response.error || response.message || "Repayment failed");
      }
    } catch (error) {
      console.error("Repayment failed:", error);
      setErrors({ 
        submit: error.message || "Failed to process repayment. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedItems([]);
    setPaymentAmount("");
    setErrors({});
  };

  if (!selectedLoan) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package size={48} className="mx-auto mb-4 opacity-50" />
        <p>Please select a gold loan first</p>
      </div>
    );
  }

  if (loanItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package size={48} className="mx-auto mb-4 opacity-50" />
        <p>No items available for return</p>
        <p className="text-sm mt-2">All items have already been returned</p>
      </div>
    );
  }

  const summary = calculateRepaymentSummary();

  return (
    <div className="space-y-6">
      {/* Error Messages */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-700 font-medium">Payment Failed</p>
            <p className="text-red-600 text-sm mt-1">{errors.submit}</p>
          </div>
        </div>
      )}

      {errors.selection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-700">{errors.selection}</p>
        </div>
      )}

      {/* Loan Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Loan Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Current Principal:</span>
            <div className="font-semibold">₹{summary.currentPrincipal.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-blue-600">Outstanding Interest:</span>
            <div className="font-semibold text-orange-600">₹{summary.outstandingInterest.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-blue-600">Total Due:</span>
            <div className="font-bold text-red-600">₹{summary.totalDue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Gold Items Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Package size={18} />
            Available Gold Items ({loanItems.length})
          </h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowItemDetails(!showItemDetails)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
            >
              <Eye size={16} />
              {showItemDetails ? "Hide" : "Show"} Details
            </button>
            <button
              onClick={selectAllItems}
              className="text-green-600 hover:text-green-800 text-sm px-2 py-1 border border-green-300 rounded"
              disabled={loading}
            >
              Select All
            </button>
            <button
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 border border-gray-300 rounded"
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loanItems.map((item) => (
            <div
              key={item._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedItems.includes(item._id)
                  ? "border-green-500 bg-green-50 ring-2 ring-green-200"
                  : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => !loading && toggleItemSelection(item._id)}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900 truncate">{item.name}</h5>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  selectedItems.includes(item._id)
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}>
                  {selectedItems.includes(item._id) && <Check size={12} className="text-white" />}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-medium">{item.weightGram}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purity:</span>
                  <span className="font-medium">{item.purityK}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Value:</span>
                  <span className="text-gray-700">₹{item.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-bold text-green-600">
                    ₹{item.currentMarketValue.toFixed(2)}
                  </span>
                </div>
                
                {showItemDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Appreciation:</span>
                      <span className={item.appreciation > 0 ? "text-green-600 font-medium" : "text-red-600"}>
                        {item.appreciation > 0 ? "+" : ""}₹{item.appreciation.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">% Change:</span>
                      <span className={`font-medium ${item.appreciationPct > 0 ? "text-green-600" : "text-red-600"}`}>
                        {item.appreciationPct > 0 ? "+" : ""}{item.appreciationPct.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              {item.images && item.images.length > 0 && (
                <div className="mt-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-24 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cash Payment Input */}
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <DollarSign size={16} />
          Additional Cash Payment
        </label>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                setPaymentAmount(e.target.value);
                if (errors.amount) {
                  setErrors(prev => ({ ...prev, amount: null }));
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter cash payment amount (optional)"
              disabled={loading}
              min="0"
              step="0.01"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">For interest payment</div>
            <div className="text-xs text-gray-500">₹{summary.outstandingInterest.toFixed(2)} due</div>
          </div>
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-3">Items Selected for Return ({selectedItems.length})</h5>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedItems.map(itemId => {
              const item = loanItems.find(i => i._id === itemId);
              if (!item) return null;
              
              return (
                <div key={itemId} className="flex justify-between items-center text-sm bg-white rounded p-2">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-right">
                    <div>{item.weightGram}g, {item.purityK}K</div>
                    <div className="font-semibold text-green-600">₹{item.currentMarketValue.toFixed(2)}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <div className="flex justify-between items-center font-semibold text-green-800">
              <span>Total Items Value:</span>
              <span>₹{summary.selectedValue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Repayment Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calculator size={18} />
          Repayment Summary
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h5 className="font-medium text-gray-700 border-b pb-2">Payment Details</h5>
            <div className="flex justify-between">
              <span className="text-gray-600">Items Value:</span>
              <span className="font-medium text-green-600">₹{summary.selectedValue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cash Payment:</span>
              <span className="font-medium">₹{summary.enteredAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium text-gray-700">Total Credit:</span>
              <span className="font-bold text-green-600">₹{summary.totalCredit.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-700 border-b pb-2">Outstanding</h5>
            <div className="flex justify-between">
              <span className="text-gray-600">Principal:</span>
              <span className="font-medium">₹{summary.currentPrincipal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interest:</span>
              <span className="font-medium text-orange-600">₹{summary.outstandingInterest.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium text-gray-700">Total Due:</span>
              <span className="font-bold text-red-600">₹{summary.totalDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Final Status */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-gray-700">Final Status:</span>
            <span className={`text-xl font-bold ${summary.remaining > 0 ? "text-red-600" : summary.excess > 0 ? "text-blue-600" : "text-green-600"}`}>
              {summary.remaining > 0 
                ? `₹${summary.remaining.toFixed(2)} REMAINING` 
                : summary.excess > 0 
                  ? `₹${summary.excess.toFixed(2)} EXCESS`
                  : "FULLY PAID"}
            </span>
          </div>
          
          {summary.canClose && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Check size={16} />
                <span className="font-medium">
                  {summary.selectedItemsCount === summary.totalItemsCount 
                    ? "All items will be returned - Loan will be COMPLETED" 
                    : "Loan can be closed with this payment"}
                </span>
              </div>
            </div>
          )}

          {summary.excess > 0 && (
            <div className="mt-2 p-3 bg-blue-100 border border-blue-300 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <AlertCircle size={16} />
                <span className="font-medium">
                  Excess amount of ₹{summary.excess.toFixed(2)} will be recorded
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={resetForm}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Reset
        </button>
        <button
          onClick={handleRepayment}
          disabled={loading || (selectedItems.length === 0 && !paymentAmount)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Check size={18} />
          {loading ? "Processing..." : `Process Repayment (₹${summary.totalCredit.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
};

export default GoldLoanRepayment;
