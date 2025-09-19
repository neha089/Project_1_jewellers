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
      updates.paymentStatus = "PAID" ;
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

// controllers/silverController.js - Enhanced Analytics Functions

// Get comprehensive daily analytics
export const getDailyAnalytics = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    
    // Set start and end of day for precise filtering
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log("Fetching analytics for:", startOfDay, "to", endOfDay);

    // Aggregate daily transactions
    const analytics = await SilverTransaction.aggregate([
      {
        $match: {
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: '$transactionType',
          totalAmount: { $sum: '$totalAmount' },
          totalWeight: { $sum: '$totalWeight' },
          transactionCount: { $sum: 1 },
          avgRate: { $avg: { $divide: ['$subtotalAmount', '$totalWeight'] } },
          items: { $sum: { $size: '$items' } },
          // Group by purity for detailed breakdown
          purityBreakdown: {
            $push: {
              $map: {
                input: '$items',
                as: 'item',
                in: {
                  purity: '$$item.purity',
                  weight: '$$item.weight',
                  amount: '$$item.itemTotalAmount'
                }
              }
            }
          }
        }
      }
    ]);

    // Process the data for better structure
    const processedData = {
      date: queryDate.toISOString().split('T')[0],
      buy: {
        totalAmount: 0,
        totalWeight: 0,
        transactionCount: 0,
        avgRate: 0,
        totalItems: 0,
        purities: {}
      },
      sell: {
        totalAmount: 0,
        totalWeight: 0,
        transactionCount: 0,
        avgRate: 0,
        totalItems: 0,
        purities: {}
      }
    };

    // Process analytics data
    analytics.forEach(item => {
      const type = item._id.toLowerCase();
      if (processedData[type]) {
        processedData[type] = {
          totalAmount: item.totalAmount / 100, // Convert from paise to rupees
          totalWeight: item.totalWeight,
          transactionCount: item.transactionCount,
          avgRate: (item.avgRate || 0) / 100,
          totalItems: item.items,
          formattedAmount: `₹${(item.totalAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          formattedWeight: `${item.totalWeight}g`,
          formattedAvgRate: `₹${((item.avgRate || 0) / 100).toFixed(2)}/g`
        };

        // Process purity breakdown
        const purityMap = {};
        item.purityBreakdown.flat().forEach(purityItem => {
          if (!purityMap[purityItem.purity]) {
            purityMap[purityItem.purity] = {
              weight: 0,
              amount: 0,
              count: 0
            };
          }
          purityMap[purityItem.purity].weight += purityItem.weight;
          purityMap[purityItem.purity].amount += purityItem.amount;
          purityMap[purityItem.purity].count += 1;
        });

        // Format purity data
        processedData[type].purities = Object.keys(purityMap).reduce((acc, purity) => {
          const data = purityMap[purity];
          acc[purity] = {
            weight: data.weight,
            amount: data.amount / 100,
            count: data.count,
            avgRate: data.weight > 0 ? (data.amount / data.weight) / 100 : 0,
            formattedAmount: `₹${(data.amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
            formattedWeight: `${data.weight}g`,
            formattedAvgRate: `₹${(data.weight > 0 ? (data.amount / data.weight) / 100 : 0).toFixed(2)}/g`
          };
          return acc;
        }, {});
      }
    });

    // Calculate net metrics
    const netMetrics = {
      netAmount: processedData.sell.totalAmount - processedData.buy.totalAmount,
      netWeight: processedData.sell.totalWeight - processedData.buy.totalWeight,
      netTransactions: processedData.sell.transactionCount - processedData.buy.transactionCount,
      grossProfit: processedData.sell.totalAmount - processedData.buy.totalAmount,
      profitMargin: processedData.buy.totalAmount > 0 
        ? ((processedData.sell.totalAmount - processedData.buy.totalAmount) / processedData.buy.totalAmount * 100)
        : 0,
      totalBusinessVolume: processedData.sell.totalAmount + processedData.buy.totalAmount
    };

    // Format net metrics
    netMetrics.formattedNetAmount = `₹${netMetrics.netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    netMetrics.formattedNetWeight = `${netMetrics.netWeight}g`;
    netMetrics.formattedGrossProfit = `₹${netMetrics.grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    netMetrics.formattedProfitMargin = `${netMetrics.profitMargin.toFixed(2)}%`;
    netMetrics.formattedTotalVolume = `₹${netMetrics.totalBusinessVolume.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

    res.json({
      success: true,
      data: {
        ...processedData,
        netMetrics,
        summary: {
          totalTransactions: processedData.buy.transactionCount + processedData.sell.transactionCount,
          totalItems: processedData.buy.totalItems + processedData.sell.totalItems,
          totalWeight: processedData.buy.totalWeight + processedData.sell.totalWeight,
          totalVolume: processedData.buy.totalAmount + processedData.sell.totalAmount,
          formattedTotalWeight: `${processedData.buy.totalWeight + processedData.sell.totalWeight}g`,
          formattedTotalVolume: `₹${(processedData.buy.totalAmount + processedData.sell.totalAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        }
      }
    });

  } catch (error) {
    console.error("Error fetching daily analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching daily analytics",
      error: error.message
    });
  }
};

// Get weekly analytics
export const getWeeklyAnalytics = async (req, res) => {
  try {
    const { startDate } = req.query;
    const weekStart = startDate ? new Date(startDate) : new Date();
    
    // Get start of week (Monday)
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weeklyData = await SilverTransaction.aggregate([
      {
        $match: {
          date: {
            $gte: weekStart,
            $lte: weekEnd
          }
        }
      },
      {
        $group: {
          _id: {
            type: '$transactionType',
            day: { $dayOfWeek: '$date' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          totalAmount: { $sum: '$totalAmount' },
          totalWeight: { $sum: '$totalWeight' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.day': 1 }
      }
    ]);

    // Process weekly data
    const weeklyAnalytics = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach((day, index) => {
      weeklyAnalytics[day] = {
        buy: { totalAmount: 0, totalWeight: 0, transactionCount: 0 },
        sell: { totalAmount: 0, totalWeight: 0, transactionCount: 0 },
        netProfit: 0
      };
    });

    weeklyData.forEach(item => {
      const dayIndex = item._id.day === 1 ? 6 : item._id.day - 2; // Convert to 0-based Monday start
      const dayName = days[dayIndex];
      const type = item._id.type.toLowerCase();
      
      if (weeklyAnalytics[dayName] && weeklyAnalytics[dayName][type]) {
        weeklyAnalytics[dayName][type] = {
          totalAmount: item.totalAmount / 100,
          totalWeight: item.totalWeight,
          transactionCount: item.transactionCount,
          formattedAmount: `₹${(item.totalAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
        };
      }
    });

    // Calculate net profit for each day
    Object.keys(weeklyAnalytics).forEach(day => {
      const dayData = weeklyAnalytics[day];
      dayData.netProfit = dayData.sell.totalAmount - dayData.buy.totalAmount;
      dayData.formattedNetProfit = `₹${dayData.netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    });

    res.json({
      success: true,
      period: `${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`,
      data: weeklyAnalytics
    });

  } catch (error) {
    console.error("Error fetching weekly analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching weekly analytics",
      error: error.message
    });
  }
};

// Get profit/loss analysis
export const getProfitLossAnalysis = async (req, res) => {
  try {
    const { startDate, endDate, purity } = req.query;
    
    const matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    // Get all transactions for P&L analysis
    const transactions = await SilverTransaction.find(matchStage)
      .populate('customer', 'name')
      .sort({ date: -1 });

    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    let totalBuyWeight = 0;
    let totalSellWeight = 0;
    let buyTransactions = 0;
    let sellTransactions = 0;

    const customerAnalysis = {};
    const purityAnalysis = {};

    transactions.forEach(transaction => {
      const amount = transaction.totalAmount / 100;
      const weight = transaction.totalWeight;

      if (transaction.transactionType === 'BUY') {
        totalBuyAmount += amount;
        totalBuyWeight += weight;
        buyTransactions++;
      } else {
        totalSellAmount += amount;
        totalSellWeight += weight;
        sellTransactions++;
      }

      // Customer analysis
      const customerName = transaction.customer?.name || 'Walk-in Customer';
      if (!customerAnalysis[customerName]) {
        customerAnalysis[customerName] = {
          buyAmount: 0, sellAmount: 0, buyWeight: 0, sellWeight: 0,
          buyCount: 0, sellCount: 0
        };
      }

      if (transaction.transactionType === 'BUY') {
        customerAnalysis[customerName].buyAmount += amount;
        customerAnalysis[customerName].buyWeight += weight;
        customerAnalysis[customerName].buyCount++;
      } else {
        customerAnalysis[customerName].sellAmount += amount;
        customerAnalysis[customerName].sellWeight += weight;
        customerAnalysis[customerName].sellCount++;
      }

      // Purity analysis
      transaction.items.forEach(item => {
        if (!purityAnalysis[item.purity]) {
          purityAnalysis[item.purity] = {
            buyAmount: 0, sellAmount: 0, buyWeight: 0, sellWeight: 0,
            buyCount: 0, sellCount: 0
          };
        }

        const itemAmount = item.itemTotalAmount / 100;
        if (transaction.transactionType === 'BUY') {
          purityAnalysis[item.purity].buyAmount += itemAmount;
          purityAnalysis[item.purity].buyWeight += item.weight;
          purityAnalysis[item.purity].buyCount++;
        } else {
          purityAnalysis[item.purity].sellAmount += itemAmount;
          purityAnalysis[item.purity].sellWeight += item.weight;
          purityAnalysis[item.purity].sellCount++;
        }
      });
    });

    // Calculate metrics
    const grossProfit = totalSellAmount - totalBuyAmount;
    const profitMargin = totalBuyAmount > 0 ? (grossProfit / totalBuyAmount) * 100 : 0;
    const avgBuyRate = totalBuyWeight > 0 ? totalBuyAmount / totalBuyWeight : 0;
    const avgSellRate = totalSellWeight > 0 ? totalSellAmount / totalSellWeight : 0;
    const rateSpread = avgSellRate - avgBuyRate;

    // Format customer analysis
    const formattedCustomerAnalysis = Object.keys(customerAnalysis).map(customer => {
      const data = customerAnalysis[customer];
      const netAmount = data.sellAmount - data.buyAmount;
      return {
        customer,
        ...data,
        netAmount,
        formattedBuyAmount: `₹${data.buyAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        formattedSellAmount: `₹${data.sellAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        formattedNetAmount: `₹${netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
      };
    }).sort((a, b) => b.netAmount - a.netAmount);

    // Format purity analysis
    const formattedPurityAnalysis = Object.keys(purityAnalysis).map(purity => {
      const data = purityAnalysis[purity];
      const netAmount = data.sellAmount - data.buyAmount;
      const avgBuyRate = data.buyWeight > 0 ? data.buyAmount / data.buyWeight : 0;
      const avgSellRate = data.sellWeight > 0 ? data.sellAmount / data.sellWeight : 0;
      return {
        purity,
        ...data,
        netAmount,
        avgBuyRate,
        avgSellRate,
        rateSpread: avgSellRate - avgBuyRate,
        formattedNetAmount: `₹${netAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        formattedAvgBuyRate: `₹${avgBuyRate.toFixed(2)}/g`,
        formattedAvgSellRate: `₹${avgSellRate.toFixed(2)}/g`
      };
    }).sort((a, b) => b.netAmount - a.netAmount);

    res.json({
      success: true,
      data: {
        overview: {
          totalBuyAmount,
          totalSellAmount,
          totalBuyWeight,
          totalSellWeight,
          buyTransactions,
          sellTransactions,
          grossProfit,
          profitMargin,
          avgBuyRate,
          avgSellRate,
          rateSpread,
          formattedTotalBuy: `₹${totalBuyAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          formattedTotalSell: `₹${totalSellAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          formattedGrossProfit: `₹${grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
          formattedProfitMargin: `${profitMargin.toFixed(2)}%`,
          formattedAvgBuyRate: `₹${avgBuyRate.toFixed(2)}/g`,
          formattedAvgSellRate: `₹${avgSellRate.toFixed(2)}/g`
        },
        customerAnalysis: formattedCustomerAnalysis,
        purityAnalysis: formattedPurityAnalysis
      }
    });

  } catch (error) {
    console.error("Error fetching P&L analysis:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching profit/loss analysis",
      error: error.message
    });
  }
};