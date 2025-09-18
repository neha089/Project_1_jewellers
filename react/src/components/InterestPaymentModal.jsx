// import React, { useState, useEffect } from 'react';
// import ApiService from '../services/api';
// import { 
//   X, 
//   DollarSign, 
//   Calendar, 
//   CreditCard, 
//   FileText, 
//   Calculator,
//   User,
//   Phone,
//   Coins,
//   Camera,
//   Check,
//   AlertCircle,
//   Download
// } from 'lucide-react';

// const InterestPaymentModal = ({ isOpen, onClose, loan, onPaymentSuccess }) => {
//   const [formData, setFormData] = useState({
//     interestAmount: '',
//     paymentDate: new Date().toISOString().split('T')[0],
//     paymentMethod: 'CASH',
//     forMonth: '',
//     referenceNumber: '',
//     chequeNumber: '',
//     bankName: '',
//     chequeDate: '',
//     photos: [],
//     notes: '',
//     recordedBy: 'Admin'
//   });

//   const [calculatedInterest, setCalculatedInterest] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Calculate monthly interest when component loads
//   useEffect(() => {
//     if (loan && isOpen) {
//       const monthlyInterest = (loan.currentLoanAmount * loan.interestRateMonthlyPct) / 100;
//       setCalculatedInterest(monthlyInterest);
      
//       // Auto-set current month
//       const currentDate = new Date();
//       const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
//       setFormData(prev => ({
//         ...prev,
//         interestAmount: monthlyInterest.toFixed(2),
//         forMonth: currentMonth
//       }));
//     }
//   }, [loan, isOpen]);

//   if (!isOpen || !loan) return null;

//   const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  
//   const paymentMethods = [
//     { value: 'CASH', label: 'Cash' },
//     { value: 'CHEQUE', label: 'Cheque' },
//     { value: 'NET_BANKING', label: 'Net Banking' },
//     { value: 'UPI', label: 'UPI' },
//     { value: 'CARD', label: 'Card' },
//     { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
//   ];

//   const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
//   const activeItems = loan.items?.filter(item => !item.returnDate) || [];

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
    
//     // Clear specific error when user starts typing
//     if (errors[name]) {
//       setErrors(prev => ({
//         ...prev,
//         [name]: ''
//       }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
    
//     if (!formData.interestAmount || parseFloat(formData.interestAmount) <= 0) {
//       newErrors.interestAmount = 'Interest amount is required and must be greater than 0';
//     }
    
//     if (!formData.paymentDate) {
//       newErrors.paymentDate = 'Payment date is required';
//     }
    
//     if (!formData.forMonth) {
//       newErrors.forMonth = 'Payment month is required';
//     }
    
//     if (formData.paymentMethod === 'CHEQUE') {
//       if (!formData.chequeNumber) {
//         newErrors.chequeNumber = 'Cheque number is required';
//       }
//       if (!formData.bankName) {
//         newErrors.bankName = 'Bank name is required';
//       }
//       if (!formData.chequeDate) {
//         newErrors.chequeDate = 'Cheque date is required';
//       }
//     }
    
//     if (['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(formData.paymentMethod)) {
//       if (!formData.referenceNumber) {
//         newErrors.referenceNumber = 'Reference number is required for digital payments';
//       }
//     }
    
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };


// const handleSubmit = async () => {
//   if (!validateForm()) return;
  
//   setLoading(true);
  
//   try {
//     // Remove simulation logic and use actual API call
//     const result = await ApiService.addInterestPayment(loan._id, formData);
    
//     if (result.success) {
//       onPaymentSuccess && onPaymentSuccess(result);
//       onClose();
      
//       // Show detailed success message
//       const receiptInfo = [
//         `Interest payment recorded successfully!`,
//         `Receipt: ${result.data?.receiptNumber || 'N/A'}`,
//         `Amount: ₹${result.data?.interestAmount?.toLocaleString() || formData.interestAmount}`,
//         `For: ${getMonthName(formData.forMonth)}`,
//         `Method: ${paymentMethods.find(m => m.value === formData.paymentMethod)?.label}`
//       ].join('\n');
      
//       alert(receiptInfo);
//     } else {
//       throw new Error(result.message || 'Failed to record payment');
//     }
    
//   } catch (error) {
//     console.error('Payment submission error:', error);
    
//     // Enhanced error handling
//     let errorMessage = 'Failed to submit payment. Please try again.';
    
//     if (error.message.includes('404')) {
//       errorMessage = 'Interest payment endpoint not found. Please check if the route is properly configured.';
//     } else if (error.message.includes('Failed to fetch')) {
//       errorMessage = 'Network error. Please check your connection and try again.';
//     } else if (error.message.includes('401')) {
//       errorMessage = 'Authentication required. Please log in again.';
//     } else if (error.message.includes('403')) {
//       errorMessage = 'Access denied. You may not have permission to record payments.';
//     } else if (error.message.includes('500')) {
//       errorMessage = 'Server error. Please contact system administrator.';
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     alert(errorMessage);
//   } finally {
//     setLoading(false);
//   }
// };

//   const handleFileUpload = (e) => {
//     const files = Array.from(e.target.files);
//     // In real implementation, you'd upload files and get URLs
//     const fileUrls = files.map(file => URL.createObjectURL(file));
//     setFormData(prev => ({
//       ...prev,
//       photos: [...prev.photos, ...fileUrls]
//     }));
//   };

//   const removePhoto = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       photos: prev.photos.filter((_, i) => i !== index)
//     }));
//   };

//   const getMonthName = (monthString) => {
//     if (!monthString) return '';
//     const [year, month] = monthString.split('-');
//     const date = new Date(year, month - 1);
//     return date.toLocaleString('default', { month: 'long', year: 'numeric' });
//   };

//   const interestDifference = parseFloat(formData.interestAmount || 0) - calculatedInterest;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
//                 <DollarSign size={24} />
//               </div>
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900">Interest Payment</h2>
//                 <p className="text-green-700 font-medium">Loan ID: {loan._id}</p>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all"
//             >
//               <X size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Left Column - Customer & Loan Details */}
//             <div className="space-y-6">
//               {/* Customer Info */}
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <User size={18} />
//                   Customer Details
//                 </h3>
//                 <div className="space-y-3">
//                   <div>
//                     <span className="text-sm text-gray-500">Name</span>
//                     <p className="font-medium text-gray-900">{loan.customer?.name || 'Unknown'}</p>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Phone</span>
//                     <p className="font-medium text-gray-900 flex items-center gap-2">
//                       <Phone size={14} />
//                       {loan.customer?.phone || 'N/A'}
//                     </p>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500">Email</span>
//                     <p className="font-medium text-gray-900">{loan.customer?.email || 'Not provided'}</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Loan Summary */}
//               <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <Coins size={18} />
//                   Loan Summary
//                 </h3>
//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-amber-600">
//                       {formatCurrency(loan.currentLoanAmount)}
//                     </div>
//                     <div className="text-xs text-gray-600 uppercase tracking-wide">Outstanding</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-purple-600">
//                       {loan.interestRateMonthlyPct}%
//                     </div>
//                     <div className="text-xs text-gray-600 uppercase tracking-wide">Monthly Rate</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-gray-700">
//                       {totalWeight}g
//                     </div>
//                     <div className="text-xs text-gray-600 uppercase tracking-wide">Total Weight</div>
//                   </div>
//                   <div className="text-center">
//                     <div className="text-lg font-bold text-gray-700">
//                       {activeItems.length}
//                     </div>
//                     <div className="text-xs text-gray-600 uppercase tracking-wide">Active Items</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Interest Calculation */}
//               <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                   <Calculator size={18} />
//                   Interest Calculation
//                 </h3>
//                 <div className="space-y-3">
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Principal Amount:</span>
//                     <span className="font-medium">{formatCurrency(loan.currentLoanAmount)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-gray-600">Monthly Rate:</span>
//                     <span className="font-medium">{loan.interestRateMonthlyPct}%</span>
//                   </div>
//                   <div className="border-t border-blue-200 pt-2 flex justify-between">
//                     <span className="text-gray-900 font-medium">Calculated Interest:</span>
//                     <span className="font-bold text-blue-600">{formatCurrency(calculatedInterest)}</span>
//                   </div>
//                   {interestDifference !== 0 && (
//                     <div className="flex justify-between items-center">
//                       <span className="text-gray-600">Difference:</span>
//                       <span className={`font-medium ${interestDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
//                         {interestDifference > 0 ? '+' : ''}{formatCurrency(Math.abs(interestDifference))}
//                       </span>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Gold Items List */}
//               <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Gold Items</h3>
//                 <div className="space-y-2">
//                   {activeItems.slice(0, 3).map((item, index) => (
//                     <div key={index} className="flex justify-between items-center py-2 border-b border-amber-200 last:border-b-0">
//                       <div>
//                         <p className="font-medium text-sm">{item.name || 'Gold Item'}</p>
//                         <p className="text-xs text-gray-600">{item.weightGram}g • {item.purityK}K</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-medium text-sm">{formatCurrency(item.loanAmount)}</p>
//                       </div>
//                     </div>
//                   ))}
//                   {activeItems.length > 3 && (
//                     <p className="text-xs text-gray-500 text-center pt-2">
//                       +{activeItems.length - 3} more items
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Right Column - Payment Form */}
//             <div className="lg:col-span-2">
//               <div className="space-y-6">
//                 {/* Payment Details */}
//                 <div className="bg-white border border-gray-200 rounded-xl p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Interest Amount *
//                       </label>
//                       <div className="relative">
//                         <span className="absolute left-3 top-3 text-gray-500">₹</span>
//                         <input
//                           type="number"
//                           name="interestAmount"
//                           value={formData.interestAmount}
//                           onChange={handleInputChange}
//                           step="0.01"
//                           min="0"
//                           className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                             errors.interestAmount ? 'border-red-300' : 'border-gray-300'
//                           }`}
//                           placeholder="0.00"
//                         />
//                       </div>
//                       {errors.interestAmount && (
//                         <p className="text-red-500 text-xs mt-1">{errors.interestAmount}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Payment Date *
//                       </label>
//                       <input
//                         type="date"
//                         name="paymentDate"
//                         value={formData.paymentDate}
//                         onChange={handleInputChange}
//                         className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                           errors.paymentDate ? 'border-red-300' : 'border-gray-300'
//                         }`}
//                       />
//                       {errors.paymentDate && (
//                         <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         For Month *
//                       </label>
//                       <input
//                         type="month"
//                         name="forMonth"
//                         value={formData.forMonth}
//                         onChange={handleInputChange}
//                         className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                           errors.forMonth ? 'border-red-300' : 'border-gray-300'
//                         }`}
//                       />
//                       {formData.forMonth && (
//                         <p className="text-sm text-gray-600 mt-1">
//                           Payment for: {getMonthName(formData.forMonth)}
//                         </p>
//                       )}
//                       {errors.forMonth && (
//                         <p className="text-red-500 text-xs mt-1">{errors.forMonth}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Payment Method *
//                       </label>
//                       <select
//                         name="paymentMethod"
//                         value={formData.paymentMethod}
//                         onChange={handleInputChange}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       >
//                         {paymentMethods.map(method => (
//                           <option key={method.value} value={method.value}>
//                             {method.label}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                   </div>

//                   {/* Conditional fields based on payment method */}
//                   {formData.paymentMethod === 'CHEQUE' && (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Cheque Number *
//                         </label>
//                         <input
//                           type="text"
//                           name="chequeNumber"
//                           value={formData.chequeNumber}
//                           onChange={handleInputChange}
//                           className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                             errors.chequeNumber ? 'border-red-300' : 'border-gray-300'
//                           }`}
//                           placeholder="Enter cheque number"
//                         />
//                         {errors.chequeNumber && (
//                           <p className="text-red-500 text-xs mt-1">{errors.chequeNumber}</p>
//                         )}
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Bank Name *
//                         </label>
//                         <input
//                           type="text"
//                           name="bankName"
//                           value={formData.bankName}
//                           onChange={handleInputChange}
//                           className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                             errors.bankName ? 'border-red-300' : 'border-gray-300'
//                           }`}
//                           placeholder="Enter bank name"
//                         />
//                         {errors.bankName && (
//                           <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
//                         )}
//                       </div>
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Cheque Date *
//                         </label>
//                         <input
//                           type="date"
//                           name="chequeDate"
//                           value={formData.chequeDate}
//                           onChange={handleInputChange}
//                           className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                             errors.chequeDate ? 'border-red-300' : 'border-gray-300'
//                           }`}
//                         />
//                         {errors.chequeDate && (
//                           <p className="text-red-500 text-xs mt-1">{errors.chequeDate}</p>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(formData.paymentMethod) && (
//                     <div className="mt-4">
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Reference Number *
//                       </label>
//                       <input
//                         type="text"
//                         name="referenceNumber"
//                         value={formData.referenceNumber}
//                         onChange={handleInputChange}
//                         className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
//                           errors.referenceNumber ? 'border-red-300' : 'border-gray-300'
//                         }`}
//                         placeholder="Enter transaction reference number"
//                       />
//                       {errors.referenceNumber && (
//                         <p className="text-red-500 text-xs mt-1">{errors.referenceNumber}</p>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Photos & Documentation */}
//                 <div className="bg-white border border-gray-200 rounded-xl p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
//                     <Camera size={18} />
//                     Payment Documentation
//                   </h3>
                  
//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Upload Payment Proof (Optional)
//                       </label>
//                       <input
//                         type="file"
//                         multiple
//                         accept="image/*"
//                         onChange={handleFileUpload}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                       />
//                       <p className="text-xs text-gray-500 mt-1">
//                         Upload receipts, screenshots, or payment proof photos
//                       </p>
//                     </div>

//                     {formData.photos.length > 0 && (
//                       <div>
//                         <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos:</p>
//                         <div className="flex gap-2 flex-wrap">
//                           {formData.photos.map((photo, index) => (
//                             <div key={index} className="relative">
//                               <img
//                                 src={photo}
//                                 alt={`Payment proof ${index + 1}`}
//                                 className="w-16 h-16 object-cover rounded-lg border border-gray-200"
//                               />
//                               <button
//                                 type="button"
//                                 onClick={() => removePhoto(index)}
//                                 className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
//                               >
//                                 ×
//                               </button>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Notes (Optional)
//                       </label>
//                       <textarea
//                         name="notes"
//                         value={formData.notes}
//                         onChange={handleInputChange}
//                         rows={3}
//                         className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                         placeholder="Add any additional notes about this payment..."
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Card */}
//                 <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Customer:</span>
//                       <span className="font-medium">{loan.customer?.name}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Payment For:</span>
//                       <span className="font-medium">{getMonthName(formData.forMonth)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Calculated Interest:</span>
//                       <span className="font-medium">{formatCurrency(calculatedInterest)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Payment Amount:</span>
//                       <span className="font-bold text-green-600">{formatCurrency(parseFloat(formData.interestAmount) || 0)}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Payment Method:</span>
//                       <span className="font-medium">
//                         {paymentMethods.find(m => m.value === formData.paymentMethod)?.label}
//                       </span>
//                     </div>
//                     {interestDifference !== 0 && (
//                       <div className="flex justify-between pt-2 border-t border-green-200">
//                         <span className="text-gray-600">
//                           {interestDifference > 0 ? 'Overpayment:' : 'Underpayment:'}
//                         </span>
//                         <span className={`font-medium ${interestDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
//                           {formatCurrency(Math.abs(interestDifference))}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex gap-3 pt-4">
//                   <button
//                     type="button"
//                     onClick={onClose}
//                     className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="button"
//                     onClick={handleSubmit}
//                     disabled={loading}
//                     className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                   >
//                     {loading ? (
//                       <>
//                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                         Processing...
//                       </>
//                     ) : (
//                       <>
//                         <Check size={18} />
//                         Record Payment
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InterestPaymentModal;


import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import { 
  X, 
  DollarSign, 
  Calendar, 
  CreditCard, 
  FileText, 
  Calculator,
  User,
  Phone,
  Coins,
  Camera,
  Check,
  AlertCircle,
  Download
} from 'lucide-react';

const InterestPaymentModal = ({ isOpen, onClose, loan, onPaymentSuccess }) => {
  const [formData, setFormData] = useState({
    interestAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    forMonth: '',
    referenceNumber: '',
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
    photos: [],
    notes: '',
    recordedBy: 'Admin'
  });

  const [calculatedInterest, setCalculatedInterest] = useState(0);
  const [totalPaidForMonth, setTotalPaidForMonth] = useState(0);
  const [remainingInterest, setRemainingInterest] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  
  // Calculate monthly interest and fetch existing payments when component loads or forMonth changes
  useEffect(() => {
    if (loan && isOpen) {
      const monthlyInterest = (loan.currentLoanAmount * loan.interestRateMonthlyPct) / 100;
      setCalculatedInterest(monthlyInterest);

      // Auto-set current month
      const currentDate = new Date();
      const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        interestAmount: monthlyInterest.toFixed(2),
        forMonth: currentMonth
      }));

      // Fetch existing interest payments for the initial month
      fetchInterestPayments(currentMonth);
    }
  }, [loan, isOpen]);

  // Fetch interest payments when forMonth changes
  useEffect(() => {
    if (formData.forMonth && isOpen) {
      fetchInterestPayments(formData.forMonth);
    }
  }, [formData.forMonth, isOpen]);

const fetchInterestPayments = async (month) => {
  try {
    setLoading(true);
    const [year, monthNum] = month.split('-');
    const result = await ApiService.getInterestPayments(loan._id, {
      fromDate: `${year}-${monthNum}-01`,
      toDate: `${year}-${monthNum}-31`
    });
    if (result.success && result.data) {
      const totalPaid = result.data.reduce((sum, payment) => sum + (payment.interestAmount || 0), 0);
      setTotalPaidForMonth(totalPaid);
      setRemainingInterest(Math.max(0, calculatedInterest - totalPaid));
    } else {
      setTotalPaidForMonth(0);
      setRemainingInterest(calculatedInterest);
    }
  } catch (error) {
    console.error('Error fetching interest payments:', error);
    setTotalPaidForMonth(0);
    setRemainingInterest(calculatedInterest);
  } finally {
    setLoading(false);
  }
};

  if (!isOpen || !loan) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  
  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'NET_BANKING', label: 'Net Banking' },
    { value: 'UPI', label: 'UPI' },
    { value: 'CARD', label: 'Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
  ];

  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const activeItems = loan.items?.filter(item => !item.returnDate) || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.interestAmount || parseFloat(formData.interestAmount) <= 0) {
      newErrors.interestAmount = 'Interest amount is required and must be greater than 0';
    } else if (parseFloat(formData.interestAmount) > remainingInterest) {
      newErrors.interestAmount = `Interest amount cannot exceed remaining interest due (${formatCurrency(remainingInterest)})`;
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    if (!formData.forMonth) {
      newErrors.forMonth = 'Payment month is required';
    }
    
    if (formData.paymentMethod === 'CHEQUE') {
      if (!formData.chequeNumber) {
        newErrors.chequeNumber = 'Cheque number is required';
      }
      if (!formData.bankName) {
        newErrors.bankName = 'Bank name is required';
      }
      if (!formData.chequeDate) {
        newErrors.chequeDate = 'Cheque date is required';
      }
    }
    
    if (['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(formData.paymentMethod)) {
      if (!formData.referenceNumber) {
        newErrors.referenceNumber = 'Reference number is required for digital payments';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
  
    try {
      const result = await ApiService.addInterestPayment(loan._id, formData);
    
      if (result.success) {
        onPaymentSuccess && onPaymentSuccess(result);
        onClose();
      
        // Show detailed success message
        const receiptInfo = [
          `Interest payment recorded successfully!`,
          `Receipt: ${result.data?.receiptNumber || 'N/A'}`,
          `Amount: ₹${result.data?.interestAmount?.toLocaleString() || formData.interestAmount}`,
          `For: ${getMonthName(formData.forMonth)}`,
          `Method: ${paymentMethods.find(m => m.value === formData.paymentMethod)?.label}`,
          `Remaining Interest for ${getMonthName(formData.forMonth)}: ${formatCurrency(result.interestSummary?.remainingInterest || 0)}`
        ].join('\n');
      
        alert(receiptInfo);
      } else {
        throw new Error(result.message || 'Failed to record payment');
      }
    
    } catch (error) {
      console.error('Payment submission error:', error);
    
      let errorMessage = 'Failed to submit payment. Please try again.';
    
      if (error.message.includes('404')) {
        errorMessage = 'Interest payment endpoint not found. Please check if the route is properly configured.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.message.includes('403')) {
        errorMessage = 'Access denied. You may not have permission to record payments.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please contact system administrator.';
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const fileUrls = files.map(file => URL.createObjectURL(file));
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...fileUrls]
    }));
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const getMonthName = (monthString) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const interestDifference = parseFloat(formData.interestAmount || 0) - calculatedInterest;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Interest Payment</h2>
                <p className="text-green-700 font-medium">Loan ID: {loan._id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & Loan Details */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User size={18} />
                  Customer Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Name</span>
                    <p className="font-medium text-gray-900">{loan.customer?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Phone</span>
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <Phone size={14} />
                      {loan.customer?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Email</span>
                    <p className="font-medium text-gray-900">{loan.customer?.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Loan Summary */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Coins size={18} />
                  Loan Summary
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {formatCurrency(loan.currentLoanAmount)}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Outstanding</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {loan.interestRateMonthlyPct}%
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Monthly Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700">
                      {totalWeight}g
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Total Weight</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700">
                      {activeItems.length}
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">Active Items</div>
                  </div>
                </div>
              </div>

              {/* Interest Calculation */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator size={18} />
                  Interest Calculation
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Principal Amount:</span>
                    <span className="font-medium">{formatCurrency(loan.currentLoanAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rate:</span>
                    <span className="font-medium">{loan.interestRateMonthlyPct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest Due:</span>
                    <span className="font-medium">{formatCurrency(calculatedInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid for {getMonthName(formData.forMonth)}:</span>
                    <span className="font-medium">{formatCurrency(totalPaidForMonth)}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 flex justify-between">
                    <span className="text-gray-900 font-medium">Remaining Interest Due:</span>
                    <span className="font-bold text-blue-600">{formatCurrency(remainingInterest)}</span>
                  </div>
                  {interestDifference !== 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Difference from Calculated:</span>
                      <span className={`font-medium ${interestDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {interestDifference > 0 ? '+' : ''}{formatCurrency(Math.abs(interestDifference))}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Gold Items List */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Gold Items</h3>
                <div className="space-y-2">
                  {activeItems.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-amber-200 last:border-b-0">
                      <div>
                        <p className="font-medium text-sm">{item.name || 'Gold Item'}</p>
                        <p className="text-xs text-gray-600">{item.weightGram}g • {item.purityK}K</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">{formatCurrency(item.loanAmount)}</p>
                      </div>
                    </div>
                  ))}
                  {activeItems.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{activeItems.length - 3} more items
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Payment Form */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Payment Details */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interest Amount * (Max: {formatCurrency(remainingInterest)})
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500">₹</span>
                        <input
                          type="number"
                          name="interestAmount"
                          value={formData.interestAmount}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          max={remainingInterest}
                          className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.interestAmount ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {errors.interestAmount && (
                        <p className="text-red-500 text-xs mt-1">{errors.interestAmount}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Date *
                      </label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.paymentDate ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.paymentDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        For Month *
                      </label>
                      <input
                        type="month"
                        name="forMonth"
                        value={formData.forMonth}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.forMonth ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formData.forMonth && (
                        <p className="text-sm text-gray-600 mt-1">
                          Payment for: {getMonthName(formData.forMonth)}
                        </p>
                      )}
                      {errors.forMonth && (
                        <p className="text-red-500 text-xs mt-1">{errors.forMonth}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method *
                      </label>
                      <select
                        name="paymentMethod"
                        value={formData.paymentMethod}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {paymentMethods.map(method => (
                          <option key={method.value} value={method.value}>
                            {method.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Conditional fields based on payment method */}
                  {formData.paymentMethod === 'CHEQUE' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cheque Number *
                        </label>
                        <input
                          type="text"
                          name="chequeNumber"
                          value={formData.chequeNumber}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.chequeNumber ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter cheque number"
                        />
                        {errors.chequeNumber && (
                          <p className="text-red-500 text-xs mt-1">{errors.chequeNumber}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.bankName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter bank name"
                        />
                        {errors.bankName && (
                          <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cheque Date *
                        </label>
                        <input
                          type="date"
                          name="chequeDate"
                          value={formData.chequeDate}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors.chequeDate ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {errors.chequeDate && (
                          <p className="text-red-500 text-xs mt-1">{errors.chequeDate}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(formData.paymentMethod) && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reference Number *
                      </label>
                      <input
                        type="text"
                        name="referenceNumber"
                        value={formData.referenceNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.referenceNumber ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter transaction reference number"
                      />
                      {errors.referenceNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.referenceNumber}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Photos & Documentation */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Camera size={18} />
                    Payment Documentation
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Payment Proof (Optional)
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Upload receipts, screenshots, or payment proof photos
                      </p>
                    </div>

                    {formData.photos.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos:</p>
                        <div className="flex gap-2 flex-wrap">
                          {formData.photos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img
                                src={photo}
                                alt={`Payment proof ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any additional notes about this payment..."
                      />
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">{loan.customer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment For:</span>
                      <span className="font-medium">{getMonthName(formData.forMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Interest Due:</span>
                      <span className="font-medium">{formatCurrency(calculatedInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Paid for Month:</span>
                      <span className="font-medium">{formatCurrency(totalPaidForMonth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Interest Due:</span>
                      <span className="font-medium text-blue-600">{formatCurrency(remainingInterest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">This Payment Amount:</span>
                      <span className="font-bold text-green-600">{formatCurrency(parseFloat(formData.interestAmount) || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">
                        {paymentMethods.find(m => m.value === formData.paymentMethod)?.label}
                      </span>
                    </div>
                    {interestDifference !== 0 && (
                      <div className="flex justify-between pt-2 border-t border-green-200">
                        <span className="text-gray-600">
                          {interestDifference > 0 ? 'Overpayment:' : 'Underpayment:'}
                        </span>
                        <span className={`font-medium ${interestDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(interestDifference))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || remainingInterest <= 0}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Record Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterestPaymentModal;