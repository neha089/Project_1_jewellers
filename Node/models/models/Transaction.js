const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  loanId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'GoldLoan'
  },
  type: {
    type: String,
    enum: ['loan_given', 'interest_received', 'repayment', 'gold_sale', 'silver_sale'],
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  description: String,
  receiptNumber: String
}, {
  timestamps: true
});

// Indexes
transactionSchema.index({ customerId: 1, date: -1 });
transactionSchema.index({ loanId: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);