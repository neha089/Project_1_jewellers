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
    enum: ["GIVEN", "TAKEN", "REPAYMENT", "INTEREST"],
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
  }
}, { 
  timestamps: true 
});

// Compound indexes for better query performance
udhariTransactionSchema.index({ customer: 1, takenDate: -1 });
udhariTransactionSchema.index({ kind: 1, isCompleted: 1 });
udhariTransactionSchema.index({ sourceRef: 1 });
udhariTransactionSchema.index({ customer: 1, kind: 1 });

// Virtual for amount in rupees
udhariTransactionSchema.virtual('principalRupees').get(function() {
  return this.principalPaise / 100;
});

udhariTransactionSchema.virtual('outstandingRupees').get(function() {
  return this.outstandingBalance / 100;
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
    installmentInfo: {
      current: this.installmentNumber,
      total: this.totalInstallments
    },
    formattedAmount: `₹${(this.principalPaise / 100).toFixed(2)}`,
    formattedOutstanding: `₹${(this.outstandingBalance / 100).toFixed(2)}`,
    transactionType: this.direction === 1 ? 'Outgoing' : 'Incoming'
  };
};

// Static method to get customer summary
udhariTransactionSchema.statics.getCustomerSummary = async function(customerId) {
  const transactions = await this.find({ customer: customerId }).sort({ takenDate: -1 });
  
  let totalGiven = 0;
  let totalTaken = 0;
  let outstandingToCollect = 0;
  let outstandingToPay = 0;

  transactions.forEach(txn => {
    if (txn.kind === 'GIVEN') {
      totalGiven += txn.principalPaise;
      outstandingToCollect += txn.outstandingBalance;
    } else if (txn.kind === 'TAKEN') {
      totalTaken += txn.principalPaise;
      outstandingToPay += txn.outstandingBalance;
    }
  });

  return {
    totalGiven: totalGiven / 100,
    totalTaken: totalTaken / 100,
    outstandingToCollect: outstandingToCollect / 100,
    outstandingToPay: outstandingToPay / 100,
    netAmount: (outstandingToCollect - outstandingToPay) / 100,
    transactions
  };
};

// Pre-save middleware to handle outstanding balance for new GIVEN/TAKEN transactions
udhariTransactionSchema.pre('save', function(next) {
  // For new GIVEN or TAKEN transactions, set outstanding balance to principal amount
  if (this.isNew && (this.kind === 'GIVEN' || this.kind === 'TAKEN')) {
    if (this.outstandingBalance === 0) {
      this.outstandingBalance = this.principalPaise;
    }
  }
  next();
});

// Ensure virtual fields are serialized
udhariTransactionSchema.set('toJSON', { virtuals: true });
udhariTransactionSchema.set('toObject', { virtuals: true });

export default mongoose.model("UdhariTransaction", udhariTransactionSchema);