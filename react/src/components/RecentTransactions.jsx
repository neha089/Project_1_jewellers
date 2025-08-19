import React from 'react';
import TransactionItem from './TransactionItem';
const RecentTransactions = ({ transactions, onEdit, onDelete }) => {
  return (
    <div className="bg-white mx-6 rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
          <p className="text-sm text-gray-500">Today, August 17, 2025</p>
        </div>
      </div>
      
      <div className="p-6">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
};
export default RecentTransactions;