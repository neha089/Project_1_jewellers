// components/BusinessExpense/ExpenseTable.js
import React from 'react';
import { Search, Edit2, Trash2, Eye, MoreVertical } from 'lucide-react';
import { getCategoryIcon, getStatusBadgeColor } from './constants';

const ExpenseTable = ({ expenses, onEdit, onDelete, loading }) => {
    if (loading) {
        return (
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-slate-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-slate-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-900">Expense Records</h3>
                <p className="text-sm text-slate-600 mt-1">Detailed view of all business expenses</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Date & Reference
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Expense Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Vendor Information
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Financial Details
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Status & Payment
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/50 divide-y divide-slate-100">
                        {expenses.map((expense) => (
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
                                        {expense.reference && (
                                            <div className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
                                                {expense.reference}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{getCategoryIcon(expense.category)}</span>
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                                                {expense.category.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="text-sm font-semibold text-slate-900 max-w-xs">
                                            {expense.title || expense.description}
                                        </div>
                                        {expense.subcategory && (
                                            <div className="text-xs text-slate-500">
                                                {expense.subcategory}
                                            </div>
                                        )}
                                        {expense.description !== expense.title && expense.title && (
                                            <div className="text-xs text-slate-500 max-w-xs truncate">
                                                {expense.description}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-slate-900">{expense.vendor}</div>
                                        {expense.vendorCode && (
                                            <div className="text-xs text-slate-500 font-mono">
                                                Code: {expense.vendorCode}
                                            </div>
                                        )}
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
                                        {expense.paymentMethod && (
                                            <div className="text-xs text-slate-500">
                                                via {expense.paymentMethod.replace(/_/g, ' ')}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onEdit(expense)}
                                            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Expense"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(expense.id)}
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

            {expenses.length === 0 && (
                <div className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-4 bg-slate-100 rounded-2xl">
                            <Search className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">No expenses found</h3>
                            <p className="text-slate-500 mb-4">
                                Try adjusting your search criteria or filters
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseTable;