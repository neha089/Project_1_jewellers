// components/BusinessExpense/BusinessExpense.js
import React, { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import ApiService from '../services/api';

// Import sub-components
import ExpenseStats from '../components/BusinessExpense/ExpenseStats';
import ExpenseFilters from '../components/BusinessExpense/ExpenseFilters';
import ExpenseTable from '../components/BusinessExpense/ExpenseTable';
import ExpenseModal from '../components/BusinessExpense/ExpenseModal';
import CategoryBreakdown from '../components/BusinessExpense/CategoryBreakdown';
import { CATEGORIES, PAYMENT_METHODS } from '../components/BusinessExpense/constants';

const BusinessExpense = () => {
    const [expenses, setExpenses] = useState([]);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterDateRange, setFilterDateRange] = useState('All');
    const [editingExpense, setEditingExpense] = useState(null);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({
        totalGrossAmount: 0,
        totalNetAmount: 0,
        totalPaidAmount: 0,
        totalPendingAmount: 0,
        totalTaxAmount: 0,
        paidExpenses: 0,
        pendingExpenses: 0,
        thisMonth: { totalAmount: 0, totalExpenses: 0 }
    });

    // Fetch expenses and dashboard summary
    useEffect(() => {
        fetchExpenses();
        fetchDashboard();
    }, [searchTerm, filterCategory, filterStatus, filterDateRange]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const response = await ApiService.getExpenses({
                page: 1,
                limit: 100,
                search: searchTerm,
                category: filterCategory !== 'All' ? filterCategory : undefined,
                paymentStatus: filterStatus !== 'All' ? filterStatus : undefined,
                startDate: getStartDate(),
                endDate: filterDateRange !== 'All' ? new Date().toISOString().split('T')[0] : undefined,
            });
            
            const transformedExpenses = response.data.map(exp => ({
                id: exp._id || exp.id,
                date: exp.expenseDate.split('T')[0],
                category: exp.category,
                subcategory: exp.subcategory || '',
                description: exp.description,
                title: exp.title || exp.description,
                amount: exp.grossAmount,
                vendor: exp.vendor.name,
                vendorCode: exp.vendor.code || '',
                paymentMethod: exp.paymentMethod || '',
                status: exp.paymentStatus,
                receipt: exp.metadata?.receipt,
                reference: exp.referenceNumber,
                taxAmount: exp.taxDetails?.totalTax || 0,
                netAmount: exp.netAmount,
                paidAmount: exp.paidAmount || 0,
                pendingAmount: exp.pendingAmount || 0,
                dueDate: exp.dueDate,
                metadata: exp.metadata || {}
            }));
            
            setExpenses(transformedExpenses);
            setSummary(response.summary || summary);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
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

    const getStartDate = () => {
        const today = new Date();
        switch (filterDateRange) {
            case 'Today':
                return today.toISOString().split('T')[0];
            case 'This Week':
                return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            case 'This Month':
                return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            case 'This Quarter':
                return new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
            default:
                return undefined;
        }
    };

    const handleAddExpense = async (expenseData) => {
        try {
            const response = await ApiService.createExpense(expenseData);
            const newExpense = {
                id: response.data._id,
                date: response.data.expenseDate.split('T')[0],
                category: response.data.category,
                subcategory: response.data.subcategory || '',
                description: response.data.description,
                title: response.data.title,
                amount: response.data.grossAmount,
                vendor: response.data.vendor.name,
                vendorCode: response.data.vendor.code || '',
                paymentMethod: response.data.paymentMethod || '',
                status: response.data.paymentStatus,
                receipt: response.data.metadata?.receipt,
                reference: response.data.referenceNumber,
                taxAmount: response.data.taxDetails?.totalTax || 0,
                netAmount: response.data.netAmount,
                paidAmount: response.data.paidAmount || 0,
                pendingAmount: response.data.pendingAmount || 0,
                metadata: response.data.metadata || {}
            };
            
            setExpenses([newExpense, ...expenses]);
            setShowAddExpense(false);
            await fetchDashboard(); // Refresh summary
            return { success: true };
        } catch (error) {
            console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
    };

    const handleEditExpense = (expense) => {
        if (!expense.id) {
            console.error('Error: Expense ID is undefined', expense);
            alert('Cannot edit expense: Invalid expense ID');
            return;
        }
        setEditingExpense(expense);
        setShowAddExpense(true);
    };

   // In BusinessExpense.jsx - Make sure this function signature is correct
const handleUpdateExpense = async (expenseId, updatedExpenseData) => {
    if (!expenseId) {
        return { success: false, error: 'Expense ID is required' };
    }

    try {
        console.log('=== UPDATE DEBUG ===');
        console.log('Expense ID:', expenseId);
        console.log('Updated data being sent:', updatedExpenseData);
        
        // Make sure you're passing the updatedExpenseData, NOT the original editingExpense
        const result = await apiService.updateExpense(expenseId, updatedExpenseData);
        
        if (result.success) {
            await fetchExpenses(); // Refresh the list
            setShowModal(false);
            setIsEdit(false);
            setEditingExpense(null);
            return { success: true };
        } else {
            return { success: false, error: result.error || result.message };
        }
    } catch (error) {
        console.error('Error updating expense:', error);
        return { success: false, error: error.message };
    }
};
    const handleDeleteExpense = async (id) => {
        if (!id) {
            console.error('Error: Expense ID is undefined for deletion');
            alert('Cannot delete expense: Invalid expense ID');
            return;
        }
        
        if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
            try {
                await ApiService.deleteExpense(id);
                setExpenses(expenses.filter(exp => exp.id !== id));
                await fetchDashboard(); // Refresh summary
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense: ' + error.message);
            }
        }
    };

    const handleCloseModal = () => {
        setShowAddExpense(false);
        setEditingExpense(null);
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (expense.vendorCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (expense.reference || '').toLowerCase().includes(searchTerm.toLowerCase());
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

    // Calculate category-wise expenses
    const categoryExpenses = CATEGORIES.reduce((acc, category) => {
        const categoryTotal = expenses
            .filter(exp => exp.category === category.name)
            .reduce((sum, expense) => sum + expense.amount, 0);
        if (categoryTotal > 0) {
            acc[category.name] = categoryTotal;
        }
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
            <div className="max-w-[1400px] mx-auto p-6 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-sm text-slate-500 font-medium">Total Expenses (YTD)</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ₹{summary.totalGrossAmount?.toLocaleString('en-IN')}
                            </p>
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

                {/* Stats */}
                <ExpenseStats summary={summary} />

                {/* Filters */}
                <ExpenseFilters
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterCategory={filterCategory}
                    setFilterCategory={setFilterCategory}
                    filterStatus={filterStatus}
                    setFilterStatus={setFilterStatus}
                    filterDateRange={filterDateRange}
                    setFilterDateRange={setFilterDateRange}
                    filteredExpenses={filteredExpenses}
                    totalExpenses={expenses.length}
                />

                {/* Expense Table */}
                <ExpenseTable
                    expenses={filteredExpenses}
                    onEdit={handleEditExpense}
                    onDelete={handleDeleteExpense}
                    loading={loading}
                />

                {/* Category Breakdown */}
                {Object.keys(categoryExpenses).length > 0 && (
                    <CategoryBreakdown
                        categoryExpenses={categoryExpenses}
                        expenses={expenses}
                        totalAmount={summary.totalGrossAmount}
                    />
                )}

                {/* Add/Edit Expense Modal */}
                {showAddExpense && (
                    <ExpenseModal
                        isEdit={!!editingExpense}
                        editingExpense={editingExpense}
                        onAdd={handleAddExpense}
                        onUpdate={handleUpdateExpense}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    );
};

export default BusinessExpense;