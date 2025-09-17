// components/BusinessExpense/ExpenseStats.js
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const ExpenseStats = ({ summary }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
                    <p className="text-2xl font-bold text-slate-900">
                        ₹{summary.totalGrossAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-sm text-slate-600">
                        Net: ₹{summary.totalNetAmount?.toLocaleString('en-IN') || '0'} • 
                        Tax: ₹{summary.totalTaxAmount?.toLocaleString('en-IN') || '0'}
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
                    <p className="text-2xl font-bold text-emerald-600">
                        ₹{summary.totalPaidAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-sm text-slate-600">
                        {summary.paidExpenses || 0} transactions completed
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
                    <p className="text-2xl font-bold text-amber-600">
                        ₹{summary.totalPendingAmount?.toLocaleString('en-IN') || '0'}
                    </p>
                    <p className="text-sm text-slate-600">
                        {summary.pendingExpenses || 0} transactions awaiting
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
                    <p className="text-2xl font-bold text-purple-600">
                        ₹{(summary.thisMonth?.totalAmount ?? 0)?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-sm text-slate-600">
                        {(summary.thisMonth?.totalExpenses ?? 0)} transactions
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpenseStats;