// services/dashboardService.js
const API_BASE_URL = 'http://localhost:3000/api';

class DashboardService {
  async getStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard stats');
      }

      return data;
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
      throw error;
    }
  }

  async getIncomeExpenseReport(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/dashboard/income-expense-report${queryString ? '?' + queryString : ''}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch income expense report');
      }

      return data;
    } catch (error) {
      console.error('Income expense report fetch error:', error);
      throw error;
    }
  }

  async getDashboardOverview() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/overview`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard overview');
      }

      return data;
    } catch (error) {
      console.error('Dashboard overview fetch error:', error);
      throw error;
    }
  }

  async getMonthlyReport(year, month) {
    try {
      const params = new URLSearchParams({
        period: 'monthly',
        year: year.toString(),
        month: month.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/dashboard/income-expense-report?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch monthly report');
      }

      return data;
    } catch (error) {
      console.error('Monthly report fetch error:', error);
      throw error;
    }
  }

  async getDailyReport(year, month) {
    try {
      const params = new URLSearchParams({
        period: 'daily',
        year: year.toString(),
        month: month.toString()
      });
      
      const response = await fetch(`${API_BASE_URL}/dashboard/income-expense-report?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch daily report');
      }

      return data;
    } catch (error) {
      console.error('Daily report fetch error:', error);
      throw error;
    }
  }

  async getYearlyReport() {
    try {
      const params = new URLSearchParams({
        period: 'yearly'
      });
      
      const response = await fetch(`${API_BASE_URL}/dashboard/income-expense-report?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch yearly report');
      }

      return data;
    } catch (error) {
      console.error('Yearly report fetch error:', error);
      throw error;
    }
  }

  async getCustomerStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/customer-stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer stats');
      }

      return data;
    } catch (error) {
      console.error('Customer stats fetch error:', error);
      throw error;
    }
  }

  async getLoanStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/loan-stats`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch loan stats');
      }

      return data;
    } catch (error) {
      console.error('Loan stats fetch error:', error);
      throw error;
    }
  }

  async getOutstandingAmounts() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/outstanding-amounts`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch outstanding amounts');
      }

      return data;
    } catch (error) {
      console.error('Outstanding amounts fetch error:', error);
      throw error;
    }
  }

  async getGoldInventoryStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/gold-inventory`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch gold inventory stats');
      }

      return data;
    } catch (error) {
      console.error('Gold inventory stats fetch error:', error);
      throw error;
    }
  }

  async getRecentActivity(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/recent-activity?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch recent activity');
      }

      return data;
    } catch (error) {
      console.error('Recent activity fetch error:', error);
      throw error;
    }
  }

  async getCashFlow(period = 'monthly') {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/cash-flow?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch cash flow data');
      }

      return data;
    } catch (error) {
      console.error('Cash flow fetch error:', error);
      throw error;
    }
  }

  async getTopCustomers(limit = 10) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/top-customers?limit=${limit}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch top customers');
      }

      return data;
    } catch (error) {
      console.error('Top customers fetch error:', error);
      throw error;
    }
  }

  async getDueSoon(days = 7) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/due-soon?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch items due soon');
      }

      return data;
    } catch (error) {
      console.error('Due soon fetch error:', error);
      throw error;
    }
  }

  async getInterestProjection(months = 6) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/interest-projection?months=${months}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch interest projection');
      }

      return data;
    } catch (error) {
      console.error('Interest projection fetch error:', error);
      throw error;
    }
  }

  // Utility methods for formatting data
  formatCurrency(amount, showSymbol = true) {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: showSymbol ? 'currency' : 'decimal',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount / 100);
    
    return formatted;
  }

  formatNumber(number) {
    return new Intl.NumberFormat('en-IN').format(number);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatWeight(weightInGrams) {
    if (weightInGrams < 1000) {
      return `${weightInGrams.toFixed(2)}g`;
    } else {
      return `${(weightInGrams / 1000).toFixed(3)}kg`;
    }
  }

  calculatePercentageChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  getTrendDirection(current, previous) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  }

  // Chart data formatters
  formatChartData(data, xKey, yKey) {
    return data.map(item => ({
      x: item[xKey],
      y: item[yKey],
      label: this.formatDate(item[xKey])
    }));
  }

  formatIncomeExpenseChart(data) {
    return data.map(item => ({
      date: this.formatDate(item._id),
      income: item.income / 100,
      expense: item.expense / 100,
      netIncome: item.netIncome / 100
    }));
  }

  // Data export methods
  async exportDashboardReport(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/dashboard/export${queryString ? '?' + queryString : ''}`);

      if (!response.ok) {
        throw new Error('Failed to export dashboard report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.xlsx`;
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

export const dashboardService = new DashboardService();