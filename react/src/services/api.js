// api.js - Enhanced API Service Layer with Axios for Better Performance
import axios from 'axios';

const BASE_URL = "http://localhost:3000";

// Create axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making API request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for logging and error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API request failed:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 
                          error.response.data?.error || 
                          `HTTP error! status: ${error.response.status}`;
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - no response received');
    } else {
      // Something else happened
      throw new Error(error.message || 'Request failed');
    }
  }
);

class ApiService {
  // Legacy request method for backward compatibility
  async request(endpoint, options = {}) {
    try {
      const config = {
        url: endpoint,
        method: options.method || 'GET',
        data: options.body,
        headers: {
          ...options.headers,
        },
        ...options,
      };

      // Remove body from config as axios uses data
      delete config.body;

      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // New axios-based methods for better performance
  async get(endpoint, params = {}) {
    const response = await axiosInstance.get(endpoint, { params });
    return response.data;
  }

  async post(endpoint, data = {}) {
    const response = await axiosInstance.post(endpoint, data);
    return response.data;
  }

  async put(endpoint, data = {}) {
    const response = await axiosInstance.put(endpoint, data);
    return response.data;
  }

  async patch(endpoint, data = {}) {
    const response = await axiosInstance.patch(endpoint, data);
    return response.data;
  }

  async delete(endpoint) {
    const response = await axiosInstance.delete(endpoint);
    return response.data;
  }
   async getAllCustomers(page = 1, limit = 1000) {
    return this.get(`/api/customers?page=${page}&limit=${limit}`);
  }

  async searchCustomers(query) {
    return this.get(`/api/customers/search?q=${encodeURIComponent(query)}`);
  }

  async createCustomer(customerData) {
    return this.post('/api/customers', customerData);
  }
  async createGoldTransaction(transactionData) {
    return this.post("/api/gold/", transactionData);
  }
  async createSilverTransaction (transactionData) {
    return this.post("/api/silver/", transactionData);
  }
  // Udhari APIs - Updated to match backend exactly
  async giveUdhar(data) {
    return this.post('/api/udhari/give', data);
  }
  async giveLoan(data) {
    return this.post('/api/loans/give', data);
  }

  async takeUdhar(data) {
    return this.post('/api/udhari/take', data);
  }
  async takeLoan(data) {
    return this.post('/api/loans/take', data);
  }
  async receiveLoanPayment(data){
    return this.post('/api/loans/receive-payment',data);
  }
  async makeLoanPayment(data){
    console.log('=== ApiService.makeLoanPayment ===');
    console.log('Received data:', data);
    return this.post('/api/loans/make-payment',data);
  }
  async makeLoanInterestPayment(data){
    return this.post('/api/loans/make-interest-payment',data);
  }
  // Fixed payment APIs to match backend parameters
// Fixed receiveUdhariPayment method in api.js
// REPLACE your existing receiveUdhariPayment method with this:
async receiveUdharPayment(paymentData) {
  console.log('=== ApiService.receiveUdhariPayment ===');
  console.log('Received data:', paymentData);
  
  // Validate input data
  if (!paymentData) {
    console.error('No payment data provided');
    throw new Error('Payment data is required');
  }
  
  // FIXED: Use the correct field names from the frontend
  const customer = paymentData.customer;           // ✅ This exists
  const amountPaise = paymentData.amountPaise;     // ✅ This exists  
  const udhariId = paymentData.udhariId;           // ✅ This exists
  const note = paymentData.note;                   // ✅ This exists
  
  console.log('Extracted fields:', {
    customer,
    amountPaise,
    udhariId,
    note,
    customerType: typeof customer,
    amountType: typeof amountPaise,
    udhariIdType: typeof udhariId
  });
  
  // Validate required fields
  if (!customer) {
    throw new Error('Customer ID is required');
  }
  
  if (!udhariId) {
    throw new Error('Udhari ID is required');
  }
  
  if (!amountPaise || isNaN(amountPaise) || amountPaise <= 0) {
    throw new Error(`Valid payment amount is required. Got: ${amountPaise} (type: ${typeof amountPaise})`);
  }
  
  // FIXED: Create the backend payload with correct field mapping
  const backendPayload = {
    customer: String(customer),              // customer stays customer
    principalPaise: parseInt(amountPaise),   // amountPaise becomes principalPaise
    sourceRef: String(udhariId),            // udhariId becomes sourceRef
    note: note || undefined,                // note stays note
    installmentNumber: paymentData.installmentNumber || 1,
    paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentData.paymentMethod || 'CASH',
    reference: paymentData.reference || '',
    transactionId: paymentData.transactionId || ''
  };

  console.log('Final backend payload:', backendPayload);
  
  try {
    console.log('Making POST request to /api/udhari/receive-payment');
    const response = await this.post('/api/udhari/receive-payment', backendPayload);
    console.log('✅ Backend response received:', response);
    return response;
  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error;
  }
}

// Also fix the makeUdhariPayment method for consistency
async makeUdhariPayment(data) {
  return this.post('/api/udhari/make-payment', data);
}
  async getCustomerUdhariSummary(customerId) {
    return this.get(`/api/udhari/customer/${customerId}`);
  }
  async getCustomerLoanSummary(customerId) {
    return this.get(`/api/udhari/customer/${customerId}`);
  }

  async getOutstandingToCollectUdhari() {
    return this.get('/api/udhari/outstanding/collect');
  }

  async getOutstandingToPayUdhari() {
    return this.get('/api/udhari/outstanding/pay');
  }
  async getOutstandingToPay() {
    return this.get('/api/udhari/outstanding/pay');
  }
  async getOutstandingToCollectLoan() {
    return this.get('/api/loans/outstanding/collect');
  }

  async getOutstandingToPayLoan() {
    return this.get('/api/loans/outstanding/pay');
  }
  async getOverallUdhariSummary() {
    return this.get('/api/udhari/summary');
  }

  async getPaymentHistory(udhariId) {
    return this.get(`/api/udhari/payment-history/${udhariId}`);
  }

  // New APIs for improved functionality
  async getUdhariTransactions(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.get(`/api/udhari/transactions${params ? '?' + params : ''}`);
  }

  async getUdhariById(udhariId) {
    return this.get(`/api/udhari/${udhariId}`);
  }

  async updateUdhariTransaction(udhariId, data) {
    return this.put(`/api/udhari/${udhariId}`, data);
  }
  // Enhanced customer search with axios
  async searchCustomers(search = "", page = 1, limit = 50, status = "active") {
    const cleanSearch = search ? search.trim() : "";
    const params = {};

    if (cleanSearch) params.search = cleanSearch;
    params.page = page.toString();
    params.limit = limit.toString();
    params.status = status;

    try {
      const response = await this.get("/api/customers", params);

      if (response.success && cleanSearch && response.data?.customers) {
        const customers = response.data.customers;
        const filtered = customers.filter((customer) => {
          const searchLower = cleanSearch.toLowerCase();
          return (
            (customer.name &&
              customer.name.toLowerCase().includes(searchLower)) ||
            (customer.phone &&
              customer.phone.toLowerCase().includes(searchLower)) ||
            (customer.email &&
              customer.email.toLowerCase().includes(searchLower)) ||
            (customer.address &&
              [customer.address.street, customer.address.city, customer.address.state, customer.address.pincode?.toString()]
                .filter(Boolean)
                .some((field) => field.toLowerCase().includes(searchLower))) ||
            (customer.city &&
              customer.city.toLowerCase().includes(searchLower)) ||
            (customer.state &&
              customer.state.toLowerCase().includes(searchLower)) ||
            (customer.adhaarNumber &&
              customer.adhaarNumber.toString().includes(searchLower))
          );
        });

        return {
          ...response,
          data: { ...response.data, customers: filtered },
        };
      }

      return response;
    } catch (error) {
      console.error("Search request failed:", error);
      throw error;
    }
  }

  // Customer APIs
  async createCustomer(customerData) {
    return this.post("/api/customers/", {
      name: customerData.name,
      phone: customerData.phone,
      address: {
        street: customerData.address.street,
        city: customerData.address.city,
        state: customerData.address.state,
        pincode: customerData.address.pinCode,
      },
      adhaarNumber: customerData.idProof.number,
      email: customerData.email,
      city: customerData.address.city,
      state: customerData.address.state,
      pincode: customerData.address.pinCode,
      totalAmountTakenFromJewellers: 0,
      totalAmountTakenByUs: 0,
      status: "active",
    });
  }

  async getGoldLoansByCustomer(customerId) {
    return this.get(`/api/gold-loans/customer/${customerId}`);
  }

  async getLoansByCustomer(customerId) {
    return this.get(`/api/loans/customer/${customerId}`);
  }

  async getAllCustomers(page = 1, limit = 100) {
    return this.get(`/api/customers/`, { page: page.toString(), limit: limit.toString() });
  }

  // Gold Loan APIs
  async createGoldLoan(formData) {
    console.log('Creating gold loan with data:', formData);
    
    // Match backend controller expectations exactly
    const payload = {
      customer: formData.customer, // Backend expects 'customer' field
      items: formData.items.map(item => ({
        name: item.name || 'Gold Item',
        weightGram: parseFloat(item.weightGram), // Note: frontend uses 'weight', backend expects 'weightGram'
        loanAmount: parseFloat(item.loanAmount
), // Backend expects 'loanAmount' for manual amounts
        purityK: parseInt(item.purityK), // Frontend uses 'purity', backend expects 'purityK'
        images: item.images || [],
        goldPriceAtDeposit: parseFloat(item.goldPriceAtDeposit) || 0
      })),
      interestRateMonthlyPct: parseFloat(formData.interestRateMonthlyPct),
      startDate: formData.startDate
 || new Date().toISOString(),
      notes: formData.notes || ''
    };

    return this.post('/api/gold-loans', payload);
  }

  async getAllGoldLoans(filters = {}) {
    const params = {};
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.status && filters.status !== 'all') params.status = filters.status;
    if (filters.customer) params.customer = filters.customer;
    
    return this.get('/api/gold-loans', params);
  }

  async getGoldLoan(loanId) {
    return this.get(`/api/gold-loans/${loanId}`);
  }

  async getGoldLoansByCustomer(customerId) {
    return this.get(`/api/gold-loans/customer/${customerId}`);
  }

  
    async getDashboardStats() {
    return this.request("/api/dashboard/stats");
  }

  async getGoldLoanInterestSummary(loanId) {
    return this.request(`/api/gold-loans/${loanId}/interest-summary`);
  }

  async getAllTransactions() {
    return this.request(`/api/transactions`);
  }

  async addInterestPayment(loanId, paymentData) {
    return this.post(`/api/gold-loans/${loanId}/interest-payment`, {
      interestAmount: parseFloat(paymentData.interestAmount),
      photos: paymentData.photos || [],
      notes: paymentData.notes || '',
      forMonth: paymentData.forMonth
    });
  }

  async processItemRepayment(loanId, repaymentData) {
    return this.post(`/api/gold-loans/${loanId}/process-repayment`, {
      repaymentAmount: parseFloat(repaymentData.repaymentAmount || 0),
      selectedItemIds: repaymentData.selectedItemIds || [],
      currentGoldPrice: parseFloat(repaymentData.currentGoldPrice || 0),
      photos: repaymentData.photos || [],
      notes: repaymentData.notes || ''
    });
  }

  async closeGoldLoan(loanId, closureData = {}) {
    return this.put(`/api/gold-loans/${loanId}/close`, {
      closureImages: closureData.photos || [],
      notes: closureData.notes || 'Loan closed'
    });
  }

  async getDashboardStats() {
    return this.get('/api/gold-loans/analytics/dashboard');
  }

  async getPaymentHistory(loanId) {
    return this.get(`/api/gold-loans/${loanId}/payment-history`);
  }
  // Metal Sale APIs
  async createMetalSale(saleData) {
    return this.post("/api/metal-sales/", {
      customer: saleData.customerId,
      metal: saleData.metal.toUpperCase(),
      weightGram: parseFloat(saleData.weight),
      amountPaise: Math.round(parseFloat(saleData.amount) * 100),
      ratePerGramPaise: Math.round(parseFloat(saleData.rate) * 100),
      purityK: parseInt(saleData.purity),
      date: saleData.date,
    });
  }

  // Regular Loan APIs
  async createLoan(loanData, direction) {
    return this.post("/api/loans/", {
      customer: loanData.customerId,
      loanType: direction === -1 ? 'GIVEN' : 'TAKEN',
      principalPaise: Math.round(parseFloat(loanData.amount) * 100),
      interestRateMonthlyPct: parseFloat(loanData.interestRate),
      dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
      direction: direction, // -1 for given, 1 for taken
      note: loanData.description,
    });
  }

  async getLoanDetails(loanId) {
    return this.get(`/api/loans/${loanId}`);
  }

  async makeLoanInterestPayment(loanId, interestAmount, note = null) {
    return this.post(`/api/loans/${loanId}/interest-payment`, {
      interestPaise: Math.round(parseFloat(interestAmount) * 100),
      forMonth: this.getCurrentMonth(),
      note: note,
    });
  }

  async makeLoanPrincipalPayment(loanId, principalAmount, note = null) {
    return this.post(`/api/loans/${loanId}/principal-payment`, {
      principalPaise: Math.round(parseFloat(principalAmount) * 100),
      note: note,
    });
  }

  
  async getLoanReminders(daysAhead = 0) {
    return this.get(`/api/loans/reminders`, { days: daysAhead });
  }

  async updateLoanInterestRate(loanId, newRate, note) {
    return this.patch(`/api/loans/${loanId}/interest-rate`, {
      interestRateMonthlyPct: parseFloat(newRate),
      note: note,
    });
  }

  async markLoanReminderSent(loanId) {
    return this.patch(`/api/loans/${loanId}/reminder-sent`);
  }

  async getAllLoans(filters = {}) {
    const params = {};
    
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.status) params.status = filters.status;
    if (filters.customer) params.customer = filters.customer;
    if (filters.loanType) params.loanType = filters.loanType;
    if (filters.overdue) params.overdue = filters.overdue;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return this.get(`/api/loans`, params);
  }

  // Udhari APIs
 async getcustomeridudhaar(customerId) {
    return this.get(`/api/udhari/customer/${customerId}`);
  }

  async getOverallUdhariSummary() {
    return this.get(`/api/udhari/summary`);
  }

  // Add other API methods...

  async giveUdhari(udhariData) {
    return this.post("/api/udhari/give", {
      customer: udhariData.customerId,
      principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
      note: udhariData.description,
      totalInstallments: parseInt(udhariData.installments || 1),
    });
  }

  async receiveUdhariPayment(paymentData) {
    return this.post("/api/udhari/receive-payment", paymentData);
  }


  // Gold/Silver Sale/Purchase APIs
  async createGoldSale(transactionData) {
    try {
      const payload = {
        transactionType: "SELL",
        customer: transactionData.customerId,
        goldDetails: {
          purity: transactionData.purity || "22K",
          weight: parseFloat(transactionData.weight),
          ratePerGram: Math.round(parseFloat(transactionData.rate) * 100), // Convert to paise
          makingCharges: Math.round((transactionData.makingCharges || 0) * 100),
          wastage: parseFloat(transactionData.wastage || 0),
          taxAmount: Math.round((transactionData.taxAmount || 0) * 100)
        },
        advanceAmount: Math.round((transactionData.advanceAmount || 0) * 100),
        paymentMode: transactionData.paymentMode || "CASH",
        items: transactionData.items || [{
          name: transactionData.itemName || "Gold Item",
          description: transactionData.description || "",
          weight: parseFloat(transactionData.weight),
          purity: transactionData.purity || "22K",
          makingCharges: Math.round((transactionData.makingCharges || 0) * 100),
          itemValue: Math.round(parseFloat(transactionData.weight) * parseFloat(transactionData.rate) * 100),
          photos: transactionData.photos || []
        }],
        notes: transactionData.description || "",
        billNumber: transactionData.billNumber || ""
      };

      return await this.post('/api/gold', payload);
    } catch (error) {
      console.error('Error creating gold sale:', error);
      throw error;
    }
  }

  async createSilverSale(transactionData) {
    try {
      const payload = {
        transactionType: "SELL",
        customer: transactionData.customerId,
        silverDetails: {
          purity: transactionData.purity || "999",
          weight: parseFloat(transactionData.weight),
          ratePerGram: Math.round(parseFloat(transactionData.rate) * 100), // Convert to paise
          makingCharges: Math.round((transactionData.makingCharges || 0) * 100),
          wastage: parseFloat(transactionData.wastage || 0),
          taxAmount: Math.round((transactionData.taxAmount || 0) * 100)
        },
        advanceAmount: Math.round((transactionData.advanceAmount || 0) * 100),
        paymentMode: transactionData.paymentMode || "CASH",
        items: transactionData.items || [{
          name: transactionData.itemName || "Silver Item",
          description: transactionData.description || "",
          weight: parseFloat(transactionData.weight),
          purity: transactionData.purity || "999",
          makingCharges: Math.round((transactionData.makingCharges || 0) * 100),
          itemValue: Math.round(parseFloat(transactionData.weight) * parseFloat(transactionData.rate) * 100),
          photos: transactionData.photos || []
        }],
        notes: transactionData.description || "",
        billNumber: transactionData.billNumber || ""
      };

      return await this.post('/api/silver', payload);
    } catch (error) {
      console.error('Error creating silver sale:', error);
      throw error;
    }
  }

  async createGoldPurchase(transactionData) {
    try {
      const payload = {
        transactionType: "BUY",
        supplier: {
          name: transactionData.partyName || transactionData.supplierName,
          phone: transactionData.supplierPhone || "",
          address: transactionData.supplierAddress || "",
          gstNumber: transactionData.supplierGST || ""
        },
        goldDetails: {
          purity: transactionData.goldType || "22K",
          weight: parseFloat(transactionData.goldWeight),
          ratePerGram: Math.round(parseFloat(transactionData.rate || transactionData.amount / transactionData.goldWeight) * 100),
          makingCharges: 0,
          wastage: 0,
          taxAmount: 0
        },
        advanceAmount: 0,
        paymentMode: "CASH",
        items: [{
          name: "Gold Purchase",
          description: transactionData.description || "",
          weight: parseFloat(transactionData.goldWeight),
          purity: transactionData.goldType || "22K",
          makingCharges: 0,
          itemValue: Math.round(parseFloat(transactionData.amount) * 100),
          photos: transactionData.photos || []
        }],
        notes: transactionData.description || "",
        billNumber: ""
      };

      return await this.post('/api/gold', payload);
    } catch (error) {
      console.error('Error creating gold purchase:', error);
      throw error;
    }
  }

  async createSilverPurchase(transactionData) {
    try {
      const payload = {
        transactionType: "BUY",
        supplier: {
          name: transactionData.partyName || transactionData.supplierName,
          phone: transactionData.supplierPhone || "",
          address: transactionData.supplierAddress || "",
          gstNumber: transactionData.supplierGST || ""
        },
        silverDetails: {
          purity: transactionData.goldType || "999", // Using goldType field but for silver
          weight: parseFloat(transactionData.goldWeight), // Using goldWeight field but for silver
          ratePerGram: Math.round(parseFloat(transactionData.rate || transactionData.amount / transactionData.goldWeight) * 100),
          makingCharges: 0,
          wastage: 0,
          taxAmount: 0
        },
        advanceAmount: 0,
        paymentMode: "CASH",
        items: [{
          name: "Silver Purchase",
          description: transactionData.description || "",
          weight: parseFloat(transactionData.goldWeight),
          purity: transactionData.goldType || "999",
          makingCharges: 0,
          itemValue: Math.round(parseFloat(transactionData.amount) * 100),
          photos: transactionData.photos || []
        }],
        notes: transactionData.description || "",
        billNumber: ""
      };

      return await this.post('/api/silver', payload);
    } catch (error) {
      console.error('Error creating silver purchase:', error);
      throw error;
    }
  }
  async getAnalytics_silver() {
    return this.get("/api/silver/reports/daily-summary");
  }
  
  async getSilverTransactions(params = {}) {
    return this.get("/api/silver", params);
  }
  async deleteSilverTransaction(id) {
    return this.delete(`/api/silver/${id}`);
  }

async updateSilverTransaction(id, transactionData) {
  try {
    console.log('Updating transaction with data:', transactionData);
    
    // Build the payload to match what your backend expects
    const payload = {
      transactionType: transactionData.transactionType,
      
      // Customer/Supplier handling - only send the ID, not the full data
      ...(transactionData.customer && { customer: transactionData.customer }),
      ...(transactionData.supplier && { supplier: transactionData.supplier }),
      
      // Silver details from the first item or aggregated data
      silverDetails: transactionData.silverDetails || {
        purity: transactionData.items?.[0]?.purity || "925",
        weight: transactionData.items?.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0) || 0,
        ratePerGram: transactionData.items?.[0] ? Math.round(parseFloat(transactionData.items[0].ratePerGram || 0) * 100) : 0,
        makingCharges: Math.round(transactionData.items?.reduce((sum, item) => sum + parseFloat(item.makingCharges || 0), 0) * 100) || 0,
        wastage: parseFloat(transactionData.items?.[0]?.wastage || 0),
        taxAmount: Math.round(transactionData.items?.reduce((sum, item) => sum + parseFloat(item.taxAmount || 0), 0) * 100) || 0
      },
      
      // Payment handling - total advance amount (original + additional)
      advanceAmount: Math.round((transactionData.advanceAmount || 0) * 100),
      paymentMode: transactionData.paymentMode || "CASH",
      
      // Items array with proper structure
      items: (transactionData.items || []).map(item => ({
        name: item.name || item.itemName || "Silver Item",
        description: item.description || "",
        weight: parseFloat(item.weight || 0),
        purity: item.purity || "925",
        ratePerGram: Math.round(parseFloat(item.ratePerGram || 0) * 100), // Convert to paise
        makingCharges: Math.round(parseFloat(item.makingCharges || 0) * 100),
        wastage: parseFloat(item.wastage || 0),
        taxAmount: Math.round(parseFloat(item.taxAmount || 0) * 100),
        itemValue: Math.round(parseFloat(item.weight || 0) * parseFloat(item.ratePerGram || 0) * 100),
        photos: item.photos || [],
        hallmarkNumber: item.hallmarkNumber || '',
        certificateNumber: item.certificateNumber || ''
      })),
      
      // Additional transaction details
      notes: transactionData.notes || "",
      billNumber: transactionData.billNumber || "",
      
      // Additional payment tracking (if your backend supports it)
      ...(transactionData.additionalPayment && {
        additionalPayment: Math.round(parseFloat(transactionData.additionalPayment) * 100),
        additionalPaymentMode: transactionData.additionalPaymentMode
      })
    };
    
    console.log('Sending payload:', payload);
    
    const response = await this.put(`/api/silver/${id}`, payload);
    
    console.log('Update response:', response);
    
    return response;
  } catch (error) {
    console.error('Error updating silver transaction:', error);
    throw error;
  }
}
async getGoldTransactions(params = {}) {
    return this.get("/api/gold", params);
  }
  async deleteGoldTransaction(id) {
    return this.delete(`/api/gold/${id}`);
  }
  
   async getDailyAnalytics_gold() {
    return this.get("/api/gold/reports/daily-summary");
  }
  async getExpenses(params = {}) {
    return this.get('/api/business-expenses', params);
  }

  async createExpense(data) {
    // Ensure all required fields are present and properly formatted
    const expenseData = {
      category: data.category,
      subcategory: data.subcategory || undefined,
      title: data.title,
      description: data.description,
      vendor: {
        name: data.vendor.name,
        code: data.vendor.code || undefined,
        contact: data.vendor.contact || {},
        gstNumber: data.vendor.gstNumber || undefined
      },
      grossAmount: Math.round(data.grossAmount * 100), // Convert to paise
      taxDetails: {
        totalTax: Math.round((data.taxDetails?.totalTax || 0) * 100), // Convert to paise
        cgst: Math.round((data.taxDetails?.cgst || 0) * 100),
        sgst: Math.round((data.taxDetails?.sgst || 0) * 100),
        igst: Math.round((data.taxDetails?.igst || 0) * 100),
        cess: Math.round((data.taxDetails?.cess || 0) * 100)
      },
      netAmount: Math.round((data.grossAmount - (data.taxDetails?.totalTax || 0)) * 100), // Convert to paise
      paymentMethod: data.paymentMethod,
      expenseDate: data.expenseDate,
      referenceNumber: data.referenceNumber || undefined,
      paymentStatus: data.paymentStatus || 'PENDING',
      dueDate: data.dueDate || undefined,
      metadata: data.metadata || {}
    };

    return this.post('/api/business-expenses', expenseData);
  }

  // In your api.js file
// In api.js
async updateExpense(id, data) {
    console.log('API updateExpense called with:', { id, data });
    
    // Don't modify the data here - send it exactly as received from the form
    return this.put(`/api/business-expenses/${id}`, data);
}
  async deleteExpense(id) {
    return this.delete(`/api/business-expenses/${id}`);
  }

  async getExpenseDashboard() {
    return this.get('/api/business-expenses/dashboard');
  }

  async updateExpensePayment(id, paymentData) {
    return this.put(`/api/business-expenses/${id}/payment`, paymentData);
  }


 async getExpenseSummaryByCategory(params = {}) {
    return this.get('/api/business-expenses/summary/category', params);
  }

  async getMonthlyExpenseSummary(params = {}) {
    return this.get('/api/business-expenses/summary/monthly', params);
  }

  async getOverdueExpenses(params = {}) {
    return this.get('/api/business-expenses/overdue/list', params);
  }

  async getVendorExpenseSummary(params = {}) {
    return this.get('/api/business-expenses/summary/vendors', params);
  }



  // Static methods for Udhari (keeping for backward compatibility)
  static async giveUdhari(data) {
    try {
      const response = await axiosInstance.post('/api/udhari/give', {
        customer: data.customerId,
        principalPaise: Math.round(parseFloat(data.amount) * 100), // Convert to paise
        note: data.description,
        totalInstallments: data.totalInstallments || 1,
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null
      });

      return response.data;
    } catch (error) {
      console.error('Give Udhari API Error:', error);
      throw error;
    }
  }

  static async takeUdhari(data) {
    try {
      const response = await axiosInstance.post('/api/udhari/take', {
        customer: data.customerId,
        principalPaise: Math.round(parseFloat(data.amount) * 100),
        note: data.description,
        totalInstallments: data.totalInstallments || 1,
        returnDate: data.returnDate ? new Date(data.returnDate).toISOString() : null
      });

      return response.data;
    } catch (error) {
      console.error('Take Udhari API Error:', error);
      throw error;
    }
  }

  static async receiveUdhariPayment(data) {
    console.log('Receiving Udhari Payment with data:', data);
    try {
      const response = await axiosInstance.post('/api/udhari/receive-payment', {
        customer: data.customerId,
        principalPaise: Math.round(parseFloat(data.amount) * 100),
        sourceRef: data.sourceRef, // Original udhari transaction ID
        note: data.description,
        installmentNumber: data.installmentNumber || 1
      });

      return response.data;
    } catch (error) {
      console.error('Receive Udhari Payment API Error:', error);
      throw error;
    }
  }

  static async makeUdhariPayment(data) {
    try {
      const response = await axiosInstance.post('/api/udhari/make-payment', {
        customer: data.customerId,
        principalPaise: Math.round(parseFloat(data.amount) * 100),
        sourceRef: data.sourceRef,
        note: data.description,
        installmentNumber: data.installmentNumber || 1
      });

      return response.data;
    } catch (error) {
      console.error('Make Udhari Payment API Error:', error);
      throw error;
    }
  }

  async getCustomerUdhariSummary(customerId) {
    try {
      const response = await axiosInstance.get(`/api/udhari/customer/${customerId}`);
      console.log('Response:', response);
      return response.data;
    } catch (error) {
      console.error('Get Customer Udhari Summary API Error:', error);
      throw error;
    }
  }

  static async getOutstandingToCollect() {
    try {
      const response = await axiosInstance.get(`/api/udhari/outstanding/collect`);
      return response.data;
    } catch (error) {
      console.error('Get Outstanding To Collect API Error:', error);
      throw error;
    }
  }

  static async getOutstandingToPay() {
    try {
      const response = await axiosInstance.get(`/api/udhari/outstanding/pay`);
      return response.data;
    } catch (error) {
      console.error('Get Outstanding To Pay API Error:', error);
      throw error;
    }
  }

  static async getUdhariSummary() {
    try {
      const response = await axiosInstance.get(`/api/udhari/summary`);
      return response.data;
    } catch (error) {
      console.error('Get Udhari Summary API Error:', error);
      throw error;
    }
  }

  static async getUdhariPaymentHistory(udhariId) {
    try {
      const response = await axiosInstance.get(`/api/udhari/payment-history/${udhariId}`);
      return response.data;
    } catch (error) {
      console.error('Get Udhari Payment History API Error:', error);
      throw error;
    }
  }

  // Utility methods
  calculateDueDate(startDate, durationMonths) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(durationMonths));
    return date.toISOString();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  paiseToRupees(paise) {
    return paise / 100;
  }

  rupeesToPaise(rupees) {
    return Math.round(parseFloat(rupees) * 100);
  }
}

const apiService = new ApiService();
export default apiService;
export { apiService as ApiService };
