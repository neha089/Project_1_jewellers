// api.js - Enhanced API Service Layer with Gold Loan Interest and Repayment Features
const BASE_URL = "http://localhost:3000";

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log("Making API request:", url, config);
      const response = await fetch(url, config);
      const data = await response.json();

      console.log("API Response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // Enhanced customer search
  async searchCustomers(search = "", page = 1, limit = 50, status = "active") {
    const cleanSearch = search ? search.trim() : "";
    const params = new URLSearchParams();

    if (cleanSearch) params.append("search", cleanSearch);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    params.append("status", status);

    const queryString = params.toString();
    const endpoint = `/api/customers${queryString ? "?" + queryString : ""}`;

    try {
      const response = await this.request(endpoint);

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
    return this.request(`/api/gold-loans/customer/${customerId}`);
  }

  async getLoansByCustomer(customerId) {
    return this.request(`/api/loans/customer/${customerId}`);
  }

  async getAllCustomers(page = 1, limit = 100) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return this.request(`/api/customers/?${params}`);
  }

  // Gold Loan APIs
  async createGoldLoan(loanData) {
    return this.request("/api/gold-loans/", {
      method: "POST",
      body: {
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
      },
    });
  }

  async getPaymentHistory(filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.customer) params.append("customer", filters.customer);
    if (filters.month) params.append("month", filters.month.toString());
    if (filters.year) params.append("year", filters.year.toString());
    const queryString = params.toString();
    return this.request(
      `/api/gold-loans/payments/history${queryString ? "?" + queryString : ""}`
    );
  }

  async getDashboardStats() {
    return this.request("/api/gold-loans/analytics/dashboard");
  }

  async getGoldLoanInterestSummary(loanId) {
    return this.request(`/api/gold-loans/${loanId}/interest-summary`);
  }

  async getAllTransactions() {
    return this.request(`/api/transactions`);
  }

  async getGoldLoanPaymentHistory(loanId) {
    return this.request(`/api/gold-loans/${loanId}/payment-history`);
  }

  async makeGoldLoanPayment(loanId, paymentData) {
    return this.request(`/api/gold-loans/${loanId}/payments`, {
      method: "POST",
      body: {
        principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
        interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
        forMonth: paymentData.forMonth || this.getCurrentMonth(),
        photos: paymentData.photos || [],
        notes: paymentData.notes || "",
      },
    });
  }

  async makeGoldLoanInterestPayment(loanId, interestAmount, notes = "") {
    return this.request(`/api/gold-loans/${loanId}/interest-payment`, {
      method: "POST",
      body: {
        interestPaise: Math.round(parseFloat(interestAmount) * 100),
        notes: notes,
        forMonth: this.getCurrentMonth(),
      },
    });
  }

  async processGoldLoanRepayment(repaymentData) {
    return this.request(
      `/api/gold-loans/${repaymentData.loanId}/repayment`,
      {
        method: "POST",
        body: {
          returnedItemIds: repaymentData.returnedItems || [],
          cashPaymentPaise: Math.round(
            (repaymentData.cashPayment || 0) * 100
          ),
          summary: repaymentData.summary,
          notes: "Partial/Full loan repayment with item returns",
        },
      }
    );
  }

  async completeGoldLoan(loanId, completionData = {}) {
    return this.request(`/api/gold-loans/${loanId}/complete`, {
      method: "PUT",
      body: {
        finalPaymentPaise: Math.round(
          (completionData.finalPayment || 0) * 100
        ),
        photos: completionData.photos || [],
        notes:
          completionData.notes ||
          "Loan completed - all gold returned to customer",
      },
    });
  }

  async addGoldLoanItems(loanId, items) {
    return this.request(`/api/gold-loans/${loanId}/items`, {
      method: "POST",
      body: {
        items: items.map((item) => ({
          name: item.name || "Gold Item",
          weightGram: parseFloat(item.weightGram),
          amountPaise: Math.round(parseFloat(item.amount) * 100),
          purityK: parseInt(item.purityK),
          images: item.images || [],
        })),
      },
    });
  }

  async updateGoldLoanItem(loanId, itemId, itemData) {
    return this.request(`/api/gold-loans/${loanId}/items/${itemId}`, {
      method: "PUT",
      body: {
        name: itemData.name,
        weightGram: parseFloat(itemData.weightGram),
        amountPaise: Math.round(parseFloat(itemData.amount) * 100),
        purityK: parseInt(itemData.purityK),
        images: itemData.images || [],
      },
    });
  }

  async removeGoldLoanItem(loanId, itemId) {
    return this.request(`/api/gold-loans/${loanId}/items/${itemId}`, {
      method: "DELETE",
    });
  }

  async validateGoldLoanClosure(loanId) {
    return this.request(`/api/gold-loans/${loanId}/validate-closure`);
  }

  async getGoldLoanOutstanding(loanId) {
    return this.request(`/api/gold-loans/${loanId}/outstanding-summary`);
  }

  async closeGoldLoan(loanId, closureData = {}) {
    return this.request(`/api/gold-loans/${loanId}/close`, {
      method: "PUT",
      body: {
        closureImages: closureData.photos || [],
        notes: closureData.notes || "Loan closed",
      },
    });
  }

  async returnGoldLoanItems(loanId, itemIds, returnData = {}) {
    return this.request(`/api/gold-loans/${loanId}/return-items`, {
      method: "POST",
      body: {
        itemIds,
        returnImages: returnData.photos || [],
        notes: returnData.notes || "",
      },
    });
  }

  async getGoldLoan(loanId) {
    return this.request(`/api/gold-loans/${loanId}`);
  }

  async getGoldLoanReport(loanId) {
    return this.request(`/api/gold-loans/${loanId}/report`);
  }

  async getAllGoldLoans(filters = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());
    if (filters.status) params.append("status", filters.status);
    if (filters.customer) params.append("customer", filters.customer);
    const queryString = params.toString();
    return this.request(
      `/api/gold-loans${queryString ? "?" + queryString : ""}`
    );
  }

  async getCustomerGoldLoanSummary(customerId) {
    return this.request(`/api/gold-loans/customer/${customerId}/summary`);
  }

  async getPendingInterest() {
    return this.request("/api/gold-loans/analytics/pending-interest");
  }

  // Metal Sale APIs
  async createMetalSale(saleData) {
    return this.request("/api/metal-sales/", {
      method: "POST",
      body: {
        customer: saleData.customerId,
        metal: saleData.metal.toUpperCase(),
        weightGram: parseFloat(saleData.weight),
        amountPaise: Math.round(parseFloat(saleData.amount) * 100),
        ratePerGramPaise: Math.round(parseFloat(saleData.rate) * 100),
        purityK: parseInt(saleData.purity),
        date: saleData.date,
      },
    });
  }

  // Regular Loan APIs
  async createLoan(loanData, direction) {
    return this.request("/api/loans/", {
      method: "POST",
      body: {
        items: loanData.items || [],
        customer: loanData.customerId,
        principalPaise: Math.round(parseFloat(loanData.amount) * 100),
        interestRateMonthlyPct: parseFloat(loanData.interestRate),
        startDate: loanData.date,
        dueDate: this.calculateDueDate(loanData.date, loanData.durationMonths),
        status: "ACTIVE",
        direction: direction, // -1 for given, 1 for taken
        note: loanData.description,
      },
    });
  }

  async makeLoanInterestPayment(loanId, interestAmount) {
    return this.request(`/api/loans/${loanId}/interest-payment`, {
      method: "POST",
      body: {
        interestPaise: Math.round(parseFloat(interestAmount) * 100),
        forMonth: this.getCurrentMonth(),
      },
    });
  }

  async makeLoanPayment(loanId, paymentData) {
    return this.request(`/api/loans/${loanId}/payments`, {
      method: "POST",
      body: {
        principalPaise: Math.round(parseFloat(paymentData.principal || 0) * 100),
        interestPaise: Math.round(parseFloat(paymentData.interest || 0) * 100),
        photos: paymentData.photos || [],
        notes: paymentData.notes || "",
      },
    });
  }

  // Udhari APIs
  async giveUdhari(udhariData) {
    return this.request("/api/udhari/give", {
      method: "POST",
      body: {
        customer: udhariData.customerId,
        principalPaise: Math.round(parseFloat(udhariData.amount) * 100),
        note: udhariData.description,
        totalInstallments: parseInt(udhariData.installments || 1),
      },
    });
  }

  async receiveUdhariPayment(paymentData) {
    return this.request("/api/udhari/receive", {
      method: "POST",
      body: {
        customer: paymentData.customerId,
        principalPaise: Math.round(parseFloat(paymentData.amount) * 100),
        sourceRef: paymentData.udhariId,
        note: paymentData.description,
        installmentNumber: parseInt(paymentData.installmentNumber || 1),
      },
    });
  }

  // Gold Purchase APIs
  async createGoldPurchase(purchaseData) {
    return this.request("/api/gold-purchases/", {
      method: "POST",
      body: {
        partyName: purchaseData.partyName,
        items: [
          {
            name: purchaseData.description || "Gold Item",
            weightGram: parseFloat(purchaseData.goldWeight),
            amountPaise: Math.round(parseFloat(purchaseData.amount) * 100),
            purityK: parseInt(purchaseData.goldType.replace("K", "")),
            metal: purchaseData.metal.toUpperCase(),
          },
        ],
        totalPaise: Math.round(parseFloat(purchaseData.amount) * 100),
        date: purchaseData.date,
      },
    });
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
