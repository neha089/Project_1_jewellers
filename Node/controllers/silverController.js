// controllers/silverController.js
import SilverTransaction from "../models/SilverTransaction.js";
import Transaction from "../models/Transaction.js";
import MetalPriceService from "../../react/src/services/metalPriceService.js";
import mongoose from "mongoose";
 // Assuming this service exists for fetching prices

export const createSilverTransaction = async (req, res) => {
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
          silverPrice99: priceData.silver.rates['999'], // Adjust for silver
          silverPrice92: priceData.silver.rates['925'],
          silverPrice80: priceData.silver.rates['800'],
          priceSource: priceData.source,
          fetchedAt: new Date()
        };
      } catch (error) {
        console.warn("Failed to fetch current silver prices:", error.message);
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

    // Create silver transaction
    const silverTransaction = new SilverTransaction({
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

    console.log("Silver transaction object before save:", {
      transactionType: silverTransaction.transactionType,
      customer: silverTransaction.customer,
      items: silverTransaction.items,
      totalWeight: silverTransaction.totalWeight,
      subtotalAmount: silverTransaction.subtotalAmount,
      totalAmount: silverTransaction.totalAmount
    });

    // Save the silver transaction
    await silverTransaction.save();

    console.log("Silver transaction after save:", {
      _id: silverTransaction._id,
      totalWeight: silverTransaction.totalWeight,
      totalAmount: silverTransaction.totalAmount
    });

    // Create corresponding transaction record
    const transactionDirection = transactionType === "BUY" ? -1 : 1;
    const transactionCategory = transactionType === "BUY" ? "EXPENSE" : "INCOME";
    const transactionTypeEnum = transactionType === "BUY" ? "SILVER_PURCHASE" : "SILVER_SALE";

    const transaction = new Transaction({
      type: transactionTypeEnum,
      customer: customer || null,
      amount: silverTransaction.totalAmount,
      direction: transactionDirection,
      description: `${transactionType === "BUY" ? "Silver Purchase" : "Silver Sale"} - ${silverTransaction.items.length} item(s) - ${silverTransaction.totalWeight}g`,
      category: transactionCategory,
      relatedDoc: silverTransaction._id,
      relatedModel: "SilverTransaction",
      metadata: {
        silverPrice: marketRates?.silverPrice92 || null,
        weightGrams: silverTransaction.totalWeight,
        itemCount: silverTransaction.items.length
      }
    });

    await transaction.save();

    // Update silver transaction with transaction reference
    silverTransaction.transactionRef = transaction._id;
    await silverTransaction.save();

    // Populate customer data for response
    await silverTransaction.populate('customer', 'name phone email address');

    res.status(201).json({
      success: true,
      message: `Silver ${transactionType.toLowerCase()} transaction created successfully`,
      data: silverTransaction.formatForDisplay(),
      transactionRef: transaction._id
    });

  } catch (error) {
    console.error("Error creating silver transaction:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Error creating silver transaction",
      error: error.message
    });
  }
};

// Get all silver transactions with filters
export const getSilverTransactions = async (req, res) => {
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
    if (purity) query['silverDetails.purity'] = purity;
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
      SilverTransaction.find(query)
        .populate('customer', 'name phone email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      SilverTransaction.countDocuments(query)
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
    console.error("Error fetching silver transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching silver transactions",
      error: error.message
    });
  }
};

// Get single silver transaction by ID
export const getSilverTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await SilverTransaction.findById(id)
      .populate('customer', 'name phone email address')
      .populate('transactionRef');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Silver transaction not found"
      });
    }

    res.json({
      success: true,
      data: transaction.formatForDisplay()
    });

  } catch (error) {
    console.error("Error fetching silver transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching silver transaction",
      error: error.message
    });
  }
};

// Update silver transaction
export const updateSilverTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    // Recalculate amounts if silver details are updated
    if (updates.silverDetails) {
      const baseAmount = updates.silverDetails.weight * updates.silverDetails.ratePerGram;
      const wastageAmount = (baseAmount * (updates.silverDetails.wastage || 0)) / 100;
      const totalAmount = baseAmount + wastageAmount + (updates.silverDetails.makingCharges || 0) + (updates.silverDetails.taxAmount || 0);
      
      updates.totalAmount = Math.round(totalAmount);
      updates.remainingAmount = updates.totalAmount - (updates.advanceAmount || 0);
      updates.paymentStatus = updates.remainingAmount === 0 ? "PAID" : updates.advanceAmount > 0 ? "PARTIAL" : "PENDING";
    }

    const transaction = await SilverTransaction.findByIdAndUpdate(
      id,
      { ...updates, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    ).populate('customer', 'name phone email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Silver transaction not found"
      });
    }

    res.json({
      success: true,
      message: "Silver transaction updated successfully",
      data: transaction.formatForDisplay()
    });

  } catch (error) {
    console.error("Error updating silver transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error updating silver transaction",
      error: error.message
    });
  }
};

// Delete silver transaction
export const deleteSilverTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID"
      });
    }

    const transaction = await SilverTransaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Silver transaction not found"
      });
    }

    // Delete related transaction record
    if (transaction.transactionRef) {
      await Transaction.findByIdAndDelete(transaction.transactionRef);
    }

    await SilverTransaction.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Silver transaction deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting silver transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting silver transaction",
      error: error.message
    });
  }
};

// Get daily summary
export const getDailySummary = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    const summary = await SilverTransaction.getDailySummary(queryDate);
    
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
    
    const summary = await SilverTransaction.getMonthlySummary(queryYear, queryMonth);
    
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

// Get silver rates and analytics
export const getSilverAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, purity } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    if (purity) matchStage['silverDetails.purity'] = purity;

    const analytics = await SilverTransaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            type: '$transactionType',
            purity: '$silverDetails.purity'
          },
          totalAmount: { $sum: '$totalAmount' },
          totalWeight: { $sum: '$silverDetails.weight' },
          avgRate: { $avg: '$silverDetails.ratePerGram' },
          minRate: { $min: '$silverDetails.ratePerGram' },
          maxRate: { $max: '$silverDetails.ratePerGram' },
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
    console.error("Error fetching silver analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching silver analytics",
      error: error.message
    });
  }
};
