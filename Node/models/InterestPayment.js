// models/InterestPayment.js
import mongoose from "mongoose";

const interestPaymentSchema = new mongoose.Schema({
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
  
  // Payment Details
  paymentDate: { type: Date, default: Date.now, required: true },
  interestAmount: { type: Number, required: true, min: 0 },
  calculatedInterestDue: { type: Number, required: true, min: 0 }, // Auto-calculated
  loanAmountAtPayment: { type: Number, required: true, min: 0 },
  
  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['CASH', 'CHEQUE', 'NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'],
    required: true,
    default: 'CASH'
  },
  
  // Payment Reference Details
  referenceNumber: { type: String }, // For digital payments
  chequeNumber: { type: String }, // For cheque payments
  bankName: { type: String }, // For cheque/bank transfer
  chequeDate: { type: Date }, // For cheque payments
  
  // Time Period
  forMonth: { type: String, required: true }, // Format: "YYYY-MM"
  forYear: { type: Number, required: true },
  forMonthName: { type: String, required: true }, // e.g., "January"
  
  // Documentation
  receiptNumber: { type: String, unique: true }, // Auto-generated receipt number
  photos: [{ type: String }], // Payment proof photos
  notes: { type: String },
  
  // Tracking
  recordedBy: { type: String }, // Admin who recorded the payment
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED'],
    default: 'CONFIRMED'
  },
  
  // Additional metadata
  interestRate: { type: Number, required: true }, // Interest rate at time of payment
  daysLate: { type: Number, default: 0 }, // If payment is late
  lateFee: { type: Number, default: 0 }, // Any late fee charged
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for payment status
interestPaymentSchema.virtual('isOverpaid').get(function() {
  return this.interestAmount > this.calculatedInterestDue;
});

interestPaymentSchema.virtual('isUnderpaid').get(function() {
  return this.interestAmount < this.calculatedInterestDue;
});

interestPaymentSchema.virtual('paymentDifference').get(function() {
  return this.interestAmount - this.calculatedInterestDue;
});

// Auto-generate receipt number before saving
interestPaymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.receiptNumber) {
    const count = await this.constructor.countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.receiptNumber =  `INT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes for better performance
interestPaymentSchema.index({ goldLoan: 1, forMonth: 1 });
interestPaymentSchema.index({ customer: 1, paymentDate: -1 });
interestPaymentSchema.index({ forMonth: 1, status: 1 });
interestPaymentSchema.index({ receiptNumber: 1 });

export default mongoose.model("InterestPayment", interestPaymentSchema);
