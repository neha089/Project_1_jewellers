import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import SilverLoan from '../models/SilverLoan.js';
import InterestPayment from '../models/InterestPayment.js';
import Repayment from '../models/Repayment.js';
import Customer from '../models/Customer.js';

// Create new silver loan with manual amounts and enhanced validation
export const createSilverLoan = async (req, res) => {
  try {
    const { customer, items, interestRateMonthlyPct, startDate, notes } = req.body;

    if (!customer) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required for silver loan' });
    }

    // Validate and process items
    const processedItems = [];
    let totalPrincipal = 0;

    for (const item of items) {
      if (!item.weightGram || !item.purityK || !item.loanAmount) {
        return res.status(400).json({
          success: false,
          error: `Item ${item.name || 'Unknown'} is missing weight, purity, or loan amount`
        });
      }

      const processedItem = {
        name: item.name || 'Silver Item',
        weightGram: parseFloat(item.weightGram),
        loanAmount: parseFloat(item.loanAmount), // Direct amount in rupees
        purityK: parseInt(item.purityK),
        images: item.images || [],
        silverPriceAtDeposit: parseFloat(item.silverPriceAtDeposit) || 0,
        addedDate: new Date()
      };

      processedItems.push(processedItem);
      totalPrincipal += processedItem.loanAmount;
    }

    const silverLoan = new SilverLoan({
      customer,
      items: processedItems,
      interestRateMonthlyPct: parseFloat(interestRateMonthlyPct),
      totalLoanAmount: totalPrincipal,
      currentLoanAmount: totalPrincipal, // Track remaining loan amount
      startDate: startDate || new Date(),
      status: 'ACTIVE',
      notes
    });

    await silverLoan.save();

    // Create transaction record for loan disbursement
    const transaction = new Transaction({
      type: 'SILVER_LOAN_GIVEN',
      customer: silverLoan.customer,
      amount: totalPrincipal,
      direction: 1, // outgoing
      description: `Silver loan disbursed - ${silverLoan.items.length} items - ₹${totalPrincipal}`,
      relatedDoc: silverLoan._id,
      relatedModel: 'SilverLoan',
      category: 'EXPENSE',
      metadata: {
        itemCount: processedItems.length,
        totalWeight: processedItems.reduce((sum, item) => sum + item.weightGram, 0),
        paymentType: 'DISBURSEMENT'
      },
      affectedItems: processedItems.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        value: item.loanAmount,
        action: 'ADDED'
      }))
    });
    await transaction.save();

    res.status(201).json({
      success: true,
      data: silverLoan,
      message: `Silver loan created successfully. Total amount: ₹${totalPrincipal}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get repayment statistics for a loan
export const getRepaymentStats = async (req, res) => {
  try {
    const silverLoanId = req.params.id;
    const { timeframe = '1year' } = req.query;

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '1month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6months':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2000); // Set to a very early date
        break;
      default:
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const stats = await Repayment.aggregate([
      {
        $match: {
          silverLoan: new mongoose.Types.ObjectId(silverLoanId),
          repaymentDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$repaymentAmount' },
          totalItemsReturned: { $sum: '$totalItemsReturned' },
          totalWeightReturned: { $sum: '$totalWeightReturned' },
          totalInterestPaid: { $sum: '$interestPaidWithRepayment' },
          totalProcessingFees: { $sum: '$processingFee' },
          totalLateFees: { $sum: '$lateFee' },
          totalAdjustments: { $sum: '$adjustmentAmount' },
          averageRepaymentAmount: { $avg: '$repaymentAmount' },
          largestRepayment: { $max: '$repaymentAmount' },
          smallestRepayment: { $min: '$repaymentAmount' },
          repaymentMethods: {
            $push: '$paymentMethod'
          },
          repaymentTypes: {
            $push: '$repaymentType'
          },
          monthlyTotals: {
            $push: {
              month: { $month: '$repaymentDate' },
              year: { $year: '$repaymentDate' },
              amount: '$repaymentAmount'
            }
          }
        }
      }
    ]);

    // Process payment method distribution
    const methodDistribution = {};
    if (stats.length > 0) {
      stats[0].repaymentMethods.forEach(method => {
        methodDistribution[method] = (methodDistribution[method] || 0) + 1;
      });
    }

    // Process repayment type distribution
    const typeDistribution = {};
    if (stats.length > 0) {
      stats[0].repaymentTypes.forEach(type => {
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        timeframe,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        statistics: stats.length > 0 ? {
          ...stats[0],
          methodDistribution,
          typeDistribution
        } : {
          totalTransactions: 0,
          totalAmount: 0,
          totalItemsReturned: 0,
          totalWeightReturned: 0,
          totalInterestPaid: 0,
          methodDistribution: {},
          typeDistribution: {}
        }
      }
    });
  } catch (error) {
    console.error('Get repayment stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch repayment statistics'
    });
  }
};

// Validate repayment data before processing
export const validateRepayment = async (req, res) => {
  try {
    const silverLoanId = req.params.id;
    const repaymentData = req.body;

    const silverLoan = await SilverLoan.findById(silverLoanId).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({
        success: false,
        error: 'Silver loan not found'
      });
    }

    // Validation logic
    const validations = [];

    // Check if loan is active
    if (silverLoan.status !== 'ACTIVE') {
      validations.push({
        field: 'loanStatus',
        message: 'Loan is not active',
        severity: 'error'
      });
    }

    // Check selected items
    if (repaymentData.selectedItemIds && repaymentData.selectedItemIds.length > 0) {
      const availableItems = silverLoan.items.filter(item => !item.returnDate);
      const invalidItems = repaymentData.selectedItemIds.filter(itemId =>
        !availableItems.some(item => item._id.toString() === itemId)
      );

      if (invalidItems.length > 0) {
        validations.push({
          field: 'selectedItemIds',
          message: `Some selected items are not available for return`,
          severity: 'error'
        });
      }
    }

    // Check repayment amount
    if (repaymentData.repaymentAmount) {
      const amount = parseFloat(repaymentData.repaymentAmount);
      if (amount <= 0) {
        validations.push({
          field: 'repaymentAmount',
          message: 'Repayment amount must be greater than 0',
          severity: 'error'
        });
      }

      if (amount > silverLoan.currentLoanAmount) {
        validations.push({
          field: 'repaymentAmount',
          message: 'Repayment amount cannot exceed outstanding loan amount',
          severity: 'warning'
        });
      }
    }

    // Check silver price
    if (repaymentData.currentSilverPrice) {
      const silverPrice = parseFloat(repaymentData.currentSilverPrice);
      if (silverPrice <= 0 || silverPrice > 10000) {
        validations.push({
          field: 'currentSilverPrice',
          message: 'Silver price seems unrealistic',
          severity: 'warning'
        });
      }
    }

    // Check payment method specific validations
    if (repaymentData.paymentMethod === 'CHEQUE') {
      if (!repaymentData.chequeNumber) {
        validations.push({
          field: 'chequeNumber',
          message: 'Cheque number is required for cheque payments',
          severity: 'error'
        });
      }
      if (!repaymentData.bankName) {
        validations.push({
          field: 'bankName',
          message: 'Bank name is required for cheque payments',
          severity: 'error'
        });
      }
    }

    const hasErrors = validations.some(v => v.severity === 'error');

    res.json({
      success: true,
      data: {
        isValid: !hasErrors,
        validations,
        loan: {
          id: silverLoan._id,
          status: silverLoan.status,
          currentAmount: silverLoan.currentLoanAmount,
          availableItems: silverLoan.items.filter(item => !item.returnDate).length
        }
      }
    });
  } catch (error) {
    console.error('Validate repayment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get repayment details by ID
export const getRepaymentDetails = async (req, res) => {
  try {
    const repaymentId = req.params.repaymentId;

    const repayment = await Repayment.findById(repaymentId)
      .populate('silverLoan', 'startDate totalLoanAmount interestRateMonthlyPct')
      .populate('customer', 'name phone email');

    if (!repayment) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    res.json({
      success: true,
      data: repayment
    });
  } catch (error) {
    console.error('Get repayment details error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get repayment receipt data
export const getRepaymentReceipt = async (req, res) => {
  try {
    const repaymentId = req.params.repaymentId;

    const repayment = await Repayment.findById(repaymentId)
      .populate('silverLoan')
      .populate('customer');

    if (!repayment) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    // Generate receipt data
    const receiptData = {
      receiptNumber: repayment.receiptNumber,
      repaymentDate: repayment.repaymentDate,
      customer: repayment.customer,
      loan: {
        id: repayment.silverLoan._id,
        startDate: repayment.silverLoan.startDate,
        interestRate: repayment.silverLoan.interestRateMonthlyPct
      },
      repaymentDetails: {
        amount: repayment.repaymentAmount,
        paymentMethod: repayment.paymentMethod,
        repaymentType: repayment.repaymentType,
        referenceNumber: repayment.referenceNumber,
        chequeNumber: repayment.chequeNumber,
        bankName: repayment.bankName
      },
      returnedItems: repayment.returnedItems,
      calculations: {
        loanAmountBefore: repayment.loanAmountBeforeRepayment,
        loanAmountAfter: repayment.loanAmountAfterRepayment,
        processingFee: repayment.processingFee,
        lateFee: repayment.lateFee,
        adjustmentAmount: repayment.adjustmentAmount,
        netAmount: repayment.repaymentAmount - repayment.processingFee - repayment.lateFee + repayment.adjustmentAmount
      },
      notes: repayment.notes,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: receiptData
    });
  } catch (error) {
    console.error('Get repayment receipt error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search all repayments across loans
export const searchAllRepayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customerName,
      receiptNumber,
      paymentMethod,
      repaymentType,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;

    // Build search filter
    const filter = {};

    if (receiptNumber) {
      filter.receiptNumber = { $regex: receiptNumber, $options: 'i' };
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (repaymentType) {
      filter.repaymentType = repaymentType;
    }

    if (startDate || endDate) {
      filter.repaymentDate = {};
      if (startDate) filter.repaymentDate.$gte = new Date(startDate);
      if (endDate) filter.repaymentDate.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.repaymentAmount = {};
      if (minAmount) filter.repaymentAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.repaymentAmount.$lte = parseFloat(maxAmount);
    }

    // If searching by customer name, first find matching customers
    if (customerName) {
      const customers = await Customer.find({
        name: { $regex: customerName, $options: 'i' }
      }).select('_id');

      filter.customer = { $in: customers.map(c => c._id) };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [repayments, totalCount] = await Promise.all([
      Repayment.find(filter)
        .populate('customer', 'name phone email')
        .populate('silverLoan', '_id totalLoanAmount')
        .sort({ repaymentDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Repayment.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: repayments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Search repayments error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Cancel a repayment (with reversal logic if needed)
export const cancelRepayment = async (req, res) => {
  try {
    const repaymentId = req.params.repaymentId;
    const { reason } = req.body;

    const repayment = await Repayment.findById(repaymentId);
    if (!repayment) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    if (repayment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Repayment is already cancelled'
      });
    }

    // Update repayment status
    repayment.status = 'CANCELLED';
    repayment.notes = (repayment.notes || '') + `\n\nCANCELLED: ${reason} (${new Date().toISOString()})`;
    await repayment.save();

    // TODO: Add reversal logic if needed (e.g., update silverLoan.currentLoanAmount, item returnDate, etc.)
    // This would require careful implementation to avoid data inconsistencies

    res.json({
      success: true,
      data: repayment,
      message: 'Repayment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel repayment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get current silver price (mock or integrate with API)
export const getCurrentSilverPrice = async (req, res) => {
  try {
    // TODO: Integrate with real silver price API if needed
    const currentPrice = {
      pricePerGram: 80, // Example value; replace with real data
      lastUpdated: new Date().toISOString(),
      source: 'internal',
      currency: 'INR'
    };

    res.json({
      success: true,
      data: currentPrice
    });
  } catch (error) {
    console.error('Get silver price error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get dashboard statistics for silver loans
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await SilverLoan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalLoanAmount: { $sum: '$totalLoanAmount' },
          currentLoanAmount: { $sum: '$currentLoanAmount' },
          totalInterestReceived: {
            $sum: {
              $reduce: {
                input: '$payments',
                initialValue: 0,
                in: { $add: ['$$value', { $ifNull: ['$$this.interestAmount', 0] }] }
              }
            }
          }
        }
      }
    ]);

    const recentPayments = await SilverLoan.aggregate([
      { $unwind: '$payments' },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      {
        $project: {
          customer: { $arrayElemAt: ['$customerInfo.name', 0] },
          paymentDate: '$payments.date',
          principalAmount: { $ifNull: ['$payments.principalAmount', 0] },
          interestAmount: { $ifNull: ['$payments.interestAmount', 0] },
          totalAmount: {
            $add: [
              { $ifNull: ['$payments.principalAmount', 0] },
              { $ifNull: ['$payments.interestAmount', 0] }
            ]
          },
          forMonth: '$payments.forMonthName',
          forYear: '$payments.forYear'
        }
      },
      { $sort: { paymentDate: -1 } },
      { $limit: 10 }
    ]);

    const businessMetrics = {
      totalActiveLoanAmount: stats.find(s => s._id === 'ACTIVE')?.currentLoanAmount || 0,
      totalInterestEarned: stats.reduce((sum, s) => sum + (s.totalInterestReceived || 0), 0),
      totalLoans: stats.reduce((sum, s) => sum + s.count, 0)
    };

    res.json({
      success: true,
      data: {
        loanStats: stats,
        recentPayments,
        businessMetrics,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Close silver loan manually (if all conditions met)
export const closeSilverLoan = async (req, res) => {
  try {
    const { closureImages = [], notes } = req.body;

    const silverLoan = await SilverLoan.findById(req.params.id).populate("customer");
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: "Silver loan not found" });
    }

    if (silverLoan.status === "CLOSED") {
      return res.status(400).json({ success: false, error: "Loan is already closed" });
    }

    // Check if can be closed
    if (silverLoan.currentLoanAmount > 0 || silverLoan.getActiveItems().length > 0) {
      return res.status(400).json({ success: false, error: "Cannot close loan with outstanding amount or items" });
    }

    // Mark as closed
    const currentDate = new Date();
    silverLoan.status = "CLOSED";
    silverLoan.closureDate = currentDate;
    silverLoan.closureImages = closureImages;
    if (notes) silverLoan.notes = notes;

    await silverLoan.save();

    const closureTransaction = new Transaction({
      type: "SILVER_LOAN_CLOSURE",
      customer: silverLoan.customer._id,
      amount: 0,
      direction: 0,
      description: `Silver loan closed - all items returned to ${silverLoan.customer.name}`,
      relatedDoc: silverLoan._id,
      relatedModel: "SilverLoan",
      category: "CLOSURE",
    });
    await closureTransaction.save();

    res.json({
      success: true,
      data: silverLoan,
      message: "Silver loan closed successfully."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add interest payment using paymentSchema directly
export const addInterestPaymentS = async (req, res) => {
  try {
    const { loanId } = req.params;
    const {
      interestAmount,
      paymentDate,
      paymentMethod,
      forMonth, // Format: "YYYY-MM"
      photos = [],
      notes,
      recordedBy = 'Admin'
    } = req.body;

    // Validate loan exists
    const loan = await SilverLoan.findById(loanId).populate('customer');
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    // Validate required fields
    if (!interestAmount || parseFloat(interestAmount) <= 0) {
      return res.status(400).json({ success: false, error: 'Interest amount must be greater than 0' });
    }
    if (!paymentDate) {
      return res.status(400).json({ success: false, error: 'Payment date is required' });
    }
    if (!forMonth) {
      return res.status(400).json({ success: false, error: 'Payment month is required' });
    }

    // Validate payment method-specific fields
    if (paymentMethod === 'CHEQUE') {
      if (!req.body.chequeNumber || !req.body.bankName || !req.body.chequeDate) {
        return res.status(400).json({ success: false, error: 'Cheque details are required' });
      }
    }
    if (['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentMethod)) {
      if (!req.body.referenceNumber) {
        return res.status(400).json({ success: false, error: 'Reference number is required for digital payments' });
      }
    }

    // Calculate interest details
    const monthlyInterest = (loan.currentLoanAmount * loan.interestRateMonthlyPct);
    const [year, month] = forMonth.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const forMonthName = monthNames[parseInt(month) - 1];

    // Check for existing payments for the same month
    const existingPayments = loan.payments.filter(p => p.forMonth === forMonth && p.type === 'INTEREST');
    const totalPaid = existingPayments.reduce((sum, payment) => sum + (payment.interestAmount || 0), 0);
    const remainingInterest = Math.max(0, monthlyInterest - totalPaid);

    
    // Create payment entry in the payments array
    const payment = {
      date: new Date(paymentDate),
      type: 'INTEREST',
      principalAmount: 0,
      interestAmount: parseFloat(interestAmount),
      forMonth,
      forYear: parseInt(year),
      forMonthName,
      photos,
      notes: notes || `Interest payment for ${forMonthName} ${year}`,
      currentLoanAmountAtPayment: loan.currentLoanAmount,
      currentLoanAmountAfterPayment: loan.currentLoanAmount // No change for interest payment
    };

    loan.payments.push(payment);
    loan.lastInterestPayment = new Date(paymentDate);
    await loan.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'SILVER_LOAN_INTEREST_RECEIVED',
      customer: loan.customer._id,
      amount: parseFloat(interestAmount),
      direction: -1, // incoming
      description: `Interest payment - ${loan.customer.name} - ${forMonthName} ${year}`,
      relatedDoc: loan._id,
      relatedModel: 'SilverLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'INTEREST',
        forMonth,
        monthlyInterestDue: monthlyInterest,
        paymentMethod,
        photos
      }
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      data: payment,
      interestSummary: {
        monthlyInterest,
        totalPaidForMonth: totalPaid + parseFloat(interestAmount),
        remainingInterest: Math.max(0, remainingInterest - parseFloat(interestAmount))
      },
      message: `Interest payment of ₹${parseFloat(interestAmount).toLocaleString()} recorded for ${forMonthName} ${year}`
    });
  } catch (error) {
    console.error('Error adding interest payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process item repayment
export const processItemRepaymentS = async (req, res) => {
  try {
    const {
      repaymentAmount,
      paymentMethod = 'CASH',
      repaymentDate,
      selectedItemIds = [],
      photos = [],
      notes,
      recordedBy = 'Admin',
      processingFee = 0,
      lateFee = 0,
      adjustmentAmount = 0,
      adjustmentReason = '',
      itemReturnDetails = [] // Array of { itemId, returnSilverPrice, returnPhotos, returnNotes, weight, condition }
    } = req.body;

    const silverLoan = await SilverLoan.findById(req.params.id).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    if (silverLoan.status === 'CLOSED') {
      return res.status(400).json({ success: false, error: 'Cannot process repayment for closed loan' });
    }

    // Validate required fields
    if (!selectedItemIds || selectedItemIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No items selected for return' });
    }

    if (!itemReturnDetails || itemReturnDetails.length === 0) {
      return res.status(400).json({ success: false, error: 'Item return details are required' });
    }

    const finalRepaymentAmount = parseFloat(repaymentAmount) || 0;
    const processingFeeAmount = parseFloat(processingFee) || 0;
    const lateFeeAmount = parseFloat(lateFee) || 0;
    const adjustmentAmountValue = parseFloat(adjustmentAmount) || 0;
    const netRepaymentAmount = finalRepaymentAmount - processingFeeAmount - lateFeeAmount + adjustmentAmountValue;

    if (netRepaymentAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Net repayment amount must be greater than zero' });
    }

    const currentLoanAmountBefore = silverLoan.currentLoanAmount || silverLoan.totalLoanAmount || 0;

    // Get items to return - only unreturned items
    const itemsToReturn = silverLoan.items.filter(item =>
      selectedItemIds.includes(item._id.toString()) && !item.returnDate
    );

    if (itemsToReturn.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid items found for return' });
    }

    if (itemsToReturn.length !== selectedItemIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Some selected items are already returned or not found'
      });
    }

    // Calculate total loan amount of items being returned
    const totalItemLoanValue = itemsToReturn.reduce((sum, item) => sum + (item.loanAmount || 0), 0);

    // Validate repayment amount covers the item loan values
    if (netRepaymentAmount < totalItemLoanValue) {
      return res.status(400).json({
        success: false,
        error: `Repayment amount (₹${netRepaymentAmount.toLocaleString()}) is insufficient to return selected items (₹${totalItemLoanValue.toLocaleString()} required)`
      });
    }

    let totalWeight = 0;
    let totalCurrentMarketValue = 0;
    let totalAppreciation = 0;

    // Process each item return with individual details
    const returnDate = new Date(repaymentDate || Date.now());
    const processedItems = [];

    itemsToReturn.forEach(item => {
      // Find the return details for this specific item
      const itemDetail = itemReturnDetails.find(detail =>
        detail.itemId === item._id.toString()
      );

      if (!itemDetail) {
        throw new Error(`Return details not found for item: ${item.name}`);
      }

      // Validate item details
      if (!itemDetail.returnSilverPrice || itemDetail.returnSilverPrice <= 0) {
        throw new Error(`Valid silver price required for item: ${item.name}`);
      }

      if (!itemDetail.weight || itemDetail.weight <= 0) {
        throw new Error(`Valid weight required for item: ${item.name}`);
      }

      // Calculate current market value based on actual return details
      const currentValue = itemDetail.weight * (item.purityK / 24) * itemDetail.returnSilverPrice;
      const appreciation = currentValue - item.loanAmount;

      // Update item with return information
      item.returnDate = returnDate;
      item.returnImages = itemDetail.returnPhotos || [];
      item.silverPriceAtReturn = parseFloat(itemDetail.returnSilverPrice);
      item.returnValue = currentValue;
      item.returnNotes = itemDetail.returnNotes || `${item.name} returned on ${returnDate.toDateString()} at ₹${itemDetail.returnSilverPrice}/gram`;
      item.returnCondition = itemDetail.condition || 'good';
      item.returnRecordedBy = recordedBy;
      item.returnVerified = false; // Will be verified by senior staff later

      // Track totals
      totalWeight += itemDetail.weight;
      totalCurrentMarketValue += currentValue;
      totalAppreciation += appreciation;

      // Store processed item info for response
      processedItems.push({
        itemId: item._id,
        name: item.name,
        weightGram: itemDetail.weight,
        purityK: item.purityK,
        loanAmount: item.loanAmount,
        returnValue: currentValue,
        silverPriceAtReturn: itemDetail.returnSilverPrice,
        returnImages: itemDetail.returnPhotos || [],
        returnNotes: item.returnNotes,
        returnCondition: item.returnCondition,
        appreciation: appreciation,
        appreciationPct: item.loanAmount > 0 ? (appreciation / item.loanAmount) * 100 : 0
      });
    });

    // Update loan amounts
    const principalReduced = totalItemLoanValue;
    silverLoan.currentLoanAmount = Math.max(0, currentLoanAmountBefore - principalReduced);

    // Update loan status based on remaining items and amount
    const activeItemsCount = silverLoan.items.filter(item => !item.returnDate).length;
    const previousStatus = silverLoan.status;

    if (silverLoan.currentLoanAmount <= 0 && activeItemsCount === 0) {
      silverLoan.status = 'CLOSED';
      silverLoan.closureDate = returnDate;
      silverLoan.closureImages = photos;
      silverLoan.closureReason = 'FULL_PAYMENT';
    } else if (activeItemsCount < silverLoan.items.length) {
      silverLoan.status = 'PARTIALLY_PAID';
    }

    // Create comprehensive payment entry
    const payment = {
      date: returnDate,
      type: 'PRINCIPAL',
      principalAmount: principalReduced,
      interestAmount: 0,
      forMonth: `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}`,
      forYear: returnDate.getFullYear(),
      forMonthName: returnDate.toLocaleString('default', { month: 'long' }),
      photos,
      notes: notes || `Item return - ${processedItems.length} items returned`,
      paymentMethod,
      processingFee: processingFeeAmount,
      lateFee: lateFeeAmount,
      adjustmentAmount: adjustmentAmountValue,
      adjustmentReason,
      repaymentType: 'ITEM_RETURN',
      repaymentAmount: finalRepaymentAmount,
      netRepaymentAmount,
      itemsReturned: processedItems,
      totalItemsReturned: processedItems.length,
      totalWeightReturned: totalWeight,
      totalMarketValueReturned: totalCurrentMarketValue,
      principalReduced,
      currentLoanAmountAtPayment: currentLoanAmountBefore,
      currentLoanAmountAfterPayment: silverLoan.currentLoanAmount,
      isFullRepayment: silverLoan.status === 'CLOSED',
      isLoanClosed: silverLoan.status === 'CLOSED',
      selectedItemIds,
      silverPriceUsed: 0, // Different prices used for different items
      recordedBy,
      totalAppreciation,
      averageAppreciationPct: totalItemLoanValue > 0 ? (totalAppreciation / totalItemLoanValue) * 100 : 0
    };

    silverLoan.payments.push(payment);
    silverLoan.lastModifiedBy = recordedBy;
    silverLoan.lastModifiedDate = new Date();

    await silverLoan.save();

    // Create transaction record
    const transactionType = silverLoan.status === 'CLOSED' ? 'SILVER_LOAN_CLOSURE' : 'SILVER_LOAN_REPAYMENT';

    const transaction = new Transaction({
      type: transactionType,
      customer: silverLoan.customer._id,
      amount: finalRepaymentAmount,
      direction: -1, // incoming
      description: silverLoan.status === 'CLOSED'
        ? `Silver loan closed - ${processedItems.length} items returned by ${silverLoan.customer.name}`
        : `Silver loan repayment - ${processedItems.length} items returned by ${silverLoan.customer.name}`,
      relatedDoc: silverLoan._id,
      relatedModel: 'SilverLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'PRINCIPAL',
        repaymentType: 'ITEM_RETURN',
        itemCount: processedItems.length,
        totalWeight,
        totalMarketValue: totalCurrentMarketValue,
        totalAppreciation,
        averageAppreciationPct: payment.averageAppreciationPct,
        isLoanClosed: silverLoan.status === 'CLOSED',
        statusChanged: previousStatus !== silverLoan.status,
        previousStatus,
        newStatus: silverLoan.status,
        principalReduced,
        processingFee: processingFeeAmount,
        lateFee: lateFeeAmount,
        adjustmentAmount: adjustmentAmountValue,
        silverPricesUsed: processedItems.map(item => ({
          itemId: item.itemId,
          silverPrice: item.silverPriceAtReturn
        }))
      },
      affectedItems: processedItems.map(item => ({
        itemId: item.itemId,
        name: item.name,
        weightGram: item.weightGram,
        purityK: item.purityK,
        originalValue: item.loanAmount,
        returnValue: item.returnValue,
        silverPriceAtReturn: item.silverPriceAtReturn,
        appreciation: item.appreciation,
        action: 'RETURNED'
      }))
    });

    await transaction.save();

    // Get remaining items for response
    const remainingItems = silverLoan.items.filter(item => !item.returnDate);

    const statusMessage = silverLoan.status === 'CLOSED'
      ? 'Loan completed and closed successfully!'
      : `${processedItems.length} items returned successfully. ${remainingItems.length} items remaining. Loan amount: ₹${silverLoan.currentLoanAmount.toLocaleString()}`;

    // Comprehensive response
    res.json({
      success: true,
      data: payment,
      silverLoan,
      repaymentSummary: {
        repaymentAmount: finalRepaymentAmount,
        netRepaymentAmount,
        principalReduced,
        itemsReturned: processedItems.length,
        totalItemLoanValue,
        totalCurrentMarketValue,
        totalWeight,
        totalAppreciation,
        averageAppreciationPct: payment.averageAppreciationPct,
        remainingItems: remainingItems.length,
        remainingLoanAmount: silverLoan.currentLoanAmount,
        loanStatus: silverLoan.status,
        isLoanClosed: silverLoan.status === 'CLOSED',
        statusChanged: previousStatus !== silverLoan.status,
        previousStatus,
        returnedItems: processedItems.map(item => ({
          id: item.itemId,
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          originalLoanAmount: item.loanAmount,
          returnValue: item.returnValue,
          appreciation: item.appreciation,
          appreciationPct: item.appreciationPct,
          silverPriceAtReturn: item.silverPriceAtReturn,
          returnImages: item.returnImages,
          returnCondition: item.returnCondition,
          returnDate: returnDate
        })),
        remainingItemsSummary: remainingItems.map(item => ({
          id: item._id,
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          loanAmount: item.loanAmount
        })),
        fees: {
          processingFee: processingFeeAmount,
          lateFee: lateFeeAmount,
          adjustmentAmount: adjustmentAmountValue,
          adjustmentReason
        },
        newMonthlyInterest: silverLoan.currentLoanAmount > 0
          ? (silverLoan.currentLoanAmount * silverLoan.interestRateMonthlyPct / 100)
          : 0,
        paymentMethod,
        repaymentDate: returnDate,
        recordedBy
      },
      message: statusMessage
    });
  } catch (error) {
    console.error('Item return processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process item return'
    });
  }
};

// Get all silver loans with pagination and filters
export const getAllSilverLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;
    const query = {};

    if (status) query.status = status;
    if (customer) query.customer = customer;

    const silverLoans = await SilverLoan.find(query)
      .populate('customer', 'name phone email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await SilverLoan.countDocuments(query);

    res.json({
      success: true,
      data: silverLoans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching silver loans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get silver loan by ID with full summary
export const getSilverLoanById = async (req, res) => {
  try {
    const silverLoan = await SilverLoan.findById(req.params.id).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    res.json({
      success: true,
      data: {
        ...silverLoan.toObject(),
        loanSummary: silverLoan.getLoanSummary()
      }
    });
  } catch (error) {
    console.error('Error fetching silver loan by ID:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get silver loans by customer ID
export const getSilverLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ success: false, error: 'Invalid customer ID format' });
    }

    const silverLoans = await SilverLoan.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    const loansWithSummary = silverLoans.map(loan => ({
      ...loan.toObject(),
      summary: loan.getLoanSummary()
    }));

    res.json({
      success: true,
      data: loansWithSummary
    });
  } catch (error) {
    console.error('Error fetching silver loans by customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment history for a loan
export const getPaymentHistory = async (req, res) => {
  try {
    const silverLoan = await SilverLoan.findById(req.params.id).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    const payments = silverLoan.payments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(payment => ({
        date: payment.date,
        principalAmount: payment.principalAmount || 0,
        interestAmount: payment.interestAmount || 0,
        totalAmount: (payment.principalAmount || 0) + (payment.interestAmount || 0),
        forMonth: payment.forMonthName,
        forYear: payment.forYear,
        notes: payment.notes,
        itemsReturned: payment.itemsReturned || [],
        paymentType: payment.type,
        formattedDate: payment.date.toLocaleDateString('en-IN')
      }));

    const paymentSummary = {
      totalPayments: payments.length,
      totalPrincipalPaid: payments.reduce((sum, p) => sum + p.principalAmount, 0),
      totalInterestPaid: payments.reduce((sum, p) => sum + p.interestAmount, 0),
      totalAmountPaid: payments.reduce((sum, p) => sum + p.totalAmount, 0)
    };

    res.json({
      success: true,
      data: {
        loan: {
          id: silverLoan._id,
          customerName: silverLoan.customer.name,
          totalLoanAmount: silverLoan.totalLoanAmount,
          currentLoanAmount: silverLoan.currentLoanAmount,
          interestRate: silverLoan.interestRateMonthlyPct,
          status: silverLoan.status
        },
        payments,
        paymentSummary
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get interest payments for a specific loan
export const getInterestPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const loan = await SilverLoan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    // Filter payments for interest only
    const interestPayments = loan.payments.filter(payment => payment.type === 'INTEREST');

    // Sort by date (newest first)
    interestPayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate pagination
    const totalPayments = interestPayments.length;
    const totalPages = Math.ceil(totalPayments / limit);
    const skip = (page - 1) * limit;
    const paginatedPayments = interestPayments.slice(skip, skip + parseInt(limit));

    // Add calculated fields for each payment
    const enhancedPayments = paginatedPayments.map(payment => {
      const monthlyInterest = loan.currentLoanAmount * loan.interestRateMonthlyPct;
      const calculatedInterestDue = monthlyInterest;
      const paymentDifference = (payment.interestAmount || 0) - calculatedInterestDue;

      return {
        ...payment.toObject(),
        calculatedInterestDue,
        paymentDifference,
        interestRate: loan.interestRateMonthlyPct,
        receiptNumber: payment._id.toString().slice(-8).toUpperCase()
      };
    });

    res.json({
      success: true,
      data: enhancedPayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPayments,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching interest payments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get repayments for a specific loan
export const getRepayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const loan = await SilverLoan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    // Filter payments for principal only
    const repayments = loan.payments.filter(payment => payment.type === 'PRINCIPAL');

    // Sort by date (newest first)
    repayments.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate pagination
    const totalRepayments = repayments.length;
    const totalPages = Math.ceil(totalRepayments / limit);
    const skip = (page - 1) * limit;
    const paginatedRepayments = repayments.slice(skip, skip + parseInt(limit));

    // Add calculated fields for each repayment
    const enhancedRepayments = paginatedRepayments.map(payment => ({
      ...payment.toObject(),
      receiptNumber: payment._id.toString().slice(-8).toUpperCase(),
      repaymentDate: payment.date
    }));

    res.json({
      success: true,
      data: enhancedRepayments,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRepayments,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching repayments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get comprehensive payment summary
export const getLoanPaymentSummary = async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await SilverLoan.findById(loanId).populate('customer');
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    const interestPayments = loan.payments.filter(p => p.type === 'INTEREST');
    const repayments = loan.payments.filter(p => p.type === 'PRINCIPAL');

    // Calculate totals
    const totalInterestPaid = interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
    const totalPrincipalPaid = repayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
    const totalItemsReturned = repayments.reduce((sum, p) => sum + (p.totalItemsReturned || 0), 0);
    const totalWeightReturned = repayments.reduce((sum, p) => sum + (p.totalWeightReturned || 0), 0);

    // Calculate outstanding interest (simplified calculation)
    const monthlyRate = loan.interestRateMonthlyPct || 0;
    const startDate = new Date(loan.startDate);
    const monthsSinceStart = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24 * 30)));
    const totalInterestDue = (loan.totalLoanAmount || 0) * (monthlyRate / 100) * monthsSinceStart;
    const outstandingInterest = Math.max(0, totalInterestDue - totalInterestPaid);

    const summary = {
      loanDetails: {
        loanId: loan._id,
        customerName: loan.customer?.name,
        totalLoanAmount: loan.totalLoanAmount || 0,
        currentLoanAmount: loan.currentLoanAmount || 0,
        interestRateMonthlyPct: monthlyRate,
        status: loan.status,
        startDate: loan.startDate,
        totalItems: loan.items?.length || 0,
        remainingItems: loan.items?.filter(item => !item.returnDate).length || 0
      },
      paymentSummary: {
        totalInterestPaid,
        totalPrincipalPaid,
        totalPayments: interestPayments.length + repayments.length,
        interestPaymentCount: interestPayments.length,
        repaymentCount: repayments.length,
        totalItemsReturned,
        totalWeightReturned,
        outstandingInterest,
        remainingPrincipal: loan.currentLoanAmount || 0
      },
      recentPayments: loan.payments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(payment => ({
          ...payment.toObject(),
          receiptNumber: payment._id.toString().slice(-8).toUpperCase()
        }))
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process item return
export const processItemReturnS = async (req, res) => {
  try {
    const {
      selectedItems = [], // Array of item objects with details
      paymentMethod = 'CASH',
      repaymentDate,
      photos = [],
      notes,
      recordedBy = 'Admin',
      processingFee = 0,
      lateFee = 0,
      adjustmentAmount = 0,
      adjustmentReason = ''
    } = req.body;

    const silverLoan = await SilverLoan.findById(req.params.id).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    if (silverLoan.status === 'CLOSED') {
      return res.status(400).json({ success: false, error: 'Cannot process return for closed loan' });
    }

    // Validate selected items
    if (!selectedItems || selectedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item must be selected for return' });
    }

    // Validate each selected item
    const processedItems = [];
    let totalReturnValue = 0;
    let totalWeight = 0;
    let totalAppreciation = 0;
    const returnDate = new Date(repaymentDate || Date.now());

    for (const itemData of selectedItems) {
      // Find the original item in the loan
      const originalItem = silverLoan.items.find(item =>
        item._id.toString() === itemData.itemId
      );

      if (!originalItem) {
        return res.status(400).json({
          success: false,
          error: `Original item not found for ID: ${itemData.itemId}`
        });
      }

      if (originalItem.returnDate) {
        return res.status(400).json({
          success: false,
          error: `Item "${originalItem.name}" has already been returned`
        });
      }

      // Validate item return details
      if (!itemData.weight || itemData.weight <= 0) {
        return res.status(400).json({
          success: false,
          error: `Valid weight required for item: ${originalItem.name}`
        });
      }

      if (!itemData.returnPrice || itemData.returnPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: `Valid return price required for item: ${originalItem.name}`
        });
      }

      if (!itemData.currentSilverPrice || itemData.currentSilverPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: `Valid silver price required for item: ${originalItem.name}`
        });
      }

      // Calculate current market value
      const purityFactor = originalItem.purityK / 24;
      const currentMarketValue = itemData.weight * purityFactor * itemData.currentSilverPrice;
      const appreciation = currentMarketValue - originalItem.loanAmount;

      // Update the original item with return information
      originalItem.returnDate = returnDate;
      originalItem.returnImages = itemData.returnPhotos || [];
      originalItem.returnValue = currentMarketValue;
      originalItem.silverPriceAtReturn = parseFloat(itemData.currentSilverPrice);
      originalItem.returnNotes = itemData.returnNotes || `Returned on ${returnDate.toLocaleDateString('en-IN')}`;
      originalItem.returnCondition = itemData.condition || 'good';
      originalItem.returnRecordedBy = recordedBy;
      originalItem.returnVerified = false;

      // Track totals
      totalWeight += itemData.weight;
      totalReturnValue += currentMarketValue;
      totalAppreciation += appreciation;

      // Store processed item info
      processedItems.push({
        itemId: originalItem._id,
        name: originalItem.name,
        originalWeightGram: originalItem.weightGram,
        returnedWeightGram: itemData.weight,
        purityK: originalItem.purityK,
        originalLoanAmount: originalItem.loanAmount,
        returnValue: currentMarketValue,
        silverPriceAtReturn: parseFloat(itemData.currentSilverPrice),
        returnPrice: parseFloat(itemData.returnPrice),
        returnPhotos: itemData.returnPhotos || [],
        appreciation,
        appreciationPct: originalItem.loanAmount > 0 ? (appreciation / originalItem.loanAmount) * 100 : 0,
        returnCondition: itemData.condition || 'good',
        returnNotes: itemData.returnNotes || '',
        weightDifference: itemData.weight - originalItem.weightGram,
        weightDifferencePct: originalItem.weightGram > 0 ? ((itemData.weight - originalItem.weightGram) / originalItem.weightGram) * 100 : 0
      });
    }

    // Calculate total repayment amount (sum of return prices)
    const totalRepaymentAmount = selectedItems.reduce((sum, item) => sum + (item.returnPrice || 0), 0);
    const processingFeeAmount = parseFloat(processingFee) || 0;
    const lateFeeAmount = parseFloat(lateFee) || 0;
    const adjustmentAmountValue = parseFloat(adjustmentAmount) || 0;
    const netRepaymentAmount = totalRepaymentAmount - processingFeeAmount - lateFeeAmount + adjustmentAmountValue;

    if (netRepaymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Net repayment amount must be greater than zero'
      });
    }

    const currentLoanAmountBefore = silverLoan.currentLoanAmount;
    const principalReduced = processedItems.reduce((sum, item) => sum + item.originalLoanAmount, 0);
    silverLoan.currentLoanAmount = Math.max(0, currentLoanAmountBefore - principalReduced);

    // Update loan status
    const activeItemsCount = silverLoan.items.filter(item => !item.returnDate).length;
    const previousStatus = silverLoan.status;

    if (silverLoan.currentLoanAmount <= 0 && activeItemsCount === 0) {
      silverLoan.status = 'CLOSED';
      silverLoan.closureDate = returnDate;
      silverLoan.closureImages = photos;
      silverLoan.closureReason = 'FULL_PAYMENT';
    } else if (activeItemsCount < silverLoan.items.length) {
      silverLoan.status = 'PARTIALLY_PAID';
    }

    // Create payment record
    const payment = {
      date: returnDate,
      type: 'PRINCIPAL',
      principalAmount: principalReduced,
      interestAmount: 0,
      forMonth: `${returnDate.getFullYear()}-${String(returnDate.getMonth() + 1).padStart(2, '0')}`,
      forYear: returnDate.getFullYear(),
      forMonthName: returnDate.toLocaleString('default', { month: 'long' }),
      photos,
      notes: notes || `Item return - ${processedItems.length} items returned`,
      paymentMethod,
      processingFee: processingFeeAmount,
      lateFee: lateFeeAmount,
      adjustmentAmount: adjustmentAmountValue,
      adjustmentReason,
      repaymentType: 'ITEM_RETURN',
      repaymentAmount: totalRepaymentAmount,
      netRepaymentAmount,
      itemsReturned: processedItems,
      totalItemsReturned: processedItems.length,
      totalWeightReturned: totalWeight,
      totalMarketValueReturned: totalReturnValue,
      principalReduced,
      currentLoanAmountAtPayment: currentLoanAmountBefore,
      currentLoanAmountAfterPayment: silverLoan.currentLoanAmount,
      isFullRepayment: silverLoan.status === 'CLOSED',
      isLoanClosed: silverLoan.status === 'CLOSED',
      selectedItemIds: selectedItems.map(item => item.itemId),
      totalAppreciation,
      averageAppreciationPct: principalReduced > 0 ? (totalAppreciation / principalReduced) * 100 : 0,
      recordedBy
    };

    silverLoan.payments.push(payment);
    silverLoan.lastModifiedBy = recordedBy;
    silverLoan.lastModifiedDate = new Date();

    await silverLoan.save();

    // Create transaction
    const transactionType = silverLoan.status === 'CLOSED' ? 'SILVER_LOAN_CLOSURE' : 'SILVER_LOAN_REPAYMENT';
    const transaction = new Transaction({
      type: transactionType,
      customer: silverLoan.customer._id,
      amount: totalRepaymentAmount,
      direction: -1,
      description: silverLoan.status === 'CLOSED'
        ? `Silver loan closed - ${processedItems.length} items returned by ${silverLoan.customer.name}`
        : `Silver loan repayment - ${processedItems.length} items returned by ${silverLoan.customer.name}`,
      relatedDoc: silverLoan._id,
      relatedModel: 'SilverLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'PRINCIPAL',
        repaymentType: 'ITEM_RETURN',
        itemCount: processedItems.length,
        totalWeight,
        totalMarketValue: totalReturnValue,
        totalAppreciation,
        totalRepaymentAmount,
        isLoanClosed: silverLoan.status === 'CLOSED',
        statusChanged: previousStatus !== silverLoan.status,
        principalReduced,
        processingFee: processingFeeAmount,
        lateFee: lateFeeAmount,
        adjustmentAmount: adjustmentAmountValue
      },
      affectedItems: processedItems.map(item => ({
        itemId: item.itemId,
        name: item.name,
        originalWeightGram: item.originalWeightGram,
        returnedWeightGram: item.returnedWeightGram,
        purityK: item.purityK,
        originalValue: item.originalLoanAmount,
        returnValue: item.returnValue,
        silverPriceAtReturn: item.silverPriceAtReturn,
        appreciation: item.appreciation,
        action: 'RETURNED'
      }))
    });

    await transaction.save();

    const remainingItems = silverLoan.items.filter(item => !item.returnDate);
    const statusMessage = silverLoan.status === 'CLOSED'
      ? 'All items returned and loan closed successfully!'
      : `${processedItems.length} items returned successfully. ${remainingItems.length} items remaining.`;

    res.json({
      success: true,
      data: payment,
      silverLoan,
      returnSummary: {
        itemsReturned: processedItems.length,
        totalOriginalValue: principalReduced,
        totalCurrentMarketValue: totalReturnValue,
        totalWeightReturned: totalWeight,
        totalAppreciation,
        averageAppreciationPct: payment.averageAppreciationPct,
        totalRepaymentAmount,
        netRepaymentAmount,
        remainingItems: remainingItems.length,
        remainingLoanAmount: silverLoan.currentLoanAmount,
        loanStatus: silverLoan.status,
        isLoanClosed: silverLoan.status === 'CLOSED',
        returnedItems: processedItems,
        remainingItemsSummary: remainingItems.map(item => ({
          id: item._id,
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          loanAmount: item.loanAmount
        })),
        fees: {
          processingFee: processingFeeAmount,
          lateFee: lateFeeAmount,
          adjustmentAmount: adjustmentAmountValue,
          adjustmentReason
        }
      },
      message: statusMessage
    });
  } catch (error) {
    console.error('Item return processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process item return'
    });
  }
};

// Get active items for return
export const getActiveItemsForReturnS = async (req, res) => {
  try {
    const silverLoan = await SilverLoan.findById(req.params.id).populate('customer');
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    const activeItems = silverLoan.items.filter(item => !item.returnDate);

    res.json({
      success: true,
      data: {
        activeItems,
        totalActiveItems: activeItems.length,
        totalActiveWeight: activeItems.reduce((sum, item) => sum + (item.weightGram || 0), 0),
        totalLoanValue: activeItems.reduce((sum, item) => sum + (item.loanAmount || 0), 0)
      }
    });
  } catch (error) {
    console.error('Get active items error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};