import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import SilverLoan from '../models/SilverLoan.js';
import Repayment from '../models/Repayment.js';
import Customer from '../models/Customer.js';

// Create new silver loan with overall loan amount (no per-item amounts) and enhanced validation
export const createSilverLoan = async (req, res) => {
  try {
    const { customer, totalLoanAmount, items, interestRateMonthlyPct, startDate, notes } = req.body;
   
    if (!customer) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!totalLoanAmount || parseFloat(totalLoanAmount) <= 0) {
      return res.status(400).json({ success: false, error: 'Total loan amount must be greater than 0' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required for silver loan' });
    }

    // Validate and process items (no loanAmount per item)
    const processedItems = [];

    for (const item of items) {
      if (!item.weightGram || !item.purityK) {
        return res.status(400).json({
          success: false,
          error: `Item ${item.name || 'Unknown'} is missing weight or purity`
        });
      }

      const processedItem = {
        name: item.name || 'Silver Item',
        weightGram: parseFloat(item.weightGram),
        purityK: parseInt(item.purityK),
        images: item.images || [],
        addedDate: new Date()
      };
     
      processedItems.push(processedItem);
    }

    const totalPrincipal = parseFloat(totalLoanAmount);

    const silverLoan = new SilverLoan({
      customer,
      items: processedItems,
      interestRateMonthlyPct: parseFloat(interestRateMonthlyPct),
      totalLoanAmount: totalPrincipal,
      currentPrincipal: totalPrincipal,
      outstandingAmount: totalPrincipal,
      lastAccruedDate: startDate || new Date(),
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

// Add interest payment - Reduce from outstanding amount (accrue first)
export const addInterestPayment = async (req, res) => {
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

    const parsedPaymentDate = new Date(paymentDate);
    loan.accrueTo(parsedPaymentDate);

    const currentOutstanding = loan.outstandingAmount;
    const newOutstanding = currentOutstanding - parseFloat(interestAmount);

    if (newOutstanding < loan.currentPrincipal) {
      console.warn(`Interest payment would reduce outstanding below principal. Adjusting.`);
    }

    // Update outstanding
    loan.outstandingAmount = newOutstanding;
    loan.lastAccruedDate = parsedPaymentDate;

    const [year, month] = forMonth.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const forMonthName = monthNames[parseInt(month) - 1];

    // Create payment entry in the payments array
    const payment = {
      date: parsedPaymentDate,
      type: 'INTEREST',
      principalAmount: 0,
      interestAmount: parseFloat(interestAmount),
      forMonth,
      forYear: parseInt(year),
      forMonthName,
      photos,
      notes: notes || `Interest payment for ${forMonthName} ${year}`,
      currentOutstandingAtPayment: currentOutstanding,
      currentOutstandingAfterPayment: loan.outstandingAmount
    };

    loan.payments.push(payment);
    loan.lastInterestPayment = parsedPaymentDate;
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
        paymentMethod,
        photos
      }
    });
    await transaction.save();

    res.status(200).json({
      success: true,
      data: payment,
      message: `Interest payment of ₹${parseFloat(interestAmount).toLocaleString()} recorded for ${forMonthName} ${year}`
    });
  } catch (error) {
    console.error('Error adding interest payment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process item return - Manual amounts paid by customer, reduce from outstanding
export const processItemReturn = async (req, res) => {
  try {
    const {
      selectedItems = [], // Array of item objects with details: {itemId, weight, returnPrice, condition, returnPhotos, returnNotes}
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
      return res.status(400).json({ success: false, error: 'Silver loan not found' });
    }

    if (silverLoan.status === 'CLOSED') {
      return res.status(400).json({ success: false, error: 'Cannot process return for closed loan' });
    }

    // Validate selected items
    if (!selectedItems || selectedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item must be selected for return' });
    }

    // Process each selected item
    const processedItems = [];
    let totalWeight = 0;
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
          error: `Valid return amount required for item: ${originalItem.name}` 
        });
      }

      // Update the original item with return information
      originalItem.returnDate = returnDate;
      originalItem.returnImages = itemData.returnPhotos || [];
      originalItem.returnNotes = itemData.returnNotes || `Returned on ${returnDate.toLocaleDateString('en-IN')}`;
      originalItem.returnCondition = itemData.condition || 'good';
      originalItem.returnRecordedBy = recordedBy;
      originalItem.returnVerified = false;

      // Track totals
      totalWeight += itemData.weight;

      // Store processed item info (no originalLoanAmount)
      processedItems.push({
        itemId: originalItem._id,
        name: originalItem.name,
        originalWeightGram: originalItem.weightGram,
        returnedWeightGram: itemData.weight,
        purityK: originalItem.purityK,
        returnPrice: parseFloat(itemData.returnPrice),
        returnPhotos: itemData.returnPhotos || [],
        returnCondition: itemData.condition || 'good',
        returnNotes: itemData.returnNotes || '',
        weightDifference: itemData.weight - originalItem.weightGram,
        weightDifferencePct: originalItem.weightGram > 0 ? ((itemData.weight - originalItem.weightGram) / originalItem.weightGram) * 100 : 0
      });
    }

    // Calculate total repayment amount (sum of return prices - manual)
    const totalRepaymentAmount = selectedItems.reduce((sum, item) => sum + parseFloat(item.returnPrice || 0), 0);
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

    // Accrue interest up to return date
    silverLoan.accrueTo(returnDate);

    const currentOutstandingBefore = silverLoan.outstandingAmount;
    const principalReduced = netRepaymentAmount; // Since no per-item, net reduces principal and outstanding

    silverLoan.outstandingAmount = Math.max(0, currentOutstandingBefore - netRepaymentAmount);
    silverLoan.currentPrincipal = Math.max(0, silverLoan.currentPrincipal - principalReduced);
    silverLoan.lastAccruedDate = returnDate;

    // Update loan status
    const activeItemsCount = silverLoan.items.filter(item => !item.returnDate).length;
    const previousStatus = silverLoan.status;

    // Explicitly check if outstanding amount and principal are zero or very close to zero
    const isEffectivelyZero = (amount) => Math.abs(amount) < 0.01; // Handle floating-point precision
    if (isEffectivelyZero(silverLoan.outstandingAmount) && isEffectivelyZero(silverLoan.currentPrincipal) && activeItemsCount === 0) {
      silverLoan.status = 'CLOSED';
      silverLoan.closureDate = returnDate;
      silverLoan.closureImages = photos;
      silverLoan.closureReason = 'FULL_PAYMENT';
    } else if (activeItemsCount < silverLoan.items.length || silverLoan.currentPrincipal < silverLoan.totalLoanAmount) {
      silverLoan.status = 'PARTIALLY_PAID';
    } else {
      silverLoan.status = 'ACTIVE';
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
      principalReduced,
      currentOutstandingAtPayment: currentOutstandingBefore,
      currentOutstandingAfterPayment: silverLoan.outstandingAmount,
      isFullRepayment: silverLoan.status === 'CLOSED',
      isLoanClosed: silverLoan.status === 'CLOSED',
      selectedItemIds: selectedItems.map(item => item.itemId),
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
        totalWeightReturned: totalWeight,
        totalRepaymentAmount,
        netRepaymentAmount,
        remainingItems: remainingItems.length,
        remainingPrincipal: silverLoan.currentPrincipal,
        remainingOutstanding: silverLoan.outstandingAmount,
        loanStatus: silverLoan.status,
        isLoanClosed: silverLoan.status === 'CLOSED',
        returnedItems: processedItems,
        remainingItemsSummary: remainingItems.map(item => ({
          id: item._id,
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`
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

    const stats = await SilverLoan.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(silverLoanId)
        }
      },
      {
        $unwind: '$payments'
      },
      {
        $match: {
          'payments.date': { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$payments.repaymentAmount' },
          totalItemsReturned: { $sum: '$payments.totalItemsReturned' },
          totalWeightReturned: { $sum: '$payments.totalWeightReturned' },
          totalInterestPaid: { $sum: '$payments.interestAmount' },
          totalProcessingFees: { $sum: '$payments.processingFee' },
          totalLateFees: { $sum: '$payments.lateFee' },
          totalAdjustments: { $sum: '$payments.adjustmentAmount' },
          averageRepaymentAmount: { $avg: '$payments.repaymentAmount' },
          largestRepayment: { $max: '$payments.repaymentAmount' },
          smallestRepayment: { $min: '$payments.repaymentAmount' },
          repaymentMethods: {
            $push: '$payments.paymentMethod'
          },
          repaymentTypes: {
            $push: '$payments.repaymentType'
          },
          monthlyTotals: {
            $push: {
              month: { $month: '$payments.date' },
              year: { $year: '$payments.date' },
              amount: '$payments.repaymentAmount'
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

      silverLoan.accrueTo(new Date());
      if (amount > silverLoan.outstandingAmount) {
        validations.push({
          field: 'repaymentAmount',
          message: 'Repayment amount cannot exceed outstanding amount',
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
          currentPrincipal: silverLoan.currentPrincipal,
          outstandingAmount: silverLoan.outstandingAmount,
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

    const repayment = await SilverLoan.findOne({'payments._id': repaymentId})
      .populate('customer', 'name phone email');

    if (!repayment) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    const payment = repayment.payments.id(repaymentId);

    res.json({
      success: true,
      data: payment
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

    const loan = await SilverLoan.findOne({'payments._id': repaymentId})
      .populate('customer');

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    const repayment = loan.payments.id(repaymentId);

    // Generate receipt data
    const receiptData = {
      receiptNumber: repayment._id.toString().slice(-8).toUpperCase(),
      repaymentDate: repayment.date,
      customer: loan.customer,
      loan: {
        id: loan._id,
        startDate: loan.startDate,
        interestRate: loan.interestRateMonthlyPct
      },
      repaymentDetails: {
        amount: repayment.repaymentAmount,
        paymentMethod: repayment.paymentMethod,
        repaymentType: repayment.repaymentType,
        referenceNumber: repayment.referenceNumber,
        chequeNumber: repayment.chequeNumber,
        bankName: repayment.bankName
      },
      returnedItems: repayment.itemsReturned,
      calculations: {
        outstandingBefore: repayment.currentOutstandingAtPayment,
        outstandingAfter: repayment.currentOutstandingAfterPayment,
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

// Search all repayments across loans - Adjusted for payments array
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

    // Build search filter for payments
    const filter = {};
    const match = {};

    if (receiptNumber) {
      match['payments._id'] = { $regex: receiptNumber, $options: 'i' }; // Approximate, since receipt is generated
    }
   
    if (paymentMethod) {
      match['payments.paymentMethod'] = paymentMethod;
    }
   
    if (repaymentType) {
      match['payments.repaymentType'] = repaymentType;
    }
   
    if (startDate || endDate) {
      match['payments.date'] = {};
      if (startDate) match['payments.date'].$gte = new Date(startDate);
      if (endDate) match['payments.date'].$lte = new Date(endDate);
    }
   
    if (minAmount || maxAmount) {
      match['payments.repaymentAmount'] = {};
      if (minAmount) match['payments.repaymentAmount'].$gte = parseFloat(minAmount);
      if (maxAmount) match['payments.repaymentAmount'].$lte = parseFloat(maxAmount);
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

    const aggregate = [
      { $match: filter },
      { $unwind: '$payments' },
      { $match: match },
      { $sort: { 'payments.date': -1 } },
      { $skip: (pageNum - 1) * limitNum },
      { $limit: limitNum },
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
          payment: '$payments',
          customer: { $arrayElemAt: ['$customerInfo', 0] },
          silverLoan: '$_id'
        }
      }
    ];

    const repayments = await SilverLoan.aggregate(aggregate);

    const totalCount = await SilverLoan.aggregate([
      { $match: filter },
      { $unwind: '$payments' },
      { $match: match },
      { $count: 'total' }
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: repayments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount: total,
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

    const loan = await SilverLoan.findOne({'payments._id': repaymentId});
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: 'Repayment record not found'
      });
    }

    const repayment = loan.payments.id(repaymentId);

    if (repayment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Repayment is already cancelled'
      });
    }

    // Update repayment status
    repayment.status = 'CANCELLED';
    repayment.notes = (repayment.notes || '') + `\n\nCANCELLED: ${reason} (${new Date().toISOString()})`;

    // Reversal: Add back to outstanding and principal if applicable
    loan.outstandingAmount += repayment.netRepaymentAmount || repayment.interestAmount || 0;
    if (repayment.type === 'PRINCIPAL') {
      loan.currentPrincipal += repayment.principalAmount || 0;
    }

    await loan.save();

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

// Get dashboard statistics for silver loans
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await SilverLoan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalLoanAmount: { $sum: '$totalLoanAmount' },
          currentPrincipal: { $sum: '$currentPrincipal' },
          outstandingAmount: { $sum: '$outstandingAmount' },
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
      totalActivePrincipal: stats.find(s => s._id === 'ACTIVE')?.currentPrincipal || 0,
      totalActiveOutstanding: stats.find(s => s._id === 'ACTIVE')?.outstandingAmount || 0,
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

    silverLoan.accrueTo(new Date());

    // Check if can be closed
    if (silverLoan.outstandingAmount > 0 || silverLoan.currentPrincipal > 0 || silverLoan.getActiveItems().length > 0) {
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

    // Accrue for each loan before returning
    for (const loan of silverLoans) {
      loan.accrueTo(new Date());
      await loan.save();
    }

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

    silverLoan.accrueTo(new Date());
    await silverLoan.save();

    const outstandingAmount = silverLoan.outstandingAmount;
    const outstandingInterest = outstandingAmount - silverLoan.currentPrincipal;

    res.json({
      success: true,
      data: {
        ...silverLoan.toObject(),
        loanSummary: silverLoan.getLoanSummary(),
        outstandingInterest,
        outstandingAmount
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

    if (!mongoose.Types.ObjectId.isValid(customerId) ) {
      return res.status(400).json({ success: false, error: 'Invalid customer ID format' });
    }

    const silverLoans = await SilverLoan.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    // Accrue for each
    for (const loan of silverLoans) {
      loan.accrueTo(new Date());
      await loan.save();
    }

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

    silverLoan.accrueTo(new Date());
    await silverLoan.save();

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
          currentPrincipal: silverLoan.currentPrincipal,
          outstandingAmount: silverLoan.outstandingAmount,
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

// Get all transactions related to a specific silver loan
export const getLoanTransactions = async (req, res) => {
  try {
    const silverLoanId = req.params.id;

    const silverLoan = await SilverLoan.findById(silverLoanId);
    if (!silverLoan) {
      return res.status(404).json({ success: false, error: 'Silver loan not found' });
    }

    const transactions = await Transaction.find({
      relatedDoc: silverLoanId,
      relatedModel: 'SilverLoan'
    }).sort({ date: -1 }).populate('customer', 'name phone');

    res.json({
      success: true,
      data: transactions,
      summary: {
        totalTransactions: transactions.length,
        totalIncoming: transactions.reduce((sum, t) => t.direction === -1 ? sum + t.amount : sum, 0),
        totalOutgoing: transactions.reduce((sum, t) => t.direction === 1 ? sum + t.amount : sum, 0)
      }
    });
  } catch (error) {
    console.error('Get loan transactions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get daily silver loan summary
export const getDailySilverLoanSummary = async (req, res) => {
  try {
    const { date } = req.query;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dailyLoans = await SilverLoan.find({
      startDate: { $gte: start, $lte: end }
    }).populate('customer', 'name phone');

    const summary = {
      totalLoans: dailyLoans.length,
      totalAmount: dailyLoans.reduce((sum, loan) => sum + loan.totalLoanAmount, 0),
      totalItems: dailyLoans.reduce((sum, loan) => sum + loan.items.length, 0),
      totalWeight: dailyLoans.reduce((sum, loan) => sum + loan.items.reduce((wSum, item) => wSum + item.weightGram, 0), 0)
    };

    res.json({
      success: true,
      data: dailyLoans,
      summary
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get interest payments
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
      return {
        ...payment.toObject(),
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

    loan.accrueTo(new Date());
    await loan.save();

    const interestPayments = loan.payments.filter(p => p.type === 'INTEREST');
    const repayments = loan.payments.filter(p => p.type === 'PRINCIPAL');

    // Calculate totals
    const totalInterestPaid = interestPayments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
    const totalPrincipalPaid = repayments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
    const totalItemsReturned = repayments.reduce((sum, p) => sum + (p.totalItemsReturned || 0), 0);
    const totalWeightReturned = repayments.reduce((sum, p) => sum + (p.totalWeightReturned || 0), 0);

    const outstandingInterest = loan.outstandingAmount - loan.currentPrincipal;

    const summary = {
      loanDetails: {
        loanId: loan._id,
        customerName: loan.customer?.name,
        totalLoanAmount: loan.totalLoanAmount || 0,
        currentPrincipal: loan.currentPrincipal || 0,
        outstandingAmount: loan.outstandingAmount || 0,
        interestRateMonthlyPct: loan.interestRateMonthlyPct || 0,
        status: loan.status,
        startDate: loan.startDate,
        totalItems: loan.items?.length || 0,
        remainingItems: loan.items?.filter(item => !item.returnDate).length || 0,
        outstandingInterest,
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
        remainingPrincipal: loan.currentPrincipal || 0
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

// Get active items for return
export const getActiveItemsForReturn = async (req, res) => {
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
        totalActiveWeight: activeItems.reduce((sum, item) => sum + (item.weightGram || 0), 0)
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