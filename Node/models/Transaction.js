// models/Transaction.js - SIMPLIFIED VERSION (UNCHANGED, AS IT ALREADY SUPPORTS RECORDING ALL TRANSACTIONS)
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "SILVER_LOAN_GIVEN", "SILVER_LOAN_PAYMENT", "SILVER_LOAN_CLOSURE","SILVER_LOAN_REPAYMENT",
      "SILVER_LOAN_INTEREST_RECEIVED",
      "GOLD_LOAN_GIVEN", "GOLD_LOAN_PAYMENT", "GOLD_LOAN_CLOSURE","GOLD_LOAN_REPAYMENT",
      "UDHAR_CLOSURE","INTEREST_PAID",
      "GOLD_LOAN_INTEREST_RECEIVED", "GOLD_LOAN_ITEM_REMOVAL", 
      "GOLD_LOAN_ADDITION", "ITEM_RETURN",
      "LOAN_INTEREST_RECEIVED",
      "LOAN_GIVEN", "LOAN_TAKEN", "LOAN_PAYMENT", "LOAN_CLOSURE",
      "UDHAR_GIVEN", "UDHAR_RECEIVED", "UDHAR_TAKEN",
      "GOLD_PURCHASE", "SILVER_PURCHASE", "GOLD_SALE", "SILVER_SALE",
      "BUSINESS_EXPENSE", "OTHER_INCOME", "OTHER_EXPENSE","UDHAR_PAYMENT"
    ],
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },
  amount: { type: Number, required: true }, // Amount in rupees (not paisa)
  direction: { type: Number, enum: [1, -1, 0], required: true }, // +1 outgoing, -1 incoming, 0 neutral
  description: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true },
  relatedDoc: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['GoldLoan', 'Loan', 'Udhar', 'GoldTransaction', 'SilverTransaction', 'BusinessExpense', 'SilverLoan']
  },
  category: {
    type: String,
    enum: ["INCOME", "EXPENSE", "RETURN", "CLOSURE"],
    required: true,
    index: true
  },
  // Simplified metadata for tracking
  metadata: {
    goldPrice: { type: Number }, // Gold price at time of transaction (if applicable)
    weightGrams: { type: Number }, // Total weight involved (if applicable)
    itemCount: { type: Number }, // Number of items involved
    paymentType: { type: String, enum: ['PRINCIPAL', 'INTEREST', 'COMBINED', 'DISBURSEMENT'] },
    forMonth: { type: String }, // Month for which interest was paid (YYYY-MM format)
    photos: [{ type: String }],
    notes: { type: String }
  },
  // Items affected by this transaction
  affectedItems: [{
    itemId: { type: mongoose.Schema.Types.ObjectId },
    name: { type: String },
    weightGram: { type: Number },
    value: { type: Number }, // Value in rupees
    action: { type: String, enum: ['ADDED', 'RETURNED', 'UPDATED', 'REMOVED'] }
  }]
}, { timestamps: true });

// Compound indexes for better query performance
transactionSchema.index({ date: -1, category: 1 });
transactionSchema.index({ customer: 1, date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ relatedDoc: 1, relatedModel: 1 });

// Virtual for formatted display
transactionSchema.virtual("formattedAmount").get(function() {
  return `₹${this.amount.toFixed(2)}`;
});

transactionSchema.virtual("transactionDirection").get(function() {
  if (this.direction === 1) return 'Outgoing';
  if (this.direction === -1) return 'Incoming';
  return 'Neutral';
});

transactionSchema.virtual("formattedDate").get(function() {
  return this.date.toLocaleDateString('en-IN');
});

// Method to format transaction for display
transactionSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    type: this.type,
    customer: this.customer,
    amount: this.amount,
    formattedAmount: this.formattedAmount,
    direction: this.direction,
    transactionDirection: this.transactionDirection,
    description: this.description,
    date: this.date,
    formattedDate: this.formattedDate,
    category: this.category,
    metadata: this.metadata,
    affectedItems: this.affectedItems
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
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to get expense summary
transactionSchema.statics.getExpenseSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        category: 'EXPENSE'
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
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Static method to get cash flow summary
transactionSchema.statics.getCashFlowSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$direction',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        direction: '$_id',
        totalAmount: 1,
        count: 1,
        directionLabel: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 1] }, then: 'Outgoing' },
              { case: { $eq: ['$_id', -1] }, then: 'Incoming' },
              { case: { $eq: ['$_id', 0] }, then: 'Neutral' }
            ],
            default: 'Unknown'
          }
        },
        _id: 0
      }
    }
  ]);
};

// Static method to get business summary
transactionSchema.statics.getBusinessSummary = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        totalAmount: 1,
        count: 1,
        _id: 0
      }
    }
  ]);
};

// Enable virtuals in JSON output
transactionSchema.set("toJSON", { virtuals: true });
transactionSchema.set("toObject", { virtuals: true });

export default mongoose.model("Transaction", transactionSchema);