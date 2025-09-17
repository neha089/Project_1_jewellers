// controllers/goldLoanController.js - SIMPLIFIED VERSION
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import GoldLoan from '../models/GoldLoan.js';

// Create new gold loan with manual amounts
export const createGoldLoan = async (req, res) => {
  try {
    const { customer, items, interestRateMonthlyPct, startDate, notes } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one item is required for gold loan' 
      });
    }

    // Process items with manual amounts (no auto-calculation)
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

// Add interest payment (monthly)
export const addInterestPayment = async (req, res) => {
  try {
    const { interestAmount, photos = [], notes, forMonth } = req.body;
   
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    if (goldLoan.status !== 'ACTIVE') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot add interest payment to inactive loan' 
      });
    }

    const receivedAmount = parseFloat(interestAmount);
    
    if (!receivedAmount || receivedAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest amount must be greater than 0' 
      });
    }

    // Calculate monthly interest based on current loan amount
    const monthlyInterestAmount = (goldLoan.currentLoanAmount * goldLoan.interestRateMonthlyPct) / 100;

    // Determine which month this payment is for
    let paymentMonth = forMonth;
    if (!paymentMonth) {
      const currentDate = new Date();
      paymentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    }

    const [year, month] = paymentMonth.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(month) - 1];

    // Create payment record
    goldLoan.payments.push({
      date: new Date(),
      principalAmount: 0,
      interestAmount: receivedAmount,
      forMonth: paymentMonth,
      forYear: parseInt(year),
      forMonthName: monthName,
      photos,
      notes: notes || 'Interest payment received',
      currentLoanAmountAtPayment: goldLoan.currentLoanAmount
    });

    await goldLoan.save();

    // Create transaction record
    const interestTransaction = new Transaction({
      type: 'GOLD_LOAN_INTEREST_RECEIVED',
      customer: goldLoan.customer._id,
      amount: receivedAmount,
      direction: -1, // incoming
      description: `Interest payment - ${goldLoan.customer.name} - ${monthName} ${year}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'INTEREST',
        forMonth: paymentMonth,
        monthlyInterestDue: monthlyInterestAmount,
        photos
      }
    });
    await interestTransaction.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      interestSummary: {
        monthlyInterestDue: monthlyInterestAmount,
        paymentAmount: receivedAmount,
        currentLoanAmount: goldLoan.currentLoanAmount,
        paymentFor: `${monthName} ${year}`
      },
      message: `Interest payment received: ₹${receivedAmount} for ${monthName} ${year}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Process item repayment (return specific items)
export const processItemRepayment = async (req, res) => {
  try {
    const { 
      repaymentAmount, 
      selectedItemIds = [], 
      currentGoldPrice,
      photos = [], 
      notes
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

    if (finalRepaymentAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Repayment amount is required' 
      });
    }

    // Get items to return
    const itemsToReturn = goldLoan.items.filter(item => 
      selectedItemIds.includes(item._id.toString()) && !item.returnDate
    );

    if (itemsToReturn.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid items selected for return' 
      });
    }

    // Calculate total value of items being returned
    let totalItemValue = 0;
    const currentDate = new Date();

    itemsToReturn.forEach(item => {
      // Calculate current value based on current gold price
      let currentValue = item.loanAmount; // Default to original loan amount
      if (finalCurrentGoldPrice > 0) {
        currentValue = (item.weightGram * finalCurrentGoldPrice * item.purityK) / 24;
      }
      
      item.returnDate = currentDate;
      item.returnImages = photos;
      item.goldPriceAtReturn = finalCurrentGoldPrice;
      item.returnValue = currentValue;
      item.returnNotes = notes || `Returned on ${currentDate.toDateString()}`;
      
      totalItemValue += item.loanAmount; // Use original loan amount for calculation
    });

    // Update current loan amount
    goldLoan.currentLoanAmount -= totalItemValue;

    // Create payment record
    const forMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const paymentRecord = {
      date: currentDate,
      principalAmount: finalRepaymentAmount,
      interestAmount: 0,
      forMonth,
      forYear: currentDate.getFullYear(),
      forMonthName: monthName,
      photos,
      notes: notes || `Item repayment - ${itemsToReturn.length} items returned`,
      itemsReturned: itemsToReturn.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        loanAmount: item.loanAmount,
        returnValue: item.returnValue
      })),
      repaymentAmount: finalRepaymentAmount,
      currentLoanAmountAfterPayment: goldLoan.currentLoanAmount
    };

    goldLoan.payments.push(paymentRecord);

    // Check if all items are returned
    const remainingItems = goldLoan.items.filter(item => !item.returnDate);
    if (remainingItems.length === 0 && goldLoan.currentLoanAmount <= 0) {
      goldLoan.status = 'CLOSED';
      goldLoan.closureDate = currentDate;
    }

    await goldLoan.save();

    // Create transaction record
    const repaymentTransaction = new Transaction({
      type: 'GOLD_LOAN_PAYMENT',
      customer: goldLoan.customer._id,
      amount: finalRepaymentAmount,
      direction: -1, // incoming
      description: `Gold loan repayment - ${itemsToReturn.length} items returned - ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'PRINCIPAL',
        itemCount: itemsToReturn.length,
        totalWeight: itemsToReturn.reduce((sum, item) => sum + item.weightGram, 0),
        goldPriceUsed: finalCurrentGoldPrice,
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

    res.json({ 
      success: true, 
      data: goldLoan,
      repaymentSummary: {
        repaymentAmount: finalRepaymentAmount,
        itemsReturned: itemsToReturn.length,
        totalItemLoanValue: totalItemValue,
        remainingItems: remainingItems.length,
        remainingLoanAmount: goldLoan.currentLoanAmount,
        loanStatus: goldLoan.status,
        returnedItems: itemsToReturn.map(item => ({
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          originalLoanAmount: item.loanAmount,
          returnValue: item.returnValue || item.loanAmount,
          goldPriceAtReturn: item.goldPriceAtReturn
        })),
        newMonthlyInterest: goldLoan.currentLoanAmount > 0 ? 
          (goldLoan.currentLoanAmount * goldLoan.interestRateMonthlyPct) / 100 : 0
      },
      message: goldLoan.status === 'CLOSED' ? 
        'Loan completed - all items returned' : 
        `${itemsToReturn.length} items returned. Remaining loan: ₹${goldLoan.currentLoanAmount}`
    });
  } catch (error) {
    console.error('Repayment processing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all gold loans with pagination
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

// Get gold loan by ID
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

// Get loans by customer
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

// Get dashboard statistics
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

// Close gold loan (all money returned, return all items)
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

    // Mark all unreturned items as returned
    const currentDate = new Date();
    goldLoan.items.forEach((item) => {
      if (!item.returnDate) {
        item.returnDate = currentDate;
        item.returnImages = closureImages;
        item.returnNotes = notes || 'Loan closure - all money repaid';
      }
    });

    goldLoan.status = "CLOSED";
    goldLoan.closureDate = currentDate;
    goldLoan.closureImages = closureImages;
    goldLoan.currentLoanAmount = 0; // All money repaid
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
      message: "Gold loan closed successfully. All items returned to customer."
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get payment history for a loan
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
        paymentType: payment.principalAmount > 0 ? 'Principal' : 'Interest',
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