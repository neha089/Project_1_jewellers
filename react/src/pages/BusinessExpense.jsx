import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, Eye, Download, Calendar, DollarSign, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import ApiService from '../services/api' // Import the API service

const BusinessExpense = () => {
    const [expenses, setExpenses] = useState([]);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDateRange, setFilterDateRange] = useState('All');
    const [editingExpense, setEditingExpense] = useState(null);
    const [selectedExpenses, setSelectedExpenses] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [summary, setSummary] = useState({
        totalGrossAmount: 0,
        totalNetAmount: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        totalTaxAmount: 0,
    });

    const [newExpense, setNewExpense] = useState({
        date: new Date().toISOString().split('T')[0],
        category: '',
        subcategory: '',
        description: '',
        amount: '',
        vendor: '',
        vendorCode: '',
        paymentMethod: '',
        status: 'Pending',
        reference: '',
        taxAmount: '',
        netAmount: ''
    });

    const categories = [
        { name: 'RAW_MATERIALS', subcategories: ['Precious Metals', 'Gemstones', 'Diamonds', 'Silver', 'Platinum'] },
        { name: 'EQUIPMENT', subcategories: ['Manufacturing Tools', 'Display Equipment', 'Security Systems', 'Computers & Software'] },
        { name: 'UTILITIES', subcategories: ['Power & Electricity', 'Water & Gas', 'Internet & Phone', 'Waste Management'] },
        { name: 'MARKETING', subcategories: ['Digital Advertising', 'Print Media', 'Events & Shows', 'Brand Development'] },
        { name: 'RENT_LEASE', subcategories: ['Shop Rent', 'Warehouse Rent', 'Equipment Lease', 'Vehicle Lease'] },
        { name: 'INSURANCE', subcategories: ['Business Insurance', 'Inventory Insurance', 'Liability Insurance', 'Employee Insurance'] },
        { name: 'PROFESSIONAL_SERVICES', subcategories: ['Legal Services', 'Accounting', 'Consultancy', 'Certification'] },
        { name: 'TRANSPORTATION', subcategories: ['Shipping & Courier', 'Vehicle Fuel', 'Logistics', 'Import/Export'] },
        { name: 'PACKAGING', subcategories: ['Gift Boxes', 'Protective Packaging', 'Branding Materials', 'Labels'] },
        { name: 'MAINTENANCE', subcategories: ['Equipment Repair', 'Shop Maintenance', 'Cleaning Services', 'Security Services'] }
    ];

    const paymentMethods = [
        'Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'RTGS/NEFT',
        'UPI', 'Check', 'Auto Pay', 'Letter of Credit', 'Trade Credit'
    ];

    // Fetch expenses and dashboard summary
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await ApiService.getExpenses({
                    page: 1,
                    limit: 100,
                    search: searchTerm,
                    category: filterCategory !== 'All' ? filterCategory : undefined,
                    paymentStatus: filterStatus !== 'All' ? filterStatus : undefined,
                    startDate: filterDateRange === 'Today' ? new Date().toISOString().split('T')[0] :
                              filterDateRange === 'This Week' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] :
                              filterDateRange === 'This Month' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] :
                              filterDateRange === 'This Quarter' ? new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1).toISOString().split('T')[0] :
                              undefined,
                    endDate: filterDateRange !== 'All' ? new Date().toISOString().split('T')[0] : undefined,
                });
                setExpenses(response.data.map(exp => ({
                    id: exp.id,
                    date: exp.expenseDate.split('T')[0],
                    category: exp.category,
                    subcategory: exp.subcategory,
                    description: exp.description,
                    amount: exp.grossAmount,
                    vendor: exp.vendor.name,
                    vendorCode: exp.vendor.code,
                    paymentMethod: exp.paymentMethod,
                    status: exp.paymentStatus,
                    receipt: exp.metadata.receipt,
                    reference: exp.referenceNumber,
                    taxAmount: exp.taxDetails?.totalTax,
                    netAmount: exp.netAmount
                })));
                setSummary(response.summary);
            } catch (error) {
                console.error('Error fetching expenses:', error);
            }
        };

        const fetchDashboard = async () => {
            try {
                const response = await ApiService.getExpenseDashboard();
                setSummary(response.data.overview);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            }
        };

        fetchExpenses();
        fetchDashboard();
    }, [searchTerm, filterCategory, filterStatus, filterDateRange]);

    // Calculate category-wise expenses
    const categoryExpenses = categories.reduce((acc, category) => {
        const categoryTotal = expenses
            .filter(exp => exp.category === category.name)
            .reduce((sum, expense) => sum + expense.amount, 0);
        if (categoryTotal > 0) {
            acc[category.name] = categoryTotal;
        }
        return acc;
    }, {});

    // Filter expenses (client-side fallback)
    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;
        
        let matchesDate = true;
        if (filterDateRange !== 'All') {
            const expenseDate = new Date(expense.date);
            const today = new Date();
            switch (filterDateRange) {
                case 'Today':
                    matchesDate = expenseDate.toDateString() === today.toDateString();
                    break;
                case 'This Week':
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = expenseDate >= weekAgo;
                    break;
                case 'This Month':
                    matchesDate = expenseDate.getMonth() === today.getMonth() && 
                                expenseDate.getFullYear() === today.getFullYear();
                    break;
                case 'This Quarter':
                    const quarter = Math.floor(today.getMonth() / 3);
                    const expenseQuarter = Math.floor(expenseDate.getMonth() / 3);
                    matchesDate = expenseQuarter === quarter && 
                                expenseDate.getFullYear() === today.getFullYear();
                    break;
            }
        }
        
        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });

    const handleAddExpense = async () => {
        if (newExpense.description && newExpense.amount && newExpense.category && newExpense.vendor && newExpense.paymentMethod) {
            try {
                const expenseData = {
                    category: newExpense.category,
                    subcategory: newExpense.subcategory,
                    title: newExpense.description,
                    description: newExpense.description,
                    vendor: {
                        name: newExpense.vendor,
                        code: newExpense.vendorCode
                    },
                    grossAmount: parseFloat(newExpense.amount),
                    taxDetails: {
                        totalTax: parseFloat(newExpense.taxAmount) || 0
                    },
                    paymentMethod: newExpense.paymentMethod,
                    expenseDate: newExpense.date,
                    referenceNumber: newExpense.reference,
                    paymentStatus: newExpense.status
                };
                const response = await ApiService.createExpense(expenseData);
                setExpenses([{
                    id: response.data._id,
                    date: response.data.expenseDate.split('T')[0],
                    category: response.data.category,
                    subcategory: response.data.subcategory,
                    description: response.data.description,
                    amount: response.data.grossAmount,
                    vendor: response.data.vendor.name,
                    vendorCode: response.data.vendor.code,
                    paymentMethod: response.data.paymentMethod,
                    status: response.data.paymentStatus,
                    receipt: response.data.metadata.receipt,
                    reference: response.data.referenceNumber,
                    taxAmount: response.data.taxDetails.totalTax,
                    netAmount: response.data.netAmount
                }, ...expenses]);
                resetForm();
            } catch (error) {
                console.error('Error adding expense:', error);
                alert('Failed to add expense: ' + error.message);
            }
        } else {
            alert('Please fill all required fields');
        }
    };

    const resetForm = () => {
        setNewExpense({
            date: new Date().toISOString().split('T')[0],
            category: '',
            subcategory: '',
            description: '',
            amount: '',
            vendor: '',
            vendorCode: '',
            paymentMethod: '',
            status: 'Pending',
            reference: '',
            taxAmount: '',
            netAmount: ''
        });
        setShowAddExpense(false);
        setEditingExpense(null);
    };

    const handleEditExpense = (expense) => {
        if (!expense.id) {
            console.error('Error: Expense ID is undefined', expense);
            alert('Cannot edit expense: Invalid expense ID');
            return;
        }
        setEditingExpense(expense);
        setNewExpense({
            id:expense.id,
            date: expense.date,
            category: expense.category,
            subcategory: expense.subcategory || '',
            description: expense.description,
            amount: expense.amount.toString(),
            vendor: expense.vendor,
            vendorCode: expense.vendorCode || '',
            paymentMethod: expense.paymentMethod,
            status: expense.status,
            reference: expense.reference || '',
            taxAmount: (expense.taxAmount || 0).toString(),
            netAmount: (expense.netAmount || expense.amount).toString()
        });
        setShowAddExpense(true);
    };

    const handleUpdateExpense = async () => {
        console.log(editingExpense);
        if (!editingExpense || !editingExpense.id) {
            console.error('Error: Editing expense ID is undefined', editingExpense);
            alert('Cannot update expense: Invalid expense ID');
            return;
        }
        try {
            const expenseData = {
                title: newExpense.description,
                description: newExpense.description,
                vendor: {
                    name: newExpense.vendor,
                    code: newExpense.vendorCode
                },
                grossAmount: parseFloat(newExpense.amount),
                taxDetails: {
                    totalTax: parseFloat(newExpense.taxAmount) || 0
                },
                expenseDate: newExpense.date,
                referenceNumber: newExpense.reference,
                paymentMethod: newExpense.paymentMethod,
                paymentStatus: newExpense.status
            };
            const response = await ApiService.updateExpense(editingExpense.id, expenseData);
            setExpenses(expenses.map(exp => 
                exp.id === editingExpense.id 
                    ? {
                        ...exp,
                        date: response.data.expenseDate.split('T')[0],
                        category: response.data.category,
                        subcategory: response.data.subcategory,
                        description: response.data.description,
                        amount: response.data.grossAmount,
                        vendor: response.data.vendor.name,
                        vendorCode: response.data.vendor.code,
                        paymentMethod: response.data.paymentMethod,
                        status: response.data.paymentStatus,
                        receipt: response.data.metadata.receipt,
                        reference: response.data.referenceNumber,
                        taxAmount: response.data.taxDetails.totalTax,
                        netAmount: response.data.netAmount
                    }
                    : exp
            ));
            resetForm();
        } catch (error) {
            console.error('Error updating expense:', error);
            alert('Failed to update expense: ' + error.message);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!id) {
            console.error('Error: Expense ID is undefined for deletion');
            alert('Cannot delete expense: Invalid expense ID');
            return;
        }
        if (confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            try {
                await ApiService.deleteExpense(id);
                setExpenses(expenses.filter(exp => exp.id !== id));
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense: ' + error.message);
            }
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'OVERDUE': return 'bg-red-50 text-red-700 border-red-200';
            case 'CANCELLED': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Raw Materials': return '💎';
            case 'Equipment': return '🔧';
            case 'Utilities': return '⚡';
            case 'Marketing': return '📢';
            case 'Rent & Lease': return '🏢';
            case 'Insurance': return '🛡️';
            case 'Professional Services': return '👔';
            case 'Transportation': return '🚚';
            case 'Packaging': return '📦';
            case 'Maintenance': return '🔨';
            default: return '📋';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <div className="max-w-[1400px] mx-auto p-6 space-y-8">
                <div className="gap-6">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">Total Expenses (YTD)</p>
                            <p className="text-2xl font-bold text-slate-900">₹{summary.totalGrossAmount?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="h-12 w-px bg-slate-200"></div>
                        <button
                            onClick={() => setShowAddExpense(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Add Expense
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Gross Total</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-slate-900">₹{summary.totalGrossAmount?.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-slate-600">
                                Net: ₹{summary.totalNetAmount?.toLocaleString('en-IN')} • Tax: ₹{summary.totalTaxAmount?.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Paid Amount</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-emerald-600">₹{summary.totalPaidAmount?.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-slate-600">
                                {summary.paidExpenses} transactions completed
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-white">
                                <TrendingDown className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Payment</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-amber-600">₹{summary.totalPendingAmount?.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-slate-600">
                                {summary.pendingExpenses} transactions awaiting
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">This Month</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-purple-600">₹{(summary.thisMonth?.totalAmount ?? 0)?.toLocaleString('en-IN')}</p>
                            <p className="text-sm text-slate-600">
                                {(summary.thisMonth?.totalExpenses ?? 0)} transactions
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                    <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <input
                                    type="text"
                                    placeholder="Search expenses, vendors, references..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-12 pr-4 py-3 w-full border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 placeholder-slate-400 font-medium"
                                />
                            </div>

                            <div className="flex gap-3">
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 font-medium min-w-[160px]"
                                >
                                    <option value="All">All Categories</option>
                                    {categories.map(category => (
                                        <option key={category.name} value={category.name}>
                                            {getCategoryIcon(category.name)} {category.name}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 font-medium"
                                >
                                    <option value="All">All Status</option>
                                    <option value="PAID">✅ Paid</option>
                                    <option value="PENDING">⏳ Pending</option>
                                    <option value="OVERDUE">⚠️ Overdue</option>
                                </select>

                                <select
                                    value={filterDateRange}
                                    onChange={(e) => setFilterDateRange(e.target.value)}
                                    className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 font-medium"
                                >
                                    <option value="All">All Time</option>
                                    <option value="Today">Today</option>
                                    <option value="This Week">This Week</option>
                                    <option value="This Month">This Month</option>
                                    <option value="This Quarter">This Quarter</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold">
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {filteredExpenses.length !== expenses.length && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">
                                Showing {filteredExpenses.length} of {expenses.length} expenses
                                {searchTerm && ` matching "${searchTerm}"`}
                                {filterCategory !== 'All' && ` in ${filterCategory}`}
                                {filterStatus !== 'All' && ` with status ${filterStatus}`}
                                {filterDateRange !== 'All' && ` for ${filterDateRange}`}
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                        <h3 className="text-lg font-semibold text-slate-900">Expense Records</h3>
                        <p className="text-sm text-slate-600 mt-1">Detailed view of all business expenses</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date & Reference</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Expense Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Vendor Information</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Financial Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status & Payment</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white/50 divide-y divide-slate-100">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold text-slate-900">
                                                    {new Date(expense.date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                                <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                                    {expense.reference}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                                                        {expense.category}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900 max-w-xs">
                                                    {expense.description}
                                                </div>
                                                {expense.subcategory && (
                                                    <div className="text-xs text-slate-500">
                                                        {expense.subcategory}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-sm font-semibold text-slate-900">{expense.vendor}</div>
                                                <div className="text-xs text-slate-500 font-mono">
                                                    Code: {expense.vendorCode}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-1">
                                                <div className="text-base font-bold text-slate-900">
                                                    ₹{expense.amount?.toLocaleString('en-IN')}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    Net: ₹{(expense.netAmount || expense.amount)?.toLocaleString('en-IN')}
                                                </div>
                                                {expense.taxAmount > 0 && (
                                                    <div className="text-xs text-slate-500">
                                                        Tax: ₹{expense.taxAmount?.toLocaleString('en-IN')}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="space-y-2">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(expense.status)}`}>
                                                    {expense.status}
                                                </span>
                                                <div className="text-xs text-slate-500">
                                                    via {expense.paymentMethod}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditExpense(expense)}
                                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Expense"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExpense(expense.id)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete Expense"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                {expense.receipt && (
                                                    <button
                                                        className="p-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="View Receipt"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                )}
                                                <button
                                                    className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="More Options"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredExpenses.length === 0 && (
                        <div className="text-center py-16">
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-4 bg-slate-100 rounded-2xl">
                                    <Search className="h-8 w-8 text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses found</h3>
                                    <p className="text-slate-500 mb-4">
                                        {searchTerm || filterCategory !== 'All' || filterStatus !== 'All' 
                                            ? 'Try adjusting your search criteria or filters'
                                            : 'Start by adding your first business expense'
                                        }
                                    </p>
                                    {!searchTerm && filterCategory === 'All' && filterStatus === 'All' && (
                                        <button
                                            onClick={() => setShowAddExpense(true)}
                                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-colors"
                                        >
                                            Add Your First Expense
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {Object.keys(categoryExpenses).length > 0 && (
                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown by Category</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(categoryExpenses)
                                .sort(([,a], [,b]) => b - a)
                                .map(([category, amount], index) => (
                                <div key={`${category}-${index}`} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                                        <div>
                                            <div className="font-semibold text-slate-900 text-sm">{category}</div>
                                            <div className="text-xs text-slate-500">
                                                {expenses.filter(e => e.category === category).length} transactions
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">₹{amount?.toLocaleString('en-IN')}</div>
                                        <div className="text-xs text-slate-500">
                                            {((amount / summary.totalGrossAmount) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {showAddExpense && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
                                            {editingExpense ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">
                                                {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                                            </h2>
                                            <p className="text-sm text-slate-600">
                                                {editingExpense ? 'Update expense details' : 'Enter comprehensive expense information'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={resetForm}
                                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Basic Information</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Transaction Date *</label>
                                            <input
                                                type="date"
                                                value={newExpense.date}
                                                onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Reference Number</label>
                                            <input
                                                type="text"
                                                value={newExpense.reference}
                                                onChange={(e) => setNewExpense({...newExpense, reference: e.target.value})}
                                                placeholder="PO-2024-001, INV-001, etc."
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                                            <select
                                                value={newExpense.category}
                                                onChange={(e) => {
                                                    setNewExpense({...newExpense, category: e.target.value, subcategory: ''});
                                                }}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            >
                                                <option value="">Select Category</option>
                                                {categories.map(category => (
                                                    <option key={category.name} value={category.name}>
                                                        {getCategoryIcon(category.name)} {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Subcategory</label>
                                            <select
                                                value={newExpense.subcategory}
                                                onChange={(e) => setNewExpense({...newExpense, subcategory: e.target.value})}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                disabled={!newExpense.category}
                                            >
                                                <option value="">Select Subcategory</option>
                                                {newExpense.category && 
                                                    categories.find(c => c.name === newExpense.category)?.subcategories.map(sub => (
                                                        <option key={sub} value={sub}>{sub}</option>
                                                    ))
                                                }
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Expense Description *</label>
                                        <textarea
                                            value={newExpense.description}
                                            onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                                            placeholder="Detailed description of the expense..."
                                            rows="3"
                                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 resize-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Financial Details</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Gross Amount (₹) *</label>
                                            <input
                                                type="number"
                                                value={newExpense.amount}
                                                onChange={(e) => {
                                                    const amount = e.target.value;
                                                    setNewExpense({
                                                        ...newExpense, 
                                                        amount,
                                                        netAmount: newExpense.taxAmount ? 
                                                            (parseFloat(amount) - parseFloat(newExpense.taxAmount || 0)).toString() : 
                                                            amount
                                                    });
                                                }}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={newExpense.taxAmount}
                                                onChange={(e) => {
                                                    const taxAmount = e.target.value;
                                                    setNewExpense({
                                                        ...newExpense, 
                                                        taxAmount,
                                                        netAmount: newExpense.amount ? 
                                                            (parseFloat(newExpense.amount) - parseFloat(taxAmount || 0)).toString() : 
                                                            ''
                                                    });
                                                }}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Net Amount (₹)</label>
                                            <input
                                                type="number"
                                                value={newExpense.netAmount}
                                                onChange={(e) => setNewExpense({...newExpense, netAmount: e.target.value})}
                                                placeholder="0.00"
                                                step="0.01"
                                                min="0"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">Vendor & Payment Information</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor Name *</label>
                                            <input
                                                type="text"
                                                value={newExpense.vendor}
                                                onChange={(e) => setNewExpense({...newExpense, vendor: e.target.value})}
                                                placeholder="Enter vendor/supplier name"
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Vendor Code</label>
                                            <input
                                                type="text"
                                                value={newExpense.vendorCode}
                                                onChange={(e) => setNewExpense({...newExpense, vendorCode: e.target.value})}
                                                placeholder="VND001, SUP001, etc."
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Method *</label>
                                            <select
                                                value={newExpense.paymentMethod}
                                                onChange={(e) => setNewExpense({...newExpense, paymentMethod: e.target.value})}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            >
                                                <option value="">Select Payment Method</option>
                                                {paymentMethods.map(method => (
                                                    <option key={method} value={method}>{method}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status *</label>
                                            <select
                                                value={newExpense.status}
                                                onChange={(e) => setNewExpense({...newExpense, status: e.target.value})}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                                                required
                                            >
                                                <option value="PENDING">⏳ Pending</option>
                                                <option value="PAID">✅ Paid</option>
                                                <option value="OVERDUE">⚠️ Overdue</option>
                                                <option value="CANCELLED">❌ Cancelled</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 rounded-b-2xl">
                                <div className="flex gap-3">
                                    <button
                                        onClick={resetForm}
                                        className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-semibold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold shadow-lg"
                                    >
                                        {editingExpense ? 'Update Expense' : 'Add Expense'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessExpense;