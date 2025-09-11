import UdhariTransaction from '../models/UdhariTransaction.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// Give Udhari (Lend money to someone)
export const giveUdhari = async (req, res) => {
  try {
    const { customer, principalPaise, note, totalInstallments = 1, returnDate } = req.body;
   
    const udhariTxn = new UdhariTransaction({
      customer,
      kind: 'GIVEN',
      principalPaise,
      direction: 1, // outgoing
      sourceType: 'UDHARI',
      note,
      outstandingBalance: principalPaise,
      totalInstallments,
      returnDate
    });
   
    await udhariTxn.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_GIVEN',
      customer,
      amount: principalPaise,
      direction: 1,
      description: `Udhari given - ${note || 'No note'}`,
      relatedDoc: udhariTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari given successfully',
      data: udhariTxn 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Take Udhari (Borrow money from someone)
export const takeUdhari = async (req, res) => {
  try {
    const { customer, principalPaise, note, totalInstallments = 1, returnDate } = req.body;
   
    const udhariTxn = new UdhariTransaction({
      customer,
      kind: 'TAKEN',
      principalPaise,
      direction: -1, // incoming
      sourceType: 'UDHARI',
      note,
      outstandingBalance: principalPaise,
      totalInstallments,
      returnDate
    });
   
    await udhariTxn.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_TAKEN',
      customer,
      amount: principalPaise,
      direction: -1,
      description: `Udhari taken - ${note || 'No note'}`,
      relatedDoc: udhariTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME'
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari taken successfully',
      data: udhariTxn 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Receive Udhari Payment (When someone returns money they borrowed)
export const receiveUdhariPayment = async (req, res) => {
  try {
    const { customer, principalPaise, sourceRef, note, installmentNumber } = req.body;
   
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: -1, // incoming
      sourceType: 'UDHARI',
      sourceRef,
      note,
      installmentNumber
    });
   
    await repaymentTxn.save();

    // Update original udhari outstanding balance
    if (sourceRef) {
      const originalUdhari = await UdhariTransaction.findById(sourceRef);
      if (originalUdhari) {
        originalUdhari.outstandingBalance -= principalPaise;
        if (originalUdhari.outstandingBalance <= 0) {
          originalUdhari.isCompleted = true;
        }
        await originalUdhari.save();
      }
    }

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_RECEIVED',
      customer,
      amount: principalPaise,
      direction: -1,
      description: `Udhari repayment received - ${note || 'No note'}`,
      relatedDoc: repaymentTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME'
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari payment received successfully',
      data: repaymentTxn 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Make Udhari Payment (When you return money you borrowed)
export const makeUdhariPayment = async (req, res) => {
  try {
    const { customer, principalPaise, sourceRef, note, installmentNumber } = req.body;
   
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: 1, // outgoing
      sourceType: 'UDHARI',
      sourceRef,
      note,
      installmentNumber
    });
   
    await repaymentTxn.save();

    // Update original udhari outstanding balance
    if (sourceRef) {
      const originalUdhari = await UdhariTransaction.findById(sourceRef);
      if (originalUdhari) {
        originalUdhari.outstandingBalance -= principalPaise;
        if (originalUdhari.outstandingBalance <= 0) {
          originalUdhari.isCompleted = true;
        }
        await originalUdhari.save();
      }
    }

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_PAID',
      customer,
      amount: principalPaise,
      direction: 1,
      description: `Udhari payment made - ${note || 'No note'}`,
      relatedDoc: repaymentTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari payment made successfully',
      data: repaymentTxn 
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get all udhari transactions with filters
export const getAllUdhariTransactions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      customer, 
      kind, 
      isCompleted,
      startDate,
      endDate,
      sortBy = 'takenDate',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
   
    if (customer) query.customer = customer;
    if (kind) query.kind = kind;
    if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';
    
    if (startDate || endDate) {
      query.takenDate = {};
      if (startDate) query.takenDate.$gte = new Date(startDate);
      if (endDate) query.takenDate.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await UdhariTransaction.find(query)
      .populate('customer', 'name phone email address')
      .populate('sourceRef')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOptions);

    const total = await UdhariTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get udhari transactions for specific customer
export const getCustomerUdhariTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { includePayments = 'true' } = req.query;
    
    let query = { customer: customerId };
    
    if (includePayments === 'false') {
      query.kind = { $in: ['GIVEN', 'TAKEN'] };
    }

    const transactions = await UdhariTransaction.find(query)
      .populate('customer', 'name phone email')
      .populate('sourceRef')
      .sort({ takenDate: -1 });

    // Calculate summary
    let totalGiven = 0;
    let totalTaken = 0;
    let totalGivenOutstanding = 0;
    let totalTakenOutstanding = 0;
    let totalReceived = 0;
    let totalPaid = 0;

    transactions.forEach(txn => {
      if (txn.kind === 'GIVEN') {
        totalGiven += txn.principalPaise;
        totalGivenOutstanding += txn.outstandingBalance;
      } else if (txn.kind === 'TAKEN') {
        totalTaken += txn.principalPaise;
        totalTakenOutstanding += txn.outstandingBalance;
      } else if (txn.kind === 'REPAYMENT') {
        if (txn.direction === -1) {
          totalReceived += txn.principalPaise;
        } else {
          totalPaid += txn.principalPaise;
        }
      }
    });

    const summary = {
      totalGiven: totalGiven / 100,
      totalTaken: totalTaken / 100,
      totalGivenOutstanding: totalGivenOutstanding / 100,
      totalTakenOutstanding: totalTakenOutstanding / 100,
      totalReceived: totalReceived / 100,
      totalPaid: totalPaid / 100,
      netAmount: (totalGivenOutstanding - totalTakenOutstanding) / 100
    };

    res.json({
      success: true,
      data: {
        transactions,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get outstanding udhari (money to collect)
export const getOutstandingUdhariToCollect = async (req, res) => {
  try {
    const { customer } = req.query;
    
    let query = {
      kind: 'GIVEN',
      isCompleted: false,
      sourceType: 'UDHARI'
    };

    if (customer) query.customer = customer;

    const outstandingUdhari = await UdhariTransaction.find(query)
      .populate('customer', 'name phone email address');

    const totalOutstanding = outstandingUdhari.reduce((sum, txn) => sum + txn.outstandingBalance, 0);

    // Group by customer
    const customerWise = {};
    outstandingUdhari.forEach(txn => {
      const customerId = txn.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: txn.customer,
          transactions: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].transactions.push(txn);
      customerWise[customerId].totalOutstanding += txn.outstandingBalance;
    });

    res.json({
      success: true,
      data: {
        transactions: outstandingUdhari,
        totalOutstanding: totalOutstanding / 100,
        customerWise: Object.values(customerWise).map(item => ({
          ...item,
          totalOutstanding: item.totalOutstanding / 100
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get outstanding udhari (money to pay back)
export const getOutstandingUdhariToPayBack = async (req, res) => {
  try {
    const { customer } = req.query;
    
    let query = {
      kind: 'TAKEN',
      isCompleted: false,
      sourceType: 'UDHARI'
    };

    if (customer) query.customer = customer;

    const outstandingUdhari = await UdhariTransaction.find(query)
      .populate('customer', 'name phone email address');

    const totalOutstanding = outstandingUdhari.reduce((sum, txn) => sum + txn.outstandingBalance, 0);

    // Group by customer
    const customerWise = {};
    outstandingUdhari.forEach(txn => {
      const customerId = txn.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: txn.customer,
          transactions: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].transactions.push(txn);
      customerWise[customerId].totalOutstanding += txn.outstandingBalance;
    });

    res.json({
      success: true,
      data: {
        transactions: outstandingUdhari,
        totalOutstanding: totalOutstanding / 100,
        customerWise: Object.values(customerWise).map(item => ({
          ...item,
          totalOutstanding: item.totalOutstanding / 100
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get udhari summary
export const getUdhariSummary = async (req, res) => {
  try {
    const summary = await UdhariTransaction.aggregate([
      {
        $group: {
          _id: '$kind',
          totalAmount: { $sum: '$principalPaise' },
          totalOutstanding: { $sum: '$outstandingBalance' },
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: ['$isCompleted', 1, 0] }
          }
        }
      }
    ]);

    const formattedSummary = {
      given: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 },
      taken: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 },
      repayment: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 }
    };

    summary.forEach(item => {
      const key = item._id.toLowerCase();
      if (formattedSummary[key]) {
        formattedSummary[key] = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          count: item.count,
          completedCount: item.completedCount
        };
      }
    });

    const netOutstanding = formattedSummary.given.totalOutstanding - formattedSummary.taken.totalOutstanding;

    res.json({
      success: true,
      data: {
        ...formattedSummary,
        netOutstanding,
        totalToCollect: formattedSummary.given.totalOutstanding,
        totalToPayBack: formattedSummary.taken.totalOutstanding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get customers with udhari
export const getUdhariCustomers = async (req, res) => {
  try {
    const { type } = req.query; // 'given', 'taken', or 'all'
    
    let matchStage = {};
    if (type === 'given') {
      matchStage.kind = 'GIVEN';
    } else if (type === 'taken') {
      matchStage.kind = 'TAKEN';
    }

    const customers = await UdhariTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            customer: '$customer',
            kind: '$kind'
          },
          totalAmount: { $sum: '$principalPaise' },
          totalOutstanding: { $sum: '$outstandingBalance' },
          transactionCount: { $sum: 1 },
          lastTransactionDate: { $max: '$takenDate' }
        }
      },
      {
        $group: {
          _id: '$_id.customer',
          given: {
            $sum: {
              $cond: [
                { $eq: ['$_id.kind', 'GIVEN'] },
                '$totalAmount',
                0
              ]
            }
          },
          givenOutstanding: {
            $sum: {
              $cond: [
                { $eq: ['$_id.kind', 'GIVEN'] },
                '$totalOutstanding',
                0
              ]
            }
          },
          taken: {
            $sum: {
              $cond: [
                { $eq: ['$_id.kind', 'TAKEN'] },
                '$totalAmount',
                0
              ]
            }
          },
          takenOutstanding: {
            $sum: {
              $cond: [
                { $eq: ['$_id.kind', 'TAKEN'] },
                '$totalOutstanding',
                0
              ]
            }
          },
          totalTransactions: { $sum: '$transactionCount' },
          lastTransactionDate: { $max: '$lastTransactionDate' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $unwind: '$customerInfo'
      },
      {
        $project: {
          customer: '$customerInfo',
          given: { $divide: ['$given', 100] },
          givenOutstanding: { $divide: ['$givenOutstanding', 100] },
          taken: { $divide: ['$taken', 100] },
          takenOutstanding: { $divide: ['$takenOutstanding', 100] },
          netAmount: { $divide: [{ $subtract: ['$givenOutstanding', '$takenOutstanding'] }, 100] },
          totalTransactions: 1,
          lastTransactionDate: 1
        }
      },
      { $sort: { lastTransactionDate: -1 } }
    ]);

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get detailed payment history for a specific udhari
export const getUdhariPaymentHistory = async (req, res) => {
  try {
    const { udhariId } = req.params;
    
    // Get original udhari transaction
    const originalUdhari = await UdhariTransaction.findById(udhariId)
      .populate('customer', 'name phone email');
    
    if (!originalUdhari) {
      return res.status(404).json({
        success: false,
        message: 'Udhari transaction not found'
      });
    }

    // Get all repayments for this udhari
    const repayments = await UdhariTransaction.find({
      sourceRef: udhariId,
      kind: 'REPAYMENT'
    }).sort({ takenDate: 1 });

    // Calculate running balance
    let runningBalance = originalUdhari.principalPaise;
    const paymentHistory = repayments.map(payment => {
      runningBalance -= payment.principalPaise;
      return {
        ...payment.toObject(),
        runningBalance: runningBalance / 100,
        paymentAmount: payment.principalPaise / 100
      };
    });

    res.json({
      success: true,
      data: {
        originalUdhari: {
          ...originalUdhari.toObject(),
          originalAmount: originalUdhari.principalPaise / 100,
          outstandingBalance: originalUdhari.outstandingBalance / 100
        },
        paymentHistory,
        summary: {
          originalAmount: originalUdhari.principalPaise / 100,
          totalPaid: (originalUdhari.principalPaise - originalUdhari.outstandingBalance) / 100,
          outstandingBalance: originalUdhari.outstandingBalance / 100,
          paymentCount: repayments.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};