import GoldLoan from '../models/GoldLoan.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';

export const createGoldLoan = async (req, res) => {
  try {
    const goldLoan = new GoldLoan(req.body);
    await goldLoan.save();
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'GOLD_LOAN_DISBURSEMENT',
      customer: goldLoan.customer,
      amount: goldLoan.principalPaise,
      direction: 1, // outgoing
      description: `Gold loan disbursement - ${goldLoan.items.length} items`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllGoldLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (customer) query.customer = customer;

    const goldLoans = await GoldLoan.find(query)
      .populate('customer', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await GoldLoan.countDocuments(query);

    res.json({
      success: true,
      data: goldLoans,
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

export const getGoldLoanById = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }
    res.json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const addPayment = async (req, res) => {
  try {
    const { principalPaise = 0, interestPaise = 0, photos = [] } = req.body;
    
    const goldLoan = await GoldLoan.findById(req.params.id);
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    goldLoan.payments.push({
      date: new Date(),
      principalPaise,
      interestPaise,
      photos
    });

    // Check if loan is fully paid
    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    if (totalPaid >= goldLoan.principalPaise) {
      goldLoan.status = 'CLOSED';
    }

    await goldLoan.save();

    // Create transaction records
    if (principalPaise > 0) {
      const principalTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer,
        amount: principalPaise,
        direction: -1, // incoming
        description: 'Gold loan principal payment',
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await principalTransaction.save();
    }

    if (interestPaise > 0) {
      const interestTransaction = new Transaction({
        type: 'INTEREST_RECEIVED',
        customer: goldLoan.customer,
        amount: interestPaise,
        direction: -1, // incoming
        description: 'Gold loan interest payment',
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await interestTransaction.save();
    }

    res.json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const closeGoldLoan = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findByIdAndUpdate(
      req.params.id,
      { status: 'CLOSED' },
      { new: true }
    );
    
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    res.json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};