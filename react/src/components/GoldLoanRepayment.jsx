import React, { useState, useEffect } from "react";
import { Check, X, Eye, Calculator, Package, Trash2 } from "lucide-react";
import ApiService from "../services/api";

const GoldLoanRepayment = ({ selectedLoan, currentGoldPrice, onRepayment }) => {
  const [loanItems, setLoanItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);

  useEffect(() => {
    if (selectedLoan) {
      loadLoanItems();
    }
  }, [selectedLoan]);

  const loadLoanItems = async () => {
    if (!selectedLoan?.items) return;

    // Calculate current market value for each item
    const itemsWithCurrentValue = selectedLoan.items.map(item => {
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
    const principalAmount = selectedLoan.principalPaise / 100;
    
    // Calculate outstanding interest
    const monthlyRate = selectedLoan.interestRateMonthlyPct / 100;
    const startDate = new Date(selectedLoan.startDate);
    const monthsDiff = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const outstandingInterest = principalAmount * monthlyRate * monthsDiff;

    const totalDue = principalAmount + outstandingInterest;
    const totalCredit = selectedValue + enteredAmount;
    const remaining = totalDue - totalCredit;

    return {
      selectedValue,
      enteredAmount,
      principalAmount,
      outstandingInterest,
      totalDue,
      totalCredit,
      remaining: Math.max(0, remaining),
      canClose: remaining <= 0,
    };
  };

  const handleRepayment = async () => {
    if (selectedItems.length === 0 && !paymentAmount) {
      alert("Please select items to return or enter a payment amount");
      return;
    }

    setLoading(true);
    try {
      const summary = calculateRepaymentSummary();
      
      // Process repayment
      const repaymentData = {
        loanId: selectedLoan._id,
        returnedItems: selectedItems,
        cashPayment: parseFloat(paymentAmount) || 0,
        summary: summary,
      };

      const response = await ApiService.processGoldLoanRepayment(repaymentData);
      
      if (response.success) {
        onRepayment();
      } else {
        throw new Error(response.message || "Repayment failed");
      }
    } catch (error) {
      console.error("Repayment failed:", error);
      alert(error.message || "Failed to process repayment");
    } finally {
      setLoading(false);
    }
  };

  const summary = calculateRepaymentSummary();

  return (
    <div className="space-y-6">
      {/* Loan Items Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Package size={18} />
            Gold Items in Loan ({loanItems.length})
          </h4>
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <Eye size={16} />
            {showItemDetails ? "Hide" : "Show"} Details
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loanItems.map((item) => (
            <div
              key={item._id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedItems.includes(item._id)
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
              onClick={() => toggleItemSelection(item._id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{item.name}</h5>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedItems.includes(item._id)
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300"
                }`}>
                  {selectedItems.includes(item._id) && <Check size={12} className="text-white" />}
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span>{item.weightGram}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purity:</span>
                  <span>{item.purityK}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Amount:</span>
                  <span>₹{item.originalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-medium text-green-600">
                    ₹{item.currentMarketValue.toFixed(2)}
                  </span>
                </div>
                
                {showItemDetails && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Appreciation:</span>
                      <span className={item.appreciation > 0 ? "text-green-600" : "text-red-600"}>
                        {item.appreciation > 0 ? "+" : ""}₹{item.appreciation.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">% Change:</span>
                      <span className={item.appreciationPct > 0 ? "text-green-600" : "text-red-600"}>
                        {item.appreciationPct > 0 ? "+" : ""}{item.appreciationPct.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </div>

              {item.images && item.images.length > 0 && (
                <div className="mt-2">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-20 object-cover rounded"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cash Payment Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Cash Payment (₹)
        </label>
        <input
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter cash payment amount (optional)"
          disabled={loading}
        />
      </div>

      {/* Repayment Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Calculator size={18} />
          Repayment Summary
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Principal Amount:</span>
              <span className="font-medium">₹{summary.principalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outstanding Interest:</span>
              <span className="font-medium text-orange-600">₹{summary.outstandingInterest.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium text-gray-700">Total Due:</span>
              <span className="font-bold text-red-600">₹{summary.totalDue.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Selected Items Value:</span>
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
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Remaining Balance:</span>
            <span className={`text-xl font-bold ${summary.remaining > 0 ? "text-red-600" : "text-green-600"}`}>
              {summary.remaining > 0 ? "₹" + summary.remaining.toFixed(2) : "PAID IN FULL"}
            </span>
          </div>
          
          {summary.canClose && (
            <div className="mt-2 p-3 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Check size={16} />
                <span className="font-medium">Loan can be closed with this payment</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Items Summary */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Items to Return ({selectedItems.length})</h5>
          <div className="space-y-2">
            {selectedItems.map(itemId => {
              const item = loanItems.find(i => i._id === itemId);
              if (!item) return null;
              
              return (
                <div key={itemId} className="flex justify-between items-center text-sm">
                  <span>{item.name} ({item.weightGram}g, {item.purityK}K)</span>
                  <span className="font-medium text-blue-700">₹{item.currentMarketValue.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setSelectedItems([]);
            setPaymentAmount("");
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          disabled={loading}
        >
          Reset
        </button>
        <button
          onClick={handleRepayment}
          disabled={loading || (selectedItems.length === 0 && !paymentAmount)}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Check size={16} />
          {loading ? "Processing..." : "Process Repayment"}
        </button>
      </div>
    </div>
  );
};

export default GoldLoanRepayment;