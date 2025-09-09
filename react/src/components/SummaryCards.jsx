import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Calculator } from "lucide-react";
import ApiService from "../services/api";

const SummaryCards = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats();

      if (response && response.data) {
        const data = response.data;

        // Calculate total income (all money coming in)
        const totalIncome = (data.recentPayments || [])
          .filter(p => p.type === 'income')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Calculate total expenses (all money going out)
        const totalExpenses = (data.recentPayments || [])
          .filter(p => p.type === 'expense')
          .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Calculate net profit
        const netProfit = totalIncome - totalExpenses;
        
        // Calculate profit margin percentage
        const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100) : 0;

        setStats({
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin
        });
      } else {
        setStats({
          totalIncome: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setError("Failed to load dashboard statistics");
      setStats({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Format currency in Indian format (K, L, Cr)
  const formatCompactCurrency = (amount) => {
    if (typeof amount !== "number") {
      amount = parseFloat(amount) || 0;
    }
    
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    
    let formatted;
    if (absAmount >= 10000000) {
      formatted = "₹" + (absAmount / 10000000).toFixed(2).replace(/\.00$/, "") + " Cr";
    } else if (absAmount >= 100000) {
      formatted = "₹" + (absAmount / 100000).toFixed(2).replace(/\.00$/, "") + " L";
    } else if (absAmount >= 1000) {
      formatted = "₹" + (absAmount / 1000).toFixed(2).replace(/\.00$/, "") + " K";
    } else {
      formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(absAmount);
    }
    
    return isNegative ? `-${formatted}` : formatted;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <div className="text-red-800 font-medium">Dashboard Error</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button
          onClick={fetchDashboardStats}
          className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const summaryData = [
    {
      title: "Total Income",
      value: formatCompactCurrency(stats.totalIncome || 0),
      icon: TrendingUp,
      color: "emerald",
      bgGradient: "from-emerald-500 to-green-600",
      subtitle: "Money received",
      trend: "+12.5% from last month"
    },
    {
      title: "Total Expenses",
      value: formatCompactCurrency(stats.totalExpenses || 0),
      icon: TrendingDown,
      color: "rose",
      bgGradient: "from-rose-500 to-red-600",
      subtitle: "Money spent",
      trend: "-5.2% from last month"
    },
    {
      title: "Net Profit",
      value: formatCompactCurrency(stats.netProfit || 0),
      icon: DollarSign,
      color: stats.netProfit >= 0 ? "blue" : "red",
      bgGradient: stats.netProfit >= 0 ? "from-blue-500 to-indigo-600" : "from-red-500 to-rose-600",
      subtitle: "Income - Expenses",
      trend: `${stats.profitMargin.toFixed(1)}% margin`
    },
    {
      title: "Profit Analysis",
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: Calculator,
      color: stats.profitMargin >= 0 ? "purple" : "orange",
      bgGradient: stats.profitMargin >= 0 ? "from-purple-500 to-indigo-600" : "from-orange-500 to-red-600",
      subtitle: "Profit margin",
      trend: stats.netProfit >= 0 ? "Profitable business" : "Review expenses"
    }
  ];

  return (
    <div className="grid grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {summaryData.map((item, index) => (
        <div
          key={index}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${item.bgGradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <item.icon size={24} className="text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {item.title}
              </p>
            </div>
          </div>
          
          <div className="mb-3">
            <h3 className={`text-2xl font-bold ${
              item.title === "Net Profit" 
                ? stats.netProfit >= 0 ? "text-blue-600" : "text-red-600"
                : `text-${item.color}-600`
            }`}>
              {item.value}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{item.subtitle}</p>
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <p className={`text-xs font-medium ${
              item.trend.includes('+') || item.trend.includes('Profitable') 
                ? "text-green-600" 
                : item.trend.includes('Review') 
                ? "text-red-600" 
                : "text-gray-600"
            }`}>
              {item.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;