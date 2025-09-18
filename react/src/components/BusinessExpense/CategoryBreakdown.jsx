// components/BusinessExpense/CategoryBreakdown.js
import React from 'react';
import { getCategoryIcon } from './constants';
import { formatIndianAmount } from './utils';

const CategoryBreakdown = ({ categoryExpenses, expenses, totalAmount }) => {
    return (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Expense Breakdown by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(categoryExpenses)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, amount], index) => {
                        const transactionCount = expenses.filter(e => e.category === category).length;
                        const percentage = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0;
                        
                        return (
                            <div key={`${category}-${index}`} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                                    <div>
                                        <div className="font-semibold text-slate-900 text-sm">
                                            {category.replace(/_/g, ' ')}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {transactionCount} transactions
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{formatIndianAmount(amount)}</div>
                                    <div className="text-xs text-slate-500">
                                        {percentage}%
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
};

export default CategoryBreakdown;
