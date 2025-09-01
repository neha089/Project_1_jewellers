// models/GoldLoan.js
import mongoose from "mongoose";

const loanItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightGram: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true, min: 0 },
  purityK: { type: Number, min: 0, required: true },
  images: [{ type: String }],
  returnDate: { type: Date }, // When item was returned
  returnImages: [{ type: String }], // Images when returning item
  returnValuePaise: { type: Number }, // Value at time of return
  returnNotes: { type: String },
  marketValuePaise: { type: Number }, // Market value when added
  pricePerGramUsed: { type: Number }, // Gold price per gram used for calculation
  addedDate: { type: Date, default: Date.now },
  calculatedAt: { type: Date, default: Date.now }
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  principalPaise: { type: Number, default: 0, min: 0 },
  interestPaise: { type: Number, default: 0, min: 0 },
  forMonth: { type: String, required: true }, // Format: "YYYY-MM"
  forYear: { type: Number, required: true },
  forMonthName: { type: String, required: true }, // e.g., "January", "February"
  photos: [{ type: String }],
  notes: { type: String },
  // Enhanced tracking fields
  itemsReturned: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    weightGram: { type: Number },
    currentValue: { type: Number },
    originalValue: { type: Number }
  }],
  excessAmount: { type: Number, default: 0 }, // Any excess payment amount
  pendingAtTimeOfPayment: { type: Number }, // Total pending interest when payment was made
  monthlyInterestAtPayment: { type: Number }, // Monthly interest amount at time of payment
  activePrincipalAtPayment: { type: Number }, // Active principal at time of payment
  isPartialPayment: { type: Boolean, default: false },
  remainingInterestForMonth: { type: Number, default: 0 }
}, { _id: true });

const goldLoanSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
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
  principalPaise: { type: Number, required: true, min: 0 },
  currentPrincipalPaise: { type: Number }, // Current outstanding based on returned items
  startDate: { type: Date, default: Date.now, index: true },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ["ACTIVE", "CLOSED", "COMPLETED", "AUCTIONED"], 
    default: "ACTIVE", 
    index: true 
  },
  payments: [paymentSchema],
  closureDate: { type: Date },
  completionDate: { type: Date },
  closureImages: [{ type: String }], // Images when loan is closed
  completionImages: [{ type: String }], // Images when loan is completed
  notes: { type: String },
  // Enhanced tracking fields
  lastInterestPaymentDate: { type: Date },
  totalInterestReceived: { type: Number, default: 0 },
  pendingInterest: { type: Number, default: 0 },
  goldPriceAtCreation: {
    purity22K: { type: Number },
    purity24K: { type: Number },
    purity18K: { type: Number },
    date: { type: Date }
  }
}, { timestamps: true });

// Virtual fields for calculations
goldLoanSchema.virtual("amountRepaidPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.principalPaise, 0);
});

goldLoanSchema.virtual("interestReceivedPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.interestPaise, 0);
});

goldLoanSchema.virtual("outstandingPaise").get(function () {
  return Math.max(0, this.principalPaise - this.amountRepaidPaise);
});

// Calculate current outstanding based on active items
goldLoanSchema.virtual("currentOutstandingPaise").get(function () {
  const activeItems = this.items.filter(item => !item.returnDate);
  return activeItems.reduce((sum, item) => sum + item.amountPaise, 0);
});

// Calculate total interest due up to current date based on current principal
goldLoanSchema.virtual("totalInterestDuePaise").get(function () {
  if (this.status === 'CLOSED' || this.status === 'COMPLETED') return 0;
  
  const startDate = new Date(this.startDate);
  const currentDate = new Date();
  
  // Calculate number of months
  const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (currentDate.getMonth() - startDate.getMonth()) + 1;
  
  // Use current principal if available, otherwise use original principal
  const principalToUse = this.currentPrincipalPaise || this.principalPaise;
  const monthlyInterest = (principalToUse * this.interestRateMonthlyPct) / 100;
  return Math.max(0, months * monthlyInterest);
});

// Calculate pending interest (due - received) with accumulation
goldLoanSchema.virtual("pendingInterestPaise").get(function () {
  return Math.max(0, this.totalInterestDuePaise - this.interestReceivedPaise);
});

// Get active items count
goldLoanSchema.virtual("activeItemsCount").get(function () {
  return this.items.filter(item => !item.returnDate).length;
});

// Get returned items count
goldLoanSchema.virtual("returnedItemsCount").get(function () {
  return this.items.filter(item => item.returnDate).length;
});

// Method to calculate interest for specific month based on current principal
goldLoanSchema.methods.calculateMonthlyInterest = function() {
  const principalToUse = this.currentPrincipalPaise || this.principalPaise;
  return Math.round((principalToUse * this.interestRateMonthlyPct) / 100);
};

// Method to calculate interest based on active items only
goldLoanSchema.methods.calculateCurrentMonthlyInterest = function() {
  const activeItems = this.items.filter(item => !item.returnDate);
  const activePrincipal = activeItems.reduce((sum, item) => sum + item.amountPaise, 0);
  return Math.round((activePrincipal * this.interestRateMonthlyPct) / 100);
};

// Method to get payment history by month with enhanced details
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
    paymentsByMonth[key].totalPrincipal += payment.principalPaise;
    paymentsByMonth[key].totalInterest += payment.interestPaise;
    
    if (payment.itemsReturned && payment.itemsReturned.length > 0) {
      paymentsByMonth[key].itemsReturned.push(...payment.itemsReturned);
    }
  });
  
  return Object.values(paymentsByMonth).sort((a, b) => {
    return new Date(a.month) - new Date(b.month);
  }).map(monthData => ({
    ...monthData,
    totalPrincipalRupees: monthData.totalPrincipal / 100,
    totalInterestRupees: monthData.totalInterest / 100,
    totalPaymentRupees: (monthData.totalPrincipal + monthData.totalInterest) / 100
  }));
};

// Method to get accumulated pending interest with proper calculation
goldLoanSchema.methods.getAccumulatedPendingInterest = function() {
  const startDate = new Date(this.startDate);
  const currentDate = new Date();
  
  // Calculate months elapsed
  const monthsElapsed = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                       (currentDate.getMonth() - startDate.getMonth()) + 1;
  
  // Calculate total interest due
  const monthlyInterest = this.calculateCurrentMonthlyInterest();
  const totalInterestDue = monthsElapsed * monthlyInterest;
  
  // Calculate total interest received
  const totalInterestReceived = this.payments.reduce((sum, p) => sum + p.interestPaise, 0);
  
  // Return accumulated pending interest
  return Math.max(0, totalInterestDue - totalInterestReceived);
};

// Method to get items eligible for return based on payment amount
goldLoanSchema.methods.getReturnableItems = async function(paymentAmountPaise) {
  const { GoldPriceService } = await import('../utils/goldloanservice.js');
  
  const activeItems = this.items.filter(item => !item.returnDate);
  const itemsWithCurrentValue = [];
  
  for (const item of activeItems) {
    const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
    const currentValue = calculation.success ? 
      Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
    
    itemsWithCurrentValue.push({
      ...item.toObject(),
      currentValuePaise: currentValue,
      canReturn: paymentAmountPaise >= currentValue,
      priceChange: currentValue - item.amountPaise
    });
  }
  
  return itemsWithCurrentValue.sort((a, b) => a.currentValuePaise - b.currentValuePaise);
};

// Index for better performance
goldLoanSchema.index({ customer: 1, status: 1 });
goldLoanSchema.index({ startDate: 1, status: 1 });
goldLoanSchema.index({ 'payments.date': -1 });

goldLoanSchema.set("toJSON", { virtuals: true });
goldLoanSchema.set("toObject", { virtuals: true });

export default mongoose.model("GoldLoan", goldLoanSchema);