// TransactionManagement.js - Main Component with API Integration
import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SummaryCards from './SummaryCards';
import TransactionHeader from "./TransactionHeader";
import RecentTransactions from "./RecentTransactions";
import CustomerSearch from './CustomerSearch';
import CreateCustomerForm from './CreateCustomerForm';
import TransactionForm from './TransactionForm';
import { TransactionTypeSelection, CategorySelection } from './TransactionCategories';

const TransactionManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [currentStep, setCurrentStep] = useState('search'); // search, customer, category, form
  const [transactionType, setTransactionType] = useState(''); // income or expense
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Navigation helper functions
  const goBack = () => {
    if (currentStep === 'customer') {
      setCurrentStep('search');
      setShowCreateCustomer(false);
    } else if (currentStep === 'category' && transactionType) {
      setTransactionType('');
    } else if (currentStep === 'category' && !transactionType) {
      setCurrentStep('search');
      setSelectedCustomer(null);
    } else if (currentStep === 'form') {
      setCurrentStep('category');
      setSelectedCategory(null);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setCurrentStep('category');
  };

  const handleCreateCustomer = () => {
    setShowCreateCustomer(true);
    setCurrentStep('customer');
    
    // Pre-fill with search term if it looks like a name
    if (searchTerm && !searchTerm.includes('+91') && searchTerm.length > 2) {
      const nameParts = searchTerm.trim().split(' ');
      return {
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || ''
      };
    }
    return {};
  };

  const handleCustomerCreated = (newCustomer) => {
    setSelectedCustomer(newCustomer);
    setCurrentStep('category');
    setShowCreateCustomer(false);
  };

  const selectTransactionType = (type) => {
    setTransactionType(type);
    setCurrentStep('category');
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setCurrentStep('form');
  };

  const handleTransactionSuccess = () => {
    setShowSuccess(true);
    // Trigger refresh of dashboard stats and recent transactions
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => {
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedCustomer(null);
    setShowCreateCustomer(false);
    setCurrentStep('search');
    setTransactionType('');
    setSelectedCategory(null);
    setShowSuccess(false);
  };

  const handleEditTransaction = (transaction) => {
    console.log('Edit transaction:', transaction);
    // TODO: Implement edit functionality
  };

  const handleDeleteTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        // TODO: Implement delete API call
        console.log('Delete transaction:', id);
        setRefreshTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const renderSuccessMessage = () => (
    <div className="text-center py-12">
      <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Transaction Saved Successfully!</h3>
      <p className="text-gray-500 mb-6">Your transaction has been recorded.</p>
      <button
        onClick={resetForm}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add Another Transaction
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Transaction Header */}
      <div className="mb-8">
        <TransactionHeader />
      </div>
      
      {/* Summary Cards */}
      <div className="mb-8">
        <SummaryCards key={refreshTrigger} />
      </div>
       
      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {showSuccess && renderSuccessMessage()}
          
          {!showSuccess && (
            <div>
              <div className="p-8">
                {currentStep === 'search' && (
                  <CustomerSearch
                    onCustomerSelect={handleCustomerSelect}
                    onCreateCustomer={handleCreateCustomer}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                  />
                )}
                
                {currentStep === 'customer' && (
                  <CreateCustomerForm
                    onCancel={handleCancel}
                    onBack={goBack}
                    onCustomerCreated={handleCustomerCreated}
                    initialData={handleCreateCustomer()}
                  />
                )}
                
                {currentStep === 'category' && !transactionType && (
                  <TransactionTypeSelection
                    selectedCustomer={selectedCustomer}
                    onSelectType={selectTransactionType}
                    onBack={goBack}
                    onCancel={handleCancel}
                  />
                )}
                
                {currentStep === 'category' && transactionType && (
                  <CategorySelection
                    transactionType={transactionType}
                    onSelectCategory={selectCategory}
                    onBack={goBack}
                    onCancel={handleCancel}
                  />
                )}
                
                {currentStep === 'form' && (
                  <TransactionForm
                    selectedCustomer={selectedCustomer}
                    selectedCategory={selectedCategory}
                    transactionType={transactionType}
                    onBack={goBack}
                    onCancel={handleCancel}
                    onSuccess={handleTransactionSuccess}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Recent Transactions */}
      <div className="px-6 py-4">
        <RecentTransactions 
          onEdit={handleEditTransaction}
          onDelete={handleDeleteTransaction}
          refreshTrigger={refreshTrigger}
        />        
      </div>
    </div>
  );
};

export default TransactionManagement;