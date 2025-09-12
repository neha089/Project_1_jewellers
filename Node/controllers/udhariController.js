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
      direction: 1, // outgoing - you are giving money
      sourceType: 'UDHARI',
      note,
      outstandingBalance: principalPaise, // Initially full amount is outstanding
      totalInstallments,
      returnDate,
      takenDate: new Date()
    });
   
    await udhariTxn.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_GIVEN',
      customer,
      amount: principalPaise,
      direction: 1, // outgoing
      description: `Udhari given - ${note || 'No note'}`,
      relatedDoc: udhariTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        originalUdhariAmount: principalPaise,
        totalInstallments
      }
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari given successfully',
      data: {
        ...udhariTxn.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100
      }
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
      direction: -1, // incoming - you are receiving money
      sourceType: 'UDHARI',
      note,
      outstandingBalance: principalPaise, // You owe this amount
      totalInstallments,
      returnDate,
      takenDate: new Date()
    });
   
    await udhariTxn.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_TAKEN',
      customer,
      amount: principalPaise,
      direction: -1, // incoming
      description: `Udhari taken - ${note || 'No note'}`,
      relatedDoc: udhariTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        originalUdhariAmount: principalPaise,
        totalInstallments
      }
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari taken successfully',
      data: {
        ...udhariTxn.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Receive Udhari Payment (When someone returns money they borrowed from you)
export const receiveUdhariPayment = async (req, res) => {
  try {
    const { customer, principalPaise, sourceRef, note, installmentNumber } = req.body;

    // Input validation
    if (!customer || !principalPaise || !sourceRef) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, amount, and source transaction are required' 
      });
    }

    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment amount must be greater than zero' 
      });
    }

    // Find the original udhari transaction
    const originalUdhari = await UdhariTransaction.findById(sourceRef);
    if (!originalUdhari) {
      return res.status(404).json({
        success: false,
        error: 'Original Udhari transaction not found'
      });
    }

    // Validate transaction type
    if (originalUdhari.kind !== 'GIVEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only receive payment for udhari that was given'
      });
    }

    // Check if already completed
    if (originalUdhari.isCompleted) {
      return res.status(400).json({
        success: false,
        error: 'This udhari has already been fully paid'
      });
    }

    // Validate payment amount
    if (principalPaise > originalUdhari.outstandingBalance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount ₹${(principalPaise/100).toFixed(2)} exceeds outstanding balance ₹${(originalUdhari.outstandingBalance/100).toFixed(2)}`
      });
    }

    // Step 1: Create repayment transaction first
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: -1, // incoming money
      sourceType: 'UDHARI',
      sourceRef,
      note: note || `Payment for udhari - Installment #${installmentNumber}`,
      installmentNumber: installmentNumber || 1,
      takenDate: new Date(),
      isCompleted: true // repayment transactions are always completed
    });
    
    const savedRepayment = await repaymentTxn.save();
    console.log('Repayment transaction saved:', savedRepayment._id);

    // Step 2: Update original udhari outstanding balance
    const newOutstanding = originalUdhari.outstandingBalance - principalPaise;
    const isFullyPaid = newOutstanding <= 0;
    
    // Initialize payment history if it doesn't exist
    if (!originalUdhari.paymentHistory) {
      originalUdhari.paymentHistory = [];
    }

    // Add to payment history
    originalUdhari.paymentHistory.push({
      amount: principalPaise,
      date: new Date(),
      installmentNumber: installmentNumber || 1,
      transactionId: savedRepayment._id,
      note: note || ''
    });

    // Update original transaction
    originalUdhari.outstandingBalance = Math.max(0, newOutstanding); // Ensure no negative balance
    originalUdhari.isCompleted = isFullyPaid;
    originalUdhari.lastPaymentDate = new Date();
    originalUdhari.paidInstallments = originalUdhari.paymentHistory.length;

    const updatedOriginal = await originalUdhari.save();
    console.log('Original udhari updated:', updatedOriginal._id);

    // Step 3: Create accounting transaction record
    const transaction = new Transaction({
      type: 'UDHARI_RECEIVED',
      customer,
      amount: principalPaise,
      direction: -1, // incoming
      description: `Udhari payment received from ${originalUdhari.customer?.name || 'customer'} - Installment #${installmentNumber || 1}${note ? ` - ${note}` : ''}`,
      relatedDoc: savedRepayment._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        installmentNumber: installmentNumber || 1,
        originalUdhariAmount: originalUdhari.principalPaise,
        remainingAmount: Math.max(0, newOutstanding),
        isPartialPayment: !isFullyPaid,
        paymentPercentage: Math.round(((originalUdhari.principalPaise - Math.max(0, newOutstanding)) / originalUdhari.principalPaise) * 100),
        sourceUdhariId: sourceRef
      }
    });
    
    const savedTransaction = await transaction.save();
    console.log('Accounting transaction saved:', savedTransaction._id);

    // Calculate summary for response
    const totalPaid = originalUdhari.principalPaise - Math.max(0, newOutstanding);
    const paymentPercentage = Math.round((totalPaid / originalUdhari.principalPaise) * 100);

    // Success response
    const response = {
      success: true,
      message: isFullyPaid ? '🎉 Udhari fully paid and settled!' : '✅ Partial payment received successfully',
      data: {
        payment: {
          id: savedRepayment._id,
          amount: principalPaise / 100,
          installmentNumber: installmentNumber || 1,
          date: savedRepayment.takenDate,
          note: savedRepayment.note
        },
        udhariSummary: {
          originalAmount: originalUdhari.principalPaise / 100,
          totalPaid: totalPaid / 100,
          remainingOutstanding: Math.max(0, newOutstanding) / 100,
          paymentPercentage,
          isFullyPaid,
          totalInstallments: originalUdhari.totalInstallments || 1,
          paidInstallments: originalUdhari.paymentHistory.length,
          paymentHistory: originalUdhari.paymentHistory.map(p => ({
            amount: p.amount / 100,
            date: p.date,
            installmentNumber: p.installmentNumber,
            note: p.note
          }))
        },
        transactionId: savedTransaction._id
      }
    };

    console.log('Payment processed successfully:', response);
    res.status(201).json(response);

  } catch (error) {
    console.error('Error in receiveUdhariPayment:', error);
    
    // More detailed error response
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process udhari payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// Make Udhari Payment (When you return money you borrowed from someone)
export const makeUdhariPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, principalPaise, sourceRef, note, installmentNumber } = req.body;

    // Find the original udhari transaction
    const originalUdhari = await UdhariTransaction.findById(sourceRef).session(session);
    if (!originalUdhari) {
      throw new Error('Original Udhari transaction not found');
    }

    if (originalUdhari.kind !== 'TAKEN') {
      throw new Error('Can only make payment for udhari that was taken');
    }

    if (principalPaise > originalUdhari.outstandingBalance) {
      throw new Error(`Payment amount (₹${principalPaise/100}) cannot exceed outstanding balance (₹${originalUdhari.outstandingBalance/100})`);
    }

    // Create repayment transaction
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: 1, // outgoing - you are paying money back
      sourceType: 'UDHARI',
      sourceRef,
      note,
      installmentNumber,
      takenDate: new Date()
    });
   
    await repaymentTxn.save({ session });

    // Update original udhari outstanding balance
    const newOutstanding = originalUdhari.outstandingBalance - principalPaise;
    originalUdhari.outstandingBalance = newOutstanding;
    originalUdhari.isCompleted = newOutstanding <= 0;
    await originalUdhari.save({ session });

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_PAID',
      customer,
      amount: principalPaise,
      direction: 1, // outgoing
      description: `Udhari payment made - ${note || 'No note'}`,
      relatedDoc: repaymentTxn._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        installmentNumber,
        originalUdhariAmount: originalUdhari.principalPaise,
        remainingAmount: newOutstanding
      }
    });
    await transaction.save({ session });

    await session.commitTransaction();

    res.status(201).json({ 
      success: true, 
      message: 'Udhari payment made successfully',
      data: {
        payment: {
          ...repaymentTxn.toObject(),
          principalRupees: principalPaise / 100
        },
        remainingOutstanding: newOutstanding / 100,
        isFullyPaid: newOutstanding <= 0
      }
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
};

// Get customer-wise udhari summary
export const getCustomerUdhariSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const transactions = await UdhariTransaction.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .populate('sourceRef')
      .sort({ takenDate: -1 });

    // Calculate summary
    let totalGiven = 0;           // How much you gave to this customer
    let totalTaken = 0;           // How much you took from this customer
    let outstandingToCollect = 0; // How much this customer owes you
    let outstandingToPay = 0;     // How much you owe this customer

    const givenTransactions = [];
    const takenTransactions = [];
    const repaymentTransactions = [];

    transactions.forEach(txn => {
      if (txn.kind === 'GIVEN') {
        totalGiven += txn.principalPaise;
        outstandingToCollect += txn.outstandingBalance;
        givenTransactions.push(txn);
      } else if (txn.kind === 'TAKEN') {
        totalTaken += txn.principalPaise;
        outstandingToPay += txn.outstandingBalance;
        takenTransactions.push(txn);
      } else if (txn.kind === 'REPAYMENT') {
        repaymentTransactions.push(txn);
      }
    });

    const netAmount = outstandingToCollect - outstandingToPay;

    const summary = {
      customer: transactions[0]?.customer,
      totalGiven: totalGiven / 100,           // Total amount given to customer
      totalTaken: totalTaken / 100,           // Total amount taken from customer
      outstandingToCollect: outstandingToCollect / 100, // Amount customer owes you
      outstandingToPay: outstandingToPay / 100,         // Amount you owe customer
      netAmount: netAmount / 100,             // Net amount (+ means customer owes you, - means you owe customer)
      transactions: {
        given: givenTransactions,
        taken: takenTransactions,
        repayments: repaymentTransactions,
        all: transactions
      }
    };
console.log(summary);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all outstanding amounts (money you need to collect)
export const getOutstandingToCollect = async (req, res) => {
  try {
    const outstandingUdhari = await UdhariTransaction.find({
      kind: 'GIVEN',
      isCompleted: false,
      outstandingBalance: { $gt: 0 }
    })
    .populate('customer', 'name phone email address')
    .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToCollect = 0;

    outstandingUdhari.forEach(txn => {
      const customerId = txn.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: txn.customer,
          transactions: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].transactions.push({
        ...txn.toObject(),
        originalAmount: txn.principalPaise / 100,
        outstandingAmount: txn.outstandingBalance / 100
      });
      customerWise[customerId].totalOutstanding += txn.outstandingBalance;
      totalToCollect += txn.outstandingBalance;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100
    }));

    res.json({
      success: true,
      data: {
        totalToCollect: totalToCollect / 100,
        customerCount: formattedCustomerWise.length,
        transactionCount: outstandingUdhari.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all outstanding amounts (money you need to pay back)
export const getOutstandingToPay = async (req, res) => {
  try {
    const outstandingUdhari = await UdhariTransaction.find({
      kind: 'TAKEN',
      isCompleted: false,
      outstandingBalance: { $gt: 0 }
    })
    .populate('customer', 'name phone email address')
    .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToPay = 0;

    outstandingUdhari.forEach(txn => {
      const customerId = txn.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: txn.customer,
          transactions: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].transactions.push({
        ...txn.toObject(),
        originalAmount: txn.principalPaise / 100,
        outstandingAmount: txn.outstandingBalance / 100
      });
      customerWise[customerId].totalOutstanding += txn.outstandingBalance;
      totalToPay += txn.outstandingBalance;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100
    }));

    res.json({
      success: true,
      data: {
        totalToPay: totalToPay / 100,
        customerCount: formattedCustomerWise.length,
        transactionCount: outstandingUdhari.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get overall udhari summary
export const getOverallUdhariSummary = async (req, res) => {
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
      taken: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 }
    };

    summary.forEach(item => {
      if (item._id === 'GIVEN') {
        formattedSummary.given = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          count: item.count,
          completedCount: item.completedCount
        };
      } else if (item._id === 'TAKEN') {
        formattedSummary.taken = {
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
        totalToCollect: formattedSummary.given.totalOutstanding,
        totalToPay: formattedSummary.taken.totalOutstanding,
        netOutstanding: netOutstanding, // Positive means you're owed money, negative means you owe money
        totalTransactions: formattedSummary.given.count + formattedSummary.taken.count
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment history for a specific udhari transaction
export const getPaymentHistory = async (req, res) => {
  try {
    const { udhariId } = req.params;
    
    const originalUdhari = await UdhariTransaction.findById(udhariId)
      .populate('customer', 'name phone email');
    
    if (!originalUdhari) {
      return res.status(404).json({
        success: false,
        message: 'Udhari transaction not found'
      });
    }

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
        paymentAmount: payment.principalPaise / 100,
        runningBalance: runningBalance / 100,
        date: payment.takenDate
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
          paymentCount: repayments.length,
          isCompleted: originalUdhari.isCompleted
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};