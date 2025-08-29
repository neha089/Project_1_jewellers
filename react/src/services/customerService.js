// services/customerService.js
const API_BASE_URL = 'http://localhost:3000/api';

class CustomerService {
  async searchCustomers(searchTerm) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/search?query=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search customers');
      }
      
      return data;
    } catch (error) {
      console.error('Customer search error:', error);
      throw error;
    }
  }

  async createCustomer(customerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }
      
      return data;
    } catch (error) {
      console.error('Customer creation error:', error);
      throw error;
    }
  }

  async updateCustomer(customerId, customerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }
      
      return data;
    } catch (error) {
      console.error('Customer update error:', error);
      throw error;
    }
  }

  async getCustomerById(customerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer');
      }
      
      return data;
    } catch (error) {
      console.error('Customer fetch error:', error);
      throw error;
    }
  }

  async getAllCustomers(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/customers${queryString ? '?' + queryString : ''}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      
      return data;
    } catch (error) {
      console.error('Customers fetch error:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete customer');
      }
      
      return data;
    } catch (error) {
      console.error('Customer deletion error:', error);
      throw error;
    }
  }

  async getCustomerStatement(customerId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}/statement${queryString ? '?' + queryString : ''}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer statement');
      }
      
      return data;
    } catch (error) {
      console.error('Customer statement error:', error);
      throw error;
    }
  }

  async exportCustomerStatement(customerId, params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/customers/${customerId}/export${queryString ? '?' + queryString : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to export customer statement');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer_statement_${customerId}.xlsx`;
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

export const customerService = new CustomerService();