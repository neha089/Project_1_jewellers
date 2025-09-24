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
      paymentMethod = 'CASH',
      takenDate
    } = req.body;

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
      direction: -1,
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      interestRateMonthlyPct,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: takenDate ? new Date(takenDate) : new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedLoan = await loan.save();
    await savedLoan.updateNextInterestDueDate();

    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'LOAN_GIVEN',
      customer,
      amount: principalPaise,
      direction: -1,
      description: `Loan given to ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedLoan._id,
      relatedModel: 'Loan',
      category: 'EXPENSE',
      date: new Date(takenDate || Date.now()),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalLoanAmount: principalPaise,
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
      paymentMethod = 'CASH',
      takenDate
    } = req.body;

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
      direction: 1,
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      interestRateMonthlyPct,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: takenDate ? new Date(takenDate) : new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedLoan = await loan.save();
    await savedLoan.updateNextInterestDueDate();

    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'LOAN_TAKEN',
      customer,
      amount: principalPaise,
      direction: 1,
      description: `Loan taken from ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedLoan._id,
      relatedModel: 'Loan',
      category: 'INCOME',
      date: new Date(takenDate || Date.now()),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalLoanAmount: principalPaise,
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

// Receive Loan Payment (Principal + Interest)
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

    if (!loanId || (principalPaise <= 0 && interestPaise <= 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Loan ID and at least one payment amount are required' 
      });
    }

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

    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    const currentDue = loan.getCurrentOutstanding(paymentDateObj);

    const accruedInterest = loan.getAccruedInterest(paymentDateObj);

    if (principalPaise > loan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(0)} exceeds remaining principal ₹${(loan.outstandingPrincipal/100).toFixed(0)}`
      });
    }

    const customerName = await getCustomerName(loan.customer._id);

    const outstandingBefore = currentDue;

    const totalPayment = principalPaise + interestPaise;

    const outstandingAfter = Math.max(0, outstandingBefore - totalPayment);

    loan.addPayment({
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: paymentDateObj,
      installmentNumber,
      note,
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId,
      outstandingBefore,
      outstandingAfter
    });

    if (outstandingAfter > 0) {
      await loan.updateNextInterestDueDate();
    } else {
      loan.nextInterestDueDate = null;
    }

    const updatedLoan = await loan.save();

    const transactions = [];
    if (principalPaise > 0) {
      transactions.push({
        type: outstandingAfter <= 0 ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer: loan.customer._id,
        amount: principalPaise,
        direction: 1,
        description: `Principal payment from ${customerName} - ${note || 'Payment received'}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: paymentDateObj,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          remainingAmount: outstandingAfter,
          isFullPayment: outstandingAfter <= 0
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = paymentDateObj.toISOString().substring(0, 7);
      transactions.push({
        type: 'LOAN_INTEREST_RECEIVED',
        customer: loan.customer._id,
        amount: interestPaise,
        direction: 1,
        description: `Interest payment from ${customerName} for ${currentMonth}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: paymentDateObj,
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

    const savedTransactions = [];
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      const saved = await transaction.save();
      savedTransactions.push(saved);
    }

    const totalPaid = loan.principalPaise - loan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaid / loan.principalPaise) * 100);

    res.status(200).json({
      success: true,
      message: outstandingAfter <= 0 ? 'Loan fully paid and settled!' : 'Payment received successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          totalAmount: (principalPaise + interestPaise) / 100,
          date: paymentDateObj,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          note: note || '',
          outstandingBefore: outstandingBefore / 100,
          outstandingAfter: outstandingAfter / 100
        },
        loanSummary: {
          originalAmount: loan.principalPaise / 100,
          accruedInterest: accruedInterest / 100,
          totalPrincipalPaid: loan.totalPrincipalPaid / 100,
          totalInterestPaid: loan.totalInterestPaid / 100,
          remainingOutstanding: outstandingAfter / 100,
          paymentPercentage,
          isFullyPaid: outstandingAfter <= 0,
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

// Make Loan Payment (When you return money you borrowed)
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

    if (!loanId || (principalPaise <= 0 && interestPaise <= 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Loan ID and at least one payment amount are required' 
      });
    }

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

    if (loan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'This loan has already been fully paid'
      });
    }

    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    const currentDue = loan.getCurrentOutstanding(paymentDateObj);

    const accruedInterest = loan.getAccruedInterest(paymentDateObj);

    if (principalPaise > loan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(0)} exceeds remaining principal ₹${(loan.outstandingPrincipal/100).toFixed(0)}`
      });
    }

    const customerName = await getCustomerName(loan.customer._id);

    const outstandingBefore = currentDue;

    const totalPayment = principalPaise + interestPaise;

    const outstandingAfter = Math.max(0, outstandingBefore - totalPayment);

    loan.addPayment({
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: paymentDateObj,
      installmentNumber,
      note,
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId,
      outstandingBefore,
      outstandingAfter
    });

    if (outstandingAfter > 0) {
      await loan.updateNextInterestDueDate();
    } else {
      loan.nextInterestDueDate = null;
    }

    const updatedLoan = await loan.save();

    const transactions = [];
    if (principalPaise > 0) {
      transactions.push({
        type: outstandingAfter <= 0 ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer: loan.customer._id,
        amount: principalPaise,
        direction: -1,
        description: `Principal payment to ${customerName} - ${note || 'Payment made'}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: paymentDateObj,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          remainingAmount: outstandingAfter,
          isFullPayment: outstandingAfter <= 0
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = paymentDateObj.toISOString().substring(0, 7);
      transactions.push({
        type: 'INTEREST_PAID',
        customer: loan.customer._id,
        amount: interestPaise,
        direction: -1,
        description: `Interest payment to ${customerName} for ${currentMonth}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: paymentDateObj,
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

    const savedTransactions = [];
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      const saved = await transaction.save();
      savedTransactions.push(saved);
    }

    const totalPaid = loan.principalPaise - loan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaid / loan.principalPaise) * 100);

    res.status(200).json({ 
      success: true, 
      message: outstandingAfter <= 0 ? 'Loan fully paid!' : 'Payment made successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          totalAmount: (principalPaise + interestPaise) / 100,
          date: paymentDateObj,
          installmentNumber: installmentNumber || loan.paymentHistory.length,
          note: note || '',
          outstandingBefore: outstandingBefore / 100,
          outstandingAfter: outstandingAfter / 100
        },
        loanSummary: {
          originalAmount: loan.principalPaise / 100,
          accruedInterest: accruedInterest / 100,
          totalPrincipalPaid: loan.totalPrincipalPaid / 100,
          totalInterestPaid: loan.totalInterestPaid / 100,
          remainingOutstanding: outstandingAfter / 100,
          paymentPercentage,
          isFullyPaid: outstandingAfter <= 0,
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

    const currentDate = new Date();
    for (const loan of loans) {
      const accruedInterest = loan.getAccruedInterest(currentDate);
      const currentOutstanding = loan.getCurrentOutstanding(currentDate);
      const loanData = {
        ...loan.toObject(),
        accruedInterest: accruedInterest / 100,
        outstandingRupees: currentOutstanding / 100
      };

      if (loan.loanType = 'GIVEN') {
        totalGiven += loan.principalPaise;
        outstandingToCollect += currentOutstanding;
        totalInterestPaid += loan.totalInterestPaid;
        givenLoans.push(loanData);
      } else if (loan.loanType = 'TAKEN') {
        totalTaken += loan.principalPaise;
        outstandingToPay += currentOutstanding;
        totalInterestPaid += loan.totalInterestPaid;
        takenLoans.push(loanData);
      }
    }

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
        all: loans.map(loan => ({
          ...loan.toObject(),
          accruedInterest: loan.getAccruedInterest(currentDate) / 100,
          outstandingRupees: loan.getCurrentOutstanding(currentDate) / 100
        }))
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

    const loan = await Loan.findById(loanId)
      .populate('customer', 'name phone email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const currentDate = new Date();

    const accruedInterest = loan.getAccruedInterest(currentDate);

    const currentOutstanding = loan.getCurrentOutstanding(currentDate);

    const formattedPaymentHistory = (loan.paymentHistory || []).map(payment => ({
      principalAmount: payment.principalAmount / 100,
      interestAmount: payment.interestAmount / 100,
      totalAmount: (payment.principalAmount + payment.interestAmount) / 100,
      date: payment.date,
      installmentNumber: payment.installmentNumber,
      note: payment.note,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      bankTransactionId: payment.bankTransactionId,
      outstandingBefore: payment.outstandingBefore / 100,
      outstandingAfter: payment.outstandingAfter / 100
    }));

    const relatedTransactions = await Transaction.find({
      relatedDoc: loanId,
      type: { $in: ['LOAN_PAYMENT', 'LOAN_CLOSURE', 'LOAN_INTEREST_RECEIVED', 'INTEREST_PAID'] }
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        originalLoan: {
          ...loan.toObject(),
          originalAmount: loan.principalPaise / 100,
          accruedInterest: accruedInterest / 100,
          outstandingBalance: currentOutstanding / 100
        },
        paymentHistory: formattedPaymentHistory,
        relatedTransactions,
        summary: {
          originalAmount: loan.principalPaise / 100,
          accruedInterest: accruedInterest / 100,
          totalPrincipalPaid: loan.totalPrincipalPaid / 100,
          totalInterestPaid: loan.totalInterestPaid / 100,
          outstandingBalance: currentOutstanding / 100,
          paymentCount: formattedPaymentHistory.length,
          isCompleted: currentOutstanding <= 0
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
      isActive: true
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    const currentDate = new Date();
    const customerWise = {};
    let totalToCollect = 0;

    for (const loan of outstandingLoans) {
      const accruedInterest = loan.getAccruedInterest(currentDate);
      const currentOutstanding = loan.getCurrentOutstanding(currentDate);
      if (currentOutstanding <= 0) continue;
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
        accruedInterest: accruedInterest / 100,
        outstandingAmount: currentOutstanding / 100
      });
      customerWise[customerId].totalOutstanding += currentOutstanding;
      customerWise[customerId].totalInterestPaid += loan.totalInterestPaid;
      totalToCollect += currentOutstanding;
    }

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
        loanCount: formattedCustomerWise.reduce((sum, item) => sum + item.loans.length, 0),
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
      isActive: true
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    const currentDate = new Date();
    const customerWise = {};
    let totalToPay = 0;

    for (const loan of outstandingLoans) {
      const accruedInterest = loan.getAccruedInterest(currentDate);
      const currentOutstanding = loan.getCurrentOutstanding(currentDate);
      if (currentOutstanding <= 0) continue;
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
        accruedInterest: accruedInterest / 100,
        outstandingAmount: currentOutstanding / 100
      });
      customerWise[customerId].totalOutstanding += currentOutstanding;
      customerWise[customerId].totalInterestPaid += loan.totalInterestPaid;
      totalToPay += currentOutstanding;
    }

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
        loanCount: formattedCustomerWise.reduce((sum, item) => sum + item.loans.length, 0),
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
    const currentDate = new Date();

    const loans = await Loan.find({ sourceType: 'LOAN' });

    const formattedSummary = {
      given: { totalAmount: 0, totalOutstanding: 0, totalInterestPaid: 0, count: 0, completedCount: 0 },
      taken: { totalAmount: 0, totalOutstanding: 0, totalInterestPaid: 0, count: 0, completedCount: 0 }
    };

    for (const loan of loans) {
      const currentOutstanding = loan.getCurrentOutstanding(currentDate);
      const isCompleted = currentOutstanding <= 0 || loan.status === 'CLOSED';
      const entry = loan.loanType === 'GIVEN' ? formattedSummary.given : formattedSummary.taken;
      entry.totalAmount += loan.principalPaise / 100;
      entry.totalOutstanding += currentOutstanding / 100;
      entry.totalInterestPaid += loan.totalInterestPaid / 100;
      entry.count += 1;
      if (isCompleted) entry.completedCount += 1;
    }

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
      const accruedInterest = loan.getAccruedInterest(checkDate);
      const paymentStatus = loan.getInterestPaymentStatus();
      const currentMonthInterest = loan.monthlyInterest;

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
        reminderMessage: `Dear ${loan.customer.name}, your loan interest of ₹${(currentMonthInterest / 100).toFixed(0)} is ${paymentStatus.isOverdue ? 'overdue' : 'due'}. Outstanding principal: ₹${(loan.outstandingPrincipal / 100).toFixed(0)}`
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
      date: new Date(),
      metadata: {
        oldRate: oldRate,
        newRate: interestRateMonthlyPct,
        updatedBy: 'Admin'
      }
    });
    await transaction.save();

    res.json({
      success: true,
      data: {
        ...loan.toObject(),
        outstandingRupees: loan.getCurrentOutstanding() / 100
      },
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