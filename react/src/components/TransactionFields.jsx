// components/TransactionFields.jsx
import React from "react";
import { Calendar, DollarSign, FileText, Percent, Clock } from "lucide-react";

const TransactionFields = ({
  transactionData,
  onChange,
  errors,
  loading,
  selectedCategory,
  selectedLoanDetails,
  repaymentOptions,
  isGoldTransaction,
  isLoanTransaction,
  isInterestPayment,
  isRepayment,
  isGoldLoan
}) => {

  const renderAmountField = () => {
    // Don't show amount field for gold loans (handled by items manager)
    if (isGoldLoan) return null;

    let placeholder = "Enter amount";
    let helpText = "";

    if (isInterestPayment && selectedLoanDetails) {
      const monthlyInterest = selectedLoanDetails.principalPaise ? 
        (selectedLoanDetails.principalPaise * selectedLoanDetails.interestRateMonthlyPct) / 10000 : 0;
      placeholder = `Monthly interest: ₹${monthlyInterest.toFixed(2)}`;
      helpText = "Enter the interest amount received";
    } else if (isRepayment && selectedLoanDetails) {
      const outstanding = selectedLoanDetails.summary?.outstandingPrincipal || 0;
      placeholder = `Outstanding: ₹${(outstanding / 100).toFixed(2)}`;
      helpText = "Enter repayment amount";
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <DollarSign size={14} />
          Amount (₹) *
        </label>
        <input
          type="number"
          name="amount"
          step="0.01"
          min="1"
          max="10000000"
          value={transactionData.amount}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.amount ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
          }`}
          placeholder={placeholder}
          disabled={loading}
        />
        {helpText && (
          <p className="text-xs text-gray-600 mt-1">{helpText}</p>
        )}
        {errors.amount && (
          <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
        )}
      </div>
    );
  };

  const renderGoldWeightField = () => {
    if (!isGoldTransaction || isGoldLoan) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Weight (grams) *
        </label>
        <input
          type="number"
          name="goldWeight"
          step="0.1"
          min="0.1"
          value={transactionData.goldWeight}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            errors.goldWeight ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
          }`}
          placeholder="Enter weight in grams"
          disabled={loading}
        />
        {errors.goldWeight && (
          <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>
        )}
      </div>
    );
  };

  const renderGoldTypeField = () => {
    if (!isGoldTransaction || isGoldLoan) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gold Type/Purity
        </label>
        <select
          name="goldType"
          value={transactionData.goldType}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          disabled={loading}
        >
          <option value="24K">24K (Pure Gold)</option>
          <option value="22K">22K (Standard)</option>
          <option value="18K">18K (Jewelry)</option>
          <option value="14K">14K (Lower Grade)</option>
          <option value="10K">10K (Minimal)</option>
        </select>
      </div>
    );
  };

  const renderGoldRateField = () => {
    if (!isGoldTransaction || isGoldLoan) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate per Gram (₹)
        </label>
        <input
          type="number"
          name="goldRate"
          step="1"
          min="1"
          value={transactionData.goldRate}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          placeholder="Current rate per gram"
          disabled={loading}
        />
      </div>
    );
  };

  const renderInterestRateField = () => {
    if (!isLoanTransaction || isInterestPayment || isRepayment) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Percent size={14} />
          Interest Rate (% per month)
        </label>
        <input
          type="number"
          name="interestRate"
          step="0.1"
          min="0.1"
          max="10"
          value={transactionData.interestRate}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          placeholder="2.5"
          disabled={loading}
        />
        <p className="text-xs text-gray-600 mt-1">
          Standard rate is 2.5% per month (30% annual)
        </p>
      </div>
    );
  };

  const renderDurationField = () => {
    if (!isLoanTransaction || isInterestPayment || isRepayment) return null;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Clock size={14} />
          Duration (months)
        </label>
        <select
          name="durationMonths"
          value={transactionData.durationMonths}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          disabled={loading}
        >
          <option value="1">1 month</option>
          <option value="3">3 months</option>
          <option value="6">6 months</option>
          <option value="12">12 months</option>
          <option value="18">18 months</option>
          <option value="24">24 months</option>
        </select>
      </div>
    );
  };

  const renderDateField = () => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Calendar size={14} />
          Date *
        </label>
        <input
          type="date"
          name="date"
          value={transactionData.date}
          onChange={onChange}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
          disabled={loading}
        />
      </div>
    );
  };

  const renderDescriptionField = () => {
    let placeholder = "Optional notes or description";
    
    if (isInterestPayment) {
      placeholder = "Interest payment notes (optional)";
    } else if (isRepayment) {
      placeholder = "Repayment notes (optional)";
    } else if (isGoldLoan) {
      placeholder = "Loan details and terms (optional)";
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <FileText size={14} />
          Description
        </label>
        <textarea
          name="description"
          rows="3"
          value={transactionData.description}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors resize-vertical"
          placeholder={placeholder}
          disabled={loading}
          maxLength="500"
        />
        <div className="text-xs text-gray-500 mt-1">
          {transactionData.description.length}/500 characters
        </div>
      </div>
    );
  };

  const renderInterestPaymentFields = () => {
    if (!isInterestPayment) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            For Month (Optional)
          </label>
          <input
            type="month"
            name="forMonth"
            value={transactionData.forMonth}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
            disabled={loading}
          />
          <p className="text-xs text-gray-600 mt-1">
            Leave blank for current month
          </p>
        </div>
        
        <div className="flex items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="partialPayment"
              checked={transactionData.partialPayment}
              onChange={(e) => onChange({
                target: { name: 'partialPayment', value: e.target.checked }
              })}
              className="rounded text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            Partial Payment
          </label>
          <p className="text-xs text-gray-600 ml-2">
            Check if this is a partial interest payment
          </p>
        </div>
      </div>
    );
  };

  const renderRepaymentFields = () => {
    if (!isRepayment || !repaymentOptions) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h6 className="font-medium text-blue-900 mb-2">Repayment Options</h6>
        <div className="text-sm text-blue-800">
          Based on your payment amount of ₹{transactionData.amount}, we'll return the most valuable items first.
          You can also select specific items in the loan selection section above.
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderAmountField()}
        {renderGoldWeightField()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderGoldTypeField()}
        {renderGoldRateField()}
        {renderInterestRateField()}
        {renderDurationField()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderDateField()}
        <div></div> {/* Empty div for spacing */}
      </div>

      {renderInterestPaymentFields()}
      {renderRepaymentFields()}

      {renderDescriptionField()}

      {/* Loan Summary for existing loans */}
      {selectedLoanDetails && (isInterestPayment || isRepayment) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h6 className="font-medium text-gray-900 mb-2">Selected Loan Summary</h6>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Principal:</span>
              <div className="font-medium">₹{(selectedLoanDetails.principalPaise / 100).toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Interest Rate:</span>
              <div className="font-medium">{selectedLoanDetails.interestRateMonthlyPct}%/month</div>
            </div>
            <div>
              <span className="text-gray-600">Start Date:</span>
              <div className="font-medium">{new Date(selectedLoanDetails.startDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <div className={`font-medium ${selectedLoanDetails.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                {selectedLoanDetails.status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionFields;