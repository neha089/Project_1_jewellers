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

  async createGoldTransaction(transactionData) {
    return this.post("/api/gold/", transactionData);
  }
  async createSilverTransaction (transactionData) {
    return this.post("/api/silver/", transactionData);
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
  async createGoldLoan(loanData) {
    return this.post("/api/gold-loans/", {
      customer: loanData.customerId,
      items: loanData.items.map((item) => ({
        name: item.name || "Gold Item",
        weightGram: parseFloat(item.weightGram),
        amountPaise: Math.round(parseFloat(item.amountPaise) * 100),
        purityK: parseInt(item.purityK),
        images: item.images || [],
      })),
      interestRateMonthlyPct: parseFloat(loanData.interestRate),
      principalPaise: Math.round(parseFloat(loanData.totalAmount) * 100),
      startDate: loanData.date,
      dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
      status: "ACTIVE",
    });
  }

  async getPaymentHistory(filters = {}) {
    const params = {};
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.customer) params.customer = filters.customer;
    if (filters.month) params.month = filters.month.toString();
    if (filters.year) params.year = filters.year.toString();
    
    return this.get(`/api/gold-loans/payments/history`, params);
  }

  async getDashboardStats() {
    return this.get("/api/dashboard/stats");
  }

  async getGoldLoanInterestSummary(loanId) {
    return this.get(`/api/gold-loans/${loanId}/interest-summary`);
  }

  async getAllTransactions() {
    return this.get(`/api/transactions`);
  }

  async getGoldLoanPaymentHistory(loanId) {
    return this.get(`/api/gold-loans/${loanId}/payment-history`);
  }

  async makeGoldLoanPayment(loanId, paymentData) {
    return this.post(`/api/gold-loans/${loanId}/payments`, {
      principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
      interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
      forMonth: paymentData.forMonth || this.getCurrentMonth(),
      photos: paymentData.photos || [],
      notes: paymentData.notes || "",
    });
  }

  async processGoldLoanRepayment(repaymentData) {
    try {
      console.log('API Service - Processing repayment:', repaymentData);
      
      const response = await this.post(
        `/api/gold-loans/${repaymentData.loanId}/process-repayment`,
        {
          // Support multiple field names for backward compatibility
          selectedItemIds: repaymentData.returnedItems || repaymentData.selectedItemIds || [],
          returnedItemIds: repaymentData.returnedItems || repaymentData.selectedItemIds || [], // Alternative field name
          
          // Cash payment in multiple formats
          repaymentAmount: repaymentData.cashPayment || repaymentData.repaymentAmount || 0,
          cashPayment: repaymentData.cashPayment || repaymentData.repaymentAmount || 0,
          cashPaymentPaise: repaymentData.cashPaymentPaise || 
            Math.round((repaymentData.cashPayment || repaymentData.repaymentAmount || 0) * 100),
          
          // Additional fields
          notes: repaymentData.notes || "Gold loan repayment processed",
          summary: repaymentData.summary,
          photos: repaymentData.photos || [],
          autoSelectItems: repaymentData.autoSelectItems || false
        }
      );
  
      console.log('API Service - Repayment response:', response);
      return response;
    } catch (error) {
      console.error('API Service - Repayment error:', error);
      throw error;
    }
  }
  
  // Alternative method name for consistency
  async makeGoldLoanRepayment(loanId, repaymentData) {
    return this.processGoldLoanRepayment({
      loanId,
      ...repaymentData
    });
  }

  async makeGoldLoanInterestPayment(loanId, interestAmount, notes = "") {
    return this.post(`/api/gold-loans/${loanId}/interest-payment`, {
      interestPaise: Math.round(parseFloat(interestAmount) * 100),
      notes: notes,
      forMonth: this.getCurrentMonth(),
    });
  }

  async completeGoldLoan(loanId, completionData = {}) {
    return this.put(`/api/gold-loans/${loanId}/complete`, {
      finalPaymentPaise: Math.round((completionData.finalPayment || 0) * 100),
      photos: completionData.photos || [],
      notes: completionData.notes || "Loan completed - all gold returned to customer",
    });
  }

  async addGoldLoanItems(loanId, items) {
    return this.post(`/api/gold-loans/${loanId}/items`, {
      items: items.map((item) => ({
        name: item.name || "Gold Item",
        weightGram: parseFloat(item.weightGram),
        amountPaise: Math.round(parseFloat(item.amount) * 100),
        purityK: parseInt(item.purityK),
        images: item.images || [],
      })),
    });
  }

  async updateGoldLoanItem(loanId, itemId, itemData) {
    return this.put(`/api/gold-loans/${loanId}/items/${itemId}`, {
      name: itemData.name,
      weightGram: parseFloat(itemData.weightGram),
      amountPaise: Math.round(parseFloat(itemData.amount) * 100),
      purityK: parseInt(itemData.purityK),
      images: itemData.images || [],
    });
  }

  async removeGoldLoanItem(loanId, itemId) {
    return this.delete(`/api/gold-loans/${loanId}/items/${itemId}`);
  }

  async validateGoldLoanClosure(loanId) {
    return this.get(`/api/gold-loans/${loanId}/validate-closure`);
  }

  async getGoldLoanOutstanding(loanId) {
    return this.get(`/api/gold-loans/${loanId}/outstanding-summary`);
  }

  async closeGoldLoan(loanId, closureData = {}) {
    return this.put(`/api/gold-loans/${loanId}/close`, {
      closureImages: closureData.photos || [],
      notes: closureData.notes || "Loan closed",
    });
  }

  async returnGoldLoanItems(loanId, itemIds, returnData = {}) {
    return this.post(`/api/gold-loans/${loanId}/return-items`, {
      itemIds,
      returnImages: returnData.photos || [],
      notes: returnData.notes || "",
    });
  }

  async getGoldLoan(loanId) {
    return this.get(`/api/gold-loans/${loanId}`);
  }

  async getGoldLoanReport(loanId) {
    return this.get(`/api/gold-loans/${loanId}/report`);
  }

  async getAllGoldLoans(filters = {}) {
    const params = {};
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();
    if (filters.status) params.status = filters.status;
    if (filters.customer) params.customer = filters.customer;
    
    return this.get(`/api/gold-loans`, params);
  }

  async getCustomerGoldLoanSummary(customerId) {
    return this.get(`/api/gold-loans/customer/${customerId}/summary`);
  }

  async getPendingInterest() {
    return this.get("/api/gold-loans/analytics/pending-interest");
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

  async makeLoanPayment(loanId, paymentData) {
    return this.post(`/api/loans/${loanId}/payments`, {
      principal: paymentData.principal || 0,  // Send as number, not paise
      interest: paymentData.interest || 0,    // Send as number, not paise
      photos: paymentData.photos || [],
      notes: paymentData.notes || "",
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
  async giveUdhari(udhariData) {
    return this.post("/api/udhari/give", {
      customer: udhariData.customerId,
      principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
      note: udhariData.description,
      totalInstallments: parseInt(udhariData.installments || 1),
    });
  }

  async receiveUdhariPayment(paymentData) {
    return this.post("/api/udhari/receive-payment", {
      customer: paymentData.customerId,
      principalPaise: Math.round(parseFloat(paymentData.amount) * 100),
      sourceRef: paymentData.sourceRef,  // ✅ Fixed: use sourceRef instead of udhariId
      note: paymentData.description,
      installmentNumber: parseInt(paymentData.installmentNumber || 1),
    });
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
