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
        itemTotalAmount: Math.round(itemTotalAmount),
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
    const totalAmount = subtotalAmount;

    console.log("Calculated totals - Weight:", totalWeight, "Subtotal:", subtotalAmount, "Total:", totalAmount);

    // Create gold transaction
    const goldTransaction = new GoldTransaction({
      transactionType,
      customer: customer || null,
      supplier: transactionType === "BUY" && !customer ? supplier : null,
      items: processedItems,
      advanceAmount: Math.round(advanceAmount * 100),
      paymentMode,
      notes,
      billNumber,
      marketRates,
      date: new Date(),
      totalWeight: totalWeight,
      subtotalAmount: Math.round(subtotalAmount),
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
          taxAmount: Math.round(parseFloat(item.taxAmount || 0) * 100),
          itemTotalAmount: Math.round((parseFloat(item.weight) * Math.round(parseFloat(item.ratePerGram) * 100)) + 
                                     Math.round(parseFloat(item.makingCharges || 0) * 100) + 
                                     Math.round(parseFloat(item.taxAmount || 0) * 100))
        };
      });

      // Recalculate totals
      const totalWeight = updates.items.reduce((sum, item) => sum + item.weight, 0);
      const subtotalAmount = updates.items.reduce((sum, item) => sum + item.itemTotalAmount, 0);
      updates.totalWeight = totalWeight;
      updates.subtotalAmount = subtotalAmount;
      updates.totalAmount = subtotalAmount;
      updates.remainingAmount = subtotalAmount - (updates.advanceAmount || 0);
      updates.paymentStatus = updates.remainingAmount <= 0 ? "PAID" : (updates.advanceAmount > 0 ? "PARTIAL" : "PENDING");
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
    const analytics = await GoldTransaction.aggregate([
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
          totalAmount: item.totalAmount / 100,
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

    const weeklyData = await GoldTransaction.aggregate([
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
    const transactions = await GoldTransaction.find(matchStage)
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
        formattedAmount: `₹${(p.totalAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        formattedWeight: `${p.totalWeight}g`,
        formattedAvgRate: `₹${(p.avgRate / 100).toFixed(2)}/g`
      })),
      formattedAmount: `₹${(item.overallAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
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
      formattedAmount: `₹${(item.totalAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      formattedWeight: `${item.totalWeight}g`,
      dailyBreakdown: item.dailyBreakdown.map(day => ({
        ...day,
        formattedAmount: `₹${(day.amount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
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
        formattedAmount: `₹${(p.totalAmount / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
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