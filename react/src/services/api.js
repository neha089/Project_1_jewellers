// api.js - API Service Layer
const BASE_URL =  'http://localhost:3000';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Customer APIs
  async createCustomer(customerData) {
    return this.request('/api/customers/', {
      method: 'POST',
      body: {
        name: customerData.name,
        phone: customerData.phone,
        address: {
          street: customerData.address,
          city: customerData.city,
          state: customerData.state,
          pincode: customerData.pinCode
        },
        adhaarNumber: customerData.idProofNumber,
        email: customerData.email,
        city: customerData.city,
        state: customerData.state,
        pincode: customerData.pinCode,
        totalAmountTakenFromJewellers: 0,
        totalAmountTakenByUs: 0,
        status: 'active'
      }
    });
  }

  async searchCustomers(search = '', page = 1, limit = 10, status = 'active') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      status
    });
    return this.request(`/api/customers/?${params}`);
  }

  // Metal Sale APIs
  async createMetalSale(saleData) {
    return this.request('/api/metal-sales/', {
      method: 'POST',
      body: {
        customer: saleData.customerId,
        metal: saleData.metal.toUpperCase(),
        weightGram: parseFloat(saleData.weight),
        amountPaise: Math.round(parseFloat(saleData.amount) * 100),
        ratePerGramPaise: Math.round(parseFloat(saleData.rate) * 100),
        purityK: parseInt(saleData.purity),
        date: saleData.date
      }
    });
  }

  // Gold Loan APIs
  async createGoldLoan(loanData) {
    return this.request('/api/gold-loans/', {
      method: 'POST',
      body: {
        customer: loanData.customerId,
        items: [{
          name: loanData.description || 'Gold Item',
          weightGram: parseFloat(loanData.goldWeight),
          amountPaise: Math.round(parseFloat(loanData.amount) * 100),
          purityK: parseInt(loanData.goldType.replace('K', '')),
          images: loanData.photos || []
        }],
        interestRateMonthlyPct: parseFloat(loanData.interestRate),
        principalPaise: Math.round(parseFloat(loanData.amount) * 100),
        startDate: loanData.date,
        dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
        status: 'ACTIVE'
      }
    });
  }

  async makeGoldLoanPayment(loanId, paymentData) {
    return this.request(`/api/gold-loans/${loanId}/payments`, {
      method: 'POST',
      body: {
        principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
        interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
        photos: paymentData.photos || []
      }
    });
  }

  // Regular Loan APIs
  async createLoan(loanData, direction) {
    return this.request('/api/loans/', {
      method: 'POST',
      body: {
        customer: loanData.customerId,
        principalPaise: Math.round(parseFloat(loanData.amount) * 100),
        interestRateMonthlyPct: parseFloat(loanData.interestRate),
        startDate: loanData.date,
        dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
        status: 'ACTIVE',
        direction: direction, // -1 for given, 1 for taken
        note: loanData.description
      }
    });
  }

  async makeLoanInterestPayment(loanId, interestAmount) {
    return this.request(`/api/loans/${loanId}/interest-payment`, {
      method: 'POST',
      body: {
        interestPaise: Math.round(parseFloat(interestAmount) * 100)
      }
    });
  }

  // Udhari APIs
  async giveUdhari(udhariData) {
    return this.request('/api/udhari/give', {
      method: 'POST',
      body: {
        customer: udhariData.customerId,
        principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
        note: udhariData.description,
        totalInstallments: parseInt(udhariData.installments || 1)
      }
    });
  }

  async receiveUdhariPayment(paymentData) {
    return this.request('/api/udhari/receive', {
      method: 'POST',
      body: {
        customer: paymentData.customerId,
        principalPaise: Math.round(parseFloat(paymentData.amount) * 100),
        sourceRef: paymentData.udhariId,
        note: paymentData.description,
        installmentNumber: parseInt(paymentData.installmentNumber || 1)
      }
    });
  }

  // Gold Purchase APIs
  async createGoldPurchase(purchaseData) {
    return this.request('/api/gold-purchases/', {
      method: 'POST',
      body: {
        partyName: purchaseData.partyName,
        items: [{
          name: purchaseData.description || 'Gold Item',
          weightGram: parseFloat(purchaseData.goldWeight),
          amountPaise: Math.round(parseFloat(purchaseData.amount) * 100),
          purityK: parseInt(purchaseData.goldType.replace('K', '')),
          metal: purchaseData.metal.toUpperCase()
        }],
        totalPaise: Math.round(parseFloat(purchaseData.amount) * 100),
        date: purchaseData.date
      }
    });
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  }

  // Utility methods
  calculateDueDate(startDate, durationMonths) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(durationMonths));
    return date.toISOString();
  }

  // Convert paise to rupees
  paiseToRupees(paise) {
    return paise / 100;
  }

  // Convert rupees to paise
  rupeesToPaise(rupees) {
    return Math.round(parseFloat(rupees) * 100);
  }
}

export default new ApiService();