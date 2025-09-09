import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Eye, 
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  User,
  IndianRupee,
  Filter,
  DollarSign
} from 'lucide-react';

const UdhariTab = ({ udhari = [], customerId, onRefresh }) => {
  const [selectedUdhari, setSelectedUdhari] = useState(null);
  const [showAddUdhari, setShowAddUdhari] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // given or taken
  const [searchTerm, setSearchTerm] = useState('');

  // Filter udhari based on status, type, and search term
  const filteredUdhari = udhari.filter(item => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const typeMatch = typeFilter === 'all' || item.type === typeFilter;
    const searchMatch = searchTerm === '' || 
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.personName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && typeMatch && searchMatch;
  });

  // Calculate summary statistics
  const summary = {
    totalGiven: udhari.filter(u => u.type === 'given').reduce((sum, u) => sum + u.amount, 0),
    totalTaken: udhari.filter(u => u.type === 'taken').reduce((sum, u) => sum + u.amount, 0),
    pendingGiven: udhari.filter(u => u.type === 'given' && u.status === 'pending').reduce((sum, u) => sum + u.amount, 0),
    pendingTaken: udhari.filter(u => u.type === 'taken' && u.status === 'pending').reduce((sum, u) => sum + u.amount, 0),
    paidCount: udhari.filter(u => u.status === 'paid').length,
    pendingCount: udhari.filter(u => u.status === 'pending').length,
    overdueCount: udhari.filter(u => u.status === 'overdue').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'partially_paid': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'given': return 'text-green-600';
      case 'taken': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'given' ? ArrowUpRight : ArrowDownRight;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'overdue': return AlertCircle;
      case 'partially_paid': return Clock;
      default: return XCircle;
    }
  };

  const UdhariCard = ({ item }) => {
    const TypeIcon = getTypeIcon(item.type);
    const StatusIcon = getStatusIcon(item.status);
    const remainingAmount = item.amount - (item.paidAmount || 0);
    
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${item.type === 'given' ? 'bg-green-50' : 'bg-red-50'}`}>
              <TypeIcon size={20} className={getTypeColor(item.type)} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{item.description || 'Udhari Transaction'}</h3>
              <p className="text-sm text-gray-500">
                {item.type === 'given' ? 'Given to' : 'Taken from'} {item.personName || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon size={16} className={getTypeColor(item.type)} />
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
              {item.status === 'partially_paid' ? 'Partial' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="font-semibold text-gray-900">₹{item.amount?.toLocaleString()}</p>
          </div>
          {item.paidAmount > 0 && (
            <div>
              <p className="text-sm text-gray-500">Paid Amount</p>
              <p className="font-semibold text-green-600">₹{item.paidAmount?.toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="font-semibold text-gray-900">₹{remainingAmount?.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            Date: {new Date(item.date).toLocaleDateString()}
          </div>
          {item.dueDate && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {item.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-900">{item.notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              {item.personName || 'Unknown Person'}
            </span>
          </div>
          <button
            onClick={() => setSelectedUdhari(item)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye size={14} />
            View Details
          </button>
        </div>
      </div>
    );
  };

  const UdhariDetailModal = ({ item, onClose }) => {
    if (!item) return null;

    const remainingAmount = item.amount - (item.paidAmount || 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.type === 'given' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {React.createElement(getTypeIcon(item.type), { 
                    size: 20, 
                    className: getTypeColor(item.type) 
                  })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{item.description || 'Udhari Transaction'}</h2>
                  <p className="text-gray-600">
                    {item.type === 'given' ? 'Given to' : 'Taken from'} {item.personName || 'Unknown'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Transaction Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{item.amount?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{(item.paidAmount || 0)?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Remaining</p>
                <p className="text-2xl font-bold text-yellow-600">₹{remainingAmount?.toLocaleString()}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(item.status)}`}>
                  {item.status === 'partially_paid' ? 'Partial' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Payment History */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Notes</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {item.payments?.map((payment, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ₹{payment.amount?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {payment.notes || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <CheckCircle size={16} className="text-green-600" />
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            No payments recorded yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-900">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                  {item.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due Date:</span>
                      <span className="text-gray-900">{new Date(item.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className={`font-medium ${getTypeColor(item.type)}`}>
                      {item.type === 'given' ? 'Given' : 'Taken'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Person:</span>
                    <span className="text-gray-900">{item.personName || 'Unknown'}</span>
                  </div>
                  {item.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-gray-900">{item.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900">
                    {item.notes || item.description || 'No additional notes provided.'}
                  </p>
                </div>
                
                {item.witness && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Witness:</p>
                    <p className="text-sm text-gray-900">{item.witness}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <ArrowUpRight size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Given Udhari</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalGiven.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Pending: ₹{summary.pendingGiven.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <ArrowDownRight size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Taken Udhari</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalTaken.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Pending: ₹{summary.pendingTaken.toLocaleString()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{summary.paidCount}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">All settled</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{summary.pendingCount}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">Overdue: {summary.overdueCount}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex flex-col-3 lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col-3 sm:flex-row gap-4 flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search udhari..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="given">Given</option>
              <option value="taken">Taken</option>
            </select>
          </div>

          <button
            onClick={() => setShowAddUdhari(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Udhari
          </button>
        </div>
      </div>

      {/* Udhari List */}
      <div className="space-y-4">
        {filteredUdhari.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <DollarSign size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Udhari Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'No udhari records match your current filters.' 
                : 'No udhari records available for this customer.'}
            </p>
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setShowAddUdhari(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Udhari
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUdhari.map(item => (
              <UdhariCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Udhari Detail Modal */}
      {selectedUdhari && (
        <UdhariDetailModal 
          item={selectedUdhari} 
          onClose={() => setSelectedUdhari(null)} 
        />
      )}
    </div>
  );
};

export default UdhariTab;