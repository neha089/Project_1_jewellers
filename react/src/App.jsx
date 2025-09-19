// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Customers from './pages/Customers';
import Udhaar from './pages/Udhaar';
import GoldLoan from './pages/GoldLoan';
import SilverLoan from './pages/SilverLoan';
import Loan from './pages/Loan';
import BusinessExpense from './pages/BusinessExpense';
import Transactions from './pages/Transactions';
import GoldBuySell from './pages/GoldBuySell';
import SilverBuySell from './pages/SilverBuySell';
import Analysis from './pages/Analysis';
import Setting from './pages/Setting';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Transactions />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/udhaar" element={<Udhaar />} />
          <Route path="/gold-loan" element={<GoldLoan />} />
          <Route path="/silver-loan" element={<SilverLoan />} />
          <Route path="/loan" element={<Loan />} />
          <Route path="/business-expense" element={<BusinessExpense />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/gold-buy-sell" element={<GoldBuySell />} />
          <Route path="/silver-buy-sell" element={<SilverBuySell />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/setting" element={<Setting />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;