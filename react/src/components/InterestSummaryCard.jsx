import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, AlertCircle, Calculator } from "lucide-react";
import ApiService from "../services/api";

const InterestSummaryCard = ({
  selectedLoan,
  categoryId,
  currentGoldPrice,
}) => {
  const [interestData, setInterestData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedLoan) {
      calculateInterestSummary();
    }
  }, [selectedLoan, currentGoldPrice]);

  const calculateInterestSummary = async () => {
    if (!selectedLoan) return;

    setLoading(true);
    try {
      if (categoryId === "interest-received-gl") {
        // Gold loan interest calculation
        const summary = await calculateGoldLoanInterest();
        setInterestData(summary);
      } else if (categoryId === "interest-received-l") {
        // Regular loan interest calculation
        const summary = calculateRegularLoanInterest();
        setInterestData(summary);
      }
    } catch (error) {
      console.error("Failed to calculate interest:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGoldLoanInterest = async () => {
    if (!selectedLoan || !currentGoldPrice) return null;

    // Calculate total gold weight and current value
    const totalWeight = selectedLoan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
    const avgPurity = selectedLoan.items?.length > 0 
      ? selectedLoan.items.reduce((sum, item) => sum + (item.purityK || 22), 0) / selectedLoan.items.length 
      : 22;

    // Current market value based on weight, purity, and current gold price
    const currentMarketValue = (totalWeight * (avgPurity / 24) * currentGoldPrice.pricePerGram);
    
    // Calculate months since loan start
    const startDate = new Date(selectedLoan.startDate);
    const currentDate = new Date();
    const monthsDiff = Math.max(1, Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
    
    // Calculate interest
    const monthlyInterestRate = selectedLoan.interestRateMonthlyPct / 100;
    const principalAmount = selectedLoan.principalPaise / 100;
    const totalInterestAccrued = principalAmount * monthlyInterestRate * monthsDiff;
    const monthlyInterestAmount = principalAmount * monthlyInterestRate;

    // Get payment history if available
    let totalInterestPaid = 0;
    try {
      const paymentHistory = await ApiService.getGoldLoanPaymentHistory(selectedLoan._id);
      totalInterestPaid = paymentHistory.data?.totalInterestPaid || 0;
    } catch (error) {
      console.error("Failed to get payment history:", error);
    }

    const pendingInterest = totalInterestAccrued - totalInterestPaid;

    return {
      totalWeight,
      avgPurity,
      currentMarketValue,
      principalAmount,
      monthlyInterestRate: selectedLoan.interestRateMonthlyPct,
      monthlyInterestAmount,
      monthsSinceLoan: monthsDiff,
      totalInterestAccrued,
      totalInterestPaid,
      pendingInterest: Math.max(0, pendingInterest),
      suggestedAmount: monthlyInterestAmount, // Suggest monthly interest
      goldAppreciationPct: currentMarketValue > principalAmount 
        ? ((currentMarketValue - principalAmount) / principalAmount * 100)
        : 0,
    };
  };

  const calculateRegularLoanInterest = () => {
    const monthlyInterestRate = selectedLoan.interestRateMonthlyPct / 100;
    const principalAmount = selectedLoan.principalPaise / 100;
    const monthlyInterestAmount = principalAmount * monthlyInterestRate;

    // Calculate months since loan start
    const startDate = new Date(selectedLoan.startDate);
    const currentDate = new Date();
    const monthsDiff = Math.max(1, Math.ceil((currentDate - startDate) / (1000 * 60 * 60 * 24 * 30)));

    return {
      principalAmount,
      monthlyInterestRate: selectedLoan.interestRateMonthlyPct,
      monthlyInterestAmount,
      monthsSinceLoan: monthsDiff,
      suggestedAmount: monthlyInterestAmount,
    };
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!interestData) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="text-blue-600" size={20} />
        <h4 className="font-semibold text-gray-900">Interest Summary</h4>
      </div>

      {categoryId === "interest-received-gl" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Principal and Gold Info */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Principal Amount:</span>
                <span className="font-medium">₹{interestData.principalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Gold Weight:</span>
                <span className="font-medium">{interestData.totalWeight.toFixed(2)}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Purity:</span>
                <span className="font-medium">{interestData.avgPurity.toFixed(0)}K</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Market Value:</span>
                <span className="font-medium text-green-600">₹{interestData.currentMarketValue.toFixed(2)}</span>
              </div>
            </div>

            {/* Interest Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Interest Rate:</span>
                <span className="font-medium">{interestData.monthlyInterestRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Interest:</span>
                <span className="font-medium">₹{interestData.monthlyInterestAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Months Since Loan:</span>
                <span className="font-medium">{interestData.monthsSinceLoan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Interest Paid:</span>
                <span className="font-medium">₹{interestData.totalInterestPaid.toFixed(2)}</span>
              </div>
            </div>

            {/* Pending Interest */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border-l-4 border-orange-400">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-orange-600" size={16} />
                  <span className="font-medium text-orange-800">Pending Interest</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{interestData.pendingInterest.toFixed(2)}
                </div>
              </div>
              
              {interestData.goldAppreciationPct > 0 && (
                <div className="bg-green-100 rounded-lg p-3 border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="text-green-600" size={16} />
                    <span className="text-sm font-medium text-green-800">Gold Appreciation</span>
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    +{interestData.goldAppreciationPct.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-700">
                    Value increased by ₹{(interestData.currentMarketValue - interestData.principalAmount).toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Suggested Interest Payment:</span>
              <span className="text-xl font-bold text-blue-600">
                ₹{interestData.suggestedAmount.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Based on monthly interest rate
            </div>
          </div>
        </>
      ) : (
        // Regular loan interest summary
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Principal Amount:</span>
              <span className="font-medium">₹{interestData.principalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Monthly Interest Rate:</span>
              <span className="font-medium">{interestData.monthlyInterestRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Months Since Loan:</span>
              <span className="font-medium">{interestData.monthsSinceLoan}</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="text-blue-600" size={16} />
              <span className="font-medium text-blue-800">Monthly Interest</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{interestData.monthlyInterestAmount.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
        <AlertCircle size={12} />
        Interest calculation is based on current market rates and loan terms
      </div>
    </div>
  );
};

export default InterestSummaryCard;