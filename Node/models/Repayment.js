// models/Repayment.js
import mongoose from "mongoose";

const repaymentItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  weightGram: { type: Number, required: true },
  purityK: { type: Number, required: true },
  originalLoanAmount: { type: Number, required: true },
  returnValue: { type: Number, required: true }, // Current market value at return
  goldPriceAtReturn: { type: Number }, // Gold price when returned
  returnImages: [{ type: String }], // Photos of returned item
}, { _id: false });

const repaymentSchema = new mongoose.Schema({
  goldLoan: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "GoldLoan", 
    required: true,
    index: true 
  },
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true,
    index: true 
  },
  
  // Repayment Details
  repaymentDate: { type: Date, default: Date.now, required: true },
  repaymentAmount: { type: Number, required: true, min: 0 },
  loanAmountBeforeRepayment: { type: Number, required: true },
  loanAmountAfterRepayment: { type: Number, required: true },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CHEQUE', 'NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'],
    required: true,
    default: 'CASH'
  },
  
  // Payment Reference Details
  referenceNumber: { type: String },
  chequeNumber: { type: String },
  bankName: { type: String },
  chequeDate: { type: Date },
  
  // Repayment Type
  repaymentType: {
    type: String,
    enum: ['PARTIAL_PRINCIPAL', 'FULL_PRINCIPAL', 'ITEM_RETURN', 'LOAN_CLOSURE'],
    required: true
  },
  
  // Items Being Returned (if applicable)
  returnedItems: [repaymentItemSchema],
  totalItemsReturned: { type: Number, default: 0 },
  totalWeightReturned: { type: Number, default: 0 },
  
  // Gold Market Data
  currentGoldPrice: { type: Number }, // Per gram price at repayment
  totalMarketValueAtReturn: { type: Number, default: 0 },
  
  // Documentation
  receiptNumber: { type: String, unique: true },
  photos: [{ type: String }], // General payment/return photos
  notes: { type: String },
  
  // Loan Status Changes
  loanStatusBefore: { type: String, required: true },
  loanStatusAfter: { type: String, required: true },
  isLoanClosed: { type: Boolean, default: false },
  
  // Tracking
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  
  // Additional Charges/Adjustments
  processingFee: { type: Number, default: 0 },
  lateFee: { type: Number, default: 0 },
  adjustmentAmount: { type: Number, default: 0 }, // Any manual adjustments
  adjustmentReason: { type: String },
  
  // Interest Settlement (if any interest is paid along with repayment)
  interestPaidWithRepayment: { type: Number, default: 0 },
  interestPeriodCovered: { type: String }, // e.g., "2024-01 to 2024-03"
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual calculations
repaymentSchema.virtual('netRepaymentAmount').get(function() {
  return this.repaymentAmount - this.processingFee - this.lateFee + this.adjustmentAmount;
});

repaymentSchema.virtual('isFullRepayment').get(function() {
  return this.loanAmountAfterRepayment <= 0 || this.isLoanClosed;
});

repaymentSchema.virtual('principalReduced').get(function() {
  return this.loanAmountBeforeRepayment - this.loanAmountAfterRepayment;
});

// Auto-generate receipt number
repaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.receiptNumber = `REP-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to calculate return summary
repaymentSchema.methods.getReturnSummary = function() {
  return {
    totalItems: this.returnedItems.length,
    totalWeight: this.totalWeightReturned,
    totalOriginalValue: this.returnedItems.reduce((sum, item) => sum + item.originalLoanAmount, 0),
    totalCurrentValue: this.returnedItems.reduce((sum, item) => sum + item.returnValue, 0),
    goldPriceUsed: this.currentGoldPrice,
    valueGainLoss: this.returnedItems.reduce((sum, item) => sum + (item.returnValue - item.originalLoanAmount), 0)
  };
};

// Indexes for better performance
repaymentSchema.index({ goldLoan: 1, repaymentDate: -1 });
repaymentSchema.index({ customer: 1, repaymentDate: -1 });
repaymentSchema.index({ repaymentType: 1, status: 1 });
repaymentSchema.index({ receiptNumber: 1 });
repaymentSchema.index({ isLoanClosed: 1 });

export default mongoose.model("Repayment", repaymentSchema);