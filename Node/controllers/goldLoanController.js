// controllers/goldLoanController.js - UPDATED AND CLEANED VERSION
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import GoldLoan from '../models/GoldLoan.js';
import InterestPayment from '../models/InterestPayment.js';
import Repayment from '../models/Repayment.js';
import Customer from '../models/Customer.js';

// Create new gold loan with manual amounts and enhanced validation
export const createGoldLoan = async (req, res) => {
  try {
    const { customer, items, interestRateMonthlyPct, startDate, notes } = req.body;
    
    if (!customer) {
      return res.status(400).json({ success: false, error: 'Customer is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'At least one item is required for gold loan' });
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
        name: item.name || 'Gold Item',
        weightGram: parseFloat(item.weightGram),
        loanAmount: parseFloat(item.loanAmount), // Direct amount in rupees
        purityK: parseInt(item.purityK),
        images: item.images || [],
        goldPriceAtDeposit: parseFloat(item.goldPriceAtDeposit) || 0,
        addedDate: new Date()
      };
      
      processedItems.push(processedItem);
      totalPrincipal += processedItem.loanAmount;
    }

    const goldLoan = new GoldLoan({
      customer,
      items: processedItems,
      interestRateMonthlyPct: parseFloat(interestRateMonthlyPct),
      totalLoanAmount: totalPrincipal,
      currentLoanAmount: totalPrincipal, // Track remaining loan amount
      startDate: startDate || new Date(),
      status: 'ACTIVE',
      notes
    });

    await goldLoan.save();
   
    // Create transaction record for loan disbursement
    const transaction = new Transaction({
      type: 'GOLD_LOAN_GIVEN',
      customer: goldLoan.customer,
      amount: totalPrincipal,
      direction: 1, // outgoing
      description: `Gold loan disbursed - ${goldLoan.items.length} items - ₹${totalPrincipal}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
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
      data: goldLoan,
      message: `Gold loan created successfully. Total amount: ₹${totalPrincipal}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Add interest payment - Updated to handle partial payments and validations
export const addInterestPayment = async (req, res) => {
  try {
    const { loanId } = req.params;
    const {
      interestAmount,
      paymentDate,
      paymentMethod,
      forMonth,
      referenceNumber,
      chequeNumber,
      bankName,
      chequeDate,
      photos,
      notes,
      recordedBy
    } = req.body;

    // Validate loan exists
    const loan = await GoldLoan.findById(loanId).populate('customer');
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }

    // Validate required fields
    if (!interestAmount || interestAmount <= 0) {
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
      if (!chequeNumber || !bankName || !chequeDate) {
        return res.status(400).json({ success: false, error: 'Cheque details are required' });
      }
    }
    if (['NET_BANKING', 'UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentMethod)) {
      if (!referenceNumber) {
        return res.status(400).json({ success: false, error: 'Reference number is required for digital payments' });
      }
    }

    // Calculate interest details
    const monthlyInterest = (loan.currentLoanAmount * loan.interestRateMonthlyPct) / 100;
    const [year, month] = forMonth.split('-');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const forMonthName = monthNames[parseInt(month) - 1];

    // Find existing payments for this month using string format
    const existingPayments = await InterestPayment.find({
      goldLoan: loanId,
      forMonth: forMonth // Use string format "YYYY-MM"
    });
    
    const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.interestAmount, 0);
    const remainingInterest = Math.max(0, monthlyInterest - totalPaid);

    // Validate interest amount doesn't exceed remaining interest
    if (interestAmount > remainingInterest) {
      return res.status(400).json({
        success: false,
        error: `Interest amount cannot exceed remaining interest due (₹${remainingInterest.toLocaleString()})`
      });
    }

    // Create new interest payment with all required fields
    const interestPayment = new InterestPayment({
      goldLoan: loanId,
      customer: loan.customer._id,
      paymentDate: new Date(paymentDate),
      interestAmount: parseFloat(interestAmount),
      calculatedInterestDue: monthlyInterest,
      loanAmountAtPayment: loan.currentLoanAmount,
      paymentMethod,
      referenceNumber: referenceNumber || undefined,
      chequeNumber: chequeNumber || undefined,
      bankName: bankName || undefined,
      chequeDate: chequeDate ? new Date(chequeDate) : undefined,
      forMonth: forMonth, // Keep as string "YYYY-MM"
      forYear: parseInt(year),
      forMonthName: forMonthName,
      photos: photos || [],
      notes: notes || '',
      recordedBy: recordedBy || 'Admin',
      interestRate: loan.interestRateMonthlyPct
    });

    // Save the payment (receiptNumber will be auto-generated by pre-save hook if defined)
    const savedPayment = await interestPayment.save();

    // Update loan with latest payment (for backward compatibility)
    loan.payments.push({
      date: savedPayment.paymentDate,
      principalAmount: 0,
      interestAmount: savedPayment.interestAmount,
      forMonth: savedPayment.forMonth,
      forYear: savedPayment.forYear,
      forMonthName: savedPayment.forMonthName,
      photos: savedPayment.photos,
      notes: savedPayment.notes,
      currentLoanAmountAtPayment: loan.currentLoanAmount,
      currentLoanAmountAfterPayment: loan.currentLoanAmount // No change for interest payment
    });
    loan.lastInterestPayment = savedPayment.paymentDate;
    await loan.save();

    // Create transaction record
    const interestTransaction = new Transaction({
      type: 'GOLD_LOAN_INTEREST_RECEIVED',
      customer: loan.customer._id,
      amount: savedPayment.interestAmount,
      direction: -1, // incoming
      description: `Interest payment - ${loan.customer.name} - ${forMonthName} ${year}`,
      relatedDoc: loan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'INTEREST',
        forMonth: forMonth,
        monthlyInterestDue: monthlyInterest,
        paymentMethod,
        interestPaymentId: savedPayment._id,
        photos: savedPayment.photos
      }
    });
    await interestTransaction.save();

    res.status(200).json({
      success: true,
      data: savedPayment,
      interestSummary: {
        monthlyInterest,
        totalPaidForMonth: totalPaid + parseFloat(interestAmount),
        remainingInterest: Math.max(0, remainingInterest - parseFloat(interestAmount))
      }
    });
  } catch (error) {
    console.error('Error in addInterestPayment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get interest payments for a loan
export const getInterestPayments = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { page = 1, limit = 50, fromDate, toDate, status } = req.query;
    
    // Verify loan exists
    const loan = await GoldLoan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan not found' });
    }
    
    const query = { goldLoan: loanId };
    
    if (fromDate || toDate) {
      query.paymentDate = {};
      if (fromDate) query.paymentDate.$gte = new Date(fromDate);
      if (toDate) query.paymentDate.$lte = new Date(toDate);
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const payments = await InterestPayment.find(query)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('customer', 'name phone')
      .lean();

    const total = await InterestPayment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error in getInterestPayments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process repayment (principal or item return)
export const processItemRepayment = async (req, res) => {
  try {
    const { 
      repaymentAmount,
      paymentMethod = 'CASH',
      repaymentDate,
      repaymentType = 'PARTIAL_PRINCIPAL',
      currentGoldPrice,
      referenceNumber,
      chequeNumber,
      bankName,
      chequeDate,
      selectedItemIds = [],
      photos = [], 
      notes,
      recordedBy = 'Admin',
      processingFee = 0,
      lateFee = 0,
      adjustmentAmount = 0,
      adjustmentReason,
      interestPaidWithRepayment = 0,
      interestPeriodCovered
    } = req.body;

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    if (goldLoan.status !== 'ACTIVE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot process repayment for inactive loan' 
      });
    }

    const finalRepaymentAmount = parseFloat(repaymentAmount) || 0;
    const finalCurrentGoldPrice = parseFloat(currentGoldPrice) || 0;
    const netRepaymentAmount = finalRepaymentAmount - 
      (parseFloat(processingFee) || 0) - 
      (parseFloat(lateFee) || 0) + 
      (parseFloat(adjustmentAmount) || 0);

    if (finalRepaymentAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Repayment amount must be greater than zero' 
      });
    }

    // Get items to return (if applicable)
    let itemsToReturn = [];
    let totalItemValue = 0;
    let totalWeight = 0;
    let totalMarketValue = 0;

    const currentLoanAmountBefore = goldLoan.currentLoanAmount || goldLoan.totalLoanAmount || 0;

    // Process different repayment types
    if (repaymentType === 'ITEM_RETURN' && selectedItemIds.length > 0) {
      itemsToReturn = goldLoan.items.filter(item => 
        selectedItemIds.includes(item._id.toString()) && !item.returnDate
      );

      if (itemsToReturn.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No valid items selected for return' 
        });
      }

      // Calculate total value of items to return
      totalItemValue = itemsToReturn.reduce((sum, item) => sum + (item.loanAmount || 0), 0);

      if (netRepaymentAmount < totalItemValue) {
        return res.status(400).json({
          success: false,
          error: `Net repayment amount (₹${netRepaymentAmount.toLocaleString()}) is insufficient to return selected items (₹${totalItemValue.toLocaleString()} required)`
        });
      }

      // Mark items as returned
      itemsToReturn.forEach(item => {
        let currentValue = item.loanAmount;
        if (finalCurrentGoldPrice > 0) {
          currentValue = (item.weightGram * finalCurrentGoldPrice * item.purityK) / 24;
        }
        
        item.returnDate = new Date();
        item.returnImages = photos;
        item.goldPriceAtReturn = finalCurrentGoldPrice;
        item.returnValue = currentValue;
        item.returnNotes = notes || `Returned on ${new Date().toDateString()}`;
        
        totalWeight += item.weightGram;
        totalMarketValue += currentValue;
      });

      // Reduce loan amount by item value
      goldLoan.currentLoanAmount = Math.max(0, currentLoanAmountBefore - totalItemValue);

    } else if (repaymentType === 'PARTIAL_PRINCIPAL') {
      if (netRepaymentAmount > currentLoanAmountBefore) {
        return res.status(400).json({
          success: false,
          error: `Net repayment amount (₹${netRepaymentAmount.toLocaleString()}) exceeds remaining loan amount (₹${currentLoanAmountBefore.toLocaleString()})`
        });
      }
      // Reduce loan amount by payment amount
      goldLoan.currentLoanAmount = Math.max(0, currentLoanAmountBefore - netRepaymentAmount);

    } else if (repaymentType === 'FULL_PRINCIPAL' || repaymentType === 'LOAN_CLOSURE') {
      if (netRepaymentAmount < currentLoanAmountBefore) {
        return res.status(400).json({
          success: false,
          error: `Net repayment amount (₹${netRepaymentAmount.toLocaleString()}) is insufficient for full payment (₹${currentLoanAmountBefore.toLocaleString()} required)`
        });
      }
      
      // Full payment - return all remaining items and close loan
      goldLoan.currentLoanAmount = 0;
      goldLoan.items.forEach(item => {
        if (!item.returnDate) {
          item.returnDate = new Date();
          item.returnImages = photos;
          item.goldPriceAtReturn = finalCurrentGoldPrice;
          item.returnValue = (item.weightGram * finalCurrentGoldPrice * item.purityK) / 24 || item.loanAmount;
          item.returnNotes = notes || `Returned on full payment ${new Date().toDateString()}`;
          totalItemValue += item.loanAmount;
          totalWeight += item.weightGram;
          totalMarketValue += item.returnValue;
          itemsToReturn.push(item);
        }
      });
    }

    const loanAmountAfter = goldLoan.currentLoanAmount;

    // FIXED: Determine if loan should be closed
    const shouldCloseLoan = (
      repaymentType === 'FULL_PRINCIPAL' || 
      repaymentType === 'LOAN_CLOSURE' || 
      (loanAmountAfter <= 0 && goldLoan.items.filter(item => !item.returnDate).length === 0)
    );

    // FIXED: Update loan status properly
    if (shouldCloseLoan) {
      goldLoan.status = 'CLOSED';
      goldLoan.closureDate = new Date();
      goldLoan.currentLoanAmount = 0;
    }

    // Create repayment record
    const repayment = new Repayment({
      goldLoan: req.params.id,
      customer: goldLoan.customer._id,
      repaymentDate: repaymentDate ? new Date(repaymentDate) : new Date(),
      repaymentAmount: finalRepaymentAmount,
      loanAmountBeforeRepayment: currentLoanAmountBefore,
      loanAmountAfterRepayment: loanAmountAfter,
      paymentMethod,
      referenceNumber,
      chequeNumber,
      bankName,
      chequeDate: chequeDate ? new Date(chequeDate) : null,
      repaymentType,
      returnedItems: itemsToReturn.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        purityK: item.purityK,
        originalLoanAmount: item.loanAmount,
        returnValue: item.returnValue || item.loanAmount,
        goldPriceAtReturn: finalCurrentGoldPrice,
        returnImages: photos
      })),
      totalItemsReturned: itemsToReturn.length,
      totalWeightReturned: totalWeight,
      currentGoldPrice: finalCurrentGoldPrice,
      totalMarketValueAtReturn: totalMarketValue,
      photos,
      notes: notes || `${repaymentType.replace(/_/g, ' ')} processed`,
      loanStatusBefore: 'ACTIVE',
      loanStatusAfter: goldLoan.status,
      isLoanClosed: shouldCloseLoan,
      recordedBy,
      processingFee: parseFloat(processingFee) || 0,
      lateFee: parseFloat(lateFee) || 0,
      adjustmentAmount: parseFloat(adjustmentAmount) || 0,
      adjustmentReason,
      interestPaidWithRepayment: parseFloat(interestPaidWithRepayment) || 0,
      interestPeriodCovered
    });

    await repayment.save();

    // Update loan payments array (for backward compatibility)
    const currentDate = new Date();
    const forMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    goldLoan.payments.push({
      date: currentDate,
      principalAmount: netRepaymentAmount, // Use net amount for loan reduction
      interestAmount: parseFloat(interestPaidWithRepayment) || 0,
      forMonth,
      forYear: currentDate.getFullYear(),
      forMonthName: monthName,
      photos,
      notes: notes || `${repaymentType.replace(/_/g, ' ')} - ${itemsToReturn.length} items returned`,
      itemsReturned: repayment.returnedItems,
      repaymentAmount: finalRepaymentAmount,
      currentLoanAmountAtPayment: currentLoanAmountBefore,
      currentLoanAmountAfterPayment: loanAmountAfter
    });

    await goldLoan.save();

    // FIXED: Create only ONE transaction record
    const repaymentTransaction = new Transaction({
      type: shouldCloseLoan ? 'GOLD_LOAN_CLOSURE' : 'GOLD_LOAN_REPAYMENT',
      customer: goldLoan.customer._id,
      amount: finalRepaymentAmount,
      direction: -1, // incoming
      description: shouldCloseLoan 
        ? `Gold loan closed - Full payment by ${goldLoan.customer.name}`
        : `Gold loan repayment - ${repaymentType.replace(/_/g, ' ')} - ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME',
      metadata: {
        paymentType: (parseFloat(interestPaidWithRepayment) || 0) > 0 ? 'COMBINED' : 'PRINCIPAL',
        repaymentType,
        itemCount: itemsToReturn.length,
        totalWeight: totalWeight,
        goldPriceUsed: finalCurrentGoldPrice,
        repaymentId: repayment._id,
        isLoanClosed: shouldCloseLoan,
        netAmount: netRepaymentAmount,
        processingFee: parseFloat(processingFee) || 0,
        lateFee: parseFloat(lateFee) || 0,
        adjustmentAmount: parseFloat(adjustmentAmount) || 0,
        photos
      },
      affectedItems: itemsToReturn.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        value: item.loanAmount,
        action: 'RETURNED'
      }))
    });
    await repaymentTransaction.save();

    const remainingItems = goldLoan.items.filter(item => !item.returnDate);

    // FIXED: Return proper status message
    const statusMessage = shouldCloseLoan 
      ? 'Loan completed and closed successfully!' 
      : repaymentType === 'ITEM_RETURN'
      ? `Repayment processed. ${itemsToReturn.length} items returned. Remaining loan: ₹${loanAmountAfter.toLocaleString()}`
      : `Partial payment processed. Remaining loan: ₹${loanAmountAfter.toLocaleString()}`;

    res.json({ 
      success: true, 
      data: repayment,
      goldLoan: goldLoan,
      repaymentSummary: {
        receiptNumber: repayment.receiptNumber,
        repaymentAmount: finalRepaymentAmount,
        netRepaymentAmount: netRepaymentAmount,
        itemsReturned: itemsToReturn.length,
        totalItemLoanValue: totalItemValue,
        totalMarketValue: totalMarketValue,
        remainingItems: remainingItems.length,
        remainingLoanAmount: loanAmountAfter,
        loanStatus: goldLoan.status,
        isLoanClosed: shouldCloseLoan,
        returnedItems: itemsToReturn.map(item => ({
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          originalLoanAmount: item.loanAmount,
          returnValue: item.returnValue || item.loanAmount,
          goldPriceAtReturn: item.goldPriceAtReturn
        })),
        newMonthlyInterest: loanAmountAfter > 0 ? 
          (loanAmountAfter * goldLoan.interestRateMonthlyPct) / 100 : 0
      },
      message: statusMessage
    });
  } catch (error) {
    console.error('Repayment processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};// Get all repayments for a loan with enhanced summary
export const getRepayments = async (req, res) => {
  try {
    const goldLoanId = req.params.id;
    const { page = 1, limit = 10, repaymentType, status, startDate, endDate } = req.query;

    // Validate gold loan exists
    const goldLoan = await GoldLoan.findById(goldLoanId).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gold loan not found' 
      });
    }

    // Build query filter
    const filter = { goldLoan: goldLoanId };
    
    if (repaymentType) {
      filter.repaymentType = repaymentType;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.repaymentDate = {};
      if (startDate) {
        filter.repaymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.repaymentDate.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get repayments with pagination
    const [repayments, totalCount] = await Promise.all([
      Repayment.find(filter)
        .populate('customer', 'name phone email')
        .sort({ repaymentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Repayment.countDocuments(filter)
    ]);

    // Calculate aggregated data
    const aggregateData = await Repayment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRepayments: { $sum: '$repaymentAmount' },
          totalItemsReturned: { $sum: '$totalItemsReturned' },
          totalWeightReturned: { $sum: '$totalWeightReturned' },
          totalInterestPaid: { $sum: '$interestPaidWithRepayment' },
          averageRepaymentAmount: { $avg: '$repaymentAmount' },
          repaymentsByMethod: {
            $push: {
              method: '$paymentMethod',
              amount: '$repaymentAmount'
            }
          },
          repaymentsByType: {
            $push: {
              type: '$repaymentType',
              amount: '$repaymentAmount',
              itemCount: '$totalItemsReturned'
            }
          }
        }
      }
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNext = pageNum < totalPages;
    const hasPrev = pageNum > 1;

    // Process repayment data for response
    const processedRepayments = repayments.map(repayment => ({
      ...repayment,
      netRepaymentAmount: repayment.repaymentAmount - 
        (repayment.processingFee || 0) - 
        (repayment.lateFee || 0) + 
        (repayment.adjustmentAmount || 0),
      isFullRepayment: repayment.loanAmountAfterRepayment <= 0 || repayment.isLoanClosed,
      principalReduced: repayment.loanAmountBeforeRepayment - repayment.loanAmountAfterRepayment,
      formattedRepaymentDate: new Date(repayment.repaymentDate).toLocaleDateString('en-IN'),
      formattedCreatedAt: new Date(repayment.createdAt).toLocaleDateString('en-IN')
    }));

    const responseData = {
      success: true,
      data: processedRepayments,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext,
        hasPrev,
        nextPage: hasNext ? pageNum + 1 : null,
        prevPage: hasPrev ? pageNum - 1 : null
      },
      summary: {
        loanId: goldLoanId,
        customerName: goldLoan.customer?.name,
        totalRepaymentRecords: totalCount,
        aggregateData: aggregateData.length > 0 ? aggregateData[0] : {
          totalRepayments: 0,
          totalItemsReturned: 0,
          totalWeightReturned: 0,
          totalInterestPaid: 0,
          averageRepaymentAmount: 0,
          repaymentsByMethod: [],
          repaymentsByType: []
        }
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('Get repayments error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch repayments' 
    });
  }
};

// Get repayment statistics for a loan
export const getRepaymentStats = async (req, res) => {
  try {
    const goldLoanId = req.params.id;
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
          goldLoan: new mongoose.Types.ObjectId(goldLoanId),
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
    const goldLoanId = req.params.id;
    const repaymentData = req.body;

    const goldLoan = await GoldLoan.findById(goldLoanId).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Gold loan not found' 
      });
    }

    // Validation logic
    const validations = [];
    
    // Check if loan is active
    if (goldLoan.status !== 'ACTIVE') {
      validations.push({
        field: 'loanStatus',
        message: 'Loan is not active',
        severity: 'error'
      });
    }

    // Check selected items
    if (repaymentData.selectedItemIds && repaymentData.selectedItemIds.length > 0) {
      const availableItems = goldLoan.items.filter(item => !item.returnDate);
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

      if (amount > goldLoan.currentLoanAmount) {
        validations.push({
          field: 'repaymentAmount',
          message: 'Repayment amount cannot exceed outstanding loan amount',
          severity: 'warning'
        });
      }
    }

    // Check gold price
    if (repaymentData.currentGoldPrice) {
      const goldPrice = parseFloat(repaymentData.currentGoldPrice);
      if (goldPrice <= 0 || goldPrice > 10000) {
        validations.push({
          field: 'currentGoldPrice',
          message: 'Gold price seems unrealistic',
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
          id: goldLoan._id,
          status: goldLoan.status,
          currentAmount: goldLoan.currentLoanAmount,
          availableItems: goldLoan.items.filter(item => !item.returnDate).length
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
      .populate('goldLoan', 'startDate totalLoanAmount interestRateMonthlyPct')
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
      .populate('goldLoan')
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
        id: repayment.goldLoan._id,
        startDate: repayment.goldLoan.startDate,
        interestRate: repayment.goldLoan.interestRateMonthlyPct
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
        .populate('goldLoan', '_id totalLoanAmount')
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

    // TODO: Add reversal logic if needed (e.g., update goldLoan.currentLoanAmount, item returnDate, etc.)
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

// Get current gold price (mock or integrate with API)
export const getCurrentGoldPrice = async (req, res) => {
  try {
    // TODO: Integrate with real gold price API if needed
    const currentPrice = {
      pricePerGram: 6500, // Example value; replace with real data
      lastUpdated: new Date().toISOString(),
      source: 'internal',
      currency: 'INR'
    };

    res.json({
      success: true,
      data: currentPrice
    });

  } catch (error) {
    console.error('Get gold price error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// Get all gold loans with pagination and filters
export const getAllGoldLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer } = req.query;
    const query = {};
   
    if (status) query.status = status;
    if (customer) query.customer = customer;

    const goldLoans = await GoldLoan.find(query)
      .populate('customer', 'name phone email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await GoldLoan.countDocuments(query);

    res.json({
      success: true,
      data: goldLoans,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get gold loan by ID with full summary
export const getGoldLoanById = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Calculate summary information
    const totalInterestPaid = goldLoan.payments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
    const totalPrincipalPaid = goldLoan.payments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
    const activeItems = goldLoan.items.filter(item => !item.returnDate);
    const returnedItems = goldLoan.items.filter(item => item.returnDate);
    
    const monthlyInterest = goldLoan.currentLoanAmount > 0 ? 
      (goldLoan.currentLoanAmount * goldLoan.interestRateMonthlyPct) / 100 : 0;

    const loanSummary = {
      totalLoanAmount: goldLoan.totalLoanAmount,
      currentLoanAmount: goldLoan.currentLoanAmount,
      totalInterestPaid,
      totalPrincipalPaid,
      monthlyInterestDue: monthlyInterest,
      activeItemsCount: activeItems.length,
      returnedItemsCount: returnedItems.length,
      totalItems: goldLoan.items.length
    };

    res.json({ 
      success: true, 
      data: {
        ...goldLoan.toObject(),
        loanSummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get gold loans by customer ID
export const getGoldLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid customer ID format' 
      });
    }

    const goldLoans = await GoldLoan.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });
    
    const loansWithSummary = goldLoans.map(loan => {
      const totalPrincipalPaid = loan.payments.reduce((sum, p) => sum + (p.principalAmount || 0), 0);
      const totalInterestPaid = loan.payments.reduce((sum, p) => sum + (p.interestAmount || 0), 0);
      
      return {
        ...loan.toObject(),
        summary: {
          totalPrincipalPaid,
          totalInterestPaid,
          currentLoanAmount: loan.currentLoanAmount,
          monthlyInterest: loan.currentLoanAmount > 0 ? 
            (loan.currentLoanAmount * loan.interestRateMonthlyPct) / 100 : 0
        }
      };
    });

    res.json({ 
      success: true, 
      data: loansWithSummary 
    });
  } catch (error) {
    console.error('Error fetching gold loans by customer:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get dashboard statistics for gold loans
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await GoldLoan.aggregate([
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

    const recentPayments = await GoldLoan.aggregate([
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

// Close gold loan manually (if all conditions met)
export const closeGoldLoan = async (req, res) => {
  try {
    const { closureImages = [], notes } = req.body;

    const goldLoan = await GoldLoan.findById(req.params.id).populate("customer");
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: "Gold loan not found" });
    }

    if (goldLoan.status === "CLOSED") {
      return res.status(400).json({ success: false, error: "Loan is already closed" });
    }

    // Check if can be closed
    if (goldLoan.currentLoanAmount > 0 || goldLoan.getActiveItems().length > 0) {
      return res.status(400).json({ success: false, error: "Cannot close loan with outstanding amount or items" });
    }

    // Mark as closed
    const currentDate = new Date();
    goldLoan.status = "CLOSED";
    goldLoan.closureDate = currentDate;
    goldLoan.closureImages = closureImages;
    if (notes) goldLoan.notes = notes;

    await goldLoan.save();

    const closureTransaction = new Transaction({
      type: "GOLD_LOAN_CLOSURE",
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0,
      description: `Gold loan closed - all items returned to ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: "GoldLoan",
      category: "CLOSURE",
    });
    await closureTransaction.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      message: "Gold loan closed successfully."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment history for a loan (combined interest and repayments)
export const getPaymentHistory = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const payments = goldLoan.payments
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
        paymentType: payment.principalAmount > 0 ? 'PRINCIPAL' : 'INTEREST',
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
          id: goldLoan._id,
          customerName: goldLoan.customer.name,
          totalLoanAmount: goldLoan.totalLoanAmount,
          currentLoanAmount: goldLoan.currentLoanAmount,
          interestRate: goldLoan.interestRateMonthlyPct,
          status: goldLoan.status
        },
        payments,
        paymentSummary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Get all transactions related to a specific gold loan
export const getLoanTransactions = async (req, res) => {
  try {
    const goldLoanId = req.params.id;

    // Validate gold loan exists
    const goldLoan = await GoldLoan.findById(goldLoanId);
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const transactions = await Transaction.find({
      relatedDoc: goldLoanId,
      relatedModel: 'GoldLoan'
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

// NEW: Get daily gold loan summary (loans given on a specific day)
export const getDailyGoldLoanSummary = async (req, res) => {
  try {
    const { date } = req.query; // Expect date in YYYY-MM-DD format
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const dailyLoans = await GoldLoan.find({
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