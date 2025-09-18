// models/udhar.js
import mongoose from 'mongoose';

const udharSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true
  },
  udharType: {
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
    default: 'UDHAR'
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
  takenDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  dueDate: { 
    type: Date 
  },
  lastPaymentDate: {
    type: Date
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
udharSchema.index({ customer: 1, takenDate: -1 });
udharSchema.index({ udharType: 1, status: 1 });
udharSchema.index({ customer: 1, udharType: 1 });
udharSchema.index({ paymentMethod: 1 });
udharSchema.index({ outstandingPrincipal: 1, isActive: 1 });

// Virtual for amount in rupees
udharSchema.virtual('principalRupees').get(function() {
  return this.principalPaise / 100;
});

udharSchema.virtual('outstandingRupees').get(function() {
  return this.outstandingPrincipal / 100;
});

// Virtual for payment completion percentage
udharSchema.virtual('completionPercentage').get(function() {
  if (this.principalPaise === 0) return 0;
  const paidAmount = this.principalPaise - this.outstandingPrincipal;
  return Math.round((paidAmount / this.principalPaise) * 100);
});

// Instance method to add payment to history
udharSchema.methods.addPayment = function(paymentData) {
  const paymentEntry = {
    principalAmount: paymentData.principalAmount || 0,
    date: paymentData.date || new Date(),
    installmentNumber: paymentData.installmentNumber || (this.paymentHistory.length + 1),
    note: paymentData.note || '',
    paymentMethod: paymentData.paymentMethod || 'CASH',
    paymentReference: paymentData.paymentReference || '',
    bankTransactionId: paymentData.bankTransactionId || ''
  };

  this.paymentHistory.push(paymentEntry);

  // Update udhar amounts
  if (paymentData.principalAmount) {
    this.outstandingPrincipal = Math.max(0, this.outstandingPrincipal - paymentData.principalAmount);
    this.lastPaymentDate = paymentEntry.date;
  }

  this.paidInstallments = this.paymentHistory.length;
  
  // Update status
  const isFullyPaid = this.outstandingPrincipal <= 0;
  this.status = isFullyPaid ? 'CLOSED' : (this.paidInstallments > 0 ? 'PARTIALLY_PAID' : 'ACTIVE');
  this.isActive = !isFullyPaid;

  return this;
};

// Method to get payment summary
udharSchema.methods.getPaymentSummary = function() {
  const totalPaid = this.principalPaise - this.outstandingPrincipal;
  return {
    originalAmount: this.principalPaise / 100,
    totalPrincipalPaid: totalPaid / 100,
    outstandingBalance: this.outstandingPrincipal / 100,
    completionPercentage: this.completionPercentage,
    paymentCount: this.paymentHistory.length,
    lastPaymentDate: this.lastPaymentDate,
    isCompleted: this.status === 'CLOSED'
  };
};

// Pre-save middleware to update status and calculations
udharSchema.pre('save', function(next) {
  // Ensure outstanding principal is calculated correctly
  const calculatedOutstanding = Math.max(0, this.principalPaise - (this.paymentHistory.reduce((total, payment) => total + payment.principalAmount, 0) || 0));
  
  if (this.isModified('paymentHistory') || this.outstandingPrincipal === undefined) {
    this.outstandingPrincipal = calculatedOutstanding;
  }

  // Update status based on outstanding balance
  if (this.outstandingPrincipal <= 0 && this.status !== 'CLOSED') {
    this.status = 'CLOSED';
    this.isActive = false;
    this.outstandingPrincipal = 0;
  } else if (this.paidInstallments > 0 && this.outstandingPrincipal > 0 && this.status === 'ACTIVE') {
    this.status = 'PARTIALLY_PAID';
  }

  next();
});

export default mongoose.model('Udhar', udharSchema);
