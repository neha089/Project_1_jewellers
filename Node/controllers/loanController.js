import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import UdhariTransaction from '../models/UdhariTransaction.js';

export const createLoan = async (req, res) => {
  try {
    const loan = new Loan(req.body);
    await loan.save();
    
    // Create UdhariTransaction for tracking
    const udhariTxn = new UdhariTransaction({
      customer: loan.customer,
      kind: 'GIVEN',
      principalPaise: loan.principalPaise,
      direction: 1, // outgoing
      sourceType: 'LOAN',
      sourceRef: loan._id,
      note: `Loan with ${loan.interestRateMonthlyPct}% monthly interest`
    });
    await udhariTxn.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'LOAN_DISBURSEMENT',
      customer: loan.customer,
      amount: loan.principalPaise,
      direction: 1,
      description: `Loan disbursement - ${loan.interestRateMonthlyPct}% monthly interest`,
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (customer) query.customer = customer;

    const loans = await Loan.find(query)
      .populate('customer', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Loan.countDocuments(query);

    res.json({
      success: true,
      data: loans,
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

export const payLoanInterest = async (req, res) => {
  try {
    const { interestPaise } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    loan.totalInterestPaid += interestPaise;
    loan.lastInterestPaymentDate = new Date();
    await loan.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'INTEREST_RECEIVED',
      customer: loan.customer,
      amount: interestPaise,
      direction: -1,
      description: 'Loan interest payment',
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: 'INCOME'
    });
    await transaction.save();

    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const payLoanPrincipal = async (req, res) => {
  try {
    const { principalPaise } = req.body;
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    loan.totalPrincipalPaid += principalPaise;
    
    // Check if fully paid
    if (loan.totalPrincipalPaid >= loan.principalPaise) {
      loan.status = 'CLOSED';
    }
    
    await loan.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'LOAN_PAYMENT',
      customer: loan.customer,
      amount: principalPaise,
      direction: -1,
      description: 'Loan principal payment',
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: 'INCOME'
    });
    await transaction.save();

    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};