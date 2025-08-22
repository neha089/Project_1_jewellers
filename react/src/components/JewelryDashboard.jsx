import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, Package, CreditCard, Target,
  Calendar, Download, Filter, RefreshCw, DollarSign, Award,
  ShoppingCart, AlertCircle, Eye, FileText, Coins, UserCheck,
  BarChart3, PieChart as PieChartIcon, Activity, Wallet
} from 'lucide-react';
import GoalProgress from './GoalProgress';
import StatsCard from './StatsCard';
import mockData from '../data/mockData';
import ReportGenerator from './ReportGenerator';
import ChartContainer from './ChartContainer';
const COLORS = ['#FFD700', '#B9F2FF', '#C0C0C0', '#E5E4E2', '#DDA0DD'];
const JewelryDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('6months');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshData = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date());
    }, 1500);
  };

  const handleReportGeneration = (reportData) => {
    console.log('Report Generated:', reportData);
    alert('Professional analytics report generated and downloaded successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-8">
            <div>
             
              <p className="text-gray-600 mt-2 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
              <button 
                onClick={refreshData}
                disabled={refreshing}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center shadow-md hover:shadow-lg transform hover:scale-105 disabled:scale-100"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Primary KPI Dashboard */}
        <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`₹${(mockData.summary.totalRevenue / 100000).toFixed(1)}L`}
            trend="+12.5% from last period"
            icon={DollarSign}
            color="green"
          />
          <StatsCard
            title="Net Profit"
            value={`₹${(mockData.summary.totalProfit / 100000).toFixed(1)}L`}
            subtitle={`${mockData.summary.profitMargin}% margin`}
            icon={TrendingUp}
            color="blue"
          />
          <StatsCard
            title="Total Customers"
            value={mockData.summary.customerCount.toLocaleString()}
            trend="+15.3% growth rate"
            icon={Users}
            color="purple"
          />
          <StatsCard
            title="Avg Order Value"
            value={`₹${(mockData.summary.avgOrderValue / 1000).toFixed(0)}K`}
            trend="+8.2% increase"
            icon={ShoppingCart}
            color="orange"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Inventory Value"
            value={`₹${(mockData.summary.inventoryValue / 100000).toFixed(1)}L`}
            subtitle="Current stock value"
            icon={Package}
            color="gray"
          />
          <StatsCard
            title="Active Loans"
            value={`₹${(mockData.summary.activeLoans / 1000).toFixed(0)}K`}
            subtitle={`${mockData.summary.loanRecoveryRate}% recovery rate`}
            icon={CreditCard}
            color="blue"
          />
          <StatsCard
            title="Top Category"
            value={mockData.summary.topProduct}
            subtitle="Best performing product"
            icon={Award}
            color="green"
          />
          <StatsCard
            title="Monthly Loss"
            value={`₹${(mockData.summary.totalLoss / 1000).toFixed(0)}K`}
            trend="-18.7% reduced losses"
            icon={AlertCircle}
            color="red"
          />
        </div>

        {/* Advanced Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Revenue Trend Analysis */}
          <ChartContainer title="Revenue & Profitability Trend">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mockData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' || name === 'profit' ? `₹${(value/1000).toFixed(0)}K` : value,
                    name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                  labelStyle={{color: '#333'}}
                  contentStyle={{backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #ccc', borderRadius: '8px'}}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="profit" fill="#10B981" name="Profit" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#8B5CF6" strokeWidth={3} name="Customers" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Product Performance Distribution */}
          <ChartContainer title="Product Category Performance">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.productSales}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mockData.productSales.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value}% (₹${(props.payload.sales/1000).toFixed(0)}K)`,
                    'Share'
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Customer Segment Analysis */}
          <ChartContainer title="Customer Segment Analysis">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.customerSegments} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="segment" type="category" width={80} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? `₹${(value/100000).toFixed(1)}L` : 
                    name === 'avgSpend' ? `₹${(value/1000).toFixed(0)}K` : value,
                    name === 'avgSpend' ? 'Avg Spend' : name.charAt(0).toUpperCase() + name.slice(1)
                  ]}
                />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Customers" />
                <Bar dataKey="avgSpend" fill="#10B981" name="Avg Spend" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Loan Performance Tracking */}
          <ChartContainer title="Loan Management Overview">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.loanData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${(value/1000).toFixed(0)}K`, '']} />
                <Legend />
                <Area type="monotone" dataKey="issued" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.7} name="Issued" />
                <Area type="monotone" dataKey="repaid" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.7} name="Repaid" />
                <Area type="monotone" dataKey="outstanding" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.7} name="Outstanding" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Goals and Report Generation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <GoalProgress goals={mockData.goals} />
          </div>
          <div className="lg:col-span-2">
            <ReportGenerator data={mockData} onGenerate={handleReportGeneration} />
          </div>
        </div>

        {/* Business Intelligence Insights */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-gray-600" />
            AI-Powered Business Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                <h4 className="font-semibold text-green-800">Revenue Growth</h4>
              </div>
              <p className="text-green-700 text-sm leading-relaxed">
                May recorded highest revenue of ₹4.2L with 21.2% profit margin. Gold jewelry driving 45% of total sales.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-semibold text-blue-800">Customer Loyalty</h4>
              </div>
              <p className="text-blue-700 text-sm leading-relaxed">
                68% customer retention rate with premium segment contributing 44% of total revenue despite being 12% of customer base.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center mb-3">
                <Wallet className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-semibold text-purple-800">Financial Health</h4>
              </div>
              <p className="text-purple-700 text-sm leading-relaxed">
                Loan default rate at 2.0% (below 3% industry average). Outstanding loans trending stable at ₹127K.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default JewelryDashboard;