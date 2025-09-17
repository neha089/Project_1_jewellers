import UdhariTransaction from '../models/UdhariTransaction.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// Give Udhari (Lend money to someone)
export const giveUdhari = async (req, res) => {
  try {
    console.log('=== GIVE UDHARI ===');
    console.log('Request body:', req.body);
    
    const { customer, principalPaise, note, totalInstallments = 1, returnDate, paymentMethod = 'CASH' } = req.body;
    
    // Validation
    if (!customer || !principalPaise) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer and principal amount are required' 
      });
    }
    
    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }
   
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
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod
    });
   
    const savedUdhari = await udhariTxn.save();
    console.log('Udhari transaction saved:', savedUdhari._id);

    // Create transaction record
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'UDHARI_GIVEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: 1, // outgoing
      description: `Udhari given to ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedUdhari._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        originalUdhariAmount: principalPaise / 100,
        totalInstallments,
        transactionSubType: 'UDHARI_DISBURSEMENT'
      }
    });
    
    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Udhari given successfully',
      data: {
        ...savedUdhari.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in giveUdhari:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Take Udhari (Borrow money from someone)
export const takeUdhari = async (req, res) => {
  try {
    console.log('=== TAKE UDHARI ===');
    console.log('Request body:', req.body);
    
    const { customer, principalPaise, note, totalInstallments = 1, returnDate, paymentMethod = 'CASH' } = req.body;
    
    // Validation
    if (!customer || !principalPaise) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer and principal amount are required' 
      });
    }
    
    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }
   
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
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod
    });
   
    const savedUdhari = await udhariTxn.save();
    console.log('Udhari transaction saved:', savedUdhari._id);

    // Create transaction record
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'UDHARI_TAKEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: -1, // incoming
      description: `Udhari taken from ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedUdhari._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME',
      date: new Date(),
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        originalUdhariAmount: principalPaise / 100,
        totalInstallments,
        transactionSubType: 'UDHARI_RECEIVED'
      }
    });
    
    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Udhari taken successfully',
      data: {
        ...savedUdhari.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in takeUdhari:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Receive Udhari Payment (When someone pays back money you lent them)
export const receiveUdhariPayment = async (req, res) => {
  try {
    console.log('=== RECEIVE UDHARI PAYMENT ===');
    console.log('Request body:', req.body);
    
    const { 
      customer, 
      principalPaise, 
      sourceRef, 
      note, 
      installmentNumber, 
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Input validation
    if (!customer || !principalPaise || !sourceRef) {
      console.log('Validation failed:', { customer: !!customer, principalPaise: !!principalPaise, sourceRef: !!sourceRef });
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

    console.log('Looking for udhari transaction:', sourceRef);

    // Find the original udhari transaction
    const originalUdhari = await UdhariTransaction.findById(sourceRef);
    if (!originalUdhari) {
      console.log('Original udhari not found:', sourceRef);
      return res.status(404).json({
        success: false,
        error: 'Original Udhari transaction not found'
      });
    }

    console.log('Found original udhari:', {
      id: originalUdhari._id,
      kind: originalUdhari.kind,
      outstandingBalance: originalUdhari.outstandingBalance,
      isCompleted: originalUdhari.isCompleted
    });

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

    // Use provided payment date or current date
    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(customer);

    // Step 1: Create repayment transaction first
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: -1, // incoming money
      sourceType: 'UDHARI',
      sourceRef,
      note: note || `Payment received - Installment #${installmentNumber || 1}`,
      installmentNumber: installmentNumber || 1,
      takenDate: transactionDate,
      isCompleted: true, // repayment transactions are always completed
      paymentMethod: paymentMethod,
      paymentReference: reference,
      transactionId: transactionId
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
    const paymentHistoryEntry = {
      amount: principalPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || 1,
      transactionId: savedRepayment._id,
      note: note || '',
      paymentMethod: paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    originalUdhari.paymentHistory.push(paymentHistoryEntry);

    // Update original transaction
    originalUdhari.outstandingBalance = Math.max(0, newOutstanding);
    originalUdhari.isCompleted = isFullyPaid;
    originalUdhari.lastPaymentDate = transactionDate;
    originalUdhari.paidInstallments = originalUdhari.paymentHistory.length;

    const updatedOriginal = await originalUdhari.save();
    console.log('Original udhari updated:', updatedOriginal._id);

    // Step 3: Create main accounting transaction record
    const transaction = new Transaction({
      type: 'UDHARI_RECEIVED',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: -1, // incoming
      description: `Udhari payment received from ${customerName} - Installment #${installmentNumber || 1}${note ? ` - ${note}` : ''}`,
      relatedDoc: savedRepayment._id,
      relatedModel: 'UdhariTransaction',
      category: 'INCOME',
      date: transactionDate,
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        paymentReference: reference,
        bankTransactionId: transactionId,
        installmentNumber: installmentNumber || 1,
        originalUdhariAmount: originalUdhari.principalPaise / 100,
        remainingAmount: Math.max(0, newOutstanding) / 100,
        isPartialPayment: !isFullyPaid,
        paymentPercentage: Math.round(((originalUdhari.principalPaise - Math.max(0, newOutstanding)) / originalUdhari.principalPaise) * 100),
        sourceUdhariId: sourceRef,
        transactionSubType: isFullyPaid ? 'UDHARI_FULL_PAYMENT' : 'UDHARI_PARTIAL_PAYMENT'
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
      message: isFullyPaid ? 'Udhari fully paid and settled!' : 'Partial payment received successfully',
      data: {
        payment: {
          id: savedRepayment._id,
          amount: principalPaise / 100,
          installmentNumber: installmentNumber || 1,
          date: savedRepayment.takenDate,
          note: savedRepayment.note,
          paymentMethod: paymentMethod,
          paymentReference: reference,
          transactionId: transactionId
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
            note: p.note,
            paymentMethod: p.paymentMethod,
            paymentReference: p.paymentReference,
            bankTransactionId: p.bankTransactionId
          }))
        },
        mainTransactionId: savedTransaction._id
      }
    };

    console.log('Payment processed successfully');
    res.status(201).json(response);

  } catch (error) {
    console.error('Error in receiveUdhariPayment:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process udhari payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Make Udhari Payment (When you return money you borrowed from someone)
export const makeUdhariPayment = async (req, res) => {
  try {
    console.log('=== MAKE UDHARI PAYMENT ===');
    console.log('Request body:', req.body);
    
    const { 
      customer, 
      principalPaise, 
      sourceRef, 
      note, 
      installmentNumber,
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Input validation
    if (!customer || !principalPaise || !sourceRef) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, amount, and source transaction are required' 
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

    if (originalUdhari.kind !== 'TAKEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only make payment for udhari that was taken'
      });
    }

    if (principalPaise > originalUdhari.outstandingBalance) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (₹${principalPaise/100}) cannot exceed outstanding balance (₹${originalUdhari.outstandingBalance/100})`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(customer);

    // Create repayment transaction
    const repaymentTxn = new UdhariTransaction({
      customer,
      kind: 'REPAYMENT',
      principalPaise,
      direction: 1, // outgoing - you are paying money back
      sourceType: 'UDHARI',
      sourceRef,
      note: note || `Payment made - Installment #${installmentNumber || 1}`,
      installmentNumber: installmentNumber || 1,
      takenDate: transactionDate,
      isCompleted: true,
      paymentMethod: paymentMethod,
      paymentReference: reference,
      transactionId: transactionId
    });
   
    const savedRepayment = await repaymentTxn.save();
    console.log('Repayment transaction saved:', savedRepayment._id);

    // Update original udhari outstanding balance
    const newOutstanding = originalUdhari.outstandingBalance - principalPaise;
    const isFullyPaid = newOutstanding <= 0;

    // Initialize payment history if it doesn't exist
    if (!originalUdhari.paymentHistory) {
      originalUdhari.paymentHistory = [];
    }

    // Add to payment history
    const paymentHistoryEntry = {
      amount: principalPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || 1,
      transactionId: savedRepayment._id,
      note: note || '',
      paymentMethod: paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    originalUdhari.paymentHistory.push(paymentHistoryEntry);
    originalUdhari.outstandingBalance = Math.max(0, newOutstanding);
    originalUdhari.isCompleted = isFullyPaid;
    originalUdhari.lastPaymentDate = transactionDate;
    originalUdhari.paidInstallments = originalUdhari.paymentHistory.length;

    const updatedOriginal = await originalUdhari.save();
    console.log('Original udhari updated:', updatedOriginal._id);

    // Create transaction record
    const transaction = new Transaction({
      type: 'UDHARI_PAID',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: 1, // outgoing
      description: `Udhari payment made to ${customerName} - Installment #${installmentNumber || 1}${note ? ` - ${note}` : ''}`,
      relatedDoc: savedRepayment._id,
      relatedModel: 'UdhariTransaction',
      category: 'EXPENSE',
      date: transactionDate,
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        paymentReference: reference,
        bankTransactionId: transactionId,
        installmentNumber: installmentNumber || 1,
        originalUdhariAmount: originalUdhari.principalPaise / 100,
        remainingAmount: Math.max(0, newOutstanding) / 100,
        isPartialPayment: !isFullyPaid,
        sourceUdhariId: sourceRef,
        transactionSubType: isFullyPaid ? 'UDHARI_FULL_REPAYMENT' : 'UDHARI_PARTIAL_REPAYMENT'
      }
    });
    
    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: isFullyPaid ? 'Udhari fully paid!' : 'Partial payment made successfully',
      data: {
        payment: {
          ...savedRepayment.toObject(),
          principalRupees: principalPaise / 100
        },
        remainingOutstanding: Math.max(0, newOutstanding) / 100,
        isFullyPaid,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in makeUdhariPayment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Helper function to get customer name
const getCustomerName = async (customerId) => {
  try {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(customerId).select('name');
    return customer?.name || 'Unknown Customer';
  } catch (error) {
    console.warn('Could not fetch customer name:', error.message);
    return 'Unknown Customer';
  }
};

export const getCustomerUdhariSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Fetch only 'UDHARI' transactions for the specific customer
    const transactions = await UdhariTransaction.find({ customer: customerId, sourceType: 'UDHARI' })
      .populate('customer', 'name phone email')
      .populate('sourceRef')
      .sort({ takenDate: -1 });

    // Calculate summary
    let totalGiven = 0;
    let totalTaken = 0;
    let outstandingToCollect = 0;
    let outstandingToPay = 0;

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

    // Get only 'UDHARI' related transaction history (strict filter)
    const relatedTransactions = await Transaction.find({
      customer: customerId,
      type: { $in: ['UDHARI_GIVEN', 'UDHARI_TAKEN', 'UDHARI_RECEIVED', 'UDHARI_PAID'] }
    }).sort({ date: -1 });

    const summary = {
      customer: transactions[0]?.customer,
      totalGiven: totalGiven / 100,
      totalTaken: totalTaken / 100,
      outstandingToCollect: outstandingToCollect / 100,
      outstandingToPay: outstandingToPay / 100,
      netAmount: netAmount / 100,
      transactions: {
        given: givenTransactions,
        taken: takenTransactions,
        repayments: repaymentTransactions,
        all: transactions
      },
      transactionHistory: relatedTransactions
    };

    console.log('Customer udhari summary generated successfully');
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getCustomerUdhariSummary:', error);
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

    // Get all repayment transactions
    const repayments = await UdhariTransaction.find({
      sourceRef: udhariId,
      kind: 'REPAYMENT'
    }).sort({ takenDate: 1 });

    // Get related Transaction records for complete history
    const relatedTransactions = await Transaction.find({
      $or: [
        { relatedDoc: udhariId },
        { relatedDoc: { $in: repayments.map(r => r._id) } }
      ]
    }).sort({ date: 1 });

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

    // Format payment history from the original udhari's paymentHistory array
    const formattedPaymentHistory = (originalUdhari.paymentHistory || []).map(payment => ({
      amount: payment.amount / 100,
      date: payment.date,
      installmentNumber: payment.installmentNumber,
      note: payment.note,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      bankTransactionId: payment.bankTransactionId,
      transactionId: payment.transactionId
    }));

    res.json({
      success: true,
      data: {
        originalUdhari: {
          ...originalUdhari.toObject(),
          originalAmount: originalUdhari.principalPaise / 100,
          outstandingBalance: originalUdhari.outstandingBalance / 100
        },
        paymentHistory: formattedPaymentHistory,
        repaymentTransactions: paymentHistory,
        relatedTransactions: relatedTransactions,
        summary: {
          originalAmount: originalUdhari.principalPaise / 100,
          totalPaid: (originalUdhari.principalPaise - originalUdhari.outstandingBalance) / 100,
          outstandingBalance: originalUdhari.outstandingBalance / 100,
          paymentCount: formattedPaymentHistory.length,
          isCompleted: originalUdhari.isCompleted
        }
      }
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
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
    console.error('Error in getOutstandingToCollect:', error);
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
    console.error('Error in getOutstandingToPay:', error);
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
        netOutstanding: netOutstanding,
        totalTransactions: formattedSummary.given.count + formattedSummary.taken.count
      }
    });
  } catch (error) {
    console.error('Error in getOverallUdhariSummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};