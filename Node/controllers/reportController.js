// controllers/reportController.js
import GoldLoan from '../models/GoldLoan.js';
import Transaction from '../models/Transaction.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

// Get business analytics
export const getBusinessAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set default date range (last 30 days if not provided)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const analytics = await GoldLoan.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalPrincipal: { $sum: '$principalPaise' },
          avgLoanAmount: { $avg: '$principalPaise' },
          totalInterestReceived: {
            $sum: {
              $reduce: {
                input: '$payments',
                initialValue: 0,
                in: { $add: ['$value', '$this.interestPaise'] }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        dateRange: { start, end },
        analytics: analytics[0] || {
          totalLoans: 0,
          totalPrincipal: 0,
          avgLoanAmount: 0,
          totalInterestReceived: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get overdue report
export const getOverdueReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const activeLoans = await GoldLoan.find({ status: 'ACTIVE' })
      .populate('customer', 'name phone');

    const overdueLoans = activeLoans.filter(loan => {
      const monthlyInterest = loan.calculateMonthlyInterest ? loan.calculateMonthlyInterest() : 0;
      const startDate = new Date(loan.startDate);
      const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - startDate.getMonth()) + 1;
      
      const totalInterestDue = months * monthlyInterest;
      const interestReceived = loan.payments ? loan.payments.reduce((sum, p) => sum + p.interestPaise, 0) : 0;
      
      return interestReceived < totalInterestDue;
    });

    res.json({
      success: true,
      data: {
        totalOverdueLoans: overdueLoans.length,
        overdueLoans: overdueLoans.map(loan => ({
          id: loan._id,
          customer: loan.customer,
          principalAmount: loan.principalPaise,
          startDate: loan.startDate,
          monthlyInterest: loan.calculateMonthlyInterest ? loan.calculateMonthlyInterest() : 0,
          lastPayment: (loan.payments && loan.payments.length > 0) ? loan.payments[loan.payments.length - 1] : null
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get monthly income report
export const getMonthlyIncomeReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          category: 'INCOME',
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${parseInt(year) + 1}-01-01`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalIncome: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Fill in missing months with zero values
    const monthlyReport = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyIncome.find(m => m._id === month);
      monthlyReport.push({
        month,
        monthName: new Date(2024, month - 1).toLocaleString('default', { month: 'long' }),
        totalIncome: monthData ? monthData.totalIncome : 0,
        transactionCount: monthData ? monthData.transactionCount : 0
      });
    }

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyIncome: monthlyReport,
        totalYearlyIncome: monthlyReport.reduce((sum, m) => sum + m.totalIncome, 0),
        totalTransactions: monthlyReport.reduce((sum, m) => sum + m.transactionCount, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get loan timeline
export const getLoanTimeline = async (req, res) => {
  try {
    const loan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    const timeline = [
      {
        date: loan.createdAt,
        type: 'LOAN_CREATED',
        description: `Loan created for ₹${(loan.principalPaise / 100).toFixed(2)}`,
        amount: loan.principalPaise
      }
    ];

    // Add payment events
    if (loan.payments && loan.payments.length > 0) {
      loan.payments.forEach(payment => {
        timeline.push({
          date: payment.date,
          type: 'PAYMENT',
          description: `Payment: Principal ₹${(payment.principalPaise / 100).toFixed(2)}, Interest ₹${(payment.interestPaise / 100).toFixed(2)}`,
          principalAmount: payment.principalPaise,
          interestAmount: payment.interestPaise,
          forMonth: payment.forMonthName + ' ' + payment.forYear
        });
      });
    }

    // Add closure/completion events
    if (loan.closureDate) {
      timeline.push({
        date: loan.closureDate,
        type: 'LOAN_CLOSED',
        description: 'Loan closed - items returned to customer'
      });
    }

    if (loan.completionDate) {
      timeline.push({
        date: loan.completionDate,
        type: 'LOAN_COMPLETED',
        description: 'Loan completed - full payment received'
      });
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        loan: loan.toObject(),
        timeline
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export customer statement
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
      ...(Object.keys(dateQuery).length && { createdAt: dateQuery })
    }).sort({ createdAt: -1 });

    // Get gold loans
    const goldLoans = await GoldLoan.find({
      customer: customerId,
      ...(Object.keys(dateQuery).length && { startDate: dateQuery })
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