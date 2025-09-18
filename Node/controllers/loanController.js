import Udhar from '../models/Udhar.js';
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';

// Helper function to get customer name
const getCustomerName = async (customerId) => {
  try {
    const Customer = mongoose.model('Customer');
    const customer = await Customer.findById(customerId).select('name');
    return customer?.name || 'Unknown Customer';
  } catch (error) {
    console.warn('Could not fetch customer name:', error.message);
    return 'Unknown Customer';
  }
};

// Give Udhar (Lend money to someone)
export const giveUdhar = async (req, res) => {
  try {
    console.log('=== GIVE UDHAR ===');
    console.log('Request body:', req.body);

    const { 
      customer, 
      principalPaise, 
      note, 
      totalInstallments = 1, 
      dueDate, 
      paymentMethod = 'CASH' 
    } = req.body;

    // Validation
    if (!customer || !principalPaise) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer and principal amount are required' 
      });
    }

    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }

    const udhar = new Udhar({
      customer,
      udharType: 'GIVEN',
      principalPaise,
      direction: -1, // outgoing - you are giving money
      sourceType: 'UDHAR',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedUdhar = await udhar.save();

    // Create transaction record for the udhar disbursement
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'UDHAR_GIVEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: -1, // outgoing
      description: `Udhar given to ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedUdhar._id,
      relatedModel: 'Udhar',
      category: 'EXPENSE',
      date: new Date(),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalUdharAmount: principalPaise / 100,
        totalInstallments
      }
    });

    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Udhar given successfully',
      data: {
        ...savedUdhar.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in giveUdhar:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Take Udhar (Borrow money from someone)
export const takeUdhar = async (req, res) => {
  try {
    console.log('=== TAKE UDHAR ===');
    console.log('Request body:', req.body);

    const { 
      customer, 
      principalPaise, 
      note, 
      totalInstallments = 1, 
      dueDate, 
      paymentMethod = 'CASH' 
    } = req.body;

    // Validation
    if (!customer || !principalPaise) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer and principal amount are required' 
      });
    }

    if (principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Principal amount must be greater than zero' 
      });
    }

    const udhar = new Udhar({
      customer,
      udharType: 'TAKEN',
      principalPaise,
      direction: 1, // incoming - you are receiving money
      sourceType: 'UDHAR',
      note,
      outstandingPrincipal: principalPaise,
      totalInstallments,
      dueDate: dueDate ? new Date(dueDate) : null,
      takenDate: new Date(),
      paymentHistory: [],
      paymentMethod,
      status: 'ACTIVE',
      isActive: true
    });

    const savedUdhar = await udhar.save();

    // Create transaction record for udhar received
    const customerName = await getCustomerName(customer);
    const transaction = new Transaction({
      type: 'UDHAR_TAKEN',
      customer,
      amount: principalPaise / 100, // Store in rupees
      direction: 1, // incoming
      description: `Udhar taken from ${customerName} - ${note || 'No note'}`,
      relatedDoc: savedUdhar._id,
      relatedModel: 'Udhar',
      category: 'INCOME',
      date: new Date(),
      metadata: {
        paymentType: 'DISBURSEMENT',
        paymentMethod,
        originalUdharAmount: principalPaise / 100,
        totalInstallments
      }
    });

    const savedTransaction = await transaction.save();
    console.log('Transaction record saved:', savedTransaction._id);

    res.status(201).json({ 
      success: true, 
      message: 'Udhar taken successfully',
      data: {
        ...savedUdhar.toObject(),
        principalRupees: principalPaise / 100,
        outstandingRupees: principalPaise / 100,
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in takeUdhar:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Receive Udhar Payment (Principal only)
export const receiveUdharPayment = async (req, res) => {
  try {
    console.log('=== RECEIVE UDHAR PAYMENT ===');
    console.log('Request body:', req.body);

    const { 
      udharId,
      principalPaise = 0, 
      note, 
      installmentNumber,
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Validation
    if (!udharId || principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Udhar ID and principal amount are required' 
      });
    }

    // Find the udhar
    const udhar = await Udhar.findById(udharId).populate('customer', 'name phone email');
    if (!udhar) {
      return res.status(404).json({
        success: false,
        error: 'Udhar not found'
      });
    }

    if (udhar.udharType !== 'GIVEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only receive payment for udhar that was given'
      });
    }

    if (udhar.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'This udhar has already been fully paid'
      });
    }

    // Validate amount
    if (principalPaise > udhar.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(2)} exceeds outstanding ₹${(udhar.outstandingPrincipal/100).toFixed(2)}`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(udhar.customer._id);

    // Add payment to history
    const paymentEntry = {
      principalAmount: principalPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || (udhar.paymentHistory.length + 1),
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    udhar.paymentHistory.push(paymentEntry);

    // Update udhar amounts
    udhar.outstandingPrincipal = Math.max(0, udhar.outstandingPrincipal - principalPaise);
    udhar.lastPaymentDate = transactionDate;
    udhar.paidInstallments = udhar.paymentHistory.length;

    // Update udhar status
    const isFullyPaid = udhar.outstandingPrincipal <= 0;
    udhar.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
    udhar.isActive = !isFullyPaid;

    const updatedUdhar = await udhar.save();

    // Create transaction record
    const transaction = new Transaction({
      type: isFullyPaid ? 'UDHAR_CLOSURE' : 'UDHAR_PAYMENT',
      customer: udhar.customer._id,
      amount: principalPaise / 100,
      direction: 1, // incoming
      description: `Principal payment from ${customerName} - ${note || 'Payment received'}`,
      relatedDoc: udhar._id,
      relatedModel: 'Udhar',
      category: 'INCOME',
      date: transactionDate,
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod,
        paymentReference: reference,
        bankTransactionId: transactionId,
        installmentNumber: installmentNumber || udhar.paymentHistory.length,
        remainingAmount: udhar.outstandingPrincipal / 100,
        isFullPayment: isFullyPaid
      }
    });

    const savedTransaction = await transaction.save();

    const totalPaidPrincipal = udhar.principalPaise - udhar.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / udhar.principalPaise) * 100);

    res.status(200).json({
      success: true,
      message: isFullyPaid ? 'Udhar fully paid and settled!' : 'Payment received successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          date: transactionDate,
          installmentNumber: installmentNumber || udhar.paymentHistory.length,
          note: note || ''
        },
        udharSummary: {
          originalAmount: udhar.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          remainingOutstanding: udhar.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid,
          totalInstallments: udhar.totalInstallments,
          paidInstallments: udhar.paymentHistory.length
        },
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in receiveUdharPayment:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process udhar payment'
    });
  }
};

// Make Udhar Payment (When you return money you borrowed)
export const makeUdharPayment = async (req, res) => {
  try {
    console.log('=== MAKE UDHAR PAYMENT ===');
    console.log('Request body:', req.body);

    const { 
      udharId,
      principalPaise = 0, 
      note, 
      installmentNumber,
      paymentDate,
      paymentMethod = 'CASH',
      reference = '',
      transactionId = ''
    } = req.body;

    // Validation
    if (!udharId || principalPaise <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Udhar ID and principal amount are required' 
      });
    }

    // Find the udhar
    const udhar = await Udhar.findById(udharId).populate('customer', 'name phone email');
    if (!udhar) {
      return res.status(404).json({
        success: false,
        error: 'Udhar not found'
      });
    }

    if (udhar.udharType !== 'TAKEN') {
      return res.status(400).json({
        success: false,
        error: 'Can only make payment for udhar that was taken'
      });
    }

    if (udhar.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        error: 'This udhar has already been fully paid'
      });
    }

    // Validate amount
    if (principalPaise > udhar.outstandingPrincipal) {
      return res.status(400).json({
        success: false,
        error: `Principal payment ₹${(principalPaise/100).toFixed(2)} exceeds outstanding ₹${(udhar.outstandingPrincipal/100).toFixed(2)}`
      });
    }

    const transactionDate = paymentDate ? new Date(paymentDate) : new Date();
    const customerName = await getCustomerName(udhar.customer._id);

    // Add payment to history
    const paymentEntry = {
      principalAmount: principalPaise,
      date: transactionDate,
      installmentNumber: installmentNumber || (udhar.paymentHistory.length + 1),
      note: note || '',
      paymentMethod,
      paymentReference: reference,
      bankTransactionId: transactionId
    };

    udhar.paymentHistory.push(paymentEntry);

    // Update udhar amounts
    udhar.outstandingPrincipal = Math.max(0, udhar.outstandingPrincipal - principalPaise);
    udhar.lastPaymentDate = transactionDate;
    udhar.paidInstallments = udhar.paymentHistory.length;

    // Update udhar status
    const isFullyPaid = udhar.outstandingPrincipal <= 0;
    udhar.status = isFullyPaid ? 'CLOSED' : 'PARTIALLY_PAID';
    udhar.isActive = !isFullyPaid;

    const updatedUdhar = await udhar.save();

    // Create transaction record
    const transaction = new Transaction({
      type: isFullyPaid ? 'UDHAR_CLOSURE' : 'UDHAR_PAYMENT',
      customer: udhar.customer._id,
      amount: principalPaise / 100,
      direction: -1, // outgoing
      description: `Principal payment to ${customerName} - ${note || 'Payment made'}`,
      relatedDoc: udhar._id,
      relatedModel: 'Udhar',
      category: 'EXPENSE',
      date: transactionDate,
      metadata: {
        paymentType: 'PRINCIPAL',
        paymentMethod,
        paymentReference: reference,
        bankTransactionId: transactionId,
        installmentNumber: installmentNumber || udhar.paymentHistory.length,
        remainingAmount: udhar.outstandingPrincipal / 100,
        isFullPayment: isFullyPaid
      }
    });

    const savedTransaction = await transaction.save();

    const totalPaidPrincipal = udhar.principalPaise - udhar.outstandingPrincipal;
    const paymentPercentage = Math.round((totalPaidPrincipal / udhar.principalPaise) * 100);

    res.status(200).json({ 
      success: true, 
      message: isFullyPaid ? 'Udhar fully paid!' : 'Payment made successfully',
      data: {
        payment: {
          principalAmount: principalPaise / 100,
          date: transactionDate,
          installmentNumber: installmentNumber || udhar.paymentHistory.length,
          note: note || ''
        },
        udharSummary: {
          originalAmount: udhar.principalPaise / 100,
          totalPrincipalPaid: totalPaidPrincipal / 100,
          remainingOutstanding: udhar.outstandingPrincipal / 100,
          paymentPercentage,
          isFullyPaid,
          totalInstallments: udhar.totalInstallments,
          paidInstallments: udhar.paymentHistory.length
        },
        transactionId: savedTransaction._id
      }
    });
  } catch (error) {
    console.error('Error in makeUdharPayment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Get Customer Udhar Summary
export const getCustomerUdharSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const udhars = await Udhar.find({ customer: customerId, sourceType: 'UDHAR' })
      .populate('customer', 'name phone email')
      .sort({ takenDate: -1 });

    let totalGiven = 0;
    let totalTaken = 0;
    let outstandingToCollect = 0;
    let outstandingToPay = 0;

    const givenUdhars = [];
    const takenUdhars = [];

    udhars.forEach(udhar => {
      if (udhar.udharType === 'GIVEN') {
        totalGiven += udhar.principalPaise;
        outstandingToCollect += udhar.outstandingPrincipal;
        givenUdhars.push(udhar);
      } else if (udhar.udharType === 'TAKEN') {
        totalTaken += udhar.principalPaise;
        outstandingToPay += udhar.outstandingPrincipal;
        takenUdhars.push(udhar);
      }
    });

    const netAmount = outstandingToCollect - outstandingToPay;

    const relatedTransactions = await Transaction.find({
      customer: customerId,
      type: { $in: ['UDHAR_GIVEN', 'UDHAR_TAKEN', 'UDHAR_PAYMENT', 'UDHAR_CLOSURE'] }
    }).sort({ date: -1 });

    const summary = {
      customer: udhars[0]?.customer,
      totalGiven: totalGiven / 100,
      totalTaken: totalTaken / 100,
      outstandingToCollect: outstandingToCollect / 100,
      outstandingToPay: outstandingToPay / 100,
      netAmount: netAmount / 100,
      udhars: {
        given: givenUdhars,
        taken: takenUdhars,
        all: udhars
      },
      transactionHistory: relatedTransactions
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error in getCustomerUdharSummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Payment History for a Specific Udhar
export const getPaymentHistory = async (req, res) => {
  try {
    const { udharId } = req.params;

    const originalUdhar = await Udhar.findById(udharId)
      .populate('customer', 'name phone email');

    if (!originalUdhar) {
      return res.status(404).json({
        success: false,
        message: 'Udhar transaction not found'
      });
    }

    // Format payment history
    const formattedPaymentHistory = (originalUdhar.paymentHistory || []).map(payment => ({
      principalAmount: payment.principalAmount / 100,
      date: payment.date,
      installmentNumber: payment.installmentNumber,
      note: payment.note,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      bankTransactionId: payment.bankTransactionId
    }));

    // Get related Transaction records
    const relatedTransactions = await Transaction.find({
      relatedDoc: udharId
    }).sort({ date: 1 });

    res.json({
      success: true,
      data: {
        originalUdhar: {
          ...originalUdhar.toObject(),
          originalAmount: originalUdhar.principalPaise / 100,
          outstandingBalance: originalUdhar.outstandingPrincipal / 100
        },
        paymentHistory: formattedPaymentHistory,
        relatedTransactions,
        summary: {
          originalAmount: originalUdhar.principalPaise / 100,
          totalPrincipalPaid: (originalUdhar.principalPaise - originalUdhar.outstandingPrincipal) / 100,
          outstandingBalance: originalUdhar.outstandingPrincipal / 100,
          paymentCount: formattedPaymentHistory.length,
          isCompleted: originalUdhar.status === 'CLOSED'
        }
      }
    });
  } catch (error) {
    console.error('Error in getPaymentHistory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Outstanding Amounts to Collect
export const getOutstandingToCollect = async (req, res) => {
  try {
    const outstandingUdhars = await Udhar.find({
      udharType: 'GIVEN',
      status: { $ne: 'CLOSED' },
      outstandingPrincipal: { $gt: 0 }
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToCollect = 0;

    outstandingUdhars.forEach(udhar => {
      const customerId = udhar.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: udhar.customer,
          udhars: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].udhars.push({
        ...udhar.toObject(),
        originalAmount: udhar.principalPaise / 100,
        outstandingAmount: udhar.outstandingPrincipal / 100
      });
      customerWise[customerId].totalOutstanding += udhar.outstandingPrincipal;
      totalToCollect += udhar.outstandingPrincipal;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100
    }));

    res.json({
      success: true,
      data: {
        totalToCollect: totalToCollect / 100,
        customerCount: formattedCustomerWise.length,
        udharCount: outstandingUdhars.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    console.error('Error in getOutstandingToCollect:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Outstanding Amounts to Pay
export const getOutstandingToPay = async (req, res) => {
  try {
    const outstandingUdhars = await Udhar.find({
      udharType: 'TAKEN',
      status: { $ne: 'CLOSED' },
      outstandingPrincipal: { $gt: 0 }
    })
      .populate('customer', 'name phone email address')
      .sort({ takenDate: -1 });

    // Group by customer
    const customerWise = {};
    let totalToPay = 0;

    outstandingUdhars.forEach(udhar => {
      const customerId = udhar.customer._id.toString();
      if (!customerWise[customerId]) {
        customerWise[customerId] = {
          customer: udhar.customer,
          udhars: [],
          totalOutstanding: 0
        };
      }
      customerWise[customerId].udhars.push({
        ...udhar.toObject(),
        originalAmount: udhar.principalPaise / 100,
        outstandingAmount: udhar.outstandingPrincipal / 100
      });
      customerWise[customerId].totalOutstanding += udhar.outstandingPrincipal;
      totalToPay += udhar.outstandingPrincipal;
    });

    // Format customer-wise data
    const formattedCustomerWise = Object.values(customerWise).map(item => ({
      ...item,
      totalOutstanding: item.totalOutstanding / 100
    }));

    res.json({
      success: true,
      data: {
        totalToPay: totalToPay / 100,
        customerCount: formattedCustomerWise.length,
        udharCount: outstandingUdhars.length,
        customerWise: formattedCustomerWise
      }
    });
  } catch (error) {
    console.error('Error in getOutstandingToPay:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Overall Udhar Summary
export const getOverallUdharSummary = async (req, res) => {
  try {
    const summary = await Udhar.aggregate([
      {
        $match: { sourceType: 'UDHAR' },
        $group: {
          _id: '$udharType',
          totalAmount: { $sum: '$principalPaise' },
          totalOutstanding: { $sum: '$outstandingPrincipal' },
          count: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] }
          }
        }
      }
    ]);

    const formattedSummary = {
      given: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 },
      taken: { totalAmount: 0, totalOutstanding: 0, count: 0, completedCount: 0 }
    };

    summary.forEach(item => {
      if (item._id === 'GIVEN') {
        formattedSummary.given = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          count: item.count,
          completedCount: item.completedCount
        };
      } else if (item._id === 'TAKEN') {
        formattedSummary.taken = {
          totalAmount: item.totalAmount / 100,
          totalOutstanding: item.totalOutstanding / 100,
          count: item.count,
          completedCount: item.completedCount
        };
      }
    });

    const netOutstanding = formattedSummary.given.totalOutstanding - formattedSummary.taken.totalOutstanding;

    res.json({
      success: true,
      data: {
        ...formattedSummary,
        totalToCollect: formattedSummary.given.totalOutstanding,
        totalToPay: formattedSummary.taken.totalOutstanding,
        netOutstanding: netOutstanding,
        totalUdhars: formattedSummary.given.count + formattedSummary.taken.count
      }
    });
  } catch (error) {
    console.error('Error in getOverallUdharSummary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Udhar Reminders (Overdue Payments)
export const getUdharReminders = async (req, res) => {
  try {
    const { days = 0 } = req.query;
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + parseInt(days));

    const overdueUdhars = await Udhar.find({
      status: { $in: ['ACTIVE', 'PARTIALLY_PAID'] },
      isActive: true,
      dueDate: { $lte: checkDate }
    }).populate('customer', 'name phone email');

    const reminders = overdueUdhars.map(udhar => {
      const daysOverdue = Math.ceil((new Date() - udhar.dueDate) / (1000 * 60 * 60 * 24));
      const status = daysOverdue > 60 ? 'CRITICAL' : 'OVERDUE';

      return {
        udharId: udhar._id,
        customer: udhar.customer,
        udharType: udhar.udharType,
        principalAmount: udhar.principalPaise / 100,
        outstandingPrincipal: udhar.outstandingPrincipal / 100,
        daysOverdue,
        status,
        dueDate: udhar.dueDate,
        lastPaymentDate: udhar.lastPaymentDate,
        reminderMessage: `Dear ${udhar.customer.name}, your udhar of ₹${(udhar.outstandingPrincipal / 100).toFixed(2)} is ${status.toLowerCase()} since ${udhar.dueDate.toISOString().split('T')[0]}.`
      };
    });

    res.json({
      success: true,
      data: reminders,
      summary: {
        totalReminders: reminders.length,
        criticalReminders: reminders.filter(r => r.status === 'CRITICAL').length,
        overdueReminders: reminders.filter(r => r.status === 'OVERDUE').length,
        totalPendingAmount: reminders.reduce((sum, r) => sum + r.outstandingPrincipal, 0)
      }
    });
  } catch (error) {
    console.error('Error in getUdharReminders:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark Reminder as Sent
export const markReminderSent = async (req, res) => {
  try {
    const udharId = req.params.id;

    const udhar = await Udhar.findByIdAndUpdate(
      udharId,
      {
        reminderSent: true,
        lastReminderDate: new Date()
      },
      { new: true }
    );

    if (!udhar) {
      return res.status(404).json({
        success: false,
        error: 'Udhar not found'
      });
    }

    res.json({
      success: true,
      data: udhar,
      message: 'Reminder marked as sent'
    });
  } catch (error) {
    console.error('Error in markReminderSent:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};
