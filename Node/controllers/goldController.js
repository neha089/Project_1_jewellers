// controllers/goldController.js
import GoldTransaction from "../models/GoldTransaction.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

// Create a new gold transaction (buy or sell)
export const createGoldTransaction = async (req, res) => {
  try {
    const {
      transactionType,
      customer,
      supplier,
      goldDetails,
      advanceAmount = 0,
      paymentMode = "CASH",
      items = [],
      notes,
      billNumber
    } = req.body;

    // Calculate total amount
    const baseAmount = goldDetails.weight * goldDetails.ratePerGram;
    const wastageAmount = (baseAmount * (goldDetails.wastage || 0)) / 100;
    const totalAmount = baseAmount + wastageAmount + (goldDetails.makingCharges || 0) + (goldDetails.taxAmount || 0);
    
    const remainingAmount = totalAmount - advanceAmount;
    const paymentStatus = remainingAmount === 0 ? "PAID" : advanceAmount > 0 ? "PARTIAL" : "PENDING";

    // Create gold transaction
    const goldTransaction = new GoldTransaction({
      transactionType,
      customer: customer || null,
      supplier: transactionType === "BUY" && !customer ? supplier : null,
      goldDetails,
      totalAmount: Math.round(totalAmount),
      advanceAmount: Math.round(advanceAmount),
      remainingAmount: Math.round(remainingAmount),
      paymentStatus,
      paymentMode,
      items,
      notes,
      billNumber,
      date: new Date()
    });

    await goldTransaction.save();

    // Create corresponding transaction record
    const transactionDirection = transactionType === "BUY" ? -1 : 1; // -1 for expense (buying), +1 for income (selling)
    const transactionCategory = transactionType === "BUY" ? "EXPENSE" : "INCOME";
    const transactionTypeEnum = transactionType === "BUY" ? "GOLD_PURCHASE" : "GOLD_SALE";

    const transaction = new Transaction({
      type: transactionTypeEnum,
      customer: customer || null,
      amount: Math.round(totalAmount),
      direction: transactionDirection,
      description: `${transactionType === "BUY" ? "Gold Purchase" : "Gold Sale"} - ${goldDetails.purity} - ${goldDetails.weight}g`,
      category: transactionCategory,
      relatedDoc: goldTransaction._id,
      relatedModel: "GoldTransaction",
      metadata: {
        goldPrice: goldDetails.ratePerGram,
        weightGrams: goldDetails.weight,
        itemCount: items.length || 1
      }
    });

    await transaction.save();

    // Update gold transaction with transaction reference
    goldTransaction.transactionRef = transaction._id;
    await goldTransaction.save();

    // Populate customer data for response
    await goldTransaction.populate('customer', 'name phone email address');

    res.status(201).json({
      success: true,
      message: `Gold ${transactionType.toLowerCase()} transaction created successfully`,
      data: goldTransaction.formatForDisplay(),
      transactionRef: transaction._id
    });

  } catch (error) {
    console.error("Error creating gold transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error creating gold transaction",
      error: error.message
    });
  }
};

// Get all gold transactions with filters
export const getGoldTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      transactionType,
      customer,
      startDate,
      endDate,
      purity,
      paymentStatus,
      sortBy = "date",
      sortOrder = "desc"
    } = req.query;

    // Build query
    const query = {};
    
    if (transactionType) query.transactionType = transactionType;
    if (customer) query.customer = customer;
    if (purity) query['goldDetails.purity'] = purity;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, totalCount] = await Promise.all([
      GoldTransaction.find(query)
        .populate('customer', 'name phone email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      GoldTransaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: transactions.map(t => t.formatForDisplay()),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Error fetching gold transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching gold transactions",
      error: error.message
    });
  }
};

// Get single gold transaction by ID
export const getGoldTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await GoldTransaction.findById(id)
      .populate('customer', 'name phone email address')
      .populate('transactionRef');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Gold transaction not found"
      });
    }

    res.json({
      success: true,
      data: transaction.formatForDisplay()
    });

  } catch (error) {
    console.error("Error fetching gold transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching gold transaction",
      error: error.message
    });
  }
};

// Update gold transaction
export const updateGoldTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    // Recalculate amounts if gold details are updated
    if (updates.goldDetails) {
      const baseAmount = updates.goldDetails.weight * updates.goldDetails.ratePerGram;
      const wastageAmount = (baseAmount * (updates.goldDetails.wastage || 0)) / 100;
      const totalAmount = baseAmount + wastageAmount + (updates.goldDetails.makingCharges || 0) + (updates.goldDetails.taxAmount || 0);
      
      updates.totalAmount = Math.round(totalAmount);
      updates.remainingAmount = updates.totalAmount - (updates.advanceAmount || 0);
      updates.paymentStatus = updates.remainingAmount === 0 ? "PAID" : updates.advanceAmount > 0 ? "PARTIAL" : "PENDING";
    }

    const transaction = await GoldTransaction.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    ).populate('customer', 'name phone email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Gold transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Gold transaction updated successfully",
      data: transaction.formatForDisplay()
    });

  } catch (error) {
    console.error("Error updating gold transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error updating gold transaction",
      error: error.message
    });
  }
};

// Delete gold transaction
export const deleteGoldTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await GoldTransaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Gold transaction not found"
      });
    }

    // Delete related transaction record
    if (transaction.transactionRef) {
      await Transaction.findByIdAndDelete(transaction.transactionRef);
    }

    await GoldTransaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Gold transaction deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting gold transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting gold transaction",
      error: error.message
    });
  }
};

// Get daily summary
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    const summary = await GoldTransaction.getDailySummary(queryDate);
    
    // Transform data for better readability
    const formattedSummary = summary.reduce((acc, item) => {
      acc[item._id] = {
        totalAmount: item.totalAmount / 100,
        totalWeight: item.totalWeight,
        transactionCount: item.transactionCount,
        avgRate: item.avgRate / 100,
        formattedAmount: `₹${(item.totalAmount / 100).toFixed(2)}`,
        formattedWeight: `${item.totalWeight}g`,
        formattedAvgRate: `₹${(item.avgRate / 100).toFixed(2)}/g`
      };
      return acc;
    }, {});

    res.json({
      success: true,
      date: queryDate.toLocaleDateString('en-IN'),
      summary: formattedSummary
    });

  } catch (error) {
    console.error("Error fetching daily summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching daily summary",
      error: error.message
    });
  }
};

// Get monthly summary
export const getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const queryYear = year ? parseInt(year) : new Date().getFullYear();
    const queryMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    const summary = await GoldTransaction.getMonthlySummary(queryYear, queryMonth);
    
    // Transform data for better readability
    const formattedSummary = summary.map(item => ({
      type: item._id,
      totalAmount: item.totalAmount / 100,
      totalWeight: item.totalWeight,
      totalTransactions: item.totalTransactions,
      formattedAmount: `₹${(item.totalAmount / 100).toFixed(2)}`,
      formattedWeight: `${item.totalWeight}g`,
      dailyBreakdown: item.dailyBreakdown.map(day => ({
        ...day,
        formattedAmount: `₹${(day.amount / 100).toFixed(2)}`,
        formattedWeight: `${day.weight}g`
      }))
    }));

    res.json({
      success: true,
      period: `${queryMonth}/${queryYear}`,
      summary: formattedSummary
    });

  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching monthly summary",
      error: error.message
    });
  }
};

// Get gold rates and analytics
export const getGoldAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, purity } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    if (purity) matchStage['goldDetails.purity'] = purity;

    const analytics = await GoldTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            type: '$transactionType',
            purity: '$goldDetails.purity'
          },
          totalAmount: { $sum: '$totalAmount' },
          totalWeight: { $sum: '$goldDetails.weight' },
          avgRate: { $avg: '$goldDetails.ratePerGram' },
          minRate: { $min: '$goldDetails.ratePerGram' },
          maxRate: { $max: '$goldDetails.ratePerGram' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.type',
          purities: {
            $push: {
              purity: '$_id.purity',
              totalAmount: '$totalAmount',
              totalWeight: '$totalWeight',
              avgRate: '$avgRate',
              minRate: '$minRate',
              maxRate: '$maxRate',
              transactionCount: '$transactionCount'
            }
          },
          overallAmount: { $sum: '$totalAmount' },
          overallWeight: { $sum: '$totalWeight' },
          overallTransactions: { $sum: '$transactionCount' }
        }
      }
    ]);

    const formattedAnalytics = analytics.map(item => ({
      transactionType: item._id,
      overallAmount: item.overallAmount / 100,
      overallWeight: item.overallWeight,
      overallTransactions: item.overallTransactions,
      purities: item.purities.map(p => ({
        ...p,
        totalAmount: p.totalAmount / 100,
        avgRate: p.avgRate / 100,
        minRate: p.minRate / 100,
        maxRate: p.maxRate / 100,
        formattedAmount: `₹${(p.totalAmount / 100).toFixed(2)}`,
        formattedWeight: `${p.totalWeight}g`,
        formattedAvgRate: `₹${(p.avgRate / 100).toFixed(2)}/g`
      }))
    }));

    res.json({
      success: true,
      analytics: formattedAnalytics
    });

  } catch (error) {
    console.error("Error fetching gold analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching gold analytics",
      error: error.message
    });
  }
};