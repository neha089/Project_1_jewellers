// models/GoldLoan.js - UPDATED VERSION WITH DAILY COMPOUNDING INTEREST AND NO GOLD PRICE OR PER-ITEM LOAN AMOUNT
import mongoose from "mongoose";

const loanItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightGram: { type: Number, required: true, min: 0 },
  purityK: { type: Number, min: 0, required: true },
  images: [{ type: String }], // Images when item was deposited
  addedDate: { type: Date, default: Date.now },
  description: { type: String }, // Additional item description
  category: { type: String, default: 'jewelry' }, // jewelry, coin, bar, etc.
   // Return fields - filled when item is returned
  returnDate: { type: Date },
  returnImages: [{ type: String }], // Photos taken during return
  returnNotes: { type: String }, // Notes about item condition during return
  returnRecordedBy: { type: String }, // Who processed the return
  returnVerified: { type: Boolean, default: false }, // If return was verified by senior staff
   // Condition tracking
  depositCondition: { type: String, default: 'good' }, // good, fair, poor
  returnCondition: { type: String }, // Condition when returned
  conditionNotes: { type: String } // Detailed condition notes
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['INTEREST', 'PRINCIPAL', 'PRINCIPAL_AND_INTEREST', 'PROCESSING_FEE', 'LATE_FEE'],
    required: true
  },
  principalAmount: { type: Number, default: 0, min: 0 }, // In rupees
  interestAmount: { type: Number, default: 0, min: 0 }, // In rupees
  forMonth: { type: String, required: true }, // Format: "YYYY-MM"
  forYear: { type: Number, required: true },
  forMonthName: { type: String, required: true }, // e.g., "January"
  photos: [{ type: String }], // General payment photos
  notes: { type: String },
   // Payment method details
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'CARD'],
    default: 'CASH'
  },
  referenceNumber: { type: String }, // Transaction reference
  chequeNumber: { type: String },
  bankName: { type: String },
  chequeDate: { type: Date },
   // Fees and adjustments
  processingFee: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  adjustmentAmount: { type: Number, default: 0 },
  adjustmentReason: { type: String },
   // Repayment specific fields
  repaymentType: {
    type: String,
    enum: ['PARTIAL_PRINCIPAL', 'ITEM_RETURN', 'FULL_PRINCIPAL', 'INTEREST_ONLY']
  },
   // Enhanced item tracking for returns (no price/appreciation)
  itemsReturned: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    weightGram: { type: Number },
    purityK: { type: Number },
    returnImages: [{ type: String }],
    returnCondition: { type: String },
    returnNotes: { type: String }
  }],
   // Payment totals and tracking
  repaymentAmount: { type: Number }, // Total amount paid
  netRepaymentAmount: { type: Number }, // Amount after fees/adjustments
  totalItemsReturned: { type: Number, default: 0 },
  totalWeightReturned: { type: Number, default: 0 },
  principalReduced: { type: Number, default: 0 },
   // Loan status tracking
  currentOutstandingAtPayment: { type: Number }, // Outstanding before this payment
  currentOutstandingAfterPayment: { type: Number }, // Outstanding after this payment
  isFullRepayment: { type: Boolean, default: false },
  isLoanClosed: { type: Boolean, default: false },
   // Interest tracking
  interestPaidWithRepayment: { type: Number, default: 0 },
  interestPeriodCovered: { type: String }, // e.g., "Jan 2024 - Mar 2024"
  outstandingInterestBefore: { type: Number, default: 0 },
  outstandingInterestAfter: { type: Number, default: 0 },
   // Selected items
  selectedItemIds: [{ type: String }], // IDs of items selected for return
   // Staff and verification
  recordedBy: { type: String, default: 'Admin' },
  verifiedBy: { type: String }, // Senior staff verification
  verificationDate: { type: Date },
  verificationNotes: { type: String },
  status: { type: String, default: 'ACTIVE' } // For cancel
}, { _id: true });

const goldLoanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true
  },
  items: {
    type: [loanItemSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one item is required for gold loan'
    }
  },
   // Loan terms
  interestRateMonthlyPct: { type: Number, required: true, min: 0 },
  totalLoanAmount: { type: Number, required: true, min: 0 }, // Original total loan amount
  currentPrincipal: { type: Number, required: true, min: 0 }, // Remaining principal
  outstandingAmount: { type: Number, required: true, min: 0 }, // Current outstanding including compounded interest
  lastAccruedDate: { type: Date, required: true }, // Last date interest was accrued to outstanding
   // Dates
  startDate: { type: Date, default: Date.now, index: true },
  dueDate: { type: Date }, // Optional due date for the loan
  closureDate: { type: Date },
  lastInterestPayment: { type: Date }, // Track last interest payment date
   // Status tracking
  status: {
    type: String,
    enum: ["ACTIVE", "CLOSED", "PARTIALLY_PAID", "OVERDUE", "DEFAULTED"],
    default: "ACTIVE",
    index: true
  },
   // Payment history
  payments: [paymentSchema],
   // Closure details
  closureImages: [{ type: String }],
  closureNotes: { type: String },
  closureReason: {
    type: String,
    enum: ['FULL_PAYMENT', 'ITEM_FORFEIT', 'SETTLEMENT', 'OTHER']
  },
   // Additional loan details
  notes: { type: String },
  riskCategory: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
   // Staff tracking
  createdBy: { type: String, default: 'Admin' },
  lastModifiedBy: { type: String },
  lastModifiedDate: { type: Date },
   // Business rules
  loanToValueRatio: { type: Number }, // LTV ratio at loan creation
  maxLoanAmount: { type: Number }, // Maximum allowed loan for this collateral
   // Interest calculations
  compoundingFrequency: {
    type: String,
    enum: ['DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'],
    default: 'DAILY'
  },
  gracePeriodDays: { type: Number, default: 0 },
  lateFeePercentage: { type: Number, default: 0 },
   // External references
  branchId: { type: String }, // If multi-branch
  loanNumber: { type: String, unique: true }, // Human readable loan number
   // Audit fields
  isDeleted: { type: Boolean, default: false },
  deletedDate: { type: Date },
  deletedBy: { type: String },
  deletionReason: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for easy calculations
goldLoanSchema.virtual("dailyInterestRate").get(function () {
  return this.interestRateMonthlyPct / 30 / 100;
});

goldLoanSchema.virtual("totalInterestPaid").get(function () {
  return (this.payments || []).reduce((sum, p) => sum + (p.interestAmount || 0), 0);
});

goldLoanSchema.virtual("totalPrincipalPaid").get(function () {
  return (this.payments || []).reduce((sum, p) => sum + (p.principalAmount || 0), 0);
});

goldLoanSchema.virtual("totalFeesPaid").get(function () {
  return (this.payments || []).reduce((sum, p) =>
    sum + (p.processingFee || 0) + (p.lateFee || 0), 0);
});

goldLoanSchema.virtual("activeItemsCount").get(function () {
  return this.items.filter(item => !item.returnDate).length;
});

goldLoanSchema.virtual("returnedItemsCount").get(function () {
  return this.items.filter(item => item.returnDate).length;
});

goldLoanSchema.virtual("totalActiveWeight").get(function () {
  return this.items
    .filter(item => !item.returnDate)
    .reduce((sum, item) => sum + (item.weightGram || 0), 0);
});

goldLoanSchema.virtual("totalReturnedWeight").get(function () {
  return this.items
    .filter(item => item.returnDate)
    .reduce((sum, item) => sum + (item.weightGram || 0), 0);
});

goldLoanSchema.virtual("loanDurationDays").get(function () {
  const endDate = this.closureDate || new Date();
  const startDate = new Date(this.startDate);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
});

goldLoanSchema.virtual("isOverdue").get(function () {
  if (!this.dueDate || this.status === 'CLOSED') return false;
  return new Date() > new Date(this.dueDate);
});

// Instance methods

// Get active (unreturned) items
goldLoanSchema.methods.getActiveItems = function() {
  return this.items.filter(item => !item.returnDate);
};

// Get returned items
goldLoanSchema.methods.getReturnedItems = function() {
  return this.items.filter(item => item.returnDate);
};

// Get current outstanding with compounding
goldLoanSchema.methods.getCurrentOutstanding = function(asOfDate = new Date()) {
  const days = Math.floor((asOfDate - this.lastAccruedDate) / (1000 * 60 * 60 * 24));
  if (days <= 0) return this.outstandingAmount;
  return this.outstandingAmount * Math.pow(1 + this.dailyInterestRate, days);
};

// Accrue interest up to a date (update outstandingAmount)
goldLoanSchema.methods.accrueTo = function(asOfDate = new Date()) {
  this.outstandingAmount = this.getCurrentOutstanding(asOfDate);
  this.lastAccruedDate = asOfDate;
};

// Get payments by month/year
goldLoanSchema.methods.getPaymentsByMonth = function() {
  const paymentsByMonth = {};
   this.payments.forEach(payment => {
    const key = payment.forMonth;
    if (!paymentsByMonth[key]) {
      paymentsByMonth[key] = {
        month: payment.forMonth,
        monthName: payment.forMonthName,
        year: payment.forYear,
        payments: [],
        totalPrincipal: 0,
        totalInterest: 0,
        itemsReturned: []
      };
    }
    paymentsByMonth[key].payments.push(payment);
    paymentsByMonth[key].totalPrincipal += payment.principalAmount || 0;
    paymentsByMonth[key].totalInterest += payment.interestAmount || 0;
    if (payment.itemsReturned && payment.itemsReturned.length > 0) {
      paymentsByMonth[key].itemsReturned.push(...payment.itemsReturned);
    }
  });
   return Object.values(paymentsByMonth).sort((a, b) => {
    return new Date(b.month) - new Date(a.month); // Descending order
  });
};

// Check if loan can be closed
goldLoanSchema.methods.canBeClosed = function() {
  this.accrueTo(new Date());
  return this.currentPrincipal <= 0 &&
         this.outstandingAmount <= 0 &&
         this.getActiveItems().length === 0;
};

// Get comprehensive loan summary (no gold price)
goldLoanSchema.methods.getLoanSummary = function() {
  const activeItems = this.getActiveItems();
  const returnedItems = this.getReturnedItems();
  const outstandingInterest = this.outstandingAmount - this.currentPrincipal;

  return {
    // Basic loan info
    totalLoanAmount: this.totalLoanAmount,
    currentPrincipal: this.currentPrincipal,
    outstandingAmount: this.outstandingAmount,
    loanToValueRatio: this.loanToValueRatio,
   
    // Payment summary
    totalInterestPaid: this.totalInterestPaid,
    totalPrincipalPaid: this.totalPrincipalPaid,
    totalFeesPaid: this.totalFeesPaid,
    outstandingInterest,
   
    // Item summary
    totalItems: this.items.length,
    activeItems: activeItems.length,
    returnedItems: returnedItems.length,
    totalWeight: this.items.reduce((sum, item) => sum + item.weightGram, 0),
    activeWeight: this.totalActiveWeight,
    returnedWeight: this.totalReturnedWeight,
   
    // Status
    canBeClosed: this.canBeClosed(),
    isOverdue: this.isOverdue,
    loanDurationDays: this.loanDurationDays,
    loanDurationMonths: Math.ceil(this.loanDurationDays / 30),
   
    // Risk assessment
    riskLevel: this.riskCategory
  };
};

// Get payment history with running totals
goldLoanSchema.methods.getPaymentHistory = function() {
  let runningPrincipal = this.totalLoanAmount;
  let runningOutstanding = this.totalLoanAmount;
   return this.payments
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(payment => {
      runningPrincipal -= (payment.principalAmount || 0);
      runningOutstanding -= (payment.principalAmount || 0) + (payment.interestAmount || 0);
     
      return {
        ...payment.toObject(),
        runningPrincipalBalance: Math.max(0, runningPrincipal),
        runningOutstandingBalance: Math.max(0, runningOutstanding),
      };
    });
};

// Static methods

// Find loans requiring attention (overdue, high risk, etc.)
goldLoanSchema.statics.findLoansRequiringAttention = function() {
  return this.find({
    $or: [
      { status: 'OVERDUE' },
      { riskCategory: 'HIGH' },
      {
        dueDate: {
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due within 7 days
        },
        status: 'ACTIVE'
      }
    ],
    isDeleted: { $ne: true }
  }).populate('customer');
};

// Get loan statistics for a date range
goldLoanSchema.statics.getLoanStatistics = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isDeleted: { $ne: true }
      }
    },
    {
      $group: {
        _id: null,
        totalLoans: { $sum: 1 },
        totalLoanAmount: { $sum: '$totalLoanAmount' },
        averageLoanAmount: { $avg: '$totalLoanAmount' },
        activeLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] }
        },
        closedLoans: {
          $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Indexes for better performance
goldLoanSchema.index({ customer: 1, status: 1 });
goldLoanSchema.index({ startDate: 1, status: 1 });
goldLoanSchema.index({ dueDate: 1, status: 1 });
goldLoanSchema.index({ loanNumber: 1 }, { unique: true, sparse: true });
goldLoanSchema.index({ 'payments.date': -1 });
goldLoanSchema.index({ status: 1, isDeleted: 1 });
goldLoanSchema.index({ riskCategory: 1, status: 1 });

// Pre-save middleware
goldLoanSchema.pre('save', function(next) {
  this.lastModifiedDate = new Date();
   // Auto-generate loan number if not provided
  if (!this.loanNumber && this.isNew) {
    this.loanNumber = `GL${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
   // Update status based on current conditions
  if (this.currentPrincipal <= 0 && this.outstandingAmount <= 0 && this.getActiveItems().length === 0) {
    this.status = 'CLOSED';
    if (!this.closureDate) {
      this.closureDate = new Date();
    }
  } else if (this.isOverdue && this.status === 'ACTIVE') {
    this.status = 'OVERDUE';
  }
   next();
});

export default mongoose.model("GoldLoan", goldLoanSchema);