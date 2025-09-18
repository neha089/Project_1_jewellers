import React from 'react';
import { DollarSign, Percent, FileText } from 'lucide-react';

const LoanCard = ({ loan, type, onView, onPrincipalPayment, onInterestPayment }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const customer = loan.customer || {};
  const isReceivable = type === 'receivable';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
            isReceivable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
            <p className="text-sm text-slate-600">{customer.phone}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total Outstanding</p>
          <p className={`text-xl font-bold ${isReceivable ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(loan.totalOutstanding)}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-slate-600">Loans</p>
          <p className="text-sm text-slate-900">{loan.loans.length}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Interest Due</p>
          <p className="text-sm text-purple-600">{formatCurrency(loan.interestDue)}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onView}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText size={16} className="inline mr-2" />
          View
        </button>
        <button
          onClick={onPrincipalPayment}
          className={`flex-1 px-4 py-2 text-white rounded-lg ${
            isReceivable ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          <DollarSign size={16} className="inline mr-2" />
          {isReceivable ? 'Receive' : 'Pay'} Principal
        </button>
        <button
          onClick={onInterestPayment}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Percent size={16} className="inline mr-2" />
          Interest
        </button>
      </div>
    </div>
  );
};

export default LoanCard;