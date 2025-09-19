// models/BusinessExpense.js
import mongoose from "mongoose";

const businessExpenseSchema = new mongoose.Schema({
  // Basic expense information
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  category: {
    type: String,
    enum: [
      'RAW_MATERIALS',
      'EQUIPMENT', 
      'UTILITIES',
      'MARKETING',
      'RENT_LEASE',
      'INSURANCE',
      'PROFESSIONAL_SERVICES',
      'TRANSPORTATION',
      'PACKAGING',
      'MAINTENANCE',
      'OFFICE_SUPPLIES',
      'COMMUNICATION',
      'LEGAL_COMPLIANCE',
      'EMPLOYEE_BENEFITS',
      'MISCELLANEOUS'
    ],
    required: true,
    index: true
  },
  
  subcategory: {
    type: String,
    required: false
  },
  
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Vendor information
  vendor: {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    code: {
      type: String,
      required: false,
      maxlength: 50
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    gstNumber: String
  },
  
  // Financial details (all amounts in paise)
  grossAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  taxDetails: {
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    cess: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 }
  },
  
  netAmount: {
    type: Number,
    required: true,
    min: 0
  },
  

  
  paymentMethod: {
    type: String,
    enum: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'CHEQUE', 'AUTO_PAY'],
    required: function() { return this.paymentStatus === 'PAID' || this.paymentStatus === 'PARTIAL'; }
  },
  
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  pendingAmount: {
    type: Number,
    default: function() { return this.grossAmount - this.paidAmount; }
  },
  
  // Dates
  expenseDate: {
    type: Date,
    required: true,
    index: true
  },
  
  dueDate: {
    type: Date,
    required: false
  },
  
  paidDate: {
    type: Date,
    required: false
  },
  
  // Document attachments
  attachments: [{
    filename: String,
    url: String,
    uploadDate: { type: Date, default: Date.now },
    size: Number,
    mimetype: String
  }],
  
  // Additional metadata
  metadata: {
    invoiceNumber: String,
    poNumber: String,  // Purchase Order Number
    batchNumber: String,
    serialNumber: String,
    warrantyPeriod: String,
    location: String,
    department: String,
    project: String,
    approvedBy: String,
    notes: String
  },
  
  // Tracking fields
  isRecurring: {
    type: Boolean,
    default: false
  },
  
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'YEARLY'],
      required: function() { return this.isRecurring; }
    },
    nextDueDate: Date,
    endDate: Date
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  tags: [String],
  
  createdBy: {
    type: String,
    default: 'Admin'
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
businessExpenseSchema.index({ expenseDate: -1, category: 1 });
businessExpenseSchema.index({ paymentStatus: 1, dueDate: 1 });
businessExpenseSchema.index({ vendor: 1, expenseDate: -1 });
businessExpenseSchema.index({ createdAt: -1 });

// Virtual for remaining amount
businessExpenseSchema.virtual('remainingAmount').get(function() {
  return this.grossAmount - this.paidAmount;
});

// Method to calculate if expense is overdue
businessExpenseSchema.methods.isOverdue = function() {
  if (this.paymentStatus === 'PAID') return false;
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
};

// Method to format expense for display
businessExpenseSchema.methods.formatForDisplay = function() {
  return {
    id: this._id,
    referenceNumber: this.referenceNumber,
    category: this.category,
    title: this.title,
    description: this.description,
    vendor: this.vendor,
    grossAmount: this.grossAmount / 100,
    netAmount: this.netAmount / 100,
    taxAmount: this.taxDetails.totalTax / 100,
    paidAmount: this.paidAmount / 100,
    pendingAmount: this.pendingAmount / 100,
    paymentStatus: this.paymentStatus,
    paymentMethod: this.paymentMethod,
    expenseDate: this.expenseDate,
    dueDate: this.dueDate,
    paidDate: this.paidDate,
    isOverdue: this.isOverdue(),
    formattedGrossAmount: `₹${(this.grossAmount / 100).toLocaleString('en-IN')}`,
    formattedNetAmount: `₹${(this.netAmount / 100).toLocaleString('en-IN')}`,
    formattedExpenseDate: this.expenseDate.toLocaleDateString('en-IN'),
    attachments: this.attachments,
    metadata: this.metadata,
    tags: this.tags,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to get expenses by date range
businessExpenseSchema.statics.getExpensesByDateRange = function(startDate, endDate, filters = {}) {
  const query = {
    expenseDate: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    },
    isActive: true,
    ...filters
  };
  
  return this.find(query).sort({ expenseDate: -1 });
};

// Static method to get expense summary by category
businessExpenseSchema.statics.getExpenseSummaryByCategory = function(startDate, endDate) {
  const matchStage = {
    isActive: true
  };
  
  if (startDate && endDate) {
    matchStage.expenseDate = { 
      $gte: new Date(startDate), 
      $lte: new Date(endDate) 
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$category',
        totalGrossAmount: { $sum: '$grossAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalPendingAmount: { $sum: '$pendingAmount' },
        totalTaxAmount: { $sum: '$taxDetails.totalTax' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        totalGrossAmount: 1,
        totalNetAmount: 1,
        totalPaidAmount: 1,
        totalPendingAmount: 1,
        totalTaxAmount: 1,
        count: 1,
        totalGrossAmountFormatted: { $divide: ['$totalGrossAmount', 100] },
        totalNetAmountFormatted: { $divide: ['$totalNetAmount', 100] },
        totalPaidAmountFormatted: { $divide: ['$totalPaidAmount', 100] },
        totalPendingAmountFormatted: { $divide: ['$totalPendingAmount', 100] },
        totalTaxAmountFormatted: { $divide: ['$totalTaxAmount', 100] },
        _id: 0
      }
    },
    { $sort: { totalGrossAmount: -1 } }
  ]);
};

// Static method to get monthly expense summary
businessExpenseSchema.statics.getMonthlyExpenseSummary = function(year) {
  return this.aggregate([
    {
      $match: {
        expenseDate: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        },
        isActive: true
      }
    },
    {
      $group: {
        _id: { 
          month: { $month: '$expenseDate' },
          year: { $year: '$expenseDate' }
        },
        totalGrossAmount: { $sum: '$grossAmount' },
        totalNetAmount: { $sum: '$netAmount' },
        totalPaidAmount: { $sum: '$paidAmount' },
        totalPendingAmount: { $sum: '$pendingAmount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        month: '$_id.month',
        year: '$_id.year',
        totalGrossAmount: { $divide: ['$totalGrossAmount', 100] },
        totalNetAmount: { $divide: ['$totalNetAmount', 100] },
        totalPaidAmount: { $divide: ['$totalPaidAmount', 100] },
        totalPendingAmount: { $divide: ['$totalPendingAmount', 100] },
        count: 1,
        _id: 0
      }
    },
    { $sort: { month: 1 } }
  ]);
};

// Generate reference number
businessExpenseSchema.statics.generateReferenceNumber = async function(category) {
  const categoryMap = {
    'RAW_MATERIALS': 'RM',
    'EQUIPMENT': 'EQ',
    'UTILITIES': 'UT',
    'MARKETING': 'MK',
    'RENT_LEASE': 'RL',
    'INSURANCE': 'IN',
    'PROFESSIONAL_SERVICES': 'PS',
    'TRANSPORTATION': 'TR',
    'PACKAGING': 'PK',
    'MAINTENANCE': 'MT',
    'OFFICE_SUPPLIES': 'OS',
    'COMMUNICATION': 'CM',
    'LEGAL_COMPLIANCE': 'LC',
    'EMPLOYEE_BENEFITS': 'EB',
    'MISCELLANEOUS': 'MS'
  };
  
  const prefix = categoryMap[category] || 'EX';
  const year = new Date().getFullYear().toString().substr(-2);
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const lastExpense = await this.findOne({
    referenceNumber: new RegExp(`^${prefix}-${year}${month}`)
  }).sort({ referenceNumber: -1 });
  
  let sequence = 1;
  if (lastExpense) {
    const lastSequence = parseInt(lastExpense.referenceNumber.split('-')[2]) || 0;
    sequence = lastSequence + 1;
  }
  
  return `${prefix}-${year}${month}-${String(sequence).padStart(3, '0')}`;
};

export default mongoose.model("BusinessExpense", businessExpenseSchema);