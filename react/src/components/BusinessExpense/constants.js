// components/BusinessExpense/constants.js

export const CATEGORIES = [
    { name: 'RAW_MATERIALS', subcategories: ['Precious Metals', 'Gemstones', 'Diamonds', 'Silver', 'Platinum'] },
    { name: 'EQUIPMENT', subcategories: ['Manufacturing Tools', 'Display Equipment', 'Security Systems', 'Computers & Software'] },
    { name: 'UTILITIES', subcategories: ['Power & Electricity', 'Water & Gas', 'Internet & Phone', 'Waste Management'] },
    { name: 'MARKETING', subcategories: ['Digital Advertising', 'Print Media', 'Events & Shows', 'Brand Development'] },
    { name: 'RENT_LEASE', subcategories: ['Shop Rent', 'Warehouse Rent', 'Equipment Lease', 'Vehicle Lease'] },
    { name: 'INSURANCE', subcategories: ['Business Insurance', 'Inventory Insurance', 'Liability Insurance', 'Employee Insurance'] },
    { name: 'PROFESSIONAL_SERVICES', subcategories: ['Legal Services', 'Accounting', 'Consultancy', 'Certification'] },
    { name: 'TRANSPORTATION', subcategories: ['Shipping & Courier', 'Vehicle Fuel', 'Logistics', 'Import/Export'] },
    { name: 'PACKAGING', subcategories: ['Gift Boxes', 'Protective Packaging', 'Branding Materials', 'Labels'] },
    { name: 'MAINTENANCE', subcategories: ['Equipment Repair', 'Shop Maintenance', 'Cleaning Services', 'Security Services'] },
    { name: 'OFFICE_SUPPLIES', subcategories: ['Stationery', 'Printer Supplies', 'Furniture', 'Software Licenses'] },
    { name: 'COMMUNICATION', subcategories: ['Phone Bills', 'Internet', 'Postal Services', 'Courier'] },
    { name: 'LEGAL_COMPLIANCE', subcategories: ['Legal Fees', 'Licenses', 'Permits', 'Compliance Costs'] },
    { name: 'EMPLOYEE_BENEFITS', subcategories: ['Health Insurance', 'Travel Allowance', 'Training', 'Bonus'] },
    { name: 'MISCELLANEOUS', subcategories: ['Others', 'General Expenses', 'Contingency', 'Miscellaneous'] }
];

export const PAYMENT_METHODS = [
    'CASH',
    'CREDIT_CARD',
    'DEBIT_CARD',
    'BANK_TRANSFER',
    'UPI',
    'CHEQUE',
    'AUTO_PAY'
];

export const PAYMENT_STATUS_OPTIONS = [
    { value: 'PAID', label: '✅ Paid', color: 'emerald' }
];

export const DATE_RANGE_OPTIONS = [
    { value: 'All', label: 'All Time' },
    { value: 'Today', label: 'Today' },
    { value: 'This Week', label: 'This Week' },
    { value: 'This Month', label: 'This Month' },
    { value: 'This Quarter', label: 'This Quarter' }
];

export const CATEGORY_ICONS = {
    'RAW_MATERIALS': '💎',
    'EQUIPMENT': '🔧',
    'UTILITIES': '⚡',
    'MARKETING': '📢',
    'RENT_LEASE': '🏢',
    'INSURANCE': '🛡️',
    'PROFESSIONAL_SERVICES': '👔',
    'TRANSPORTATION': '🚚',
    'PACKAGING': '📦',
    'MAINTENANCE': '🔨',
    'OFFICE_SUPPLIES': '📄',
    'COMMUNICATION': '📞',
    'LEGAL_COMPLIANCE': '⚖️',
    'EMPLOYEE_BENEFITS': '👥',
    'MISCELLANEOUS': '📋'
};

export const getStatusBadgeColor = (status) => {
    const statusConfig = PAYMENT_STATUS_OPTIONS.find(s => s.value === status);
    if (!statusConfig) return 'bg-gray-50 text-gray-700 border-gray-200';
    
    const colorMap = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };
    
    return colorMap[statusConfig.color] || 'bg-gray-50 text-gray-700 border-gray-200';
};

export const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || '📋';
};