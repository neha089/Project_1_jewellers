import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

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

// Give Loan (Lend money to someone)
export const giveLoan = async (req, res) => {
  try {
    console.log('=== GIVE LOAN ===');
    console.log('Request body:', req.body);

    const { 
      customer, 
      principalPaise, 
      interestRateMonthlyPct, 
      note, 
      totalInstallments = 1, 
      dueDate, 
      paymentMethod = 'CASH' 
    } = req.body;

    // Validation
    if (!customer || !principalPaise || !interestRateMonthlyPct) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, principal amount, and interest rate are required' 
      });
    }

    if (principalPaise <= 0 || interestRateMonthlyPct < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero and interest rate cannot be negative' 
      });
    }

    const loan = new Loan({
      customer,
      loanType: 'GIVEN',
      principalPaise,
      direction: -1, // outgoing - you are giving money
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      interestRateMonthlyPct,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedLoan = await loan.save();
    
    // Update next interest due date
    await savedLoan.updateNextInterestDueDate();

    // Create transaction record for the loan disbursement
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'LOAN_GIVEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: -1, // outgoing
      description: `Loan given to ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedLoan._id,
      relatedModel: 'Loan',
      category: 'EXPENSE',
      date: new Date(),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalLoanAmount: principalPaise / 100,
        interestRate: interestRateMonthlyPct,
        totalInstallments
      }
    });

    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Loan given successfully',
      data: {
        ...savedLoan.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in giveLoan:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Take Loan (Borrow money from someone)
export const takeLoan = async (req, res) => {
  try {
    console.log('=== TAKE LOAN ===');
    console.log('Request body:', req.body);

    const { 
      customer, 
      principalPaise, 
      interestRateMonthlyPct, 
      note, 
      totalInstallments = 1, 
      dueDate, 
      paymentMethod = 'CASH' 
    } = req.body;

    // Validation
    if (!customer || !principalPaise || !interestRateMonthlyPct) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, principal amount, and interest rate are required' 
      });
    }

    if (principalPaise <= 0 || interestRateMonthlyPct < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero and interest rate cannot be negative' 
      });
    }

    const loan = new Loan({
      customer,
      loanType: 'TAKEN',
      principalPaise,
      direction: 1, // incoming - you are receiving money
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      interestRateMonthlyPct,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedLoan = await loan.save();
    
    // Update next interest due date
    await savedLoan.updateNextInterestDueDate();

    // Create transaction record for loan received
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'LOAN_TAKEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: 1, // incoming
      description: `Loan taken from ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedLoan._id,
      relatedModel: 'Loan',
      category: 'INCOME',
      date: new Date(),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalLoanAmount: principalPaise / 100,
        interestRate: interestRateMonthlyPct,
        totalInstallments
      }
    });

    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Loan taken successfully',
      data: {
        ...savedLoan.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in takeLoan:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Receive Loan Payment (Principal + Interest) - Updated to use payment history
export const receiveLoanPayment = async (req, res) => {
  try {
    console.log('=== RECEIVE LOAN PAYMENT ===');
    console.log('Request body:', req.body);

    const { 
      loanId,
      principalPaise = 0, 
      interestPaise = 0, 
      note, 
      installmentNumber, 
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Validation
    if (!loanId || (principalPaise <= 0 && interestPaise <= 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Loan ID and at least one payment amount are required' 
      });
    }

    // Find the loan
    const loan = await Loan.findById(loanId).populate('customer', 'name phone email');
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.loanType !== 'GIVEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only receive payment for loans that were given'
      });
    }

    if (loan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'This loan has already been fully paid'
      });
    }

    // Validate amounts
    if (principalPaise > 0 && principalPaise > loan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(2)} exceeds outstanding ₹${(loan.outstandingPrincipal/100).toFixed(2)}`
      });
    }

    const expectedInterest = (loan.outstandingPrincipal * loan.interestRateMonthlyPct) / 100;
    if (interestPaise > 0 && interestPaise > expectedInterest) {
      return res.status(400).json({
        success: false,
        error: `Interest payment ₹${(interestPaise/100).toFixed(2)} exceeds expected ₹${(expectedInterest/100).toFixed(2)}`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(loan.customer._id);

    // Add payment to history
    const paymentEntry = {
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || (loan.paymentHistory.length + 1),
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    loan.paymentHistory.push(paymentEntry);

    // Update loan amounts
    if (principalPaise > 0) {
      loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - principalPaise);
      loan.totalPrincipalPaid += principalPaise;
      loan.lastPrincipalPaymentDate = transactionDate;
    }

    if (interestPaise > 0) {
      loan.totalInterestPaid += interestPaise;
      loan.lastInterestPaymentDate = transactionDate;
    }

    // Update loan status
    const isFullyPaid = loan.outstandingPrincipal <= 0;
    loan.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
    loan.isActive = !isFullyPaid;
    loan.paidInstallments = loan.paymentHistory.length;

    // Update next interest due date
    if (loan.outstandingPrincipal > 0) {
      await loan.updateNextInterestDueDate();
    } else {
      loan.nextInterestDueDate = null;
    }

    const updatedLoan = await loan.save();

    // Create transaction records
    const transactions = [];

    if (principalPaise > 0) {
      transactions.push({
        type: isFullyPaid ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer: loan.customer._id,
        amount: principalPaise / 100,
        direction: 1, // incoming
        description: `Principal payment from ${customerName} - ${note || 'Payment received'}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: transactionDate,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          remainingAmount: loan.outstandingPrincipal / 100,
          isFullPayment: isFullyPaid
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = transactionDate.toISOString().substring(0, 7);
      transactions.push({
        type: 'LOAN_INTEREST_RECEIVED',
        customer: loan.customer._id,
        amount: interestPaise / 100,
        direction: 1, // incoming
        description: `Interest payment from ${customerName} for ${currentMonth}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: transactionDate,
        metadata: {
          paymentType: 'INTEREST',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          forMonth: currentMonth,
          interestRate: loan.interestRateMonthlyPct
        }
      });
    }

    // Save all transactions
    const savedTransactions = [];
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      const saved = await transaction.save();
      savedTransactions.push(saved);
    }

    const totalPaidPrincipal = loan.principalPaise - loan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / loan.principalPaise) * 100);

    res.status(200).json({
      success: true,
      message: isFullyPaid ? 'Loan fully paid and settled!' : 'Payment received successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          totalAmount: (principalPaise + interestPaise) / 100,
          date: transactionDate,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          note: note || ''
        },
        loanSummary: {
          originalAmount: loan.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          totalInterestPaid: loan.totalInterestPaid / 100,
          remainingOutstanding: loan.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid,
          totalInstallments: loan.totalInstallments,
          paidInstallments: loan.paymentHistory.length,
          nextInterestDueDate: loan.nextInterestDueDate
        },
        transactionIds: savedTransactions.map(t => t._id)
      }
    });
  } catch (error) {
    console.error('Error in receiveLoanPayment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process loan payment'
    });
  }
};

// Make Loan Payment (When you return money you borrowed) - Updated to use payment history
export const makeLoanPayment = async (req, res) => {
  try {
    console.log('=== MAKE LOAN PAYMENT ===');
    console.log('Request body:', req.body);

    const { 
      loanId,
      principalPaise = 0, 
      interestPaise = 0, 
      note, 
      installmentNumber,
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Validation
    if (!loanId || (principalPaise <= 0 && interestPaise <= 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Loan ID and at least one payment amount are required' 
      });
    }

    // Find the loan
    const loan = await Loan.findById(loanId).populate('customer', 'name phone email');
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.loanType !== 'TAKEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only make payment for loans that were taken'
      });
    }

    if (principalPaise > loan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(2)} exceeds outstanding ₹${(loan.outstandingPrincipal/100).toFixed(2)}`
      });
    }

    const expectedInterest = (loan.outstandingPrincipal * loan.interestRateMonthlyPct) / 100;
    if (interestPaise > 0 && interestPaise > expectedInterest) {
      return res.status(400).json({
        success: false,
        error: `Interest payment ₹${(interestPaise/100).toFixed(2)} exceeds expected ₹${(expectedInterest/100).toFixed(2)}`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(loan.customer._id);

    // Add payment to history
    const paymentEntry = {
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || (loan.paymentHistory.length + 1),
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    loan.paymentHistory.push(paymentEntry);

    // Update loan amounts
    if (principalPaise > 0) {
      loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - principalPaise);
      loan.totalPrincipalPaid += principalPaise;
      loan.lastPrincipalPaymentDate = transactionDate;
    }

    if (interestPaise > 0) {
      loan.totalInterestPaid += interestPaise;
      loan.lastInterestPaymentDate = transactionDate;
    }

    // Update loan status
    const isFullyPaid = loan.outstandingPrincipal <= 0;
    loan.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
    loan.isActive = !isFullyPaid;
    loan.paidInstallments = loan.paymentHistory.length;

    // Update next interest due date
    if (loan.outstandingPrincipal > 0) {
      await loan.updateNextInterestDueDate();
    } else {
      loan.nextInterestDueDate = null;
    }

    const updatedLoan = await loan.save();

    // Create transaction records
    const transactions = [];

    if (principalPaise > 0) {
      transactions.push({
        type: isFullyPaid ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer: loan.customer._id,
        amount: principalPaise / 100,
        direction: -1, // outgoing
        description: `Principal payment to ${customerName} - ${note || 'Payment made'}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: transactionDate,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          remainingAmount: loan.outstandingPrincipal / 100,
          isFullPayment: isFullyPaid
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = transactionDate.toISOString().substring(0, 7);
      transactions.push({
        type: 'INTEREST_PAID',
        customer: loan.customer._id,
        amount: interestPaise / 100,
        direction: -1, // outgoing
        description: `Interest payment to ${customerName} for ${currentMonth}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: transactionDate,
        metadata: {
          paymentType: 'INTEREST',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          forMonth: currentMonth,
          interestRate: loan.interestRateMonthlyPct
        }
      });
    }

    // Save all transactions
    const savedTransactions = [];
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      const saved = await transaction.save();
      savedTransactions.push(saved);
    }

    const totalPaidPrincipal = loan.principalPaise - loan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / loan.principalPaise) * 100);

    res.status(200).json({ 
      success: true, 
      message: isFullyPaid ? 'Loan fully paid!' : 'Payment made successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          totalAmount: (principalPaise + interestPaise) / 100,
          date: transactionDate,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          note: note || ''
        },
        loanSummary: {
          originalAmount: loan.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          totalInterestPaid: loan.totalInterestPaid / 100,
          remainingOutstanding: loan.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid,
          totalInstallments: loan.totalInstallments,
          paidInstallments: loan.paymentHistory.length,
          nextInterestDueDate: loan.nextInterestDueDate
        },
        transactionIds: savedTransactions.map(t => t._id)
      }
    });
  } catch (error) {
    console.error('Error in makeLoanPayment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get Customer Loan Summary
export const getCustomerLoanSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const loans = await Loan.find({ customer: customerId, sourceType: 'LOAN' })
      .populate('customer', 'name phone email')
      .sort({ takenDate: -1 });

    let totalGiven = 0;
    let totalTaken = 0;
    let outstandingToCollect = 0;
    let outstandingToPay = 0;
    let totalInterestPaid = 0;

    const givenLoans = [];
    const takenLoans = [];

    loans.forEach(loan => {
      if (loan.loanType === 'GIVEN') {
        totalGiven += loan.principalPaise;
        outstandingToCollect += loan.outstandingPrincipal;
        totalInterestPaid += loan.totalInterestPaid;
        givenLoans.push(loan);
      } else if (loan.loanType === 'TAKEN') {
        totalTaken += loan.principalPaise;
        outstandingToPay += loan.outstandingPrincipal;
        totalInterestPaid += loan.totalInterestPaid;
        takenLoans.push(loan);
      }
    });

    const netAmount = outstandingToCollect - outstandingToPay;

    const relatedTransactions = await Transaction.find({
      customer: customerId,
      type: { $in: ['LOAN_GIVEN', 'LOAN_TAKEN', 'LOAN_PAYMENT', 'LOAN_CLOSURE', 'LOAN_INTEREST_RECEIVED', 'INTEREST_PAID'] }
    }).sort({ date: -1 });

    const summary = {
      customer: loans[0]?.customer,
      totalGiven: totalGiven / 100,
      totalTaken: totalTaken / 100,
      outstandingToCollect: outstandingToCollect / 100,
      outstandingToPay: outstandingToPay / 100,
      totalInterestPaid: totalInterestPaid / 100,
      netAmount: netAmount / 100,
      loans: {
        given: givenLoans,
        taken: takenLoans,
        all: loans
      },
      transactionHistory: relatedTransactions
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getCustomerLoanSummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Payment History for a Specific Loan
export const getPaymentHistory = async (req, res) => {
  try {
    const { loanId } = req.params;

    const originalLoan = await Loan.findById(loanId)
      .populate('customer', 'name phone email');

    if (!originalLoan) {
      return res.status(404).json({
        success: false,
        message: 'Loan transaction not found'
      });
    }

    // Get all repayment transactions
    const repayments = await Loan.find({
      sourceRef: loanId,
      loanType: 'REPAYMENT'
    }).sort({ takenDate: 1 });

    // Get related Transaction records
    const relatedTransactions = await Transaction.find({
      $or: [
        { relatedDoc: loanId },
        { relatedDoc: { $in: repayments.map(r => r._id) } }
      ]
    }).sort({ date: 1 });

    // Calculate running balance
    let runningBalance = originalLoan.principalPaise;
    const paymentHistory = repayments.map(payment => {
      runningBalance -= payment.principalPaise;
      return {
        ...payment.toObject(),
        principalAmount: payment.principalPaise / 100,
        runningBalance: runningBalance / 100,
        date: payment.takenDate
      };
    });

    // Format payment history
    const formattedPaymentHistory = (originalLoan.paymentHistory || []).map(payment => ({
      principalAmount: payment.principalAmount / 100,
      interestAmount: payment.interestAmount / 100,
      date: payment.date,
      installmentNumber: payment.installmentNumber,
      note: payment.note,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      bankTransactionId: payment.bankTransactionId
    }));

    res.json({
      success: true,
      data: {
        originalLoan: {
          ...originalLoan.toObject(),
          originalAmount: originalLoan.principalPaise / 100,
          outstandingBalance: originalLoan.outstandingPrincipal / 100
        },
        paymentHistory: formattedPaymentHistory,
        repaymentTransactions: paymentHistory,
        relatedTransactions,
        summary: {
          originalAmount: originalLoan.principalPaise / 100,
          totalPrincipalPaid: (originalLoan.principalPaise - originalLoan.outstandingPrincipal) / 100,
          totalInterestPaid: originalLoan.totalInterestPaid / 100,
          outstandingBalance: originalLoan.outstandingPrincipal / 100,
          paymentCount: formattedPaymentHistory.length,
          isCompleted: originalLoan.status === 'CLOSED'
        }
      }
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Outstanding Amounts to Collect
export const getOutstandingToCollect = async (req, res) => {
  try {
    const outstandingLoans = await Loan.find({
      loanType: 'GIVEN',
      status: { $ne: 'CLOSED' },
      outstandingPrincipal: { $gt: 0 }
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToCollect = 0;

    outstandingLoans.forEach(loan => {
      const customerId = loan.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: loan.customer,
          loans: [],
          totalOutstanding: 0,
          totalInterestPaid: 0
        };
      }
      customerWise[customerId].loans.push({
        ...loan.toObject(),
        originalAmount: loan.principalPaise / 100,
        outstandingAmount: loan.outstandingPrincipal / 100,
        interestRate: loan.interestRateMonthlyPct
      });
      customerWise[customerId].totalOutstanding += loan.outstandingPrincipal;
      customerWise[customerId].totalInterestPaid += loan.totalInterestPaid;
      totalToCollect += loan.outstandingPrincipal;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100,
      totalInterestPaid: item.totalInterestPaid / 100
    }));

    res.json({
      success: true,
      data: {
        totalToCollect: totalToCollect / 100,
        customerCount: formattedCustomerWise.length,
        loanCount: outstandingLoans.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    console.error('Error in getOutstandingToCollect:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Outstanding Amounts to Pay
export const getOutstandingToPay = async (req, res) => {
  try {
    const outstandingLoans = await Loan.find({
      loanType: 'TAKEN',
      status: { $ne: 'CLOSED' },
      outstandingPrincipal: { $gt: 0 }
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToPay = 0;

    outstandingLoans.forEach(loan => {
      const customerId = loan.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: loan.customer,
          loans: [],
          totalOutstanding: 0,
          totalInterestPaid: 0
        };
      }
      customerWise[customerId].loans.push({
        ...loan.toObject(),
        originalAmount: loan.principalPaise / 100,
        outstandingAmount: loan.outstandingPrincipal / 100,
        interestRate: loan.interestRateMonthlyPct
      });
      customerWise[customerId].totalOutstanding += loan.outstandingPrincipal;
      customerWise[customerId].totalInterestPaid += loan.totalInterestPaid;
      totalToPay += loan.outstandingPrincipal;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100,
      totalInterestPaid: item.totalInterestPaid / 100
    }));

    res.json({
      success: true,
      data: {
        totalToPay: totalToPay / 100,
        customerCount: formattedCustomerWise.length,
        loanCount: outstandingLoans.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    console.error('Error in getOutstandingToPay:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Overall Loan Summary
export const getOverallLoanSummary = async (req, res) => {
  try {
    const summary = await Loan.aggregate([
      {
        $match: { sourceType: 'LOAN' },
        $group: {
          _id: '$loanType',
          totalAmount: { $sum: '$principalPaise' },
          totalOutstanding: { $sum: '$outstandingPrincipal' },
          totalInterestPaid: { $sum: '$totalInterestPaid' },
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          }
        }
      }
    ]);

    const formattedSummary = {
      given: { totalAmount: 0, totalOutstanding: 0, totalInterestPaid: 0, count: 0, completedCount: 0 },
      taken: { totalAmount: 0, totalOutstanding: 0, totalInterestPaid: 0, count: 0, completedCount: 0 }
    };

    summary.forEach(item => {
      if (item._id === 'GIVEN') {
        formattedSummary.given = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          totalInterestPaid: item.totalInterestPaid / 100,
          count: item.count,
          completedCount: item.completedCount
        };
      } else if (item._id === 'TAKEN') {
        formattedSummary.taken = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          totalInterestPaid: item.totalInterestPaid / 100,
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
        totalInterestPaid: (formattedSummary.given.totalInterestPaid + formattedSummary.taken.totalInterestPaid),
        netOutstanding: netOutstanding,
        totalLoans: formattedSummary.given.count + formattedSummary.taken.count
      }
    });
  } catch (error) {
    console.error('Error in getOverallLoanSummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Loan Reminders (Overdue Payments)
export const getLoanReminders = async (req, res) => {
  try {
    const { days = 0 } = req.query;
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + parseInt(days));

    const overdueLoans = await Loan.find({
      status: { $in: ['ACTIVE', 'PARTIALLY_PAID'] },
      isActive: true,
      $or: [
        { nextInterestDueDate: { $lte: checkDate } },
        { nextInterestDueDate: null, monthsElapsed: { $gte: 1 } }
      ]
    }).populate('customer', 'name phone email');

    const reminders = overdueLoans.map(loan => {
      const paymentStatus = loan.getInterestPaymentStatus();
      const currentMonthInterest = (loan.outstandingPrincipal * loan.interestRateMonthlyPct) / 100;

      return {
        loanId: loan._id,
        customer: loan.customer,
        loanType: loan.loanType,
        principalAmount: loan.principalPaise / 100,
        outstandingPrincipal: loan.outstandingPrincipal / 100,
        interestRate: loan.interestRateMonthlyPct,
        monthsOverdue: paymentStatus.overdueMonths,
        pendingInterestAmount: paymentStatus.pendingAmount / 100,
        currentMonthInterest: currentMonthInterest / 100,
        nextDueDate: paymentStatus.nextDueDate,
        status: paymentStatus.status,
        lastInterestPayment: loan.lastInterestPaymentDate,
        reminderMessage: `Dear ${loan.customer.name}, your loan interest of ₹${(currentMonthInterest / 100).toFixed(2)} is ${paymentStatus.isOverdue ? 'overdue' : 'due'}. Outstanding principal: ₹${(loan.outstandingPrincipal / 100).toFixed(2)}`
      };
    });

    res.json({
      success: true,
      data: reminders,
      summary: {
        totalReminders: reminders.length,
        criticalReminders: reminders.filter(r => r.status === 'CRITICAL').length,
        overdueReminders: reminders.filter(r => r.status === 'OVERDUE').length,
        totalPendingInterest: reminders.reduce((sum, r) => sum + r.pendingInterestAmount, 0)
      }
    });
  } catch (error) {
    console.error('Error in getLoanReminders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Interest Rate
export const updateInterestRate = async (req, res) => {
  try {
    const { interestRateMonthlyPct, note } = req.body;
    const loanId = req.params.id;

    if (!interestRateMonthlyPct || interestRateMonthlyPct < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid interest rate is required'
      });
    }

    const loan = await Loan.findById(loanId).populate('customer', 'name phone');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    const oldRate = loan.interestRateMonthlyPct;
    loan.interestRateMonthlyPct = interestRateMonthlyPct;
    loan.adminNotes = note || `Interest rate updated from ${oldRate}% to ${interestRateMonthlyPct}%`;

    await loan.save();

    // Create transaction record for rate change
    const customerName = await getCustomerName(loan.customer._id);
    const transaction = new Transaction({
      type: 'LOAN_RATE_UPDATE',
      customer: loan.customer._id,
      amount: 0,
      direction: 0,
      description: `Interest rate updated from ${oldRate}% to ${interestRateMonthlyPct}% for ${customerName}`,
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: 'UPDATE',
      metadata: {
        oldRate: oldRate,
        newRate: interestRateMonthlyPct,
        updatedBy: 'Admin'
      }
    });
    await transaction.save();

    res.json({
      success: true,
      data: loan,
      message: `Interest rate updated from ${oldRate}% to ${interestRateMonthlyPct}% successfully`
    });
  } catch (error) {
    console.error('Error in updateInterestRate:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Mark Reminder as Sent
export const markReminderSent = async (req, res) => {
  try {
    const loanId = req.params.id;

    const loan = await Loan.findByIdAndUpdate(
      loanId,
      {
        reminderSent: true,
        lastReminderDate: new Date()
      },
      { new: true }
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    res.json({
      success: true,
      data: loan,
      message: 'Reminder marked as sent'
    });
  } catch (error) {
    console.error('Error in markReminderSent:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
