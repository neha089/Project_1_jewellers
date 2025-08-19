import { 
  Edit2, 
  Trash2, 
  ArrowUp,
  ArrowDown
} from 'lucide-react';

const TransactionItem = ({ transaction, onEdit, onDelete }) => {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Loan Payment': return 'bg-yellow-100 text-yellow-800';
      case 'Gold Purchase': return 'bg-purple-100 text-purple-800';
      case 'Cash Deposit': return 'bg-green-100 text-green-800';
      case 'Expense': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {transaction.type === 'income' ? (
            <ArrowDown className="text-white" size={16} />
          ) : (
            <ArrowUp className="text-white" size={16} />
          )}
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{transaction.title}</h4>
          <div className="flex items-center space-x-3 mt-1">
            <p className="text-sm text-gray-600">{transaction.description}</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
              {transaction.category}
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <p className={`text-lg font-semibold ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">{transaction.time}</p>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(transaction)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(transaction.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default TransactionItem;