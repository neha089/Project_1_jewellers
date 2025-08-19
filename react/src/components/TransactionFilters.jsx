import { 
  Search, 
  ChevronDown,

} from 'lucide-react';

const TransactionFilters = () => {
  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between space-x-4">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8">
              <option>All Categories</option>
              <option>Loan Payment</option>
              <option>Gold Purchase</option>
              <option>Cash Deposit</option>
              <option>Expense</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          </div>
          
          <div className="relative">
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm appearance-none pr-8">
              <option>All Types</option>
              <option>Income</option>
              <option>Expense</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
          </div>
          
          <input
            type="date"
            defaultValue="2025-08-12"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            defaultValue="2025-08-19"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>
    </div>
  );
};
export default TransactionFilters;