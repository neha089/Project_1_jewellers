// models/GoldLoan.js - UPDATED VERSION WITH ENHANCED METHODS
import mongoose from "mongoose";

const loanItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightGram: { type: Number, required: true, min: 0 },
  loanAmount: { type: Number, required: true, min: 0 }, // Amount in rupees
  purityK: { type: Number, min: 0, required: true },
  images: [{ type: String }], // Images when item was deposited
  goldPriceAtDeposit: { type: Number, default: 0 }, // Gold price when deposited
  addedDate: { type: Date, default: Date.now },
  
  // Return fields - filled when item is returned
  returnDate: { type: Date }, 
  returnImages: [{ type: String }], 
  returnValue: { type: Number }, // Current value when returned
  goldPriceAtReturn: { type: Number }, // Gold price when returned
  returnNotes: { type: String }
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
type: {
  type: String,
  enum: ['INTEREST' ,'PRINCIPAL']
},
  principalAmount: { type: Number, default: 0, min: 0 }, // In rupees
  interestAmount: { type: Number, default: 0, min: 0 }, // In rupees
  forMonth: { type: String, required: true }, // Format: "YYYY-MM"
  forYear: { type: Number, required: true },
  forMonthName: { type: String, required: true }, // e.g., "January"
  photos: [{ type: String }],
  notes: { type: String },
  
  // Additional tracking fields
  itemsReturned: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    weightGram: { type: Number },
    loanAmount: { type: Number },
    returnValue: { type: Number }
  }],
  repaymentAmount: { type: Number }, // Amount paid for item return
  currentLoanAmountAtPayment: { type: Number }, // Loan amount at time of payment
  currentLoanAmountAfterPayment: { type: Number } // Loan amount after payment
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
  interestRateMonthlyPct: { type: Number, required: true, min: 0 },
  totalLoanAmount: { type: Number, required: true, min: 0 }, // Original total loan amount
  currentLoanAmount: { type: Number, required: true, min: 0 }, // Current outstanding amount
  startDate: { type: Date, default: Date.now, index: true },
  status: { 
    type: String, 
    enum: ["ACTIVE", "CLOSED"], 
    default: "ACTIVE", 
    index: true 
  },
  payments: [paymentSchema],
  lastInterestPayment: { type: Date }, // NEW: Track last interest payment date
  closureDate: { type: Date },
  closureImages: [{ type: String }],
  notes: { type: String }
}, { timestamps: true });

// Virtual fields for easy calculations
goldLoanSchema.virtual("totalInterestPaid").get(function () {
  return (this.payments || []).reduce((sum, p) => sum + (p.interestAmount || 0), 0);
});

goldLoanSchema.virtual("totalPrincipalPaid").get(function () {
  return (this.payments || []).reduce((sum, p) => sum + (p.principalAmount || 0), 0);
});

goldLoanSchema.virtual("activeItemsCount").get(function () {
  return this.items.filter(item => !item.returnDate).length;
});

goldLoanSchema.virtual("returnedItemsCount").get(function () {
  return this.items.filter(item => item.returnDate).length;
});

goldLoanSchema.virtual("monthlyInterestDue").get(function () {
  if (this.currentLoanAmount <= 0) return 0;
  return (this.currentLoanAmount * this.interestRateMonthlyPct) / 100;
});

// Method to get active (unreturned) items
goldLoanSchema.methods.getActiveItems = function() {
  return this.items.filter(item => !item.returnDate);
};

// Method to get returned items
goldLoanSchema.methods.getReturnedItems = function() {
  return this.items.filter(item => item.returnDate);
};

// Method to calculate total weight of active items
goldLoanSchema.methods.getTotalActiveWeight = function() {
  return this.getActiveItems().reduce((total, item) => total + item.weightGram, 0);
};

// Method to get payments by month
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

// Method to check if loan can be closed
goldLoanSchema.methods.canBeClosed = function() {
  return this.currentLoanAmount <= 0 && this.getActiveItems().length === 0;
};

// Method to get loan summary
goldLoanSchema.methods.getLoanSummary = function() {
  const activeItems = this.getActiveItems();
  const returnedItems = this.getReturnedItems();
  
  return {
    totalLoanAmount: this.totalLoanAmount,
    currentLoanAmount: this.currentLoanAmount,
    totalInterestPaid: this.totalInterestPaid,
    totalPrincipalPaid: this.totalPrincipalPaid,
    monthlyInterestDue: this.monthlyInterestDue,
    activeItems: activeItems.length,
    returnedItems: returnedItems.length,
    totalItems: this.items.length,
    totalWeight: this.items.reduce((sum, item) => sum + item.weightGram, 0),
    activeWeight: activeItems.reduce((sum, item) => sum + item.weightGram, 0),
    canBeClosed: this.canBeClosed(),
    loanDurationMonths: this.calculateLoanDurationMonths()
  };
};

// Method to calculate loan duration in months
goldLoanSchema.methods.calculateLoanDurationMonths = function() {
  const startDate = new Date(this.startDate);
  const endDate = this.closureDate ? new Date(this.closureDate) : new Date();
  
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
         (endDate.getMonth() - startDate.getMonth()) + 1;
};

// Indexes for better performance
goldLoanSchema.index({ customer: 1, status: 1 });
goldLoanSchema.index({ startDate: 1, status: 1 });
goldLoanSchema.index({ 'payments.date': -1 });

// Enable virtuals in JSON output
goldLoanSchema.set("toJSON", { virtuals: true });
goldLoanSchema.set("toObject", { virtuals: true });

export default mongoose.model("GoldLoan", goldLoanSchema);