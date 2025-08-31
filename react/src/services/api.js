// // api.js - Fixed API Service Layer with Better Search
// const BASE_URL = "http://localhost:3000";

// class ApiService {
//   async request(endpoint, options = {}) {
//     const url = `${BASE_URL}${endpoint}`;
//     const config = {
//       headers: {
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//       ...options,
//     };

//     if (config.body && typeof config.body === "object") {
//       config.body = JSON.stringify(config.body);
//     }

//     try {
//       console.log("Making API request:", url, config);
//       const response = await fetch(url, config);
//       const data = await response.json();

//       console.log("API Response:", data);

//       if (!response.ok) {
//         throw new Error(
//           data.message || `HTTP error! status: ${response.status}`
//         );
//       }

//       return data;
//     } catch (error) {
//       console.error("API request failed:", error);
//       throw error;
//     }
//   }

//   // Enhanced customer search with better parameter handling
//   async searchCustomers(search = "", page = 1, limit = 50, status = "active") {
//     // Clean and validate search term
//     const cleanSearch = search ? search.trim() : "";

//     console.log("Searching customers with params:", {
//       search: cleanSearch,
//       page,
//       limit,
//       status,
//     });

//     // Build query parameters properly
//     const params = new URLSearchParams();

//     if (cleanSearch) {
//       params.append("search", cleanSearch);
//     }
//     params.append("page", page.toString());
//     params.append("limit", limit.toString());
//     params.append("status", status);

//     const queryString = params.toString();
//     const endpoint = `/api/customers${queryString ? "?" + queryString : ""}`;

//     console.log("Final endpoint:", endpoint);

//     try {
//       const response = await this.request(endpoint);

//       // If API doesn't support search properly, implement client-side filtering
//       if (response.success && cleanSearch && response.data?.customers) {
//         const customers = response.data.customers;

//         // Client-side filtering as fallback (remove this once backend search works)
//         const filtered = customers.filter((customer) => {
//           const searchLower = cleanSearch.toLowerCase();

//           // Search in name
//           if (
//             customer.name &&
//             customer.name.toLowerCase().includes(searchLower)
//           ) {
//             return true;
//           }

//           // Search in phone
//           if (
//             customer.phone &&
//             customer.phone.toLowerCase().includes(searchLower)
//           ) {
//             return true;
//           }

//           // Search in email
//           if (
//             customer.email &&
//             customer.email.toLowerCase().includes(searchLower)
//           ) {
//             return true;
//           }

//           // Search in address fields
//           if (customer.address) {
//             const address = customer.address;
//             const addressFields = [
//               address.street,
//               address.city,
//               address.state,
//               address.pincode?.toString(),
//             ].filter(Boolean);

//             return addressFields.some((field) =>
//               field.toLowerCase().includes(searchLower)
//             );
//           }

//           // Search in city and state (if they're top-level fields)
//           if (
//             customer.city &&
//             customer.city.toLowerCase().includes(searchLower)
//           ) {
//             return true;
//           }

//           if (
//             customer.state &&
//             customer.state.toLowerCase().includes(searchLower)
//           ) {
//             return true;
//           }

//           // Search in adhaar number
//           if (
//             customer.adhaarNumber &&
//             customer.adhaarNumber.toString().includes(searchLower)
//           ) {
//             return true;
//           }

//           return false;
//         });

//         console.log(
//           `Client-side filtered: ${filtered.length} from ${customers.length} customers`
//         );

//         return {
//           ...response,
//           data: {
//             ...response.data,
//             customers: filtered,
//           },
//         };
//       }

//       return response;
//     } catch (error) {
//       console.error("Search request failed:", error);
//       throw error;
//     }
//   }

//   // Customer APIs
//   async createCustomer(customerData) {
//     console.log("Creating customer:", customerData);
//     return this.request("/api/customers/", {
//       method: "POST",
//       body: {
//         name: customerData.name,
//         phone: customerData.phone,
//         address: {
//           street: customerData.address.street,
//           city: customerData.address.city,
//           state: customerData.address.state,
//           pincode: customerData.address.pinCode,
//         },
//         adhaarNumber: customerData.idProof.number,
//         email: customerData.email,
//         city: customerData.address.city,
//         state: customerData.address.state,
//         pincode: customerData.address.pinCode,
//         totalAmountTakenFromJewellers: 0,
//         totalAmountTakenByUs: 0,
//         status: "active",
//       },
//     });
//   }
// async getGoldLoansByCustomer(customerId) {
//   return this.request(`/api/gold-loans/customer/${customerId}`, {
//     method: "GET",
//   });
// }
//   // Get all customers (useful for debugging)
//   async getAllCustomers(page = 1, limit = 100) {
//     const params = new URLSearchParams({
//       page: page.toString(),
//       limit: limit.toString(),
//     });
//     return this.request(`/api/customers/?${params}`);
//   }

//   // Test search functionality
//   async testSearch() {
//     try {
//       console.log("Testing search functionality...");

//       // First, get all customers to see what's available
//       const allCustomers = await this.getAllCustomers();
//       console.log("All customers:", allCustomers);

//       if (allCustomers.success && allCustomers.data?.customers?.length > 0) {
//         const firstCustomer = allCustomers.data.customers[0];
//         console.log(
//           "Testing search with first customer name:",
//           firstCustomer.name
//         );

//         // Test search with first customer's name
//         if (firstCustomer.name) {
//           const searchResult = await this.searchCustomers(firstCustomer.name);
//           console.log("Search result:", searchResult);
//         }
//       }

//       return allCustomers;
//     } catch (error) {
//       console.error("Test search failed:", error);
//       throw error;
//     }
//   }

//   // Metal Sale APIs
//   async createMetalSale(saleData) {
//     return this.request("/api/metal-sales/", {
//       method: "POST",
//       body: {
//         customer: saleData.customerId,
//         metal: saleData.metal.toUpperCase(),
//         weightGram: parseFloat(saleData.weight),
//         amountPaise: Math.round(parseFloat(saleData.amount) * 100),
//         ratePerGramPaise: Math.round(parseFloat(saleData.rate) * 100),
//         purityK: parseInt(saleData.purity),
//         date: saleData.date,
//       },
//     });
//   }
//  async createGoldLoan(loanData) {
//     return this.request("/api/gold-loans/", {
//       method: "POST",
//       body: {
//         customer: loanData.customerId,
//         items: loanData.items.map(item => ({
//           name: item.name || "Gold Item",
//           weightGram: parseFloat(item.weightGram),
//           amountPaise: Math.round(parseFloat(item.amount) * 100),
//           purityK: parseInt(item.purityK),
//           images: item.images || [],
//         })),
//         interestRateMonthlyPct: parseFloat(loanData.interestRate),
//         principalPaise: Math.round(parseFloat(loanData.totalAmount) * 100),
//         startDate: loanData.date,
//         dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
//         status: "ACTIVE",
//       },
//     });
//   }

//   // NEW: Add items to existing gold loan
//   async addGoldLoanItems(loanId, items) {
//     return this.request(`/api/gold-loans/${loanId}/items`, {
//       method: "POST",
//       body: {
//         items: items.map(item => ({
//           name: item.name || "Gold Item",
//           weightGram: parseFloat(item.weightGram),
//           amountPaise: Math.round(parseFloat(item.amount) * 100),
//           purityK: parseInt(item.purityK),
//           images: item.images || [],
//         }))
//       },
//     });
//   }

//   // NEW: Update specific item
//   async updateGoldLoanItem(loanId, itemId, itemData) {
//     return this.request(`/api/gold-loans/${loanId}/items/${itemId}`, {
//       method: "PUT",
//       body: {
//         name: itemData.name,
//         weightGram: parseFloat(itemData.weightGram),
//         amount: parseFloat(itemData.amount),
//         purityK: parseInt(itemData.purityK),
//         images: itemData.images || [],
//       },
//     });
//   }

//   // NEW: Remove specific item
//   async removeGoldLoanItem(loanId, itemId) {
//     return this.request(`/api/gold-loans/${loanId}/items/${itemId}`, {
//       method: "DELETE",
//     });
//   }

//   // Enhanced payment methods
//   async makeGoldLoanPayment(loanId, paymentData) {
//     return this.request(`/api/gold-loans/${loanId}/payments`, {
//       method: "POST",
//       body: {
//         principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
//         interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
//         forMonth: paymentData.forMonth || this.getCurrentMonth(),
//         photos: paymentData.photos || [],
//         notes: paymentData.notes || '',
//       },
//     });
//   }

//   // NEW: Interest-only payment
//   async makeGoldLoanInterestPayment(loanId, interestAmount, notes = '') {
//     return this.request(`/api/gold-loans/${loanId}/interest-payment`, {
//       method: "POST",
//       body: {
//         interestPaise: Math.round(parseFloat(interestAmount) * 100),
//         notes: notes,
//       },
//     });
//   }

//   // NEW: Complete gold loan (customer returns all money, gets gold back)
//   async completeGoldLoan(loanId, completionData = {}) {
//     return this.request(`/api/gold-loans/${loanId}/complete`, {
//       method: "PUT",
//       body: {
//         finalPayment: completionData.finalPayment || 0,
//         photos: completionData.photos || [],
//         notes: completionData.notes || 'Loan completed - gold returned to customer',
//       },
//     });
//   }

//   // NEW: Validate loan closure
//   async validateGoldLoanClosure(loanId) {
//     return this.request(`/api/gold-loans/${loanId}/validate-closure`);
//   }

//   // NEW: Get outstanding summary
//   async getGoldLoanOutstanding(loanId) {
//     return this.request(`/api/gold-loans/${loanId}/outstanding-summary`);
//   }

//   // Enhanced loan management
//   async closeGoldLoan(loanId, closureData = {}) {
//     return this.request(`/api/gold-loans/${loanId}/close`, {
//       method: "PUT",
//       body: {
//         closureImages: closureData.photos || [],
//         notes: closureData.notes || 'Loan closed',
//       },
//     });
//   }

//   async returnGoldLoanItems(loanId, itemIds, returnData = {}) {
//     return this.request(`/api/gold-loans/${loanId}/return-items`, {
//       method: "POST",
//       body: {
//         itemIds,
//         returnImages: returnData.photos || [],
//         notes: returnData.notes || '',
//       },
//     });
//   }

//   // Get loan details and reports
//   async getGoldLoan(loanId) {
//     return this.request(`/api/gold-loans/${loanId}`);
//   }

//   async getGoldLoanReport(loanId) {
//     return this.request(`/api/gold-loans/${loanId}/report`);
//   }

//   async getAllGoldLoans(filters = {}) {
//     const params = new URLSearchParams();
    
//     if (filters.page) params.append('page', filters.page.toString());
//     if (filters.limit) params.append('limit', filters.limit.toString());
//     if (filters.status) params.append('status', filters.status);
//     if (filters.customer) params.append('customer', filters.customer);

//     const queryString = params.toString();
//     return this.request(`/api/gold-loans${queryString ? '?' + queryString : ''}`);
//   }

//   async getCustomerGoldLoanSummary(customerId) {
//     return this.request(`/api/gold-loans/customer/${customerId}/summary`);
//   }

//   // Payment history and analytics
//   async getPaymentHistory(filters = {}) {
//     const params = new URLSearchParams();
    
//     if (filters.page) params.append('page', filters.page.toString());
//     if (filters.limit) params.append('limit', filters.limit.toString());
//     if (filters.customer) params.append('customer', filters.customer);
//     if (filters.month) params.append('month', filters.month.toString());
//     if (filters.year) params.append('year', filters.year.toString());

//     const queryString = params.toString();
//     return this.request(`/api/gold-loans/payments/history${queryString ? '?' + queryString : ''}`);
//   }

//   async getPendingInterest() {
//     return this.request('/api/gold-loans/analytics/pending-interest');
//   }

//   async getDashboardStats() {
//     return this.request('/api/gold-loans/analytics/dashboard');
//   }

 
  
//   // Regular Loan APIs
//   async createLoan(loanData, direction) {
//     return this.request("/api/loans/", {
//       method: "POST",
//       body: {
//         customer: loanData.customerId,
//         principalPaise: Math.round(parseFloat(loanData.amount) * 100),
//         interestRateMonthlyPct: parseFloat(loanData.interestRate),
//         startDate: loanData.date,
//         dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
//         status: "ACTIVE",
//         direction: direction, // -1 for given, 1 for taken
//         note: loanData.description,
//       },
//     });
//   }

//   async makeLoanInterestPayment(loanId, interestAmount) {
//     return this.request(`/api/loans/${loanId}/interest-payment`, {
//       method: "POST",
//       body: {
//         interestPaise: Math.round(parseFloat(interestAmount) * 100),
//       },
//     });
//   }
  

//   // Udhari APIs
//   async giveUdhari(udhariData) {
//     return this.request("/api/udhari/give", {
//       method: "POST",
//       body: {
//         customer: udhariData.customerId,
//         principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
//         note: udhariData.description,
//         totalInstallments: parseInt(udhariData.installments || 1),
//       },
//     });
//   }

//   async receiveUdhariPayment(paymentData) {
//     return this.request("/api/udhari/receive", {
//       method: "POST",
//       body: {
//         customer: paymentData.customerId,
//         principalPaise: Math.round(parseFloat(paymentData.amount) * 100),
//         sourceRef: paymentData.udhariId,
//         note: paymentData.description,
//         installmentNumber: parseInt(paymentData.installmentNumber || 1),
//       },
//     });
//   }

//   // Gold Purchase APIs
//   async createGoldPurchase(purchaseData) {
//     return this.request("/api/gold-purchases/", {
//       method: "POST",
//       body: {
//         partyName: purchaseData.partyName,
//         items: [
//           {
//             name: purchaseData.description || "Gold Item",
//             weightGram: parseFloat(purchaseData.goldWeight),
//             amountPaise: Math.round(parseFloat(purchaseData.amount) * 100),
//             purityK: parseInt(purchaseData.goldType.replace("K", "")),
//             metal: purchaseData.metal.toUpperCase(),
//           },
//         ],
//         totalPaise: Math.round(parseFloat(purchaseData.amount) * 100),
//         date: purchaseData.date,
//       },
//     });
//   }

//   // Dashboard APIs
//   async getDashboardStats() {
//     return this.request("/api/dashboard/stats");
//   }

//   // Utility methods
//   calculateDueDate(startDate, durationMonths) {
//     const date = new Date(startDate);
//     date.setMonth(date.getMonth() + parseInt(durationMonths));
//     return date.toISOString();
//   }

//   // Convert paise to rupees
//   paiseToRupees(paise) {
//     return paise / 100;
//   }

//   // Convert rupees to paise
//   rupeesToPaise(rupees) {
//     return Math.round(parseFloat(rupees) * 100);
//   }
// }

// export default new ApiService();
// api.js - Fixed API Service Layer with Better Error Handling
const BASE_URL = "http://localhost:3000";

class ApiService {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      timeout: 30000, // 30 seconds timeout
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`API Request [${config.method || 'GET'}]:`, url, config.body ? JSON.parse(config.body) : 'no body');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }

      console.log("API Response:", response.status, data);

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `HTTP error! status: ${response.status}`
        );
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
        ...data
      };
    } catch (error) {
      console.error(`API request failed (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors, but not for client errors (4xx)
      if (retryCount < this.maxRetries && 
          (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
        console.log(`Retrying request in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retryCount + 1)));
        return this.request(endpoint, options, retryCount + 1);
      }
      
      return {
        success: false,
        error: error.message,
        message: error.message
      };
    }
  }

  // Enhanced customer search with better parameter handling
  async searchCustomers(search = "", page = 1, limit = 50, status = "active") {
    const cleanSearch = search ? search.trim() : "";

    console.log("Searching customers with params:", {
      search: cleanSearch,
      page,
      limit,
      status,
    });

    const params = new URLSearchParams();

    if (cleanSearch) {
      params.append("search", cleanSearch);
    }
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("status", status);

    const queryString = params.toString();
    const endpoint = `/api/customers${queryString ? "?" + queryString : ""}`;

    const response = await this.request(endpoint);
    
    if (!response.success) {
      return response;
    }

    // Client-side filtering as fallback if server search doesn't work properly
    if (cleanSearch && response.data?.customers) {
      const customers = response.data.customers;
      const searchLower = cleanSearch.toLowerCase();

      const filtered = customers.filter((customer) => {
        // Search in multiple fields
        const searchFields = [
          customer.name,
          customer.phone,
          customer.email,
          customer.address?.street,
          customer.address?.city,
          customer.address?.state,
          customer.address?.pincode?.toString(),
          customer.city,
          customer.state,
          customer.adhaarNumber?.toString()
        ].filter(Boolean);

        return searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
      });

      console.log(`Filtered: ${filtered.length} from ${customers.length} customers`);

      return {
        ...response,
        data: {
          ...response.data,
          customers: filtered,
        },
      };
    }

    return response;
  }

  // Customer APIs
  async createCustomer(customerData) {
    console.log("Creating customer:", customerData);
    return this.request("/api/customers/", {
      method: "POST",
      body: {
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
      },
    });
  }

  async getGoldLoansByCustomer(customerId) {
    if (!customerId) {
      return { success: false, error: "Customer ID is required" };
    }
    return this.request(`/api/gold-loans/customer/${customerId}`, {
      method: "GET",
    });
  }

  async getLoansByCustomer(customerId) {
    if (!customerId) {
      return { success: false, error: "Customer ID is required" };
    }
    return this.request(`/api/loans/customer/${customerId}`, {
      method: "GET",
    });
  }

  async getAllCustomers(page = 1, limit = 100) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/api/customers/?${params}`);
  }

  // Gold Loan APIs with better error handling
  async createGoldLoan(loanData) {
    if (!loanData.customerId || !loanData.items?.length) {
      return { success: false, error: "Customer ID and items are required" };
    }

    return this.request("/api/gold-loans/", {
      method: "POST",
      body: {
        customer: loanData.customerId,
        items: loanData.items.map(item => ({
          name: item.name || "Gold Item",
          weightGram: parseFloat(item.weightGram || item.weight),
          amountPaise: Math.round(parseFloat(item.amount) * 100),
          purityK: parseInt(item.purityK || item.purity),
          images: item.images || [],
        })),
        interestRateMonthlyPct: parseFloat(loanData.interestRate),
        principalPaise: Math.round(parseFloat(loanData.totalAmount) * 100),
        startDate: loanData.date,
        dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths || 6),
        status: "ACTIVE",
        notes: loanData.notes || 'Gold loan created',
      },
    });
  }

  async getGoldLoan(loanId) {
    if (!loanId) {
      return { success: false, error: "Loan ID is required" };
    }
    return this.request(`/api/gold-loans/${loanId}`);
  }

  async makeGoldLoanInterestPayment(loanId, interestAmount, forMonth = null, partialPayment = false, notes = '') {
    if (!loanId || !interestAmount) {
      return { success: false, error: "Loan ID and interest amount are required" };
    }

    return this.request(`/api/gold-loans/${loanId}/interest-payment`, {
      method: "POST",
      body: {
        interestPaise: Math.round(parseFloat(interestAmount) * 100),
        forMonth: forMonth,
        partialPayment: partialPayment,
        notes: notes,
      },
    });
  }

  async makeGoldLoanPayment(loanId, paymentData) {
    if (!loanId || !paymentData) {
      return { success: false, error: "Loan ID and payment data are required" };
    }

    return this.request(`/api/gold-loans/${loanId}/payments`, {
      method: "POST",
      body: {
        principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
        interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
        photos: paymentData.photos || [],
        notes: paymentData.notes || '',
      },
    });
  }

  async processItemBasedRepayment(loanId, repaymentData) {
    if (!loanId || !repaymentData) {
      return { success: false, error: "Loan ID and repayment data are required" };
    }

    return this.request(`/api/gold-loans/${loanId}/item-repayment`, {
      method: "POST",
      body: {
        amountPaise: Math.round(parseFloat(repaymentData.amount || 0) * 100),
        selectedItemIds: repaymentData.selectedItemIds || [],
        returnSelectedItems: repaymentData.returnSelectedItems || false,
        photos: repaymentData.photos || [],
        notes: repaymentData.notes || '',
      },
    });
  }

  async getInterestHistory(loanId) {
    if (!loanId) {
      return { success: false, error: "Loan ID is required" };
    }
    return this.request(`/api/gold-loans/${loanId}/interest-history`);
  }

  async getRepaymentOptions(loanId, amount) {
    if (!loanId) {
      return { success: false, error: "Loan ID is required" };
    }

    const params = new URLSearchParams();
    if (amount) params.append('amount', amount.toString());
    
    return this.request(`/api/gold-loans/${loanId}/repayment-options${params.toString() ? '?' + params : ''}`);
  }

  // Regular Loan APIs
  async createLoan(loanData, direction) {
    if (!loanData.customerId || !loanData.amount) {
      return { success: false, error: "Customer ID and amount are required" };
    }

    return this.request("/api/loans/", {
      method: "POST",
      body: {
        customer: loanData.customerId,
        principalPaise: Math.round(parseFloat(loanData.amount) * 100),
        interestRateMonthlyPct: parseFloat(loanData.interestRate || 2.5),
        startDate: loanData.date,
        dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths || 6),
        status: "ACTIVE",
        direction: direction, // -1 for given, 1 for taken
        note: loanData.description || '',
      },
    });
  }

  async getLoan(loanId) {
    if (!loanId) {
      return { success: false, error: "Loan ID is required" };
    }
    return this.request(`/api/loans/${loanId}`);
  }

  async makeLoanInterestPayment(loanId, interestAmount, notes = '') {
    if (!loanId || !interestAmount) {
      return { success: false, error: "Loan ID and interest amount are required" };
    }

    return this.request(`/api/loans/${loanId}/interest-payment`, {
      method: "POST",
      body: {
        interestPaise: Math.round(parseFloat(interestAmount) * 100),
        notes: notes,
      },
    });
  }

  async makeLoanPayment(loanId, paymentData) {
    if (!loanId || !paymentData) {
      return { success: false, error: "Loan ID and payment data are required" };
    }

    return this.request(`/api/loans/${loanId}/payments`, {
      method: "POST",
      body: {
        principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
        interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
        notes: paymentData.notes || '',
      },
    });
  }

  // Udhari APIs
  async giveUdhari(udhariData) {
    if (!udhariData.customerId || !udhariData.amount) {
      return { success: false, error: "Customer ID and amount are required" };
    }

    return this.request("/api/udhari/give", {
      method: "POST",
      body: {
        customer: udhariData.customerId,
        principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
        note: udhariData.description || '',
        totalInstallments: parseInt(udhariData.installments || 1),
      },
    });
  }

  async receiveUdhariPayment(paymentData) {
    if (!paymentData.customerId || !paymentData.amount) {
      return { success: false, error: "Customer ID and amount are required" };
    }

    return this.request("/api/udhari/receive", {
      method: "POST",
      body: {
        customer: paymentData.customerId,
        principalPaise: Math.round(parseFloat(paymentData.amount) * 100),
        sourceRef: paymentData.udhariId,
        note: paymentData.description || '',
        installmentNumber: parseInt(paymentData.installmentNumber || 1),
      },
    });
  }

  // Metal Sale APIs
  async createMetalSale(saleData) {
    if (!saleData.customerId || !saleData.weight || !saleData.amount) {
      return { success: false, error: "Customer ID, weight, and amount are required" };
    }

    return this.request("/api/metal-sales/", {
      method: "POST",
      body: {
        customer: saleData.customerId,
        metal: saleData.metal.toUpperCase(),
        weightGram: parseFloat(saleData.weight),
        amountPaise: Math.round(parseFloat(saleData.amount) * 100),
        ratePerGramPaise: Math.round(parseFloat(saleData.rate || 0) * 100),
        purityK: parseInt(saleData.purity || 22),
        date: saleData.date,
      },
    });
  }

  // Gold Purchase APIs
  async createGoldPurchase(purchaseData) {
    if (!purchaseData.partyName || !purchaseData.goldWeight || !purchaseData.amount) {
      return { success: false, error: "Party name, weight, and amount are required" };
    }

    return this.request("/api/gold-purchases/", {
      method: "POST",
      body: {
        partyName: purchaseData.partyName,
        items: [
          {
            name: purchaseData.description || "Gold Item",
            weightGram: parseFloat(purchaseData.goldWeight),
            amountPaise: Math.round(parseFloat(purchaseData.amount) * 100),
            purityK: parseInt(purchaseData.goldType?.replace("K", "") || 22),
            metal: purchaseData.metal?.toUpperCase() || 'GOLD',
          },
        ],
        totalPaise: Math.round(parseFloat(purchaseData.amount) * 100),
        date: purchaseData.date,
      },
    });
  }

  // Gold Price APIs
  async getCurrentGoldPrices() {
    return this.request("/api/gold-prices/current");
  }

  async calculateGoldLoanAmount(weightGrams, purityK) {
    if (!weightGrams || !purityK) {
      return { success: false, error: "Weight and purity are required" };
    }

    return this.request("/api/gold-prices/calculate-loan", {
      method: "POST",
      body: {
        weightGrams: parseFloat(weightGrams),
        purityK: parseInt(purityK),
      },
    });
  }

  // Dashboard APIs
  async getDashboardStats() {
    return this.request("/api/dashboard/stats");
  }

  // Utility methods
  calculateDueDate(startDate, durationMonths) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(durationMonths));
    return date.toISOString();
  }

  getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Convert paise to rupees
  paiseToRupees(paise) {
    return parseFloat(paise) / 100;
  }

  // Convert rupees to paise
  rupeesToPaise(rupees) {
    return Math.round(parseFloat(rupees) * 100);
  }

  // Network connectivity check
  async checkConnectivity() {
    try {
      const response = await this.request("/api/health", { timeout: 5000 });
      return response.success;
    } catch {
      return false;
    }
  }

  // Test connection
  async testConnection() {
    console.log("Testing API connection...");
    try {
      const health = await this.checkConnectivity();
      if (health) {
        console.log("✓ API connection successful");
        return { success: true, message: "API connection successful" };
      } else {
        console.log("✗ API connection failed");
        return { success: false, error: "API connection failed" };
      }
    } catch (error) {
      console.log("✗ API connection error:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new ApiService();