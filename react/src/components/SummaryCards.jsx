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
        const totalIncome = data.financials.daily.income || 0;

        // Calculate total expenses (all money going out)
        const totalExpenses = data.financials.daily.expense || 0;
        // Calculate net profit
        const netProfit =data.financials.daily.netIncome || 0;
        
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
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 mb-6 sm:mb-8">
        <div className="flex flex-wrap -mx-1 sm:-mx-2 lg:-mx-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-full sm:w-1/2 lg:w-1/4 px-1 sm:px-2 lg:px-3 mb-2 sm:mb-4">
              <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 h-full">
                <div className="animate-pulse">
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
                  <div className="h-6 sm:h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 mb-6 sm:mb-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-medium text-sm sm:text-base">Dashboard Error</div>
          <div className="text-red-600 text-xs sm:text-sm mt-1">{error}</div>
          <button
            onClick={fetchDashboardStats}
            className="mt-2 px-3 py-1 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
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
    <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 mb-6 sm:mb-8">
    {/* Flex container for cards */}
    <div className="flex flex-wrap gap-4">
      {summaryData.map((item, index) => (
        <div
          key={index}
          className="flex-1 min-w-[250px] sm:min-w-[350px] lg:min-w-[400px] bg-white p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-full"
        >
          {/* Header with Icon and Title */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 bg-gradient-to-r ${item.bgGradient} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="text-right ml-2 flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider leading-tight truncate">
                {item.title}
              </p>
            </div>
          </div>
  
          {/* Value and Subtitle */}
          <div className="mb-3">
            <h3
              className={`text-base sm:text-lg lg:text-xl xl:text-2xl font-bold leading-tight ${
                item.title === "Net Profit"
                  ? stats.netProfit >= 0
                    ? "text-blue-600"
                    : "text-red-600"
                  : `text-${item.color}-600`
              } truncate`}
            >
              {item.value}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{item.subtitle}</p>
          </div>
  
          {/* Trend */}
          <div className="pt-2 sm:pt-3 border-t border-gray-100">
            <p
              className={`text-xs font-medium leading-tight truncate ${
                item.trend.includes("+") || item.trend.includes("Profitable")
                  ? "text-green-600"
                  : item.trend.includes("Review")
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              {item.trend}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
  
  );
};

export default SummaryCards;
