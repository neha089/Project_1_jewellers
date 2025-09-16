import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';

// Create a new loan (given or taken)
export const createLoan = async (req, res) => {
  try {
    const {
      customer,
      loanType, // "GIVEN" or "TAKEN"
      principalPaise,
      interestRateMonthlyPct,
      dueDate,
      note,
      direction // -1 for given, 1 for taken
    } = req.body;

    // Validate required fields
    if (!customer || !loanType || !principalPaise || !interestRateMonthlyPct) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: customer, loanType, principalPaise, interestRateMonthlyPct'
      });
    }

    // Ensure direction matches loanType
    const calculatedDirection = loanType === 'GIVEN' ? -1 : 1;
    const finalDirection = direction !== undefined ? direction : calculatedDirection;
    
    const loan = new Loan({
      customer,
      loanType,
      direction: finalDirection,
      principalPaise,
      outstandingPrincipal: principalPaise, // Initialize outstanding principal
      interestRateMonthlyPct,
      dueDate: dueDate ? new Date(dueDate) : null,
      note,
      status: 'ACTIVE',
      isActive: true,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      interestPaymentHistory: [],
      principalPaymentHistory: []
    });

    await loan.save();
    
    // Calculate next interest due date (first month from loan creation)
    await loan.updateNextInterestDueDate();

    // Create transaction record
    const transactionType = loanType === 'GIVEN' ? 'LOAN_GIVEN' : 'LOAN_TAKEN';
    const transactionCategory = loanType === 'GIVEN' ? 'EXPENSE' : 'INCOME';

    const transaction = new Transaction({
      type: transactionType,
      customer: loan.customer,
      amount: loan.principalPaise,
      direction: finalDirection,
      description: `Loan ${loanType.toLowerCase()} - ${loan.interestRateMonthlyPct}% monthly interest`,
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: transactionCategory,
      metadata: {
        paymentType: 'PRINCIPAL',
        originalLoanAmount: loan.principalPaise,
        interestRate: loan.interestRateMonthlyPct
      }
    });
    await transaction.save();

    // Populate customer details before sending response
    const populatedLoan = await Loan.findById(loan._id).populate('customer', 'name phone email');

    res.status(201).json({
      success: true,
      data: populatedLoan,
      message: `Loan ${loanType.toLowerCase()} created successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get all loans with filtering and pagination
export const getAllLoans = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      customer, 
      loanType,
      overdue = false,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };
    
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (loanType) query.loanType = loanType;
    
    // Handle overdue loans
    if (overdue === 'true') {
      query.nextInterestDueDate = { $lt: new Date() };
      query.status = { $in: ['ACTIVE', 'PARTIALLY_PAID'] };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const loans = await Loan.find(query)
      .populate('customer', 'name phone email')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);

    const total = await Loan.countDocuments(query);

    // Add computed fields to each loan
    const loansWithStatus = loans.map(loan => {
      const loanObj = loan.toObject();
      loanObj.paymentStatus = loan.getInterestPaymentStatus();
      return loanObj;
    });

    res.json({
      success: true,
      data: loansWithStatus,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get loans by customer ID
export const getLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, includeInactive = false } = req.query;

    const query = { customer: customerId };
    if (!includeInactive) query.isActive = true;
    if (status) query.status = status;

    const loans = await Loan.find(query)
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    // Add computed fields
    const loansWithStatus = loans.map(loan => {
      const loanObj = loan.toObject();
      loanObj.paymentStatus = loan.getInterestPaymentStatus();
      return loanObj;
    });

    // Calculate summary
    const summary = {
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
      totalPrincipalGiven: loans.filter(l => l.loanType === 'GIVEN').reduce((sum, l) => sum + l.principalPaise, 0),
      totalPrincipalTaken: loans.filter(l => l.loanType === 'TAKEN').reduce((sum, l) => sum + l.principalPaise, 0),
      totalOutstanding: loans.filter(l => ['ACTIVE', 'PARTIALLY_PAID'].includes(l.status)).reduce((sum, l) => sum + l.outstandingPrincipal, 0),
      totalPendingInterest: loans.filter(l => ['ACTIVE', 'PARTIALLY_PAID'].includes(l.status)).reduce((sum, l) => sum + l.getPendingInterestAmount(), 0)
    };

    res.json({
      success: true,
      data: loansWithStatus,
      summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// FIXED: Pay loan interest with proper outstanding balance consideration
export const payLoanInterest = async (req, res) => {
  try {
    const { interestPaise, forMonth, note } = req.body;
    const loanId = req.params.id;

    if (!interestPaise || interestPaise <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Interest amount must be greater than 0'
      });
    }

    const loan = await Loan.findById(loanId).populate('customer', 'name phone');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Cannot pay interest on closed loan'
      });
    }

    const currentMonth = forMonth || new Date().toISOString().substring(0, 7); // YYYY-MM format
    
    // Update loan interest payment
    loan.totalInterestPaid += interestPaise;
    loan.lastInterestPaymentDate = new Date();
    
    // Add to payment history with current outstanding principal
    loan.interestPaymentHistory.push({
      amount: interestPaise,
      paidDate: new Date(),
      forMonth: currentMonth,
      paidBy: loan.customer.name,
      outstandingPrincipalAtTime: loan.outstandingPrincipal // This is key - track what the outstanding was
    });

    // Update next due date
    await loan.updateNextInterestDueDate();
    await loan.save();

    // Create transaction record - direction is opposite for interest received vs paid
    const transactionDirection = loan.loanType === 'GIVEN' ? 1 : -1; // If we gave loan, receiving interest is income (+1)
    const transactionCategory = loan.loanType === 'GIVEN' ? 'INCOME' : 'EXPENSE';

    const transaction = new Transaction({
      type: loan.loanType === 'GIVEN' ? 'LOAN_INTEREST_RECEIVED' : 'INTEREST_PAID',
      customer: loan.customer._id,
      amount: interestPaise,
      direction: transactionDirection,
      description: `Interest payment for ${currentMonth} - ${loan.customer.name}`,
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: transactionCategory,
      metadata: {
        paymentType: 'INTEREST',
        interestMonth: currentMonth,
        interestRate: loan.interestRateMonthlyPct,
        outstandingPrincipalAtTime: loan.outstandingPrincipal
      }
    });
    await transaction.save();

    const updatedLoan = await Loan.findById(loanId).populate('customer', 'name phone email');
    const loanWithStatus = updatedLoan.toObject();
    loanWithStatus.paymentStatus = updatedLoan.getInterestPaymentStatus();

    res.json({
      success: true,
      data: loanWithStatus,
      message: `Interest payment of ₹${(interestPaise / 100).toFixed(2)} recorded successfully`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// FIXED: Pay loan principal with proper outstanding balance updates
export const payLoanPrincipal = async (req, res) => {
  try {
    const { principalPaise, note } = req.body;
    const loanId = req.params.id;

    if (!principalPaise || principalPaise <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Principal amount must be greater than 0'
      });
    }

    const loan = await Loan.findById(loanId).populate('customer', 'name phone');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Loan is already closed'
      });
    }

    const currentOutstanding = loan.outstandingPrincipal;
    
    if (principalPaise > currentOutstanding) {
      return res.status(400).json({
        success: false,
        error: `Payment amount (₹${(principalPaise / 100).toFixed(2)}) exceeds outstanding principal (₹${(currentOutstanding / 100).toFixed(2)})`
      });
    }

    // Store previous values for tracking
    const previousOutstanding = currentOutstanding;
    
    // Update loan principal payment
    loan.totalPrincipalPaid += principalPaise;
    loan.lastPrincipalPaymentDate = new Date();
    
    // Calculate new outstanding amount AFTER payment
    const newOutstanding = Math.max(0, currentOutstanding - principalPaise);
    loan.outstandingPrincipal = newOutstanding;
    
    // Update status based on remaining amount
    if (newOutstanding <= 0) {
      loan.status = 'CLOSED';
      loan.isActive = false;
      loan.outstandingPrincipal = 0; // Ensure it's exactly 0
    } else {
      loan.status = 'PARTIALLY_PAID';
    }

    // Add to payment history with detailed tracking
    loan.principalPaymentHistory.push({
      amount: principalPaise,
      paidDate: new Date(),
      remainingPrincipal: newOutstanding,
      paidBy: loan.customer.name,
      previousOutstanding: previousOutstanding,
      note: note || ''
    });

    await loan.save();

    // Create transaction record - direction is opposite for loan repayment
    const transactionDirection = loan.loanType === 'GIVEN' ? 1 : -1; // If we gave loan, receiving repayment is income (+1)
    const transactionCategory = loan.loanType === 'GIVEN' ? 'INCOME' : 'EXPENSE';

    const transactionType = loan.status === 'CLOSED' ? 
      'LOAN_CLOSURE' : 'LOAN_PAYMENT';

    const transaction = new Transaction({
      type: transactionType,
      customer: loan.customer._id,
      amount: principalPaise,
      direction: transactionDirection,
      description: `Principal payment - ${loan.customer.name} ${loan.status === 'CLOSED' ? '(LOAN CLOSED)' : '(PARTIAL)'}`,
      relatedDoc: loan._id,
      relatedModel: 'Loan',
      category: transactionCategory,
      metadata: {
        paymentType: loan.status === 'CLOSED' ? 'FULL_REPAYMENT_LOAN' : 'PARTIAL_REPAYMENT_LOAN',
        remainingAmount: newOutstanding,
        isPartialPayment: loan.status !== 'CLOSED',
        originalLoanAmount: loan.principalPaise,
        totalPaid: loan.totalPrincipalPaid,
        previousOutstanding: previousOutstanding
      }
    });
    await transaction.save();

    const updatedLoan = await Loan.findById(loanId).populate('customer', 'name phone email');
    const loanWithStatus = updatedLoan.toObject();
    loanWithStatus.paymentStatus = updatedLoan.getInterestPaymentStatus();

    res.json({
      success: true,
      data: loanWithStatus,
      message: loan.status === 'CLOSED' ? 
        'Loan closed successfully!' : 
        `Partial payment of ₹${(principalPaise / 100).toFixed(2)} recorded. Remaining: ₹${(newOutstanding / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

export const makeLoanPayment = async (req, res) => {
  try {
    const { principal, interest, photos, notes } = req.body;
    const loanId = req.params.id;

    // Convert to paise if needed (assuming input is in rupees)
    const principalPaise = principal ? Math.round(parseFloat(principal) * 100) : 0;
    const interestPaise = interest ? Math.round(parseFloat(interest) * 100) : 0;

    if (principalPaise <= 0 && interestPaise <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Either principal or interest amount must be greater than 0'
      });
    }

    const loan = await Loan.findById(loanId).populate('customer', 'name phone');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    if (loan.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'Loan is already closed'
      });
    }

    const transactions = [];
    let paymentSummary = [];

    // Calculate current installment number based on previous principal payments
    const currentInstallmentNumber = loan.principalPaymentHistory.length + 1;

    // Handle interest payment if provided
    if (interestPaise > 0) {
      loan.totalInterestPaid += interestPaise;
      loan.lastInterestPaymentDate = new Date();
      
      const currentMonth = new Date().toISOString().substring(0, 7);
      loan.interestPaymentHistory.push({
        amount: interestPaise,
        paidDate: new Date(),
        forMonth: currentMonth,
        paidBy: loan.customer.name,
        outstandingPrincipalAtTime: loan.outstandingPrincipal
      });

      paymentSummary.push(`Interest: ₹${(interestPaise / 100).toFixed(2)}`);

      // Create interest transaction
      transactions.push({
        type: loan.loanType === 'GIVEN' ? 'LOAN_INTEREST_RECEIVED' : 'INTEREST_PAID',
        customer: loan.customer._id,
        amount: interestPaise,
        direction: loan.loanType === 'GIVEN' ? 1 : -1,
        description: `Interest payment for ${currentMonth} - ${loan.customer.name}`,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: loan.loanType === 'GIVEN' ? 'INCOME' : 'EXPENSE',
        metadata: {
          paymentType: 'INTEREST',
          interestRate: loan.interestRateMonthlyPct,
          outstandingPrincipalAtTime: loan.outstandingPrincipal,
          interestMonth: currentMonth,
          photos: photos || []
        }
      });
    }

    // Handle principal payment if provided
    if (principalPaise > 0) {
      const currentOutstanding = loan.outstandingPrincipal;
      
      // Allow full repayment even if amount is slightly different due to rounding
      const isFullRepaymentAttempt = principalPaise >= currentOutstanding;
      
      if (principalPaise > currentOutstanding && !isFullRepaymentAttempt) {
        return res.status(400).json({
          success: false,
          error: `Principal payment amount (₹${(principalPaise / 100).toFixed(2)}) exceeds outstanding principal (₹${(currentOutstanding / 100).toFixed(2)})`
        });
      }

      const previousOutstanding = currentOutstanding;
      
      // For full repayment, use the exact outstanding amount
      const actualPayment = isFullRepaymentAttempt ? currentOutstanding : principalPaise;
      
      loan.totalPrincipalPaid += actualPayment;
      loan.lastPrincipalPaymentDate = new Date();
      
      const newOutstanding = Math.max(0, currentOutstanding - actualPayment);
      loan.outstandingPrincipal = newOutstanding;
      
      // Determine if this is a full repayment
      const isFullRepayment = newOutstanding <= 0;
      
      // Update status
      if (isFullRepayment) {
        loan.status = 'CLOSED';
        loan.isActive = false;
        loan.outstandingPrincipal = 0;
        loan.closedDate = new Date();
      } else {
        loan.status = 'PARTIALLY_PAID';
      }

      // Add to payment history with installment tracking
      loan.principalPaymentHistory.push({
        amount: actualPayment,
        paidDate: new Date(),
        remainingPrincipal: newOutstanding,
        paidBy: loan.customer.name,
        previousOutstanding: previousOutstanding,
        installmentNumber: currentInstallmentNumber,
        isFullRepayment: isFullRepayment,
        note: notes || ''
      });

      // Create appropriate transaction description and type
      let transactionDescription;
      let transactionType;

      if (isFullRepayment) {
        transactionDescription = `Loan fully repaid - ${loan.customer.name} (Final Payment)`;
        transactionType = 'LOAN_CLOSURE';
        paymentSummary.push(`Final Principal Payment: ₹${(actualPayment / 100).toFixed(2)}`);
        paymentSummary.push('LOAN COMPLETED ✓');
      } else {
        transactionDescription = `Principal payment #${currentInstallmentNumber} - ${loan.customer.name} (Partial Payment)`;
        transactionType = 'LOAN_PAYMENT';
        paymentSummary.push(`Principal Payment #${currentInstallmentNumber}: ₹${(actualPayment / 100).toFixed(2)}`);
        paymentSummary.push(`Remaining Balance: ₹${(newOutstanding / 100).toFixed(2)}`);
      }

      // Create principal transaction with existing enum values
      transactions.push({
        type: transactionType,
        customer: loan.customer._id,
        amount: actualPayment,
        direction: loan.loanType === 'GIVEN' ? 1 : -1,
        description: transactionDescription,
        relatedDoc: loan._id,
        relatedModel: 'Loan',
        category: loan.loanType === 'GIVEN' ? 'INCOME' : 'EXPENSE',
        metadata: {
          paymentType: 'PRINCIPAL', // Use existing enum value
          installmentNumber: currentInstallmentNumber,
          remainingAmount: newOutstanding,
          isPartialPayment: !isFullRepayment,
          originalLoanAmount: loan.principalPaise,
          totalPaid: loan.totalPrincipalPaid,
          previousOutstanding: previousOutstanding,
          photos: photos || [],
          // Add custom fields for additional context
          isFullRepayment: isFullRepayment,
          repaymentType: isFullRepayment ? 'FULL' : 'PARTIAL'
        }
      });
    }

    // Update next interest due date based on new outstanding amount
    if (loan.outstandingPrincipal > 0) {
      await loan.updateNextInterestDueDate();
    } else {
      // If loan is fully paid, clear next due date
      loan.nextInterestDueDate = null;
    }

    await loan.save();

    // Save all transactions
    for (const txnData of transactions) {
      const transaction = new Transaction(txnData);
      await transaction.save();
    }

    const updatedLoan = await Loan.findById(loanId).populate('customer', 'name phone email');
    const loanWithStatus = updatedLoan.toObject();
    loanWithStatus.paymentStatus = updatedLoan.getInterestPaymentStatus();

    let message = `Payment recorded: ${paymentSummary.join(', ')}`;
    if (loan.status === 'CLOSED') {
      message += ' 🎉 Congratulations! Loan has been fully repaid!';
    }

    res.json({
      success: true,
      data: loanWithStatus,
      message,
      paymentDetails: {
        installmentNumber: currentInstallmentNumber,
        isFullRepayment: loan.status === 'CLOSED',
        remainingBalance: loan.outstandingPrincipal / 100,
        totalPrincipalPaid: loan.totalPrincipalPaid / 100,
        nextInterestDueDate: loan.nextInterestDueDate
      }
    });
  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
// Get loan reminders (overdue interest payments)
export const getLoanReminders = async (req, res) => {
  try {
    const { days = 0 } = req.query; // Days ahead to check
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
      // Calculate interest based on CURRENT outstanding principal, not original
      const currentMonthInterest = (loan.outstandingPrincipal * loan.interestRateMonthlyPct) / 100;
      
      return {
        loanId: loan._id,
        customer: loan.customer,
        loanType: loan.loanType,
        principalAmount: loan.principalPaise,
        outstandingPrincipal: loan.outstandingPrincipal,
        interestRate: loan.interestRateMonthlyPct,
        monthsOverdue: paymentStatus.overdueMonths,
        pendingInterestAmount: paymentStatus.pendingAmount,
        currentMonthInterest: currentMonthInterest,
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update interest rate for a loan
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
    const transaction = new Transaction({
      type: 'LOAN_RATE_UPDATE',
      customer: loan.customer._id,
      amount: 0,
      direction: 0,
      description: `Interest rate updated from ${oldRate}% to ${interestRateMonthlyPct}% for ${loan.customer.name}`,
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Get loan details with full payment history
export const getLoanDetails = async (req, res) => {
  try {
    const loanId = req.params.id;

    const loan = await Loan.findById(loanId).populate('customer', 'name phone email address');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Loan not found'
      });
    }

    // Get related transactions
    const transactions = await Transaction.find({
      relatedDoc: loanId,
      relatedModel: 'Loan'
    }).sort({ date: -1 });

    const loanObj = loan.toObject();
    loanObj.paymentStatus = loan.getInterestPaymentStatus();
    loanObj.transactions = transactions;

    res.json({
      success: true,
      data: loanObj
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark reminder as sent
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
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
