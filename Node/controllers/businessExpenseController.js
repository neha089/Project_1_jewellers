// controllers/businessExpenseController.js
import BusinessExpense from '../models/BusinessExpense.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

/**
 * Create a new business expense
 * POST /api/business-expenses
 */
export const createExpense = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      title,
      description,
      vendor,
      grossAmount,
      taxDetails = {},
      paymentMethod,
      expenseDate,
      dueDate,
      metadata = {},
      tags = [],
      isRecurring = false,
      recurringDetails = {},
      referenceNumber,
      paymentStatus 
    } = req.body;

    // Validate required fields
    if (!category || !title || !description || !vendor?.name || !grossAmount || !expenseDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, title, description, vendor.name, grossAmount, expenseDate'
      });
    }

    if (grossAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Gross amount must be greater than 0'
      });
    }

    // Calculate tax amounts (convert to paise)
    const totalTax = taxDetails.totalTax || 0;
    const grossAmountPaise = Math.round(grossAmount);
    const totalTaxPaise = Math.round(totalTax);
    const netAmountPaise = grossAmountPaise - totalTaxPaise;

    if (totalTaxPaise > grossAmountPaise) {
      return res.status(400).json({
        success: false,
        error: 'Tax amount cannot exceed gross amount'
      });
    }

    // Generate reference number if not provided
    const finalReferenceNumber = referenceNumber || 
      await BusinessExpense.generateReferenceNumber(category);

    // Prepare vendor object with proper structure
    const vendorData = {
      name: vendor.name.trim(),
      code: vendor.code ? vendor.code.trim() : undefined,
      contact: {
        phone: vendor.contact?.phone || undefined,
        email: vendor.contact?.email || undefined,
        address: vendor.contact?.address || undefined
      },
      gstNumber: vendor.gstNumber || undefined
    };

    // Calculate payment amounts based on status
    let paidAmount = 0;
    let pendingAmount = grossAmountPaise;
    let paidDate = null;

    if (paymentStatus === 'PAID') {
      paidAmount = grossAmountPaise;
      pendingAmount = 0;
      paidDate = new Date();
    }

    const expenseData = {
      referenceNumber: finalReferenceNumber,
      category,
      subcategory: subcategory || undefined,
      title: title.trim(),
      description: description.trim(),
      vendor: vendorData,
      grossAmount: grossAmountPaise,
      taxDetails: {
        cgst: Math.round(taxDetails.cgst || 0),
        sgst: Math.round(taxDetails.sgst || 0),
        igst: Math.round(taxDetails.igst || 0),
        cess: Math.round(taxDetails.cess || 0),
        totalTax: totalTaxPaise
      },
      netAmount: netAmountPaise,
      paymentStatus,
      paymentMethod: paymentStatus === 'PAID' ? paymentMethod : undefined,
      paidAmount,
      pendingAmount,
      expenseDate: new Date(expenseDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paidDate,
      metadata,
      tags,
      isRecurring,
      recurringDetails: isRecurring ? recurringDetails : undefined
    };

    const expense = new BusinessExpense(expenseData);
    await expense.save();

    // Create corresponding transaction record
    const transaction = new Transaction({
      type: 'BUSINESS_EXPENSE',
      amount: grossAmountPaise,
      direction: 1, // Outgoing expense
      description: `${title} - ${vendor.name}`,
      category: 'EXPENSE',
      relatedDoc: expense._id,
      relatedModel: 'BusinessExpense',
      metadata: {
        expenseCategory: category,
        vendorName: vendor.name,
        referenceNumber: finalReferenceNumber,
        taxAmount: totalTaxPaise,
        netAmount: netAmountPaise
      }
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      data: expense.formatForDisplay(),
      message: `Business expense created successfully with reference ${finalReferenceNumber}`
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update expense details
 * PUT /api/business-expenses/:id
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID'
      });
    }

    const expense = await BusinessExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    const {
      category,
      subcategory,
      title,
      description,
      vendor,
      grossAmount,
      taxDetails,
      paymentMethod,
      expenseDate,
      dueDate,
      metadata,
      tags,
      paymentStatus,
      referenceNumber
    } = req.body;

    // Validate required fields if they are being updated
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title cannot be empty'
      });
    }

    if (description !== undefined && !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Description cannot be empty'
      });
    }

    if (grossAmount !== undefined && grossAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Gross amount must be greater than 0'
      });
    }

    if (vendor?.name !== undefined && !vendor.name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Vendor name cannot be empty'
      });
    }

    // Update basic fields
    if (category !== undefined) expense.category = category;
    if (subcategory !== undefined) expense.subcategory = subcategory || undefined;
    if (title !== undefined) expense.title = title.trim();
    if (description !== undefined) expense.description = description.trim();
    if (expenseDate !== undefined) expense.expenseDate = new Date(expenseDate);
    if (dueDate !== undefined) expense.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (referenceNumber !== undefined) expense.referenceNumber = referenceNumber;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (paymentStatus !== undefined) expense.paymentStatus = paymentStatus;
    if (tags !== undefined) expense.tags = tags;

    // Update vendor information
    if (vendor !== undefined) {
      expense.vendor = {
        name: vendor.name ? vendor.name.trim() : expense.vendor.name,
        code: vendor.code !== undefined ? (vendor.code ? vendor.code.trim() : undefined) : expense.vendor.code,
        contact: {
          phone: vendor.contact?.phone !== undefined ? vendor.contact.phone : expense.vendor.contact?.phone,
          email: vendor.contact?.email !== undefined ? vendor.contact.email : expense.vendor.contact?.email,
          address: vendor.contact?.address !== undefined ? vendor.contact.address : expense.vendor.contact?.address
        },
        gstNumber: vendor.gstNumber !== undefined ? vendor.gstNumber : expense.vendor.gstNumber
      };
    }

    // Update metadata
    if (metadata !== undefined) {
      expense.metadata = { ...expense.metadata, ...metadata };
    }

    // Update financial details
    if (grossAmount !== undefined || taxDetails !== undefined) {
      const newGrossAmount = grossAmount !== undefined ? grossAmount : expense.grossAmount;
      const newTaxDetails = taxDetails || {
        totalTax: expense.taxDetails.totalTax
      };

      const grossAmountPaise = Math.round(newGrossAmount);
      const totalTaxPaise = Math.round(newTaxDetails.totalTax || 0);
      const netAmountPaise = grossAmountPaise - totalTaxPaise;

      if (totalTaxPaise > grossAmountPaise) {
        return res.status(400).json({
          success: false,
          error: 'Tax amount cannot exceed gross amount'
        });
      }

      expense.grossAmount = grossAmountPaise;
      expense.taxDetails = {
        cgst: Math.round(newTaxDetails.cgst || 0),
        sgst: Math.round(newTaxDetails.sgst || 0),
        igst: Math.round(newTaxDetails.igst || 0),
        cess: Math.round(newTaxDetails.cess || 0),
        totalTax: totalTaxPaise
      };
      expense.netAmount = netAmountPaise;

      // Recalculate pending amount if gross amount changed
      expense.pendingAmount = grossAmountPaise - expense.paidAmount;
    }

    // Handle payment status changes
    if (paymentStatus === 'PAID' && expense.paidAmount === 0) {
      expense.paidAmount = expense.grossAmount;
      expense.pendingAmount = 0;
      expense.paidDate = new Date();
    } else if (paymentStatus === 'PENDING' && expense.paymentStatus === 'PAID') {
      // Reset to pending (keeping existing paid amount if any)
      expense.pendingAmount = expense.grossAmount - expense.paidAmount;
    }

    await expense.save();

    res.json({
      success: true,
      data: expense.formatForDisplay(),
      message: 'Business expense updated successfully'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all expenses with filtering and pagination
 * GET /api/business-expenses
 */
export const getExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      category,
      paymentStatus,
      startDate,
      endDate,
      vendor,
      sortBy = 'expenseDate',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'vendor.name': searchRegex },
        { 'vendor.code': searchRegex },
        { referenceNumber: searchRegex }
      ];
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by payment status
    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }

    // Filter by vendor
    if (vendor) {
      query['vendor.name'] = new RegExp(vendor, 'i');
    }

    // Date range filter
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [expenses, totalCount] = await Promise.all([
      BusinessExpense.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      BusinessExpense.countDocuments(query)
    ]);

    // Calculate summary
    const summary = await BusinessExpense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossAmount: { $sum: '$grossAmount' },
          totalNetAmount: { $sum: '$netAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: '$pendingAmount' },
          totalTaxAmount: { $sum: '$taxDetails.totalTax' },
          paidExpenses: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
          },
          pendingExpenses: {
            $sum: { $cond: [{ $ne: ['$paymentStatus', 'PAID'] }, 1, 0] }
          }
        }
      }
    ]);

    const summaryData = summary[0] ? {
      totalGrossAmount: Math.round(summary[0].totalGrossAmount),
      totalNetAmount: Math.round(summary[0].totalNetAmount),
      totalPaidAmount: Math.round(summary[0].totalPaidAmount),
      totalPendingAmount: Math.round(summary[0].totalPendingAmount),
      totalTaxAmount: Math.round(summary[0].totalTaxAmount),
      paidExpenses: summary[0].paidExpenses,
      pendingExpenses: summary[0].pendingExpenses
    } : {
      totalGrossAmount: 0,
      totalNetAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
      totalTaxAmount: 0,
      paidExpenses: 0,
      pendingExpenses: 0
    };

    res.json({
      success: true,
      data: expenses.map(expense => ({
        _id: expense._id,
        referenceNumber: expense.referenceNumber,
        category: expense.category,
        subcategory: expense.subcategory,
        title: expense.title,
        description: expense.description,
        vendor: expense.vendor,
        grossAmount: expense.grossAmount,
        netAmount: expense.netAmount,
        taxDetails: {
          totalTax: expense.taxDetails.totalTax,
          cgst: expense.taxDetails.cgst  ,
          sgst: expense.taxDetails.sgst  ,
          igst: expense.taxDetails.igst  ,
          cess: expense.taxDetails.cess  
        },
        paidAmount: expense.paidAmount  ,
        pendingAmount: expense.pendingAmount  ,
        paymentStatus: expense.paymentStatus,
        paymentMethod: expense.paymentMethod,
        expenseDate: expense.expenseDate,
        dueDate: expense.dueDate,
        paidDate: expense.paidDate,
        metadata: expense.metadata,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt
      })),
      summary: summaryData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + expenses.length < totalCount,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete business expense (soft delete)
 * DELETE /api/business-expenses/:id
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid expense ID'
      });
    }

    const expense = await BusinessExpense.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Check if expense has payments
    if (expense.paidAmount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete expense with payments. Only pending expenses can be deleted.'
      });
    }

    // Soft delete
    expense.isActive = false;
    await expense.save();

    res.json({
      success: true,
      message: 'Business expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense dashboard summary
 * GET /api/business-expenses/dashboard
 */
export const getExpenseDashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // This month date range
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const [overviewData, thisMonthData] = await Promise.all([
      BusinessExpense.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalGrossAmount: { $sum: '$grossAmount' },
            totalNetAmount: { $sum: '$netAmount' },
            totalPaidAmount: { $sum: '$paidAmount' },
            totalPendingAmount: { $sum: '$pendingAmount' },
            totalTaxAmount: { $sum: '$taxDetails.totalTax' },
            paidExpenses: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
            },
            pendingExpenses: {
              $sum: { $cond: [{ $ne: ['$paymentStatus', 'PAID'] }, 1, 0] }
            }
          }
        }
      ]),
      BusinessExpense.aggregate([
        {
          $match: {
            isActive: true,
            expenseDate: { $gte: thisMonthStart, $lte: thisMonthEnd }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$grossAmount' },
            totalExpenses: { $sum: 1 }
          }
        }
      ])
    ]);

    const overview = overviewData[0] ? {
      totalGrossAmount: Math.round(overviewData[0].totalGrossAmount  ),
      totalNetAmount: Math.round(overviewData[0].totalNetAmount  ),
      totalPaidAmount: Math.round(overviewData[0].totalPaidAmount  ),
      totalPendingAmount: Math.round(overviewData[0].totalPendingAmount  ),
      totalTaxAmount: Math.round(overviewData[0].totalTaxAmount  ),
      paidExpenses: overviewData[0].paidExpenses,
      pendingExpenses: overviewData[0].pendingExpenses,
      thisMonth: thisMonthData[0] ? {
        totalAmount: Math.round(thisMonthData[0].totalAmount  ),
        totalExpenses: thisMonthData[0].totalExpenses
      } : { totalAmount: 0, totalExpenses: 0 }
    } : {
      totalGrossAmount: 0,
      totalNetAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
      totalTaxAmount: 0,
      paidExpenses: 0,
      pendingExpenses: 0,
      thisMonth: { totalAmount: 0, totalExpenses: 0 }
    };

    res.json({
      success: true,
      data: { overview }
    });
  } catch (error) {
    console.error('Error fetching expense dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update expense payment
 * PUT /api/business-expenses/:id/payment
 */
export const updateExpensePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod, paidDate, note } = req.body;

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid paid amount is required'
      });
    }

    const expense = await BusinessExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    if (expense.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        error: 'Expense is already fully paid'
      });
    }

    const paidAmountPaise = Math.round(paidAmount  );
    const totalPaidAmount = expense.paidAmount + paidAmountPaise;

    if (totalPaidAmount > expense.grossAmount) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds remaining balance. Maximum payable: ₹${((expense.grossAmount - expense.paidAmount)  ).toFixed(2)}`
      });
    }

    // Update expense
    expense.paidAmount = totalPaidAmount;
    expense.pendingAmount = expense.grossAmount - totalPaidAmount;
    expense.paymentMethod = paymentMethod;
    expense.paidDate = paidDate ? new Date(paidDate) : new Date();

    // Update payment status
    if (expense.pendingAmount <= 0) {
      expense.paymentStatus = 'PAID';
    } else {
      expense.paymentStatus = 'PARTIAL';
    }

    await expense.save();

    // Create transaction record for payment
    const transaction = new Transaction({
      type: 'EXPENSE_PAYMENT',
      amount: paidAmountPaise,
      direction: -1, // Incoming payment
      description: `Payment for ${expense.title} - ${expense.vendor.name}`,
      category: 'INCOME',
      relatedDoc: expense._id,
      relatedModel: 'BusinessExpense',
      metadata: {
        paymentType: expense.paymentStatus === 'PAID' ? 'FULL_PAYMENT' : 'PARTIAL_PAYMENT',
        remainingAmount: expense.pendingAmount,
        referenceNumber: expense.referenceNumber,
        paymentMethod: paymentMethod
      }
    });
    await transaction.save();

    res.json({
      success: true,
      data: expense.formatForDisplay(),
      message: expense.paymentStatus === 'PAID' ? 
        'Expense fully paid!' : 
        `Partial payment recorded. Remaining: ₹${(expense.pendingAmount  ).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
