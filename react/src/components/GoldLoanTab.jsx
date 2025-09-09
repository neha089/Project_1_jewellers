import { useState } from 'react';
import { Plus, Calendar, IndianRupee, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';

const GoldLoanTab = ({ goldLoans = [], customerId, onRefresh }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [viewDetails, setViewDetails] = useState(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    interestRate: '',
    goldWeight: '',
    goldPurity: '',
    startDate: '',
    dueDate: '',
    description: '',
    type: 'given' // given (we give loan) or taken (we take loan)
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    type: 'interest', // interest or principal
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add API call here
    console.log('Adding gold loan:', formData);
    setShowAddForm(false);
    setFormData({
      amount: '',
      interestRate: '',
      goldWeight: '',
      goldPurity: '',
      startDate: '',
      dueDate: '',
      description: '',
      type: 'given'
    });
    onRefresh();
  };

  const handlePayment = (e) => {
    e.preventDefault();
    // Add API call here
    console.log('Processing payment:', paymentData, 'for loan:', selectedLoan);
    setShowPaymentModal(false);
    setPaymentData({
      amount: '',
      type: 'interest',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
    onRefresh();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const calculateTotalInterest = (loan) => {
    const startDate = new Date(loan.startDate);
    const currentDate = new Date();
    const monthsDiff = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - startDate.getMonth());
    return (loan.amount * loan.interestRate / 100) * monthsDiff;
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gold Loans</h2>
          <p className="text-gray-600">Manage all gold loan transactions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          <Plus size={16} />
          Add Gold Loan
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">
                {goldLoans.filter(loan => loan.status === 'active').length}
              </p>
            </div>
            <TrendingUp className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount Given</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(goldLoans.filter(l => l.type === 'given' || !l.type).reduce((sum, loan) => sum + loan.amount, 0))}
              </p>
            </div>
            <TrendingUp className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Amount Taken</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(goldLoans.filter(l => l.type === 'taken').reduce((sum, loan) => sum + loan.amount, 0))}
              </p>
            </div>
            <TrendingDown className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Amount</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(goldLoans.reduce((sum, loan) => sum + (loan.remainingAmount || loan.amount), 0))}
              </p>
            </div>
            <IndianRupee className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      {/* Gold Loans List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gold Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount & Interest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {goldLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">#{loan.id}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          loan.type === 'taken' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {loan.type === 'taken' ? 'Taken' : 'Given'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Start: {formatDate(loan.startDate)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Due: {formatDate(loan.dueDate)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {loan.goldWeight}g
                      </p>
                      <p className="text-sm text-gray-600">
                        {loan.goldPurity}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(loan.amount)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {loan.interestRate}% per month
                      </p>
                      <p className="text-sm text-gray-600">
                        Remaining: {formatCurrency(loan.remainingAmount || loan.amount)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewDetails(loan)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLoan(loan);
                          setShowPaymentModal(true);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Add Payment"
                      >
                        <IndianRupee size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {goldLoans.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Gold Loans</h3>
            <p className="text-gray-600">Start by adding your first gold loan transaction.</p>
          </div>
        )}
      </div>

      {/* Add Gold Loan Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Gold Loan</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loan Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="given">Given (We give loan)</option>
                    <option value="taken">Taken (We take loan)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gold Weight (g)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.goldWeight}
                      onChange={(e) => setFormData({...formData, goldWeight: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gold Purity
                    </label>
                    <select
                      value={formData.goldPurity}
                      onChange={(e) => setFormData({...formData, goldPurity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Purity</option>
                      <option value="24K">24K (99.9%)</option>
                      <option value="22K">22K (91.7%)</option>
                      <option value="18K">18K (75%)</option>
                      <option value="14K">14K (58.3%)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Payment</h3>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Loan: #{selectedLoan.id}</p>
                  <p className="text-sm text-gray-600">Remaining: {formatCurrency(selectedLoan.remainingAmount || selectedLoan.amount)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Type
                  </label>
                  <select
                    value={paymentData.type}
                    onChange={(e) => setPaymentData({...paymentData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="interest">Interest Payment</option>
                    <option value="principal">Principal Payment</option>
                    <option value="both">Both Interest & Principal</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.description}
                    onChange={(e) => setPaymentData({...paymentData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Loan Details</h3>
                <button
                  onClick={() => setViewDetails(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Loan Information</h4>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm"><span className="font-medium">ID:</span> #{viewDetails.id}</p>
                      <p className="text-sm"><span className="font-medium">Amount:</span> {formatCurrency(viewDetails.amount)}</p>
                      <p className="text-sm"><span className="font-medium">Interest Rate:</span> {viewDetails.interestRate}% per month</p>
                      <p className="text-sm"><span className="font-medium">Status:</span> {viewDetails.status}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Gold Details</h4>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm"><span className="font-medium">Weight:</span> {viewDetails.goldWeight}g</p>
                      <p className="text-sm"><span className="font-medium">Purity:</span> {viewDetails.goldPurity}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Payment Summary</h4>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm"><span className="font-medium">Interest Paid:</span> {formatCurrency(viewDetails.interestPaid || 0)}</p>
                      <p className="text-sm"><span className="font-medium">Principal Paid:</span> {formatCurrency(viewDetails.principalPaid || 0)}</p>
                      <p className="text-sm"><span className="font-medium">Remaining:</span> {formatCurrency(viewDetails.remainingAmount || viewDetails.amount)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Dates</h4>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm"><span className="font-medium">Start Date:</span> {formatDate(viewDetails.startDate)}</p>
                      <p className="text-sm"><span className="font-medium">Due Date:</span> {formatDate(viewDetails.dueDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {viewDetails.payments && viewDetails.payments.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Payment History</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {viewDetails.payments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2">{formatDate(payment.date)}</td>
                            <td className="px-3 py-2 capitalize">{payment.type}</td>
                            <td className="px-3 py-2">{formatCurrency(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldLoanTab;