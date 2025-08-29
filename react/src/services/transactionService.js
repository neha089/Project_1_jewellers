// services/transactionService.js
const API_BASE_URL =  'http://localhost:3000/api';

class TransactionService {
  async createTransaction(transactionData) {
    try {
      let endpoint;
      let payload = { ...transactionData };

      // Route to appropriate endpoint based on transaction type
      switch (transactionData.type) {
        case 'GOLD_LOAN_DISBURSEMENT':
          endpoint = 'gold-loans';
          payload = {
            customer: transactionData.customer,
            items: transactionData.items || [],
            interestRateMonthlyPct: transactionData.interestRateMonthlyPct,
            principalPaise: transactionData.amount,
            dueDate: transactionData.dueDate
          };
          break;

        case 'LOAN_DISBURSEMENT':
          endpoint = 'loans';
          payload = {
            customer: transactionData.customer,
            principalPaise: transactionData.amount,
            interestRateMonthlyPct: transactionData.interestRateMonthlyPct,
            dueDate: transactionData.dueDate,
            note: transactionData.note
          };
          break;

        case 'UDHARI_GIVEN':
          endpoint = 'udhari/give';
          payload = {
            customer: transactionData.customer,
            principalPaise: transactionData.amount,
            note: transactionData.description,
            returnDate: transactionData.returnDate
          };
          break;

        case 'UDHARI_RECEIVED':
          endpoint = 'udhari/receive';
          payload = {
            customer: transactionData.customer,
            principalPaise: transactionData.amount,
            interestPaise: 0,
            note: transactionData.description
          };
          break;

        case 'GOLD_SALE':
        case 'SILVER_SALE':
          endpoint = 'metal-sales';
          payload = {
            customer: transactionData.customer,
            metal: transactionData.metal,
            weightGram: transactionData.weightGram,
            amountPaise: transactionData.amount,
            ratePerGramPaise: transactionData.ratePerGramPaise,
            purityK: transactionData.purityK,
            date: transactionData.date
          };
          break;

        case 'GOLD_PURCHASE':
        case 'SILVER_PURCHASE':
          endpoint = 'gold-purchases';
          payload = {
            partyName: transactionData.partyName,
            items: transactionData.items || [],
            totalPaise: transactionData.amount,
            date: transactionData.date
          };
          break;

        case 'GOLD_LOAN_PAYMENT':
          endpoint = `gold-loans/${transactionData.loanId}/payment`;
          payload = {
            principalPaise: transactionData.principalPaise || 0,
            interestPaise: transactionData.interestPaise || transactionData.amount,
            photos: transactionData.photos || []
          };
          break;

        case 'LOAN_PAYMENT':
          if (transactionData.paymentType === 'interest') {
            endpoint = `loans/${transactionData.loanId}/interest-payment`;
          } else {
            endpoint = `loans/${transactionData.loanId}/principal-payment`;
          }
          payload = {
            amount: transactionData.amount,
            note: transactionData.description
          };
          break;

        default:
          throw new Error(`Unsupported transaction type: ${transactionData.type}`);
      }

      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction creation error:', error);
      throw error;
    }
  }

  async getAllTransactions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/transactions${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      return data;
    } catch (error) {
      console.error('Transactions fetch error:', error);
      throw error;
    }
  }

  async getRecentTransactions(limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/recent?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent transactions');
      }

      return data;
    } catch (error) {
      console.error('Recent transactions fetch error:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction fetch error:', error);
      throw error;
    }
  }

  async updateTransaction(transactionId, transactionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction update error:', error);
      throw error;
    }
  }

  async deleteTransaction(transactionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction deletion error:', error);
      throw error;
    }
  }

  // Gold Loan specific methods
  async getAllGoldLoans(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/gold-loans${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gold loans');
      }

      return data;
    } catch (error) {
      console.error('Gold loans fetch error:', error);
      throw error;
    }
  }

  async payGoldLoanInterest(loanId, paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-loans/${loanId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment');
      }

      return data;
    } catch (error) {
      console.error('Gold loan payment error:', error);
      throw error;
    }
  }

  async closeGoldLoan(loanId) {
    try {
      const response = await fetch(`${API_BASE_URL}/gold-loans/${loanId}/close`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to close gold loan');
      }

      return data;
    } catch (error) {
      console.error('Gold loan closure error:', error);
      throw error;
    }
  }

  // Regular Loan specific methods
  async getAllLoans(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/loans${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch loans');
      }

      return data;
    } catch (error) {
      console.error('Loans fetch error:', error);
      throw error;
    }
  }

  async payLoanInterest(loanId, paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/loans/${loanId}/interest-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record interest payment');
      }

      return data;
    } catch (error) {
      console.error('Loan interest payment error:', error);
      throw error;
    }
  }

  async payLoanPrincipal(loanId, paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/loans/${loanId}/principal-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record principal payment');
      }

      return data;
    } catch (error) {
      console.error('Loan principal payment error:', error);
      throw error;
    }
  }

  // Udhari specific methods
  async getAllUdhariTransactions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/udhari${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch udhari transactions');
      }

      return data;
    } catch (error) {
      console.error('Udhari transactions fetch error:', error);
      throw error;
    }
  }

  async getOutstandingUdhari(customerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/udhari/outstanding/${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch outstanding udhari');
      }

      return data;
    } catch (error) {
      console.error('Outstanding udhari fetch error:', error);
      throw error;
    }
  }

  // Metal Sales methods
  async getAllMetalSales(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/metal-sales${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch metal sales');
      }

      return data;
    } catch (error) {
      console.error('Metal sales fetch error:', error);
      throw error;
    }
  }

  // Export methods
  async exportTransactions(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/transactions/export${queryString ? '?' + queryString : ''}`);

      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  async exportGoldLoans(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/gold-loans/export${queryString ? '?' + queryString : ''}`);

      if (!response.ok) {
        throw new Error('Failed to export gold loans');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gold_loans_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();