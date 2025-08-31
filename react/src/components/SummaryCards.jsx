import React, { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Users, Package } from "lucide-react";
import ApiService from "../services/api";

const SummaryCards = () => {
  const [stats, setStats] = useState({
    activeLoans: 0,
    totalActivePrincipal: 0,
    closedLoans: 0,
    totalLoans: 0,
    todayInterest: 0,
    todayPayments: 0,
    monthlyRevenue: 0,
    monthlyPayments: 0,
    monthlyInterest: 0,
    totalInterestEarned: 0
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

        const activeLoanObj = data.loanStats.find(l => l._id === "ACTIVE") || {};
        const closedLoanObj = data.loanStats.find(l => l._id === "CLOSED") || {};
        const business = data.businessMetrics || {};

        const today = new Date().toISOString().slice(0, 10);
        const todayPayments = (data.recentPayments || []).filter(
          p => p.paymentDate.slice(0, 10) === today
        );
        const todayInterest = todayPayments.reduce(
          (sum, p) => sum + (p.interestPaise || 0),
          0
        );

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyPaymentsArr = (data.recentPayments || []).filter(p => {
          const d = new Date(p.paymentDate);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const monthlyRevenue = monthlyPaymentsArr.reduce(
          (sum, p) => sum + (p.amount || 0),
          0
        );
        const monthlyPayments = monthlyPaymentsArr.length;
        const monthlyInterest = monthlyPaymentsArr.reduce(
          (sum, p) => sum + (p.interestPaise || 0),
          0
        );

        setStats({
          activeLoans: activeLoanObj.count || 0,
          totalActivePrincipal: business.totalActivePrincipal || 0,
          closedLoans: closedLoanObj.count || 0,
          totalLoans: business.totalLoans || 0,
          todayInterest,
          todayPayments: todayPayments.length,
          monthlyRevenue,
          monthlyPayments,
          monthlyInterest,
          totalInterestEarned: business.totalInterestEarned || 0
        });
      } else {
        setStats({
          activeLoans: 0,
          totalActivePrincipal: 0,
          closedLoans: 0,
          totalLoans: 0,
          todayInterest: 0,
          todayPayments: 0,
          monthlyRevenue: 0,
          monthlyPayments: 0,
          monthlyInterest: 0,
          totalInterestEarned: 0
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setError("Failed to load dashboard statistics");
      setStats({
        activeLoans: 0,
        totalActivePrincipal: 0,
        closedLoans: 0,
        totalLoans: 0,
        todayInterest: 0,
        todayPayments: 0,
        monthlyRevenue: 0,
        monthlyPayments: 0,
        monthlyInterest: 0,
        totalInterestEarned: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Short Indian format (K, L, Cr)
  const formatCompactCurrency = (amount) => {
    if (typeof amount !== "number") {
      amount = parseFloat(amount) || 0;
    }
    if (amount >= 10000000) {
      return "₹" + (amount / 10000000).toFixed(2).replace(/\.00$/, "") + " Cr";
    } else if (amount >= 100000) {
      return "₹" + (amount / 100000).toFixed(2).replace(/\.00$/, "") + " L";
    } else if (amount >= 1000) {
      return "₹" + (amount / 1000).toFixed(2).replace(/\.00$/, "") + " K";
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    if (typeof num !== "number") {
      num = parseFloat(num) || 0;
    }
    return new Intl.NumberFormat("en-IN").format(num);
  };

  if (loading) {
    return (
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="min-w-[250px] bg-white p-6 rounded-lg shadow-sm border border-gray-200"
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
      title: "Active Loans",
      value: formatNumber(stats.activeLoans || 0),
      icon: Package,
      color: "blue",
      subtitle: `${formatCompactCurrency(stats.totalActivePrincipal || 0)} principal`,
      period: "currently active"
    },
    {
      title: "Today's Interest",
      value: formatCompactCurrency(stats.todayInterest || 0),
      icon: DollarSign,
      color: "green",
      subtitle: `${stats.todayPayments || 0} payments`,
      period: "received today"
    },
    {
      title: "Monthly Revenue",
      value: formatCompactCurrency(stats.monthlyRevenue || 0),
      icon: TrendingUp,
      color: "purple",
      subtitle: `${stats.monthlyPayments || 0} transactions`,
      period: "this month"
    },
    {
      title: "Total Loans",
      value: formatNumber(stats.totalLoans || 0),
      icon: Users,
      color: "orange",
      subtitle: `${stats.closedLoans || 0} closed`,
      period: "all time"
    }
  ];

  return (
    <div className="flex space-x-6 overflow-x-auto pb-4">
      {summaryData.map((item, index) => (
        <div
          key={index}
          className="min-w-[250px] bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{item.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {item.value}
              </p>
            </div>
            <div
              className={`w-12 h-12 bg-${item.color}-100 rounded-lg flex items-center justify-center`}
            >
              <item.icon size={24} className={`text-${item.color}-600`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-500">{item.subtitle}</span>
            <span className="text-gray-400 ml-2">•</span>
            <span className="text-gray-500 ml-2">{item.period}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
