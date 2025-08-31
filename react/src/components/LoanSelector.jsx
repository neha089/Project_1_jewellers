import React, { useState } from "react";

const LoanSelector = ({
  availableLoans,
  selectedLoanId,
  loading,
  loadingLoans,
  errors,
  onLoanSelect,
}) => {
  const [hoveredLoan, setHoveredLoan] = useState(null);

  const LoanTooltip = ({ loan, isVisible }) => {
    if (!isVisible || !loan) return null;

    const totalPaid = loan.summary?.totalPrincipalPaid || 0;
    const outstanding = loan.summary?.outstandingPrincipal || 0;
    const monthlyInterest = loan.principalPaise ? Math.round((loan.principalPaise * loan.interestRateMonthlyPct) / 100) : 0;

    return (
      <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-2 w-80 max-w-sm">
        <div className="space-y-2">
          <div className="font-semibold text-gray-900">Loan Details</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">Principal:</span>
              <div className="font-medium">₹{(loan.principalPaise / 100).toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Outstanding:</span>
              <div className="font-medium text-red-600">₹{(outstanding / 100).toFixed(2)}</div>
            </div>
            <div>
              <span className="text-gray-600">Interest Rate:</span>
              <div className="font-medium">{loan.interestRateMonthlyPct}% per month</div>
            </div>
            <div>
              <span className="text-gray-600">Monthly Interest:</span>
              <div className="font-medium">₹{(monthlyInterest / 100).toFixed(2)}</div>
            </div>
          </div>
          
          {loan.items && loan.items.length > 0 && (
            <div className="border-t pt-2">
              <div className="text-xs text-gray-600 mb-1">Items ({loan.items.length}):</div>
              <div className="max-h-20 overflow-y-auto">
                {loan.items.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-xs text-gray-700">
                    {item.name} - {item.weightGram}g
                  </div>
                ))}
                {loan.items.length > 3 && (
                  <div className="text-xs text-gray-500">+{loan.items.length - 3} more items</div>
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            Started: {new Date(loan.startDate).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Loan *
        {availableLoans.length > 0 && (
          <span className="text-xs text-gray-500 ml-2">
            (Hover for details)
          </span>
        )}
      </label>
      {loadingLoans ? (
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
          Loading loans...
        </div>
      ) : (
        <>
          <select
            value={selectedLoanId}
            onChange={(e) => onLoanSelect(e.target.value)}
            onMouseOver={(e) => {
              const loanId = e.target.value;
              const loan = availableLoans.find(l => l._id === loanId);
              setHoveredLoan(loan);
            }}
            onMouseLeave={() => setHoveredLoan(null)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.selectedLoanId ? "border-red-300" : "border-gray-300"
            }`}
            disabled={loading}
          >
            <option value="">Choose a loan...</option>
            {availableLoans.map((loan) => {
              const outstanding = loan.summary?.outstandingPrincipal || 0;
              
              return (
                <option key={loan._id} value={loan._id}>
                  Loan #{loan._id.slice(-6)} - ₹{(loan.principalPaise / 100).toFixed(0)} 
                  (Outstanding: ₹{(outstanding / 100).toFixed(0)})
                  {loan.items && ` - ${loan.items.length} items`}
                </option>
              );
            })}
          </select>
          
          {hoveredLoan && (
            <LoanTooltip loan={hoveredLoan} isVisible={true} />
          )}
        </>
      )}
      {errors.selectedLoanId && (
        <p className="text-red-500 text-xs mt-1">{errors.selectedLoanId}</p>
      )}
      {errors.loans && (
        <p className="text-red-500 text-xs mt-1">{errors.loans}</p>
      )}
    </div>
  );
};

export default LoanSelector;