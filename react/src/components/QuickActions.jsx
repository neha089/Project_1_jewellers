import React from 'react';
import { UserPlus, PlusCircle, ArrowUpDown, CreditCard, FileText, Download, Zap } from 'lucide-react';
import ActionButton from './ActionButton';

const QuickActions = () => {
  // Enhanced navigation helper function that also updates sidebar
  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    // Dispatch custom event to notify sidebar of navigation change
    window.dispatchEvent(new CustomEvent('navigationUpdate'));
  };

  const actions = [
    { 
      icon: UserPlus, 
      label: 'Add Customer', 
      action: () => navigateTo('/customers'),
      description: 'Navigate to customer management',
      color: 'blue'
    },
    { 
      icon: PlusCircle, 
      label: 'New Gold Loan', 
      action: () => navigateTo('/gold-loans'),
      description: 'Create new gold loan',
      color: 'yellow'
    },
    { 
      icon: ArrowUpDown, 
      label: 'View Transactions', 
      action: () => navigateTo('/transactions'),
      description: 'View all transactions',
      color: 'green'
    },
    { 
      icon: CreditCard, 
      label: 'Record Payment', 
      action: () => {
        navigateTo('/transactions');
        // Optional: Add a slight delay and show a toast or highlight payment section
        setTimeout(() => {
          // You can add logic here to highlight payment section in transactions
          console.log('Payment recording mode activated');
        }, 100);
      },
      description: 'Record loan payments',
      color: 'purple'
    },
    { 
      icon: FileText, 
      label: 'Generate Report', 
      action: () => {
        // Show a more professional message for future features
        const message = `📊 Report Generation Feature
        
This feature will be available soon with backend integration.
Reports will include:
• Daily/Monthly cash flow
• Customer loan summaries  
• Gold portfolio analysis
• Business performance metrics`;
        
        alert(message);
      },
      description: 'Generate business reports',
      color: 'indigo'
    },
    { 
      icon: Download, 
      label: 'Backup Data', 
      action: () => {
        // Show a more professional message for future features
        const message = `💾 Data Backup Feature
        
This feature will be available soon with backend integration.
Backup options will include:
• Automatic daily backups
• Manual export to Excel/PDF
• Cloud storage integration
• Data restoration tools`;
        
        alert(message);
      },
      description: 'Backup business data',
      color: 'gray'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Fast access to common tasks</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Quick Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="p-6">
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action, index) => (
            <div key={index} className="relative group">
              <div className="relative p-4 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                <div 
                  className="flex flex-col items-center text-center gap-3"
                  onClick={action.action}
                >
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors">
                    <action.icon size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {action.label}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 shadow-lg">
                {action.description}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
