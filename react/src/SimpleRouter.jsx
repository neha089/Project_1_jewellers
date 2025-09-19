import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Customer from './pages/Customers';
import Balances from './pages/Balances';
import GoldLoan from './pages/GoldLoan';
import Transactions from './pages/Transactions';
import Analysis from './pages/Analysis';

const SimpleRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderComponent = () => {
    switch (currentPath) {
      case '/customers':
        return <Customer />;
      case '/dashboard':
        return <Transactions />;
      case '/balances':
        return <Balances />;
      case '/gold-loans':
        return <GoldLoan />;
      case '/analytics':
        return <Analysis />;
      default :
      return <Transactions/>
    }
  };

  return (
    <Layout>
      {renderComponent()}
    </Layout>
  );
};

export default SimpleRouter;