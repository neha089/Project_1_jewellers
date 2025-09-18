import Customer from '../models/Customer.js';
import GoldLoan from '../models/GoldLoan.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import Udhar from '../models/Udhar.js';
import MetalSale from '../models/MetalSale.js';
import GoldPurchase from '../models/GoldPurchase.js';

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const endOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);

    // Customer stats
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: 'active' });

    // Loan stats
    const totalGoldLoans = await GoldLoan.countDocuments();
    const activeGoldLoans = await GoldLoan.countDocuments({ status: 'ACTIVE' });
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'ACTIVE' });

    // Financial stats - Daily
    const dailyIncome = await Transaction.aggregate([
      {
        $match: {
          category: 'INCOME',
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const dailyExpense = await Transaction.aggregate([
      {
        $match: {
          category: 'EXPENSE',
          date: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Financial stats - Monthly
    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          category: 'INCOME',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyExpense = await Transaction.aggregate([
      {
        $match: {
          category: 'EXPENSE',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Financial stats - Yearly
    const yearlyIncome = await Transaction.aggregate([
      {
        $match: {
          category: 'INCOME',
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const yearlyExpense = await Transaction.aggregate([
      {
        $match: {
          category: 'EXPENSE',
          date: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Outstanding amounts
    const outstandingGoldLoans = await GoldLoan.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $project: {
          outstanding: {
            $subtract: [
              '$principalPaise',
              { $sum: '$payments.principalPaise' }
            ]
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$outstanding' } } }
    ]);

    const outstandingLoans = await Loan.aggregate([
      { $match: { status: 'ACTIVE' } },
      {
        $project: {
          outstanding: {
            $subtract: ['$principalPaise', '$totalPrincipalPaid']
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$outstanding' } } }
    ]);

    const outstandingUdhari = await Udhar.aggregate([
      { $match: { kind: 'GIVEN', isCompleted: false, sourceType: 'UDHARI' } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } }
    ]);

    // Gold weight stats
    const totalGoldWeight = await GoldLoan.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.weightGram' } } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .populate('customer', 'name phone')
      .sort({ date: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          active: activeCustomers
        },
        loans: {
          goldLoans: {
            total: totalGoldLoans,
            active: activeGoldLoans
          },
          regularLoans: {
            total: totalLoans,
            active: activeLoans
          }
        },
        financials: {
          daily: {
            income: dailyIncome[0]?.total || 0,
            expense: dailyExpense[0]?.total || 0,
            netIncome: (dailyIncome[0]?.total || 0) - (dailyExpense[0]?.total || 0)
          },
          monthly: {
            income: monthlyIncome[0]?.total || 0,
            expense: monthlyExpense[0]?.total || 0,
            netIncome: (monthlyIncome[0]?.total || 0) - (monthlyExpense[0]?.total || 0)
          },
          yearly: {
            income: yearlyIncome[0]?.total || 0,
            expense: yearlyExpense[0]?.total || 0,
            netIncome: (yearlyIncome[0]?.total || 0) - (yearlyExpense[0]?.total || 0)
          }
        },
        outstanding: {
          goldLoans: outstandingGoldLoans[0]?.total || 0,
          regularLoans: outstandingLoans[0]?.total || 0,
          udhari: outstandingUdhari[0]?.total || 0,
          total: (outstandingGoldLoans[0]?.total || 0) + (outstandingLoans[0]?.total || 0) + (outstandingUdhari[0]?.total || 0)
        },
        goldWeight: {
          totalInLoans: totalGoldWeight[0]?.total || 0
        },
        recentTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getIncomeExpenseReport = async (req, res) => {
  try {
    const { period = 'monthly', year, month } = req.query;
    let startDate, endDate, groupBy;

    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth();

    if (period === 'daily') {
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' },
        day: { $dayOfMonth: '$date' }
      };
    } else if (period === 'monthly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      groupBy = {
        year: { $year: '$date' },
        month: { $month: '$date' }
      };
    } else {
      // yearly
      startDate = new Date(currentYear - 4, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
      groupBy = {
        year: { $year: '$date' }
      };
    }

    const report = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            ...groupBy,
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.category', 'INCOME'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.category', 'EXPENSE'] }, '$total', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          income: 1,
          expense: 1,
          netIncome: { $subtract: ['$income', '$expense'] }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
