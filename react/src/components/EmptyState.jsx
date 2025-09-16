import React from 'react';
import { Package, Plus, TrendingUp, TrendingDown } from 'lucide-react';

const EmptyState = ({ onCreateTransaction, metal = 'Silver' }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
        </div>
        
        {/* Title and Description */}
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No transactions found
        </h3>
        <p className="text-gray-500 mb-8">
          Start by creating your first {metal.toLowerCase()} transaction. Track your buying and selling activities to manage your {metal.toLowerCase()} business effectively.
        </p>

        {/* Action Button */}
        <button
          onClick={onCreateTransaction}
          className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create First Transaction
        </button>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 text-left">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Track Purchases</h4>
              <p className="text-sm text-gray-600 mt-1">
                Record {metal.toLowerCase()} purchases from suppliers with detailed item information
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Manage Sales</h4>
              <p className="text-sm text-gray-600 mt-1">
                Track sales to customers and monitor your profit margins
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;