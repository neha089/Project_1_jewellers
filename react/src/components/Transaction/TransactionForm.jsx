import React, { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import ApiService from "../../services/api";
import MetalPriceService from "../../services/metalPriceService";
import LoanSelector from "../LoanSelector";
import AmountField from "../AmountField";
import GoldLoanItems from "../GoldLoanItems";
import LoanFields from "../LoanFields";
import PhotoUpload from "../PhotoUpload";
import InterestSummaryCard from "../InterestSummaryCard";
import GoldLoanRepayment from "../GoldLoanRepayment";
import AddLoanModal from "../AddLoanModal";
import LInterestPaymentModal from "../Loan/LInterestPaymentModal";
import LoanPaymentModal from "../Loan/LoanPaymentModal";
import AddUdharModal from "../AddUdhariModal";
import UdhariPaymentModal from "../Udhaar/UdhariPaymentModal";
import GoldTransactionForm from "../GoldBuySell/GoldTransactionForm";
import SilverTransactionForm from "../SilverBuySell/SilverTransactionForm";
import AddGoldLoanModal from "../AddGoldLoanModal"; // Imported
import InterestPaymentModal from "../InterestPaymentModal"; // Imported for gold interest
import ItemRepaymentModal from "../ItemRepaymentModal"; // Imported for item repayment

// Enhanced Loan Selection Modal
const LoanSelectionModal = ({ isOpen, onClose, availableLoans, onSelect, categoryId }) => {
  if (!isOpen) return null;

  const getModalTitle = () => {
    if (categoryId === "interest-received-l" || categoryId === "interest-paid-l" || categoryId === "interest-received-gl") return "Select Loan for Interest Payment";
    if (categoryId === "loan-repayment" || categoryId === "loan-repayment-collect" || categoryId === "loan-repayment-pay" || categoryId === "gold-loan-repayment") return "Select Loan for Repayment";
    return "Select a Loan";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-hidden">
        <h3 className="text-lg font-semibold mb-4">{getModalTitle()}</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {availableLoans.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No loans found for this customer</p>
            </div>
          ) : (
            availableLoans.map((loan) => (
              <div
                key={loan._id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  onSelect(loan._id);
                  onClose();
                }}
              >
                <p className="font-medium">Loan #{loan._id.slice(-6)}</p>
                <p className="text-sm text-gray-600">
                  Outstanding: ₹{((loan.outstandingAmount || loan.principalRupees || 0) / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Interest Rate: {loan.interestRateMonthlyPct}% monthly
                </p>
                <p className="text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${
                    loan.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {loan.status}
                  </span>
                  {loan.loanType && (
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      loan.loanType === 'GIVEN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {loan.loanType === 'GIVEN' ? 'To Collect' : 'To Pay'}
                    </span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const TransactionForm = ({
  selectedCustomer,
  selectedCategory,
  transactionType,
  onBack,
  onCancel,
  onSuccess,
}) => {
  // Modal states
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoanSelectionModalOpen, setIsLoanSelectionModalOpen] = useState(false);
  const [isUdharModalOpen, setIsUdharModalOpen] = useState(false);
  const [isUdharPaymentModalOpen, setIsUdharPaymentModalOpen] = useState(false);
  const [isAddGoldLoanModalOpen, setIsAddGoldLoanModalOpen] = useState(false); // NEW: For add gold loan
  const [isGoldInterestModalOpen, setIsGoldInterestModalOpen] = useState(false); // NEW: For gold interest
  const [isItemRepaymentModalOpen, setIsItemRepaymentModalOpen] = useState(false); // NEW: For item repayment
  
  // Selected items
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedUdhar, setSelectedUdhar] = useState(null);
  
  // Loading and data states
  const [loansLoaded, setLoansLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Available data
  const [availableLoans, setAvailableLoans] = useState([]);
  const [availableUdhars, setAvailableUdhars] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [currentMetalPrices, setCurrentMetalPrices] = useState(null);
  const [interestSummary, setInterestSummary] = useState(null);

  // Transaction data
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
    items: [],
    partyName: "",
    supplierName: "",
    supplierPhone: "",
    supplierAddress: "",
    supplierGST: "",
    advanceAmount: "0",
    paymentMode: "CASH",
    billNumber: "",
    repaymentType: "partial",
    principalAmount: "",
    interestAmount: "",
    selectedUdhariId: "",
  });

  // Helper functions
  const updateTransactionData = (updates) => {
    setTransactionData(prev => ({ ...prev, ...updates }));
  };

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemsChange = (items) => {
    setTransactionData((prev) => ({ ...prev, items }));
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: "" }));
    }
  };

  // API calls
  const fetchCustomerLoans = async () => {
    try {
      setLoadingLoans(true);
      let loans = [];
      
      if (selectedCategory.id === "interest-received-gl" || selectedCategory.id === "gold-loan-repayment") {
        // Gold loan specific API
        const response = await ApiService.getGoldLoansByCustomer(selectedCustomer._id);
        loans = response.data || [];
        console.log('Fetched gold loans:', loans); // Debug log
        // Validate loan data
        loans = loans.map(loan => ({
          ...loan,
          _id: loan._id || null,
          outstandingAmount: loan.outstandingAmount || loan.currentPrincipal || 0,
          interestRateMonthlyPct: loan.interestRateMonthlyPct || 0,
          customer: loan.customer || { name: selectedCustomer.name },
          dueDate: loan.dueDate || null,
          notes: loan.notes || '',
          status: loan.status || 'ACTIVE'
        }));
      } else {
        // Regular business loans
        const [receivableResponse, payableResponse] = await Promise.all([
          ApiService.getOutstandingToCollectLoan(),
          ApiService.getOutstandingToPayLoan()
        ]);

        const allLoans = [];
        console.log(receivableResponse)
        console.log(payableResponse)
        // Process receivable loans (GIVEN)
        if (receivableResponse.success) {
          const customerReceivableData = receivableResponse.data.customerWise.find(
            item => item.customer._id === selectedCustomer._id
          );
          if (customerReceivableData && customerReceivableData.loans) {
            allLoans.push(...customerReceivableData.loans.map(loan => ({
              ...loan,
              loanType: 'GIVEN'
            })));
          }
        }

        // Process payable loans (TAKEN)
        if (payableResponse.success) {
          const customerPayableData = payableResponse.data.customerWise.find(
            item => item.customer._id === selectedCustomer._id
          );
          if (customerPayableData && customerPayableData.loans) {
            allLoans.push(...customerPayableData.loans.map(loan => ({
              ...loan,
              loanType: 'TAKEN'
            })));
          }
        }

        // Filter loans based on category
        if (selectedCategory.id === "interest-received-l" || selectedCategory.id === "loan-repayment-collect") {
          loans = allLoans.filter(loan => loan.loanType === 'GIVEN');
        } else if (selectedCategory.id === "interest-paid-l" || selectedCategory.id === "loan-repayment-pay") {
          loans = allLoans.filter(loan => loan.loanType === 'TAKEN');
        } else if (selectedCategory.id === "loan-repayment") {
          loans = allLoans; // Show both GIVEN and TAKEN
        }
      }
      
      setAvailableLoans(loans.filter((loan) => loan._id && (loan.status === "ACTIVE" || loan.status === "PARTIALLY_PAID")));
    } catch (error) {
      console.error("Failed to fetch loans:", error);
      setErrors((prev) => ({ ...prev, loans: "Failed to load loans" }));
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchCustomerUdhars = async () => {
    try {
      const response = await ApiService.getUdharsByCustomer(selectedCustomer._id);
      setAvailableUdhars(response.data || []);
    } catch (error) {
      console.error("Failed to fetch udhars:", error);
      setErrors((prev) => ({ ...prev, udhars: "Failed to load udhars" }));
    }
  };

  const fetchCurrentMetalPrices = async () => {
    try {
      const prices = await MetalPriceService.getCurrentPrices();
      setCurrentMetalPrices(prices);

      if (
        transactionData.items.length === 0 &&
        (selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver"))
      ) {
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
          certificateNumber: "",
        };

        setTransactionData((prev) => ({
          ...prev,
          items: [newItem],
        }));
      }
    } catch (error) {
      console.error("Failed to fetch metal prices:", error);
    }
  };

  // Effects
  useEffect(() => {
    const isInterestPayment = selectedCategory?.id.includes("interest-received") || selectedCategory?.id.includes("interest-paid");
    const isRepayment = selectedCategory?.id.includes("repayment");
    const isUdhari = selectedCategory?.id.includes("udhari");
    const isLoanTransaction = selectedCategory?.id.includes("loan") || selectedCategory?.id.includes("-l") || selectedCategory?.id.includes("-gl");

    console.log('TransactionForm: Category changed', {
      categoryId: selectedCategory?.id,
      isInterestPayment,
      isRepayment,
      isLoanTransaction,
      customer: selectedCustomer?.name
    });

    // Reset modal states
    setIsLoanModalOpen(false);
    setIsInterestModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsLoanSelectionModalOpen(false);
    setIsUdharModalOpen(false);
    setIsUdharPaymentModalOpen(false);
    setIsAddGoldLoanModalOpen(false); // NEW
    setIsGoldInterestModalOpen(false); // NEW
    setIsItemRepaymentModalOpen(false); // NEW
    setErrors({});
    setLoansLoaded(false);

    // Load required data
    if ((isInterestPayment || isRepayment) && isLoanTransaction && selectedCustomer) {
      console.log('TransactionForm: Loading customer loans for', selectedCategory.id);
      fetchCustomerLoans().then(() => {
        console.log('TransactionForm: Loans loaded, setting loansLoaded to true');
        setLoansLoaded(true);
      });
    }

    if (isUdhari && selectedCustomer) {
      fetchCustomerUdhars();
    }

    if (selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver")) {
      fetchCurrentMetalPrices();
    }
  }, [selectedCategory, selectedCustomer]);

  // Effect to handle modal opening based on category and loaded data
  useEffect(() => {
    if (!selectedCategory) return;

    const categoryId = selectedCategory.id;
    
    console.log('TransactionForm: Modal opening logic', {
      categoryId,
      loansLoaded,
      availableLoansCount: availableLoans.length,
      selectedLoanId: transactionData.selectedLoanId
    });

    // Direct modal opening categories
    if (categoryId === "business-loan-given" || categoryId === "business-loan-taken") {
      console.log('TransactionForm: Opening business loan modal');
      setIsLoanModalOpen(true);
      return;
    }

    if (categoryId === "udhari-given" || categoryId === "udhari-taken") {
      console.log('TransactionForm: Opening udhari modal');
      setIsUdharModalOpen(true);
      return;
    }

    if (categoryId === "gold-loan") {
      console.log('TransactionForm: Opening add gold loan modal');
      setIsAddGoldLoanModalOpen(true);
      return;
    }

    // Loan-dependent categories that need loan selection first
    if (loansLoaded && (
      categoryId === "interest-received-l" || 
      categoryId === "interest-paid-l" || 
      categoryId === "loan-repayment" ||
      categoryId === "loan-repayment-collect" ||
      categoryId === "loan-repayment-pay"
    )) {
      if (!transactionData.selectedLoanId) {
        console.log('TransactionForm: Opening loan selection modal for', categoryId);
        setIsLoanSelectionModalOpen(true);
      } else {
        console.log('TransactionForm: Loan already selected, opening payment modal for', categoryId);
        const loan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
        if (loan) {
          setSelectedLoan(loan);
          if (categoryId === "interest-received-l" || categoryId === "interest-paid-l") {
            console.log('TransactionForm: Opening interest payment modal');
            setIsInterestModalOpen(true);
          } else if (
            categoryId === "loan-repayment" || 
            categoryId === "loan-repayment-collect" || 
            categoryId === "loan-repayment-pay"
          ) {
            console.log('TransactionForm: Opening loan repayment modal');
            setIsPaymentModalOpen(true);
          }
        } else {
          console.log('TransactionForm: Selected loan not found, opening loan selection modal');
          setIsLoanSelectionModalOpen(true);
        }
      }
    }

    // Gold loan interest and repayment
    if (loansLoaded && categoryId === "interest-received-gl") {
      console.log('Checking gold interest modal:', {
        selectedLoanId: transactionData.selectedLoanId,
        availableLoansCount: availableLoans.length
      });
      if (!transactionData.selectedLoanId) {
        console.log('TransactionForm: Opening loan selection modal for gold interest');
        setIsLoanSelectionModalOpen(true);
      } else {
        const loan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
        if (loan) {
          console.log('Opening gold interest modal with loan:', loan);
          setSelectedLoan(loan);
          setIsGoldInterestModalOpen(true);
        } else {
          console.log('Selected loan not found:', transactionData.selectedLoanId);
          setIsLoanSelectionModalOpen(true);
        }
      }
    }

    if (loansLoaded && categoryId === "gold-loan-repayment") {
      if (!transactionData.selectedLoanId) {
        console.log('TransactionForm: Opening loan selection modal for gold repayment');
        setIsLoanSelectionModalOpen(true);
      } else {
        const loan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
        if (loan) {
          setSelectedLoan(loan);
          console.log('TransactionForm: Opening item repayment modal');
          setIsItemRepaymentModalOpen(true);
        } else {
          setIsLoanSelectionModalOpen(true);
        }
      }
    }

    // Udhari repayment
    if (categoryId === "udhari-repayment" && transactionData.selectedUdhariId) {
      const udhar = availableUdhars.find((udhar) => udhar._id === transactionData.selectedUdhariId);
      if (udhar) {
        setSelectedUdhar(udhar);
        setIsUdharPaymentModalOpen(true);
      }
    }
  }, [loansLoaded, selectedCategory, transactionData.selectedLoanId, transactionData.selectedUdhariId, availableLoans, availableUdhars]);

  // Database storage handlers for different transaction types
  const handleCreateTransactionRecord = async (transactionData, category) => {
    try {
      const baseTransactionData = {
        customerId: selectedCustomer._id,
        customerName: selectedCustomer.name,
        transactionType: category,
        amount: transactionData.amount || transactionData.totalAmount,
        description: transactionData.description || transactionData.note || `${category} transaction`,
        date: new Date().toISOString(),
        status: 'COMPLETED',
        ...transactionData
      };

      const transactionResponse = await ApiService.createTransactionRecord(baseTransactionData);
      
      if (transactionResponse.success) {
        console.log(`Transaction record created successfully for ${category}`);
      }
      
      return transactionResponse;
    } catch (error) {
      console.error(`Failed to create transaction record for ${category}:`, error);
      throw error;
    }
  };

  // Enhanced modal success handlers with database storage
  const handleLoanModalSuccess = async (loanData) => {
    try {
      await handleCreateTransactionRecord({
        amount: loanData.principalAmount || loanData.totalAmount,
        description: `Business loan ${selectedCategory?.id === "business-loan-given" ? "given to" : "taken from"} ${selectedCustomer.name}`,
        loanId: loanData.loanId || loanData._id,
        interestRate: loanData.interestRate,
        durationMonths: loanData.durationMonths
      }, selectedCategory?.id);
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for loan:', error);
      handleModalSuccess();
    }
  };

  const handleInterestModalSuccess = async (interestData) => {
    try {
      console.log('Interest payment success data:', interestData); // Debug log
      await handleCreateTransactionRecord({
        amount: interestData.interestAmount || interestData.amount,
        description: `Gold loan interest payment received from ${selectedCustomer.name}`,
        loanId: interestData.loanId || selectedLoan?._id,
        paymentMethod: interestData.paymentMethod,
        reference: interestData.reference,
        notes: interestData.notes
      }, selectedCategory?.id);
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for gold interest:', error);
      handleModalSuccess();
    }
  };

  const handleLoanPaymentModalSuccess = async (paymentData) => {
    try {
      await handleCreateTransactionRecord({
        amount: (parseFloat(paymentData.principalAmount || 0) + parseFloat(paymentData.interestAmount || 0)),
        description: `Loan repayment ${selectedLoan?.loanType === 'GIVEN' ? "received from" : "paid to"} ${selectedCustomer.name}`,
        loanId: paymentData.loanId || selectedLoan?._id,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        principalAmount: paymentData.principalAmount,
        interestAmount: paymentData.interestAmount
      }, selectedCategory?.id);
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for loan payment:', error);
      handleModalSuccess();
    }
  };

  const handleUdharModalSuccess = async (udharData) => {
    try {
      await handleCreateTransactionRecord({
        amount: udharData.principalAmount || udharData.totalAmount,
        description: `Udhari ${selectedCategory?.id === "udhari-given" ? "given to" : "taken from"} ${selectedCustomer.name}`,
        udharId: udharData.udharId || udharData._id,
        dueDate: udharData.dueDate
      }, selectedCategory?.id);
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for udhari:', error);
      handleModalSuccess();
    }
  };

  const handleUdharPaymentModalSuccess = async (paymentData) => {
    try {
      await handleCreateTransactionRecord({
        amount: paymentData.amount,
        description: `Udhari repayment from ${selectedCustomer.name}`,
        udharId: paymentData.udharId || selectedUdhar?._id,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference
      }, 'udhari-repayment');
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for udhari payment:', error);
      handleModalSuccess();
    }
  };

  // NEW: Handle gold loan success
  const handleGoldLoanModalSuccess = async (loanData) => {
    try {
      await handleCreateTransactionRecord({
        amount: loanData.totalLoanAmount,
        description: `Gold loan given to ${selectedCustomer.name}`,
        loanId: loanData._id,
        interestRate: loanData.interestRateMonthlyPct,
        items: loanData.items
      }, 'gold-loan');
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for gold loan:', error);
      handleModalSuccess();
    }
  };

  // NEW: Handle gold interest success (reuse handleInterestModalSuccess if similar)

  // NEW: Handle item repayment success
  const handleItemRepaymentModalSuccess = async (repaymentData) => {
    try {
      await handleCreateTransactionRecord({
        amount: repaymentData.repaymentAmount,
        description: `Gold loan item repayment from ${selectedCustomer.name}`,
        loanId: selectedLoan?._id,
        selectedItems: repaymentData.selectedItems,
        paymentMethod: repaymentData.paymentMethod
      }, 'gold-loan-repayment');
      
      handleModalSuccess();
    } catch (error) {
      console.error('Failed to create transaction record for item repayment:', error);
      handleModalSuccess();
    }
  };

  // Helper function to close all modals and call onCancel
  const handleModalClose = () => {
    setIsLoanModalOpen(false);
    setIsInterestModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsLoanSelectionModalOpen(false);
    setIsUdharModalOpen(false);
    setIsUdharPaymentModalOpen(false);
    setIsAddGoldLoanModalOpen(false);
    setIsGoldInterestModalOpen(false);
    setIsItemRepaymentModalOpen(false);
    onCancel();
  };

  // Helper function for modal success
  const handleModalSuccess = () => {
    setIsLoanModalOpen(false);
    setIsInterestModalOpen(false);
    setIsPaymentModalOpen(false);
    setIsLoanSelectionModalOpen(false);
    setIsUdharModalOpen(false);
    setIsUdharPaymentModalOpen(false);
    setIsAddGoldLoanModalOpen(false);
    setIsGoldInterestModalOpen(false);
    setIsItemRepaymentModalOpen(false);
    onSuccess();
  };

  // Transaction characteristics
  const isInterestPayment = selectedCategory?.id.includes("interest-received") || selectedCategory?.id.includes("interest-paid");
  const isRepayment = selectedCategory?.id.includes("repayment");
  const isGoldLoan = selectedCategory?.id === "gold-loan";
  const isGoldLoanRepayment = selectedCategory?.id === "gold-loan-repayment";
  const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
  const isMetalBuySell =
    selectedCategory?.id === "gold-sell" ||
    selectedCategory?.id === "gold-purchase" ||
    selectedCategory?.id === "silver-sell" ||
    selectedCategory?.id === "silver-purchase";
  const isUdhariTransaction = selectedCategory?.id.includes("udhari");
  const isLoanTransaction = selectedCategory?.id.includes("loan") || selectedCategory?.id.includes("-l");

  // Categories that are handled entirely by modals
  const modalHandledCategories = [
    "business-loan-given",
    "business-loan-taken",
    "interest-received-l",
    "interest-paid-l",
    "loan-repayment",
    "loan-repayment-collect",
    "loan-repayment-pay",
    "udhari-given",
    "udhari-taken",
    "udhari-repayment",
    "gold-loan", // NEW
    "interest-received-gl", // NEW
    "gold-loan-repayment" // NEW
  ];

  const isModalHandled = modalHandledCategories.includes(selectedCategory?.id);

  // Check for metal buy/sell categories to render specific forms
  const isGoldTransaction = selectedCategory?.id === "gold-sell" || selectedCategory?.id === "gold-purchase";
  const isSilverTransaction = selectedCategory?.id === "silver-sell" || selectedCategory?.id === "silver-purchase";

  // If modal handled, only render modals
  if (isModalHandled) {
    return (
      <>
        <AddLoanModal
          isOpen={isLoanModalOpen}
          onClose={handleModalClose}
          onSuccess={handleLoanModalSuccess}
          selectedCustomer={selectedCustomer}
          loanType={selectedCategory?.id === "business-loan-given" ? "given" : "taken"}
        />
        <LInterestPaymentModal
          isOpen={isInterestModalOpen}
          loan={selectedLoan}
          onClose={handleModalClose}
          onSuccess={handleInterestModalSuccess}
        />
        <LoanPaymentModal
          isOpen={isPaymentModalOpen}
          loan={selectedLoan}
          onClose={handleModalClose}
          onSuccess={handleLoanPaymentModalSuccess}
        />
        <LoanSelectionModal
          isOpen={isLoanSelectionModalOpen}
          onClose={() => {
            setIsLoanSelectionModalOpen(false);
          }}
          availableLoans={availableLoans}
          categoryId={selectedCategory?.id}
          onSelect={(loanId) => {
            const loan = availableLoans.find((loan) => loan._id === loanId);
            setSelectedLoan(loan);
            updateTransactionData({ selectedLoanId: loanId });
            
            setIsLoanSelectionModalOpen(false);
            
            if (selectedCategory?.id === "interest-received-l" || selectedCategory?.id === "interest-paid-l") {
              setIsInterestModalOpen(true);
            } else if (
              selectedCategory?.id === "loan-repayment" ||
              selectedCategory?.id === "loan-repayment-collect" ||
              selectedCategory?.id === "loan-repayment-pay"
            ) {
              setIsPaymentModalOpen(true);
            } else if (selectedCategory?.id === "interest-received-gl") {
              setIsGoldInterestModalOpen(true);
            } else if (selectedCategory?.id === "gold-loan-repayment") {
              setIsItemRepaymentModalOpen(true);
            }
          }}
        />
        <AddUdharModal
          isOpen={isUdharModalOpen}
          onClose={handleModalClose}
          onSuccess={handleUdharModalSuccess}
          selectedCustomer={selectedCustomer}
          udharType={selectedCategory?.id === "udhari-given" ? "given" : "taken"}
        />
        <UdhariPaymentModal
          isOpen={isUdharPaymentModalOpen}
          udhari={selectedUdhar}
          onClose={handleModalClose}
          onSuccess={handleUdharPaymentModalSuccess}
        />
        {/* NEW: Gold Loan Modals */}
        <AddGoldLoanModal
          isOpen={isAddGoldLoanModalOpen}
          onClose={handleModalClose}
          onSave={async (loanData) => {
            const response = await ApiService.createGoldLoan(loanData);
            if (response.success) {
              handleGoldLoanModalSuccess(response.data);
            }
          }}
          selectedCustomer={selectedCustomer} // Passed selected customer
        />
        <InterestPaymentModal
          isOpen={isGoldInterestModalOpen}
          loan={selectedLoan}
          onClose={handleModalClose}
          onPaymentSuccess={handleInterestModalSuccess}
        />
        <ItemRepaymentModal
          isOpen={isItemRepaymentModalOpen}
          loan={selectedLoan}
          onClose={handleModalClose}
          onRepaymentSuccess={handleItemRepaymentModalSuccess}
        />
      </>
    );
  }

  // Render GoldTransactionForm or SilverTransactionForm for metal buy/sell
  if (isGoldTransaction || isSilverTransaction) {
    const FormComponent = isGoldTransaction ? GoldTransactionForm : SilverTransactionForm;
    const ratesProp = isGoldTransaction ? { GoldRates: currentMetalPrices?.gold } : { silverRates: currentMetalPrices?.silver };
    const transactionType = selectedCategory.id.includes("purchase") ? "BUY" : "SELL";

    return (
      <FormComponent
        editingTransaction={null}
        {...ratesProp}
        onClose={onCancel}
        onSuccess={onSuccess}
        onError={(error) => setErrors({ submit: error })}
        initialCustomer={selectedCustomer}
        initialTransactionType={transactionType}
      />
    );
  }

  // Regular form rendering for other categories (non-gold, non-modal)
  return (
    <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 bg-${selectedCategory.color}-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}
                >
                  <selectedCategory.icon
                    size={20}
                    className={`sm:w-6 sm:h-6 text-${selectedCategory.color}-600`}
                  />
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
              <button
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 p-1 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {errors.submit && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {errors.submit}
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              {!isGoldLoan && !isGoldLoanRepayment && !isMetalBuySell && !isUdhariTransaction && (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
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

              {(selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver") || selectedCategory?.id.includes("loan")) &&
                !isGoldLoanRepayment &&
                !isMetalBuySell &&
                !isUdhariTransaction && (
                  <div className="bg-green-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                    <PhotoUpload
                      photos={transactionData.photos}
                      loading={loading}
                      onPhotosChange={(photos) => updateTransactionData({ photos })}
                    />
                  </div>
                )}
            </div>

            {!isGoldLoanRepayment && (
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800 flex items-center justify-center gap-2 px-3 py-2 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
                  disabled={loading}
                >
                  ← Back to Category
                </button>
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
