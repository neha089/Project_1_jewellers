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
  import MetalItemsManager from "../MetalItemsManager";

  // Enhanced Loan Selection Modal
  const LoanSelectionModal = ({ isOpen, onClose, availableLoans, onSelect, categoryId }) => {
    if (!isOpen) return null;

    const getModalTitle = () => {
      if (categoryId.includes("interest-received")) return "Select Loan for Interest Payment";
      if (categoryId.includes("loan-repayment")) return "Select Loan for Repayment";
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
        
        if (selectedCategory.id.includes("gl") || selectedCategory.id === "gold-loan-repayment") {
          // Gold loan specific API
          const response = await ApiService.getGoldLoansByCustomer(selectedCustomer._id);
          loans = response.data || [];
        } else {
          // Business loans
          let apiCalls = [];
          
          if (selectedCategory.id.includes("received") || selectedCategory.id.includes("collect")) {
            // Fetch receivable loans (GIVEN)
            apiCalls.push(ApiService.getOutstandingToCollectLoan());
          } else if (selectedCategory.id.includes("give") || selectedCategory.id.includes("pay")) {
            // Fetch payable loans (TAKEN)
            apiCalls.push(ApiService.getOutstandingToPayLoan());
          } else {
            // Default to both if not specified
            apiCalls = [
              ApiService.getOutstandingToCollectLoan(),
              ApiService.getOutstandingToPayLoan()
            ];
          }

          const responses = await Promise.all(apiCalls);
          const allLoans = [];
          
          // Process receivable if fetched
          if (responses[0] && responses[0].success) {
            const customerData = responses[0].data.customerWise.find(
              item => item.customer._id === selectedCustomer._id
            );
            if (customerData && customerData.loans) {
              allLoans.push(...customerData.loans.map(loan => ({
                ...loan,
                loanType: 'GIVEN'
              })));
            }
          }

          // Process payable if fetched (either second response or first if only payable)
          const payableResponse = apiCalls.length === 1 && (selectedCategory.id.includes("give") || selectedCategory.id.includes("pay"))
            ? responses[0]
            : responses[1];
            
          if (payableResponse && payableResponse.success) {
            const customerData = payableResponse.data.customerWise.find(
              item => item.customer._id === selectedCustomer._id
            );
            if (customerData && customerData.loans) {
              allLoans.push(...customerData.loans.map(loan => ({
                ...loan,
                loanType: 'TAKEN'
              })));
            }
          }
          
          loans = allLoans;
        }
        
        setAvailableLoans(loans.filter((loan) => loan.status === "ACTIVE" || loan.status === "PARTIALLY_PAID"));
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

        // Auto-add default item for metal transactions
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
      const isInterestPayment = selectedCategory?.id.includes("interest");
      const isRepayment = selectedCategory?.id.includes("repayment");
      const isUdhari = selectedCategory?.id.includes("udhari");
      // Fix: Check for both "loan" and "-l" suffix for loan transactions
      const isLoanTransaction = selectedCategory?.id.includes("loan") || selectedCategory?.id.endsWith("-l");

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

      // Loan-dependent categories that need loan selection first
      if (loansLoaded && (categoryId.includes("interest") || categoryId.includes("repayment"))) {
        if (!transactionData.selectedLoanId) {
          console.log('TransactionForm: Opening loan selection modal for', categoryId);
          // Open loan selection modal if no loan is selected
          setIsLoanSelectionModalOpen(true);
        } else {
          console.log('TransactionForm: Loan already selected, opening payment modal for', categoryId);
          // If loan is already selected, open the appropriate payment modal
          const loan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
          if (loan) {
            setSelectedLoan(loan);
            if (categoryId.includes("interest")) {
              console.log('TransactionForm: Opening interest payment modal');
              setIsInterestModalOpen(true);
            } else if (categoryId.includes("repayment")) {
              console.log('TransactionForm: Opening loan repayment modal');
              setIsPaymentModalOpen(true);
            }
          } else {
            console.log('TransactionForm: Selected loan not found, opening loan selection modal');
            setIsLoanSelectionModalOpen(true);
          }
        }
      }

      // Gold loan categories with auto loan selection
      if ((categoryId === "interest-received-gl" || categoryId === "gold-loan-repayment") && 
          transactionData.selectedLoanId) {
        const loan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
        if (loan) {
          setSelectedLoan(loan);
          if (categoryId === "interest-received-gl") {
            setIsInterestModalOpen(true);
          }
        }
      }

      // Udhari repayment
      if ((categoryId === "udhari-received" || categoryId === "udhari-returned") && transactionData.selectedUdhariId) {
        const udhar = availableUdhars.find((udhar) => udhar._id === transactionData.selectedUdhariId);
        if (udhar) {
          setSelectedUdhar(udhar);
          setIsUdharPaymentModalOpen(true);
        }
      }
    }, [loansLoaded, selectedCategory, transactionData.selectedLoanId, transactionData.selectedUdhariId, availableLoans, availableUdhars]);

    // Auto-calculate interest amount when loan is selected
    useEffect(() => {
      if (transactionData.selectedLoanId && selectedCategory?.id.includes("interest-received-gl")) {
        calculateAndSetInterestAmount();
      }
    }, [transactionData.selectedLoanId]);

    // Calculate suggested amounts for loan repayment
    useEffect(() => {
      if (transactionData.selectedLoanId && selectedCategory?.id.includes("repayment")) {
        calculateLoanRepaymentAmounts();
      }
    }, [transactionData.selectedLoanId, selectedCategory?.id]);

    // Auto-calculate total amount for metal transactions
    useEffect(() => {
      if (
        (selectedCategory?.id.includes("gold-sell") || selectedCategory?.id.includes("silver-sell")) &&
        transactionData.items.length > 0
      ) {
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

        setTransactionData((prev) => ({
          ...prev,
          amount: totalAmount.toFixed(2),
        }));
      }
    }, [transactionData.items, selectedCategory?.id]);

    const calculateAndSetInterestAmount = async () => {
      const selectedLoan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
      if (!selectedLoan) return;

      try {
        if (selectedCategory.id === "interest-received-gl") {
          const summary = await ApiService.getGoldLoanInterestSummary(selectedLoan._id);
          setInterestSummary(summary.data);

          if (summary.data?.suggestedInterestAmount) {
            setTransactionData((prev) => ({
              ...prev,
              amount: summary.data.suggestedInterestAmount.toString(),
            }));
          }
        }
      } catch (error) {
        console.error("Failed to calculate interest:", error);
      }
    };

    const calculateLoanRepaymentAmounts = async () => {
      const selectedLoan = availableLoans.find((loan) => loan._id === transactionData.selectedLoanId);
      if (!selectedLoan) return;

      try {
        const response = await ApiService.getLoanDetails(selectedLoan._id);
        const loanDetails = response.data;

        const outstandingPrincipal = loanDetails.outstandingPrincipal / 100;
        const pendingInterest = loanDetails.paymentStatus?.pendingAmount / 100 || 0;

        setTransactionData((prev) => ({
          ...prev,
          principalAmount: outstandingPrincipal.toString(),
          interestAmount: pendingInterest.toString(),
          amount: prev.repaymentType === "full" ? (outstandingPrincipal + pendingInterest).toString() : prev.amount,
        }));
      } catch (error) {
        console.error("Failed to calculate loan repayment amounts:", error);
      }
    };

    // Validation
    const validateForm = () => {
      const newErrors = {};
      const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
      const isMetalBuySell =
        selectedCategory?.id.includes("gold-sell") ||
        selectedCategory?.id.includes("gold-purchase") ||
        selectedCategory?.id.includes("silver-sell") ||
        selectedCategory?.id.includes("silver-purchase");

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
      } else if (
        !selectedCategory?.id.includes("gold-loan-repayment") &&
        !selectedCategory?.id.includes("business-loan") &&
        !selectedCategory?.id.includes("interest") &&
        !selectedCategory?.id.includes("repayment") &&
        !selectedCategory?.id.includes("udhari") &&
        !isMetalBuySell
      ) {
        if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
          newErrors.amount = "Valid amount is required";
        }
      }

      const isInterestPayment = selectedCategory?.id.includes("interest");
      const isRepayment = selectedCategory?.id.includes("repayment");
      if ((isInterestPayment || isRepayment) && !transactionData.selectedLoanId && selectedCategory?.id.includes("loan")) {
        newErrors.selectedLoanId = "Please select a loan";
      }
      if (isRepayment && selectedCategory?.id.includes("udhari") && !transactionData.selectedUdhariId) {
        newErrors.selectedUdhariId = "Please select an udhari";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Transaction submission
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
                images: item.images?.map((img) => img.dataUrl),
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
              items: transactionData.items.map((item) => ({
                itemName: item.itemName,
                description: item.description,
                purity: item.purity,
                weight: parseFloat(item.weight),
                ratePerGram: parseFloat(item.ratePerGram),
                makingCharges: parseFloat(item.makingCharges),
                wastage: parseFloat(item.wastage),
                taxAmount: parseFloat(item.taxAmount),
                photos: item.photos,
                hallmarkNumber: item.hallmarkNumber,
                certificateNumber: item.certificateNumber,
              })),
              advanceAmount: parseFloat(transactionData.advanceAmount || 0),
              paymentMode: transactionData.paymentMode,
              notes: transactionData.description,
              billNumber: transactionData.billNumber,
              fetchCurrentRates: true,
            });
            break;

          case "silver-sell":
          case "silver-purchase":
            response = await ApiService.createSilverTransaction({
              transactionType: selectedCategory.id === "silver-sell" ? "SELL" : "BUY",
              customer: selectedCustomer._id,
              items: transactionData.items.map((item) => ({
                itemName: item.itemName,
                description: item.description,
                purity: item.purity,
                weight: parseFloat(item.weight),
                ratePerGram: parseFloat(item.ratePerGram),
                makingCharges: parseFloat(item.makingCharges),
                wastage: parseFloat(item.wastage),
                taxAmount: parseFloat(item.taxAmount),
                photos: item.photos,
                hallmarkNumber: item.hallmarkNumber,
                certificateNumber: item.certificateNumber,
              })),
              advanceAmount: parseFloat(transactionData.advanceAmount || 0),
              paymentMode: transactionData.paymentMode,
              notes: transactionData.description,
              billNumber: transactionData.billNumber,
              fetchCurrentRates: true,
            });
            break;

          case "interest-received-gl":
            response = await ApiService.makeGoldLoanInterestPayment(
              transactionData.selectedLoanId,
              parseFloat(transactionData.amount),
              transactionData.description || "Interest payment received"
            );
            break;

          case "gold-loan-repayment":
            response = { success: true };
            break;

          default:
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

        // Create transaction record in main transactions collection
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
        // Create transaction record for loan creation
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
        handleModalSuccess(); // Still proceed even if transaction record fails
      }
    };

    const handleInterestModalSuccess = async (interestData) => {
      try {
        // Create transaction record for interest payment
        await handleCreateTransactionRecord({
          amount: interestData.interestAmount || interestData.amount,
          description: `Interest payment ${selectedCategory.id.includes("received") ? "received from" : "given to"} ${selectedCustomer.name}`,
          loanId: interestData.loanId || selectedLoan?._id,
          paymentMethod: interestData.paymentMethod,
          reference: interestData.reference
        }, selectedCategory.id);
        
        handleModalSuccess();
      } catch (error) {
        console.error('Failed to create transaction record for interest:', error);
        handleModalSuccess(); // Still proceed even if transaction record fails
      }
    };

    const handleLoanPaymentModalSuccess = async (paymentData) => {
      try {
        // Create transaction record for loan repayment
        await handleCreateTransactionRecord({
          amount: paymentData.principalAmount || paymentData.amount,
          description: `Loan repayment ${selectedCategory.id.includes("collect") ? "collected from" : "paid to"} ${selectedCustomer.name}`,
          loanId: paymentData.loanId || selectedLoan?._id,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference,
          principalAmount: paymentData.principalAmount,
          interestAmount: paymentData.interestAmount
        }, selectedCategory.id);
        
        handleModalSuccess();
      } catch (error) {
        console.error('Failed to create transaction record for loan payment:', error);
        handleModalSuccess(); // Still proceed even if transaction record fails
      }
    };

    const handleUdharModalSuccess = async (udharData) => {
      try {
        // Create transaction record for udhari creation
        await handleCreateTransactionRecord({
          amount: udharData.principalAmount || udharData.totalAmount,
          description: `Udhari ${selectedCategory?.id === "udhari-given" ? "given to" : "taken from"} ${selectedCustomer.name}`,
          udharId: udharData.udharId || udharData._id,
          dueDate: udharData.dueDate
        }, selectedCategory?.id);
        
        handleModalSuccess();
      } catch (error) {
        console.error('Failed to create transaction record for udhari:', error);
        handleModalSuccess(); // Still proceed even if transaction record fails
      }
    };

    const handleUdharPaymentModalSuccess = async (paymentData) => {
      try {
        // Create transaction record for udhari payment
        await handleCreateTransactionRecord({
          amount: paymentData.amount,
          description: `Udhari repayment ${selectedCategory.id === "udhari-received" ? "received from" : "returned to"} ${selectedCustomer.name}`,
          udharId: paymentData.udharId || selectedUdhar?._id,
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference
        }, selectedCategory.id);
        
        handleModalSuccess();
      } catch (error) {
        console.error('Failed to create transaction record for udhari payment:', error);
        handleModalSuccess(); // Still proceed even if transaction record fails
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
      onSuccess();
    };

    // Determine transaction characteristics
    const isInterestPayment = selectedCategory?.id.includes("interest");
    const isRepayment = selectedCategory?.id.includes("repayment");
    const isGoldLoan = selectedCategory?.id === "gold-loan";
    const isGoldLoanRepayment = selectedCategory?.id === "gold-loan-repayment";
    const isMetalTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
    const isMetalBuySell =
      selectedCategory?.id.includes("gold-sell") ||
      selectedCategory?.id.includes("gold-purchase") ||
      selectedCategory?.id.includes("silver-sell") ||
      selectedCategory?.id.includes("silver-purchase");
    const isUdhariTransaction = selectedCategory?.id.includes("udhari");
    const isLoanTransaction = selectedCategory?.id.includes("loan") || selectedCategory?.id.endsWith("-l");

    // Categories that are handled entirely by modals
    const modalHandledCategories = [
      "business-loan-given",
      "business-loan-taken", 
      "interest-received-l",
      "interest-give-l",
      "loan-repayment-collect",
      "loan-repayment-pay",
      "udhari-given",
      "udhari-taken",
      "udhari-received",
      "udhari-returned"
    ];

    // If modal handled, only render modals
    if (modalHandledCategories.includes(selectedCategory?.id)) {
      return (
        <>
          {/* Business Loan Modals */}
          <AddLoanModal
            isOpen={isLoanModalOpen}
            onClose={handleModalClose}
            onSuccess={handleLoanModalSuccess}
            selectedCustomer={selectedCustomer}
            loanType={selectedCategory?.id === "business-loan-given" ? "given" : "taken"}
          />

          {/* Loan Interest Payment Modal */}
          <LInterestPaymentModal
            isOpen={isInterestModalOpen}
            loan={selectedLoan}
            onClose={handleModalClose}
            onSuccess={handleInterestModalSuccess}
          />

          {/* Loan Principal Payment Modal */}
          <LoanPaymentModal
            isOpen={isPaymentModalOpen}
            loan={selectedLoan}
            onClose={handleModalClose}
            onSuccess={handleLoanPaymentModalSuccess}
          />

          {/* Loan Selection Modal */}
          <LoanSelectionModal
            isOpen={isLoanSelectionModalOpen}
            onClose={() => {
              setIsLoanSelectionModalOpen(false);
              // Don't call onCancel here, just close the modal
            }}
            availableLoans={availableLoans}
            categoryId={selectedCategory?.id}
            onSelect={(loanId) => {
              const loan = availableLoans.find((loan) => loan._id === loanId);
              setSelectedLoan(loan);
              updateTransactionData({ selectedLoanId: loanId });
              
              // Close loan selection and open appropriate payment modal
              setIsLoanSelectionModalOpen(false);
              
              if (isInterestPayment) {
                setIsInterestModalOpen(true);
              } else if (isRepayment) {
                setIsPaymentModalOpen(true);
              }
            }}
          />

          {/* Udhari Modals */}
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
        </>
      );
    }

    // Regular form rendering for non-modal categories
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
                {/* Loan Selection for Gold Loans */}
                {(isInterestPayment || isRepayment) && selectedCategory?.id.includes("gold") && (
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

                {/* Interest Summary for Gold Loans */}
                {isInterestPayment && selectedCategory?.id.includes("gold") && transactionData.selectedLoanId && (
                  <div className="bg-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                    <InterestSummaryCard
                      selectedLoan={availableLoans.find((loan) => loan._id === transactionData.selectedLoanId)}
                      interestSummary={interestSummary}
                      categoryId={selectedCategory.id}
                      currentGoldPrice={currentMetalPrices}
                    />
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

                {/* Metal Items Manager for Buy/Sell */}
                {isMetalTransaction && isMetalBuySell && (
                  <div
                    className={`${selectedCategory?.id.includes("gold") ? "bg-yellow-50" : "bg-gray-50"} p-4 sm:p-5 rounded-lg sm:rounded-xl`}
                  >
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
                      selectedLoan={availableLoans.find((loan) => loan._id === transactionData.selectedLoanId)}
                      onSuccess={onSuccess}
                      onCancel={onBack}
                    />
                  </div>
                )}

                {/* Udhari Selection for Repayment */}
                {isUdhariTransaction && isRepayment && (
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Udhari</label>
                    <select
                      name="selectedUdhariId"
                      value={transactionData.selectedUdhariId}
                      onChange={handleDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      disabled={loading}
                    >
                      <option value="">Select an udhari</option>
                      {availableUdhars.map((udhar) => (
                        <option key={udhar._id} value={udhar._id}>
                          {udhar.note || `Udhari #${udhar._id}`} - ₹{((udhar.outstandingAmount || udhar.principalRupees) / 100).toFixed(2)}
                        </option>
                      ))}
                    </select>
                    {errors.selectedUdhariId && (
                      <p className="text-red-600 text-sm mt-1">{errors.selectedUdhariId}</p>
                    )}
                  </div>
                )}

                {/* Amount Field for non-complex transactions */}
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

                {/* Payment Details for Metal Buy/Sell */}
                {isMetalBuySell && (
                  <div className="bg-blue-50 p-4 sm:p-5 rounded-lg sm:rounded-xl">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount (₹)</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
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

                    {/* Transaction Summary for Metal Buy/Sell */}
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

                {/* Loan Fields for Gold Loans */}
                {selectedCategory?.id.includes("gold-loan") && !isInterestPayment && !isRepayment && (
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

                {/* Photo Upload */}
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

              {/* Footer buttons */}
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
