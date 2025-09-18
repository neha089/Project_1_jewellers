// utils/customerUtils.js
// Utility functions for handling customer/supplier data consistently

export const getCustomerName = (customer) => {
  if (!customer) return 'N/A';
  
  // Handle different name formats
  if (customer.name) return customer.name;
  
  const firstName = customer.firstName || '';
  const lastName = customer.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || 'N/A';
};

export const getCustomerPhone = (customer) => {
  if (!customer) return '';
  return customer.phone || customer.phoneNumber || '';
};

export const getCustomerEmail = (customer) => {
  if (!customer) return '';
  return customer.email || '';
};

export const getCustomerAddress = (customer) => {
  if (!customer) return '';
  
  const address = customer.address;
  
  // Handle string address
  if (typeof address === 'string') return address;
  
  // Handle object address
  if (address && typeof address === 'object') {
    const addressParts = [
      address.street,
      address.city,
      address.state,
      address.pincode
    ].filter(Boolean);
    
    return addressParts.join(', ');
  }
  
  return '';
};

export const getPersonDetailsFromTransaction = (transaction) => {
  if (!transaction) return null;
  
  const isCustomerTransaction = transaction.transactionType === 'SELL';
  const person = isCustomerTransaction ? transaction.customer : transaction.supplier;
  
  if (!person) return null;
  
  return {
    _id: person._id,
    name: getCustomerName(person),
    phone: getCustomerPhone(person),
    email: getCustomerEmail(person),
    address: getCustomerAddress(person),
    type: isCustomerTransaction ? 'customer' : 'supplier'
  };
};

export const formatCustomerForForm = (customer) => {
  if (!customer) return { name: '', phone: '', email: '', address: '' };
  
  return {
    name: getCustomerName(customer),
    phone: getCustomerPhone(customer),
    email: getCustomerEmail(customer),
    address: getCustomerAddress(customer)
  };
};

export const validateCustomerData = (customerData) => {
  const errors = [];
  
  if (!customerData.name || customerData.name.trim() === '') {
    errors.push('Customer name is required');
  }
  
  if (customerData.phone && !/^\+?[\d\s\-\(\)]+$/.test(customerData.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (customerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
    errors.push('Invalid email format');
  }
  
  return errors;
};

// Format customer data for API submission
export const prepareCustomerForAPI = (customer) => {
  if (!customer) return null;
  
  // If customer has an ID, return just the ID (existing customer)
  if (customer._id) {
    return customer._id;
  }
  
  // Otherwise, return the customer data object (new customer)
  return {
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || ''
  };
};