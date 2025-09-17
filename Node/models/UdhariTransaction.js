import mongoose from "mongoose";

const udhariTransactionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true
  },
  kind: {
    type: String,
    enum: ["GIVEN", "TAKEN", "REPAYMENT", "INTEREST", "CLOSE"],
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
  
  takenDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  returnDate: { 
    type: Date 
  },

  // For linking repayments to original udhari
  sourceRef: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UdhariTransaction'
  },
  
  sourceType: {
    type: String,
    default: 'UDHARI'
  },
  
  note: { 
    type: String,
    trim: true
  },
  
  // Outstanding tracking
  outstandingBalance: { 
    type: Number, 
    default: 0,
    min: 0
  },
  isCompleted: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  
  // Installment tracking
  installmentNumber: { 
    type: Number, 
    default: 1,
    min: 1
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
  lastPaymentDate: {
    type: Date
  },

  // Payment method and transaction details
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

  // Payment history for original transactions
  paymentHistory: [{
    amount: {
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
      ref: 'UdhariTransaction'
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

  // Additional metadata
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
  timestamps: true 
});

// Compound indexes for better query performance
udhariTransactionSchema.index({ customer: 1, takenDate: -1 });
udhariTransactionSchema.index({ kind: 1, isCompleted: 1 });
udhariTransactionSchema.index({ sourceRef: 1 });
udhariTransactionSchema.index({ customer: 1, kind: 1 });
udhariTransactionSchema.index({ paymentMethod: 1 });
udhariTransactionSchema.index({ 'paymentHistory.date': -1 });

// Virtual for amount in rupees
udhariTransactionSchema.virtual('principalRupees').get(function() {
  return this.principalPaise / 100;
});

udhariTransactionSchema.virtual('outstandingRupees').get(function() {
  return this.outstandingBalance / 100;
});

// Virtual for payment completion percentage
udhariTransactionSchema.virtual('completionPercentage').get(function() {
  if (this.principalPaise === 0) return 0;
  const paidAmount = this.principalPaise - this.outstandingBalance;
  return Math.round((paidAmount / this.principalPaise) * 100);
});

// Virtual for next due amount (for installment tracking)
udhariTransactionSchema.virtual('nextDueAmount').get(function() {
  if (this.isCompleted || this.totalInstallments <= 1) return 0;
  const remainingInstallments = this.totalInstallments - (this.paidInstallments || 0);
  if (remainingInstallments <= 0) return 0;
  return Math.round(this.outstandingBalance / remainingInstallments);
});

// Method to format for display
udhariTransactionSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    customer: this.customer,
    kind: this.kind,
    amount: this.principalPaise / 100,
    outstandingBalance: this.outstandingBalance / 100,
    direction: this.direction,
    date: this.takenDate,
    returnDate: this.returnDate,
    note: this.note,
    isCompleted: this.isCompleted,
    completionPercentage: this.completionPercentage,
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
    formattedOutstanding: `₹${(this.outstandingBalance / 100).toFixed(2)}`,
    transactionType: this.direction === 1 ? 'Outgoing' : 'Incoming',
    paymentHistory: this.paymentHistory || []
  };
};

// Method to add payment to history
udhariTransactionSchema.methods.addPayment = function(paymentData) {
  if (!this.paymentHistory) {
    this.paymentHistory = [];
  }
  
  this.paymentHistory.push({
    amount: paymentData.amount,
    date: paymentData.date || new Date(),
    installmentNumber: paymentData.installmentNumber || (this.paymentHistory.length + 1),
    transactionId: paymentData.transactionId,
    note: paymentData.note || '',
    paymentMethod: paymentData.paymentMethod || 'CASH',
    paymentReference: paymentData.paymentReference || '',
    bankTransactionId: paymentData.bankTransactionId || ''
  });

  // Update outstanding balance
  this.outstandingBalance = Math.max(0, this.outstandingBalance - paymentData.amount);
  this.paidInstallments = this.paymentHistory.length;
  this.lastPaymentDate = paymentData.date || new Date();
  this.isCompleted = this.outstandingBalance <= 0;

  return this.save();
};

// Method to get payment summary
udhariTransactionSchema.methods.getPaymentSummary = function() {
  const totalPaid = this.principalPaise - this.outstandingBalance;
  return {
    originalAmount: this.principalPaise / 100,
    totalPaid: totalPaid / 100,
    outstandingBalance: this.outstandingBalance / 100,
    completionPercentage: this.completionPercentage,
    paymentCount: this.paymentHistory ? this.paymentHistory.length : 0,
    lastPaymentDate: this.lastPaymentDate,
    isCompleted: this.isCompleted,
    nextDueAmount: this.nextDueAmount / 100
  };
};

// Static method to get customer summary with payment details
udhariTransactionSchema.statics.getCustomerSummaryWithPayments = async function(customerId) {
  const transactions = await this.find({ customer: customerId }).sort({ takenDate: -1 });
  
  let totalGiven = 0;
  let totalTaken = 0;
  let outstandingToCollect = 0;
  let outstandingToPay = 0;
  let totalPaymentsReceived = 0;
  let totalPaymentsMade = 0;

  const paymentsByMethod = {};
  const monthlyPayments = {};

  transactions.forEach(txn => {
    if (txn.kind === 'GIVEN') {
      totalGiven += txn.principalPaise;
      outstandingToCollect += txn.outstandingBalance;
    } else if (txn.kind === 'TAKEN') {
      totalTaken += txn.principalPaise;
      outstandingToPay += txn.outstandingBalance;
    } else if (txn.kind === 'REPAYMENT') {
      if (txn.direction === -1) { // Received payment
        totalPaymentsReceived += txn.principalPaise;
      } else { // Made payment
        totalPaymentsMade += txn.principalPaise;
      }
      
      // Track by payment method
      const method = txn.paymentMethod || 'CASH';
      paymentsByMethod[method] = (paymentsByMethod[method] || 0) + txn.principalPaise;
      
      // Track monthly payments
      const monthKey = txn.takenDate.toISOString().substr(0, 7); // YYYY-MM
      monthlyPayments[monthKey] = (monthlyPayments[monthKey] || 0) + txn.principalPaise;
    }
    
    // Process payment history for additional insights
    if (txn.paymentHistory && txn.paymentHistory.length > 0) {
      txn.paymentHistory.forEach(payment => {
        const method = payment.paymentMethod || 'CASH';
        paymentsByMethod[method] = (paymentsByMethod[method] || 0) + payment.amount;
        
        const monthKey = payment.date.toISOString().substr(0, 7);
        monthlyPayments[monthKey] = (monthlyPayments[monthKey] || 0) + payment.amount;
      });
    }
  });

  return {
    totalGiven: totalGiven / 100,
    totalTaken: totalTaken / 100,
    outstandingToCollect: outstandingToCollect / 100,
    outstandingToPay: outstandingToPay / 100,
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
    transactions
  };
};

// Static method to get payment method statistics
udhariTransactionSchema.statics.getPaymentMethodStats = async function(dateFrom, dateTo) {
  const matchConditions = {
    kind: 'REPAYMENT'
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

// Pre-save middleware to handle outstanding balance for new GIVEN/TAKEN transactions
udhariTransactionSchema.pre('save', function(next) {
  // For new GIVEN or TAKEN transactions, set outstanding balance to principal amount
  if (this.isNew && (this.kind === 'GIVEN' || this.kind === 'TAKEN')) {
    if (this.outstandingBalance === 0) {
      this.outstandingBalance = this.principalPaise;
    }
  }
  
  // Ensure payment history is initialized
  if (!this.paymentHistory) {
    this.paymentHistory = [];
  }
  
  next();
});

// Ensure virtual fields are serialized
udhariTransactionSchema.set('toJSON', { virtuals: true });
udhariTransactionSchema.set('toObject', { virtuals: true });

export default mongoose.model("UdhariTransaction", udhariTransactionSchema);