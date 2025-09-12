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
import UdhariSelector from "./UdhariSelector";
import UdhariTransactionForm from "./UdhariTransactionForm";

const TransactionForm = ({
  selectedCustomer,
  selectedCategory,
  transactionType,
  onBack,
  onCancel,
  onSuccess,
}) => {
  // Check if this is an Udhari transaction
  const isUdhariTransaction = selectedCategory?.id.includes("udhari");
  
  // If it's an Udhari transaction, render the specialized form
  if (isUdhariTransaction) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="max-w-5xl mx-auto">
          <UdhariTransactionForm
            selectedCustomer={selectedCustomer}
            selectedCategory={selectedCategory}
            onSuccess={onSuccess}
            onCancel={onCancel}
            onBack={onBack}
          />
        </div>
      </div>
    );
  }

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
    // New fields for gold/silver transactions
    itemName: "",
    makingCharges: "0",
    wastage: "0",
    taxAmount: "0",
    advanceAmount: "0",
    paymentMode: "CASH",
    billNumber: "",
    // For purchases
    partyName: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierGST: "",
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
    // For loan repayment
    repaymentType: "partial", // "partial" or "full"
    principalAmount: "",
    interestAmount: "",
    // For udhari selection
    selectedUdhariId: "",
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
    if (selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver")) {
      fetchCurrentGoldPrice();
    }
  }, [selectedCategory, selectedCustomer]);

  // Auto-calculate interest amount when loan is selected
  useEffect(() => {
    if (transactionData.selectedLoanId && selectedCategory?.id.includes("interest-received")) {
      calculateAndSetInterestAmount();
    }
  }, [transactionData.selectedLoanId]);

  // Calculate suggested amounts for loan repayment
  useEffect(() => {
    if (transactionData.selectedLoanId && selectedCategory?.id === "loan-repayment") {
      calculateLoanRepaymentAmounts();
    }
  }, [transactionData.selectedLoanId, selectedCategory?.id]);

  // Auto-calculate total amount for gold/silver sales
  useEffect(() => {
    if ((selectedCategory?.id === "gold-sell" || selectedCategory?.id === "silver-sell") && 
        transactionData.goldWeight && transactionData.goldRate) {
      const weight = parseFloat(transactionData.goldWeight) || 0;
      const rate = parseFloat(transactionData.goldRate) || 0;
      const makingCharges = parseFloat(transactionData.makingCharges) || 0;
      const wastage = parseFloat(transactionData.wastage) || 0;
      const taxAmount = parseFloat(transactionData.taxAmount) || 0;
      
      const baseAmount = weight * rate;
      const wastageAmount = (baseAmount * wastage) / 100;
      const totalAmount = baseAmount + wastageAmount + makingCharges + taxAmount;
      
      setTransactionData(prev => ({
        ...prev,
        amount: totalAmount.toFixed(2)
      }));
    }
  }, [transactionData.goldWeight, transactionData.goldRate, transactionData.makingCharges, 
      transactionData.wastage, transactionData.taxAmount, selectedCategory?.id]);

  const fetchCurrentGoldPrice = async () => {
    try {
      const price = await GoldPriceService.getCurrentGoldPrice();
      setCurrentGoldPrice(price);
      
      // Auto-set current gold price if not already set
      if (price && !transactionData.goldRate) {
        setTransactionData(prev => ({
          ...prev,
          goldRate: price.toString()
        }));
      }
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
      setAvailableLoans(loans.filter(loan => loan.status === 'ACTIVE' || loan.status === 'PARTIALLY_PAID'));
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
        // Calculate regular loan interest based on CURRENT outstanding principal
        const monthlyInterest = selectedLoan.outstandingPrincipal ? 
          (selectedLoan.outstandingPrincipal * selectedLoan.interestRateMonthlyPct) / 100 / 100 : 0;
        
        setTransactionData(prev => ({
          ...prev,
          amount: monthlyInterest.toFixed(2)
        }));
      }
    } catch (error) {
      console.error("Failed to calculate interest:", error);
    }
  };

  const calculateLoanRepaymentAmounts = async () => {
    const selectedLoan = availableLoans.find(loan => loan._id === transactionData.selectedLoanId);
    if (!selectedLoan) return;

    try {
      // Get loan details with payment status
      const response = await ApiService.getLoanDetails(selectedLoan._id);
      const loanDetails = response.data;
      
      // Calculate suggested amounts
      const outstandingPrincipal = loanDetails.outstandingPrincipal / 100; // Convert from paise to rupees
      const pendingInterest = loanDetails.paymentStatus?.pendingAmount / 100 || 0; // Convert from paise to rupees
      
      setTransactionData(prev => ({
        ...prev,
        principalAmount: outstandingPrincipal.toFixed(2),
        interestAmount: pendingInterest.toFixed(2),
        amount: transactionData.repaymentType === "full" 
          ? (outstandingPrincipal + pendingInterest).toFixed(2)
          : prev.amount
      }));
    } catch (error) {
      console.error("Failed to calculate loan repayment amounts:", error);
    }
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Handle repayment type changes
    if (name === "repaymentType" && selectedCategory?.id === "loan-repayment") {
      if (value === "full") {
        const principal = parseFloat(transactionData.principalAmount) || 0;
        const interest = parseFloat(transactionData.interestAmount) || 0;
        setTransactionData(prev => ({
          ...prev,
          amount: (principal + interest).toFixed(2)
        }));
      } else {
        setTransactionData(prev => ({
          ...prev,
          amount: ""
        }));
      }
    }
  };

  const handleUdhariSelect = (udhariId) => {
    setTransactionData(prev => ({ ...prev, selectedUdhariId: udhariId }));
    if (errors.selectedUdhariId) {
      setErrors(prev => ({ ...prev, selectedUdhariId: "" }));
    }
  };

  const handleAmountSuggestion = (suggestedAmount) => {
    setTransactionData(prev => ({ ...prev, amount: suggestedAmount }));
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
    } else if (selectedCategory?.id === "loan-repayment") {
      // Validate loan repayment
      if (transactionData.repaymentType === "partial" && 
          (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0)) {
        newErrors.amount = "Valid amount is required for partial repayment";
      }
    } else if (selectedCategory?.id !== "gold-loan-repayment") {
      if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
        newErrors.amount = "Valid amount is required";
      }
    }

    // Validation for gold/silver transactions
    const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
    if (isMetalTransaction && selectedCategory?.id !== "gold-loan" && !transactionData.goldWeight.trim()) {
      newErrors.goldWeight = "Weight is required";
    }

    if ((selectedCategory?.id === "gold-sell" || selectedCategory?.id === "silver-sell") && 
        !transactionData.goldRate.trim()) {
      newErrors.goldRate = "Rate per gram is required";
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
          response = await ApiService.createGoldSale({
            customerId: selectedCustomer._id,
            purity: transactionData.goldType,
            weight: transactionData.goldWeight,
            rate: transactionData.goldRate,
            makingCharges: transactionData.makingCharges,
            wastage: transactionData.wastage,
            taxAmount: transactionData.taxAmount,
            advanceAmount: transactionData.advanceAmount,
            paymentMode: transactionData.paymentMode,
            itemName: transactionData.itemName || "Gold Item",
            description: transactionData.description,
            photos: transactionData.photos,
            billNumber: transactionData.billNumber
          });
          break;

        case "silver-sell":
          response = await ApiService.createSilverSale({
            customerId: selectedCustomer._id,
            purity: transactionData.goldType === "22K" ? "999" : transactionData.goldType,
            weight: transactionData.goldWeight,
            rate: transactionData.goldRate,
            makingCharges: transactionData.makingCharges,
            wastage: transactionData.wastage,
            taxAmount: transactionData.taxAmount,
            advanceAmount: transactionData.advanceAmount,
            paymentMode: transactionData.paymentMode,
            itemName: transactionData.itemName || "Silver Item",
            description: transactionData.description,
            photos: transactionData.photos,
            billNumber: transactionData.billNumber
          });
          break;

        case "interest-received-gl":
          response = await ApiService.makeGoldLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.description || 'Interest payment received'
          );
          break;

        case "gold-loan-repayment":
          // This will be handled by GoldLoanRepayment component
          response = { success: true };
          break;

        case "business-loan-taken":
          response = await ApiService.createLoan({
            customerId: selectedCustomer._id,
            amount: transactionData.amount,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths,
            description: transactionData.description,
            date: transactionData.date,
          }, 1); // direction: 1 for taken loan (we receive money)
          break;
        
        case "business-loan-given":
          response = await ApiService.createLoan({
            customerId: selectedCustomer._id,
            amount: transactionData.amount,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths,
            description: transactionData.description,
            date: transactionData.date,
          }, -1); // direction: -1 for given loan (we give money)
          break;
        
        case "interest-received-l":
          response = await ApiService.makeLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.description || 'Interest payment received'
          );
          break;
        
        case "loan-repayment":
          if (transactionData.repaymentType === "full") {
            // Full repayment with both principal and interest
            const principal = parseFloat(transactionData.principalAmount) || 0;
            const interest = parseFloat(transactionData.interestAmount) || 0;
            
            const paymentData = {
              principal: principal,
              interest: interest,
              photos: transactionData.photos,
              notes: transactionData.description || 'Full loan repayment'
            };
            
            response = await ApiService.makeLoanPayment(
              transactionData.selectedLoanId,
              paymentData
            );
          } else {
            // Partial repayment - user specifies the amount
            const paymentAmount = parseFloat(transactionData.amount);
            
            const paymentData = {
              principal: paymentAmount,
              interest: 0,
              photos: transactionData.photos,
              notes: transactionData.description || 'Partial loan repayment'
            };
            
            response = await ApiService.makeLoanPayment(
              transactionData.selectedLoanId,
              paymentData
            );
          }
          break;

        case "gold-purchase":
          response = await ApiService.createGoldPurchase({
            ...commonData,
            partyName: selectedCustomer.name,
            goldWeight: transactionData.goldWeight,
            goldType: transactionData.goldType,
            metal: "GOLD",
          });
          break;

        case "silver-purchase":
          response = await ApiService.createSilverPurchase({
            ...commonData,
            partyName: selectedCustomer.name,
            goldWeight: transactionData.goldWeight, // Using same field name
            goldType: transactionData.goldType === "22K" ? "999" : transactionData.goldType,
            metal: "SILVER",
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
  const isLoanRepayment = selectedCategory?.id === "loan-repayment";
  const isMetalSale = selectedCategory?.id === "gold-sell" || selectedCategory?.id === "silver-sell";

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

              {/* Loan Repayment Type Selection */}
              {isLoanRepayment && transactionData.selectedLoanId && (
                <div className="bg-indigo-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Repayment Type</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="repaymentType"
                        value="partial"
                        checked={transactionData.repaymentType === "partial"}
                        onChange={handleDataChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Partial Repayment</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="repaymentType"
                        value="full"
                        checked={transactionData.repaymentType === "full"}
                        onChange={handleDataChange}
                        className="mr-2"
                      />
                      <span className="text-sm">Full Repayment</span>
                    </label>
                  </div>

                  {transactionData.repaymentType === "full" && (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Outstanding Principal (₹)
                          </label>
                          <input
                            type="text"
                            value={transactionData.principalAmount}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pending Interest (₹)
                          </label>
                          <input
                            type="text"
                            value={transactionData.interestAmount}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            placeholder="0"
                            min="0"
                            step="0.01"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Mode and Bill Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Mode
                      </label>
                      <select
                        name="paymentMode"
                        value={transactionData.paymentMode}
                        onChange={handleDataChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        disabled={loading}
                      >
                        <option value="CASH">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CARD">Card</option>
                        <option value="CHEQUE">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bill Number
                      </label>
                      <input
                        type="text"
                        name="billNumber"
                        value={transactionData.billNumber}
                        onChange={handleDataChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="Optional bill number"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Gold Loan Items */}
              {isGoldLoan && (
                <div className="bg-yellow-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldLoanItems
                    items={transactionData.items}
                    errors={errors}
                    loading={loading}
                    onItemsChange={(items) => updateTransactionData({ items })}
                  />
                </div>
              )}

              {/* Gold Loan Repayment */}
              {isGoldLoanRepayment && transactionData.selectedLoanId && (
                <div className="bg-yellow-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldLoanRepayment
                    selectedLoan={availableLoans.find(loan => loan._id === transactionData.selectedLoanId)}
                    onSuccess={onSuccess}
                    onCancel={onBack}
                  />
                </div>
              )}

              {/* Regular Amount Field for Non-Gold-Loan Transactions */}
              {!isGoldLoan && !isGoldLoanRepayment && (transactionData.repaymentType !== "full" || !isLoanRepayment) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <AmountField
                    amount={transactionData.amount}
                    date={transactionData.date}
                    errors={errors}
                    loading={loading}
                    onChange={handleDataChange}
                    readOnly={isMetalSale} // Make amount read-only for metal sales as it's auto-calculated
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
                    metalType="Gold"
                    currentGoldPrice={currentGoldPrice}
                    showRateField={isMetalSale} // Show rate field for sales
                  />
                </div>
              )}

              {/* Silver Transaction Fields */}
              {selectedCategory?.id.includes("silver") && !isGoldLoan && !isGoldLoanRepayment && (
                <div className="bg-gray-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <GoldTransactionFields
                    transactionData={transactionData}
                    errors={errors}
                    loading={loading}
                    onChange={handleDataChange}
                    metalType="Silver"
                    currentGoldPrice={currentGoldPrice}
                    showRateField={isMetalSale} // Show rate field for sales
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
              {(selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver") || selectedCategory?.id.includes("loan")) && !isGoldLoanRepayment && (
                <div className="bg-green-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <PhotoUpload
                    photos={transactionData.photos}
                    loading={loading}
                    onPhotosChange={(photos) => updateTransactionData({ photos })}
                  />
                </div>
              )}

              {/* Transaction Summary for Metal Sales */}
              {isMetalSale && transactionData.goldWeight && transactionData.goldRate && (
                <div className="bg-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Transaction Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base Amount ({transactionData.goldWeight}g × ₹{transactionData.goldRate}):</span>
                      <span>₹{(parseFloat(transactionData.goldWeight || 0) * parseFloat(transactionData.goldRate || 0)).toFixed(2)}</span>
                    </div>
                    {parseFloat(transactionData.wastage || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Wastage ({transactionData.wastage}%):</span>
                        <span>₹{((parseFloat(transactionData.goldWeight || 0) * parseFloat(transactionData.goldRate || 0) * parseFloat(transactionData.wastage || 0)) / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(transactionData.makingCharges || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Making Charges:</span>
                        <span>₹{parseFloat(transactionData.makingCharges || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {parseFloat(transactionData.taxAmount || 0) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax Amount:</span>
                        <span>₹{parseFloat(transactionData.taxAmount || 0).toFixed(2)}</span>
                      </div>
                    )}
                    <hr className="my-2" />
                    <div className="flex justify-between font-semibold">
                      <span>Total Amount:</span>
                      <span>₹{transactionData.amount}</span>
                    </div>
                    {parseFloat(transactionData.advanceAmount || 0) > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span>Advance Amount:</span>
                          <span>₹{parseFloat(transactionData.advanceAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-orange-600">
                          <span>Remaining Amount:</span>
                          <span>₹{(parseFloat(transactionData.amount || 0) - parseFloat(transactionData.advanceAmount || 0)).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!isGoldLoanRepayment && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-6 border-t border-gray-100">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;