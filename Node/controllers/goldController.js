// controllers/goldController.js
import GoldTransaction from "../models/GoldTransaction.js";
import Transaction from "../models/Transaction.js";
import MetalPriceService from "../../react/src/services/metalPriceService.js";
import mongoose from "mongoose";

// Create a new gold transaction (buy or sell)
export const createGoldTransaction = async (req, res) => {
  try {
    const {
      transactionType,
      customer,
      supplier,
      items = [],
      advanceAmount = 0,
      paymentMode = "CASH",
      notes,
      billNumber,
      fetchCurrentRates = true
    } = req.body;

    console.log("Received request body:", req.body);

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required"
      });
    }

    // Get current market rates
    let marketRates = null;
    if (fetchCurrentRates) {
      try {
        const priceData = await MetalPriceService.getCurrentPrices();
        marketRates = {
          goldPrice24K: priceData.gold.rates['24K'],
          goldPrice22K: priceData.gold.rates['22K'],
          goldPrice18K: priceData.gold.rates['18K'],
          priceSource: priceData.source,
          fetchedAt: new Date()
        };
      } catch (error) {
        console.warn("Failed to fetch current gold prices:", error.message);
      }
    }

    // Process and validate items
    const processedItems = items.map((item, index) => {
      console.log(`Processing item ${index + 1}:`, item);
      
      if (!item.itemName || !item.purity || !item.weight || !item.ratePerGram) {
        throw new Error(`Item ${index + 1}: Missing required fields - itemName: ${item.itemName}, purity: ${item.purity}, weight: ${item.weight}, ratePerGram: ${item.ratePerGram}`);
      }

      const weight = parseFloat(item.weight);
      const ratePerGram = Math.round(parseFloat(item.ratePerGram) * 100); // Convert to paise
      const makingCharges = Math.round(parseFloat(item.makingCharges || 0) * 100);
      const taxAmount = Math.round(parseFloat(item.taxAmount || 0) * 100);
      
      // Calculate item total amount (all in paise)
      const itemTotalAmount = (weight * ratePerGram) + makingCharges + taxAmount;

      const processedItem = {
        itemName: item.itemName.trim(),
        description: item.description || '',
        purity: item.purity,
        weight: weight,
        ratePerGram: ratePerGram,
        makingCharges: makingCharges,
        wastage: parseFloat(item.wastage || 0),
        taxAmount: taxAmount,
        itemTotalAmount: Math.round(itemTotalAmount), // Add required field
        photos: item.photos || [],
        hallmarkNumber: item.hallmarkNumber || '',
        certificateNumber: item.certificateNumber || ''
      };

      console.log(`Processed item ${index + 1}:`, processedItem);
      return processedItem;
    });

    console.log("All processed items:", processedItems);

    // Calculate totals manually to ensure they exist
    const totalWeight = processedItems.reduce((sum, item) => sum + item.weight, 0);
    const subtotalAmount = processedItems.reduce((sum, item) => sum + item.itemTotalAmount, 0);
    const totalAmount = subtotalAmount; // Assuming no additional charges at transaction level

    console.log("Calculated totals - Weight:", totalWeight, "Subtotal:", subtotalAmount, "Total:", totalAmount);

    // Create gold transaction
    const goldTransaction = new GoldTransaction({
      transactionType,
      customer: customer || null,
      supplier: transactionType === "BUY" && !customer ? supplier : null,
      items: processedItems,
      advanceAmount: Math.round(advanceAmount * 100), // Convert to paise
      paymentMode,
      notes,
      billNumber,
      marketRates,
      date: new Date(),
      // Add calculated totals explicitly
      totalWeight: totalWeight,
      subtotalAmount: Math.round(subtotalAmount), // Add required field
      totalAmount: Math.round(totalAmount)
    });

    console.log("Gold transaction object before save:", {
      transactionType: goldTransaction.transactionType,
      customer: goldTransaction.customer,
      items: goldTransaction.items,
      totalWeight: goldTransaction.totalWeight,
      subtotalAmount: goldTransaction.subtotalAmount,
      totalAmount: goldTransaction.totalAmount
    });

    // Save the gold transaction
    await goldTransaction.save();

    console.log("Gold transaction after save:", {
      _id: goldTransaction._id,
      totalWeight: goldTransaction.totalWeight,
      totalAmount: goldTransaction.totalAmount
    });

    // Create corresponding transaction record
    const transactionDirection = transactionType === "BUY" ? -1 : 1;
    const transactionCategory = transactionType === "BUY" ? "EXPENSE" : "INCOME";
    const transactionTypeEnum = transactionType === "BUY" ? "GOLD_PURCHASE" : "GOLD_SALE";

    const transaction = new Transaction({
      type: transactionTypeEnum,
      customer: customer || null,
      amount: goldTransaction.totalAmount,
      direction: transactionDirection,
      description: `${transactionType === "BUY" ? "Gold Purchase" : "Gold Sale"} - ${goldTransaction.items.length} item(s) - ${goldTransaction.totalWeight}g`,
      category: transactionCategory,
      relatedDoc: goldTransaction._id,
      relatedModel: "GoldTransaction",
      metadata: {
        goldPrice: marketRates?.goldPrice22K || null,
        weightGrams: goldTransaction.totalWeight,
        itemCount: goldTransaction.items.length
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
    console.error("Error stack:", error.stack);
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
    if (purity) query['items.purity'] = purity;
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

    // Process items if provided
    if (updates.items && Array.isArray(updates.items)) {
      updates.items = updates.items.map((item, index) => {
        if (!item.itemName || !item.purity || !item.weight || !item.ratePerGram) {
          throw new Error(`Item ${index + 1}: Missing required fields`);
        }

        return {
          ...item,
          weight: parseFloat(item.weight),
          ratePerGram: Math.round(parseFloat(item.ratePerGram) * 100),
          makingCharges: Math.round(parseFloat(item.makingCharges || 0) * 100),
          wastage: parseFloat(item.wastage || 0),
          taxAmount: Math.round(parseFloat(item.taxAmount || 0) * 100)
        };
      });
    }

    if (updates.advanceAmount) {
      updates.advanceAmount = Math.round(parseFloat(updates.advanceAmount) * 100);
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

// Get current gold prices
export const getCurrentGoldPrices = async (req, res) => {
  try {
    const priceData = await MetalPriceService.getCurrentPrices();
    
    res.json({
      success: true,
      data: priceData.gold,
      timestamp: priceData.timestamp,
      source: priceData.source,
      isFallback: priceData.isFallback || false
    });

  } catch (error) {
    console.error("Error fetching gold prices:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching gold prices",
      error: error.message
    });
  }
};

// Get daily summary with item-level breakdown
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    const summary = await GoldTransaction.getDailySummary(queryDate);
    
    // Transform data for better readability
    const formattedSummary = summary.map(item => ({
      transactionType: item._id,
      overallAmount: item.overallAmount / 100,
      overallWeight: item.overallWeight,
      overallTransactions: item.overallTransactions,
      purities: item.purities.map(p => ({
        purity: p.purity,
        totalAmount: p.totalAmount / 100,
        totalWeight: p.totalWeight,
        avgRate: p.avgRate / 100,
        transactionCount: p.transactionCount,
        formattedAmount: `₹${(p.totalAmount / 100).toFixed(2)}`,
        formattedWeight: `${p.totalWeight}g`,
        formattedAvgRate: `₹${(p.avgRate / 100).toFixed(2)}/g`
      })),
      formattedAmount: `₹${(item.overallAmount / 100).toFixed(2)}`,
      formattedWeight: `${item.overallWeight}g`
    }));

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

// Get monthly summary with item-level breakdown
export const getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const queryYear = year ? parseInt(year) : new Date().getFullYear();
    const queryMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    const summary = await GoldTransaction.getMonthlySummary(queryYear, queryMonth);
    
    // Transform data for better readability
    const formattedSummary = summary.map(item => ({
      type: item._id.type,
      purity: item._id.purity,
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

// Get gold analytics
export const getGoldAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, purity } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    if (purity) matchStage['items.purity'] = purity;

    const analytics = await GoldTransaction.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            type: '$transactionType',
            purity: '$items.purity'
          },
          totalAmount: { $sum: '$items.itemTotalAmount' },
          totalWeight: { $sum: '$items.weight' },
          avgRate: { $avg: '$items.ratePerGram' },
          minRate: { $min: '$items.ratePerGram' },
          maxRate: { $max: '$items.ratePerGram' },
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
