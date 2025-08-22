import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, CreditCard, Target,
  Calendar, Download, Filter, RefreshCw, DollarSign, Award,
  ShoppingCart, AlertCircle, Eye, FileText
} from 'lucide-react';

const ReportGenerator = ({ data, onGenerate }) => {
  const [reportType, setReportType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState('6months');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateReport = async () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportData = {
        type: reportType,
        dateRange,
        generatedAt: new Date().toISOString(),
        summary: data.summary,
        data: data,
        insights: [
          `Revenue growth of 58% compared to previous period`,
          `Gold jewelry accounts for 45% of total sales`,
          `Customer retention rate of 68% shows strong loyalty`,
          `Loan default rate of 2.0% is below industry average`
        ]
      };
      
      onGenerate(reportData);
      
      // Create downloadable report
      const reportContent = `
JEWELRY MANAGEMENT ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}

=== EXECUTIVE SUMMARY ===
Total Revenue: ₹${(data.summary.totalRevenue/100000).toFixed(2)}L
Net Profit: ₹${(data.summary.totalProfit/100000).toFixed(2)}L
Profit Margin: ${data.summary.profitMargin}%
Total Customers: ${data.summary.customerCount}
Active Loans: ₹${(data.summary.activeLoans/1000).toFixed(0)}K

=== KEY INSIGHTS ===
${reportData.insights.map(insight => `• ${insight}`).join('\n')}

=== DETAILED DATA ===
${JSON.stringify(reportData, null, 2)}
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jewelry-analytics-report-${reportType}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-gray-600" />
        Analytics Report Generator
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="comprehensive">Comprehensive Analysis</option>
            <option value="financial">Financial Performance</option>
            <option value="customer">Customer Analytics</option>
            <option value="inventory">Product & Inventory</option>
            <option value="loans">Loan Management</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>
        <div className="flex items-end">
          <button 
            onClick={generateReport}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-105 disabled:scale-100"
          >
            <Download className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-bounce' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default ReportGenerator;