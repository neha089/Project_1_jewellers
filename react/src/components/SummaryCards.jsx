// SummaryCards.js - Responsive 3-Column Layout
import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Coins,
  CreditCard,
} from "lucide-react";
import ApiService from "../services/api";

const SummaryCards = () => {
  const [stats, setStats] = useState({
    customers: { total: 0, active: 0 },
    loans: {
      goldLoans: { total: 0, active: 0 },
      regularLoans: { total: 0, active: 0 },
    },
    financials: {
      daily: { income: 0, expense: 0, netIncome: 0 },
      monthly: { income: 0, expense: 0, netIncome: 0 },
      yearly: { income: 0, expense: 0, netIncome: 0 },
    },
    outstanding: { goldLoans: 0, regularLoans: 0, udhari: 0, total: 0 },
    goldWeight: { totalInLoans: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      } else {
        throw new Error(response.message || "Failed to fetch stats");
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
      setError("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountInPaise) => {
    const amount = ApiService.paiseToRupees(amountInPaise);
    if (amount >= 10000000) {
      // 1 crore
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 lakh
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 thousand
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 md:h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        <p>{error}</p>
        <button
          onClick={fetchDashboardStats}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Today's Income",
      value: formatCurrency(stats.financials.daily.income),
      change: stats.financials.daily.netIncome >= 0 ? "positive" : "negative",
      changeText: `Net: ${formatCurrency(
        Math.abs(stats.financials.daily.netIncome)
      )}`,
      icon: TrendingUp,
      color: stats.financials.daily.netIncome >= 0 ? "emerald" : "red",
    },

    {
      title: "Total Customers",
      value: stats.customers.total.toString(),
      change: "neutral",
      changeText: `${stats.customers.active} active customers`,
      icon: Users,
      color: "blue",
    },
    {
      title: "Outstanding Amount",
      value: formatCurrency(stats.outstanding.total),
      change: "neutral",
      changeText: `Gold: ${formatCurrency(stats.outstanding.goldLoans)}`,
      icon: CreditCard,
      color: "orange",
    },
    {
      title: "Gold Loans",
      value: stats.loans.goldLoans.active.toString(),
      change: "neutral",
      changeText: "Active loans",
      icon: Coins,
      color: "amber",
    },
    {
      title: "Gold in Loans",
      value: `${stats.goldWeight.totalInLoans}g`,
      change: "neutral",
      changeText: "Total weight",
      icon: Coins,
      color: "yellow",
    },
    {
      title: "Regular Loans",
      value: stats.loans.regularLoans.active.toString(),
      change: "neutral",
      changeText: "Active loans",
      icon: CreditCard,
      color: "purple",
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-600 mb-1 truncate">
                  {card.title}
                </p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">
                  {card.value}
                </p>
                <div className="flex items-center">
                  {card.change === "positive" && (
                    <TrendingUp className="w-4 h-4 text-emerald-500 mr-1 flex-shrink-0" />
                  )}
                  {card.change === "negative" && (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm truncate ${
                      card.change === "positive"
                        ? "text-emerald-600"
                        : card.change === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {card.changeText}
                  </span>
                </div>
              </div>
              <div
                className={`w-10 h-10 md:w-12 md:h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3`}
              >
                <Icon
                  className={`w-5 h-5 md:w-6 md:h-6 text-${card.color}-600`}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
