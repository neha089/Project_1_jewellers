const mockData = {
  summary: {
    totalRevenue: 2850000,
    totalProfit: 456000,
    totalLoss: 45000,
    customerCount: 1247,
    goalProgress: 78,
    activeLoans: 145000,
    topProduct: "Gold Necklace Sets",
    inventoryValue: 3500000,
    avgOrderValue: 25000,
    profitMargin: 16.0,
    loanRecoveryRate: 85.5
  },
  monthlyData: [
    { month: 'Jan', revenue: 240000, profit: 45000, loss: 5000, customers: 156, orders: 98, avgOrder: 24500 },
    { month: 'Feb', revenue: 320000, profit: 62000, loss: 3200, customers: 189, orders: 125, avgOrder: 25600 },
    { month: 'Mar', revenue: 280000, profit: 48000, loss: 8100, customers: 167, orders: 112, avgOrder: 25000 },
    { month: 'Apr', revenue: 390000, profit: 71000, loss: 2800, customers: 203, orders: 145, avgOrder: 26900 },
    { month: 'May', revenue: 420000, profit: 89000, loss: 4500, customers: 234, orders: 167, avgOrder: 25150 },
    { month: 'Jun', revenue: 380000, profit: 67000, loss: 6200, customers: 198, orders: 152, avgOrder: 25000 }
  ],
  productSales: [
    { name: 'Gold Jewelry', value: 45, sales: 1282500, items: 89, color: '#FFD700' },
    { name: 'Diamond Rings', value: 28, sales: 798000, items: 34, color: '#B9F2FF' },
    { name: 'Silver Items', value: 15, sales: 427500, items: 156, color: '#C0C0C0' },
    { name: 'Platinum', value: 8, sales: 228000, items: 12, color: '#E5E4E2' },
    { name: 'Watches & Others', value: 4, sales: 114000, items: 67, color: '#DDA0DD' }
  ],
  customerSegments: [
    { segment: 'Premium', count: 145, revenue: 1250000, avgSpend: 86200 },
    { segment: 'Regular', count: 567, revenue: 980000, avgSpend: 17300 },
    { segment: 'Occasional', count: 535, revenue: 620000, avgSpend: 11600 }
  ],
  loanData: [
    { month: 'Jan', issued: 25000, repaid: 18000, outstanding: 95000, defaultRate: 2.1 },
    { month: 'Feb', issued: 35000, repaid: 22000, outstanding: 108000, defaultRate: 1.8 },
    { month: 'Mar', issued: 28000, repaid: 31000, outstanding: 105000, defaultRate: 2.5 },
    { month: 'Apr', issued: 42000, repaid: 26000, outstanding: 121000, defaultRate: 1.9 },
    { month: 'May', issued: 38000, repaid: 35000, outstanding: 124000, defaultRate: 1.6 },
    { month: 'Jun', issued: 32000, repaid: 29000, outstanding: 127000, defaultRate: 2.3 }
  ],
  goals: [
    { name: 'Monthly Revenue', target: 450000, achieved: 380000, percentage: 84 },
    { name: 'New Customers', target: 250, achieved: 198, percentage: 79 },
    { name: 'Profit Margin', target: 18, achieved: 17.6, percentage: 98 },
    { name: 'Loan Recovery', target: 90, achieved: 85.5, percentage: 95 }
  ]
};

export default mockData;