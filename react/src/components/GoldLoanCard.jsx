// import React, { useState } from 'react';
// import { 
//   Edit3, 
//   Eye, 
//   Phone, 
//   Calendar, 
//   Coins, 
//   DollarSign,
//   AlertTriangle,
//   CheckCircle,
//   XCircle,
//   User,
//   MessageSquare,
//   X,
//   Camera,
//   MapPin,
//   Clock,
//   Percent
// } from 'lucide-react';


// export const GoldLoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
//   const [showModal, setShowModal] = useState(false);
//   const [showPaymentOptions, setShowPaymentOptions] = useState(false);

//   const getStatusConfig = (status) => {
//     const configs = {
//       ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
//       OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
//       COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
//       CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
//     };
//     return configs[status] || configs.ACTIVE;
//   };

//   const getDaysUntilDue = () => {
//     if (!loan.dueDate) return 0;
//     const today = new Date();
//     const dueDate = new Date(loan.dueDate);
//     const diffTime = dueDate - today;
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   };

//   const statusConfig = getStatusConfig(loan.status);
//   const StatusIcon = statusConfig.icon;
//   const daysUntilDue = getDaysUntilDue();
//   const isOverdue = daysUntilDue < 0;
//   const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

//   const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
//   const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

//   // Calculate current values from items
 
//   const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
//   const loanAmount = loan.totalLoanAmount || 0; 
//   const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0; 

//   return (
//     <>
//       <div 
//         className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
//         onClick={() => setShowModal(true)}
//       >
//         <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 border-b border-amber-100">
//           <div className="flex items-start justify-between flex-wrap gap-2 sm:gap-0">
//             <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
//               <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
//                 <Coins size={20} className="sm:w-6 sm:h-6 drop-shadow-sm" />
//               </div>
//               <div className="min-w-0 flex-1">
//                 <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{loan._id}</h3>
//                 <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">
//                   {loan.items?.length || 0} items • {totalWeight}g
//                 </p>
//               </div>
//             </div>
//             <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
//               {(isOverdue || isDueSoon) && (
//                 <AlertTriangle size={16} className={`sm:w-[18px] sm:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
//               )}
//               <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
//                 <StatusIcon size={10} className="sm:w-3 sm:h-3" />
//                 {statusConfig.label}
//               </span>
//             </div>
//           </div>
//         </div>

//         {(isOverdue || isDueSoon) && (
//           <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-3">
//             <div className="flex items-center gap-2">
//               <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
//               <span className="text-xs sm:text-sm font-medium text-red-800">
//                 {isOverdue 
//                   ? `Payment overdue by ${Math.abs(daysUntilDue)} days`
//                   : `Payment due in ${daysUntilDue} days`
//                 }
//               </span>
//             </div>
//           </div>
//         )}

//         <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
//             <div className="flex items-center gap-2 sm:gap-3 min-w-0">
//               <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
//               <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
//                 {loan.customer?.name || 'Unknown Customer'}
//               </span>
//             </div>
//             <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
//               <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
//               <span className="truncate">{loan.customer?.phone || 'N/A'}</span>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-2 sm:gap-4">
//             <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
//               <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
//                 {formatCurrency(loanAmount)}
//               </div>
//               <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                 Loan Amount
//               </div>
//             </div>
//             <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-100">
//               <div className="text-sm sm:text-lg font-bold text-red-600 mb-1">
//                 {formatCurrency(outstandingAmount)}
//               </div>
//               <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                 Outstanding
//               </div>
//             </div>
//           </div>

//           <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
//             <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
//               <span className="text-gray-600">Weight & Interest:</span>
//               <span className="font-semibold text-gray-900">
//                 {totalWeight}g • {loan.interestRateMonthlyPct || 0}% /month
//               </span>
//             </div>
//           </div>

//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
//             <div className="flex items-center gap-2">
//               <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
//               <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
//             </div>
//             {loan.items && loan.items.length > 0 && (
//               <div className="flex items-center gap-1 text-xs sm:text-sm text-amber-600 ml-6 sm:ml-0">
//                 <Camera size={12} className="sm:w-[14px] sm:h-[14px]" />
//                 <span>{loan.items.reduce((sum, item) => sum + (item.images?.length || 0), 0)} photos</span>
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="px-3 sm:px-5 pb-3 sm:pb-5">
//           <div className="flex flex-wrap gap-2">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 setShowModal(true);
//               }}
//               className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
//             >
//               <Eye size={14} className="sm:w-4 sm:h-4" />
//               <span className="hidden xs:inline">View Details</span>
//               <span className="xs:hidden">View</span>
//             </button>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onEdit && onEdit(loan);
//               }}
//               className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
//             >
//               <Edit3 size={14} className="sm:w-4 sm:h-4" />
//               Edit
//             </button>
//             {loan.status === "ACTIVE" && (
//               <div className="relative">
//                 {!showPaymentOptions ? (
//                   <button
//                     onClick={() => setShowPaymentOptions(true)}
//                     className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white 
//                               bg-gradient-to-r from-green-500 to-green-600 
//                               hover:from-green-600 hover:to-green-700 
//                               rounded-lg shadow-sm transition-all"
//                   >
//                     <DollarSign size={16} />
//                     Payment
//                   </button>
//                 ) : (
//                   <div className="w-full bg-white border rounded-lg shadow-md p-4 flex flex-col gap-3">
//                     <p className="font-medium text-gray-700 text-sm mb-1">Choose Payment Type</p>
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg 
//                                   text-blue-600 font-semibold hover:bg-blue-100"
//                         onClick={() => {
//                           setShowPaymentOptions(false);
//                           onPayment && onPayment({ ...loan, type: "INTEREST" });
//                         }}
//                       >
//                         Interest
//                       </button>
//                       <button
//                         className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg 
//                                   text-green-600 font-semibold hover:bg-green-100"
//                         onClick={() => {
//                           setShowPaymentOptions(false);
//                           onPayment && onPayment({ ...loan, type: "REPAYMENT" });
//                         }}
//                       >
//                         Repayment
//                       </button>
//                     </div>
//                     <button
//                       className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
//                       onClick={() => setShowPaymentOptions(false)}
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}

//             {(isOverdue || isDueSoon) && (
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onSendReminder && onSendReminder(loan);
//                 }}
//                 className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-105"
//               >
//                 <MessageSquare size={14} className="sm:w-4 sm:h-4" />
//                 Remind
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
      
//       <GoldLoanDetailModal
//         loan={loan}
//         isOpen={showModal}
//         onClose={() => setShowModal(false)}
//         onEdit={(loan) => {
//           setShowModal(false);
//           onEdit && onEdit(loan);
//         }}
//         onPayment={(loan) => {
//           setShowModal(false);
//           onPayment && onPayment(loan);
//         }}
//         onSendReminder={(loan) => {
//           setShowModal(false);
//           onSendReminder && onSendReminder(loan);
//         }}
//       />
//     </>
//   );
// };
// const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
//   if (!isOpen || !loan) return null;

//   const [showPaymentOptions, setShowPaymentOptions] = useState(false);
//   const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
//   const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

//   const getStatusConfig = (status) => {
//     const configs = {
//       ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
//       OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
//       COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
//       CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
//     };
//     return configs[status] || configs.ACTIVE;
//   };

//   const statusConfig = getStatusConfig(loan.status);
//   const StatusIcon = statusConfig.icon;
  
//   // FIX: Calculate current values from the correct field names based on your MongoDB data
//   const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  
//   // FIX: Use the correct field names from your MongoDB data structure
//   const loanAmount = loan.totalLoanAmount || 0; // This matches your MongoDB field
//   const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0; // This matches your MongoDB field

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
//       <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-4xl h-full sm:max-h-[90vh] overflow-hidden flex flex-col">
//         <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
//           <div className="flex items-center justify-between gap-3">
//             <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
//               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
//                 <Coins size={24} className="sm:w-7 sm:h-7" />
//               </div>
//               <div className="min-w-0 flex-1">
//                 <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan._id}</h2>
//                 <p className="text-sm sm:text-base text-amber-700 font-medium truncate">
//                   {loan.items?.length || 0} items • {totalWeight}g
//                 </p>
//                 <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full mt-2 ${statusConfig.bg} ${statusConfig.text}`}>
//                   <StatusIcon size={10} className="sm:w-3 sm:h-3" />
//                   {statusConfig.label}
//                 </span>
//               </div>
//             </div>
//             <button
//               onClick={onClose}
//               className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all flex-shrink-0"
//             >
//               <X size={18} className="sm:w-5 sm:h-5" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
//           <div>
//             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Details</h3>
//             <div className="grid grid-cols-1 gap-4">
//               <div className="space-y-3 sm:space-y-4">
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                   <User size={16} className="text-gray-400 flex-shrink-0" />
//                   <div className="min-w-0 flex-1">
//                     <span className="text-xs sm:text-sm text-gray-500 block">Name</span>
//                     <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">
//                       {loan.customer?.name || 'Unknown Customer'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                   <Phone size={16} className="text-gray-400 flex-shrink-0" />
//                   <div className="min-w-0 flex-1">
//                     <span className="text-xs sm:text-sm text-gray-500 block">Phone</span>
//                     <span className="font-medium text-gray-900 text-sm sm:text-base">
//                       {loan.customer?.phone || 'N/A'}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
//                   <MapPin size={16} className="text-gray-400 flex-shrink-0" />
//                   <div className="min-w-0 flex-1">
//                     <span className="text-xs sm:text-sm text-gray-500 block">Email</span>
//                     <span className="font-medium text-gray-900 text-sm sm:text-base">
//                       {loan.customer?.email || 'Not provided'}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Financial Information</h3>
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
//               <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
//                 <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
//                   {formatCurrency(loanAmount)}
//                 </div>
//                 <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                   Principal Amount
//                 </div>
//               </div>
//               <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl">
//                 <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
//                   {formatCurrency(outstandingAmount)}
//                 </div>
//                 <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                   Outstanding
//                 </div>
//               </div>
//               <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
//                 <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
//                   {loan.interestRateMonthlyPct || 0}%
//                 </div>
//                 <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                   Interest Rate
//                 </div>
//               </div>
//               <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl">
//                 <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
//                   {totalWeight}g
//                 </div>
//                 <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
//                   Total Weight
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div>
//             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gold Items ({loan.items?.length || 0})</h3>
//             {loan.items && loan.items.length > 0 ? (
//               <div className="space-y-3">
//                 {loan.items.map((item, index) => (
//                   <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4">
//                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                       <div>
//                         <span className="text-gray-600 block mb-1 text-sm">Item Name</span>
//                         <span className="text-base font-medium text-gray-900">{item.name || 'Gold Item'}</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-600 block mb-1 text-sm">Weight</span>
//                         <span className="text-base font-medium text-gray-900">{item.weightGram}g</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-600 block mb-1 text-sm">Purity</span>
//                         <span className="text-base font-medium text-gray-900">{item.purityK}K</span>
//                       </div>
//                       <div>
//                         <span className="text-gray-600 block mb-1 text-sm">Amount</span>
//                         <span className="text-base font-medium text-gray-900">
//                           {formatCurrency(item.loanAmount ? item.loanAmount : 0)}
//                         </span>
//                       </div>
//                     </div>
//                     {item.images && item.images.length > 0 && (
//                       <div className="mt-3">
//                         <span className="text-gray-600 text-sm mb-2 block">Photos ({item.images.length})</span>
//                         <div className="flex gap-2 flex-wrap">
//                           {item.images.slice(0, 3).map((image, imgIndex) => (
//                             <div key={imgIndex} className="w-16 h-16 rounded-lg overflow-hidden border border-amber-200">
//                               <img 
//                                 src={image} 
//                                 alt={`${item.name} ${imgIndex + 1}`}
//                                 className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
//                                 onClick={() => window.open(image, '_blank')}
//                               />
//                             </div>
//                           ))}
//                           {item.images.length > 3 && (
//                             <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
//                               <span className="text-xs text-gray-500">+{item.images.length - 3}</span>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <p className="text-gray-500 text-center py-4">No items found</p>
//             )}
//           </div>

//           <div>
//             <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Timeline</h3>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
//               <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
//                 <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
//                 <div className="min-w-0">
//                   <span className="text-xs sm:text-sm text-gray-500 block">Start Date</span>
//                   <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.startDate)}</span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl">
//                 <Clock size={18} className="sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
//                 <div className="min-w-0">
//                   <span className="text-xs sm:text-sm text-gray-500 block">Due Date</span>
//                   <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.dueDate)}</span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
//                 <Percent size={18} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
//                 <div className="min-w-0">
//                   <span className="text-xs sm:text-sm text-gray-500 block">Monthly Interest</span>
//                   <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.interestRateMonthlyPct || 0}%</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
//             <button
//               onClick={() => onEdit(loan)}
//               className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
//             >
//               <Edit3 size={14} className="sm:w-4 sm:h-4" />
//               Edit Loan
//             </button>
//             {loan.status === "ACTIVE" && (
//             <div className="relative">
//               {!showPaymentOptions ? (
//                 <button
//                   onClick={() => setShowPaymentOptions(true)}
//                   className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
//                 >
//                   <DollarSign size={16} />
//                   Make Payment
//                 </button>
//               ) : (
//                 <div className="w-full bg-white border rounded-lg shadow-md p-4 flex flex-col gap-3">
//                   <p className="font-medium text-gray-700 text-sm mb-1">Choose Payment Type</p>
//                   <div className="grid grid-cols-2 gap-3">
//                     <button
//                       className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg 
//                                 text-blue-600 font-semibold hover:bg-blue-100"
//                       onClick={() => {
//                         setShowPaymentOptions(false);
//                         onPayment && onPayment({ ...loan, type: "INTEREST" });
//                       }}
//                     >
//                       Interest
//                     </button>
//                     <button
//                       className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg 
//                                 text-green-600 font-semibold hover:bg-green-100"
//                       onClick={() => {
//                         setShowPaymentOptions(false);
//                         onPayment && onPayment({ ...loan, type: "REPAYMENT" });
//                       }}
//                     >
//                       Repayment
//                     </button>
//                   </div>
//                   <button
//                     className="mt-2 text-xs text-gray-500 underline hover:text-gray-700"
//                     onClick={() => setShowPaymentOptions(false)}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               )}
//             </div>
//           )}


//             <button
//               onClick={() => onSendReminder(loan)}
//               className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
//             >
//               <MessageSquare size={14} className="sm:w-4 sm:h-4" />
//               Send Reminder
//             </button>
//             <button
//               onClick={() => window.location.href = `tel:${loan.customer?.phone}`}
//               className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
//             >
//               <Phone size={14} className="sm:w-4 sm:h-4" />
//               Call Customer
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Eye, 
  Phone, 
  Calendar, 
  Coins, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  X,
  Camera,
  MapPin,
  Clock,
  Percent,
  History,
  Receipt,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter
} from 'lucide-react';
import ApiService from '../services/api';
import InterestPaymentModal from './InterestPaymentModal';
import ItemRepaymentModal from './ItemRepaymentModal.jsx';

export const GoldLoanCard = ({ loan, onEdit, onView, onPayment, onSendReminder }) => {
  const [showModal, setShowModal] = useState(false);
  const [showInterestPaymentModal, setShowInterestPaymentModal] = useState(false);
  const [showItemRepaymentModal, setShowItemRepaymentModal] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const getDaysUntilDue = () => {
    if (!loan.dueDate) return 0;
    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    const diffTime = dueDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';

  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0; 
  const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0; 

  const handleInterestPaymentSuccess = (result) => {
    console.log('Interest payment successful:', result);
    if (onPayment) {
      onPayment(loan);
    }
  };

  const handleItemRepaymentSuccess = (result) => {
    console.log('Item repayment successful:', result);
    if (onPayment) {
      onPayment(loan);
    }
  };

  return (
    <>
      <div 
        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-amber-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
        onClick={() => setShowModal(true)}
      >
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 border-b border-amber-100">
          <div className="flex items-start justify-between flex-wrap gap-2 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={20} className="sm:w-6 sm:h-6 drop-shadow-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{loan._id}</h3>
                <p className="text-xs sm:text-sm text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight}g
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {(isOverdue || isDueSoon) && (
                <AlertTriangle size={16} className={`sm:w-[18px] sm:h-[18px] ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} />
              )}
              <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ${statusConfig.bg} ${statusConfig.text}`}>
                <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {(isOverdue || isDueSoon) && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-red-800">
                {isOverdue 
                  ? `Payment overdue by ${Math.abs(daysUntilDue)} days`
                  : `Payment due in ${daysUntilDue} days`
                }
              </span>
            </div>
          </div>
        )}

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <User size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                {loan.customer?.name || 'Unknown Customer'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 ml-6 sm:ml-0">
              <Phone size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
              <span className="truncate">{loan.customer?.phone || 'N/A'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg sm:rounded-xl">
              <div className="text-sm sm:text-lg font-bold text-gray-900 mb-1">
                {formatCurrency(loanAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Loan Amount
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-100">
              <div className="text-sm sm:text-lg font-bold text-red-600 mb-1">
                {formatCurrency(outstandingAmount)}
              </div>
              <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                Outstanding
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-3 border border-amber-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs sm:text-sm">
              <span className="text-gray-600">Weight & Interest:</span>
              <span className="font-semibold text-gray-900">
                {totalWeight}g • {loan.interestRateMonthlyPct || 0}% /month
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Due: {formatDate(loan.dueDate)}</span>
            </div>
            {loan.items && loan.items.length > 0 && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-amber-600 ml-6 sm:ml-0">
                <Camera size={12} className="sm:w-[14px] sm:h-[14px]" />
                <span>{loan.items.reduce((sum, item) => sum + (item.images?.length || 0), 0)} photos</span>
              </div>
            )}
          </div>
        </div>

        <div className="px-3 sm:px-5 pb-3 sm:pb-5">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowModal(true);
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">View Details</span>
              <span className="xs:hidden">View</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(loan);
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit
            </button>
            
            {loan.status === "ACTIVE" && (
              <div className="relative group">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white 
                            bg-gradient-to-r from-green-500 to-green-600 
                            hover:from-green-600 hover:to-green-700 
                            rounded-lg shadow-sm transition-all"
                >
                  <DollarSign size={16} />
                  Payment
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInterestPaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      Interest Payment
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowItemRepaymentModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-md transition-colors"
                    >
                      Item Repayment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(isOverdue || isDueSoon) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendReminder && onSendReminder(loan);
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                Remind
              </button>
            )}
          </div>
        </div>
      </div>
      
      <GoldLoanDetailModal
        loan={loan}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onEdit={(loan) => {
          setShowModal(false);
          onEdit && onEdit(loan);
        }}
        onPayment={(loan) => {
          setShowModal(false);
          if (loan.type === 'INTEREST') {
            setShowInterestPaymentModal(true);
          } else {
            setShowItemRepaymentModal(true);
          }
        }}
        onSendReminder={(loan) => {
          setShowModal(false);
          onSendReminder && onSendReminder(loan);
        }}
      />

      <InterestPaymentModal
        isOpen={showInterestPaymentModal}
        onClose={() => setShowInterestPaymentModal(false)}
        loan={loan}
        onPaymentSuccess={handleInterestPaymentSuccess}
      />
      <ItemRepaymentModal
        isOpen={showItemRepaymentModal}
        onClose={() => setShowItemRepaymentModal(false)}
        loan={loan}
        onRepaymentSuccess={handleItemRepaymentSuccess}
      />
    </>
  );
};

const GoldLoanDetailModal = ({ loan, isOpen, onClose, onEdit, onPayment, onSendReminder }) => {
  const [interestPayments, setInterestPayments] = useState([]);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showRepaymentHistory, setShowRepaymentHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [repaymentHistoryPage, setRepaymentHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [repaymentTotalPages, setRepaymentTotalPages] = useState(0);

  const fetchInterestPayments = async (page = 1) => {
    if (!loan?._id) return;
    try {
      setLoading(true);
      const result = await ApiService.getInterestPayments(loan._id, { 
        page, 
        limit: 10 
      });
      if (result.success) {
        if (page === 1) {
          setInterestPayments(result.data);
        } else {
          setInterestPayments(prev => [...prev, ...result.data]);
        }
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch interest payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepayments = async (page = 1) => {
    if (!loan?._id) return;
    try {
      setLoading(true);
      const result = await ApiService.getRepayments(loan._id, { 
        page, 
        limit: 10 
      });
      if (result.success) {
        if (page === 1) {
          setRepayments(result.data);
        } else {
          setRepayments(prev => [...prev, ...result.data]);
        }
        setRepaymentTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch repayments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && loan?._id) {
      fetchInterestPayments(1);
      fetchRepayments(1);
    }
  }, [isOpen, loan?._id]);

  if (!isOpen || !loan) return null;

  const formatCurrency = (amount) => `₹${amount?.toLocaleString() || '0'}`;
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-IN') : 'N/A';
  const formatDateTime = (date) => date ? new Date(date).toLocaleString('en-IN') : 'N/A';

  const getStatusConfig = (status) => {
    const configs = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Active' },
      OVERDUE: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Overdue' },
      COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Completed' },
      CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle, label: 'Closed' }
    };
    return configs[status] || configs.ACTIVE;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'CASH': '💵',
      'CHEQUE': '📝',
      'NET_BANKING': '🏦',
      'UPI': '📱',
      'CARD': '💳',
      'BANK_TRANSFER': '🔄'
    };
    return icons[method] || '💰';
  };

  const statusConfig = getStatusConfig(loan.status);
  const StatusIcon = statusConfig.icon;
  const totalWeight = loan.items?.reduce((sum, item) => sum + (item.weightGram || 0), 0) || 0;
  const loanAmount = loan.totalLoanAmount || 0;
  const outstandingAmount = loan.currentLoanAmount || loan.totalLoanAmount || 0;

  const loadMorePayments = () => {
    if (historyPage < totalPages && !loading) {
      const nextPage = historyPage + 1;
      setHistoryPage(nextPage);
      fetchInterestPayments(nextPage);
    }
  };

  const loadMoreRepayments = () => {
    if (repaymentHistoryPage < repaymentTotalPages && !loading) {
      const nextPage = repaymentHistoryPage + 1;
      setRepaymentHistoryPage(nextPage);
      fetchRepayments(nextPage);
    }
  };

  const getItemNames = (itemIds) => {
    if (!itemIds || itemIds.length === 0) return 'None';
    return loan.items
      .filter(item => itemIds.includes(item._id.toString()))
      .map(item => item.name || 'Gold Item')
      .join(', ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg sm:rounded-2xl w-full max-w-6xl h-full sm:max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-6 border-b border-amber-100 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg ring-2 sm:ring-4 ring-amber-100 flex-shrink-0">
                <Coins size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{loan._id}</h2>
                <p className="text-sm sm:text-base text-amber-700 font-medium truncate">
                  {loan.items?.length || 0} items • {totalWeight}g
                </p>
                <span className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs font-semibold rounded-full mt-2 ${statusConfig.bg} ${statusConfig.text}`}>
                  <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                  {statusConfig.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Name</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base truncate block">
                      {loan.customer?.name || 'Unknown Customer'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Phone</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {loan.customer?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm text-gray-500 block">Email</span>
                    <span className="font-medium text-gray-900 text-sm sm:text-base">
                      {loan.customer?.email || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Financial Information</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
                  {formatCurrency(loanAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Principal Amount
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
                  {formatCurrency(outstandingAmount)}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Outstanding
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
                  {loan.interestRateMonthlyPct || 0}%
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Interest Rate
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-xl">
                <div className="text-lg sm:text-2xl font-bold text-purple-600 mb-1">
                  {totalWeight}g
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  Total Weight
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} />
                Interest Payment History
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  {interestPayments.length}
                </span>
              </h3>
              <button
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                {showPaymentHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showPaymentHistory ? 'Hide' : 'Show'} History
              </button>
            </div>

            {showPaymentHistory && (
              <div className="bg-gray-50 rounded-xl p-4">
                {loading && interestPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-500 mt-2">Loading payment history...</p>
                  </div>
                ) : interestPayments.length > 0 ? (
                  <div className="space-y-3">
                    {interestPayments.map((payment, index) => (
                      <div 
                        key={payment._id || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Receipt size={16} className="text-green-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {payment.receiptNumber}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(payment.paymentDate)}
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600 mb-1">
                              {formatCurrency(payment.interestAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              For: {payment.forMonthName} {payment.forYear}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {payment.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                            {payment.referenceNumber && (
                              <div className="text-xs text-gray-500">
                                Ref: {payment.referenceNumber}
                              </div>
                            )}
                            {payment.chequeNumber && (
                              <div className="text-xs text-gray-500">
                                Cheque: {payment.chequeNumber}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 mb-1">
                              <span className="text-xs text-gray-500">Due: </span>
                              {formatCurrency(payment.calculatedInterestDue)}
                            </div>
                            {payment.paymentDifference !== 0 && (
                              <div className={`text-xs ${payment.paymentDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {payment.paymentDifference > 0 ? 'Overpaid' : 'Underpaid'}: {formatCurrency(Math.abs(payment.paymentDifference))}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Rate: {payment.interestRate}%
                            </div>
                          </div>
                        </div>
                        {(payment.notes || payment.photos?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {payment.notes && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">Notes:</span>
                                  <p className="text-sm text-gray-700 truncate">{payment.notes}</p>
                                </div>
                              )}
                              {payment.photos?.length > 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">
                                    Attachments: {payment.photos.length} file(s)
                                  </span>
                                  <div className="flex gap-1">
                                    {payment.photos.slice(0, 3).map((photo, photoIndex) => (
                                      <div 
                                        key={photoIndex}
                                        className="w-6 h-6 bg-blue-100 rounded text-xs flex items-center justify-center text-blue-600 cursor-pointer hover:bg-blue-200"
                                        onClick={() => window.open(photo, '_blank')}
                                      >
                                        <Camera size={12} />
                                      </div>
                                    ))}
                                    {payment.photos.length > 3 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        +{payment.photos.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {historyPage < totalPages && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMorePayments}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                          {loading ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>Load More ({totalPages - historyPage} pages remaining)</>
                          )}
                        </button>
                      </div>
                    )}
                    {interestPayments.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {interestPayments.length}
                            </div>
                            <div className="text-xs text-gray-600">Total Payments</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0))}
                            </div>
                            <div className="text-xs text-gray-600">Total Paid</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              {formatCurrency(interestPayments.reduce((sum, p) => sum + (p.calculatedInterestDue || 0), 0))}
                            </div>
                            <div className="text-xs text-gray-600">Total Due</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-600">
                              {formatCurrency(
                                interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0) - 
                                interestPayments.reduce((sum, p) => sum + (p.calculatedInterestDue || 0), 0)
                              )}
                            </div>
                            <div className="text-xs text-gray-600">Difference</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No interest payments recorded yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Interest payments will appear here once recorded
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <History size={18} />
                Item Repayment History
                <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {repayments.length}
                </span>
              </h3>
              <button
                onClick={() => setShowRepaymentHistory(!showRepaymentHistory)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                {showRepaymentHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showRepaymentHistory ? 'Hide' : 'Show'} History
              </button>
            </div>

            {showRepaymentHistory && (
              <div className="bg-gray-50 rounded-xl p-4">
                {loading && repayments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-gray-500 mt-2">Loading repayment history...</p>
                  </div>
                ) : repayments.length > 0 ? (
                  <div className="space-y-3">
                    {repayments.map((repayment, index) => (
                      <div 
                        key={repayment._id || index}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Receipt size={16} className="text-green-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {repayment.referenceNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(repayment.repaymentDate)}
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600 mb-1">
                              {formatCurrency(repayment.netRepaymentAmount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Type: {repayment.repaymentType.replace('_', ' ')}
                            </div>
                            {repayment.isFullRepayment && (
                              <div className="text-xs text-blue-600">
                                Full Repayment
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">
                                {getPaymentMethodIcon(repayment.paymentMethod)}
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {repayment.paymentMethod.replace('_', ' ')}
                              </span>
                            </div>
                            {repayment.chequeNumber && (
                              <div className="text-xs text-gray-500">
                                Cheque: {repayment.chequeNumber}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 mb-1">
                              <span className="text-xs text-gray-500">Principal Reduced: </span>
                              {formatCurrency(repayment.principalReduced)}
                            </div>
                            {repayment.interestPaidWithRepayment > 0 && (
                              <div className="text-xs text-gray-500">
                                Interest Paid: {formatCurrency(repayment.interestPaidWithRepayment)}
                              </div>
                            )}
                            {repayment.totalItemsReturned > 0 && (
                              <div className="text-xs text-gray-500">
                                Items Returned: {repayment.totalItemsReturned}
                              </div>
                            )}
                          </div>
                        </div>
                        {(repayment.selectedItemIds?.length > 0 || repayment.notes || repayment.photos?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {repayment.selectedItemIds?.length > 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">Items Returned:</span>
                                  <p className="text-sm text-gray-700 truncate">{getItemNames(repayment.selectedItemIds)}</p>
                                  <p className="text-xs text-gray-500">
                                    Weight: {repayment.totalWeightReturned}g
                                  </p>
                                </div>
                              )}
                              {repayment.notes && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">Notes:</span>
                                  <p className="text-sm text-gray-700 truncate">{repayment.notes}</p>
                                </div>
                              )}
                              {repayment.photos?.length > 0 && (
                                <div>
                                  <span className="text-xs text-gray-500 block mb-1">
                                    Attachments: {repayment.photos.length} file(s)
                                  </span>
                                  <div className="flex gap-1">
                                    {repayment.photos.slice(0, 3).map((photo, photoIndex) => (
                                      <div 
                                        key={photoIndex}
                                        className="w-6 h-6 bg-green-100 rounded text-xs flex items-center justify-center text-green-600 cursor-pointer hover:bg-green-200"
                                        onClick={() => window.open(photo, '_blank')}
                                      >
                                        <Camera size={12} />
                                      </div>
                                    ))}
                                    {repayment.photos.length > 3 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        +{repayment.photos.length - 3}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {repaymentHistoryPage < repaymentTotalPages && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMoreRepayments}
                          disabled={loading}
                          className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 disabled:opacity-50 text-sm font-medium transition-colors"
                        >
                          {loading ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>Load More ({repaymentTotalPages - repaymentHistoryPage} pages remaining)</>
                          )}
                        </button>
                      </div>
                    )}
                    {repayments.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {repayments.length}
                            </div>
                            <div className="text-xs text-gray-600">Total Repayments</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(repayments.reduce((sum, p) => sum + (p.netRepaymentAmount || 0), 0))}
                            </div>
                            <div className="text-xs text-gray-600">Total Paid</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-purple-600">
                              {repayments.reduce((sum, p) => sum + (p.totalItemsReturned || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-600">Items Returned</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-600">
                              {repayments.reduce((sum, p) => sum + (p.totalWeightReturned || 0), 0)}g
                            </div>
                            <div className="text-xs text-gray-600">Weight Returned</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Receipt size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No repayments recorded yet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Repayments will appear here once recorded
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Gold Items ({loan.items?.length || 0})</h3>
            {loan.items && loan.items.length > 0 ? (
              <div className="space-y-3">
                {loan.items.map((item, index) => (
                  <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Item Name</span>
                        <span className="text-base font-medium text-gray-900">{item.name || 'Gold Item'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Weight</span>
                        <span className="text-base font-medium text-gray-900">{item.weightGram}g</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Purity</span>
                        <span className="text-base font-medium text-gray-900">{item.purityK}K</span>
                      </div>
                      <div>
                        <span className="text-gray-600 block mb-1 text-sm">Amount</span>
                        <span className="text-base font-medium text-gray-900">
                          {formatCurrency(item.loanAmount ? item.loanAmount : 0)}
                        </span>
                      </div>
                    </div>
                    {item.images && item.images.length > 0 && (
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm mb-2 block">Photos ({item.images.length})</span>
                        <div className="flex gap-2 flex-wrap">
                          {item.images.slice(0, 3).map((image, imgIndex) => (
                            <div key={imgIndex} className="w-16 h-16 rounded-lg overflow-hidden border border-amber-200">
                              <img 
                                src={image} 
                                alt={`${item.name} ${imgIndex + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                                onClick={() => window.open(image, '_blank')}
                              />
                            </div>
                          ))}
                          {item.images.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-500">+{item.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No items found</p>
            )}
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Timeline</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                <Calendar size={18} className="sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Start Date</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.startDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-yellow-50 rounded-xl">
                <Clock size={18} className="sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Due Date</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{formatDate(loan.dueDate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-xl">
                <Percent size={18} className="sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 block">Monthly Interest</span>
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{loan.interestRateMonthlyPct || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100">
            <button
              onClick={() => onEdit(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Edit3 size={14} className="sm:w-4 sm:h-4" />
              Edit Loan
            </button>
            {loan.status === "ACTIVE" && (
              <>
                <button
                  onClick={() => onPayment({ ...loan, type: "INTEREST" })}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                >
                  <DollarSign size={16} />
                  Interest Payment
                </button>
                <button
                  onClick={() => onPayment({ ...loan, type: "REPAYMENT" })}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-all duration-200 hover:scale-105 shadow-sm"
                >
                  <DollarSign size={16} />
                  Item Repayment
                </button>
              </>
            )}
            <button
              onClick={() => onSendReminder(loan)}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <MessageSquare size={14} className="sm:w-4 sm:h-4" />
              Send Reminder
            </button>
            <button
              onClick={() => window.location.href = `tel:${loan.customer?.phone}`}
              className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Phone size={14} className="sm:w-4 sm:h-4" />
              Call Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};