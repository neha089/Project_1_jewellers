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
    enum: ['GIVEN', 'TAKEN'],
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
  }, // +1 incoming (you receive), -1 outgoing (you pay/give)
  sourceType: {
    type: String,
    default: 'LOAN'
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
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'PARTIALLY_PAID', 'CLOSED'],
    default: 'ACTIVE',
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
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
    },
    outstandingBefore: {
      type: Number,
      min: 0
    },
    outstandingAfter: {
      type: Number,
      min: 0
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
loanSchema.index({ loanType: 1, status: 1 });
loanSchema.index({ customer: 1, loanType: 1 });
loanSchema.index({ paymentMethod: 1 });
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

// Virtual for monthly interest amount
loanSchema.virtual('monthlyInterest').get(function() {
  return (this.outstandingPrincipal * this.interestRateMonthlyPct) / 100;
});

// Virtual for months elapsed since loan was taken
loanSchema.virtual('monthsElapsed').get(function() {
  const now = new Date();
  const startDate = this.takenDate;
  const monthDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                    (now.getMonth() - startDate.getMonth());
  return Math.max(0, monthDiff);
});

// Method to calculate daily interest based on outstanding principal
loanSchema.methods.calculateDailyInterest = function (asOfDate = new Date()) {
  let totalInterestPaise = 0;
  let currentPrincipal = this.principalPaise;
  let currentDate = new Date(this.takenDate);

  const dailyRate = this.interestRateMonthlyPct / 30 / 100;

  // Get sorted principal payments before or on asOfDate
  const principalPayments = this.paymentHistory
    .filter(payment => payment.principalAmount > 0 && new Date(payment.date) <= asOfDate)
    .map(payment => ({ date: new Date(payment.date), amount: payment.principalAmount }))
    .sort((a, b) => a.date - b.date);

  // Add the asOfDate as the final "event"
  const events = [...principalPayments, { date: asOfDate, amount: 0 }];
  let eventIndex = 0;

  while (currentDate < asOfDate) {
    const nextEventDate = events[eventIndex].date;

    const periodEnd = nextEventDate > asOfDate ? asOfDate : nextEventDate;
    const days = Math.max(0, Math.floor((periodEnd - currentDate) / (1000 * 60 * 60 * 24)));

    if (days > 0) {
      totalInterestPaise += Math.round(currentPrincipal * dailyRate * days);
    }

    // Apply principal reduction if this is a payment event
    if (events[eventIndex].amount > 0) {
      currentPrincipal = Math.max(0, currentPrincipal - events[eventIndex].amount);
      eventIndex++;
    }

    currentDate = periodEnd;
  }

  return Math.max(0, totalInterestPaise);
};

// Method to get accrued interest
loanSchema.methods.getAccruedInterest = function (asOfDate = new Date()) {
  return this.calculateDailyInterest(asOfDate);
};

// Method to get current outstanding including accrued interest
loanSchema.methods.getCurrentOutstanding = function (asOfDate = new Date()) {
  const accruedInterest = this.getAccruedInterest(asOfDate);
  return this.outstandingPrincipal + accruedInterest - this.totalInterestPaid;
};

// Instance method to update next interest due date
loanSchema.methods.updateNextInterestDueDate = function() {
  if (this.outstandingPrincipal <= 0) {
    this.nextInterestDueDate = null;
    return Promise.resolve(this);
  }

  const now = new Date();
  let nextDue;

  if (!this.lastInterestPaymentDate) {
    nextDue = new Date(this.takenDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
  } else {
    nextDue = new Date(this.lastInterestPaymentDate);
    nextDue.setMonth(nextDue.getMonth() + 1);
  }

  if (nextDue < now) {
    nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  this.nextInterestDueDate = nextDue;
  return Promise.resolve(this);
};

// Instance method to calculate pending interest
loanSchema.methods.getPendingInterestAmount = function() {
  const now = new Date();
  const totalAccrued = this.getAccruedInterest(now);
  return Math.max(0, totalAccrued - this.totalInterestPaid);
};

// Instance method to get interest payment status
loanSchema.methods.getInterestPaymentStatus = function() {
  const now = new Date();
  const currentMonthlyInterest = this.monthlyInterest;
  const pendingAmount = this.getPendingInterestAmount();
  const isOverdue = this.nextInterestDueDate && this.nextInterestDueDate < now;
  
  let overdueMonths = 0;
  if (isOverdue) {
    const diffTime = Math.abs(now - this.nextInterestDueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    overdueMonths = Math.floor(diffDays / 30);
  }

  let status = 'CURRENT';
  if (overdueMonths > 2) {
    status = 'CRITICAL';
  } else if (isOverdue) {
    status = 'OVERDUE';
  }

  return {
    currentMonthInterest: currentMonthlyInterest,
    pendingAmount: pendingAmount,
    isOverdue,
    overdueMonths,
    status,
    nextDueDate: this.nextInterestDueDate,
    totalInterestDue: pendingAmount + this.totalInterestPaid
  };
};

// Method to add payment to history
loanSchema.methods.addPayment = function(paymentData) {
  const accruedInterest = this.getAccruedInterest(paymentData.date || new Date());
  const outstandingBefore = this.outstandingPrincipal + accruedInterest - this.totalInterestPaid;

  const paymentEntry = {
    principalAmount: paymentData.principalAmount || 0,
    interestAmount: paymentData.interestAmount || 0,
    date: paymentData.date || new Date(),
    installmentNumber: paymentData.installmentNumber || (this.paymentHistory.length + 1),
    note: paymentData.note || '',
    paymentMethod: paymentData.paymentMethod || 'CASH',
    paymentReference: paymentData.paymentReference || '',
    bankTransactionId: paymentData.bankTransactionId || '',
    outstandingBefore,
    outstandingAfter: Math.max(0, outstandingBefore - (paymentData.principalAmount + paymentData.interestAmount))
  };

  this.paymentHistory.push(paymentEntry);

  // Update loan amounts
  if (paymentData.principalAmount) {
    this.outstandingPrincipal = Math.max(0, this.outstandingPrincipal - paymentData.principalAmount);
    this.totalPrincipalPaid += paymentData.principalAmount;
    this.lastPrincipalPaymentDate = paymentEntry.date;
  }
  if (paymentData.interestAmount) {
    this.totalInterestPaid += paymentData.interestAmount;
    this.lastInterestPaymentDate = paymentEntry.date;
  }

  this.paidInstallments = this.paymentHistory.length;
  
  // Update status
  const isFullyPaid = this.outstandingPrincipal <= 0 && this.getPendingInterestAmount() <= 0;
  this.status = isFullyPaid ? 'CLOSED' : (this.totalPrincipalPaid > 0 || this.totalInterestPaid > 0 ? 'PARTIALLY_PAID' : 'ACTIVE');
  this.isActive = !isFullyPaid;

  return this;
};

// Method to get payment summary
loanSchema.methods.getPaymentSummary = function() {
  const totalPaid = this.principalPaise - this.outstandingPrincipal;
  const accruedInterest = this.getAccruedInterest();
  return {
    originalAmount: this.principalPaise / 100,
    totalPrincipalPaid: this.totalPrincipalPaid / 100,
    totalInterestPaid: this.totalInterestPaid / 100,
    outstandingBalance: this.getCurrentOutstanding() / 100,
    completionPercentage: this.completionPercentage,
    paymentCount: this.paymentHistory.length,
    lastPrincipalPaymentDate: this.lastPrincipalPaymentDate,
    lastInterestPaymentDate: this.lastInterestPaymentDate,
    isCompleted: this.status === 'CLOSED',
    monthlyInterest: this.monthlyInterest / 100,
    accruedInterest: accruedInterest / 100,
    nextInterestDueDate: this.nextInterestDueDate
  };
};

// Pre-save middleware to update status and calculations
loanSchema.pre('save', function(next) {
  const calculatedOutstanding = Math.max(0, this.principalPaise - (this.totalPrincipalPaid || 0));
  
  if (this.isModified('totalPrincipalPaid') || this.outstandingPrincipal === undefined) {
    this.outstandingPrincipal = calculatedOutstanding;
  }

  const isFullyPaid = this.outstandingPrincipal <= 0 && this.getPendingInterestAmount() <= 0;
  if (isFullyPaid && this.status !== 'CLOSED') {
    this.status = 'CLOSED';
    this.isActive = false;
    this.outstandingPrincipal = 0;
    this.nextInterestDueDate = null;
  } else if ((this.totalPrincipalPaid > 0 || this.totalInterestPaid > 0) && this.outstandingPrincipal > 0 && this.status === 'ACTIVE') {
    this.status = 'PARTIALLY_PAID';
  }

  next();
});

export default mongoose.model('Loan', loanSchema);