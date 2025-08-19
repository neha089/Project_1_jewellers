import React, { useState } from 'react';
import { 

  Plus
 
} from 'lucide-react';

const TransactionModal = ({ isOpen, onClose, type, onAddTransaction }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: type === 'income' ? 'Loan Payment' : 'Expense'
  });

  const incomeCategories = ['Loan Payment', 'Gold Purchase', 'Cash Deposit', 'Interest Payment'];
  const expenseCategories = ['Office Rent', 'Utilities', 'Salary', 'Maintenance', 'Expense'];
  
  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = () => {
    if (formData.description && formData.amount) {
      const newTransaction = {
        id: Date.now(),
        type,
        title: `${type === 'income' ? 'Payment Received' : 'Payment Made'}`,
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onAddTransaction(newTransaction);
      setFormData({ description: '', amount: '', category: type === 'income' ? 'Loan Payment' : 'Expense' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Add {type === 'income' ? 'Income' : 'Expense'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="rotate-45" size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer/Description
            </label>
            <input
              type="text"
              placeholder="Enter customer name or description"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
              type === 'income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            Add {type === 'income' ? 'Income' : 'Expense'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;