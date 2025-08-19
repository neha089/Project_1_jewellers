import React, { useState, useEffect } from 'react';
import { Users, Coins, Handshake, ArrowDown, UserPlus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import QuickActions from '../components/QuickActions';
import DataCard from '../components/DataCard';
import DataListItem from '../components/DataListItem';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const statsData = [
    {
      title: "Today's Cash Flow",
      value: "₹45,320",
      change: "+12.5%",
      icon: () => <span className="text-white">₹</span>,
      iconBg: "bg-green-600",
      changeType: "positive"
    },
    {
      title: "Total Customers",
      value: "847",
      change: "23 new",
      icon: Users,
      iconBg: "bg-blue-500",
      changeType: "positive"
    },
    {
      title: "Active Loans",
      value: "156",
      change: "5 overdue",
      icon: Handshake,
      iconBg: "bg-yellow-500",
      changeType: "negative"
    },
    {
      title: "Gold Portfolio",
      value: "₹12.4L",
      change: "Total value",
      icon: Coins,
      iconBg: "bg-gray-600",
      changeType: "neutral"
    }
  ];

  const recentTransactions = [
    {
      icon: ArrowDown,
      iconBg: "bg-green-600",
      primary: "Payment from Priya Sharma",
      secondary: "Loan Interest Payment",
      amount: "₹5,000",
      time: "2 hours ago"
    },
    {
      icon: Handshake,
      iconBg: "bg-yellow-500",
      primary: "New Loan - Amit Patel",
      secondary: "15g Gold Chain",
      amount: "₹25,000",
      time: "4 hours ago"
    },
    {
      icon: UserPlus,
      iconBg: "bg-blue-500",
      primary: "New Customer Added",
      secondary: "Meera Gupta - +91 9876543210",
      amount: "-",
      time: "6 hours ago"
    },
    {
      icon: CheckCircle,
      iconBg: "bg-green-600",
      primary: "Loan Closed - Ravi Kumar",
      secondary: "Full Repayment",
      amount: "₹18,000",
      time: "1 day ago"
    }
  ];

  const overdueLoans = [
    {
      icon: AlertTriangle,
      iconBg: "bg-red-600",
      primary: "Sita Devi",
      secondary: "Due: 12 days ago",
      amount: "₹8,500",
      badge: { type: "overdue", text: "Overdue" }
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-red-600",
      primary: "Ramesh Gupta",
      secondary: "Due: 8 days ago",
      amount: "₹12,300",
      badge: { type: "overdue", text: "Overdue" }
    },
    {
      icon: AlertTriangle,
      iconBg: "bg-red-600",
      primary: "Anita Sharma",
      secondary: "Due: 5 days ago",
      amount: "₹6,750",
      badge: { type: "overdue", text: "Overdue" }
    },
    {
      icon: Clock,
      iconBg: "bg-yellow-500",
      primary: "Vikash Patel",
      secondary: "Due: Tomorrow",
      amount: "₹4,200",
      badge: { type: "active", text: "Due Soon" }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isMobile={isMobile}
      />
      
      <div className={`transition-all duration-300 ${!isMobile ? 'ml-64' : ''}`}>
        <Header 
          toggleSidebar={toggleSidebar} 
          isMobile={isMobile}
        />
        
        <main className="p-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {statsData.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Recent Activity & Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataCard title="Recent Transactions" viewAllHref="#">
              {recentTransactions.map((transaction, index) => (
                <DataListItem key={index} {...transaction} />
              ))}
            </DataCard>

            <DataCard title="Overdue Loans" viewAllHref="#">
              {overdueLoans.map((loan, index) => (
                <DataListItem key={index} {...loan} />
              ))}
            </DataCard>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;