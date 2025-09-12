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
    outstandingPrincipalAtTime: Number, // Track what the outstanding principal was when this interest was paid
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

// FIXED: Instance method to calculate pending interest based on outstanding principal over time
loanSchema.methods.getPendingInterestAmount = function() {
  const now = new Date();
  const loanStartDate = new Date(this.createdAt);
  
  let totalInterestDue = 0;
  let currentDate = new Date(loanStartDate.getFullYear(), loanStartDate.getMonth(), 1); // Start of loan month
  
  // Calculate interest month by month, considering principal payments
  while (currentDate < now) {
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of current month
    
    // Find the outstanding principal for this month
    let outstandingForMonth = this.principalPaise;
    
    // Subtract any principal payments made before or during this month
    const principalPaidBeforeMonth = this.principalPaymentHistory
      .filter(payment => new Date(payment.paidDate) <= monthEnd)
      .reduce((total, payment) => total + payment.amount, 0);
    
    outstandingForMonth = Math.max(0, this.principalPaise - principalPaidBeforeMonth);
    
    // If there's outstanding principal, add interest for this month
    if (outstandingForMonth > 0) {
      const monthlyInterest = (outstandingForMonth * this.interestRateMonthlyPct) / 100;
      totalInterestDue += monthlyInterest;
    }
    
    // Move to next month
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  }
  
  // Return pending interest (total due minus total paid)
  return Math.max(0, totalInterestDue - this.totalInterestPaid);
};

// ENHANCED: Instance method to get interest payment status with accurate calculations
loanSchema.methods.getInterestPaymentStatus = function() {
  const now = new Date();
  
  // Calculate monthly interest based on CURRENT outstanding principal
  const currentMonthlyInterest = (this.outstandingPrincipal * this.interestRateMonthlyPct) / 100;
  
  // Get pending interest amount using the improved calculation
  const pendingAmount = this.getPendingInterestAmount();
  
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
    currentMonthInterest: currentMonthlyInterest,
    pendingAmount: pendingAmount,
    isOverdue: isOverdue,
    overdueMonths: overdueMonths,
    status: status,
    nextDueDate: this.nextInterestDueDate,
    totalInterestDue: pendingAmount + this.totalInterestPaid
  };
};

// Virtual for months elapsed since loan creation
loanSchema.virtual('monthsElapsed').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  return Math.max(1, (now.getFullYear() - created.getFullYear()) * 12 + 
         (now.getMonth() - created.getMonth()));
});

// ENHANCED: Pre-save middleware with better outstanding principal calculation
loanSchema.pre('save', function(next) {
  // Calculate outstanding principal based on payments
  const calculatedOutstanding = Math.max(0, this.principalPaise - (this.totalPrincipalPaid || 0));
  
  // Update outstandingPrincipal if it doesn't match the calculation
  if (this.isModified('totalPrincipalPaid') || this.outstandingPrincipal === undefined) {
    this.outstandingPrincipal = calculatedOutstanding;
  }
  
  // Update status based on outstanding amount
  if (this.outstandingPrincipal <= 0 && this.status !== 'CLOSED') {
    this.status = 'CLOSED';
    this.isActive = false;
    this.outstandingPrincipal = 0; // Ensure it's exactly 0
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
loanSchema.index({ outstandingPrincipal: 1, isActive: 1 });

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
