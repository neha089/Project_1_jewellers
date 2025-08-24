// Enhanced Balance Calculator for Udhari Management
// Mock data - Replace this with your actual data source

let mockTransactions = [
  // Neha Patel example transactions
  {
    id: 1,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed', // Customer took money
    amount: 100000,
    date: '2024-06-24', // 2 months ago
    description: 'Gold jewelry purchase - wedding order'
  },
  {
    id: 2,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed', // Customer took more money
    amount: 50000,
    date: '2024-08-23', // Yesterday
    description: 'Additional jewelry items'
  },
  {
    id: 3,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'borrowed', // Customer took more money today
    amount: 20000,
    date: '2024-08-24', // Today
    description: 'Emergency gold loan'
  },
  {
    id: 4,
    customerId: 'CUST001',
    customerName: 'Neha Patel',
    customerPhone: '+91 9876543210',
    type: 'returned', // Customer gave back some money
    amount: 25000,
    date: '2024-08-20',
    description: 'Partial payment'
  },
  
  // Another customer example
  {
    id: 5,
    customerId: 'CUST002',
    customerName: 'Raj Shah',
    customerPhone: '+91 9876543211',
    type: 'borrowed',
    amount: 75000,
    date: '2024-08-15',
    description: 'Gold loan for business'
  },
  {
    id: 6,
    customerId: 'CUST002',
    customerName: 'Raj Shah',
    customerPhone: '+91 9876543211',
    type: 'returned',
    amount: 30000,
    date: '2024-08-22',
    description: 'First installment payment'
  },
  
  // Customer who owes you money (reverse case)
  {
    id: 7,
    customerId: 'CUST003',
    customerName: 'Priya Sharma',
    customerPhone: '+91 9876543212',
    type: 'lent', // You gave money to customer
    amount: 40000,
    date: '2024-08-10',
    description: 'Advance payment for custom jewelry order'
  }
];

// Get all customers with their comprehensive balance information
export const getCustomerBalances = () => {
  const customerMap = {};
  
  mockTransactions.forEach(transaction => {
    if (!customerMap[transaction.customerId]) {
      customerMap[transaction.customerId] = {
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        customerPhone: transaction.customerPhone,
        totalBorrowed: 0,  // Total money customer took from you
        totalReturned: 0,  // Total money customer gave back to you
        totalLent: 0,      // Total money you gave to customer (advance payments)
        netBalance: 0,     // Final balance
        transactions: [],
        lastTransactionDate: null
      };
    }
    
    customerMap[transaction.customerId].transactions.push(transaction);
    
    // Calculate totals based on transaction type
    if (transaction.type === 'borrowed') {
      customerMap[transaction.customerId].totalBorrowed += transaction.amount;
    } else if (transaction.type === 'returned') {
      customerMap[transaction.customerId].totalReturned += transaction.amount;
    } else if (transaction.type === 'lent') {
      customerMap[transaction.customerId].totalLent += transaction.amount;
    }
    
    // Update last transaction date
    const transactionDate = new Date(transaction.date);
    if (!customerMap[transaction.customerId].lastTransactionDate || 
        transactionDate > new Date(customerMap[transaction.customerId].lastTransactionDate)) {
      customerMap[transaction.customerId].lastTransactionDate = transaction.date;
    }
  });
  
  // Calculate net balance for each customer
  Object.values(customerMap).forEach(customer => {
    // Net balance = (Money they borrowed - Money they returned) - Money you lent to them
    customer.netBalance = (customer.totalBorrowed - customer.totalReturned) - customer.totalLent;
    
    // Sort transactions by date (newest first)
    customer.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  });
  
  return Object.values(customerMap);
};

// Get detailed transaction history for a specific customer with running balance
export const getCustomerTransactionHistory = (customerId) => {
  const customer = getCustomerBalances().find(c => c.customerId === customerId);
  if (!customer) return [];
  
  // Sort transactions by date (oldest first for running balance calculation)
  const sortedTransactions = [...customer.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let runningBalance = 0;
  return sortedTransactions.map(transaction => {
    // Calculate running balance
    if (transaction.type === 'borrowed') {
      runningBalance += transaction.amount;
    } else if (transaction.type === 'returned') {
      runningBalance -= transaction.amount;
    } else if (transaction.type === 'lent') {
      runningBalance -= transaction.amount;
    }
    
    return {
      ...transaction,
      runningBalance
    };
  });
};

// Get summary statistics
export const getBusinessSummary = () => {
  const customers = getCustomerBalances();
  
  return {
    totalCustomers: customers.length,
    customersWithBalance: customers.filter(c => Math.abs(c.netBalance) > 0).length,
    totalMoneyOut: customers.reduce((sum, c) => sum + (c.netBalance > 0 ? c.netBalance : 0), 0), // Money to receive
    totalMoneyIn: customers.reduce((sum, c) => sum + (c.netBalance < 0 ? Math.abs(c.netBalance) : 0), 0), // Money to give
    totalTransactions: mockTransactions.length
  };
};

// Add a new transaction
export const addTransaction = (transaction) => {
  const newTransaction = {
    ...transaction,
    id: Math.max(...mockTransactions.map(t => t.id)) + 1,
    date: transaction.date || new Date().toISOString().split('T')[0]
  };
  
  mockTransactions.push(newTransaction);
  return newTransaction;
};

// Send reminder message (mock function)
export const sendReminder = (customerPhone, amount, customerName) => {
  const message = `प्रिय ${customerName}, आपका बकाया बैलेंस ₹${amount.toLocaleString()} है। कृपया भुगतान की व्यवस्था करें। धन्यवाद! - JewelryPro`;
  
  // Mock implementation
  console.log(`Sending message to ${customerPhone}: ${message}`);
  
  // Show alert for demo
  alert(`💬 Message sent to ${customerName}:\n\n${message}`);
  
  return { success: true, message: 'Reminder sent successfully' };
};

// Format currency for Indian format
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Get time ago string
export const getTimeAgo = (date) => {
  const now = new Date();
  const transactionDate = new Date(date);
  const diffTime = Math.abs(now - transactionDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === 0) return 'Today';
  if (diffDays <= 7) return `${diffDays} days ago`;
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays <= 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};