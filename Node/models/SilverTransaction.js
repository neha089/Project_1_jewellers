// models/SilverTransaction.js
import mongoose from "mongoose";

const silverTransactionSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ["BUY", "SELL"],
    required: true,
    index: true
  },
  
  // Customer info (null if business is buying from supplier)
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },
  
  // Supplier info (when business is buying)
  supplier: {
    name: { type: String },
    phone: { type: String },
    address: { type: String },
    gstNumber: { type: String }
  },
  
  // Silver details
  silverDetails: {
    purity: { 
      type: String, 
      enum: ["999", "925", "900", "800"],
      required: true 
    },
    weight: { 
      type: Number, 
      required: true // Weight in grams
    },
    ratePerGram: { 
      type: Number, 
      required: true // Rate per gram in paise
    },
    makingCharges: { 
      type: Number, 
      default: 0 // Making charges in paise
    },
    wastage: { 
      type: Number, 
      default: 0 // Wastage percentage
    },
    taxAmount: { 
      type: Number, 
      default: 0 // GST/Tax amount in paise
    }
  },
  
  // Financial details
  totalAmount: { 
    type: Number, 
    required: true // Total amount in paise
  },
  
  advanceAmount: { 
    type: Number, 
    default: 0 // Advance paid/received in paise
  },
  
  remainingAmount: { 
    type: Number, 
    default: 0 // Remaining amount in paise
  },
  
  paymentStatus: {
    type: String,
    enum: ["PAID", "PARTIAL", "PENDING"],
    default: "PAID"
  },
  
  paymentMode: {
    type: String,
    enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE"],
    default: "CASH"
  },
  
  // Item details
  items: [{
    name: { type: String, required: true },
    description: { type: String },
    weight: { type: Number, required: true }, // Weight in grams
    purity: { type: String, required: true },
    makingCharges: { type: Number, default: 0 },
    itemValue: { type: Number, required: true }, // Value in paise
    photos: [{ type: String }] // Photo URLs
  }],
  
  // Transaction metadata
  invoiceNumber: { type: String, unique: true, sparse: true },
  billNumber: { type: String },
  
  notes: { type: String },
  
  date: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  
  // Related transaction reference
  transactionRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction"
  },
  
  // Tracking fields
  createdBy: { type: String },
  updatedBy: { type: String }
  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted amounts
silverTransactionSchema.virtual('formattedAmounts').get(function() {
  return {
    totalAmount: `₹${(this.totalAmount / 100).toFixed(2)}`,
    advanceAmount: `₹${(this.advanceAmount / 100).toFixed(2)}`,
    remainingAmount: `₹${(this.remainingAmount / 100).toFixed(2)}`,
    ratePerGram: `₹${(this.silverDetails.ratePerGram / 100).toFixed(2)}`
  };
});

// Indexes for better performance
silverTransactionSchema.index({ date: -1, transactionType: 1 });
silverTransactionSchema.index({ customer: 1, date: -1 });
silverTransactionSchema.index({ 'silverDetails.purity': 1, date: -1 });
silverTransactionSchema.index({ invoiceNumber: 1 });
silverTransactionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate invoice number
silverTransactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await this.constructor.countDocuments({
      transactionType: this.transactionType,
      date: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
      }
    });
    
    const prefix = this.transactionType === 'BUY' ? 'SB' : 'SS';
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const year = String(new Date().getFullYear()).slice(-2);
    const sequence = String(count + 1).padStart(5, '0');
    
    this.invoiceNumber = `${prefix}${year}${month}${sequence}`;
  }
  next();
});

// Instance methods
silverTransactionSchema.methods.calculateTotalAmount = function() {
  const baseAmount = this.silverDetails.weight * this.silverDetails.ratePerGram;
  const wastageAmount = (baseAmount * this.silverDetails.wastage) / 100;
  const makingCharges = this.silverDetails.makingCharges;
  const subtotal = baseAmount + wastageAmount + makingCharges;
  const total = subtotal + this.silverDetails.taxAmount;
  
  return total;
};

silverTransactionSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    invoiceNumber: this.invoiceNumber,
    transactionType: this.transactionType,
    customer: this.customer,
    supplier: this.supplier,
    silverDetails: this.silverDetails,
    totalAmount: this.totalAmount / 100,
    paymentStatus: this.paymentStatus,
    paymentMode: this.paymentMode,
    date: this.date,
    formattedDate: this.date.toLocaleDateString('en-IN'),
    formattedAmount: `₹${(this.totalAmount / 100).toFixed(2)}`,
    items: this.items.map(item => ({
      ...item.toObject(),
      formattedWeight: `${item.weight}g`,
      formattedValue: `₹${(item.itemValue / 100).toFixed(2)}`
    }))
  };
};

// Static methods for analytics
silverTransactionSchema.statics.getDailySummary = function(date = new Date()) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$transactionType',
        totalAmount: { $sum: '$totalAmount' },
        totalWeight: { $sum: '$silverDetails.weight' },
        transactionCount: { $sum: 1 },
        avgRate: { $avg: '$silverDetails.ratePerGram' }
      }
    }
  ]);
};

silverTransactionSchema.statics.getMonthlySummary = function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  
  return this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          type: '$transactionType',
          day: { $dayOfMonth: '$date' }
        },
        dailyAmount: { $sum: '$totalAmount' },
        dailyWeight: { $sum: '$silverDetails.weight' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        totalAmount: { $sum: '$dailyAmount' },
        totalWeight: { $sum: '$dailyWeight' },
        totalTransactions: { $sum: '$transactionCount' },
        dailyBreakdown: {
          $push: {
            day: '$_id.day',
            amount: '$dailyAmount',
            weight: '$dailyWeight',
            count: '$transactionCount'
          }
        }
      }
    }
  ]);
};

export default mongoose.model("SilverTransaction", silverTransactionSchema);