import Customer from '../models/Customer.js';
import GoldLoan from '../models/GoldLoan.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import UdhariTransaction from '../models/UdhariTransaction.js';
import MetalSale from '../models/MetalSale.js';
import GoldPurchase from '../models/GoldPurchase.js';
import { exportToExcel, formatTransactionForExport, formatGoldLoanForExport } from '../utils/exportHelpers.js';

export const getCustomerStatement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fromDate, toDate } = req.query;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    // Get all transactions for this customer
    const transactions = await Transaction.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { date: dateQuery })
    }).sort({ date: -1 });

    // Get gold loans
    const goldLoans = await GoldLoan.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { startDate: dateQuery })
    });

    // Get regular loans
    const loans = await Loan.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { startDate: dateQuery })
    });

    // Get udhari transactions
    const udhariTxns = await UdhariTransaction.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { takenDate: dateQuery })
    });

    // Calculate totals
    const totalGiven = transactions
      .filter(t => t.direction === 1)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalReceived = transactions
      .filter(t => t.direction === -1)
      .reduce((sum, t) => sum + t.amount, 0);

    res.json({
      success: true,
      data: {
        customer,
        transactions,
        goldLoans,
        loans,
        udhariTxns,
        summary: {
          totalGiven: totalGiven / 100,
          totalReceived: totalReceived / 100,
          netAmount: (totalReceived - totalGiven) / 100,
          transactionCount: transactions.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportCustomerStatement = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { fromDate, toDate } = req.query;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const dateQuery = {};
    if (fromDate) dateQuery.$gte = new Date(fromDate);
    if (toDate) dateQuery.$lte = new Date(toDate);

    const transactions = await Transaction.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { date: dateQuery })
    }).populate('customer', 'name phone').sort({ date: -1 });

    const formattedData = transactions.map(formatTransactionForExport);
    
    const filename = `customer_statement_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = exportToExcel(formattedData, filename, 'Statement');
    
    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportAllGoldLoans = async (req, res) => {
  try {
    const { status, fromDate, toDate } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.startDate = {};
      if (fromDate) query.startDate.$gte = new Date(fromDate);
      if (toDate) query.startDate.$lte = new Date(toDate);
    }

    const goldLoans = await GoldLoan.find(query).populate('customer', 'name phone');
    const formattedData = goldLoans.map(formatGoldLoanForExport);
    
    const filename = `gold_loans_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = exportToExcel(formattedData, filename, 'Gold Loans');
    
    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportAllTransactions = async (req, res) => {
  try {
    const { type, category, fromDate, toDate } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query).populate('customer', 'name phone').sort({ date: -1 });
    const formattedData = transactions.map(formatTransactionForExport);
    
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = exportToExcel(formattedData, filename, 'Transactions');
    
    res.download(filepath, filename);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};