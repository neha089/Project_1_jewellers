import { 
  Download, 
} from 'lucide-react';

const TransactionHeader = () => {
  return (
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Generate Receipt
          </button>
        </div>

  );
};
export default TransactionHeader;