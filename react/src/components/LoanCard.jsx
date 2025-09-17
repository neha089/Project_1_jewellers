import { Eye, CreditCard, Phone, Percent, Calendar, ChevronRight, FileText } from 'lucide-react';

const LoanCard = ({ loan, type, onView, onPrincipalPayment, onInterestPayment }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown';
    const now = new Date();
    const transactionDate = new Date(date);
    const diffTime = Math.abs(now - transactionDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const customer = loan.customer || {};
  const totalOutstanding = loan.totalOutstanding || 0;
  const interestDue = loan.interestDue || 0;
  const interestRate = loan.transactions?.[0]?.interestRate || loan.interestRate || 0;
  const transactionCount = loan.transactions?.length || 1;
  const latestDate = loan.transactions?.[0]?.takenDate || loan.takenDate;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
            type === 'receivable' 
              ? 'bg-gradient-to-br from-red-500 to-red-600' 
              : 'bg-gradient-to-br from-green-500 to-green-600'
          }`}>
            <span className="text-white text-lg font-bold">{getInitials(customer.name)}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
              {customer.name || 'Unknown Customer'}
            </h3>
            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
              {customer.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={14} />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Percent size={14} />
                <span>{interestRate}% p.m.</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText size={14} />
                <span>{transactionCount} loan{transactionCount !== 1 ? 's' : ''}</span>
              </div>
              {latestDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{getTimeAgo(latestDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className={`text-2xl font-bold ${type === 'receivable' ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(totalOutstanding)}
            </p>
            <p className="text-sm text-slate-500 font-medium">
              {type === 'receivable' ? 'TO COLLECT' : 'TO PAY'}
            </p>
            <p className="text-sm text-purple-600 font-medium">
              Interest Due: {formatCurrency(interestDue)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200"
              title="View Details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={onPrincipalPayment}
              className={`p-3 text-white rounded-xl transition-colors ${
                type === 'receivable' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              title={type === 'receivable' ? 'Receive Principal Payment' : 'Make Principal Payment'}
            >
              <CreditCard size={18} />
            </button>
            <button
              onClick={onInterestPayment}
              className="p-3 text-white bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
              title={type === 'receivable' ? 'Receive Interest Payment' : 'Make Interest Payment'}
            >
              <Percent size={18} />
            </button>
            <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </div>
        </div>
      </div>
      
      {loan.transactions && loan.transactions.length > 0 && loan.transactions[0] && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{loan.transactions[0]?.note || 'No description'}</span>
            <span className="text-slate-500">
              {formatCurrency((loan.transactions[0]?.principalPaise || 0) / 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoanCard;