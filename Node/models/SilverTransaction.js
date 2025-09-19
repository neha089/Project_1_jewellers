// models/SilverTransaction.js
import mongoose from "mongoose";

const silverTransactionItemSchema = new mongoose.Schema({
  itemName: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  purity: { 
    type: String, 
    enum: ["800" , "900" , "925" , "999"],  // Changed purities to silver-specific
    required: true 
  },
  weight: { 
    type: Number, 
    required: true, // Weight in grams
    min: 0
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
    default: 0, // Wastage percentage
    min: 0,
    max: 100
  },
  taxAmount: { 
    type: Number, 
    default: 0 // Tax amount for this item in paise
  },
  itemTotalAmount: { 
    type: Number, 
    required: true // Total amount for this item in paise
  },
  photos: [{ 
    type: String 
  }], // Photo URLs for this specific item
  hallmarkNumber: { 
    type: String 
  },
  certificateNumber: { 
    type: String 
  }
});

// Calculate total amount for individual item (same logic for silver)
silverTransactionItemSchema.methods.calculateItemTotal = function() {
  const baseAmount = this.weight * this.ratePerGram;
  const wastageAmount = (baseAmount * this.wastage) / 100;
  const subtotal = baseAmount + wastageAmount + this.makingCharges;
  const total = subtotal + this.taxAmount;
  return Math.round(total);
};

// Pre-save middleware to calculate item total for silver items
silverTransactionItemSchema.pre('save', function(next) {
  this.itemTotalAmount = this.calculateItemTotal();
  next();
});

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
    gstNumber: { type: String },
    email: { type: String }
  },
  
  // Individual items array
  items: [silverTransactionItemSchema],
  
  // Overall transaction details
  totalWeight: { 
    type: Number, 
    required: true, // Total weight of all items in grams
    min: 0
  },
  
  subtotalAmount: { 
    type: Number, 
    required: true // Subtotal before advance in paise
  },
  
  totalAmount: { 
    type: Number, 
    required: true // Final total amount in paise
  },
  
  advanceAmount: { 
    type: Number, 
    default: 0 // Advance paid/received in paise
  },
  
  remainingAmount: { 
    type: Number, 
    default: 0 // Remaining amount in paise
  },
  

  
  paymentMode: {
    type: String,
    enum: ["CASH", "UPI", "BANK_TRANSFER", "CARD", "CHEQUE"],
    default: "CASH"
  },
  
  // Transaction metadata
  invoiceNumber: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  billNumber: { 
    type: String 
  },
  
  notes: { 
    type: String 
  },
  
  // Market rates at transaction time
  marketRates: {
    silverPrice99: { type: Number }, // 99% silver price per gram in paise
    silverPrice92: { type: Number }, // 92.5% silver price per gram in paise
    silverPrice80: { type: Number }, // 80% silver price per gram in paise
    silverPrice90: { type: Number }, // 80% silver price per gram in paise
    priceSource: { type: String, default: "metalpriceapi.com" },
    fetchedAt: { type: Date }
  },
  
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
    subtotalAmount: `₹${(this.subtotalAmount / 100).toFixed(2)}`,
    advanceAmount: `₹${(this.advanceAmount / 100).toFixed(2)}`,
    remainingAmount: `₹${(this.remainingAmount / 100).toFixed(2)}`,
    totalWeight: `${this.totalWeight}g`
  };
});

// Indexes for better performance
silverTransactionSchema.index({ date: -1, transactionType: 1 });
silverTransactionSchema.index({ customer: 1, date: -1 });
silverTransactionSchema.index({ invoiceNumber: 1 });
silverTransactionSchema.index({ createdAt: -1 });
silverTransactionSchema.index({ 'items.purity': 1, date: -1 });

// Pre-save middleware to generate invoice number and calculate totals
silverTransactionSchema.pre('save', async function(next) {
  // Generate invoice number if new
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

  // Calculate totals from items
  this.calculateTotalsFromItems();
  
  next();
});

// Instance method to calculate totals from items
silverTransactionSchema.methods.calculateTotalsFromItems = function() {
  let totalWeight = 0;
  let subtotalAmount = 0;

  this.items.forEach(item => {
    totalWeight += item.weight;
    // Ensure item total is calculated
    item.itemTotalAmount = item.calculateItemTotal();
    subtotalAmount += item.itemTotalAmount;
  });

  this.totalWeight = totalWeight;
  this.subtotalAmount = subtotalAmount;
  this.totalAmount = subtotalAmount;
  this.remainingAmount = this.totalAmount - this.advanceAmount;

  // Update payment status
  if (this.remainingAmount <= 0) {
    this.paymentStatus = "PAID";
  } else if (this.advanceAmount > 0) {
    this.paymentStatus = "PARTIAL";
  } else {
    this.paymentStatus = "PENDING";
  }
};

// Instance method to format for display
silverTransactionSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    invoiceNumber: this.invoiceNumber,
    transactionType: this.transactionType,
    customer: this.customer,
    supplier: this.supplier,
    items: this.items.map(item => ({
      id: item._id,
      itemName: item.itemName,
      description: item.description,
      purity: item.purity,
      weight: item.weight,
      ratePerGram: item.ratePerGram / 100,
      makingCharges: item.makingCharges / 100,
      wastage: item.wastage,
      taxAmount: item.taxAmount / 100,
      itemTotalAmount: item.itemTotalAmount / 100,
      photos: item.photos,
      hallmarkNumber: item.hallmarkNumber,
      certificateNumber: item.certificateNumber,
      formattedWeight: `${item.weight}g`,
      formattedRate: `₹${(item.ratePerGram / 100).toFixed(2)}/g`,
      formattedTotal: `₹${(item.itemTotalAmount / 100).toFixed(2)}`
    })),
    totalWeight: this.totalWeight,
    subtotalAmount: this.subtotalAmount / 100,
    totalAmount: this.totalAmount / 100,
    advanceAmount: this.advanceAmount / 100,
    remainingAmount: this.remainingAmount / 100,
    paymentStatus: this.paymentStatus,
    paymentMode: this.paymentMode,
    marketRates: this.marketRates,
    date: this.date,
    formattedDate: this.date.toLocaleDateString('en-IN'),
    formattedAmount: `₹${(this.totalAmount / 100).toFixed(2)}`,
    formattedWeight: `${this.totalWeight}g`,
    notes: this.notes,
    billNumber: this.billNumber
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
      $unwind: '$items'
    },
    {
      $group: {
        _id: {
          transactionType: '$transactionType',
          purity: '$items.purity'
        },
        totalAmount: { $sum: '$items.itemTotalAmount' },
        totalWeight: { $sum: '$items.weight' },
        transactionCount: { $sum: 1 },
        avgRate: { $avg: '$items.ratePerGram' }
      }
    },
    {
      $group: {
        _id: '$_id.transactionType',
        purities: {
          $push: {
            purity: '$_id.purity',
            totalAmount: '$totalAmount',
            totalWeight: '$totalWeight',
            avgRate: '$avgRate',
            transactionCount: '$transactionCount'
          }
        },
        overallAmount: { $sum: '$totalAmount' },
        overallWeight: { $sum: '$totalWeight' },
        overallTransactions: { $sum: '$transactionCount' }
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
      $unwind: '$items'
    },
    {
      $group: {
        _id: {
          type: '$transactionType',
          day: { $dayOfMonth: '$date' },
          purity: '$items.purity'
        },
        dailyAmount: { $sum: '$items.itemTotalAmount' },
        dailyWeight: { $sum: '$items.weight' },
        transactionCount: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          type: '$_id.type',
          purity: '$_id.purity'
        },
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
