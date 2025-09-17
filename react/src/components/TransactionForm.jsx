import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import ApiService from "../services/api";
import MetalPriceService from "../services/metalPriceService";
import LoanSelector from "./LoanSelector";
import AmountField from "./AmountField";
import GoldLoanItems from "./GoldLoanItems";
import LoanFields from "./LoanFields";
import PhotoUpload from "./PhotoUpload";
import InterestSummaryCard from "./InterestSummaryCard";
import GoldLoanRepayment from "./GoldLoanRepayment";
import UdhariSelector from "./UdhariSelector";
import UdhariTransactionForm from "./UdhariTransactionForm";
import MetalItemsManager from "./MetalItemsManager";

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
    // New fields for gold/silver individual items
    items: [],
    // For purchases/sales
    partyName: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierGST: "",
    advanceAmount: "0",
    paymentMode: "CASH",
    billNumber: "",
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
  const [currentMetalPrices, setCurrentMetalPrices] = useState(null);
  const [interestSummary, setInterestSummary] = useState(null);

  // Load available loans and metal prices
  useEffect(() => {
    const isInterestPayment = selectedCategory?.id.includes("interest-received");
    const isRepayment = selectedCategory?.id.includes("repayment");
    
    if ((isInterestPayment || isRepayment) && selectedCustomer) {
      fetchCustomerLoans();
    }

    // Fetch current metal prices for gold/silver-related transactions
    if (selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver")) {
      fetchCurrentMetalPrices();
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

  // Auto-calculate total amount for metal transactions with individual items
  useEffect(() => {
    if ((selectedCategory?.id.includes("gold-sell") || selectedCategory?.id.includes("silver-sell")) && 
        transactionData.items.length > 0) {
      const totalAmount = transactionData.items.reduce((sum, item) => {
        const weight = parseFloat(item.weight) || 0;
        const rate = parseFloat(item.ratePerGram) || 0;
        const makingCharges = parseFloat(item.makingCharges) || 0;
        const wastage = parseFloat(item.wastage) || 0;
        const taxAmount = parseFloat(item.taxAmount) || 0;
        
        const baseAmount = weight * rate;
        const wastageAmount = (baseAmount * wastage) / 100;
        const itemTotal = baseAmount + wastageAmount + makingCharges + taxAmount;
        
        return sum + itemTotal;
      }, 0);
      
      setTransactionData(prev => ({
        ...prev,
        amount: totalAmount.toFixed(2)
      }));
    }
  }, [transactionData.items, selectedCategory?.id]);

  const fetchCurrentMetalPrices = async () => {
    try {
      const prices = await MetalPriceService.getCurrentPrices();
      setCurrentMetalPrices(prices);
      
      // Initialize first item with current price if items are empty
      if (transactionData.items.length === 0 && (selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver"))) {
        const metalType = selectedCategory?.id.includes("gold") ? "Gold" : "Silver";
        const defaultPurity = metalType === "Gold" ? "22K" : "925";
        const currentPrice = metalType === "Gold" ? prices.gold.rates[defaultPurity] : prices.silver.rates[defaultPurity];
        
        const newItem = {
          id: Date.now(),
          itemName: "",
          description: "",
          purity: defaultPurity,
          weight: "",
          ratePerGram: currentPrice ? (currentPrice / 100).toString() : "",
          makingCharges: "0",
          wastage: "0",
          taxAmount: "0",
          photos: [],
          hallmarkNumber: "",
          certificateNumber: ""
        };
        
        setTransactionData(prev => ({
          ...prev,
          items: [newItem]
        }));
      }
    } catch (error) {
      console.error("Failed to fetch metal prices:", error);
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
        const summary = await ApiService.getGoldLoanInterestSummary(selectedLoan._id);
        setInterestSummary(summary.data);
        
        if (summary.data?.suggestedInterestAmount) {
          setTransactionData(prev => ({
            ...prev,
            amount: summary.data.suggestedInterestAmount.toString()
          }));
        }
      } else if (selectedCategory.id === "interest-received-l") {
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
      const response = await ApiService.getLoanDetails(selectedLoan._id);
      const loanDetails = response.data;
      
      const outstandingPrincipal = loanDetails.outstandingPrincipal / 100;
      const pendingInterest = loanDetails.paymentStatus?.pendingAmount / 100 || 0;
      
      setTransactionData(prev => ({
        ...prev,
        principalAmount: outstandingPrincipal.toString(),
        interestAmount: pendingInterest.toString(),
        amount: prev.repaymentType === "full" 
          ? (outstandingPrincipal + pendingInterest).toString()
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

  const handleItemsChange = (items) => {
    setTransactionData(prev => ({ ...prev, items }));
    if (errors.items) {
      setErrors(prev => ({ ...prev, items: "" }));
    }
  };

  const updateTransactionData = (updates) => {
    setTransactionData(prev => ({ ...prev, ...updates }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validation for metal transactions with individual items
    const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
    const isMetalBuySell = (selectedCategory?.id.includes("gold-sell") || selectedCategory?.id.includes("gold-purchase") || 
                           selectedCategory?.id.includes("silver-sell") || selectedCategory?.id.includes("silver-purchase"));
    
    if (isMetalTransaction && isMetalBuySell) {
      if (transactionData.items.length === 0) {
        newErrors.items = "At least one item is required";
      } else {
        transactionData.items.forEach((item, index) => {
          if (!item.itemName.trim()) {
            newErrors[`item_${index}_name`] = "Item name is required";
          }
          if (!item.weight.trim() || parseFloat(item.weight) <= 0) {
            newErrors[`item_${index}_weight`] = "Valid weight is required";
          }
          if (!item.ratePerGram.trim() || parseFloat(item.ratePerGram) <= 0) {
            newErrors[`item_${index}_rate`] = "Valid rate per gram is required";
          }
        });
      }
    } else if (selectedCategory?.id === "gold-loan") {
      // Existing gold loan validation
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
    } else 
    if (selectedCategory?.id === "loan-repayment") {
      if (transactionData.repaymentType === "full") {
        const principal = parseFloat(transactionData.principalAmount) || 0;
        const interest = parseFloat(transactionData.interestAmount) || 0;
        const totalAmount = principal + interest;
        
        if (totalAmount <= 0) {
          newErrors.amount = "Valid payment amount is required for full repayment";
        }
        
        // Update amount to match total for full repayment
        if (totalAmount > 0) {
          setTransactionData(prev => ({
            ...prev,
            amount: totalAmount.toString()
          }));
        }
      } else if (transactionData.repaymentType === "partial") {
        const amount = parseFloat(transactionData.amount) || 0;
        if (amount <= 0) {
          newErrors.amount = "Valid amount is required for partial repayment";
        }
      }
    }
     else if (!selectedCategory?.id.includes("gold-loan-repayment") && !isMetalBuySell) {
      // Regular amount validation for other transaction types
      if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
        newErrors.amount = "Valid amount is required";
      }
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
              images: item.images?.map(img => img.dataUrl),
            })),
            totalAmount: totalAmount,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths,
            date: transactionData.date,
          });
          break;

        case "gold-sell":
        case "gold-purchase":
          response = await ApiService.createGoldTransaction({
            transactionType: selectedCategory.id === "gold-sell" ? "SELL" : "BUY",
            customer: selectedCustomer._id,
            items: transactionData.items.map(item => ({
              itemName: item.itemName,
              description: item.description,
              purity: item.purity,
              weight: parseFloat(item.weight),
              ratePerGram: parseFloat(item.ratePerGram),
              makingCharges: parseFloat(item.makingCharges || 0),
              wastage: parseFloat(item.wastage || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              photos: item.photos,
              hallmarkNumber: item.hallmarkNumber,
              certificateNumber: item.certificateNumber
            })),
            advanceAmount: parseFloat(transactionData.advanceAmount || 0),
            paymentMode: transactionData.paymentMode,
            notes: transactionData.description,
            billNumber: transactionData.billNumber,
            fetchCurrentRates: true
          });
          break;

        case "silver-sell":
        case "silver-purchase":
          response = await ApiService.createSilverTransaction({
            transactionType: selectedCategory.id === "silver-sell" ? "SELL" : "BUY",
            customer: selectedCustomer._id,
            items: transactionData.items.map(item => ({
              itemName: item.itemName,
              description: item.description,
              purity: item.purity,
              weight: parseFloat(item.weight),
              ratePerGram: parseFloat(item.ratePerGram),
              makingCharges: parseFloat(item.makingCharges || 0),
              wastage: parseFloat(item.wastage || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              photos: item.photos,
              hallmarkNumber: item.hallmarkNumber,
              certificateNumber: item.certificateNumber
            })),
            advanceAmount: parseFloat(transactionData.advanceAmount || 0),
            paymentMode: transactionData.paymentMode,
            notes: transactionData.description,
            billNumber: transactionData.billNumber,
            fetchCurrentRates: true
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
          }, 1);
          break;
        
        case "business-loan-given":
          response = await ApiService.createLoan({
            customerId: selectedCustomer._id,
            amount: transactionData.amount,
            interestRate: transactionData.interestRate,
            durationMonths: transactionData.durationMonths,
            description: transactionData.description,
            date: transactionData.date,
          }, -1);
          break;
        
        case "interest-received-l":
          response = await ApiService.makeLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.description || 'Interest payment received'
          );
          break;
        
          case "loan-repayment":
            let principal = 0;
            let interest = 0;
            
            if (transactionData.repaymentType === "full") {
              // For full repayment, use the calculated amounts
              principal = parseFloat(transactionData.principalAmount) || 0;
              interest = parseFloat(transactionData.interestAmount) || 0;
            } else {
              // For partial repayment, apply the amount to principal only
              principal = parseFloat(transactionData.amount) || 0;
              interest = 0; // No interest payment for partial repayment
            }
            
            const paymentData = {
              principal: principal,
              interest: interest,
              photos: transactionData.photos,
              notes: transactionData.description || `${transactionData.repaymentType === "full" ? "Full" : "Partial"} loan repayment`
            };
            
            console.log("Sending payment data:", paymentData); // Debug log
            
            response = await ApiService.makeLoanPayment(
              transactionData.selectedLoanId,
              paymentData
            );
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
  const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
  const isMetalBuySell = (selectedCategory?.id.includes("gold-sell") || selectedCategory?.id.includes("gold-purchase") || 
                         selectedCategory?.id.includes("silver-sell") || selectedCategory?.id.includes("silver-purchase"));

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
                    currentGoldPrice={currentMetalPrices}
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

              {/* Gold Loan Items (existing) */}
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

              {/* Metal Items Manager for Buy/Sell */}
              {isMetalTransaction && isMetalBuySell && (
                <div className={`${selectedCategory?.id.includes("gold") ? "bg-yellow-50" : "bg-gray-50"} p-4 sm:p-5 rounded-lg sm:rounded-xl`}>
                  <MetalItemsManager
                    items={transactionData.items}
                    onItemsChange={handleItemsChange}
                    metalType={selectedCategory?.id.includes("gold") ? "Gold" : "Silver"}
                    currentPrices={selectedCategory?.id.includes("gold") ? currentMetalPrices?.gold : currentMetalPrices?.silver}
                    errors={errors}
                    loading={loading}
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

              {/* Regular Amount Field for Non-Metal-Item Transactions */}
              {!isGoldLoan && !isGoldLoanRepayment && !isMetalBuySell && (transactionData.repaymentType !== "full" || !isLoanRepayment) && (
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

              {/* Advance Amount and Payment Details for Metal Transactions */}
              {isMetalBuySell && (
                <div className="bg-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="advanceAmount"
                        value={transactionData.advanceAmount}
                        onChange={handleDataChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
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
                        placeholder="Optional"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  {transactionData.items.length > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Transaction Summary</h5>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Items:</span>
                          <span>{transactionData.items.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Weight:</span>
                          <span>{transactionData.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(3)}g</span>
                        </div>
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

              {/* Photo Upload - Only for non-metal-item transactions */}
              {(selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver") || selectedCategory?.id.includes("loan")) && 
               !isGoldLoanRepayment && !isMetalBuySell && (
                <div className="bg-green-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                  <PhotoUpload
                    photos={transactionData.photos}
                    loading={loading}
                    onPhotosChange={(photos) => updateTransactionData({ photos })}
                  />
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
