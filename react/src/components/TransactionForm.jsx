import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import ApiService from "../services/api";
import GoldPriceService from "../services/goldPriceService";
import LoanSelector from "./LoanSelector";
import AmountField from "./AmountField";
import GoldTransactionFields from "./GoldTransactionFields";
import GoldLoanItems from "./GoldLoanItems";
import LoanFields from "./LoanFields";
import PhotoUpload from "./PhotoUpload";
import InterestSummaryCard from "./InterestSummaryCard";
import GoldLoanRepayment from "./GoldLoanRepayment";

const TransactionForm = ({
  selectedCustomer,
  selectedCategory,
  transactionType,
  onBack,
  onCancel,
  onSuccess,
}) => {
  const [transactionData, setTransactionData] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    goldWeight: "",
    goldType: "22K",
    goldPurity: "916",
    goldRate: "6500",
    interestRate: "2.5",
    durationMonths: "6",
    selectedLoanId: "",
    photos: [],
    items: [
      {
        id: Date.now(),
        name: "",
        weight: "",
        amount: "",
        purity: "22",
        images: [],
      },
    ],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableLoans, setAvailableLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);
  const [interestSummary, setInterestSummary] = useState(null);

  // Load available loans and gold price
  useEffect(() => {
    const isInterestPayment = selectedCategory?.id.includes("interest-received");
    const isRepayment = selectedCategory?.id.includes("repayment");
    
    if ((isInterestPayment || isRepayment) && selectedCustomer) {
      fetchCustomerLoans();
    }

    // Fetch current gold price for gold-related transactions
    if (selectedCategory?.id.includes("gold")) {
      fetchCurrentGoldPrice();
    }
  }, [selectedCategory, selectedCustomer]);

  // Auto-calculate interest amount when loan is selected
  useEffect(() => {
    if (transactionData.selectedLoanId && isInterestPayment) {
      calculateAndSetInterestAmount();
    }
  }, [transactionData.selectedLoanId]);

  const fetchCurrentGoldPrice = async () => {
    try {
      const price = await GoldPriceService.getCurrentGoldPrice();
      setCurrentGoldPrice(price);
    } catch (error) {
      console.error("Failed to fetch gold price:", error);
    }
  };

  const fetchCustomerLoans = async () => {
    setLoadingLoans(true);
    try {
      let loans = [];
      if (selectedCategory.id === "interest-received-gl" || selectedCategory.id === "gold-loan-repayment") {
        const response = await ApiService.getGoldLoansByCustomer(selectedCustomer._id);
        loans = response.data || [];
      } else if (selectedCategory.id === "interest-received-l" || selectedCategory.id === "loan-repayment") {
        const response = await ApiService.getLoansByCustomer(selectedCustomer._id);
        loans = response.data || [];
      }
      setAvailableLoans(loans.filter(loan => loan.status === 'ACTIVE'));
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setErrors(prev => ({...prev, loans: "Failed to load loans"}));
    } finally {
      setLoadingLoans(false);
    }
  };

  const calculateAndSetInterestAmount = async () => {
    const selectedLoan = availableLoans.find(loan => loan._id === transactionData.selectedLoanId);
    if (!selectedLoan) return;

    try {
      if (selectedCategory.id === "interest-received-gl") {
        // Calculate gold loan interest based on current gold price
        const summary = await ApiService.getGoldLoanInterestSummary(selectedLoan._id);
        setInterestSummary(summary.data);
        
        // Auto-fill suggested interest amount
        if (summary.data?.suggestedInterestAmount) {
          setTransactionData(prev => ({
            ...prev,
            amount: summary.data.suggestedInterestAmount.toString()
          }));
        }
      } else if (selectedCategory.id === "interest-received-l") {
        // Calculate regular loan interest
        const monthlyInterest = selectedLoan.principalPaise ? 
          (selectedLoan.principalPaise * selectedLoan.interestRateMonthlyPct) / 100 / 100 : 0;
        
        setTransactionData(prev => ({
          ...prev,
          amount: monthlyInterest.toFixed(2)
        }));
      }
    } catch (error) {
      console.error("Failed to calculate interest:", error);
    }
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const updateTransactionData = (updates) => {
    setTransactionData(prev => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedCategory?.id === "gold-loan") {
      if (transactionData.items.length === 0) {
        newErrors.items = "At least one item is required";
      } else {
        transactionData.items.forEach((item, index) => {
          if (!item.name.trim()) {
            newErrors[`item_${index}_name`] = "Item name is required";
          }
          if (!item.weight.trim() || parseFloat(item.weight) <= 0) {
            newErrors[`item_${index}_weight`] = "Valid weight is required";
          }
          if (!item.amount.trim() || parseFloat(item.amount) <= 0) {
            newErrors[`item_${index}_amount`] = "Valid amount is required";
          }
        });
      }
    } else if (selectedCategory?.id !== "gold-loan-repayment") {
      if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
        newErrors.amount = "Valid amount is required";
      }
    }

    const isGoldTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
    if (isGoldTransaction && selectedCategory?.id !== "gold-loan" && !transactionData.goldWeight.trim()) {
      newErrors.goldWeight = "Weight is required";
    }

    const isInterestPayment = selectedCategory?.id.includes("interest-received");
    const isRepayment = selectedCategory?.id.includes("repayment");
    if ((isInterestPayment || isRepayment) && !transactionData.selectedLoanId) {
      newErrors.selectedLoanId = "Please select a loan";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitTransaction = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let response;
      const commonData = {
        customerId: selectedCustomer._id,
        amount: transactionData.amount,
        description: transactionData.description,
        date: new Date(transactionData.date).toISOString(),
        photos: transactionData.photos,
      };

      switch (selectedCategory.id) {
        case "gold-loan":
          const totalAmount = transactionData.items.reduce(
            (total, item) => total + (parseFloat(item.amount) || 0),
            0
          );
          response = await ApiService.createGoldLoan({
            customerId: selectedCustomer._id,
            items: transactionData.items.map((item) => ({
              name: item.name,
              weightGram: parseFloat(item.weight),
              amountPaise: Math.round(parseFloat(item.amount) * 100),
              purityK: parseInt(item.purity),
              images: item.images.map(img => img.dataUrl),
            })),
            totalAmount: totalAmount,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths,
            date: transactionData.date,
          });
          break;

        case "gold-sell":
        case "silver-sell":
          response = await ApiService.createMetalSale({
            ...commonData,
            metal: selectedCategory.id.includes("gold") ? "GOLD" : "SILVER",
            weight: transactionData.goldWeight,
            rate: transactionData.goldRate,
            purity: transactionData.goldPurity,
          });
          break;

        case "interest-received-gl":
          response = await ApiService.makeGoldLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.description || 'Interest payment received'
          );
          break;

        case "interest-received-l":
          response = await ApiService.makeLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount)
          );
          break;

        case "gold-loan-repayment":
          // This will be handled by GoldLoanRepayment component
          response = { success: true };
          break;

        case "loan-repayment":
          response = await ApiService.makeLoanPayment(
            transactionData.selectedLoanId,
            {
              principal: transactionData.amount,
              interest: 0,
              photos: transactionData.photos,
              notes: transactionData.description,
            }
          );
          break;

        case "business-loan-taken":
          response = await ApiService.createLoan(
            {
              ...commonData,
              interestRate: transactionData.interestRate,
              durationMonths: transactionData.durationMonths,
            },
            1
          );
          break;

        case "business-loan-given":
          response = await ApiService.createLoan(
            {
              ...commonData,
              interestRate: transactionData.interestRate,
              durationMonths: transactionData.durationMonths,
            },
            -1
          );
          break;

        case "udhari-given":
          response = await ApiService.giveUdhari({
            ...commonData,
            installments: 3,
          });
          break;

        case "gold-purchase":
        case "silver-purchase":
          response = await ApiService.createGoldPurchase({
            ...commonData,
            partyName: selectedCustomer.name,
            goldWeight: transactionData.goldWeight,
            goldType: transactionData.goldType,
            metal: selectedCategory.id.includes("gold") ? "GOLD" : "SILVER",
          });
          break;

        default:
          console.log("Transaction data:", commonData);
          response = { success: true };
          break;
      }

      if (response?.success !== false) {
        onSuccess();
      } else {
        throw new Error(response?.message || "Transaction failed");
      }
    } catch (error) {
      console.error("Transaction failed:", error);
      setErrors({
        submit: error.message || "Failed to save transaction. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isInterestPayment = selectedCategory?.id.includes("interest-received");
  const isRepayment = selectedCategory?.id.includes("repayment");
  const isGoldLoan = selectedCategory?.id === "gold-loan";
  const isGoldLoanRepayment = selectedCategory?.id === "gold-loan-repayment";

  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Main Form Container */}
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
          
          {/* Header Section */}
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              
              {/* Transaction Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${selectedCategory.color}-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <selectedCategory.icon size={20} className={`sm:w-6 sm:h-6 text-${selectedCategory.color}-600`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 truncate">
                    {selectedCategory.label}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    Customer: {selectedCustomer.name}
                  </p>
                </div>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={onBack} 
                className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-5 lg:p-6">
            
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Loan Selection for Interest Payments and Repayments */}
              {(isInterestPayment || isRepayment) && (
                <div className="bg-gray-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <LoanSelector
                    availableLoans={availableLoans}
                    selectedLoanId={transactionData.selectedLoanId}
                    loading={loading}
                    loadingLoans={loadingLoans}
                    errors={errors}
                    onLoanSelect={(loanId) => updateTransactionData({ selectedLoanId: loanId })}
                  />
                </div>
              )}

              {/* Interest Summary Card for Interest Payments */}
              {isInterestPayment && transactionData.selectedLoanId && (
                <div className="bg-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <InterestSummaryCard
                    selectedLoan={availableLoans.find(loan => loan._id === transactionData.selectedLoanId)}
                    interestSummary={interestSummary}
                    categoryId={selectedCategory.id}
                    currentGoldPrice={currentGoldPrice}
                  />
                </div>
              )}

              {/* Gold Loan Repayment Component */}
              {isGoldLoanRepayment && transactionData.selectedLoanId && (
                <div className="bg-amber-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldLoanRepayment
                    selectedLoan={availableLoans.find(loan => loan._id === transactionData.selectedLoanId)}
                    currentGoldPrice={currentGoldPrice}
                    onRepayment={onSuccess}
                  />
                </div>
              )}

              {/* Gold Loan Items Management */}
              {isGoldLoan && (
                <div className="bg-amber-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldLoanItems
                    items={transactionData.items}
                    errors={errors}
                    loading={loading}
                    onItemsChange={(items) => updateTransactionData({ items })}
                    currentGoldPrice={currentGoldPrice}
                  />
                </div>
              )}

              {/* Regular Amount Field for Non-Gold-Loan Transactions */}
              {!isGoldLoan && !isGoldLoanRepayment && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <AmountField
                    amount={transactionData.amount}
                    date={transactionData.date}
                    errors={errors}
                    loading={loading}
                    onChange={handleDataChange}
                  />
                </div>
              )}

              {/* Gold Transaction Fields */}
              {selectedCategory?.id.includes("gold") && !isGoldLoan && !isGoldLoanRepayment && (
                <div className="bg-yellow-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldTransactionFields
                    transactionData={transactionData}
                    errors={errors}
                    loading={loading}
                    onChange={handleDataChange}
                    metalType={selectedCategory?.id.includes("silver") ? "Silver" : "Gold"}
                    currentGoldPrice={currentGoldPrice}
                  />
                </div>
              )}

              {/* Loan Fields */}
              {selectedCategory?.id.includes("loan") && !isInterestPayment && !isRepayment && (
                <div className="bg-indigo-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <LoanFields
                    transactionData={transactionData}
                    loading={loading}
                    onChange={handleDataChange}
                  />
                </div>
              )}

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={transactionData.description}
                  onChange={handleDataChange}
                  rows={3}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base resize-none"
                  placeholder="Enter transaction details..."
                  disabled={loading}
                />
              </div>

              {/* Photo Upload */}
              {(selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("loan")) && !isGoldLoanRepayment && (
                <div className="bg-green-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <PhotoUpload
                    photos={transactionData.photos}
                    loading={loading}
                    onPhotosChange={(photos) => updateTransactionData({ photos })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {!isGoldLoanRepayment && (
            <div className="p-4 sm:p-5 lg:p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                
                {/* Back Button */}
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
                  disabled={loading}
                >
                  ← Back to Category
                </button>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={onCancel}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base font-medium"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitTransaction}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm sm:text-base font-medium"
                  >
                    <Save size={16} className="sm:w-5 sm:h-5" />
                    {loading ? "Saving..." : "Save Transaction"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;
