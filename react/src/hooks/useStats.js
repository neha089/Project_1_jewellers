import { useState, useEffect } from 'react';

export const useStats = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const fetchStats = async () => {
      setLoading(true);
      // In real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats([
        {
          title: "Today's Cash Flow",
          value: "₹45,320",
          trend: "+12.5%",
          trendDirection: "up"
        },
        {
          title: "Total Customers", 
          value: "847",
          trend: "23 new",
          trendDirection: "up"
        },
        {
          title: "Active Loans",
          value: "156", 
          trend: "5 overdue",
          trendDirection: "neutral"
        },
        {
          title: "Gold Portfolio",
          value: "₹12.4L",
          trend: "Total value", 
          trendDirection: "up"
        }
      ]);
      setLoading(false);
    };

    fetchStats();
  }, []);

  return { stats, loading };
};