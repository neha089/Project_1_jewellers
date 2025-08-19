import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Customer from './pages/Customers';
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
      case '/':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderComponent()}
    </Layout>
  );
};

export default SimpleRouter;