import React from 'react';
import { UserPlus, PlusCircle, ArrowUpDown, CreditCard, FileText, Download, Zap } from 'lucide-react';
import ActionButton from './ActionButton';

const QuickActions = () => {
  const actions = [
    { icon: UserPlus, label: 'Add Customer', action: () => alert('Add New Customer form would open here') },
    { icon: PlusCircle, label: 'New Loan', action: () => alert('Create Gold Loan form would open here') },
    { icon: ArrowUpDown, label: 'Record Transaction', action: () => alert('Record Transaction form would open here') },
    { icon: CreditCard, label: 'Record Payment', action: () => alert('Record Payment form would open here') },
    { icon: FileText, label: 'Generate Report', action: () => alert('Reports section would open here') },
    { icon: Download, label: 'Backup Data', action: () => alert('Data backup would start here') }
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
        <Zap size={18} />
        Quick Actions
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            icon={action.icon}
            label={action.label}
            onClick={action.action}
          />
        ))}
      </div>
    </div>
  );
};

export default QuickActions;