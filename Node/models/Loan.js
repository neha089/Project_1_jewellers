import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  loanType: {
    type: String,
    enum: ['GIVEN', 'TAKEN', 'REPAYMENT'],
    required: true,
    index: true
  },
  principalPaise: { 
    type: Number, 
    required: true,
    min: 0 
  },
  direction: { 
    type: Number, 
    enum: [1, -1], 
    required: true 
  }, // +1 outgoing (you pay/give), -1 incoming (you receive)
  sourceType: {
    type: String,
    default: 'LOAN'
  },
  sourceRef: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan'
  },
  note: { 
    type: String,
    trim: true
  },
  outstandingPrincipal: { 
    type: Number, 
    default: function() { return this.principalPaise; },
    min: 0
  },
  isCompleted: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  totalInstallments: { 
    type: Number, 
    default: 1,
    min: 1
  },
  paidInstallments: {
    type: Number,
    default: 0,
    min: 0
  },
  interestRateMonthlyPct: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPrincipalPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  totalInterestPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  takenDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  dueDate: { 
    type: Date 
  },
  lastPrincipalPaymentDate: {
    type: Date
  },
  lastInterestPaymentDate: {
    type: Date
  },
  nextInterestDueDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PARTIALLY_PAID', 'CLOSED'],
    default: 'ACTIVE'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'GPAY', 'PHONEPE', 'PAYTM', 'CHEQUE', 'CARD', 'ONLINE'],
    default: 'CASH'
  },
  paymentReference: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentHistory: [{
    principalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    interestAmount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    installmentNumber: {
      type: Number,
      default: 1
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan'
    },
    note: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'GPAY', 'PHONEPE', 'PAYTM', 'CHEQUE', 'CARD', 'ONLINE'],
      default: 'CASH'
    },
    paymentReference: {
      type: String,
      trim: true
    },
    bankTransactionId: {
      type: String,
      trim: true
    }
  }],
  adminNotes: {
    type: String,
    trim: true
  },
  metadata: {
    photos: [{
      type: String,
      trim: true
    }],
    documents: [{
      type: String,
      trim: true
    }],
    additionalNotes: {
      type: String,
      trim: true
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
loanSchema.index({ customer: 1, takenDate: -1 });
loanSchema.index({ loanType: 1, isCompleted: 1 });
loanSchema.index({ sourceRef: 1 });
loanSchema.index({ customer: 1, loanType: 1 });
loanSchema.index({ paymentMethod: 1 });
loanSchema.index({ 'paymentHistory.date': -1 });
loanSchema.index({ nextInterestDueDate: 1, status: 1 });
loanSchema.index({ outstandingPrincipal: 1, isActive: 1 });

// Virtual for amount in rupees
loanSchema.virtual('principalRupees').get(function() {
  return this.principalPaise / 100;
});

loanSchema.virtual('outstandingRupees').get(function() {
  return this.outstandingPrincipal / 100;
});

// Virtual for payment completion percentage
loanSchema.virtual('completionPercentage').get(function() {
  if (this.principalPaise === 0) return 0;
  const paidAmount = this.principalPaise - this.outstandingPrincipal;
  return Math.round((paidAmount / this.principalPaise) * 100);
});

// Virtual for next due amount
loanSchema.virtual('nextDueAmount').get(function() {
  if (this.isCompleted || this.totalInstallments <= 1) return 0;
  const remainingInstallments = this.totalInstallments - (this.paidInstallments || 0);
  if (remainingInstallments <= 0) return 0;
  return Math.round(this.outstandingPrincipal / remainingInstallments);
});

// Virtual for monthly interest
loanSchema.virtual('monthlyInterest').get(function() {
  return (this.outstandingPrincipal * this.interestRateMonthlyPct) / 100;
});

// Instance method to update next interest due date
loanSchema.methods.updateNextInterestDueDate = function() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  if (!this.lastInterestPaymentDate || this.paymentHistory.length === 0) {
    this.nextInterestDueDate = nextMonth;
    return this.save();
  }

  const lastPayment = new Date(this.lastInterestPaymentDate);
  const nextDue = new Date(lastPayment.getFullYear(), lastPayment.getMonth() + 1, 1);

  this.nextInterestDueDate = nextDue > now ? nextDue : nextMonth;
  return this.save();
};

// Instance method to calculate pending interest
loanSchema.methods.getPendingInterestAmount = function() {
  const now = new Date();
  const loanStartDate = new Date(this.createdAt);

  let totalInterestDue = 0;
  let currentDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth(), 1);

  while (currentDate < now) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let outstandingForMonth = this.principalPaise;
    const principalPaidBeforeMonth = this.paymentHistory
      .filter(payment => new Date(payment.date) <= monthEnd && payment.principalAmount > 0)
      .reduce((total, payment) => total + payment.principalAmount, 0);

    outstandingForMonth = Math.max(0, this.principalPaise - principalPaidBeforeMonth);

    if (outstandingForMonth > 0) {
      const monthlyInterest = (outstandingForMonth * this.interestRateMonthlyPct) / 100;
      totalInterestDue += monthlyInterest;
    }

    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }

  return Math.max(0, totalInterestDue - this.totalInterestPaid);
};

// Instance method to get interest payment status
loanSchema.methods.getInterestPaymentStatus = function() {
  const now = new Date();
  const currentMonthlyInterest = (this.outstandingPrincipal * this.interestRateMonthlyPct) / 100;
  const pendingAmount = this.getPendingInterestAmount();
  const isOverdue = this.nextInterestDueDate && this.nextInterestDueDate < now;
  const overdueMonths = isOverdue ? 
    Math.max(0, Math.floor((now - this.nextInterestDueDate) / (30 * 24 * 60 * 60 * 1000))) : 0;

  let status = 'CURRENT';
  if (overdueMonths > 2) {
    status = 'CRITICAL';
  } else if (isOverdue) {
    status = 'OVERDUE';
  }

  return {
    currentMonthInterest: currentMonthlyInterest / 100,
    pendingAmount: pendingAmount / 100,
    isOverdue,
    overdueMonths,
    status,
    nextDueDate: this.nextInterestDueDate,
    totalInterestDue: (pendingAmount + this.totalInterestPaid) / 100
  };
};

// Method to format for display
loanSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    customer: this.customer,
    loanType: this.loanType,
    amount: this.principalPaise / 100,
    outstandingBalance: this.outstandingPrincipal / 100,
    direction: this.direction,
    date: this.takenDate,
    dueDate: this.dueDate,
    note: this.note,
    isCompleted: this.isCompleted,
    completionPercentage: this.completionPercentage,
    interestRate: this.interestRateMonthlyPct,
    monthlyInterest: this.monthlyInterest / 100,
    installmentInfo: {
      current: this.installmentNumber,
      total: this.totalInstallments,
      paid: this.paidInstallments || 0,
      remaining: this.totalInstallments - (this.paidInstallments || 0)
    },
    paymentInfo: {
      method: this.paymentMethod,
      reference: this.paymentReference,
      transactionId: this.transactionId
    },
    formattedAmount: `₹${(this.principalPaise / 100).toFixed(2)}`,
    formattedOutstanding: `₹${(this.outstandingPrincipal / 100).toFixed(2)}`,
    transactionType: this.direction === 1 ? 'Outgoing' : 'Incoming',
    paymentHistory: this.paymentHistory || []
  };
};

// Method to add payment to history
loanSchema.methods.addPayment = function(paymentData) {
  if (!this.paymentHistory) {
    this.paymentHistory = [];
  }

  this.paymentHistory.push({
    principalAmount: paymentData.principalAmount || 0,
    interestAmount: paymentData.interestAmount || 0,
    date: paymentData.date || new Date(),
    installmentNumber: paymentData.installmentNumber || (this.paymentHistory.length + 1),
    transactionId: paymentData.transactionId,
    note: paymentData.note || '',
    paymentMethod: paymentData.paymentMethod || 'CASH',
    paymentReference: paymentData.paymentReference || '',
    bankTransactionId: paymentData.bankTransactionId || ''
  });

  if (paymentData.principalAmount) {
    this.outstandingPrincipal = Math.max(0, this.outstandingPrincipal - paymentData.principalAmount);
    this.totalPrincipalPaid += paymentData.principalAmount;
    this.lastPrincipalPaymentDate = paymentData.date || new Date();
  }

  if (paymentData.interestAmount) {
    this.totalInterestPaid += paymentData.interestAmount;
    this.lastInterestPaymentDate = paymentData.date || new Date();
  }

  this.paidInstallments = this.paymentHistory.length;
  this.isCompleted = this.outstandingPrincipal <= 0;
  this.status = this.isCompleted ? 'CLOSED' : (this.totalPrincipalPaid > 0 ? 'PARTIALLY_PAID' : 'ACTIVE');
  this.isActive = !this.isCompleted;

  return this.save();
};

// Method to get payment summary
loanSchema.methods.getPaymentSummary = function() {
  const totalPaid = this.principalPaise - this.outstandingPrincipal;
  return {
    originalAmount: this.principalPaise / 100,
    totalPrincipalPaid: totalPaid / 100,
    totalInterestPaid: this.totalInterestPaid / 100,
    outstandingBalance: this.outstandingPrincipal / 100,
    completionPercentage: this.completionPercentage,
    paymentCount: this.paymentHistory ? this.paymentHistory.length : 0,
    lastPrincipalPaymentDate: this.lastPrincipalPaymentDate,
    lastInterestPaymentDate: this.lastInterestPaymentDate,
    isCompleted: this.isCompleted,
    nextDueAmount: this.nextDueAmount / 100,
    monthlyInterest: this.monthlyInterest / 100
  };
};

// Static method to get customer summary with payment details
loanSchema.statics.getCustomerSummaryWithPayments = async function(customerId) {
  const loans = await this.find({ customer: customerId, sourceType: 'LOAN' }).sort({ takenDate: -1 });

  let totalGiven = 0;
  let totalTaken = 0;
  let outstandingToCollect = 0;
  let outstandingToPay = 0;
  let totalPaymentsReceived = 0;
  let totalPaymentsMade = 0;
  let totalInterestPaid = 0;

  const paymentsByMethod = {};
  const monthlyPayments = {};

  loans.forEach(loan => {
    if (loan.loanType === 'GIVEN') {
      totalGiven += loan.principalPaise;
      outstandingToCollect += loan.outstandingPrincipal;
      totalInterestPaid += loan.totalInterestPaid;
    } else if (loan.loanType === 'TAKEN') {
      totalTaken += loan.principalPaise;
      outstandingToPay += loan.outstandingPrincipal;
      totalInterestPaid += loan.totalInterestPaid;
    } else if (loan.loanType === 'REPAYMENT') {
      if (loan.direction === 1) { // Received payment
        totalPaymentsReceived += loan.principalPaise;
      } else { // Made payment
        totalPaymentsMade += loan.principalPaise;
      }

      const method = loan.paymentMethod || 'CASH';
      paymentsByMethod[method] = (paymentsByMethod[method] || 0) + loan.principalPaise;

      const monthKey = loan.takenDate.toISOString().substr(0, 7);
      monthlyPayments[monthKey] = (monthlyPayments[monthKey] || 0) + loan.principalPaise;
    }

    if (loan.paymentHistory && loan.paymentHistory.length > 0) {
      loan.paymentHistory.forEach(payment => {
        const method = payment.paymentMethod || 'CASH';
        paymentsByMethod[method] = (paymentsByMethod[method] || 0) + (payment.principalAmount + payment.interestAmount);

        const monthKey = payment.date.toISOString().substr(0, 7);
        monthlyPayments[monthKey] = (monthlyPayments[monthKey] || 0) + (payment.principalAmount + payment.interestAmount);
      });
    }
  });

  return {
    totalGiven: totalGiven / 100,
    totalTaken: totalTaken / 100,
    outstandingToCollect: outstandingToCollect / 100,
    outstandingToPay: outstandingToPay / 100,
    totalInterestPaid: totalInterestPaid / 100,
    netAmount: (outstandingToCollect - outstandingToPay) / 100,
    totalPaymentsReceived: totalPaymentsReceived / 100,
    totalPaymentsMade: totalPaymentsMade / 100,
    paymentsByMethod: Object.keys(paymentsByMethod).map(method => ({
      method,
      amount: paymentsByMethod[method] / 100
    })),
    monthlyPayments: Object.keys(monthlyPayments).map(month => ({
      month,
      amount: monthlyPayments[month] / 100
    })).sort((a, b) => a.month.localeCompare(b.month)),
    loans
  };
};

// Static method to get payment method statistics
loanSchema.statics.getPaymentMethodStats = async function(dateFrom, dateTo) {
  const matchConditions = {
    loanType: 'REPAYMENT'
  };

  if (dateFrom || dateTo) {
    matchConditions.takenDate = {};
    if (dateFrom) matchConditions.takenDate.$gte = new Date(dateFrom);
    if (dateTo) matchConditions.takenDate.$lte = new Date(dateTo);
  }

  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$principalPaise' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$principalPaise' }
      }
    },
    {
      $project: {
        paymentMethod: '$_id',
        totalAmount: { $divide: ['$totalAmount', 100] },
        count: 1,
        avgAmount: { $divide: ['$avgAmount', 100] },
        _id: 0
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Pre-save middleware
loanSchema.pre('save', function(next) {
  if (this.isNew && (this.loanType === 'GIVEN' || this.loanType === 'TAKEN')) {
    if (this.outstandingPrincipal === 0) {
      this.outstandingPrincipal = this.principalPaise;
    }
  }

  if (!this.paymentHistory) {
    this.paymentHistory = [];
  }

  const calculatedOutstanding = Math.max(0, this.principalPaise - (this.totalPrincipalPaid || 0));
  if (this.isModified('totalPrincipalPaid') || this.outstandingPrincipal === undefined) {
    this.outstandingPrincipal = calculatedOutstanding;
  }

  if (this.outstandingPrincipal <= 0 && this.status !== 'CLOSED') {
    this.status = 'CLOSED';
    this.isActive = false;
    this.outstandingPrincipal = 0;
    this.nextInterestDueDate = null;
  } else if (this.totalPrincipalPaid > 0 && this.outstandingPrincipal > 0 && this.status === 'ACTIVE') {
    this.status = 'PARTIALLY_PAID';
  }

  next();
});

export default mongoose.model('Loan', loanSchema);