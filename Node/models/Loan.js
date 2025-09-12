import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  loanType: {
    type: String,
    enum: ['GIVEN', 'TAKEN'],
    required: true
  },
  direction: {
    type: Number,
    enum: [-1, 1], // -1 for given, 1 for taken
    required: true
  },
  principalPaise: {
    type: Number,
    required: true,
    min: 0
  },
  outstandingPrincipal: {
    type: Number,
    default: function() {
      return this.principalPaise;
    }
  },
  interestRateMonthlyPct: {
    type: Number,
    required: true,
    min: 0,
    max: 100
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
  
  // Payment tracking
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
  
  // Payment history
  principalPaymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    paidDate: {
      type: Date,
      default: Date.now
    },
    remainingPrincipal: {
      type: Number,
      required: true
    },
    paidBy: {
      type: String,
      default: 'Customer'
    },
    previousOutstanding: Number,
    note: String
  }],
  
  interestPaymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    paidDate: {
      type: Date,
      default: Date.now
    },
    forMonth: {
      type: String, // YYYY-MM format
      required: true
    },
    paidBy: {
      type: String,
      default: 'Customer'
    },
    outstandingPrincipalAtTime: Number,
    note: String
  }],
  
  // Dates
  dueDate: {
    type: Date
  },
  nextInterestDueDate: {
    type: Date
  },
  lastInterestPaymentDate: {
    type: Date
  },
  lastPrincipalPaymentDate: {
    type: Date
  },
  
  // Reminders
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderDate: {
    type: Date
  },
  
  // Notes
  note: {
    type: String
  },
  adminNotes: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Instance method to update next interest due date
loanSchema.methods.updateNextInterestDueDate = function() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  if (!this.lastInterestPaymentDate || this.interestPaymentHistory.length === 0) {
    this.nextInterestDueDate = nextMonth;
    return;
  }

  const lastPayment = new Date(this.lastInterestPaymentDate);
  const nextDue = new Date(lastPayment.getFullYear(), lastPayment.getMonth() + 1, 1);
  
  this.nextInterestDueDate = nextDue > now ? nextDue : nextMonth;
};

// Instance method to get interest payment status
loanSchema.methods.getInterestPaymentStatus = function() {
  const now = new Date();
  
  // Calculate monthly interest based on current outstanding principal
  const monthlyInterest = (this.outstandingPrincipal * this.interestRateMonthlyPct) / 100;
  
  // Get months since loan creation
  const loanCreated = new Date(this.createdAt);
  const monthsDiff = Math.max(1, (now.getFullYear() - loanCreated.getFullYear()) * 12 + 
                    (now.getMonth() - loanCreated.getMonth()));
  
  // For partial payments, we need to calculate interest more precisely
  let totalInterestDue = 0;
  let currentBalance = this.principalPaise;
  
  // Calculate interest for each month considering principal payments
  for (let month = 0; month < monthsDiff; month++) {
    const monthStart = new Date(loanCreated.getFullYear(), loanCreated.getMonth() + month, 1);
    
    // Find principal payments made before this month
    const principalPaymentsBefore = this.principalPaymentHistory
      .filter(payment => new Date(payment.paidDate) <= monthStart)
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    currentBalance = Math.max(0, this.principalPaise - principalPaymentsBefore);
    
    if (currentBalance > 0) {
      totalInterestDue += (currentBalance * this.interestRateMonthlyPct) / 100;
    }
  }
  
  const pendingAmount = Math.max(0, totalInterestDue - this.totalInterestPaid);
  
  // Check if overdue
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
    currentMonthInterest: monthlyInterest,
    pendingAmount: pendingAmount,
    isOverdue: isOverdue,
    overdueMonths: overdueMonths,
    status: status,
    nextDueDate: this.nextInterestDueDate,
    totalDue: totalInterestDue
  };
};

// Virtual for months elapsed since loan creation
loanSchema.virtual('monthsElapsed').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return (now.getFullYear() - created.getFullYear()) * 12 + 
         (now.getMonth() - created.getMonth());
});

// Pre-save middleware
loanSchema.pre('save', function(next) {
  // Ensure outstandingPrincipal is calculated correctly
  const calculatedOutstanding = Math.max(0, this.principalPaise - (this.totalPrincipalPaid || 0));
  
  // Update outstandingPrincipal if it's not manually set or if it doesn't match calculation
  if (this.outstandingPrincipal === undefined || this.isModified('totalPrincipalPaid')) {
    this.outstandingPrincipal = calculatedOutstanding;
  }
  
  // Update status based on outstanding amount
  if (this.outstandingPrincipal <= 0 && this.status !== 'CLOSED') {
    this.status = 'CLOSED';
    this.isActive = false;
  } else if (this.totalPrincipalPaid > 0 && this.outstandingPrincipal > 0 && this.status === 'ACTIVE') {
    this.status = 'PARTIALLY_PAID';
  }
  
  next();
});

// Indexes for better query performance
loanSchema.index({ customer: 1, status: 1 });
loanSchema.index({ nextInterestDueDate: 1, status: 1 });
loanSchema.index({ loanType: 1, isActive: 1 });
loanSchema.index({ createdAt: -1 });

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
