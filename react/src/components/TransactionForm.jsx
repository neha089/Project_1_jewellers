import React, { useState, useEffect } from "react";
import { X, Save, Upload, Trash2, Plus, Minus, Eye, Info } from "lucide-react";
import ApiService from "../services/api";

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
    // Gold specific fields
    goldWeight: "",
    goldType: "22K",
    goldPurity: "916",
    goldRate: "6500",
    // Loan specific fields
    interestRate: "2.5",
    durationMonths: "6",
    selectedLoanId: "",
    // Photos
    photos: [],
    // Gold loan items
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
  const [hoveredLoan, setHoveredLoan] = useState(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);

  // Load available loans for interest payment categories
  useEffect(() => {
    const isInterestPayment = selectedCategory?.id.includes("interest-received");
    const isRepayment = selectedCategory?.id.includes("repayment");
    
    if ((isInterestPayment || isRepayment) && selectedCustomer) {
      fetchCustomerLoans();
    }
  }, [selectedCategory, selectedCustomer]);

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

  const handleDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Item management functions
  const addItem = () => {
    setTransactionData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: Date.now(),
          name: "",
          weight: "",
          amount: "",
          purity: "22",
          images: [],
        },
      ],
    }));
  };

  const removeItem = (itemId) => {
    setTransactionData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };

  const updateItem = (itemId, field, value) => {
    setTransactionData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleItemImageUpload = (itemId, e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTransactionData((prev) => ({
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  images: [
                    ...item.images,
                    {
                      id: Date.now() + Math.random(),
                      name: file.name,
                      dataUrl: e.target.result,
                    },
                  ],
                }
              : item
          ),
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeItemImage = (itemId, imageId) => {
    setTransactionData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              images: item.images.filter((img) => img.id !== imageId),
            }
          : item
      ),
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (transactionData.photos.length < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTransactionData((prev) => ({
            ...prev,
            photos: [
              ...prev.photos,
              {
                id: Date.now() + Math.random(),
                name: file.name,
                dataUrl: e.target.result,
              },
            ],
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    setTransactionData((prev) => ({
      ...prev,
      photos: prev.photos.filter((photo) => photo.id !== photoId),
    }));
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
      // Validate items for gold loan
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
      const commonData = {
        customerId: selectedCustomer._id,
        amount: transactionData.amount,
        description: transactionData.description,
        date: new Date(transactionData.date).toISOString(),
        photos: transactionData.photos,
      };

      switch (selectedCategory.id) {
        case "gold-loan":
          const totalAmount = calculateTotalAmount();
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
          response = await ApiService.makeGoldLoanPayment(
            transactionData.selectedLoanId,
            {
              principal: transactionData.amount,
              interest: 0,
              photos: transactionData.photos,
              notes: transactionData.description,
            }
          );
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

  const isGoldTransaction = selectedCategory?.id.includes("gold") || selectedCategory?.id.includes("silver");
  const isLoanTransaction = selectedCategory?.id.includes("loan");
  const isInterestPayment = selectedCategory?.id.includes("interest-received");
  const isRepayment = selectedCategory?.id.includes("repayment");
  const isGoldLoan = selectedCategory?.id === "gold-loan";
  const metalType = selectedCategory?.id.includes("silver") ? "Silver" : "Gold";

  // Loan tooltip component
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
                  name="selectedLoanId"
                  value={transactionData.selectedLoanId}
                  onChange={handleDataChange}
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
                    const monthlyInterest = loan.principalPaise ? Math.round((loan.principalPaise * loan.interestRateMonthlyPct) / 100) : 0;
                    
                    return (
                      <option key={loan._id} value={loan._id}>
                        Loan #{loan._id.slice(-6)} - ₹{(loan.principalPaise / 100).toFixed(0)} 
                        (Outstanding: ₹{(outstanding / 100).toFixed(0)})
                        {loan.items && ` - ${loan.items.length} items`}
                      </option>
                    );
                  })}
                </select>
                
                {/* Show loan details tooltip */}
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
        )}

        {/* Items Management for Gold Loans */}
        {isGoldLoan && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Gold Items</h4>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {transactionData.items.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-800">Item {index + 1}</h5>
                  {transactionData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, "name", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_name`] ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="e.g., Gold Chain, Ring, etc."
                      disabled={loading}
                    />
                    {errors[`item_${index}_name`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={item.weight}
                      onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_weight`] ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0.0"
                      disabled={loading}
                    />
                    {errors[`item_${index}_weight`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[`item_${index}_amount`] ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="0"
                      disabled={loading}
                    />
                    {errors[`item_${index}_amount`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_amount`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Purity (K)
                    </label>
                    <select
                      value={item.purity}
                      onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="24">24K</option>
                      <option value="22">22K</option>
                      <option value="18">18K</option>
                      <option value="14">14K</option>
                    </select>
                  </div>
                </div>

                {/* Item Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Photos
                  </label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-3">
                    <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
                      Add Photos
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleItemImageUpload(item.id, e)}
                        className="hidden"
                        disabled={loading}
                      />
                    </label>
                  </div>

                  {item.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {item.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            className="w-full h-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => removeItemImage(item.id, image.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={loading}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {errors.items && (
              <p className="text-red-500 text-sm">{errors.items}</p>
            )}

            {/* Total Amount Display */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Total Loan Amount:</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{calculateTotalAmount().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Amount Field for Non-Gold-Loan Transactions */}
        {!isGoldLoan && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                name="amount"
                value={transactionData.amount}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.amount ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter amount"
                disabled={loading}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={transactionData.date}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Gold Transaction Fields (excluding gold-loan) */}
        {isGoldTransaction && !isGoldLoan && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {metalType} Weight (grams) *
              </label>
              <input
                type="number"
                step="0.1"
                name="goldWeight"
                value={transactionData.goldWeight}
                onChange={handleDataChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.goldWeight ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter weight"
                disabled={loading}
              />
              {errors.goldWeight && (
                <p className="text-red-500 text-xs mt-1">{errors.goldWeight}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {metalType} Type
              </label>
              <select
                name="goldType"
                value={transactionData.goldType}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="24K">24K {metalType}</option>
                <option value="22K">22K {metalType}</option>
                <option value="18K">18K {metalType}</option>
                <option value="14K">14K {metalType}</option>
                 </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {metalType} Rate (₹/gram)
              </label>
              <input
                type="number"
                name="goldRate"
                value={transactionData.goldRate}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Current ${metalType.toLowerCase()} rate`}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity
              </label>
              <input
                type="text"
                name="goldPurity"
                value={transactionData.goldPurity}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="916"
                disabled={loading}
              />
            </div>
          </div>
        )}

        {isLoanTransaction && !isInterestPayment && !isRepayment && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interest Rate (% per month)
              </label>
              <input
                type="number"
                step="0.1"
                name="interestRate"
                value={transactionData.interestRate}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2.5"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (months)
              </label>
              <select
                name="durationMonths"
                value={transactionData.durationMonths}
                onChange={handleDataChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="9">9 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>
          </>
        )}

        <div className="md:col-span-2">
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

        {(isGoldTransaction || isLoanTransaction) && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Upload Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2">Max 3 photos</p>
            </div>

            {transactionData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {transactionData.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-full h-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default TransactionForm;