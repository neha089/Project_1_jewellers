import { useState } from "react";
import { mockTransactions } from "../data/mockTransactions";
import TransactionCard from "./TransactionCard";
import TransactionSearchFilterBar from "./TransactionSearchFilterBar";
import TransactionTableRow from "./TransactionTableRow";
import QuickTransactionEntry from "./QuickTransactionEntry";
import AddTransactionModal from "./AddTransactionModal";
import StatsCard from "./StatsCard";
import TransactionHeader from "./TransactionHeader";
import SummaryCards from "./SummaryCards";
import TransactionFilters from "./TransactionFilters";
import RecentTransactions from "./RecentTransactions";
import { 
  Download, 
  Plus, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar
} from 'lucide-react';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState(mockTransactions);

  const handleAddTransaction = (newTransaction) => {
    setTransactions([newTransaction, ...transactions]);
  };

  const handleEditTransaction = (transaction) => {
    console.log('Edit transaction:', transaction);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
      <TransactionHeader />
      </div>
       <div className="mb-8">
      <SummaryCards />
      </div>
      <QuickTransactionEntry onAddTransaction={handleAddTransaction} />
      <TransactionFilters />
      <RecentTransactions 
        transactions={transactions}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
};

export default TransactionManagement;


