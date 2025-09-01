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
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${selectedCategory.color}-100 rounded-lg flex items-center justify-center`}>
            <selectedCategory.icon size={20} className={`text-${selectedCategory.color}-600`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{selectedCategory.label}</h3>
            <p className="text-sm text-gray-500">{selectedCustomer.name}</p>
          </div>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="space-y-6">
        {/* Loan Selection for Interest Payments and Repayments */}
        {(isInterestPayment || isRepayment) && (
          <LoanSelector
            availableLoans={availableLoans}
            selectedLoanId={transactionData.selectedLoanId}
            loading={loading}
            loadingLoans={loadingLoans}
            errors={errors}
            onLoanSelect={(loanId) => updateTransactionData({ selectedLoanId: loanId })}
          />
        )}

        {/* Interest Summary Card for Interest Payments */}
        {isInterestPayment && transactionData.selectedLoanId && (
          <InterestSummaryCard
            selectedLoan={availableLoans.find(loan => loan._id === transactionData.selectedLoanId)}
            interestSummary={interestSummary}
            categoryId={selectedCategory.id}
            currentGoldPrice={currentGoldPrice}
          />
        )}

        {/* Gold Loan Repayment Component */}
        {isGoldLoanRepayment && transactionData.selectedLoanId && (
          <GoldLoanRepayment
            selectedLoan={availableLoans.find(loan => loan._id === transactionData.selectedLoanId)}
            currentGoldPrice={currentGoldPrice}
            onRepayment={onSuccess}
          />
        )}

        {/* Gold Loan Items Management */}
        {isGoldLoan && (
          <GoldLoanItems
            items={transactionData.items}
            errors={errors}
            loading={loading}
            onItemsChange={(items) => updateTransactionData({ items })}
            currentGoldPrice={currentGoldPrice}
          />
        )}

        {/* Regular Amount Field for Non-Gold-Loan Transactions */}
        {!isGoldLoan && !isGoldLoanRepayment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <GoldTransactionFields
            transactionData={transactionData}
            errors={errors}
            loading={loading}
            onChange={handleDataChange}
            metalType={selectedCategory?.id.includes("silver") ? "Silver" : "Gold"}
            currentGoldPrice={currentGoldPrice}
          />
        )}

        {/* Loan Fields */}
        {selectedCategory?.id.includes("loan") && !isInterestPayment && !isRepayment && (
          <LoanFields
            transactionData={transactionData}
            loading={loading}
            onChange={handleDataChange}
          />
        )}

        {/* Description Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={transactionData.description}
            onChange={handleDataChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter transaction details..."
            disabled={loading}
          />
        </div>

        {/* Photo Upload */}
        {(selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("loan")) && !isGoldLoanRepayment && (
          <PhotoUpload
            photos={transactionData.photos}
            loading={loading}
            onPhotosChange={(photos) => updateTransactionData({ photos })}
          />
        )}
      </div>

      {/* Action Buttons */}
      {!isGoldLoanRepayment && (
        <div className="flex justify-between gap-3 mt-6">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            disabled={loading}
          >
            ← Back to Category
          </button>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={submitTransaction}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save Transaction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionForm;