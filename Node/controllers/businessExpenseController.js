// controllers/businessExpenseController.js
import BusinessExpense from '../models/BusinessExpense.js';
import Transaction from '../models/Transaction.js';

/**
 * Create a new business expense
 * POST /api/expenses
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
      recurringDetails = {}
    } = req.body;

    // Validate required fields
    if (!category || !title || !description || !vendor?.name || !grossAmount || !expenseDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: category, title, description, vendor.name, grossAmount, expenseDate'
      });
    }

    // Convert amounts to paise
    const grossAmountPaise = Math.round(grossAmount * 100);
    const totalTax = (taxDetails.cgst || 0) + (taxDetails.sgst || 0) + (taxDetails.igst || 0) + (taxDetails.cess || 0);
    const totalTaxPaise = Math.round(totalTax * 100);
    const netAmountPaise = grossAmountPaise - totalTaxPaise;

    // Generate reference number
    const referenceNumber = await BusinessExpense.generateReferenceNumber(category);

    const expense = new BusinessExpense({
      referenceNumber,
      category,
      subcategory,
      title,
      description,
      vendor,
      grossAmount: grossAmountPaise,
      taxDetails: {
        cgst: Math.round((taxDetails.cgst || 0) * 100),
        sgst: Math.round((taxDetails.sgst || 0) * 100),
        igst: Math.round((taxDetails.igst || 0) * 100),
        cess: Math.round((taxDetails.cess || 0) * 100),
        totalTax: totalTaxPaise
      },
      netAmount: netAmountPaise,
      paymentMethod,
      expenseDate: new Date(expenseDate),
      dueDate: dueDate ? new Date(dueDate) : null,
      metadata,
      tags,
      isRecurring,
      recurringDetails: isRecurring ? recurringDetails : undefined
    });

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
        referenceNumber: referenceNumber,
        taxAmount: totalTaxPaise,
        netAmount: netAmountPaise
      }
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      data: expense.formatForDisplay(),
      message: `Business expense created successfully with reference ${referenceNumber}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all expenses with filtering, pagination, and sorting
 * GET /api/expenses
 */
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      paymentStatus,
      vendor,
      startDate,
      endDate,
      sortBy = 'expenseDate',
      sortOrder = 'desc',
      search,
      overdue = false
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (category) query.category = category;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (vendor) query['vendor.name'] = new RegExp(vendor, 'i');
    
    // Date range filter
    if (startDate && endDate) {
      query.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'vendor.name': new RegExp(search, 'i') },
        { referenceNumber: new RegExp(search, 'i') }
      ];
    }

    // Overdue filter
    if (overdue === 'true') {
      query.paymentStatus = { $in: ['PENDING', 'PARTIAL'] };
      query.dueDate = { $lt: new Date() };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const expenses = await BusinessExpense.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortOptions);

    const total = await BusinessExpense.countDocuments(query);

    // Format expenses for display
    const formattedExpenses = expenses.map(expense => expense.formatForDisplay());

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
          totalTaxAmount: { $sum: '$taxDetails.totalTax' }
        }
      }
    ]);

    const summaryData = summary[0] || {
      totalGrossAmount: 0,
      totalNetAmount: 0,
      totalPaidAmount: 0,
      totalPendingAmount: 0,
      totalTaxAmount: 0
    };

    res.json({
      success: true,
      data: formattedExpenses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      },
      summary: {
        totalGrossAmount: summaryData.totalGrossAmount / 100,
        totalNetAmount: summaryData.totalNetAmount / 100,
        totalPaidAmount: summaryData.totalPaidAmount / 100,
        totalPendingAmount: summaryData.totalPendingAmount / 100,
        totalTaxAmount: summaryData.totalTaxAmount / 100,
        formattedTotalGross: `₹${(summaryData.totalGrossAmount / 100).toLocaleString('en-IN')}`,
        formattedTotalNet: `₹${(summaryData.totalNetAmount / 100).toLocaleString('en-IN')}`,
        formattedTotalPaid: `₹${(summaryData.totalPaidAmount / 100).toLocaleString('en-IN')}`,
        formattedTotalPending: `₹${(summaryData.totalPendingAmount / 100).toLocaleString('en-IN')}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense by ID
 * GET /api/expenses/:id
 */
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await BusinessExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Get related transactions
    const transactions = await Transaction.find({
      relatedDoc: id,
      relatedModel: 'BusinessExpense'
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: {
        ...expense.formatForDisplay(),
        transactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update expense payment status
 * PUT /api/expenses/:id/payment
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

    const paidAmountPaise = Math.round(paidAmount * 100);
    const totalPaidAmount = expense.paidAmount + paidAmountPaise;

    if (totalPaidAmount > expense.grossAmount) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds remaining balance. Maximum payable: ₹${((expense.grossAmount - expense.paidAmount) / 100).toFixed(2)}`
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
        `Partial payment recorded. Remaining: ₹${(expense.pendingAmount / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense summary by category
 * GET /api/expenses/summary/category
 */
export const getExpenseSummaryByCategory = async (req, res) => {
  try {
    const { startDate, endDate, year } = req.query;

    let matchStartDate, matchEndDate;

    if (year) {
      matchStartDate = new Date(`${year}-01-01`);
      matchEndDate = new Date(`${year}-12-31`);
    } else if (startDate && endDate) {
      matchStartDate = new Date(startDate);
      matchEndDate = new Date(endDate);
    } else {
      // Default to current year
      const currentYear = new Date().getFullYear();
      matchStartDate = new Date(`${currentYear}-01-01`);
      matchEndDate = new Date(`${currentYear}-12-31`);
    }

    const summary = await BusinessExpense.getExpenseSummaryByCategory(matchStartDate, matchEndDate);

    // Calculate total percentages
    const totalGrossAmount = summary.reduce((sum, item) => sum + item.totalGrossAmount, 0);
    
    const summaryWithPercentages = summary.map(item => ({
      ...item,
      percentage: totalGrossAmount > 0 ? ((item.totalGrossAmount / totalGrossAmount) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: summaryWithPercentages,
      totalSummary: {
        totalGrossAmount: totalGrossAmount / 100,
        totalTransactions: summary.reduce((sum, item) => sum + item.count, 0),
        formattedTotal: `₹${(totalGrossAmount / 100).toLocaleString('en-IN')}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get monthly expense summary
 * GET /api/expenses/summary/monthly
 */
export const getMonthlyExpenseSummary = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const summary = await BusinessExpense.getMonthlyExpenseSummary(year);

    // Fill in missing months with zero values
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const fullYearSummary = monthNames.map((monthName, index) => {
      const monthData = summary.find(item => item.month === index + 1);
      return {
        month: index + 1,
        monthName,
        year: parseInt(year),
        totalGrossAmount: monthData?.totalGrossAmount || 0,
        totalNetAmount: monthData?.totalNetAmount || 0,
        totalPaidAmount: monthData?.totalPaidAmount || 0,
        totalPendingAmount: monthData?.totalPendingAmount || 0,
        count: monthData?.count || 0,
        formattedAmount: `₹${((monthData?.totalGrossAmount || 0)).toLocaleString('en-IN')}`
      };
    });

    const yearlyTotal = {
      totalGrossAmount: fullYearSummary.reduce((sum, month) => sum + month.totalGrossAmount, 0),
      totalNetAmount: fullYearSummary.reduce((sum, month) => sum + month.totalNetAmount, 0),
      totalPaidAmount: fullYearSummary.reduce((sum, month) => sum + month.totalPaidAmount, 0),
      totalPendingAmount: fullYearSummary.reduce((sum, month) => sum + month.totalPendingAmount, 0),
      totalTransactions: fullYearSummary.reduce((sum, month) => sum + month.count, 0)
    };

    res.json({
      success: true,
      data: fullYearSummary,
      yearlyTotal: {
        ...yearlyTotal,
        formattedTotal: `₹${yearlyTotal.totalGrossAmount.toLocaleString('en-IN')}`,
        year: parseInt(year)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get overdue expenses
 * GET /api/expenses/overdue
 */
export const getOverdueExpenses = async (req, res) => {
  try {
    const { days = 0 } = req.query;
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + parseInt(days));

    const overdueExpenses = await BusinessExpense.find({
      paymentStatus: { $in: ['PENDING', 'PARTIAL'] },
      dueDate: { $lte: checkDate },
      isActive: true
    }).sort({ dueDate: 1 });

    const formattedExpenses = overdueExpenses.map(expense => {
      const daysOverdue = Math.ceil((new Date() - expense.dueDate) / (1000 * 60 * 60 * 24));
      return {
        ...expense.formatForDisplay(),
        daysOverdue,
        severity: daysOverdue > 30 ? 'CRITICAL' : daysOverdue > 7 ? 'HIGH' : 'MEDIUM'
      };
    });

    const summary = {
      totalOverdueExpenses: formattedExpenses.length,
      totalOverdueAmount: formattedExpenses.reduce((sum, exp) => sum + exp.pendingAmount, 0),
      criticalCount: formattedExpenses.filter(exp => exp.severity === 'CRITICAL').length,
      highCount: formattedExpenses.filter(exp => exp.severity === 'HIGH').length,
      mediumCount: formattedExpenses.filter(exp => exp.severity === 'MEDIUM').length
    };

    res.json({
      success: true,
      data: formattedExpenses,
      summary: {
        ...summary,
        formattedTotalOverdueAmount: `₹${summary.totalOverdueAmount.toLocaleString('en-IN')}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update expense details
 * PUT /api/expenses/:id
 */
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      vendor,
      grossAmount,
      taxDetails,
      dueDate,
      metadata,
      tags
    } = req.body;

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
        error: 'Cannot update paid expense. Only pending or partial expenses can be updated.'
      });
    }

    // Update fields if provided
    if (title) expense.title = title;
    if (description) expense.description = description;
    if (vendor) expense.vendor = { ...expense.vendor, ...vendor };
    if (dueDate) expense.dueDate = new Date(dueDate);
    if (metadata) expense.metadata = { ...expense.metadata, ...metadata };
    if (tags) expense.tags = tags;

    // Update financial details if provided
    if (grossAmount && taxDetails) {
      const grossAmountPaise = Math.round(grossAmount * 100);
      const totalTax = (taxDetails.cgst || 0) + (taxDetails.sgst || 0) + (taxDetails.igst || 0) + (taxDetails.cess || 0);
      const totalTaxPaise = Math.round(totalTax * 100);
      const netAmountPaise = grossAmountPaise - totalTaxPaise;

      expense.grossAmount = grossAmountPaise;
      expense.taxDetails = {
        cgst: Math.round((taxDetails.cgst || 0) * 100),
        sgst: Math.round((taxDetails.sgst || 0) * 100),
        igst: Math.round((taxDetails.igst || 0) * 100),
        cess: Math.round((taxDetails.cess || 0) * 100),
        totalTax: totalTaxPaise
      };
      expense.netAmount = netAmountPaise;
      expense.pendingAmount = grossAmountPaise - expense.paidAmount;
    }

    await expense.save();

    res.json({
      success: true,
      data: expense.formatForDisplay(),
      message: 'Expense updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete (deactivate) expense
 * DELETE /api/expenses/:id
 */
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await BusinessExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    if (expense.paymentStatus === 'PAID' || expense.paymentStatus === 'PARTIAL') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete expense with payments. Only pending expenses can be deleted.'
      });
    }

    expense.isActive = false;
    await expense.save();

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get expense dashboard summary
 * GET /api/expenses/dashboard
 */
export const getExpenseDashboard = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));

    // Overall summary
    const overallSummary = await BusinessExpense.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalGrossAmount: { $sum: '$grossAmount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          totalPendingAmount: { $sum: '$pendingAmount' },
          paidExpenses: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, 1, 0] }
          },
          pendingExpenses: {
            $sum: { $cond: [{ $ne: ['$paymentStatus', 'PAID'] }, 1, 0] }
          }
        }
      }
    ]);

    // This month summary
    const monthSummary = await BusinessExpense.aggregate([
      { 
        $match: { 
          isActive: true,
          expenseDate: { $gte: startOfMonth }
        } 
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$grossAmount' }
        }
      }
    ]);

    // This week summary
    const weekSummary = await BusinessExpense.aggregate([
      { 
        $match: { 
          isActive: true,
          expenseDate: { $gte: startOfWeek }
        } 
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$grossAmount' }
        }
      }
    ]);

    // Category-wise current month breakdown
    const categoryBreakdown = await BusinessExpense.aggregate([
      { 
        $match: { 
          isActive: true,
          expenseDate: { $gte: startOfMonth }
        } 
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$grossAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 }
    ]);

    // Overdue expenses count
    const overdueCount = await BusinessExpense.countDocuments({
      paymentStatus: { $in: ['PENDING', 'PARTIAL'] },
      dueDate: { $lt: new Date() },
      isActive: true
    });

    // Recent expenses
    const recentExpenses = await BusinessExpense.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const overall = overallSummary[0] || {};
    const month = monthSummary[0] || {};
    const week = weekSummary[0] || {};

    res.json({
      success: true,
      data: {
        overview: {
          totalExpenses: overall.totalExpenses || 0,
          totalGrossAmount: (overall.totalGrossAmount || 0) / 100,
          totalPaidAmount: (overall.totalPaidAmount || 0) / 100,
          totalPendingAmount: (overall.totalPendingAmount || 0) / 100,
          paidExpenses: overall.paidExpenses || 0,
          pendingExpenses: overall.pendingExpenses || 0,
          overdueExpenses: overdueCount,
          formattedTotalGross: `₹${((overall.totalGrossAmount || 0) / 100).toLocaleString('en-IN')}`,
          formattedTotalPaid: `₹${((overall.totalPaidAmount || 0) / 100).toLocaleString('en-IN')}`,
          formattedTotalPending: `₹${((overall.totalPendingAmount || 0) / 100).toLocaleString('en-IN')}`
        },
        thisMonth: {
          totalExpenses: month.totalExpenses || 0,
          totalAmount: (month.totalAmount || 0) / 100,
          formattedAmount: `₹${((month.totalAmount || 0) / 100).toLocaleString('en-IN')}`
        },
        thisWeek: {
          totalExpenses: week.totalExpenses || 0,
          totalAmount: (week.totalAmount || 0) / 100,
          formattedAmount: `₹${((week.totalAmount || 0) / 100).toLocaleString('en-IN')}`
        },
        categoryBreakdown: categoryBreakdown.map(cat => ({
          category: cat._id,
          totalAmount: cat.totalAmount / 100,
          count: cat.count,
          formattedAmount: `₹${(cat.totalAmount / 100).toLocaleString('en-IN')}`
        })),
        recentExpenses: recentExpenses.map(expense => expense.formatForDisplay())
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get vendor-wise expense summary
 * GET /api/expenses/summary/vendors
 */
export const getVendorExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const matchStage = { isActive: true };
    
    if (startDate && endDate) {
      matchStage.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const vendorSummary = await BusinessExpense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$vendor.name',
          vendorCode: { $first: '$vendor.code' },
          totalAmount: { $sum: '$grossAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },
          expenseCount: { $sum: 1 },
          avgExpenseAmount: { $avg: '$grossAmount' }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const formattedSummary = vendorSummary.map(vendor => ({
      vendorName: vendor._id,
      vendorCode: vendor.vendorCode,
      totalAmount: vendor.totalAmount / 100,
      totalPaid: vendor.totalPaid / 100,
      totalPending: vendor.totalPending / 100,
      expenseCount: vendor.expenseCount,
      avgExpenseAmount: vendor.avgExpenseAmount / 100,
      formattedTotalAmount: `₹${(vendor.totalAmount / 100).toLocaleString('en-IN')}`,
      formattedAvgAmount: `₹${(vendor.avgExpenseAmount / 100).toLocaleString('en-IN')}`
    }));

    res.json({
      success: true,
      data: formattedSummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};