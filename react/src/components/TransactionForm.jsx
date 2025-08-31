// import React, { useState, useEffect, useCallback } from "react";
// import { 
//   X, Save, Upload, Trash2, Plus, Eye, Info, Calculator, 
//   Clock, CheckCircle, AlertCircle, TrendingUp, Coins,
//   CreditCard, DollarSign, Target
// } from "lucide-react";
// import ApiService from "../services/api";

// const TransactionForm = ({
//   selectedCustomer,
//   selectedCategory,
//   transactionType,
//   onBack,
//   onCancel,
//   onSuccess,
// }) => {
//   const [transactionData, setTransactionData] = useState({
//     amount: "",
//     description: "",
//     date: new Date().toISOString().split("T")[0],
//     goldWeight: "",
//     goldType: "22K",
//     goldPurity: "916",
//     goldRate: "",
//     interestRate: "2.5",
//     durationMonths: "6",
//     selectedLoanId: "",
//     photos: [],
//     items: [
//       {
//         id: Date.now(),
//         name: "",
//         weight: "",
//         amount: "",
//         purity: "22",
//         images: [],
//         autoCalculated: false,
//         marketValue: 0,
//         pricePerGram: 0,
//       },
//     ],
//     // New fields for enhanced functionality
//     selectedItems: [],
//     partialPayment: false,
//     forMonth: "",
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [availableLoans, setAvailableLoans] = useState([]);
//   const [loadingLoans, setLoadingLoans] = useState(false);
//   const [hoveredLoan, setHoveredLoan] = useState(null);
//   const [goldPrices, setGoldPrices] = useState(null);
//   const [loadingPrices, setLoadingPrices] = useState(false);
//   const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
//   const [interestHistory, setInterestHistory] = useState(null);
//   const [repaymentOptions, setRepaymentOptions] = useState(null);
//   const [calculatingAmount, setCalculatingAmount] = useState(false);
//   const [autoCalculationEnabled, setAutoCalculationEnabled] = useState(true);

//   // Load gold prices on component mount
//   useEffect(() => {
//     fetchGoldPrices();
//   }, []);

//   // Load available loans for interest payment categories
//   useEffect(() => {
//     const isInterestPayment = selectedCategory?.id.includes("interest-received");
//     const isRepayment = selectedCategory?.id.includes("repayment");
    
//     if ((isInterestPayment || isRepayment) && selectedCustomer) {
//       fetchCustomerLoans();
//     }
//   }, [selectedCategory, selectedCustomer]);

//   // Auto-calculate amounts when items change
//   useEffect(() => {
//     if (goldPrices && selectedCategory?.id === "gold-loan" && autoCalculationEnabled) {
//       autoCalculateAllItems();
//     }
//   }, [goldPrices, transactionData.items, autoCalculationEnabled]);

//   // Fetch current gold prices
//   const fetchGoldPrices = async () => {
//     setLoadingPrices(true);
//     try {
//       const response = await ApiService.getCurrentGoldPrices();
//       if (response.success) {
//         setGoldPrices(response.data);
//         setTransactionData(prev => ({
//           ...prev,
//           goldRate: response.data.purity22K.toString()
//         }));
//       }
//     } catch (error) {
//       console.error("Failed to fetch gold prices:", error);
//       setErrors(prev => ({...prev, goldPrices: "Failed to load current gold prices"}));
//     } finally {
//       setLoadingPrices(false);
//     }
//   };

//   const fetchCustomerLoans = async () => {
//     setLoadingLoans(true);
//     try {
//       let loans = [];
//       if (selectedCategory.id === "interest-received-gl" || selectedCategory.id === "gold-loan-repayment") {
//         const response = await ApiService.getGoldLoansByCustomer(selectedCustomer._id);
//         loans = response.data || [];
//       } else if (selectedCategory.id === "interest-received-l" || selectedCategory.id === "loan-repayment") {
//         const response = await ApiService.getLoansByCustomer(selectedCustomer._id);
//         loans = response.data || [];
//       }
//       setAvailableLoans(loans.filter(loan => loan.status === 'ACTIVE'));
//     } catch (error) {
//       console.error("Failed to fetch loans:", error);
//       setErrors(prev => ({...prev, loans: "Failed to load loans"}));
//     } finally {
//       setLoadingLoans(false);
//     }
//   };

//   // Auto-calculate amounts for all items
//   const autoCalculateAllItems = useCallback(async () => {
//     if (!goldPrices || selectedCategory?.id !== "gold-loan") return;

//     const updatedItems = await Promise.all(
//       transactionData.items.map(async (item) => {
//         if (item.weight && item.purity && (!item.amount || item.autoCalculated)) {
//           try {
//             const calculation = await ApiService.calculateGoldLoanAmount(
//               parseFloat(item.weight),
//               parseInt(item.purity)
//             );
            
//             if (calculation.success) {
//               return {
//                 ...item,
//                 amount: calculation.data.loanAmount.toFixed(2),
//                 autoCalculated: true,
//                 marketValue: calculation.data.marketValue,
//                 pricePerGram: calculation.data.pricePerGram
//               };
//             }
//           } catch (error) {
//             console.warn('Auto-calculation failed for item:', error);
//           }
//         }
//         return item;
//       })
//     );

//     setTransactionData(prev => ({
//       ...prev,
//       items: updatedItems
//     }));
//   }, [goldPrices, transactionData.items, selectedCategory]);

//   // Calculate individual item amount
//   const handleItemCalculation = async (itemId) => {
//     if (!goldPrices) return;
    
//     const item = transactionData.items.find(i => i.id === itemId);
//     if (!item || !item.weight || !item.purity) return;

//     setCalculatingAmount(true);
//     try {
//       const calculation = await ApiService.calculateGoldLoanAmount(
//         parseFloat(item.weight),
//         parseInt(item.purity)
//       );
      
//       if (calculation.success) {
//         updateItem(itemId, "amount", calculation.data.loanAmount.toFixed(2));
//         updateItem(itemId, "autoCalculated", true);
//         updateItem(itemId, "marketValue", calculation.data.marketValue);
//         updateItem(itemId, "pricePerGram", calculation.data.pricePerGram);
//       }
//     } catch (error) {
//       console.error('Calculation failed:', error);
//     } finally {
//       setCalculatingAmount(false);
//     }
//   };

//   // Fetch loan details and interest history when loan is selected
//   const handleLoanSelection = async (loanId) => {
//     if (!loanId) {
//       setSelectedLoanDetails(null);
//       setInterestHistory(null);
//       setRepaymentOptions(null);
//       return;
//     }

//     try {
//       // Fetch loan details
//       const loanResponse = await ApiService.getGoldLoan(loanId);
//       if (loanResponse.success) {
//         setSelectedLoanDetails(loanResponse.data);
        
//         // Auto-fill amounts based on loan type
//         if (selectedCategory?.id.includes("interest-received")) {
//           const monthlyInterest = (loanResponse.data.principalPaise * loanResponse.data.interestRateMonthlyPct) / 100;
//           setTransactionData(prev => ({
//             ...prev,
//             amount: (monthlyInterest / 100).toFixed(2)
//           }));
//         } else if (selectedCategory?.id.includes("repayment")) {
//           // Calculate current total loan value for repayment
//           const outstandingResponse = await ApiService.getOutstandingSummary(loanId);
//           if (outstandingResponse.success) {
//             const totalOutstanding = outstandingResponse.data.principal.outstanding + 
//                                    outstandingResponse.data.interest.pending;
//             setTransactionData(prev => ({
//               ...prev,
//               amount: (totalOutstanding / 100).toFixed(2)
//             }));
//           }
//         }
//       }

//       // Fetch interest payment history for interest payments
//       if (selectedCategory?.id.includes("interest-received")) {
//         const historyResponse = await ApiService.getInterestPaymentHistory(loanId);
//         if (historyResponse.success) {
//           setInterestHistory(historyResponse.data);
//         }
//       }
//     } catch (error) {
//       console.error("Failed to fetch loan details:", error);
//     }
//   };

//   // Fetch repayment options when amount changes for repayment
//   const handleRepaymentAmountChange = useCallback(async (amount) => {
//     if (!amount || !transactionData.selectedLoanId || !selectedCategory?.id.includes("repayment")) {
//       setRepaymentOptions(null);
//       return;
//     }

//     if (parseFloat(amount) <= 0) return;

//     try {
//       const response = await ApiService.getRepaymentOptions(
//         transactionData.selectedLoanId,
//         parseFloat(amount)
//       );
      
//       if (response.success) {
//         setRepaymentOptions(response.data);
        
//         // Auto-select recommended items
//         if (response.data.returnScenarios && response.data.returnScenarios[0]) {
//           const recommendedItems = response.data.returnScenarios[0].items.map(item => item.itemId);
//           setTransactionData(prev => ({
//             ...prev,
//             selectedItems: recommendedItems
//           }));
//         }
//       }
//     } catch (error) {
//       console.error("Failed to fetch repayment options:", error);
//     }
//   }, [transactionData.selectedLoanId, selectedCategory]);

//   // Debounced repayment calculation
//   useEffect(() => {
//     const timeoutId = setTimeout(() => {
//       if (selectedCategory?.id.includes("repayment") && transactionData.amount) {
//         handleRepaymentAmountChange(transactionData.amount);
//       }
//     }, 500);

//     return () => clearTimeout(timeoutId);
//   }, [transactionData.amount, handleRepaymentAmountChange, selectedCategory]);

//   const handleDataChange = (e) => {
//     const { name, value } = e.target;
//     setTransactionData((prev) => ({ ...prev, [name]: value }));
    
//     if (errors[name]) {
//       setErrors((prev) => ({ ...prev, [name]: "" }));
//     }

//     // Handle specific field changes
//     if (name === "selectedLoanId") {
//       handleLoanSelection(value);
//     }
//   };

//   // Item management functions
//   const addItem = () => {
//     setTransactionData((prev) => ({
//       ...prev,
//       items: [
//         ...prev.items,
//         {
//           id: Date.now(),
//           name: "",
//           weight: "",
//           amount: "",
//           purity: "22",
//           images: [],
//           autoCalculated: false,
//           marketValue: 0,
//           pricePerGram: 0,
//         },
//       ],
//     }));
//   };

//   const removeItem = (itemId) => {
//     setTransactionData((prev) => ({
//       ...prev,
//       items: prev.items.filter((item) => item.id !== itemId),
//     }));
//   };

//   const updateItem = (itemId, field, value) => {
//     setTransactionData((prev) => ({
//       ...prev,
//       items: prev.items.map((item) => {
//         if (item.id === itemId) {
//           const updatedItem = { ...item, [field]: value };
          
//           // Reset auto-calculated flag if manually editing amount
//           if (field === "amount" && item.autoCalculated) {
//             updatedItem.autoCalculated = false;
//           }
          
//           return updatedItem;
//         }
//         return item;
//       }),
//     }));

//     // Trigger auto-calculation if weight or purity changed
//     if ((field === "weight" || field === "purity") && value && autoCalculationEnabled) {
//       setTimeout(() => handleItemCalculation(itemId), 300);
//     }
//   };

//   const handleItemImageUpload = (itemId, e) => {
//     const files = Array.from(e.target.files);
//     files.forEach((file) => {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setTransactionData((prev) => ({
//           ...prev,
//           items: prev.items.map((item) =>
//             item.id === itemId
//               ? {
//                   ...item,
//                   images: [
//                     ...item.images,
//                     {
//                       id: Date.now() + Math.random(),
//                       name: file.name,
//                       dataUrl: e.target.result,
//                     },
//                   ],
//                 }
//               : item
//           ),
//         }));
//       };
//       reader.readAsDataURL(file);
//     });
//   };

//   const removeItemImage = (itemId, imageId) => {
//     setTransactionData((prev) => ({
//       ...prev,
//       items: prev.items.map((item) =>
//         item.id === itemId
//           ? {
//               ...item,
//               images: item.images.filter((img) => img.id !== imageId),
//             }
//           : item
//       ),
//     }));
//   };

//   const handlePhotoUpload = (e) => {
//     const files = Array.from(e.target.files);
//     files.forEach((file) => {
//       if (transactionData.photos.length < 3) {
//         const reader = new FileReader();
//         reader.onload = (e) => {
//           setTransactionData((prev) => ({
//             ...prev,
//             photos: [
//               ...prev.photos,
//               {
//                 id: Date.now() + Math.random(),
//                 name: file.name,
//                 dataUrl: e.target.result,
//               },
//             ],
//           }));
//         };
//         reader.readAsDataURL(file);
//       }
//     });
//   };

//   const removePhoto = (photoId) => {
//     setTransactionData((prev) => ({
//       ...prev,
//       photos: prev.photos.filter((photo) => photo.id !== photoId),
//     }));
//   };

//   const calculateTotalAmount = () => {
//     if (selectedCategory?.id === "gold-loan") {
//       return transactionData.items.reduce(
//         (total, item) => total + (parseFloat(item.amount) || 0),
//         0
//       );
//     }
//     return parseFloat(transactionData.amount) || 0;
//   };

//   const validateForm = () => {
//     const newErrors = {};

//     if (selectedCategory?.id === "gold-loan") {
//       if (transactionData.items.length === 0) {
//         newErrors.items = "At least one item is required";
//       } else {
//         transactionData.items.forEach((item, index) => {
//           if (!item.name.trim()) {
//             newErrors[`item_${index}_name`] = "Item name is required";
//           }
//           if (!item.weight.trim() || parseFloat(item.weight) <= 0) {
//             newErrors[`item_${index}_weight`] = "Valid weight is required";
//           }
//           if (!item.amount.trim() || parseFloat(item.amount) <= 0) {
//             newErrors[`item_${index}_amount`] = "Valid amount is required";
//           }
//         });
//       }
//     } else {
//       if (!transactionData.amount.trim() || parseFloat(transactionData.amount) <= 0) {
//         newErrors.amount = "Valid amount is required";
//       }
//     }

//     const isGoldTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
//     if (isGoldTransaction && selectedCategory?.id !== "gold-loan" && !transactionData.goldWeight.trim()) {
//       newErrors.goldWeight = "Weight is required";
//     }

//     const isInterestPayment = selectedCategory?.id.includes("interest-received");
//     const isRepayment = selectedCategory?.id.includes("repayment");
//     if ((isInterestPayment || isRepayment) && !transactionData.selectedLoanId) {
//       newErrors.selectedLoanId = "Please select a loan";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const submitTransaction = async () => {
//     if (!validateForm()) return;

//     setLoading(true);
//     try {
//       let response;
//       const commonData = {
//         customerId: selectedCustomer._id,
//         amount: transactionData.amount,
//         description: transactionData.description,
//         date: new Date(transactionData.date).toISOString(),
//         photos: transactionData.photos,
//       };

//       switch (selectedCategory.id) {
//         case "gold-loan":
//           response = await ApiService.createGoldLoan({
//             customerId: selectedCustomer._id,
//             items: transactionData.items.map((item) => ({
//               name: item.name,
//               weightGram: parseFloat(item.weight),
//               purityK: parseInt(item.purity),
//               images: item.images.map(img => img.dataUrl),
//             })),
//             interestRate: transactionData.interestRate,
//             durationMonths: transactionData.durationMonths,
//             date: transactionData.date,
//             notes: transactionData.description
//           });
//           break;

//         case "interest-received-gl":
//           response = await ApiService.makeGoldLoanInterestPayment(
//             transactionData.selectedLoanId,
//             parseFloat(transactionData.amount),
//             transactionData.forMonth || null,
//             transactionData.partialPayment,
//             transactionData.description || 'Interest payment received'
//           );
//           break;

//         case "gold-loan-repayment":
//           if (repaymentOptions && repaymentOptions.returnScenarios.length > 0) {
//             response = await ApiService.processItemBasedRepayment(
//               transactionData.selectedLoanId,
//               {
//                 amount: transactionData.amount,
//                 selectedItemIds: transactionData.selectedItems.length > 0 ? 
//                   transactionData.selectedItems : 
//                   repaymentOptions.returnScenarios[0].items.map(item => item.itemId),
//                 returnSelectedItems: true,
//                 photos: transactionData.photos,
//                 notes: transactionData.description || 'Item-based repayment'
//               }
//             );
//           } else {
//             response = await ApiService.makeGoldLoanPayment(
//               transactionData.selectedLoanId,
//               {
//                 principal: transactionData.amount,
//                 interest: 0,
//                 photos: transactionData.photos,
//                 notes: transactionData.description,
//               }
//             );
//           }
//           break;

//         case "gold-sell":
//         case "silver-sell":
//           response = await ApiService.createMetalSale({
//             ...commonData,
//             metal: selectedCategory.id.includes("gold") ? "GOLD" : "SILVER",
//             weight: transactionData.goldWeight,
//             rate: transactionData.goldRate,
//             purity: transactionData.goldPurity,
//           });
//           break;

//         case "interest-received-l":
//           response = await ApiService.makeLoanInterestPayment(
//             transactionData.selectedLoanId,
//             parseFloat(transactionData.amount)
//           );
//           break;

//         case "loan-repayment":
//           response = await ApiService.makeLoanPayment(
//             transactionData.selectedLoanId,
//             {
//               principal: transactionData.amount,
//               interest: 0,
//               photos: transactionData.photos,
//               notes: transactionData.description,
//             }
//           );
//           break;

//         case "business-loan-taken":
//           response = await ApiService.createLoan(
//             {
//               ...commonData,
//               interestRate: transactionData.interestRate,
//               durationMonths: transactionData.durationMonths,
//             },
//             1
//           );
//           break;

//         case "business-loan-given":
//           response = await ApiService.createLoan(
//             {
//               ...commonData,
//               interestRate: transactionData.interestRate,
//               durationMonths: transactionData.durationMonths,
//             },
//             -1
//           );
//           break;

//         case "udhari-given":
//           response = await ApiService.giveUdhari({
//             ...commonData,
//             installments: 3,
//           });
//           break;

//         case "gold-purchase":
//         case "silver-purchase":
//           response = await ApiService.createGoldPurchase({
//             ...commonData,
//             partyName: selectedCustomer.name,
//             goldWeight: transactionData.goldWeight,
//             goldType: transactionData.goldType,
//             metal: selectedCategory.id.includes("gold") ? "GOLD" : "SILVER",
//           });
//           break;

//         default:
//           console.log("Transaction data:", commonData);
//           response = { success: true };
//           break;
//       }

//       if (response?.success !== false) {
//         onSuccess(response);
//       } else {
//         throw new Error(response?.message || "Transaction failed");
//       }
//     } catch (error) {
//       console.error("Transaction failed:", error);
//       setErrors({
//         submit: error.message || "Failed to save transaction. Please try again.",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const isGoldTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
//   const isLoanTransaction = selectedCategory?.id.includes("loan");
//   const isInterestPayment = selectedCategory?.id.includes("interest-received");
//   const isRepayment = selectedCategory?.id.includes("repayment");
//   const isGoldLoan = selectedCategory?.id === "gold-loan";
//   const metalType = selectedCategory?.id.includes("silver") ? "Silver" : "Gold";

//   // Enhanced Interest Payment History Component
//   const InterestPaymentHistory = ({ history }) => {
//     if (!history) return null;

//     const summary = history.summary || {};
//     const recentPayments = history.interestHistory?.slice(0, 6) || [];

//     return (
//       <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//         <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
//           <Clock size={16} />
//           Interest Payment Summary
//         </h5>
        
//         {/* Summary Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-blue-600">Monthly Interest</div>
//             <div className="font-semibold text-blue-900">
//               ₹{(summary.monthlyInterestAmount || 0).toFixed(2)}
//             </div>
//           </div>
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-green-600">Total Received</div>
//             <div className="font-semibold text-green-800">
//               ₹{(summary.totalInterestReceivedRupees || 0).toFixed(2)}
//             </div>
//           </div>
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-red-600">Pending</div>
//             <div className="font-semibold text-red-700">
//               ₹{(summary.totalPendingInterestRupees || 0).toFixed(2)}
//             </div>
//           </div>
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-gray-600">Months</div>
//             <div className="font-semibold text-gray-800">
//               {summary.paidMonths || 0}/{summary.totalMonths || 0}
//             </div>
//           </div>
//         </div>

//         {/* Recent Payments */}
//         {recentPayments.length > 0 ? (
//           <div className="space-y-2">
//             <div className="text-sm font-medium text-blue-800">Recent Payments:</div>
//             {recentPayments.map((payment, index) => (
//               <div key={index} className="bg-white rounded p-3 border border-blue-100">
//                 <div className="flex justify-between items-center">
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium text-blue-900">
//                       {payment.monthName} {payment.year}
//                     </span>
//                     {payment.status === 'PAID' && (
//                       <CheckCircle size={14} className="text-green-600" />
//                     )}
//                     {payment.status === 'PARTIAL' && (
//                       <AlertCircle size={14} className="text-yellow-600" />
//                     )}
//                   </div>
//                   <div className="text-right">
//                     <div className="font-semibold text-gray-900">
//                       ₹{(payment.interestPaid / 100).toFixed(2)}
//                     </div>
//                     {payment.remainingAmount > 0 && (
//                       <div className="text-xs text-red-600">
//                         Pending: ₹{(payment.remainingAmount / 100).toFixed(2)}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 {payment.payments && payment.payments.length > 0 && (
//                   <div className="text-xs text-gray-600 mt-1">
//                     Last payment: {new Date(payment.payments[0].date).toLocaleDateString()}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
//             <div className="flex items-center gap-2 text-yellow-800">
//               <AlertCircle size={16} />
//               <span className="text-sm">No interest payments found</span>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Enhanced Repayment Options Component
//   const RepaymentOptionsDisplay = ({ options }) => {
//     if (!options || !options.returnScenarios.length) return null;

//     const recommendedScenario = options.returnScenarios[0];
//     const allItems = options.allItems || [];

//     return (
//       <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//         <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
//           <Coins size={16} />
//           Repayment Analysis
//         </h5>
        
//         {/* Loan Value Summary */}
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-green-600">Payment Amount</div>
//             <div className="font-semibold text-green-900">
//               ₹{options.repaymentAmount.toFixed(2)}
//             </div>
//           </div>
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-blue-600">Current Loan Value</div>
//             <div className="font-semibold text-blue-900">
//               ₹{options.totalCurrentLoanValue.toFixed(2)}
//             </div>
//           </div>
//           <div className="bg-white rounded p-2">
//             <div className="text-xs text-purple-600">Active Items</div>
//             <div className="font-semibold text-purple-900">
//               {allItems.length} items
//             </div>
//           </div>
//         </div>

//         {/* Recommended Scenario */}
//         <div className="bg-white border border-green-200 rounded p-3 mb-3">
//           <div className="flex justify-between items-center mb-2">
//             <span className="font-medium text-green-800">Recommended Return</span>
//             <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
//               Best Option
//             </span>
//           </div>
          
//           <div className="grid grid-cols-2 gap-4 text-sm mb-3">
//             <div>
//               <span className="text-green-600">Items to Return:</span>
//               <div className="font-medium">{recommendedScenario.itemCount} items</div>
//             </div>
//             <div>
//               <span className="text-green-600">Excess Amount:</span>
//               <div className="font-medium text-green-800">
//                 ₹{(recommendedScenario.excessAmount / 100).toFixed(2)}
//               </div>
//             </div>
//           </div>
          
//           {recommendedScenario.items.length > 0 && (
//             <div>
//               <div className="text-xs text-green-600 mb-2">Items to be returned:</div>
//               <div className="max-h-32 overflow-y-auto space-y-1">
//                 {recommendedScenario.items.map((item, idx) => (
//                   <div key={idx} className="text-xs bg-green-50 rounded p-2 flex justify-between items-center">
//                     <div>
//                       <span className="font-medium">{item.name}</span>
//                       <span className="text-green-600 ml-2">({item.weightGram}g, {item.purityK}K)</span>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-medium">₹{(item.currentValuePaise / 100).toFixed(2)}</div>
//                       {item.originalValuePaise !== item.currentValuePaise && (
//                         <div className="text-xs text-gray-600">
//                           (Was: ₹{(item.originalValuePaise / 100).toFixed(2)})
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Custom Item Selection */}
//         <div className="border-t border-green-200 pt-3">
//           <div className="text-sm font-medium text-green-800 mb-2">
//             Or select specific items to return:
//           </div>
//           <div className="space-y-2 max-h-40 overflow-y-auto">
//             {allItems.map((item, idx) => (
//               <label key={idx} className="flex items-center gap-3 p-2 bg-white rounded border cursor-pointer hover:bg-green-50">
//                 <input
//                   type="checkbox"
//                   checked={transactionData.selectedItems.includes(item.itemId)}
//                   onChange={(e) => {
//                     const itemId = item.itemId;
//                     if (e.target.checked) {
//                       setTransactionData(prev => ({
//                         ...prev,
//                         selectedItems: [...prev.selectedItems, itemId]
//                       }));
//                     } else {
//                       setTransactionData(prev => ({
//                         ...prev,
//                         selectedItems: prev.selectedItems.filter(id => id !== itemId)
//                       }));
//                     }
//                   }}
//                   className="rounded"
//                 />
//                 <div className="flex-1">
//                   <div className="font-medium text-sm">{item.name}</div>
//                   <div className="text-xs text-gray-600">
//                     {item.weightGram}g, {item.purityK}K • Current: ₹{item.currentValueRupees.toFixed(2)}
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <div className="text-sm font-medium">
//                     ₹{item.currentValueRupees.toFixed(2)}
//                   </div>
//                   {item.priceChangeRupees !== 0 && (
//                     <div className={`text-xs ${item.priceChangeRupees > 0 ? 'text-green-600' : 'text-red-600'}`}>
//                       {item.priceChangeRupees > 0 ? '+' : ''}₹{item.priceChangeRupees.toFixed(2)}
//                     </div>
//                   )}
//                 </div>
//               </label>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Enhanced Loan Tooltip Component
//   const LoanTooltip = ({ loan, isVisible }) => {
//     if (!isVisible || !loan) return null;

//     const totalPaid = loan.summary?.totalPrincipalPaid || 0;
//     const outstanding = loan.summary?.outstandingPrincipal || 0;
//     const monthlyInterest = loan.principalPaise ? Math.round((loan.principalPaise * loan.interestRateMonthlyPct) / 100) : 0;

//     return (
//       <div className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-2 w-80 max-w-sm">
//         <div className="space-y-2">
//           <div className="font-semibold text-gray-900">Loan Details</div>
//           <div className="grid grid-cols-2 gap-2 text-sm">
//             <div>
//               <span className="text-gray-600">Principal:</span>
//               <div className="font-medium">₹{(loan.principalPaise / 100).toFixed(2)}</div>
//             </div>
//             <div>
//               <span className="text-gray-600">Outstanding:</span>
//               <div className="font-medium text-red-600">₹{(outstanding / 100).toFixed(2)}</div>
//             </div>
//             <div>
//               <span className="text-gray-600">Interest Rate:</span>
//               <div className="font-medium">{loan.interestRateMonthlyPct}% per month</div>
//             </div>
//             <div>
//               <span className="text-gray-600">Monthly Interest:</span>
//               <div className="font-medium">₹{(monthlyInterest / 100).toFixed(2)}</div>
//             </div>
//           </div>
          
//           {loan.items && loan.items.length > 0 && (
//             <div className="border-t pt-2">
//               <div className="text-xs text-gray-600 mb-1">Items ({loan.items.length}):</div>
//               <div className="max-h-20 overflow-y-auto">
//                 {loan.items.filter(item => !item.returnDate).slice(0, 3).map((item, idx) => (
//                   <div key={idx} className="text-xs text-gray-700">
//                     {item.name} - {item.weightGram}g ({item.purityK}K)
//                   </div>
//                 ))}
//                 {loan.items.filter(item => !item.returnDate).length > 3 && (
//                   <div className="text-xs text-gray-500">
//                     +{loan.items.filter(item => !item.returnDate).length - 3} more items
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
          
//           <div className="text-xs text-gray-500">
//             Started: {new Date(loan.startDate).toLocaleDateString()}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-4xl mx-auto">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <div className={`w-10 h-10 bg-${selectedCategory.color}-100 rounded-lg flex items-center justify-center`}>
//             <selectedCategory.icon size={20} className={`text-${selectedCategory.color}-600`} />
//           </div>
//           <div>
//             <h3 className="text-lg font-semibold text-gray-900">{selectedCategory.label}</h3>
//             <p className="text-sm text-gray-500">{selectedCustomer.name}</p>
//           </div>
//         </div>
//         <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
//           <X size={20} />
//         </button>
//       </div>

//       {/* Current Gold Prices Display */}
//       {goldPrices && isGoldTransaction && (
//         <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex items-center gap-2">
//               <TrendingUp className="text-yellow-600" size={16} />
//               <h4 className="font-medium text-yellow-900">Current Gold Prices</h4>
//               {goldPrices.isDefault && (
//                 <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Default</span>
//               )}
//             </div>
//             <button
//               onClick={fetchGoldPrices}
//               disabled={loadingPrices}
//               className="text-xs text-yellow-700 hover:text-yellow-900 flex items-center gap-1"
//             >
//               <Calculator size={12} />
//               {loadingPrices ? 'Updating...' : 'Refresh'}
//             </button>
//           </div>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
//             <div className="bg-white rounded p-2">
//               <span className="text-yellow-700">22K Gold:</span>
//               <div className="font-medium">₹{goldPrices.purity22K}/g</div>
//             </div>
//             <div className="bg-white rounded p-2">
//               <span className="text-yellow-700">24K Gold:</span>
//               <div className="font-medium">₹{goldPrices.purity24K}/g</div>
//             </div>
//             <div className="bg-white rounded p-2">
//               <span className="text-yellow-700">18K Gold:</span>
//               <div className="font-medium">₹{goldPrices.purity18K}/g</div>
//             </div>
//             <div className="bg-white rounded p-2">
//               <span className="text-yellow-700">Silver:</span>
//               <div className="font-medium">₹{goldPrices.silverPrice}/g</div>
//             </div>
//           </div>
//           {isGoldLoan && (
//             <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 rounded p-2">
//               Loan amounts are auto-calculated at 85% of current market value
//             </div>
//           )}
//         </div>
//       )}

//       {errors.submit && (
//         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
//           {errors.submit}
//         </div>
//       )}

//       <div className="space-y-6">
//         {/* Loan Selection for Interest Payments and Repayments */}
//         {(isInterestPayment || isRepayment) && (
//           <div className="space-y-4">
//             <div className="relative">
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Select Loan *
//                 {availableLoans.length > 0 && (
//                   <span className="text-xs text-gray-500 ml-2">
//                     (Hover for details)
//                   </span>
//                 )}
//               </label>
//               {loadingLoans ? (
//                 <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
//                   Loading loans...
//                 </div>
//               ) : (
//                 <>
//                   <select
//                     name="selectedLoanId"
//                     value={transactionData.selectedLoanId}
//                     onChange={handleDataChange}
//                     onMouseOver={(e) => {
//                       const loanId = e.target.value;
//                       const loan = availableLoans.find(l => l._id === loanId);
//                       setHoveredLoan(loan);
//                     }}
//                     onMouseLeave={() => setHoveredLoan(null)}
//                     className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                       errors.selectedLoanId ? "border-red-300" : "border-gray-300"
//                     }`}
//                     disabled={loading}
//                   >
//                     <option value="">Choose a loan...</option>
//                     {availableLoans.map((loan) => {
//                       const outstanding = loan.summary?.outstandingPrincipal || 0;
//                       const activeItems = loan.items?.filter(item => !item.returnDate) || [];
                      
//                       return (
//                         <option key={loan._id} value={loan._id}>
//                           Loan #{loan._id.slice(-6)} - ₹{(loan.principalPaise / 100).toFixed(0)} 
//                           (Outstanding: ₹{(outstanding / 100).toFixed(0)}) - {activeItems.length} items
//                         </option>
//                       );
//                     })}
//                   </select>
                  
//                   {hoveredLoan && (
//                     <LoanTooltip loan={hoveredLoan} isVisible={true} />
//                   )}
//                 </>
//               )}
//               {errors.selectedLoanId && (
//                 <p className="text-red-500 text-xs mt-1">{errors.selectedLoanId}</p>
//               )}
//               {errors.loans && (
//                 <p className="text-red-500 text-xs mt-1">{errors.loans}</p>
//               )}
//             </div>

//             {/* Show Interest Payment History */}
//             {isInterestPayment && interestHistory && (
//               <InterestPaymentHistory history={interestHistory} />
//             )}

//             {/* Show Repayment Options */}
//             {isRepayment && repaymentOptions && (
//               <RepaymentOptionsDisplay options={repaymentOptions} />
//             )}
//           </div>
//         )}

//         {/* Items Management for Gold Loans */}
//         {isGoldLoan && (
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h4 className="text-md font-medium text-gray-900 flex items-center gap-2">
//                 Gold Items
//                 {autoCalculationEnabled && (
//                   <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
//                     <Calculator size={10} />
//                     Auto-calc ON
//                   </span>
//                 )}
//               </h4>
//               <div className="flex items-center gap-2">
//                 <button
//                   type="button"
//                   onClick={() => setAutoCalculationEnabled(!autoCalculationEnabled)}
//                   className={`text-xs px-2 py-1 rounded transition-colors ${
//                     autoCalculationEnabled 
//                       ? 'bg-green-100 text-green-800 hover:bg-green-200' 
//                       : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                   }`}
//                 >
//                   {autoCalculationEnabled ? 'Disable Auto-calc' : 'Enable Auto-calc'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={addItem}
//                   className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
//                   disabled={loading}
//                 >
//                   <Plus size={16} />
//                   Add Item
//                 </button>
//               </div>
//             </div>

//             {transactionData.items.map((item, index) => (
//               <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
//                 <div className="flex items-center justify-between">
//                   <h5 className="font-medium text-gray-800">Item {index + 1}</h5>
//                   <div className="flex items-center gap-2">
//                     {item.autoCalculated && (
//                       <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
//                         <Calculator size={10} />
//                         Auto-calculated
//                       </span>
//                     )}
//                     {calculatingAmount && (
//                       <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
//                         <Clock size={10} />
//                         Calculating...
//                       </span>
//                     )}
//                     {transactionData.items.length > 1 && (
//                       <button
//                         type="button"
//                         onClick={() => removeItem(item.id)}
//                         className="text-red-500 hover:text-red-700"
//                         disabled={loading}
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Item Name *
//                     </label>
//                     <input
//                       type="text"
//                       value={item.name}
//                       onChange={(e) => updateItem(item.id, "name", e.target.value)}
//                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                         errors[`item_${index}_name`] ? "border-red-300" : "border-gray-300"
//                       }`}
//                       placeholder="e.g., Gold Chain, Ring, Coin"
//                       disabled={loading}
//                     />
//                     {errors[`item_${index}_name`] && (
//                       <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Weight (grams) *
//                     </label>
//                     <input
//                       type="number"
//                       step="0.1"
//                       value={item.weight}
//                       onChange={(e) => updateItem(item.id, "weight", e.target.value)}
//                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                         errors[`item_${index}_weight`] ? "border-red-300" : "border-gray-300"
//                       }`}
//                       placeholder="0.0"
//                       disabled={loading}
//                     />
//                     {errors[`item_${index}_weight`] && (
//                       <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
//                     )}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Purity (K)
//                     </label>
//                     <select
//                       value={item.purity}
//                       onChange={(e) => updateItem(item.id, "purity", e.target.value)}
//                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                       disabled={loading}
//                     >
//                       <option value="24">24K</option>
//                       <option value="22">22K</option>
//                       <option value="18">18K</option>
//                       <option value="14">14K</option>
//                     </select>
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       Amount (₹) *
//                       {item.autoCalculated && (
//                         <button
//                           type="button"
//                           onClick={() => handleItemCalculation(item.id)}
//                           className="ml-2 text-xs text-blue-600 hover:text-blue-800"
//                           disabled={loading || calculatingAmount}
//                         >
//                           Recalculate
//                         </button>
//                       )}
//                     </label>
//                     <input
//                       type="number"
//                       value={item.amount}
//                       onChange={(e) => updateItem(item.id, "amount", e.target.value)}
//                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                         errors[`item_${index}_amount`] ? "border-red-300" : "border-gray-300"
//                       } ${item.autoCalculated ? "bg-green-50" : ""}`}
//                       placeholder="Auto-calculated based on weight & purity"
//                       disabled={loading}
//                     />
//                     {errors[`item_${index}_amount`] && (
//                       <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_amount`]}</p>
//                     )}
//                     {item.autoCalculated && item.marketValue && (
//                       <div className="text-xs mt-1 space-y-1">
//                         <p className="text-green-600">
//                           Market value: ₹{item.marketValue.toFixed(2)} (Rate: ₹{item.pricePerGram}/g)
//                         </p>
//                         <p className="text-blue-600">
//                           Loan amount: ₹{item.amount} (85% of market value)
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Item Images */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Item Photos
//                   </label>
//                   <div className="border border-dashed border-gray-300 rounded-lg p-3">
//                     <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
//                       Add Photos
//                       <input
//                         type="file"
//                         multiple
//                         accept="image/*"
//                         onChange={(e) => handleItemImageUpload(item.id, e)}
//                         className="hidden"
//                         disabled={loading}
//                       />
//                     </label>
//                   </div>

//                   {item.images.length > 0 && (
//                     <div className="grid grid-cols-4 gap-2 mt-2">
//                       {item.images.map((image) => (
//                         <div key={image.id} className="relative group">
//                           <img
//                             src={image.dataUrl}
//                             alt={image.name}
//                             className="w-full h-16 object-cover rounded border"
//                           />
//                           <button
//                             type="button"
//                             onClick={() => removeItemImage(item.id, image.id)}
//                             className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                             disabled={loading}
//                           >
//                             <X size={10} />
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}

//             {errors.items && (
//               <p className="text-red-500 text-sm">{errors.items}</p>
//             )}

//             {/* Total Amount Display for Gold Loans */}
//             <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
//               <div className="flex justify-between items-center">
//                 <span className="font-medium text-gray-700 flex items-center gap-2">
//                   <DollarSign size={16} className="text-blue-600" />
//                   Total Loan Amount:
//                 </span>
//                 <span className="text-2xl font-bold text-blue-600">
//                   ₹{calculateTotalAmount().toFixed(2)}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center mt-2 text-sm">
//                 <span className="text-gray-600">
//                   {transactionData.items.length} item{transactionData.items.length > 1 ? 's' : ''} • 
//                   Total weight: {transactionData.items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(1)}g
//                 </span>
//                 <span className="text-blue-600 flex items-center gap-1">
//                   <Info size={12} />
//                   85% of market value
//                 </span>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Enhanced Amount Field for Interest and Repayment */}
//         {(isInterestPayment || isRepayment) && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Amount (₹) *
//                 {isInterestPayment && selectedLoanDetails && (
//                   <span className="text-xs text-green-600 ml-2">
//                     (Monthly: ₹{((selectedLoanDetails.principalPaise * selectedLoanDetails.interestRateMonthlyPct / 100) / 100).toFixed(2)})
//                   </span>
//                 )}
//                 {isRepayment && repaymentOptions && (
//                   <span className="text-xs text-blue-600 ml-2">
//                     (Total outstanding: ₹{repaymentOptions.totalCurrentLoanValue.toFixed(2)})
//                   </span>
//                 )}
//               </label>
//               <div className="relative">
//                 <input
//                   type="number"
//                   name="amount"
//                   value={transactionData.amount}
//                   onChange={handleDataChange}
//                   className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                     errors.amount ? "border-red-300" : "border-gray-300"
//                   }`}
//                   placeholder={isInterestPayment ? "Pre-filled with monthly interest" : "Enter repayment amount"}
//                   disabled={loading}
//                 />
//                 {isInterestPayment && (
//                   <div className="absolute right-2 top-2">
//                     <Calculator size={16} className="text-green-600" />
//                   </div>
//                 )}
//               </div>
//               {errors.amount && (
//                 <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
//               )}
              
//               {/* Partial Payment Option for Interest */}
//               {isInterestPayment && (
//                 <div className="mt-2">
//                   <label className="flex items-center gap-2 text-sm text-gray-700">
//                     <input
//                       type="checkbox"
//                       checked={transactionData.partialPayment}
//                       onChange={(e) => setTransactionData(prev => ({
//                         ...prev,
//                         partialPayment: e.target.checked
//                       }))}
//                       className="rounded"
//                     />
//                     This is a partial payment
//                   </label>
//                   {transactionData.partialPayment && (
//                     <p className="text-xs text-yellow-600 mt-1">
//                       Remaining amount will be added to next month's interest
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Date
//               </label>
//               <input
//                 type="date"
//                 name="date"
//                 value={transactionData.date}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={loading}
//               />
//             </div>
//           </div>
//         )}

//         {/* Regular Amount Field for Non-Gold-Loan, Non-Interest, Non-Repayment Transactions */}
//         {!isGoldLoan && !isInterestPayment && !isRepayment && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Amount (₹) *
//               </label>
//               <input
//                 type="number"
//                 name="amount"
//                 value={transactionData.amount}
//                 onChange={handleDataChange}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.amount ? "border-red-300" : "border-gray-300"
//                 }`}
//                 placeholder="Enter amount"
//                 disabled={loading}
//               />
//               {errors.amount && (
//                 <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Date
//               </label>
//               <input
//                 type="date"
//                 name="date"
//                 value={transactionData.date}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={loading}
//               />
//             </div>
//           </div>
//         )}

//         {/* Gold Transaction Fields (excluding gold-loan) */}
//         {isGoldTransaction && !isGoldLoan && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {metalType} Weight (grams) *
//               </label>
//               <input
//                 type="number"
//                 step="0.1"
//                 name="goldWeight"
//                 value={transactionData.goldWeight}
//                 onChange={handleDataChange}
//                 className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//                   errors.goldWeight ? "border-red-300" : "border-gray-300"
//                 }`}
//                 placeholder="Enter weight"
//                 disabled={loading}
//               />
//               {errors.goldWeight && (
//                 <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {metalType} Type
//               </label>
//               <select
//                 name="goldType"
//                 value={transactionData.goldType}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={loading}
//               >
//                 <option value="24K">24K {metalType}</option>
//                 <option value="22K">22K {metalType}</option>
//                 <option value="18K">18K {metalType}</option>
//                 <option value="14K">14K {metalType}</option>
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 {metalType} Rate (₹/gram)
//               </label>
//               <input
//                 type="number"
//                 name="goldRate"
//                 value={transactionData.goldRate}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder={`Current ${metalType.toLowerCase()} rate`}
//                 disabled={loading}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Purity
//               </label>
//               <input
//                 type="text"
//                 name="goldPurity"
//                 value={transactionData.goldPurity}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="916"
//                 disabled={loading}
//               />
//             </div>
//           </div>
//         )}

//         {/* Loan Configuration */}
//         {isLoanTransaction && !isInterestPayment && !isRepayment && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Interest Rate (% per month)
//               </label>
//               <input
//                 type="number"
//                 step="0.1"
//                 name="interestRate"
//                 value={transactionData.interestRate}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 placeholder="2.5"
//                 disabled={loading}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Duration (months)
//               </label>
//               <select
//                 name="durationMonths"
//                 value={transactionData.durationMonths}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={loading}
//               >
//                 <option value="3">3 Months</option>
//                 <option value="6">6 Months</option>
//                 <option value="9">9 Months</option>
//                 <option value="12">12 Months</option>
//                 <option value="18">18 Months</option>
//                 <option value="24">24 Months</option>
//               </select>
//             </div>
//           </div>
//         )}

//         {/* Enhanced Month Selection for Interest Payments */}
//         {isInterestPayment && (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Payment For Month (Optional)
//               </label>
//               <input
//                 type="month"
//                 name="forMonth"
//                 value={transactionData.forMonth}
//                 onChange={handleDataChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 disabled={loading}
//               />
//               <p className="text-xs text-gray-500 mt-1">
//                 Leave blank for current month
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Description */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">
//             Description / Notes
//           </label>
//           <textarea
//             name="description"
//             value={transactionData.description}
//             onChange={handleDataChange}
//             rows={3}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             placeholder="Enter transaction details..."
//             disabled={loading}
//           />
//         </div>

//         {/* Photos Upload */}
//         {(isGoldTransaction || isLoanTransaction || isInterestPayment || isRepayment) && (
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Photos (Optional)
//             </label>
//             <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
//               <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
//               <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
//                 Upload Photos
//                 <input
//                   type="file"
//                   multiple
//                   accept="image/*"
//                   onChange={handlePhotoUpload}
//                   className="hidden"
//                   disabled={loading}
//                 />
//               </label>
//               <p className="text-xs text-gray-500 mt-2">Max 3 photos</p>
//             </div>

//             {transactionData.photos.length > 0 && (
//               <div className="grid grid-cols-3 gap-3 mt-3">
//                 {transactionData.photos.map((photo) => (
//                   <div key={photo.id} className="relative group">
//                     <img
//                       src={photo.dataUrl}
//                       alt={photo.name}
//                       className="w-full h-20 object-cover rounded-lg border"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removePhoto(photo.id)}
//                       className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
//                       disabled={loading}
//                     >
//                       <Trash2 size={12} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         )}

//         {/* Transaction Summary */}
//         {!isGoldLoan && (calculateTotalAmount() > 0 || (isInterestPayment && selectedLoanDetails)) && (
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//             <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
//               <Target size={16} />
//               Transaction Summary
//             </h4>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
//               <div>
//                 <span className="text-gray-600">Transaction Type:</span>
//                 <div className="font-medium text-gray-900">{selectedCategory.label}</div>
//               </div>
//               <div>
//                 <span className="text-gray-600">Amount:</span>
//                 <div className="font-bold text-blue-600">₹{calculateTotalAmount().toFixed(2)}</div>
//               </div>
//               <div>
//                 <span className="text-gray-600">Customer:</span>
//                 <div className="font-medium text-gray-900">{selectedCustomer.name}</div>
//               </div>
//             </div>
            
//             {isInterestPayment && selectedLoanDetails && (
//               <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
//                 Loan #{selectedLoanDetails._id.slice(-6)} • 
//                 Principal: ₹{(selectedLoanDetails.principalPaise / 100).toFixed(2)} • 
//                 Rate: {selectedLoanDetails.interestRateMonthlyPct}%/month
//               </div>
//             )}
            
//             {isRepayment && repaymentOptions && (
//               <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
//                 Will return {repaymentOptions.returnScenarios[0]?.itemCount || 0} items • 
//                 Excess: ₹{((repaymentOptions.returnScenarios[0]?.excessAmount || 0) / 100).toFixed(2)}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Action Buttons */}
//       <div className="flex justify-between gap-3 mt-6">
//         <button
//           onClick={onBack}
//           className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
//           disabled={loading}
//         >
//           ← Back to Category
//         </button>
//         <div className="flex gap-3">
//           <button
//             onClick={onCancel}
//             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//             disabled={loading}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={submitTransaction}
//             disabled={loading || calculatingAmount}
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
//           >
//             <Save size={16} />
//             {loading ? "Saving..." : calculatingAmount ? "Calculating..." : "Save Transaction"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransactionForm;

// TransactionForm.jsx
// TransactionForm.jsx - Fixed API Integration
import React, { useState, useEffect, useCallback } from "react";
import { X, Save } from "lucide-react";
import ApiService from "../services/api";
import GoldPriceService from "../services/goldPriceService";
import LoanSelection from "./LoanSelection";
import GoldItemsManager from "./GoldItemsManager";
import TransactionFields from "./TransactionFields";
import PhotoUpload from "./PhotoUpload";
import TransactionSummary from "./TransactionSummary";

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
    goldRate: "",
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
        autoCalculated: false,
        marketValue: 0,
        pricePerGram: 0,
      },
    ],
    selectedItems: [],
    partialPayment: false,
    forMonth: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableLoans, setAvailableLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [goldPrices, setGoldPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [interestHistory, setInterestHistory] = useState(null);
  const [repaymentOptions, setRepaymentOptions] = useState(null);
  const [calculatingAmount, setCalculatingAmount] = useState(false);
  const [autoCalculationEnabled, setAutoCalculationEnabled] = useState(true);

  // Load gold prices on component mount
  useEffect(() => {
    fetchGoldPrices();
  }, []);

  // Load available loans for interest payment categories
  useEffect(() => {
    const isInterestPayment = selectedCategory?.id.includes("interest-received");
    const isRepayment = selectedCategory?.id.includes("repayment");
    
    if ((isInterestPayment || isRepayment) && selectedCustomer) {
      fetchCustomerLoans();
    }
  }, [selectedCategory, selectedCustomer]);

  // Auto-calculate amounts when items change
  useEffect(() => {
    if (goldPrices && selectedCategory?.id === "gold-loan" && autoCalculationEnabled) {
      autoCalculateAllItems();
    }
  }, [goldPrices, transactionData.items, autoCalculationEnabled, selectedCategory?.id]);

  // Fetch current gold prices from external API
  const fetchGoldPrices = async () => {
    setLoadingPrices(true);
    try {
      const externalPrices = await GoldPriceService.getCurrentGoldPrices();
      
      if (externalPrices.success) {
        setGoldPrices(externalPrices.data);
        setTransactionData(prev => ({
          ...prev,
          goldRate: externalPrices.data.purity22K.toString()
        }));
        setErrors(prev => ({...prev, goldPrices: ""}));
      } else {
        // Fallback to internal API if available
        try {
          const response = await ApiService.getCurrentGoldPrices();
          if (response.success) {
            setGoldPrices(response.data);
            setTransactionData(prev => ({
              ...prev,
              goldRate: response.data.purity22K.toString()
            }));
          } else {
            throw new Error("Internal API also failed");
          }
        } catch (internalError) {
          console.warn("Internal API failed, using fallback prices");
          setErrors(prev => ({...prev, goldPrices: "Using default gold prices - live prices unavailable"}));
        }
      }
    } catch (error) {
      console.error("Failed to fetch gold prices:", error);
      setErrors(prev => ({...prev, goldPrices: "Failed to load current gold prices"}));
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchCustomerLoans = async () => {
    setLoadingLoans(true);
    try {
      let loans = [];
      
      if (selectedCategory.id === "interest-received-gl" || selectedCategory.id === "gold-loan-repayment") {
        try {
          const response = await ApiService.getGoldLoansByCustomer(selectedCustomer._id);
          loans = response.success ? (response.data || []) : [];
        } catch (error) {
          console.error("Failed to fetch gold loans:", error);
          setErrors(prev => ({...prev, loans: "Failed to load gold loans"}));
          loans = [];
        }
      } else if (selectedCategory.id === "interest-received-l" || selectedCategory.id === "loan-repayment") {
        try {
          const response = await ApiService.getLoansByCustomer(selectedCustomer._id);
          loans = response.success ? (response.data || []) : [];
        } catch (error) {
          console.error("Failed to fetch regular loans:", error);
          setErrors(prev => ({...prev, loans: "Failed to load loans"}));
          loans = [];
        }
      }
      
      // Filter for active loans only
      const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
      setAvailableLoans(activeLoans);
      
      // Clear loan selection if no active loans
      if (activeLoans.length === 0) {
        setTransactionData(prev => ({...prev, selectedLoanId: ""}));
      }
      
    } catch (error) {
      console.error("Unexpected error fetching loans:", error);
      setErrors(prev => ({...prev, loans: "Unexpected error loading loans"}));
      setAvailableLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Fetch loan details when loan is selected
  const fetchLoanDetails = async (loanId) => {
    if (!loanId) {
      setSelectedLoanDetails(null);
      setInterestHistory(null);
      setRepaymentOptions(null);
      return;
    }

    try {
      const isGoldLoan = selectedCategory.id.includes("gold-loan") || selectedCategory.id.includes("-gl");
      
      // Get loan details
      const loanResponse = isGoldLoan 
        ? await ApiService.getGoldLoan(loanId)
        : await ApiService.getLoan(loanId);
        
      if (loanResponse.success) {
        setSelectedLoanDetails(loanResponse.data);
        
        // Get interest history for interest payments
        if (selectedCategory.id.includes("interest-received")) {
          try {
            const historyResponse = await ApiService.getInterestHistory(loanId);
            if (historyResponse.success) {
              setInterestHistory(historyResponse.data);
            }
          } catch (error) {
            console.warn("Failed to fetch interest history:", error);
          }
        }
        
        // Get repayment options for repayments
        if (selectedCategory.id.includes("repayment")) {
          try {
            const amount = parseFloat(transactionData.amount) || 0;
            const repaymentResponse = await ApiService.getRepaymentOptions(loanId, amount);
            if (repaymentResponse.success) {
              setRepaymentOptions(repaymentResponse.data);
            }
          } catch (error) {
            console.warn("Failed to fetch repayment options:", error);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch loan details:", error);
      setErrors(prev => ({...prev, loanDetails: "Failed to load loan details"}));
    }
  };

  // Auto-calculate amounts for all items using external gold prices
  const autoCalculateAllItems = useCallback(async () => {
    if (!goldPrices || selectedCategory?.id !== "gold-loan") return;

    setCalculatingAmount(true);
    
    try {
      const updatedItems = await Promise.all(
        transactionData.items.map(async (item) => {
          if (item.weight && item.purity && (!item.amount || item.autoCalculated)) {
            try {
              const calculation = await GoldPriceService.calculateGoldLoanAmount(
                parseFloat(item.weight),
                parseInt(item.purity),
                goldPrices
              );
              
              if (calculation.success) {
                return {
                  ...item,
                  amount: calculation.data.loanAmount.toFixed(2),
                  autoCalculated: true,
                  marketValue: calculation.data.marketValue,
                  pricePerGram: calculation.data.pricePerGram
                };
              } else {
                // Fallback to internal API if available
                try {
                  const fallbackCalc = await ApiService.calculateGoldLoanAmount(
                    parseFloat(item.weight),
                    parseInt(item.purity)
                  );
                  
                  if (fallbackCalc.success) {
                    return {
                      ...item,
                      amount: fallbackCalc.data.loanAmount.toFixed(2),
                      autoCalculated: true,
                      marketValue: fallbackCalc.data.marketValue,
                      pricePerGram: fallbackCalc.data.pricePerGram
                    };
                  }
                } catch (fallbackError) {
                  console.warn('Fallback calculation failed:', fallbackError);
                }
              }
            } catch (error) {
              console.warn('Auto-calculation failed for item:', error);
            }
          }
          return item;
        })
      );

      setTransactionData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } catch (error) {
      console.error("Auto-calculation failed:", error);
    } finally {
      setCalculatingAmount(false);
    }
  }, [goldPrices, transactionData.items, selectedCategory]);

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLoanChange = async (loanId) => {
    setTransactionData(prev => ({...prev, selectedLoanId: loanId}));
    
    if (errors.selectedLoanId) {
      setErrors(prev => ({...prev, selectedLoanId: ""}));
    }
    
    await fetchLoanDetails(loanId);
  };

  const calculateTotalAmount = () => {
    if (selectedCategory?.id === "gold-loan") {
      return transactionData.items.reduce(
        (total, item) => total + (parseFloat(item.amount) || 0),
        0
      );
    }
    return parseFloat(transactionData.amount) || 0;
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
    } else {
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
      
      switch (selectedCategory.id) {
        case "gold-loan":
          const totalAmount = calculateTotalAmount();
          response = await ApiService.createGoldLoan({
            customerId: selectedCustomer._id,
            items: transactionData.items.map((item) => ({
              name: item.name,
              weightGram: parseFloat(item.weight),
              purityK: parseInt(item.purity),
              amount: parseFloat(item.amount),
              images: item.images.map(img => img.dataUrl),
            })),
            totalAmount: totalAmount,
            interestRate: parseFloat(transactionData.interestRate),
            durationMonths: parseInt(transactionData.durationMonths),
            date: transactionData.date,
            notes: transactionData.description || 'Gold loan created'
          });
          break;

        case "interest-received-gl":
          if (!selectedLoanDetails) {
            throw new Error("Loan details not loaded");
          }
          response = await ApiService.makeGoldLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.forMonth || null,
            transactionData.partialPayment,
            transactionData.description || 'Interest payment received'
          );
          break;

        case "gold-loan-repayment":
          if (!selectedLoanDetails) {
            throw new Error("Loan details not loaded");
          }
          
          if (repaymentOptions && repaymentOptions.returnScenarios.length > 0) {
            response = await ApiService.processItemBasedRepayment(
              transactionData.selectedLoanId,
              {
                amount: parseFloat(transactionData.amount),
                selectedItemIds: transactionData.selectedItems.length > 0 ? 
                  transactionData.selectedItems : 
                  repaymentOptions.returnScenarios[0].items.map(item => item.itemId),
                returnSelectedItems: true,
                photos: transactionData.photos,
                notes: transactionData.description || 'Item-based repayment'
              }
            );
          } else {
            response = await ApiService.makeGoldLoanPayment(
              transactionData.selectedLoanId,
              {
                principal: parseFloat(transactionData.amount),
                interest: 0,
                photos: transactionData.photos,
                notes: transactionData.description || 'Gold loan repayment',
              }
            );
          }
          break;

        case "interest-received-l":
          response = await ApiService.makeLoanInterestPayment(
            transactionData.selectedLoanId,
            parseFloat(transactionData.amount),
            transactionData.description || 'Interest payment received'
          );
          break;

        case "loan-repayment":
          response = await ApiService.makeLoanPayment(
            transactionData.selectedLoanId,
            {
              principal: parseFloat(transactionData.amount),
              interest: 0,
              notes: transactionData.description || 'Loan repayment',
            }
          );
          break;

        case "loan-given":
          response = await ApiService.createLoan({
            customerId: selectedCustomer._id,
            amount: parseFloat(transactionData.amount),
            interestRate: parseFloat(transactionData.interestRate),
            durationMonths: parseInt(transactionData.durationMonths),
            date: transactionData.date,
            description: transactionData.description || 'Loan given'
          }, -1); // -1 for loan given
          break;

        case "loan-taken":
          response = await ApiService.createLoan({
            customerId: selectedCustomer._id,
            amount: parseFloat(transactionData.amount),
            interestRate: parseFloat(transactionData.interestRate),
            durationMonths: parseInt(transactionData.durationMonths),
            date: transactionData.date,
            description: transactionData.description || 'Loan taken'
          }, 1); // 1 for loan taken
          break;

        case "udhari-given":
          response = await ApiService.giveUdhari({
            customerId: selectedCustomer._id,
            amount: parseFloat(transactionData.amount),
            description: transactionData.description || 'Udhari given',
            installments: parseInt(transactionData.installments || 1)
          });
          break;

        case "udhari-received":
          response = await ApiService.receiveUdhariPayment({
            customerId: selectedCustomer._id,
            amount: parseFloat(transactionData.amount),
            description: transactionData.description || 'Udhari payment received',
            udhariId: transactionData.selectedUdhariId,
            installmentNumber: parseInt(transactionData.installmentNumber || 1)
          });
          break;

        case "gold-purchase":
          response = await ApiService.createGoldPurchase({
            partyName: selectedCustomer.name,
            description: transactionData.description || 'Gold purchase',
            goldWeight: parseFloat(transactionData.goldWeight),
            amount: parseFloat(transactionData.amount),
            goldType: transactionData.goldType,
            metal: 'GOLD',
            date: transactionData.date
          });
          break;

        case "silver-purchase":
          response = await ApiService.createGoldPurchase({
            partyName: selectedCustomer.name,
            description: transactionData.description || 'Silver purchase',
            goldWeight: parseFloat(transactionData.goldWeight),
            amount: parseFloat(transactionData.amount),
            goldType: transactionData.goldType,
            metal: 'SILVER',
            date: transactionData.date
          });
          break;

        case "gold-sale":
          response = await ApiService.createMetalSale({
            customerId: selectedCustomer._id,
            metal: 'GOLD',
            weight: parseFloat(transactionData.goldWeight),
            amount: parseFloat(transactionData.amount),
            rate: parseFloat(transactionData.goldRate),
            purity: parseInt(transactionData.goldPurity),
            date: transactionData.date
          });
          break;

        case "silver-sale":
          response = await ApiService.createMetalSale({
            customerId: selectedCustomer._id,
            metal: 'SILVER',
            weight: parseFloat(transactionData.goldWeight),
            amount: parseFloat(transactionData.amount),
            rate: parseFloat(transactionData.goldRate),
            purity: parseInt(transactionData.goldPurity),
            date: transactionData.date
          });
          break;

        default:
          throw new Error(`Unknown transaction type: ${selectedCategory.id}`);
      }

      // Check if transaction was successful
      if (response && (response.success !== false)) {
        onSuccess(response);
      } else {
        throw new Error(response?.message || response?.error || "Transaction failed");
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

  const isGoldTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
  const isLoanTransaction = selectedCategory?.id.includes("loan");
  const isInterestPayment = selectedCategory?.id.includes("interest-received");
  const isRepayment = selectedCategory?.id.includes("repayment");
  const isGoldLoan = selectedCategory?.id === "gold-loan";

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

      {errors.goldPrices && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
          {errors.goldPrices}
        </div>
      )}

      <div className="space-y-6">
        {/* Loan Selection Component */}
        {(isInterestPayment || isRepayment) && (
          <LoanSelection
            availableLoans={availableLoans}
            loadingLoans={loadingLoans}
            selectedLoanId={transactionData.selectedLoanId}
            onLoanChange={handleLoanChange}
            errors={errors}
            isInterestPayment={isInterestPayment}
            isRepayment={isRepayment}
            interestHistory={interestHistory}
            repaymentOptions={repaymentOptions}
            transactionData={transactionData}
            setTransactionData={setTransactionData}
          />
        )}

        {/* Gold Items Manager */}
        {isGoldLoan && (
          <GoldItemsManager
            items={transactionData.items}
            goldPrices={goldPrices}
            loadingPrices={loadingPrices}
            autoCalculationEnabled={autoCalculationEnabled}
            calculatingAmount={calculatingAmount}
            errors={errors}
            loading={loading}
            onItemsChange={(items) => setTransactionData(prev => ({...prev, items}))}
            onAutoCalculationToggle={setAutoCalculationEnabled}
            onRefreshPrices={fetchGoldPrices}
            calculateTotalAmount={calculateTotalAmount}
          />
        )}

        {/* Transaction Fields */}
        <TransactionFields
          transactionData={transactionData}
          onChange={handleDataChange}
          errors={errors}
          loading={loading}
          selectedCategory={selectedCategory}
          selectedLoanDetails={selectedLoanDetails}
          repaymentOptions={repaymentOptions}
          isGoldTransaction={isGoldTransaction}
          isLoanTransaction={isLoanTransaction}
          isInterestPayment={isInterestPayment}
          isRepayment={isRepayment}
          isGoldLoan={isGoldLoan}
        />

        {/* Photo Upload */}
        <PhotoUpload
          photos={transactionData.photos}
          onPhotosChange={(photos) => setTransactionData(prev => ({...prev, photos}))}
          loading={loading}
          showUpload={isGoldTransaction || isLoanTransaction || isInterestPayment || isRepayment}
        />

        {/* Transaction Summary */}
        <TransactionSummary
          selectedCategory={selectedCategory}
          selectedCustomer={selectedCustomer}
          totalAmount={calculateTotalAmount()}
          isGoldLoan={isGoldLoan}
          items={transactionData.items}
          selectedLoanDetails={selectedLoanDetails}
          repaymentOptions={repaymentOptions}
          isInterestPayment={isInterestPayment}
          isRepayment={isRepayment}
        />
      </div>

      {/* Action Buttons */}
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
            disabled={loading || calculatingAmount}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? "Saving..." : calculatingAmount ? "Calculating..." : "Save Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;