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

    const { customer, principalPaise, interestRateMonthlyPct, note, totalInstallments = 1, dueDate, paymentMethod = 'CASH' } = req.body;

    // Validation
    if (!customer || !principalPaise || !interestRateMonthlyPct) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, principal amount, and interest rate are required' 
      });
    }

    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }

    if (interestRateMonthlyPct < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest rate cannot be negative' 
      });
    }

    const loan = new Loan({
      customer,
      loanType: 'GIVEN',
      principalPaise,
      direction: -1, // outgoing - you are giving money
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise, // Initially full amount is outstanding
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
    console.log('Loan transaction saved:', savedLoan._id);

    // Update next interest due date
    await loan.updateNextInterestDueDate();

    // Create transaction record
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
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        originalLoanAmount: principalPaise / 100,
        interestRate: interestRateMonthlyPct,
        totalInstallments,
        transactionSubType: 'LOAN_DISBURSEMENT'
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

    const { customer, principalPaise, interestRateMonthlyPct, note, totalInstallments = 1, dueDate, paymentMethod = 'CASH' } = req.body;

    // Validation
    if (!customer || !principalPaise || !interestRateMonthlyPct) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, principal amount, and interest rate are required' 
      });
    }

    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }

    if (interestRateMonthlyPct < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest rate cannot be negative' 
      });
    }

    const loan = new Loan({
      customer,
      loanType: 'TAKEN',
      principalPaise,
      direction: 1, // incoming - you are receiving money
      sourceType: 'LOAN',
      note,
      outstandingPrincipal: principalPaise, // You owe this amount
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
    console.log('Loan transaction saved:', savedLoan._id);

    // Update next interest due date
    await loan.updateNextInterestDueDate();

    // Create transaction record
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
        paymentType: 'PRINCIPAL',
        paymentMethod: paymentMethod,
        originalLoanAmount: principalPaise / 100,
        interestRate: interestRateMonthlyPct,
        totalInstallments,
        transactionSubType: 'LOAN_RECEIVED'
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
      customer, 
      principalPaise = 0, 
      interestPaise = 0, 
      sourceRef, 
      note, 
      installmentNumber, 
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Input validation
    if (!customer || !sourceRef || (principalPaise <= 0 && interestPaise <= 0)) {
      console.log('Validation failed:', { customer: !!customer, sourceRef: !!sourceRef, principalPaise, interestPaise });
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, source transaction, and at least one of principal or interest amount are required' 
      });
    }

    console.log('Looking for loan transaction:', sourceRef);

    // Find the original loan transaction
    const originalLoan = await Loan.findById(sourceRef);
    if (!originalLoan) {
      console.log('Original loan not found:', sourceRef);
      return res.status(404).json({
        success: false,
        error: 'Original loan transaction not found'
      });
    }

    console.log('Found original loan:', {
      id: originalLoan._id,
      loanType: originalLoan.loanType,
      outstandingPrincipal: originalLoan.outstandingPrincipal,
      isActive: originalLoan.isActive
    });

    // Validate transaction type
    if (originalLoan.loanType !== 'GIVEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only receive payment for loan that was given'
      });
    }

    // Check if already completed
    if (originalLoan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'This loan has already been fully paid'
      });
    }

    // Validate principal payment amount
    if (principalPaise > 0 && principalPaise > originalLoan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment amount ₹${(principalPaise/100).toFixed(2)} exceeds outstanding balance ₹${(originalLoan.outstandingPrincipal/100).toFixed(2)}`
      });
    }

    // Calculate expected interest for the current month
    const expectedInterest = (originalLoan.outstandingPrincipal * originalLoan.interestRateMonthlyPct) / 100;
    if (interestPaise > 0 && interestPaise > expectedInterest) {
      return res.status(400).json({
        success: false,
        error: `Interest payment amount ₹${(interestPaise/100).toFixed(2)} exceeds expected interest ₹${(expectedInterest/100).toFixed(2)}`
      });
    }

    // Use provided payment date or current date
    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(customer);

    // Create repayment transaction
    const repaymentLoan = new Loan({
      customer,
      loanType: 'REPAYMENT',
      principalPaise: principalPaise + interestPaise,
      direction: 1, // incoming money
      sourceType: 'LOAN',
      sourceRef,
      note: note || `Payment received - Installment #${installmentNumber || 1}`,
      installmentNumber: installmentNumber || 1,
      takenDate: transactionDate,
      isCompleted: true, // repayment transactions are always completed
      paymentMethod,
      paymentReference: reference,
      transactionId,
      status: 'CLOSED',
      isActive: false
    });

    const savedRepayment = await repaymentLoan.save();
    console.log('Repayment transaction saved:', savedRepayment._id);

    // Update original loan
    if (principalPaise > 0) {
      const newOutstanding = originalLoan.outstandingPrincipal - principalPaise;
      const isFullyPaid = newOutstanding <= 0;

      originalLoan.outstandingPrincipal = Math.max(0, newOutstanding);
      originalLoan.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
      originalLoan.isActive = !isFullyPaid;
      originalLoan.totalPrincipalPaid += principalPaise;
      originalLoan.lastPrincipalPaymentDate = transactionDate;
    }

    if (interestPaise > 0) {
      originalLoan.totalInterestPaid += interestPaise;
      originalLoan.lastInterestPaymentDate = transactionDate;
    }

    // Initialize payment history if it doesn't exist
    if (!originalLoan.paymentHistory) {
      originalLoan.paymentHistory = [];
    }

    // Add to payment history
    const paymentHistoryEntry = {
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || 1,
      transactionId: savedRepayment._id,
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    originalLoan.paymentHistory.push(paymentHistoryEntry);
    originalLoan.paidInstallments = originalLoan.paymentHistory.length;

    // Update next interest due date
    if (originalLoan.outstandingPrincipal > 0) {
      await originalLoan.updateNextInterestDueDate();
    } else {
      originalLoan.nextInterestDueDate = null;
    }

    const updatedOriginal = await originalLoan.save();
    console.log('Original loan updated:', updatedOriginal._id);

    // Create main accounting transaction record
    const transactions = [];

    if (principalPaise > 0) {
      const isFullyPaid = originalLoan.outstandingPrincipal <= 0;
      transactions.push({
        type: isFullyPaid ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer,
        amount: principalPaise / 100, // Store in rupees
        direction: 1, // incoming
        description: `Loan principal payment received from ${customerName} - Installment #${installmentNumber || 1}${note ? ` - ${note}` : ''}`,
        relatedDoc: savedRepayment._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: transactionDate,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || 1,
          originalLoanAmount: originalLoan.principalPaise / 100,
          remainingAmount: originalLoan.outstandingPrincipal / 100,
          isPartialPayment: !isFullyPaid,
          paymentPercentage: Math.round(((originalLoan.principalPaise - originalLoan.outstandingPrincipal) / originalLoan.principalPaise) * 100),
          sourceLoanId: sourceRef,
          transactionSubType: isFullyPaid ? 'LOAN_FULL_PAYMENT' : 'LOAN_PARTIAL_PAYMENT'
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = transactionDate.toISOString().substring(0, 7);
      transactions.push({
        type: 'LOAN_INTEREST_RECEIVED',
        customer,
        amount: interestPaise / 100, // Store in rupees
        direction: 1, // incoming
        description: `Loan interest payment received from ${customerName} for ${currentMonth}${note ? ` - ${note}` : ''}`,
        relatedDoc: savedRepayment._id,
        relatedModel: 'Loan',
        category: 'INCOME',
        date: transactionDate,
        metadata: {
          paymentType: 'INTEREST',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || 1,
          interestRate: originalLoan.interestRateMonthlyPct,
          forMonth: currentMonth,
          sourceLoanId: sourceRef,
          outstandingPrincipalAtTime: originalLoan.outstandingPrincipal / 100
        }
      });
    }

    // Save all transactions
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      await transaction.save();
      console.log('Accounting transaction saved:', transaction._id);
    }

    // Calculate summary for response
    const totalPaidPrincipal = originalLoan.principalPaise - originalLoan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / originalLoan.principalPaise) * 100);

    // Success response
    const response = {
      success: true,
      message: originalLoan.status === 'CLOSED' ? 'Loan fully paid and settled!' : 'Payment received successfully',
      data: {
        payment: {
          id: savedRepayment._id,
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          installmentNumber: installmentNumber || 1,
          date: savedRepayment.takenDate,
          note: savedRepayment.note,
          paymentMethod,
          paymentReference: reference,
          transactionId
        },
        loanSummary: {
          originalAmount: originalLoan.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          totalInterestPaid: originalLoan.totalInterestPaid / 100,
          remainingOutstanding: originalLoan.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid: originalLoan.status === 'CLOSED',
          totalInstallments: originalLoan.totalInstallments || 1,
          paidInstallments: originalLoan.paymentHistory.length,
          nextInterestDueDate: originalLoan.nextInterestDueDate,
          paymentHistory: originalLoan.paymentHistory.map(p => ({
            principalAmount: p.principalAmount / 100,
            interestAmount: p.interestAmount / 100,
            date: p.date,
            installmentNumber: p.installmentNumber,
            note: p.note,
            paymentMethod: p.paymentMethod,
            paymentReference: p.paymentReference,
            bankTransactionId: p.bankTransactionId
          }))
        },
        mainTransactionIds: transactions.map(t => t._id)
      }
    };

    console.log('Payment processed successfully');
    res.status(201).json(response);
  } catch (error) {
    console.error('Error in receiveLoanPayment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process loan payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Make Loan Payment (When you return money you borrowed)
export const makeLoanPayment = async (req, res) => {
  try {
    console.log('=== MAKE LOAN PAYMENT ===');
    console.log('Request body:', req.body);

    const { 
      customer, 
      principalPaise = 0, 
      interestPaise = 0, 
      sourceRef, 
      note, 
      installmentNumber,
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Input validation
    if (!customer || !sourceRef || (principalPaise <= 0 && interestPaise <= 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer, source transaction, and at least one of principal or interest amount are required' 
      });
    }

    // Find the original loan transaction
    const originalLoan = await Loan.findById(sourceRef);
    if (!originalLoan) {
      return res.status(404).json({
        success: false,
        error: 'Original loan transaction not found'
      });
    }

    if (originalLoan.loanType !== 'TAKEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only make payment for loan that was taken'
      });
    }

    if (principalPaise > originalLoan.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment amount (₹${(principalPaise/100).toFixed(2)}) cannot exceed outstanding balance (₹${(originalLoan.outstandingPrincipal/100).toFixed(2)})`
      });
    }

    // Calculate expected interest for the current month
    const expectedInterest = (originalLoan.outstandingPrincipal * originalLoan.interestRateMonthlyPct) / 100;
    if (interestPaise > 0 && interestPaise > expectedInterest) {
      return res.status(400).json({
        success: false,
        error: `Interest payment amount ₹${(interestPaise/100).toFixed(2)} exceeds expected interest ₹${(expectedInterest/100).toFixed(2)}`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(customer);

    // Create repayment transaction
    const repaymentLoan = new Loan({
      customer,
      loanType: 'REPAYMENT',
      principalPaise: principalPaise + interestPaise,
      direction: -1, // outgoing - you are paying money back
      sourceType: 'LOAN',
      sourceRef,
      note: note || `Payment made - Installment #${installmentNumber || 1}`,
      installmentNumber: installmentNumber || 1,
      takenDate: transactionDate,
      isCompleted: true,
      paymentMethod,
      paymentReference: reference,
      transactionId,
      status: 'CLOSED',
      isActive: false
    });

    const savedRepayment = await repaymentLoan.save();
    console.log('Repayment transaction saved:', savedRepayment._id);

    // Update original loan
    if (principalPaise > 0) {
      const newOutstanding = originalLoan.outstandingPrincipal - principalPaise;
      const isFullyPaid = newOutstanding <= 0;

      originalLoan.outstandingPrincipal = Math.max(0, newOutstanding);
      originalLoan.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
      originalLoan.isActive = !isFullyPaid;
      originalLoan.totalPrincipalPaid += principalPaise;
      originalLoan.lastPrincipalPaymentDate = transactionDate;
    }

    if (interestPaise > 0) {
      originalLoan.totalInterestPaid += interestPaise;
      originalLoan.lastInterestPaymentDate = transactionDate;
    }

    // Initialize payment history if it doesn't exist
    if (!originalLoan.paymentHistory) {
      originalLoan.paymentHistory = [];
    }

    // Add to payment history
    const paymentHistoryEntry = {
      principalAmount: principalPaise,
      interestAmount: interestPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || 1,
      transactionId: savedRepayment._id,
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    originalLoan.paymentHistory.push(paymentHistoryEntry);
    originalLoan.paidInstallments = originalLoan.paymentHistory.length;

    // Update next interest due date
    if (originalLoan.outstandingPrincipal > 0) {
      await originalLoan.updateNextInterestDueDate();
    } else {
      originalLoan.nextInterestDueDate = null;
    }

    const updatedOriginal = await originalLoan.save();
    console.log('Original loan updated:', updatedOriginal._id);

    // Create transaction records
    const transactions = [];

    if (principalPaise > 0) {
      const isFullyPaid = originalLoan.outstandingPrincipal <= 0;
      transactions.push({
        type: isFullyPaid ? 'LOAN_CLOSURE' : 'LOAN_PAYMENT',
        customer,
        amount: principalPaise / 100, // Store in rupees
        direction: -1, // outgoing
        description: `Loan principal payment made to ${customerName} - Installment #${installmentNumber || 1}${note ? ` - ${note}` : ''}`,
        relatedDoc: savedRepayment._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: transactionDate,
        metadata: {
          paymentType: 'PRINCIPAL',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || 1,
          originalLoanAmount: originalLoan.principalPaise / 100,
          remainingAmount: originalLoan.outstandingPrincipal / 100,
          isPartialPayment: !isFullyPaid,
          sourceLoanId: sourceRef,
          transactionSubType: isFullyPaid ? 'LOAN_FULL_REPAYMENT' : 'LOAN_PARTIAL_REPAYMENT'
        }
      });
    }

    if (interestPaise > 0) {
      const currentMonth = transactionDate.toISOString().substring(0, 7);
      transactions.push({
        type: 'INTEREST_PAID',
        customer,
        amount: interestPaise / 100, // Store in rupees
        direction: -1, // outgoing
        description: `Loan interest payment made to ${customerName} for ${currentMonth}${note ? ` - ${note}` : ''}`,
        relatedDoc: savedRepayment._id,
        relatedModel: 'Loan',
        category: 'EXPENSE',
        date: transactionDate,
        metadata: {
          paymentType: 'INTEREST',
          paymentMethod,
          paymentReference: reference,
          bankTransactionId: transactionId,
          installmentNumber: installmentNumber || 1,
          interestRate: originalLoan.interestRateMonthlyPct,
          forMonth: currentMonth,
          sourceLoanId: sourceRef,
          outstandingPrincipalAtTime: originalLoan.outstandingPrincipal / 100
        }
      });
    }

    // Save all transactions
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      await transaction.save();
      console.log('Accounting transaction saved:', transaction._id);
    }

    // Calculate summary for response
    const totalPaidPrincipal = originalLoan.principalPaise - originalLoan.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / originalLoan.principalPaise) * 100);

    res.status(201).json({ 
      success: true, 
      message: originalLoan.status === 'CLOSED' ? 'Loan fully paid!' : 'Payment made successfully',
      data: {
        payment: {
          id: savedRepayment._id,
          principalAmount: principalPaise / 100,
          interestAmount: interestPaise / 100,
          installmentNumber: installmentNumber || 1,
          date: savedRepayment.takenDate,
          note: savedRepayment.note,
          paymentMethod,
          paymentReference: reference,
          transactionId
        },
        loanSummary: {
          originalAmount: originalLoan.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          totalInterestPaid: originalLoan.totalInterestPaid / 100,
          remainingOutstanding: originalLoan.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid: originalLoan.status === 'CLOSED',
          totalInstallments: originalLoan.totalInstallments || 1,
          paidInstallments: originalLoan.paymentHistory.length,
          nextInterestDueDate: originalLoan.nextInterestDueDate,
          paymentHistory: originalLoan.paymentHistory.map(p => ({
            principalAmount: p.principalAmount / 100,
            interestAmount: p.interestAmount / 100,
            date: p.date,
            installmentNumber: p.installmentNumber,
            note: p.note,
            paymentMethod: p.paymentMethod,
            paymentReference: p.paymentReference,
            bankTransactionId: p.bankTransactionId
          }))
        },
        mainTransactionIds: transactions.map(t => t._id)
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

    // Fetch only 'LOAN' transactions for the specific customer
    const loans = await Loan.find({ customer: customerId, sourceType: 'LOAN' })
      .populate('customer', 'name phone email')
      .populate('sourceRef')
      .sort({ takenDate: -1 });

    // Calculate summary
    let totalGiven = 0;
    let totalTaken = 0;
    let outstandingToCollect = 0;
    let outstandingToPay = 0;
    let totalInterestPaid = 0;

    const givenLoans = [];
    const takenLoans = [];
    const repaymentLoans = [];

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
      } else if (loan.loanType === 'REPAYMENT') {
        repaymentLoans.push(loan);
      }
    });

    const netAmount = outstandingToCollect - outstandingToPay;

    // Get only 'LOAN' related transaction history
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
        repayments: repaymentLoans,
        all: loans
      },
      transactionHistory: relatedTransactions
    };

    console.log('Customer loan summary generated successfully');
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