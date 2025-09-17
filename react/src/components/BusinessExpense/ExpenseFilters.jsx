// components/BusinessExpense/ExpenseFilters.js
import React from 'react';
import { Search, Download } from 'lucide-react';
import { CATEGORIES, PAYMENT_STATUS_OPTIONS, DATE_RANGE_OPTIONS, getCategoryIcon } from './constants';

const ExpenseFilters = ({
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterDateRange,
    setFilterDateRange,
    filteredExpenses,
    totalExpenses
}) => {
    return (
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
                            {CATEGORIES.map(category => (
                                <option key={category.name} value={category.name}>
                                    {getCategoryIcon(category.name)} {category.name.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 font-medium"
                        >
                            <option value="All">All Status</option>
                            {PAYMENT_STATUS_OPTIONS.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterDateRange}
                            onChange={(e) => setFilterDateRange(e.target.value)}
                            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-slate-900 font-medium"
                        >
                            {DATE_RANGE_OPTIONS.map(range => (
                                <option key={range.value} value={range.value}>
                                    {range.label}
                                </option>
                            ))}
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

            {filteredExpenses.length !== totalExpenses && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium">
                        Showing {filteredExpenses.length} of {totalExpenses} expenses
                        {searchTerm && ` matching "${searchTerm}"`}
                        {filterCategory !== 'All' && ` in ${filterCategory.replace(/_/g, ' ')}`}
                        {filterStatus !== 'All' && ` with status ${filterStatus}`}
                        {filterDateRange !== 'All' && ` for ${filterDateRange}`}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExpenseFilters;