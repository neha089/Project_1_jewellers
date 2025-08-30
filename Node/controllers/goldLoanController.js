import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';
import GoldLoan from '../models/GoldLoan.js';
// Create new gold loan
export const createGoldLoan = async (req, res) => {
  try {
    const goldLoan = new GoldLoan(req.body);
    await goldLoan.save();
   
    // Create transaction record for loan disbursement
    const transaction = new Transaction({
      type: 'GOLD_LOAN_GIVEN',
      customer: goldLoan.customer,
      amount: goldLoan.principalPaise,
      direction: 1, // outgoing
      description: `Gold loan given - ${goldLoan.items.length} items`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Calculate monthly interest for a loan
export const calculateInterest = async (req, res) => {
  try {
    const { interestRate, principalAmount } = req.query;
    
    if (!interestRate || !principalAmount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest rate and principal amount are required' 
      });
    }

    const principal = parseFloat(principalAmount);
    const rate = parseFloat(interestRate);
    
    if (isNaN(principal) || isNaN(rate) || principal <= 0 || rate < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid principal amount or interest rate' 
      });
    }

    const monthlyInterest = Math.round((principal * rate) / 100);
    
    res.json({
      success: true,
      data: {
        principalAmount: principal,
        interestRateMonthlyPct: rate,
        monthlyInterestAmount: monthlyInterest,
        calculation: `${principal} × ${rate}% = ₹${(monthlyInterest / 100).toFixed(2)}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add interest/principal payment (combined)
export const addPayment = async (req, res) => {
  try {
    const { principalPaise = 0, interestPaise = 0, photos = [], forMonth, notes } = req.body;
   
    if (!forMonth) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment month (forMonth) is required in YYYY-MM format' 
      });
    }

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Parse month info
    const [year, month] = forMonth.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(month) - 1];

    // Add payment record
    goldLoan.payments.push({
      date: new Date(),
      principalPaise,
      interestPaise,
      forMonth,
      forYear: parseInt(year),
      forMonthName: monthName,
      photos,
      notes
    });

    // Check if loan is fully paid
    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    if (totalPaid >= goldLoan.principalPaise) {
      goldLoan.status = 'CLOSED';
    }

    await goldLoan.save();

    // Create transaction records for income tracking
    if (principalPaise > 0) {
      const principalTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer._id,
        amount: principalPaise,
        direction: -1, // incoming
        description: `Principal payment for ${monthName} ${year} - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await principalTransaction.save();
    }

    if (interestPaise > 0) {
      const interestTransaction = new Transaction({
        type: 'GOLD_LOAN_INTEREST_RECEIVED',
        customer: goldLoan.customer._id,
        amount: interestPaise,
        direction: -1, // incoming
        description: `Interest for ${monthName} ${year} - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await interestTransaction.save();
    }

    res.json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Add interest-only payment
export const addInterestPayment = async (req, res) => {
  try {
    const { interestPaise, photos = [], notes } = req.body;
   
    if (!interestPaise || interestPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest amount is required and must be greater than 0' 
      });
    }

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Get current month
    const currentDate = new Date();
    const forMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    // Add interest-only payment
    goldLoan.payments.push({
      date: new Date(),
      principalPaise: 0,
      interestPaise,
      forMonth,
      forYear: currentDate.getFullYear(),
      forMonthName: monthName,
      photos,
      notes: notes || 'Interest payment received'
    });

    await goldLoan.save();

    // Create transaction record
    const interestTransaction = new Transaction({
      type: 'GOLD_LOAN_INTEREST_RECEIVED',
      customer: goldLoan.customer._id,
      amount: interestPaise,
      direction: -1, // incoming
      description: `Interest received from ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME'
    });
    await interestTransaction.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      message: `Interest payment of ₹${(interestPaise / 100).toFixed(2)} recorded successfully`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Add items to existing gold loan
export const addItems = async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Items array is required' 
      });
    }

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    if (goldLoan.status === 'CLOSED' || goldLoan.status === 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot add items to a closed or completed loan' 
      });
    }

    // Validate and add items
    const newItems = items.map(item => ({
      name: item.name || 'Gold Item',
      weightGram: parseFloat(item.weightGram),
      amountPaise: Math.round(parseFloat(item.amount) * 100),
      purityK: parseInt(item.purityK),
      images: item.images || [],
      addedDate: new Date()
    }));

    goldLoan.items.push(...newItems);
    
    // Update principal amount
    const additionalAmount = newItems.reduce((sum, item) => sum + item.amountPaise, 0);
    goldLoan.principalPaise += additionalAmount;

    await goldLoan.save();

    // Create transaction for additional amount
    if (additionalAmount > 0) {
      const transaction = new Transaction({
        type: 'GOLD_LOAN_ADDITION',
        customer: goldLoan.customer._id,
        amount: additionalAmount,
        direction: 1, // outgoing
        description: `Additional items added to loan - ${newItems.length} items (₹${(additionalAmount / 100).toFixed(2)})`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'EXPENSE'
      });
      await transaction.save();
    }

    res.json({ 
      success: true, 
      data: goldLoan,
      addedItems: newItems,
      message: `Successfully added ${newItems.length} items worth ₹${(additionalAmount / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Update specific item
export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const goldLoan = await GoldLoan.findById(req.params.id);
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const item = goldLoan.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // Update item properties
    if (updateData.name) item.name = updateData.name;
    if (updateData.weightGram) item.weightGram = parseFloat(updateData.weightGram);
    if (updateData.purityK) item.purityK = parseInt(updateData.purityK);
    if (updateData.images) item.images = updateData.images;
    if (updateData.amountPaise) item.amountPaise = Math.round(parseFloat(updateData.amount) * 100);

    await goldLoan.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      updatedItem: item,
      message: 'Item updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Remove specific item
export const removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const item = goldLoan.items.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (goldLoan.status === 'CLOSED' || goldLoan.status === 'COMPLETED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot remove items from a closed or completed loan' 
      });
    }

    const removedAmount = item.amountPaise;
    item.remove();

    // Update principal amount
    goldLoan.principalPaise -= removedAmount;

    await goldLoan.save();

    // Create transaction for removed amount
    const transaction = new Transaction({
      type: 'GOLD_LOAN_ITEM_REMOVAL',
      customer: goldLoan.customer._id,
      amount: removedAmount,
      direction: -1, // incoming (reducing our liability)
      description: `Item removed from loan - ${item.name} (₹${(removedAmount / 100).toFixed(2)})`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME'
    });
    await transaction.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      removedAmount,
      message: `Item removed successfully. Loan amount reduced by ₹${(removedAmount / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// NEW: Complete gold loan (customer returns all money, gets gold back)
export const completeGoldLoan = async (req, res) => {
  try {
    const { finalPayment = 0, photos = [], notes } = req.body;
    
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    if (goldLoan.status === 'COMPLETED' || goldLoan.status === 'CLOSED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Loan is already completed or closed' 
      });
    }

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // If there's a final payment, record it
    if (finalPayment > 0) {
      const finalPaymentPaise = Math.round(parseFloat(finalPayment) * 100);
      
      goldLoan.payments.push({
        date: currentDate,
        principalPaise: finalPaymentPaise,
        interestPaise: 0,
        forMonth: currentMonth,
        forYear: currentDate.getFullYear(),
        forMonthName: currentDate.toLocaleString('default', { month: 'long' }),
        photos,
        notes: notes || 'Final payment - loan completion'
      });

      // Create transaction for final payment
      const finalPaymentTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer._id,
        amount: finalPaymentPaise,
        direction: -1, // incoming
        description: `Final payment - loan completion - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await finalPaymentTransaction.save();
    }

    // Mark loan as completed
    goldLoan.status = 'COMPLETED';
    goldLoan.completionDate = currentDate;
    if (photos.length > 0) goldLoan.completionImages = photos;

    // Mark all items as returned
    goldLoan.items.forEach(item => {
      if (!item.returnDate) {
        item.returnDate = currentDate;
        item.returnImages = photos;
      }
    });

    await goldLoan.save();

    // Create completion transaction
    const completionTransaction = new Transaction({
      type: 'GOLD_LOAN_COMPLETION',
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0, // neutral
      description: `Gold loan completed - All money returned, gold items returned to ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'COMPLETION'
    });
    await completionTransaction.save();

    res.json({ 
      success: true, 
      data: goldLoan,
      message: 'Gold loan completed successfully. Customer has received their gold back.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Validate if loan can be closed
export const validateLoanClosure = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    const outstanding = goldLoan.principalPaise - totalPaid;
    
    const canClose = outstanding <= 0;
    
    res.json({
      success: true,
      data: {
        canClose,
        outstandingAmount: outstanding,
        totalPrincipal: goldLoan.principalPaise,
        totalPaid,
        message: canClose 
          ? 'Loan can be closed' 
          : `Cannot close loan. Outstanding amount: ₹${(outstanding / 100).toFixed(2)}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// NEW: Get outstanding summary
export const getOutstandingSummary = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const totalPrincipalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    const totalInterestReceived = goldLoan.payments.reduce((sum, payment) => sum + payment.interestPaise, 0);
    const outstandingPrincipal = goldLoan.principalPaise - totalPrincipalPaid;
    
    // Calculate pending interest
    const monthlyInterest = goldLoan.calculateMonthlyInterest();
    const startDate = new Date(goldLoan.startDate);
    const currentDate = new Date();
    const monthsElapsed = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - startDate.getMonth()) + 1;
    
    const totalInterestDue = monthsElapsed * monthlyInterest;
    const pendingInterest = Math.max(0, totalInterestDue - totalInterestReceived);

    res.json({
      success: true,
      data: {
        loan: {
          id: goldLoan._id,
          customer: goldLoan.customer.name,
          status: goldLoan.status
        },
        principal: {
          original: goldLoan.principalPaise,
          paid: totalPrincipalPaid,
          outstanding: outstandingPrincipal
        },
        interest: {
          monthlyRate: goldLoan.interestRateMonthlyPct,
          monthlyAmount: monthlyInterest,
          monthsElapsed,
          totalDue: totalInterestDue,
          received: totalInterestReceived,
          pending: pendingInterest
        },
        canComplete: outstandingPrincipal <= 0,
        summary: {
          totalOutstanding: outstandingPrincipal + pendingInterest,
          readyForClosure: outstandingPrincipal <= 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all gold loans with filtering
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

// Get single gold loan with complete details
export const getGoldLoanById = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Add payment history organized by month
    const paymentsByMonth = goldLoan.getPaymentsByMonth ? goldLoan.getPaymentsByMonth() : [];

    res.json({ 
      success: true, 
      data: {
        ...goldLoan.toObject(),
        paymentsByMonth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get detailed loan report - all data including payment history
export const getLoanReport = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Calculate monthly interest breakdown
    const startDate = new Date(goldLoan.startDate);
    const currentDate = goldLoan.status === 'CLOSED' || goldLoan.status === 'COMPLETED' ? 
                        new Date(goldLoan.closureDate || goldLoan.completionDate) : new Date();
    
    const monthlyBreakdown = [];
    const monthlyInterest = goldLoan.calculateMonthlyInterest();
    
    let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (current <= currentDate) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const monthName = current.toLocaleString('default', { month: 'long' });
      const year = current.getFullYear();
      
      // Find payment for this month
      const payment = goldLoan.payments.find(p => p.forMonth === monthKey);
      
      monthlyBreakdown.push({
        month: monthKey,
        monthName,
        year,
        interestDue: monthlyInterest,
        interestPaid: payment ? payment.interestPaise : 0,
        principalPaid: payment ? payment.principalPaise : 0,
        paymentDate: payment ? payment.date : null,
        isPaid: !!payment,
        isDelayed: !payment && current < new Date(),
        payment: payment || null
      });
      
      current.setMonth(current.getMonth() + 1);
    }

    const report = {
      loanDetails: goldLoan.toObject(),
      monthlyBreakdown,
      summary: {
        totalInterestDue: monthlyBreakdown.reduce((sum, m) => sum + m.interestDue, 0),
        totalInterestReceived: goldLoan.payments.reduce((sum, p) => sum + p.interestPaise, 0),
        pendingInterest: monthlyBreakdown
          .filter(m => !m.isPaid && m.month <= new Date().toISOString().substr(0, 7))
          .reduce((sum, m) => sum + m.interestDue, 0),
        totalMonths: monthlyBreakdown.length,
        paidMonths: monthlyBreakdown.filter(m => m.isPaid).length,
        delayedMonths: monthlyBreakdown.filter(m => m.isDelayed).length
      }
    };

    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Close loan and return all items (when principal is paid but items returned)
// closeGoldLoan.js
export const closeGoldLoan = async (req, res) => {
  try {
    const { closureImages = [], notes } = req.body;

    const goldLoan = await GoldLoan.findById(req.params.id).populate("customer");
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: "Gold loan not found" });
    }

    if (goldLoan.status === "CLOSED" || goldLoan.status === "COMPLETED") {
      return res.status(400).json({ success: false, error: "Loan is already closed or completed" });
    }

    // Check if principal is fully paid
    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    const outstanding = goldLoan.principalPaise - totalPaid;

    if (outstanding > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot close loan. Outstanding principal: ₹${(outstanding / 100).toFixed(2)}`
      });
    }

    // Update loan status
    goldLoan.status = "CLOSED";
    goldLoan.closureDate = new Date();
    goldLoan.closureImages = closureImages;
    if (notes) goldLoan.notes = notes;

    // Mark all items as returned
    goldLoan.items.forEach((item) => {
      if (!item.returnDate) {
        item.returnDate = new Date();
        item.returnImages = closureImages; // Same images for all items
      }
    });

    await goldLoan.save();

    // Create closure transaction
    const closureTransaction = new Transaction({
      type: "GOLD_LOAN_CLOSURE",
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0, // neutral
      description: `Gold loan closed - ${goldLoan.items.length} items returned to ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: "GoldLoan",
      category: "CLOSURE",
    });
    await closureTransaction.save();

    res.json({ success: true, data: goldLoan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Get comprehensive loan summary for a customer
export const getCustomerLoanSummary = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const loans = await GoldLoan.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });

    const summary = {
      customer: loans[0]?.customer,
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
      closedLoans: loans.filter(l => l.status === 'CLOSED').length,
      completedLoans: loans.filter(l => l.status === 'COMPLETED').length,
      totalPrincipalGiven: loans.reduce((sum, l) => sum + l.principalPaise, 0),
      totalInterestReceived: loans.reduce((sum, l) => 
        sum + l.payments.reduce((pSum, p) => pSum + p.interestPaise, 0), 0),
      currentOutstanding: loans
        .filter(l => l.status === 'ACTIVE')
        .reduce((sum, l) => {
          const totalPaid = l.payments.reduce((pSum, p) => pSum + p.principalPaise, 0);
          return sum + (l.principalPaise - totalPaid);
        }, 0),
      currentPendingInterest: loans
        .filter(l => l.status === 'ACTIVE')
        .reduce((sum, l) => {
          const monthlyInterest = l.calculateMonthlyInterest();
          const startDate = new Date(l.startDate);
          const currentDate = new Date();
          const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - startDate.getMonth()) + 1;
          const totalDue = months * monthlyInterest;
          const received = l.payments.reduce((pSum, p) => pSum + p.interestPaise, 0);
          return sum + Math.max(0, totalDue - received);
        }, 0),
      loans: loans.map(loan => ({
        ...loan.toObject(),
        paymentsByMonth: loan.getPaymentsByMonth ? loan.getPaymentsByMonth() : []
      }))
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// Add these missing functions to your goldLoanController.js

// Get all payment history across all gold loans
export const getAllPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, startDate, endDate } = req.query;
    
    // Build match criteria
    const matchCriteria = {};
    if (customerId) {
      matchCriteria.customer = new mongoose.Types.ObjectId(customerId);
    }

    // Date filtering for payments
    let paymentDateFilter = {};
    if (startDate || endDate) {
      paymentDateFilter = {};
      if (startDate) paymentDateFilter.$gte = new Date(startDate);
      if (endDate) paymentDateFilter.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchCriteria },
      { $unwind: '$payments' },
      ...(Object.keys(paymentDateFilter).length > 0 ? 
        [{ $match: { 'payments.date': paymentDateFilter } }] : []),
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
          loanId: '$_id',
          customer: { $arrayElemAt: ['$customerInfo.name', 0] },
          customerPhone: { $arrayElemAt: ['$customerInfo.phone', 0] },
          paymentDate: '$payments.date',
          principalPaid: '$payments.principalPaise',
          interestPaid: '$payments.interestPaise',
          totalAmount: { $add: ['$payments.principalPaise', '$payments.interestPaise'] },
          forMonth: '$payments.forMonthName',
          forYear: '$payments.forYear',
          notes: '$payments.notes',
          photos: '$payments.photos'
        }
      },
      { $sort: { paymentDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    const payments = await GoldLoan.aggregate(pipeline);
    
    // Get total count for pagination
    const countPipeline = [
      { $match: matchCriteria },
      { $unwind: '$payments' },
      ...(Object.keys(paymentDateFilter).length > 0 ? 
        [{ $match: { 'payments.date': paymentDateFilter } }] : []),
      { $count: 'total' }
    ];
    
    const countResult = await GoldLoan.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    res.json({
      success: true,
      data: payments,
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

// Get gold loans by customer ID
export const getGoldLoansByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid customer ID format' 
      });
    }

    const goldLoans = await GoldLoan.find({ customer: customerId })
      .populate('customer', 'name phone email')
      .sort({ createdAt: -1 });
    
    // Add payment summaries for each loan
    const loansWithSummary = goldLoans.map(loan => {
      const totalPrincipalPaid = loan.payments.reduce((sum, p) => sum + p.principalPaise, 0);
      const totalInterestReceived = loan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
      const outstandingPrincipal = loan.principalPaise - totalPrincipalPaid;
      
      return {
        ...loan.toObject(),
        summary: {
          totalPrincipalPaid,
          totalInterestReceived,
          outstandingPrincipal,
          isFullyPaid: outstandingPrincipal <= 0
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
export const getGoldLoanByIdCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const loan = await GoldLoan.findOne({ customer: customerId });
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }
    res.json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get pending interest for all active loans
export const getPendingInterest = async (req, res) => {
  try {
    const activeLoans = await GoldLoan.find({ status: 'ACTIVE' })
      .populate('customer', 'name phone');

    const pendingData = activeLoans.map(loan => {
      const monthlyInterest = loan.calculateMonthlyInterest();
      
      // Calculate months from start to now
      const startDate = new Date(loan.startDate);
      const currentDate = new Date();
      const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - startDate.getMonth()) + 1;
      
      const totalInterestDue = months * monthlyInterest;
      const interestReceived = loan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
      const pendingInterest = Math.max(0, totalInterestDue - interestReceived);
      
      return {
        loanId: loan._id,
        customer: loan.customer,
        principalAmount: loan.principalPaise,
        interestRate: loan.interestRateMonthlyPct,
        monthlyInterest,
        monthsElapsed: months,
        totalInterestDue,
        interestReceived,
        pendingInterest,
        lastPaymentDate: loan.payments.length > 0 ? 
          loan.payments[loan.payments.length - 1].date : null
      };
    });

    // Sort by highest pending interest
    pendingData.sort((a, b) => b.pendingInterest - a.pendingInterest);

    const totalPending = pendingData.reduce((sum, item) => sum + item.pendingInterest, 0);

    res.json({
      success: true,
      data: {
        totalPendingInterest: totalPending,
        totalActiveLoans: activeLoans.length,
        loanDetails: pendingData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Return specific items (partial return)
export const returnItems = async (req, res) => {
  try {
    const { itemIds, returnImages = [], notes } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item IDs array is required' 
      });
    }

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Mark specified items as returned
    let returnedItems = [];
    goldLoan.items.forEach(item => {
      if (itemIds.includes(item._id.toString()) && !item.returnDate) {
        item.returnDate = new Date();
        item.returnImages = returnImages;
        returnedItems.push(item);
      }
    });

    if (returnedItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid items found to return' 
      });
    }

    await goldLoan.save();

    // Create transaction for item return
    const returnTransaction = new Transaction({
      type: 'ITEM_RETURN',
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0,
      description: `Returned ${returnedItems.length} items to ${goldLoan.customer.name}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'RETURN'
    });
    await returnTransaction.save();

    res.json({ 
      success: true, 
      data: {
        loan: goldLoan,
        returnedItems,
        message: `Successfully returned ${returnedItems.length} items`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Dashboard with overall statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await GoldLoan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrincipal: { $sum: '$principalPaise' },
          totalInterestReceived: { 
            $sum: { 
              $reduce: {
                input: '$payments',
                initialValue: 0,
                in: { $add: ['$value', '$this.interestPaise'] }
              }
            }
          }
        }
      }
    ]);

    // Get recent payments
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
          amount: { $add: ['$payments.principalPaise', '$payments.interestPaise'] },
          forMonth: '$payments.forMonthName',
          forYear: '$payments.forYear',
          principalPaise: '$payments.principalPaise',
          interestPaise: '$payments.interestPaise'
        }
      },
      { $sort: { paymentDate: -1 } },
      { $limit: 10 }
    ]);

    // Calculate business metrics
    const businessMetrics = {
      totalActivePrincipal: stats.find(s => s._id === 'ACTIVE')?.totalPrincipal || 0,
      totalInterestEarned: stats.reduce((sum, s) => sum + s.totalInterestReceived, 0),
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