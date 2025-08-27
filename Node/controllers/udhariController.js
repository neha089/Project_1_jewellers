import UdhariTransaction from '../models/UdhariTransaction.js';
import Transaction from '../models/Transaction.js';

export const giveUdhari = async (req, res) => {
  try {
    const { customer, principalPaise, note, totalInstallments = 1 } = req.body;
    
    const udhariTxn = new UdhariTransaction({
      customer,
      kind: 'GIVEN',
      principalPaise,
      direction: 1, // outgoing
      sourceType: 'UDHARI',
      note,
      outstandingBalance: principalPaise,
      totalInstallments
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

    res.status(201).json({ success: true, data: udhariTxn });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

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
      description: `Udhari repayment - ${note || 'No note'}`,
      relatedDoc: repaymentTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: repaymentTxn });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllUdhariTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, customer, kind, isCompleted } = req.query;
    const query = {};
    
    if (customer) query.customer = customer;
    if (kind) query.kind = kind;
    if (isCompleted !== undefined) query.isCompleted = isCompleted === 'true';

    const transactions = await UdhariTransaction.find(query)
      .populate('customer', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ takenDate: -1 });

    const total = await UdhariTransaction.countDocuments(query);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getOutstandingUdhari = async (req, res) => {
  try {
    const { customer } = req.params;
    
    const outstandingUdhari = await UdhariTransaction.find({
      customer,
      kind: 'GIVEN',
      isCompleted: false,
      sourceType: 'UDHARI'
    }).populate('customer', 'name phone');

    const totalOutstanding = outstandingUdhari.reduce((sum, txn) => sum + txn.outstandingBalance, 0);

    res.json({
      success: true,
      data: {
        transactions: outstandingUdhari,
        totalOutstanding
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};