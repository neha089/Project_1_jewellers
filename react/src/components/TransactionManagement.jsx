// import { useState } from "react";
// import { mockTransactions } from "../data/mockTransactions";
// import TransactionCard from "./TransactionCard";
// import TransactionSearchFilterBar from "./TransactionSearchFilterBar";
// import TransactionTableRow from "./TransactionTableRow";
// import QuickTransactionEntry from "./QuickTransactionEntry";
// import AddTransactionModal from "./AddTransactionModal";
// import StatsCard from "./StatsCard";
// import TransactionHeader from "./TransactionHeader";
// import SummaryCards from "./SummaryCards";
// import TransactionFilters from "./TransactionFilters";
// import RecentTransactions from "./RecentTransactions";
// import { 
//   Download, 
//   Plus, 
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   FileText,
//   Calendar
// } from 'lucide-react';

// const TransactionManagement = () => {
//   const [transactions, setTransactions] = useState(mockTransactions);

//   const handleAddTransaction = (newTransaction) => {
//     setTransactions([newTransaction, ...transactions]);
//   };

//   const handleEditTransaction = (transaction) => {
//     console.log('Edit transaction:', transaction);
//   };

//   const handleDeleteTransaction = (id) => {
//     setTransactions(transactions.filter(t => t.id !== id));
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="mb-8">
//       <TransactionHeader />
//       </div>
//        <div className="mb-8">
//       <SummaryCards />
//       </div>
//       <QuickTransactionEntry onAddTransaction={handleAddTransaction} />
//       <TransactionFilters />
//       <RecentTransactions 
//         transactions={transactions}
//         onEdit={handleEditTransaction}
//         onDelete={handleDeleteTransaction}
//       />
//     </div>
//   );
// };

// export default TransactionManagement;


// import React, { useState, useEffect } from 'react';
// import {
//   Search,
//   Plus,
//   TrendingUp,
//   TrendingDown,
//   User,
//   Phone,
//   MapPin,
//   FileText,
//   X,
//   Save,
//   Eye,
//   EyeOff,
//   Coins,
//   Users,
//   Calculator,
//   Calendar,
//   DollarSign,
//   CreditCard,
//   Banknote,
//   ShoppingCart,
//   UserPlus,
//   Building,
//   Gem
// } from 'lucide-react';

// // Mock data for customers
// const mockCustomers = [
//   { id: 1, name: 'Rahul Patel', phone: '+91 98765 43210', city: 'Ahmedabad' },
//   { id: 2, name: 'Priya Shah', phone: '+91 98765 43211', city: 'Surat' },
//   { id: 3, name: 'Amit Kumar', phone: '+91 98765 43212', city: 'Rajkot' },
// ];

// // Transaction categories
// const incomeCategories = [
//   { 
//     id: 'gold_sale', 
//     label: 'Gold Sale', 
//     icon: <Coins className="text-yellow-600" size={20} />,
//     description: 'Sell gold jewelry or items to customer'
//   },
//   { 
//     id: 'silver_sale', 
//     label: 'Silver Sale', 
//     icon: <Gem className="text-gray-400" size={20} />,
//     description: 'Sell silver jewelry or items to customer'
//   },
//   { 
//     id: 'loan_interest', 
//     label: 'Loan Interest', 
//     icon: <Calculator className="text-green-600" size={20} />,
//     description: 'Interest received from gold/silver loans'
//   },
//   { 
//     id: 'loan_repayment', 
//     label: 'Loan Repayment', 
//     icon: <CreditCard className="text-blue-600" size={20} />,
//     description: 'Principal amount received from customers'
//   },
//   { 
//     id: 'udhar_return', 
//     label: 'Udhar Return', 
//     icon: <Banknote className="text-purple-600" size={20} />,
//     description: 'Money received back from credit given'
//   }
// ];

// const expenseCategories = [
//   { 
//     id: 'gold_loan', 
//     label: 'Gold Loan', 
//     icon: <Coins className="text-amber-600" size={20} />,
//     description: 'Give loan against gold pledge'
//   },
//   { 
//     id: 'customer_udhar', 
//     label: 'Customer Credit', 
//     icon: <Users className="text-red-600" size={20} />,
//     description: 'Give money on credit to customer'
//   },
//   { 
//     id: 'supplier_udhar', 
//     label: 'Take Credit', 
//     icon: <Building className="text-orange-600" size={20} />,
//     description: 'Take credit from suppliers/other jewelers'
//   },
//   { 
//     id: 'gold_purchase', 
//     label: 'Gold Purchase', 
//     icon: <ShoppingCart className="text-yellow-700" size={20} />,
//     description: 'Purchase gold items on credit'
//   },
//   { 
//     id: 'business_expense', 
//     label: 'Business Expense', 
//     icon: <FileText className="text-gray-600" size={20} />,
//     description: 'General business expenses'
//   }
// ];

// // Customer Search Component
// const CustomerSearch = ({ onCustomerSelect, onCreateNew }) => {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [showResults, setShowResults] = useState(false);

//   useEffect(() => {
//     if (searchTerm.length >= 2) {
//       const results = mockCustomers.filter(customer =>
//         customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         customer.phone.includes(searchTerm)
//       );
//       setSearchResults(results);
//       setShowResults(true);
//     } else {
//       setShowResults(false);
//     }
//   }, [searchTerm]);

//   return (
//     <div className="relative">
//       <div className="relative">
//         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           placeholder="Search customer by name or phone..."
//           className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//         />
//       </div>
      
//       {showResults && (
//         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//           {searchResults.length > 0 ? (
//             <>
//               {searchResults.map((customer) => (
//                 <div
//                   key={customer.id}
//                   onClick={() => {
//                     onCustomerSelect(customer);
//                     setShowResults(false);
//                     setSearchTerm('');
//                   }}
//                   className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
//                 >
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="font-medium text-gray-900">{customer.name}</p>
//                       <p className="text-sm text-gray-500 flex items-center gap-1">
//                         <Phone size={14} />
//                         {customer.phone}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm text-gray-500 flex items-center gap-1">
//                         <MapPin size={14} />
//                         {customer.city}
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <div
//                 onClick={() => {
//                   onCreateNew();
//                   setShowResults(false);
//                 }}
//                 className="px-4 py-3 border-t border-gray-200 bg-blue-50 hover:bg-blue-100 cursor-pointer text-blue-600 font-medium flex items-center gap-2"
//               >
//                 <UserPlus size={16} />
//                 Create New Customer
//               </div>
//             </>
//           ) : (
//             <div
//               onClick={() => {
//                 onCreateNew();
//                 setShowResults(false);
//               }}
//               className="px-4 py-3 text-center text-gray-500 hover:bg-gray-50 cursor-pointer"
//             >
//               <div className="flex flex-col items-center gap-2">
//                 <UserPlus size={24} className="text-blue-500" />
//                 <span>No customers found. Create new customer?</span>
//               </div>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// // Customer Creation Form
// const CustomerForm = ({ onSave, onCancel, existingCustomer }) => {
//   const [formData, setFormData] = useState({
//     firstName: existingCustomer?.firstName || '',
//     lastName: existingCustomer?.lastName || '',
//     phone: existingCustomer?.phone || '',
//     email: existingCustomer?.email || '',
//     address: existingCustomer?.address || '',
//     city: existingCustomer?.city || '',
//     state: existingCustomer?.state || 'Gujarat',
//     pinCode: existingCustomer?.pinCode || '',
//     idProofType: existingCustomer?.idProofType || 'aadhar',
//     idProofNumber: existingCustomer?.idProofNumber || '',
//   });

//   const [errors, setErrors] = useState({});

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors(prev => ({ ...prev, [name]: '' }));
//     }
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
//     if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
//     if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (validateForm()) {
//       const customerData = {
//         ...formData,
//         id: existingCustomer?.id || Date.now(),
//         name: `${formData.firstName} ${formData.lastName}`
//       };
//       onSave(customerData);
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-6">
//       <div className="flex items-center justify-between mb-6">
//         <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
//           <Users className="text-blue-600" size={20} />
//           {existingCustomer ? 'Edit Customer' : 'Create New Customer'}
//         </h3>
//         <button
//           onClick={onCancel}
//           className="text-gray-400 hover:text-gray-600"
//         >
//           <X size={20} />
//         </button>
//       </div>

//       <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
//           <input
//             type="text"
//             name="firstName"
//             value={formData.firstName}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.firstName ? 'border-red-300' : 'border-gray-300'
//             }`}
//           />
//           {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
//           <input
//             type="text"
//             name="lastName"
//             value={formData.lastName}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.lastName ? 'border-red-300' : 'border-gray-300'
//             }`}
//           />
//           {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
//           <input
//             type="tel"
//             name="phone"
//             value={formData.phone}
//             onChange={handleChange}
//             className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//               errors.phone ? 'border-red-300' : 'border-gray-300'
//             }`}
//           />
//           {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
//           <input
//             type="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div className="md:col-span-2">
//           <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
//           <input
//             type="text"
//             name="address"
//             value={formData.address}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
//           <input
//             type="text"
//             name="city"
//             value={formData.city}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
//           <select
//             name="state"
//             value={formData.state}
//             onChange={handleChange}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="Gujarat">Gujarat</option>
//             <option value="Maharashtra">Maharashtra</option>
//             <option value="Rajasthan">Rajasthan</option>
//           </select>
//         </div>

//         <div className="flex justify-end gap-3 md:col-span-2 pt-4">
//           <button
//             type="button"
//             onClick={onCancel}
//             className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//           >
//             Cancel
//           </button>
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
//           >
//             <Save size={16} />
//             Save Customer
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// // Category-specific forms
// const GoldSaleForm = ({ customer, onSave, onCancel }) => {
//   const [formData, setFormData] = useState({
//     goldType: '22K',
//     weight: '',
//     ratePerGram: '',
//     totalAmount: '',
//     purity: '916',
//     description: ''
//   });

//   const calculateAmount = () => {
//     const weight = parseFloat(formData.weight) || 0;
//     const rate = parseFloat(formData.ratePerGram) || 0;
//     const total = weight * rate;
//     setFormData(prev => ({ ...prev, totalAmount: total.toString() }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({
//       type: 'income',
//       category: 'gold_sale',
//       customer,
//       ...formData,
//       amount: parseFloat(formData.totalAmount)
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Gold Type</label>
//           <select
//             value={formData.goldType}
//             onChange={(e) => setFormData(prev => ({ ...prev, goldType: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="24K">24K Gold</option>
//             <option value="22K">22K Gold</option>
//             <option value="18K">18K Gold</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
//           <input
//             type="text"
//             value={formData.purity}
//             onChange={(e) => setFormData(prev => ({ ...prev, purity: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-3 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
//           <input
//             type="number"
//             step="0.1"
//             value={formData.weight}
//             onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Rate per gram (₹)</label>
//           <input
//             type="number"
//             value={formData.ratePerGram}
//             onChange={(e) => setFormData(prev => ({ ...prev, ratePerGram: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (₹)</label>
//           <div className="relative">
//             <input
//               type="number"
//               value={formData.totalAmount}
//               onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <button
//               type="button"
//               onClick={calculateAmount}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:bg-blue-50 p-1 rounded"
//             >
//               <Calculator size={16} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//         <textarea
//           value={formData.description}
//           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//           rows="3"
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder="Gold chain, necklace, etc..."
//         />
//       </div>

//       <div className="flex justify-end gap-3 pt-4">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
//         >
//           Save Transaction
//         </button>
//       </div>
//     </form>
//   );
// };

// const GoldLoanForm = ({ customer, onSave, onCancel }) => {
//   const [formData, setFormData] = useState({
//     goldType: '22K',
//     weight: '',
//     purity: '916',
//     loanAmount: '',
//     interestRate: '2.5',
//     duration: '6',
//     description: ''
//   });

//   const calculateLoanAmount = () => {
//     const weight = parseFloat(formData.weight) || 0;
//     const goldRates = { '24K': 6200, '22K': 5700, '18K': 4600 };
//     const rate = goldRates[formData.goldType] || 5700;
//     const estimatedValue = weight * rate;
//     const loanAmount = Math.floor(estimatedValue * 0.75); // 75% of gold value
//     setFormData(prev => ({ ...prev, loanAmount: loanAmount.toString() }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({
//       type: 'expense',
//       category: 'gold_loan',
//       customer,
//       ...formData,
//       amount: parseFloat(formData.loanAmount)
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Gold Type</label>
//           <select
//             value={formData.goldType}
//             onChange={(e) => setFormData(prev => ({ ...prev, goldType: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="24K">24K Gold</option>
//             <option value="22K">22K Gold</option>
//             <option value="18K">18K Gold</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
//           <input
//             type="text"
//             value={formData.purity}
//             onChange={(e) => setFormData(prev => ({ ...prev, purity: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Weight (grams)</label>
//           <input
//             type="number"
//             step="0.1"
//             value={formData.weight}
//             onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount (₹)</label>
//           <div className="relative">
//             <input
//               type="number"
//               value={formData.loanAmount}
//               onChange={(e) => setFormData(prev => ({ ...prev, loanAmount: e.target.value }))}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//             <button
//               type="button"
//               onClick={calculateLoanAmount}
//               className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:bg-blue-50 p-1 rounded"
//             >
//               <Calculator size={16} />
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-2 gap-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per month)</label>
//           <input
//             type="number"
//             step="0.1"
//             value={formData.interestRate}
//             onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
//           <select
//             value={formData.duration}
//             onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
//             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="3">3 Months</option>
//             <option value="6">6 Months</option>
//             <option value="9">9 Months</option>
//             <option value="12">12 Months</option>
//           </select>
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//         <textarea
//           value={formData.description}
//           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//           rows="3"
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder="Gold items details..."
//         />
//       </div>

//       <div className="flex justify-end gap-3 pt-4">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
//         >
//           Create Loan
//         </button>
//       </div>
//     </form>
//   );
// };

// const SimpleTransactionForm = ({ customer, category, type, onSave, onCancel }) => {
//   const [formData, setFormData] = useState({
//     amount: '',
//     description: '',
//     notes: ''
//   });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onSave({
//       type,
//       category: category.id,
//       customer,
//       ...formData,
//       amount: parseFloat(formData.amount)
//     });
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
//         <input
//           type="number"
//           value={formData.amount}
//           onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           required
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
//         <input
//           type="text"
//           value={formData.description}
//           onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder={`${category.label} details...`}
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
//         <textarea
//           value={formData.notes}
//           onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
//           rows="3"
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           placeholder="Any additional information..."
//         />
//       </div>

//       <div className="flex justify-end gap-3 pt-4">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//         >
//           Cancel
//         </button>
//         <button
//           type="submit"
//           className={`px-4 py-2 text-white rounded-lg hover:opacity-90 ${
//             type === 'income' ? 'bg-green-600' : 'bg-red-600'
//           }`}
//         >
//           Save Transaction
//         </button>
//       </div>
//     </form>
//   );
// };

// // Main Transaction Management Component
// const TransactionManagement = () => {
//   const [step, setStep] = useState('search'); // search, category, form
//   const [transactionType, setTransactionType] = useState('income');
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [showCustomerForm, setShowCustomerForm] = useState(false);
//   const [transactions, setTransactions] = useState([]);

//   const resetFlow = () => {
//     setStep('search');
//     setSelectedCustomer(null);
//     setSelectedCategory(null);
//     setShowCustomerForm(false);
//     setTransactionType('income');
//   };

//   const handleCustomerSelect = (customer) => {
//     setSelectedCustomer(customer);
//     setStep('category');
//     setShowCustomerForm(false);
//   };

//   const handleCreateNewCustomer = () => {
//     setShowCustomerForm(true);
//   };

//   const handleCustomerSave = (customerData) => {
//     setSelectedCustomer(customerData);
//     setShowCustomerForm(false);
//     setStep('category');
//   };

//   const handleCategorySelect = (category) => {
//     setSelectedCategory(category);
//     setStep('form');
//   };

//   const handleTransactionSave = (transactionData) => {
//     const newTransaction = {
//       id: Date.now(),
//       date: new Date().toLocaleDateString(),
//       ...transactionData
//     };
//     setTransactions([newTransaction, ...transactions]);
//     resetFlow();
//     alert('Transaction saved successfully!');
//   };

//   const renderCategoryForm = () => {
//     if (!selectedCategory) return null;

//     switch (selectedCategory.id) {
//       case 'gold_sale':
//         return (
//           <GoldSaleForm
//             customer={selectedCustomer}
//             onSave={handleTransactionSave}
//             onCancel={resetFlow}
//           />
//         );
//       case 'gold_loan':
//         return (
//           <GoldLoanForm
//             customer={selectedCustomer}
//             onSave={handleTransactionSave}
//             onCancel={resetFlow}
//           />
//         );
//       default:
//         return (
//           <SimpleTransactionForm
//             customer={selectedCustomer}
//             category={selectedCategory}
//             type={transactionType}
//             onSave={handleTransactionSave}
//             onCancel={resetFlow}
//           />
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-6xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">Transaction Management</h1>
//               <p className="text-gray-600 mt-1">Manage all your business transactions in one place</p>
//             </div>
//             {step !== 'search' && (
//               <button
//                 onClick={resetFlow}
//                 className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200"
//               >
//                 <X size={16} />
//                 Cancel
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Progress Indicator */}
//         <div className="mb-8">
//           <div className="flex items-center justify-center space-x-8">
//             <div className={`flex items-center gap-2 ${step === 'search' ? 'text-blue-600' : step === 'category' || step === 'form' ? 'text-green-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'search' ? 'bg-blue-600 text-white' : step === 'category' || step === 'form' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
//                 <Search size={16} />
//               </div>
//               <span className="font-medium">Customer</span>
//             </div>
//             <div className={`h-0.5 w-16 ${step === 'category' || step === 'form' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
//             <div className={`flex items-center gap-2 ${step === 'category' ? 'text-blue-600' : step === 'form' ? 'text-green-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'category' ? 'bg-blue-600 text-white' : step === 'form' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
//                 <FileText size={16} />
//               </div>
//               <span className="font-medium">Category</span>
//             </div>
//             <div className={`h-0.5 w-16 ${step === 'form' ? 'bg-green-600' : 'bg-gray-300'}`}></div>
//             <div className={`flex items-center gap-2 ${step === 'form' ? 'text-blue-600' : 'text-gray-400'}`}>
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
//                 <Save size={16} />
//               </div>
//               <span className="font-medium">Details</span>
//             </div>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
//           {/* Step 1: Customer Search */}
//           {step === 'search' && !showCustomerForm && (
//             <div>
//               <div className="text-center mb-8">
//                 <h2 className="text-2xl font-semibold text-gray-900 mb-2">Search or Create Customer</h2>
//                 <p className="text-gray-600">Start by finding an existing customer or create a new one</p>
//               </div>
              
//               <div className="max-w-lg mx-auto">
//                 <CustomerSearch 
//                   onCustomerSelect={handleCustomerSelect}
//                   onCreateNew={handleCreateNewCustomer}
//                 />
//               </div>
//             </div>
//           )}

//           {/* Customer Form */}
//           {showCustomerForm && (
//             <CustomerForm
//               onSave={handleCustomerSave}
//               onCancel={() => setShowCustomerForm(false)}
//             />
//           )}

//           {/* Step 2: Category Selection */}
//           {step === 'category' && selectedCustomer && (
//             <div>
//               <div className="mb-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="text-2xl font-semibold text-gray-900">Select Transaction Type</h2>
//                     <p className="text-gray-600 mt-1">Customer: <span className="font-medium">{selectedCustomer.name}</span></p>
//                   </div>
//                 </div>
//               </div>

//               {/* Transaction Type Toggle */}
//               <div className="flex justify-center mb-8">
//                 <div className="bg-gray-100 p-1 rounded-lg">
//                   <button
//                     onClick={() => setTransactionType('income')}
//                     className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
//                       transactionType === 'income'
//                         ? 'bg-white text-green-600 shadow-sm'
//                         : 'text-gray-600 hover:text-green-600'
//                     }`}
//                   >
//                     <TrendingUp size={18} />
//                     Income
//                   </button>
//                   <button
//                     onClick={() => setTransactionType('expense')}
//                     className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
//                       transactionType === 'expense'
//                         ? 'bg-white text-red-600 shadow-sm'
//                         : 'text-gray-600 hover:text-red-600'
//                     }`}
//                   >
//                     <TrendingDown size={18} />
//                     Expense
//                   </button>
//                 </div>
//               </div>

//               {/* Category Grid */}
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {(transactionType === 'income' ? incomeCategories : expenseCategories).map((category) => (
//                   <div
//                     key={category.id}
//                     onClick={() => handleCategorySelect(category)}
//                     className={`p-6 border-2 border-gray-200 rounded-xl cursor-pointer transition-all duration-200 hover:border-${transactionType === 'income' ? 'green' : 'red'}-300 hover:shadow-md group`}
//                   >
//                     <div className="flex items-start gap-4">
//                       <div className={`p-3 rounded-lg ${transactionType === 'income' ? 'bg-green-50' : 'bg-red-50'} group-hover:scale-110 transition-transform duration-200`}>
//                         {category.icon}
//                       </div>
//                       <div className="flex-1">
//                         <h3 className="font-semibold text-gray-900 mb-2">{category.label}</h3>
//                         <p className="text-sm text-gray-600">{category.description}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Step 3: Transaction Form */}
//           {step === 'form' && selectedCustomer && selectedCategory && (
//             <div>
//               <div className="mb-6">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-3">
//                       {selectedCategory.icon}
//                       {selectedCategory.label}
//                     </h2>
//                     <p className="text-gray-600 mt-1">
//                       Customer: <span className="font-medium">{selectedCustomer.name}</span> • 
//                       Type: <span className={`font-medium ${transactionType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
//                         {transactionType === 'income' ? 'Income' : 'Expense'}
//                       </span>
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="max-w-2xl">
//                 {renderCategoryForm()}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Recent Transactions */}
//         {transactions.length > 0 && (
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Transactions</h3>
//             <div className="space-y-3">
//               {transactions.slice(0, 5).map((transaction) => (
//                 <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
//                   <div className="flex items-center gap-4">
//                     <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
//                       {transaction.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
//                     </div>
//                     <div>
//                       <p className="font-medium text-gray-900">{transaction.customer.name}</p>
//                       <p className="text-sm text-gray-600">
//                         {(transactionType === 'income' ? incomeCategories : expenseCategories)
//                           .find(cat => cat.id === transaction.category)?.label}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
//                       {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
//                     </p>
//                     <p className="text-sm text-gray-500">{transaction.date}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Total Income</p>
//                 <p className="text-2xl font-bold text-green-600">
//                   ₹{transactions
//                     .filter(t => t.type === 'income')
//                     .reduce((sum, t) => sum + (t.amount || 0), 0)
//                     .toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-green-100 rounded-lg">
//                 <TrendingUp className="text-green-600" size={24} />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
//                 <p className="text-2xl font-bold text-red-600">
//                   ₹{transactions
//                     .filter(t => t.type === 'expense')
//                     .reduce((sum, t) => sum + (t.amount || 0), 0)
//                     .toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-red-100 rounded-lg">
//                 <TrendingDown className="text-red-600" size={24} />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-600 mb-1">Net Balance</p>
//                 <p className={`text-2xl font-bold ${
//                   transactions.reduce((sum, t) => sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0)), 0) >= 0 
//                     ? 'text-green-600' 
//                     : 'text-red-600'
//                 }`}>
//                   ₹{Math.abs(transactions.reduce((sum, t) => 
//                     sum + (t.type === 'income' ? (t.amount || 0) : -(t.amount || 0)), 0)
//                   ).toLocaleString()}
//                 </p>
//               </div>
//               <div className="p-3 bg-blue-100 rounded-lg">
//                 <DollarSign className="text-blue-600" size={24} />
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TransactionManagement;

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  User,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  FileText,
  Coins,
  Users,
  CreditCard,
  Banknote,
  Gem,
  Calculator,
  Calendar,
  Upload,
  Trash2,
  CheckCircle2
} from 'lucide-react';

// Mock customer data
const mockCustomers = [
  { id: 1, name: 'Rajesh Kumar', phone: '+91 98765 43210', email: 'rajesh@email.com', address: '12 MG Road, Ahmedabad', city: 'Ahmedabad' },
  { id: 2, name: 'Priya Shah', phone: '+91 98765 43211', email: 'priya@email.com', address: '45 CG Road, Ahmedabad', city: 'Ahmedabad' },
  { id: 3, name: 'Amit Patel', phone: '+91 98765 43212', email: 'amit@email.com', address: '78 SG Highway, Ahmedabad', city: 'Ahmedabad' },
  { id: 4, name: 'Kavita Mehta', phone: '+91 98765 43213', email: 'kavita@email.com', address: '23 Vastrapur, Ahmedabad', city: 'Ahmedabad' },
  { id: 5, name: 'Rohit Joshi', phone: '+91 98765 43214', email: 'rohit@email.com', address: '56 Satellite, Ahmedabad', city: 'Ahmedabad' },
  { id: 6, name: 'Neha Thakkar', phone: '+91 98765 43215', email: 'neha@email.com', address: '89 Bopal, Ahmedabad', city: 'Ahmedabad' },
  { id: 7, name: 'Kiran Modi', phone: '+91 98765 43216', email: 'kiran@email.com', address: '34 Prahlad Nagar, Ahmedabad', city: 'Ahmedabad' },
  { id: 8, name: 'Deepa Vyas', phone: '+91 98765 43217', email: 'deepa@email.com', address: '67 Navrangpura, Ahmedabad', city: 'Ahmedabad' }
];

// Transaction categories
const incomeCategories = [
  { id: 'gold-sell', label: 'Gold Sale', icon: Coins, color: 'amber' },
  { id: 'silver-sell', label: 'Silver Sale', icon: Gem, color: 'slate' },
  { id: 'interest-received', label: 'Interest Received', icon: TrendingUp, color: 'green' },
  { id: 'loan-repayment', label: 'Loan Repayment', icon: CreditCard, color: 'blue' },
  { id: 'udhari-received', label: 'Udhari Payment Received', icon: Banknote, color: 'emerald' }
];

const expenseCategories = [
  { id: 'gold-loan', label: 'Gold Loan Given', icon: Coins, color: 'amber' },
  { id: 'udhari-given', label: 'Udhari Given to Customer', icon: Banknote, color: 'red' },
  { id: 'business-loan', label: 'Business Loan Taken', icon: CreditCard, color: 'orange' },
  { id: 'gold-purchase', label: 'Gold Purchase on Credit', icon: Gem, color: 'purple' },
  { id: 'business-expense', label: 'Business Expense', icon: FileText, color: 'gray' }
];

const TransactionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [currentStep, setCurrentStep] = useState('search'); // search, customer, category, form
  const [transactionType, setTransactionType] = useState(''); // income or expense
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Customer form data
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Gujarat',
    pinCode: '',
    idProofType: 'aadhar',
    idProofNumber: ''
  });

  // Transaction form data  
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    // Gold specific fields
    goldWeight: '',
    goldType: '22K',
    goldPurity: '916',
    goldRate: '6500',
    // Loan specific fields
    interestRate: '2.5',
    durationMonths: '6',
    // Photos
    photos: []
  });

  // Navigation helper functions
  const goBack = () => {
    if (currentStep === 'customer') {
      setCurrentStep('search');
      setShowCreateCustomer(false);
    } else if (currentStep === 'category' && transactionType) {
      setTransactionType('');
    } else if (currentStep === 'category' && !transactionType) {
      setCurrentStep('search');
      setSelectedCustomer(null);
    } else if (currentStep === 'form') {
      setCurrentStep('category');
      setSelectedCategory(null);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const [errors, setErrors] = useState({});

  // Search customers
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value.length > 0) {
      const results = mockCustomers.filter(customer =>
        customer.name.toLowerCase().includes(value.toLowerCase()) ||
        customer.phone.includes(value)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setSearchResults([]);
    setCurrentStep('category');
  };

  const handleCreateNewCustomer = () => {
    setShowCreateCustomer(true);
    setCurrentStep('customer');
    setSearchResults([]);
    // Pre-fill with search term if it looks like a name
    if (searchTerm && !searchTerm.includes('+91') && searchTerm.length > 2) {
      const nameParts = searchTerm.trim().split(' ');
      setCustomerData(prev => ({
        ...prev,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      }));
    }
  };

  const handleCustomerDataChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTransactionDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateCustomerForm = () => {
    const newErrors = {};
    if (!customerData.firstName.trim()) newErrors.firstName = 'Required';
    if (!customerData.lastName.trim()) newErrors.lastName = 'Required';
    if (!customerData.phone.trim()) newErrors.phone = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCustomer = () => {
    if (!validateCustomerForm()) return;
    
    const newCustomer = {
      id: Date.now(),
      name: `${customerData.firstName} ${customerData.lastName}`,
      phone: customerData.phone,
      email: customerData.email
    };
    
    setSelectedCustomer(newCustomer);
    setCurrentStep('category');
    setShowCreateCustomer(false);
  };

  const selectTransactionType = (type) => {
    setTransactionType(type);
    setCurrentStep('category');
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setCurrentStep('form');
  };

  const calculateGoldValue = () => {
    const weight = parseFloat(transactionData.goldWeight) || 0;
    const rate = parseFloat(transactionData.goldRate) || 0;
    return weight * rate;
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (transactionData.photos.length < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setTransactionData(prev => ({
            ...prev,
            photos: [...prev.photos, {
              id: Date.now() + Math.random(),
              name: file.name,
              dataUrl: e.target.result
            }]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    setTransactionData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo.id !== photoId)
    }));
  };

  const submitTransaction = () => {
    setShowSuccess(true);
    setTimeout(() => {
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedCustomer(null);
    setShowCreateCustomer(false);
    setCurrentStep('search');
    setTransactionType('');
    setSelectedCategory(null);
    setShowSuccess(false);
    setCustomerData({
      firstName: '', lastName: '', phone: '', email: '',
      address: '', city: '', state: 'Gujarat', pinCode: '',
      idProofType: 'aadhar', idProofNumber: ''
    });
    setTransactionData({
      amount: '', description: '', date: new Date().toISOString().split('T')[0],
      goldWeight: '', goldType: '22K', goldPurity: '916', goldRate: '',
      interestRate: '2.5', durationMonths: '6', photos: []
    });
    setErrors({});
  };

  const renderCustomerSearch = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search customer by name or phone number..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {searchResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {searchResults.map(customer => (
            <div
              key={customer.id}
              onClick={() => selectCustomer(customer)}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                </div>
                <User size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm.length > 0 && searchResults.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <User size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No customer found</h3>
          <p className="text-gray-500 mb-4">No customer found with "{searchTerm}"</p>
          <button
            onClick={handleCreateNewCustomer}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Customer
          </button>
        </div>
      )}
      
      {/* Show recent customers when search is empty */}
      {searchTerm.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h4 className="font-medium text-gray-900">Recent Customers</h4>
          </div>
          {mockCustomers.slice(0, 6).map(customer => (
            <div
              key={customer.id}
              onClick={() => selectCustomer(customer)}
              className="p-4 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{customer.name}</h4>
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                  <p className="text-xs text-gray-400">{customer.address}</p>
                </div>
                <User size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateCustomerForm = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Create New Customer</h3>
        <button
          onClick={handleCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
          <input
            type="text"
            name="firstName"
            value={customerData.firstName}
            onChange={handleCustomerDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter first name"
          />
          {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
          <input
            type="text"
            name="lastName"
            value={customerData.lastName}
            onChange={handleCustomerDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter last name"
          />
          {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel"
            name="phone"
            value={customerData.phone}
            onChange={handleCustomerDataChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+91 98765 43210"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={customerData.email}
            onChange={handleCustomerDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="customer@email.com"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={customerData.address}
            onChange={handleCustomerDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            name="city"
            value={customerData.city}
            onChange={handleCustomerDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
          <input
            type="text"
            name="pinCode"
            value={customerData.pinCode}
            onChange={handleCustomerDataChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter PIN code"
          />
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6">
        <button
          onClick={goBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back to Search
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveCustomer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={16} />
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );

  const renderTransactionTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Transaction for: {selectedCustomer?.name}
        </h3>
        <p className="text-gray-500">Select transaction type</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => selectTransactionType('income')}
          className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 transition-all group"
        >
          <TrendingUp size={32} className="mx-auto text-emerald-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-emerald-900 mb-2">Income</h4>
          <p className="text-sm text-emerald-700">Sales, interest, loan repayments</p>
        </button>

        <button
          onClick={() => selectTransactionType('expense')}
          className="p-6 bg-gradient-to-br from-rose-50 to-rose-100 border-2 border-rose-200 rounded-xl hover:border-rose-300 transition-all group"
        >
          <TrendingDown size={32} className="mx-auto text-rose-600 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-rose-900 mb-2">Expense</h4>
          <p className="text-sm text-rose-700">Loans given, purchases, udhari</p>
        </button>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goBack}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          ← Back to Search
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCategorySelection = () => {
    const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
    const bgColor = transactionType === 'income' ? 'emerald' : 'rose';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select {transactionType === 'income' ? 'Income' : 'Expense'} Category
          </h3>
          <p className="text-gray-500">Choose the type of transaction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => selectCategory(category)}
                className={`p-4 bg-${category.color}-50 border-2 border-${category.color}-200 rounded-xl hover:border-${category.color}-300 transition-all group text-left`}
              >
                <Icon size={24} className={`text-${category.color}-600 mb-3 group-hover:scale-110 transition-transform`} />
                <h4 className={`font-semibold text-${category.color}-900 mb-1`}>{category.label}</h4>
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={goBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Transaction Type
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const renderTransactionForm = () => {
    const isGoldTransaction = selectedCategory?.id.includes('gold');
    const isLoanTransaction = selectedCategory?.id.includes('loan');

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          <button
            onClick={() => setCurrentStep('category')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              name="amount"
              value={transactionData.amount}
              onChange={handleTransactionDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={transactionData.date}
              onChange={handleTransactionDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isGoldTransaction && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Weight (grams)</label>
                <input
                  type="number"
                  step="0.1"
                  name="goldWeight"
                  value={transactionData.goldWeight}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Type</label>
                <select
                  name="goldType"
                  value={transactionData.goldType}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="24K">24K Gold</option>
                  <option value="22K">22K Gold</option>
                  <option value="18K">18K Gold</option>
                  <option value="14K">14K Gold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gold Rate (₹/gram)</label>
                <input
                  type="number"
                  name="goldRate"
                  value={transactionData.goldRate}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Current gold rate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purity</label>
                <input
                  type="text"
                  name="goldPurity"
                  value={transactionData.goldPurity}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="916"
                />
              </div>
            </>
          )}

          {isLoanTransaction && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per month)</label>
                <input
                  type="number"
                  step="0.1"
                  name="interestRate"
                  value={transactionData.interestRate}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="2.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)</label>
                <select
                  name="durationMonths"
                  value={transactionData.durationMonths}
                  onChange={handleTransactionDataChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={transactionData.description}
              onChange={handleTransactionDataChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter transaction details..."
            />
          </div>

          {(isGoldTransaction || isLoanTransaction) && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Optional)</label>
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
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">Max 3 photos</p>
              </div>

              {transactionData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {transactionData.photos.map(photo => (
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
            onClick={goBack}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Category
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={submitTransaction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save size={16} />
              Save Transaction
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessMessage = () => (
    <div className="text-center py-12">
      <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Saved Successfully!</h3>
      <p className="text-gray-500 mb-6">Your transaction has been recorded.</p>
      <button
        onClick={resetForm}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Another Transaction
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2.5 rounded-full mr-3">
                <Plus className="text-blue-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Transaction Management</h2>
            </div>

            {showSuccess && renderSuccessMessage()}
            
            {!showSuccess && (
              <>
                {currentStep === 'search' && renderCustomerSearch()}
                {currentStep === 'customer' && renderCreateCustomerForm()}
                {currentStep === 'category' && !transactionType && renderTransactionTypeSelection()}
                {currentStep === 'category' && transactionType && renderCategorySelection()}
                {currentStep === 'form' && renderTransactionForm()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManagement;