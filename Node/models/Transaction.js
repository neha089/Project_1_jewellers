// models/Transaction.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "GOLD_LOAN_GIVEN", "GOLD_LOAN_DISBURSEMENT", "GOLD_LOAN_PAYMENT", "GOLD_LOAN_CLOSURE",
      "LOAN_GIVEN", "LOAN_TAKEN", "LOAN_PAYMENT", "LOAN_CLOSURE",
      "UDHARI_GIVEN", "UDHARI_RECEIVED",
      "GOLD_PURCHASE", "SILVER_PURCHASE", "GOLD_SALE", "SILVER_SALE",
      "GOLD_LOAN_INTEREST_RECEIVED", "LOAN_INTEREST_RECEIVED", "INTEREST_PAID",
      "GOLD_LOAN_ITEM_REMOVAL", "GOLD_LOAN_COMPLETION", "GOLD_LOAN_ADDITION",
      "ITEM_RETURN", "PARTIAL_REPAYMENT", "FULL_REPAYMENT","BUSINESS_EXPENSE",
      "SILVER_LOAN_GIVEN","SILVER_LOAN_PAYMENT", "SILVER_LOAN_INTEREST_RECEIVED", "SILVER_LOAN_CLOSURE" , "SILVER_LOAN_COMPLETION" , "SILVER_LOAN_ADDITION" , "SILVER_LOAN_ITEM_REMOVAL"
    ],
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },
  amount: { type: Number, required: true },
  direction: { type: Number, enum: [1, -1, 0], required: true }, // +1 outgoing, -1 incoming, 0 neutral
  description: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true },
  relatedDoc: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['GoldLoan', 'Loan', 'UdhariTransaction', 'GoldTransaction' , 'SilverTransaction','BusinessExpense']
  },
  category: {
    type: String,
    enum: ["INCOME", "EXPENSE", "RETURN", "CLOSURE", "COMPLETION"],
    required: true,
    index: true
  },
  // Enhanced fields for detailed tracking
  metadata: {
    goldPrice: { type: Number }, // Gold price at time of transaction
    weightGrams: { type: Number }, // Total weight involved
    itemCount: { type: Number }, // Number of items involved
    interestMonth: { type: String }, // Month for which interest was paid
    paymentType: { type: String, enum: ['PRINCIPAL', 'INTEREST', 'COMBINED', 'EXCESS','DISBURSEMENT'] },
    isPartialPayment: { type: Boolean, default: false },
    remainingAmount: { type: Number }, // Any remaining amount after transaction
    exchangeRate: { type: Number }, // If applicable
    photos: [{ type: String }],
     installmentNumber: { type: Number },
    totalInstallments: { type: Number },
    originalUdhariAmount: { type: Number }
  },
  // Reference to specific items if applicable
  affectedItems: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    weightGram: { type: Number },
    value: { type: Number },
    action: { type: String, enum: ['ADDED', 'RETURNED', 'UPDATED', 'REMOVED'] }
  }]
}, { timestamps: true });

// Compound indexes for better query performance
transactionSchema.index({ date: -1, category: 1 });
transactionSchema.index({ customer: 1, date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ relatedDoc: 1, relatedModel: 1 });

// Method to format transaction for display
transactionSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    type: this.type,
    customer: this.customer,
    amount: this.amount / 100, // Convert to rupees
    direction: this.direction,
    description: this.description,
    date: this.date,
    category: this.category,
    metadata: this.metadata,
    affectedItems: this.affectedItems,
    formattedDate: this.date.toLocaleDateString('en-IN'),
    formattedAmount: `₹${(this.amount / 100).toFixed(2)}`,
    transactionDirection: this.direction === 1 ? 'Outgoing' : this.direction === -1 ? 'Incoming' : 'Neutral'
  };
};

// Static method to get transactions by date range
transactionSchema.statics.getTransactionsByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    ...filters
  };
  
  return this.find(query)
    .populate('customer', 'name phone')
    .sort({ date: -1 });
};

// Static method to get income summary
transactionSchema.statics.getIncomeSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        category: 'INCOME'
      }
    },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        totalAmount: 1,
        totalAmountRupees: { $divide: ['$totalAmount', 100] },
        count: 1,
        _id: 0
      }
    }
  ]);
};
transactionSchema.statics.getUdhariSummary = function(startDate, endDate) {
  const matchStage = {
    type: { $in: ['UDHARI_GIVEN', 'UDHARI_TAKEN', 'UDHARI_RECEIVED', 'UDHARI_PAID'] }
  };
  
  if (startDate && endDate) {
    matchStage.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        totalAmount: 1,
        totalAmountRupees: { $divide: ['$totalAmount', 100] },
        count: 1,
        _id: 0
      }
    }
  ]);
};

export default mongoose.model("Transaction", transactionSchema);
