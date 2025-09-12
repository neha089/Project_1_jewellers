// controllers/goldLoanController.js
import Transaction from '../models/Transaction.js';
import mongoose from 'mongoose';
import GoldLoan from '../models/GoldLoan.js';
import { GoldPriceService } from '../utils/goldloanservice.js';
// controllers/goldLoanController.js - COMPLETE ENHANCED VERSION

// Create new gold loan with auto-calculated amounts based on current gold prices
export const createGoldLoan = async (req, res) => {
  try {
    const { customer, items, interestRateMonthlyPct, startDate, dueDate, notes } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one item is required for gold loan' 
      });
    }

    // Auto-calculate amounts for items based on current gold prices
    const processedItems = [];
    let totalPrincipalPaise = 0;
    const currentPrices = await GoldPriceService.fetchCurrentGoldPrices();

    for (const item of items) {
      if (!item.weightGram || !item.purityK) {
        return res.status(400).json({ 
          success: false, 
          error: `Item ${item.name || 'Unknown'} is missing weight or purity information` 
        });
      }

      // Auto-calculate amount based on current gold price
      const calculation = await GoldPriceService.calculateGoldAmount(
        parseFloat(item.weightGram), 
        parseInt(item.purityK)
      );
      
      if (calculation.success) {
        const processedItem = {
          name: item.name || 'Gold Item',
          weightGram: parseFloat(item.weightGram),
          amountPaise: Math.round(calculation.data.loanAmount * 100),
          purityK: parseInt(item.purityK),
          images: item.images || [],
          marketValuePaise: Math.round(calculation.data.marketValue * 100),
          pricePerGramUsed: calculation.data.pricePerGram,
          calculatedAt: new Date()
        };
        
        processedItems.push(processedItem);
        totalPrincipalPaise += processedItem.amountPaise;
      } else {
        return res.status(400).json({ 
          success: false, 
          error: `Failed to calculate amount for item: ${item.name}. ${calculation.error}` 
        });
      }
    }

    const goldLoan = new GoldLoan({
      customer,
      items: processedItems,
      interestRateMonthlyPct: parseFloat(interestRateMonthlyPct),
      principalPaise: totalPrincipalPaise,
      startDate: startDate || new Date(),
      dueDate: dueDate || new Date(Date.now() + (6 * 30 * 24 * 60 * 60 * 1000)),
      status: 'ACTIVE',
      notes,
      currentPrincipalPaise: totalPrincipalPaise,
      goldPriceAtCreation: {
        purity22K: currentPrices.purity22K,
        purity24K: currentPrices.purity24K,
        purity18K: currentPrices.purity18K,
        date: new Date()
      }
    });

    await goldLoan.save();
   
    // Create transaction record for loan disbursement
    const transaction = new Transaction({
      type: 'GOLD_LOAN_GIVEN',
      customer: goldLoan.customer,
      amount: goldLoan.principalPaise,
      direction: 1, // outgoing
      description: `Gold loan given - ${goldLoan.items.length} items (Auto-calculated at ₹${currentPrices.purity24K}/gram)`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'EXPENSE',
      metadata: {
        goldPrice: currentPrices.purity24K,
        weightGrams: processedItems.reduce((sum, item) => sum + item.weightGram, 0),
        itemCount: processedItems.length,
        paymentType: 'DISBURSEMENT'
      },
      affectedItems: processedItems.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        value: item.amountPaise,
        action: 'ADDED'
      }))
    });
    await transaction.save();

    res.status(201).json({ 
      success: true, 
      data: goldLoan,
      calculationDetails: {
        totalItems: processedItems.length,
        totalAmount: totalPrincipalPaise / 100,
        goldPriceUsed: currentPrices,
        calculatedAt: new Date(),
        itemBreakdown: processedItems.map(item => ({
          name: item.name,
          weight: item.weightGram,
          purity: item.purityK,
          amount: item.amountPaise / 100,
          pricePerGram: item.pricePerGramUsed
        }))
      },
      message: `Gold loan created successfully. Total amount: ₹${(totalPrincipalPaise / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Enhanced interest payment with accumulating unpaid interest (KEY FEATURE)
export const addInterestPayment = async (req, res) => {
  try {
    let { 
      interestPaise, 
      photos = [], 
      notes,
      forMonth,
      customAmount = false
    } = req.body;
   
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

    // Get current active principal (excluding returned items)
    const activeItems = goldLoan.items.filter(item => !item.returnDate);
    let currentActivePrincipal = 0;
    
    for (const item of activeItems) {
      const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
      currentActivePrincipal += calculation.success ? 
        Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
    }

    const monthlyInterestAmount = Math.round((currentActivePrincipal * goldLoan.interestRateMonthlyPct) / 100);

    // Calculate total pending interest up to current month
    const startDate = new Date(goldLoan.startDate);
    const currentDate1 = new Date();
    const monthsElapsed = (currentDate1.getFullYear() - startDate.getFullYear()) * 12 + 
                         (currentDate1.getMonth() - startDate.getMonth()) + 1;
    
    const totalInterestDue = monthsElapsed * monthlyInterestAmount;
    const totalInterestReceived = goldLoan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
    const totalPendingInterest = Math.max(0, totalInterestDue - totalInterestReceived);

    // Auto-fill with current pending interest if not provided
    if (!customAmount && (!interestPaise || interestPaise <= 0)) {
      interestPaise = totalPendingInterest;
    }

    const receivedAmount = Math.round(parseFloat(interestPaise));
    
    if (receivedAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Interest amount must be greater than 0' 
      });
    }

    // Determine which month this payment is for
    let paymentMonth = forMonth;
    if (!paymentMonth) {
      const currentDateNew = new Date();
      paymentMonth = `${currentDateNew.getFullYear()}-${String(currentDateNew.getMonth() + 1).padStart(2, '0')}`;
    }

    const [year, month] = paymentMonth.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[parseInt(month) - 1];

    // KEY LOGIC: Calculate next month's pending interest
    // If current pending = 100,000 and payment = 50,000
    // Remaining pending = 50,000
    // Next month total pending = 50,000 + monthly interest
    const remainingPendingAfterPayment = Math.max(0, totalPendingInterest - receivedAmount);
    const nextMonthTotalPending = remainingPendingAfterPayment + monthlyInterestAmount;

    // Create payment record
    goldLoan.payments.push({
      date: new Date(),
      principalPaise: 0,
      interestPaise: receivedAmount,
      forMonth: paymentMonth,
      forYear: parseInt(year),
      forMonthName: monthName,
      photos,
      notes: notes || 'Interest payment received',
      pendingAtTimeOfPayment: totalPendingInterest,
      monthlyInterestAtPayment: monthlyInterestAmount,
      activePrincipalAtPayment: currentActivePrincipal,
      remainingPendingAfterPayment: remainingPendingAfterPayment,
      nextMonthProjectedPending: nextMonthTotalPending
    });

    await goldLoan.save();

    // Create transaction record
    const interestTransaction = new Transaction({
      type: 'GOLD_LOAN_INTEREST_RECEIVED',
      customer: goldLoan.customer._id,
      amount: receivedAmount,
      direction: -1, // incoming
      description: `Interest payment - ${goldLoan.customer.name}${receivedAmount < totalPendingInterest ? ' (Partial)' : ''}`,
      relatedDoc: goldLoan._id,
      relatedModel: 'GoldLoan',
      category: 'INCOME',
      metadata: {
        paymentType: 'INTEREST',
        isPartialPayment: receivedAmount < totalPendingInterest,
        remainingPending: remainingPendingAfterPayment,
        nextMonthProjected: nextMonthTotalPending,
        photos
      }
    });
    await interestTransaction.save();

    // Get last 3 payment records for response
    const recentPayments = goldLoan.payments
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map(p => ({
        date: p.date,
        month: p.forMonthName,
        year: p.forYear,
        interestAmount: p.interestPaise / 100,
        principalAmount: p.principalPaise / 100,
        totalAmount: (p.interestPaise + p.principalPaise) / 100,
        notes: p.notes,
        daysAgo: Math.floor((new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24))
      }));

    res.json({ 
      success: true, 
      data: goldLoan,
      interestSummary: {
        monthlyInterestAmount: monthlyInterestAmount / 100,
        totalPendingBefore: totalPendingInterest / 100,
        paymentAmount: receivedAmount / 100,
        remainingPending: remainingPendingAfterPayment / 100,
        nextMonthTotalPending: nextMonthTotalPending / 100,
        currentActivePrincipal: currentActivePrincipal / 100,
        monthsElapsed,
        paymentFor: `${monthName} ${year}`,
        nextMonthInterest: monthlyInterestAmount / 100,
        accumulationLogic: `₹${(remainingPendingAfterPayment / 100).toFixed(2)} + ₹${(monthlyInterestAmount / 100).toFixed(2)} = ₹${(nextMonthTotalPending / 100).toFixed(2)}`
      },
      recentPayments,
      message: receivedAmount >= totalPendingInterest ? 
        `Full pending interest paid (₹${(receivedAmount / 100).toFixed(2)}). Next month interest: ₹${(monthlyInterestAmount / 100).toFixed(2)}` :
        `Partial payment received (₹${(receivedAmount / 100).toFixed(2)}). Next month total pending: ₹${(nextMonthTotalPending / 100).toFixed(2)}`
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Enhanced item-specific repayment with current gold price calculations (KEY FEATURE)
export const processItemRepayment = async (req, res) => {
  try {
    const { 
      repaymentAmount, 
      selectedItemIds = [], 
      photos = [], 
      notes,
      autoSelectItems = true
    } = req.body;
   
    if (!repaymentAmount || repaymentAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Repayment amount is required and must be greater than 0' 
      });
    }

    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const repaymentAmountPaise = Math.round(parseFloat(repaymentAmount) * 100);
    
    // Recalculate current values for all unreturned items
    const itemAnalysis = [];
    
    for (const item of goldLoan.items) {
      if (!item.returnDate) {
        const calculation = await GoldPriceService.calculateGoldAmount(
          item.weightGram, 
          item.purityK
        );
        
        const currentValue = calculation.success ? 
          Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
        
        const itemInfo = {
          ...item.toObject(),
          currentValuePaise: currentValue,
          originalValuePaise: item.amountPaise,
          canReturnWithPayment: repaymentAmountPaise >= currentValue,
          priceChange: currentValue - item.amountPaise,
          isSelected: selectedItemIds.includes(item._id.toString())
        };
        
        itemAnalysis.push(itemInfo);
      }
    }

    // Determine which items to return
    let itemsToReturn = [];
    let remainingPayment = repaymentAmountPaise;
    
    if (selectedItemIds.length > 0) {
      // Use specifically selected items
      itemsToReturn = itemAnalysis.filter(item => 
        selectedItemIds.includes(item._id.toString()) && 
        item.currentValuePaise <= repaymentAmountPaise
      );
    } else if (autoSelectItems) {
      // Auto-select items starting with lowest value first
      const sortedItems = [...itemAnalysis].sort((a, b) => a.currentValuePaise - b.currentValuePaise);
      
      for (const item of sortedItems) {
        if (remainingPayment >= item.currentValuePaise) {
          itemsToReturn.push(item);
          remainingPayment -= item.currentValuePaise;
        }
      }
    }

    // Calculate final amounts
    const totalReturnValue = itemsToReturn.reduce((sum, item) => sum + item.currentValuePaise, 0);
    const excessAmount = repaymentAmountPaise - totalReturnValue;

    // Update loan with payment record
    const currentDate = new Date();
    const forMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const paymentRecord = {
      date: currentDate,
      principalPaise: totalReturnValue,
      interestPaise: 0,
      forMonth,
      forYear: currentDate.getFullYear(),
      forMonthName: monthName,
      photos,
      notes: notes || `Item repayment - ${itemsToReturn.length} items returned`,
      itemsReturned: itemsToReturn.map(item => ({
        itemId: item._id,
        name: item.name,
        weightGram: item.weightGram,
        currentValue: item.currentValuePaise,
        originalValue: item.originalValuePaise
      })),
      excessAmount: excessAmount
    };

    goldLoan.payments.push(paymentRecord);

    // Mark returned items
    itemsToReturn.forEach(returnItem => {
      const loanItem = goldLoan.items.id(returnItem._id);
      if (loanItem) {
        loanItem.returnDate = currentDate;
        loanItem.returnImages = photos;
        loanItem.returnValuePaise = returnItem.currentValuePaise;
        loanItem.returnNotes = `Returned on ${currentDate.toDateString()} for ₹${(returnItem.currentValuePaise / 100).toFixed(2)}`;
      }
    });

    // Update current principal based on remaining items
    const remainingItems = goldLoan.items.filter(item => !item.returnDate);
    let newPrincipalPaise = 0;
    
    for (const item of remainingItems) {
      const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
      newPrincipalPaise += calculation.success ? 
        Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
    }
    
    goldLoan.currentPrincipalPaise = newPrincipalPaise;

    // Update loan status if all items are returned
    if (remainingItems.length === 0) {
      goldLoan.status = 'COMPLETED';
      goldLoan.completionDate = currentDate;
    }

    await goldLoan.save();

    // Create transaction records
    if (totalReturnValue > 0) {
      const repaymentTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer._id,
        amount: totalReturnValue,
        direction: -1, // incoming
        description: `Item repayment - ${itemsToReturn.length} items returned (${itemsToReturn.map(i => i.name).join(', ')})`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME',
        metadata: {
          paymentType: 'PRINCIPAL',
          itemCount: itemsToReturn.length,
          weightGrams: itemsToReturn.reduce((sum, item) => sum + item.weightGram, 0),
          photos
        },
        affectedItems: itemsToReturn.map(item => ({
          itemId: item._id,
          name: item.name,
          weightGram: item.weightGram,
          value: item.currentValuePaise,
          action: 'RETURNED'
        }))
      });
      await repaymentTransaction.save();
    }

    if (excessAmount > 0) {
      const excessTransaction = new Transaction({
        type: 'EXCESS_PAYMENT',
        customer: goldLoan.customer._id,
        amount: excessAmount,
        direction: -1,
        description: `Excess payment - ₹${(excessAmount / 100).toFixed(2)}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME',
        metadata: {
          paymentType: 'EXCESS',
          photos
        }
      });
      await excessTransaction.save();
    }

    res.json({ 
      success: true, 
      data: goldLoan,
      repaymentSummary: {
        amountPaid: repaymentAmountPaise / 100,
        itemsReturned: itemsToReturn.length,
        totalReturnValue: totalReturnValue / 100,
        excessAmount: excessAmount / 100,
        remainingItems: remainingItems.length,
        newLoanAmount: newPrincipalPaise / 100,
        returnedItems: itemsToReturn.map(item => ({
          name: item.name,
          weight: item.weightGram,
          purity: `${item.purityK}K`,
          currentValue: item.currentValuePaise / 100,
          originalValue: item.originalValuePaise / 100,
          priceChange: (item.currentValuePaise - item.originalValuePaise) / 100
        })),
        newMonthlyInterest: Math.round((newPrincipalPaise * goldLoan.interestRateMonthlyPct) / 100) / 100
      },
      message: itemsToReturn.length > 0 
        ? `${itemsToReturn.length} items returned. ${excessAmount > 0 ? `Excess: ₹${(excessAmount / 100).toFixed(2)}` : ''}`
        : 'Payment recorded but no items returned'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get repayment options with pre-filled amounts and item selection (KEY FEATURE)
export const getRepaymentOptions = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Calculate current values for all active items
    const itemOptions = [];
    let totalCurrentValue = 0;
    
    for (const item of goldLoan.items) {
      if (!item.returnDate) {
        const calculation = await GoldPriceService.calculateGoldAmount(
          item.weightGram, 
          item.purityK
        );
        
        const currentValue = calculation.success ? 
          Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
        
        itemOptions.push({
          itemId: item._id,
          name: item.name,
          weightGram: item.weightGram,
          purityK: item.purityK,
          originalValuePaise: item.amountPaise,
          currentValuePaise: currentValue,
          originalValueRupees: item.amountPaise / 100,
          currentValueRupees: currentValue / 100,
          priceChange: currentValue - item.amountPaise,
          priceChangeRupees: (currentValue - item.amountPaise) / 100,
          priceChangePercentage: ((currentValue - item.amountPaise) / item.amountPaise * 100).toFixed(2),
          images: item.images || []
        });
        
        totalCurrentValue += currentValue;
      }
    }

    // Generate pre-filled repayment scenarios
    const scenarios = [
      {
        name: 'single_lowest',
        description: 'Return single lowest value item',
        items: itemOptions.length > 0 ? 
          [itemOptions.reduce((min, item) => item.currentValuePaise < min.currentValuePaise ? item : min)] : [],
        preFilledAmount: itemOptions.length > 0 ? 
          Math.min(...itemOptions.map(i => i.currentValuePaise)) / 100 : 0
      },
      {
        name: 'single_highest',
        description: 'Return single highest value item',
        items: itemOptions.length > 0 ? 
          [itemOptions.reduce((max, item) => item.currentValuePaise > max.currentValuePaise ? item : max)] : [],
        preFilledAmount: itemOptions.length > 0 ? 
          Math.max(...itemOptions.map(i => i.currentValuePaise)) / 100 : 0
      },
      {
        name: 'multiple_low_value',
        description: 'Return multiple low-value items',
        items: itemOptions.sort((a, b) => a.currentValuePaise - b.currentValuePaise).slice(0, 3),
        preFilledAmount: itemOptions
          .sort((a, b) => a.currentValuePaise - b.currentValuePaise)
          .slice(0, 3)
          .reduce((sum, item) => sum + item.currentValuePaise, 0) / 100
      },
      {
        name: 'half_value',
        description: 'Return items worth ~50% of loan',
        items: [],
        preFilledAmount: Math.round(totalCurrentValue * 0.5) / 100
      },
      {
        name: 'full_repayment',
        description: 'Return all items (full repayment)',
        items: itemOptions,
        preFilledAmount: totalCurrentValue / 100
      }
    ];

    res.json({
      success: true,
      data: {
        loan: {
          id: goldLoan._id,
          customerName: goldLoan.customer.name,
          status: goldLoan.status,
          totalActiveItems: itemOptions.length,
          totalReturnedItems: goldLoan.items.length - itemOptions.length,
          interestRate: goldLoan.interestRateMonthlyPct
        },
        totalCurrentLoanValue: totalCurrentValue / 100,
        allItems: itemOptions,
        repaymentScenarios: scenarios,
        preFilledAmounts: {
          singleLowest: scenarios[0].preFilledAmount,
          singleHighest: scenarios[1].preFilledAmount,
          multipleItems: scenarios[2].preFilledAmount,
          halfValue: scenarios[3].preFilledAmount,
          fullValue: scenarios[4].preFilledAmount
        },
        currentGoldPrices: await GoldPriceService.fetchCurrentGoldPrices(),
        itemsByValue: {
          cheapest: itemOptions.length > 0 ? itemOptions.reduce((min, item) => item.currentValuePaise < min.currentValuePaise ? item : min) : null,
          mostExpensive: itemOptions.length > 0 ? itemOptions.reduce((max, item) => item.currentValuePaise > max.currentValuePaise ? item : max) : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get interest calculation with pre-filled amounts (KEY FEATURE)
export const getInterestCalculation = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Get current active principal (based on current gold prices)
    const activeItems = goldLoan.items.filter(item => !item.returnDate);
    let currentActivePrincipal = 0;
    
    for (const item of activeItems) {
      const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
      currentActivePrincipal += calculation.success ? 
        Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
    }

    const monthlyInterestAmount = Math.round((currentActivePrincipal * goldLoan.interestRateMonthlyPct) / 100);
    
    // Calculate accumulated pending interest
    const startDate = new Date(goldLoan.startDate);
    const currentDate = new Date();
    const monthsElapsed = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (currentDate.getMonth() - startDate.getMonth()) + 1;
    
    const totalInterestDue = monthsElapsed * monthlyInterestAmount;
    const totalInterestReceived = goldLoan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
    const totalPendingInterest = Math.max(0, totalInterestDue - totalInterestReceived);

    // Get payment history for last 3 months
    const recentPayments = goldLoan.payments
      .filter(p => p.interestPaise > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map(p => ({
        date: p.date,
        month: p.forMonthName,
        year: p.forYear,
        interestAmount: p.interestPaise / 100,
        paymentDate: p.date.toLocaleDateString('en-IN'),
        daysAgo: Math.floor((new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24)),
        notes: p.notes
      }));

    res.json({
      success: true,
      data: {
        loan: {
          id: goldLoan._id,
          customerName: goldLoan.customer.name,
          customerPhone: goldLoan.customer.phone,
          interestRate: goldLoan.interestRateMonthlyPct,
          startDate: goldLoan.startDate,
          status: goldLoan.status,
          activeItems: activeItems.length
        },
        calculation: {
          currentActivePrincipal: currentActivePrincipal / 100,
          monthlyInterestAmount: monthlyInterestAmount / 100,
          monthsElapsed,
          totalInterestDue: totalInterestDue / 100,
          totalInterestReceived: totalInterestReceived / 100,
          totalPendingInterest: totalPendingInterest / 100,
          nextMonthProjected: (totalPendingInterest + monthlyInterestAmount) / 100
        },
        preFilledAmounts: {
          currentPending: totalPendingInterest / 100,
          monthlyInterest: monthlyInterestAmount / 100,
          nextTwoMonths: (monthlyInterestAmount * 2) / 100,
          nextThreeMonths: (monthlyInterestAmount * 3) / 100
        },
        recentPayments,
        paymentContext: {
          hasPaymentHistory: recentPayments.length > 0,
          lastPaymentDate: recentPayments.length > 0 ? recentPayments[0].date : null,
          daysSinceLastPayment: recentPayments.length > 0 ? recentPayments[0].daysAgo : null,
          isOverdue: totalPendingInterest > monthlyInterestAmount,
          contextMessage: recentPayments.length > 0 ? 
            `Last payment: ₹${recentPayments[0].interestAmount} on ${recentPayments[0].paymentDate} (${recentPayments[0].daysAgo} days ago)` :
            'No previous interest payments found'
        },
        accumulationLogic: {
          formula: `If you pay ₹50,000 from pending ₹${(totalPendingInterest / 100).toFixed(2)}, next month will be ₹${((totalPendingInterest - 5000000 + monthlyInterestAmount) / 100).toFixed(2)}`,
          explanation: "Unpaid interest accumulates and gets added to next month's interest amount"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get current gold prices for auto-calculation
export const getCurrentGoldPrices = async (req, res) => {
  try {
    const prices = await GoldPriceService.fetchCurrentGoldPrices();
    res.json({ success: true, data: prices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Calculate loan amount based on weight and purity (pre-fill helper)
export const calculateLoanAmount = async (req, res) => {
  try {
    const { weightGrams, purityK, metal = 'gold' } = req.query;
    
    if (!weightGrams || !purityK) {
      return res.status(400).json({ 
        success: false, 
        error: 'Weight and purity are required' 
      });
    }

    let calculation;
    if (metal.toLowerCase() === 'silver') {
      calculation = await GoldPriceService.calculateSilverAmount(parseFloat(weightGrams));
    } else {
      calculation = await GoldPriceService.calculateGoldAmount(
        parseFloat(weightGrams), 
        parseInt(purityK)
      );
    }

    if (!calculation.success) {
      return res.status(400).json(calculation);
    }

    res.json({ 
      success: true, 
      data: {
        ...calculation.data,
        calculatedAt: new Date(),
        metal: metal.toLowerCase(),
        inputWeight: parseFloat(weightGrams),
        inputPurity: parseInt(purityK),
        preFillAmount: calculation.data.loanAmount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Calculate monthly interest for a loan (helper endpoint)
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
        annualInterestAmount: monthlyInterest * 12,
        calculation: `₹${principal.toFixed(2)} × ${rate}% = ₹${(monthlyInterest / 100).toFixed(2)} per month`,
        preFillAmount: monthlyInterest / 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Enhanced interest payment tracking with detailed history
export const getInterestPaymentHistory = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const startDate = new Date(goldLoan.startDate);
    const currentDate = new Date();
    
    // Get current active principal for interest calculations
    const activeItems = goldLoan.items.filter(item => !item.returnDate);
    let currentActivePrincipal = 0;
    
    for (const item of activeItems) {
      const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
      currentActivePrincipal += calculation.success ? 
        Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
    }

    const monthlyInterest = Math.round((currentActivePrincipal * goldLoan.interestRateMonthlyPct) / 100);
    
    // Generate month-wise interest tracking
    const interestHistory = [];
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentMonth <= currentDate) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      const monthName = currentMonth.toLocaleString('default', { month: 'long' });
      const year = currentMonth.getFullYear();
      
      // Find all payments for this month
      const monthPayments = goldLoan.payments.filter(p => p.forMonth === monthKey && p.interestPaise > 0);
      const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + p.interestPaise, 0);
      const remainingForMonth = Math.max(0, monthlyInterest - totalPaidForMonth);
      
      interestHistory.push({
        month: monthKey,
        monthName,
        year,
        interestDue: monthlyInterest,
        interestPaid: totalPaidForMonth,
        remainingAmount: remainingForMonth,
        paymentCount: monthPayments.length,
        payments: monthPayments.map(p => ({
          date: p.date,
          amount: p.interestPaise / 100,
          notes: p.notes,
          photos: p.photos,
          paymentDateFormatted: p.date.toLocaleDateString('en-IN'),
          daysAgo: Math.floor((new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24))
        })),
        status: remainingForMonth === 0 ? 'PAID' : totalPaidForMonth > 0 ? 'PARTIAL' : 'PENDING',
        isOverdue: currentMonth < new Date() && remainingForMonth > 0
      });
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Summary statistics
    const summary = {
      totalMonths: interestHistory.length,
      paidMonths: interestHistory.filter(h => h.status === 'PAID').length,
      partialMonths: interestHistory.filter(h => h.status === 'PARTIAL').length,
      pendingMonths: interestHistory.filter(h => h.status === 'PENDING').length,
      overdueMonths: interestHistory.filter(h => h.isOverdue).length,
      totalInterestDue: interestHistory.reduce((sum, h) => sum + h.interestDue, 0),
      totalInterestReceived: interestHistory.reduce((sum, h) => sum + h.interestPaid, 0),
      totalPendingInterest: interestHistory.reduce((sum, h) => sum + h.remainingAmount, 0),
      monthlyInterestAmount: monthlyInterest,
      currentActivePrincipal
    };

    // Get last 3 payments for quick reference
    const lastThreePayments = goldLoan.payments
      .filter(p => p.interestPaise > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map(p => ({
        date: p.date,
        month: p.forMonthName,
        year: p.forYear,
        amount: p.interestPaise / 100,
        paymentDateFormatted: p.date.toLocaleDateString('en-IN'),
        daysAgo: Math.floor((new Date() - new Date(p.date)) / (1000 * 60 * 60 * 24)),
        notes: p.notes
      }));

    res.json({
      success: true,
      data: {
        loan: goldLoan,
        interestHistory: interestHistory.reverse(), // Most recent first
        summary: {
          ...summary,
          monthlyInterestAmountRupees: monthlyInterest / 100,
          totalInterestDueRupees: summary.totalInterestDue / 100,
          totalInterestReceivedRupees: summary.totalInterestReceived / 100,
          totalPendingInterestRupees: summary.totalPendingInterest / 100,
          currentActivePrincipalRupees: currentActivePrincipal / 100
        },
        lastThreePayments,
        preFilledInterest: summary.totalPendingInterest / 100,
        paymentContext: {
          hasPendingAmount: summary.totalPendingInterest > 0,
          isOverdue: summary.overdueMonths > 0,
          lastPaymentInfo: lastThreePayments.length > 0 ? 
            `Last payment: ₹${lastThreePayments[0].amount} on ${lastThreePayments[0].paymentDateFormatted} (${lastThreePayments[0].daysAgo} days ago)` :
            'No previous interest payments found'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update gold prices
export const updateGoldPrices = async (req, res) => {
  try {
    const { purity22K, purity24K, purity18K, silverPrice, updatedBy = 'admin' } = req.body;
    
    const result = await GoldPriceService.updatePrices({
      purity22K: parseFloat(purity22K),
      purity24K: parseFloat(purity24K),
      purity18K: parseFloat(purity18K),
      silverPrice: parseFloat(silverPrice),
      updatedBy,
      source: 'manual'
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({ 
      success: true, 
      data: result.data,
      message: 'Gold prices updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Rest of the controller functions remain the same...
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

export const getGoldLoanById = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

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
export const addPayment = async (req, res) => {
  try {
    const { principalPaise = 0, interestPaise = 0, photos = [], forMonth, notes } = req.body;
   
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    // Auto-calculate interest for current month if not provided
    let calculatedInterestPaise = interestPaise;
    if (!interestPaise && !principalPaise) {
      calculatedInterestPaise = goldLoan.calculateMonthlyInterest();
    }

    // Determine payment month
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

    // Add payment record
    goldLoan.payments.push({
      date: new Date(),
      principalPaise: Math.round(parseFloat(principalPaise)),
      interestPaise: Math.round(parseFloat(calculatedInterestPaise)),
      forMonth: paymentMonth,
      forYear: parseInt(year),
      forMonthName: monthName,
      photos,
      notes
    });

    // Check if loan is fully paid
    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    if (totalPaid >= goldLoan.principalPaise) {
      goldLoan.status = 'CLOSED';
      goldLoan.closureDate = new Date();
    }

    await goldLoan.save();

    // Create transaction records
    if (principalPaise > 0) {
      const principalTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer._id,
        amount: Math.round(parseFloat(principalPaise)),
        direction: -1, // incoming
        description: `Principal payment for ${monthName} ${year} - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await principalTransaction.save();
    }

    if (calculatedInterestPaise > 0) {
      const interestTransaction = new Transaction({
        type: 'GOLD_LOAN_INTEREST_RECEIVED',
        customer: goldLoan.customer._id,
        amount: Math.round(parseFloat(calculatedInterestPaise)),
        direction: -1, // incoming
        description: `Interest for ${monthName} ${year} - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await interestTransaction.save();
    }

    res.json({ 
      success: true, 
      data: goldLoan,
      paymentSummary: {
        month: `${monthName} ${year}`,
        principalPaid: principalPaise / 100,
        interestPaid: calculatedInterestPaise / 100,
        totalPayment: (principalPaise + calculatedInterestPaise) / 100
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Continue with existing functions...
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

export const getAllPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, customerId, startDate, endDate } = req.query;
    
    const matchCriteria = {};
    if (customerId) {
      matchCriteria.customer = new mongoose.Types.ObjectId(customerId);
    }

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
          photos: '$payments.photos',
          isPartialPayment: '$payments.isPartialPayment'
        }
      },
      { $sort: { paymentDate: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ];

    const payments = await GoldLoan.aggregate(pipeline);
    
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

export const getPendingInterest = async (req, res) => {
  try {
    const activeLoans = await GoldLoan.find({ status: 'ACTIVE' })
      .populate('customer', 'name phone');

    const pendingData = activeLoans.map(loan => {
      const monthlyInterest = loan.calculateMonthlyInterest();
      
      const startDate = new Date(loan.startDate);
      const currentDate = new Date();
      const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                     (currentDate.getMonth() - startDate.getMonth()) + 1;
      
      const totalInterestDue = months * monthlyInterest;
      const interestReceived = loan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
      const pendingInterest = Math.max(0, totalInterestDue - interestReceived);
      
      // Get last 3 payments for context
      const lastPayments = loan.payments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3)
        .map(p => ({
          date: p.date,
          month: p.forMonthName,
          year: p.forYear,
          amount: (p.principalPaise + p.interestPaise) / 100,
          type: p.principalPaise > 0 ? 'Principal + Interest' : 'Interest Only'
        }));
      
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
        lastPayments,
        lastPaymentDate: loan.payments.length > 0 ? 
          loan.payments[loan.payments.length - 1].date : null
      };
    });

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

export const getOutstandingSummary = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

    const totalPrincipalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    const totalInterestReceived = goldLoan.payments.reduce((sum, payment) => sum + payment.interestPaise, 0);
    const outstandingPrincipal = goldLoan.principalPaise - totalPrincipalPaid;
    
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

    const totalPaid = goldLoan.payments.reduce((sum, payment) => sum + payment.principalPaise, 0);
    const outstanding = goldLoan.principalPaise - totalPaid;

    if (outstanding > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot close loan. Outstanding principal: ₹${(outstanding / 100).toFixed(2)}`
      });
    }

    goldLoan.status = "CLOSED";
    goldLoan.closureDate = new Date();
    goldLoan.closureImages = closureImages;
    if (notes) goldLoan.notes = notes;

    goldLoan.items.forEach((item) => {
      if (!item.returnDate) {
        item.returnDate = new Date();
        item.returnImages = closureImages;
      }
    });

    await goldLoan.save();

    const closureTransaction = new Transaction({
      type: "GOLD_LOAN_CLOSURE",
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0,
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

      const finalPaymentTransaction = new Transaction({
        type: 'GOLD_LOAN_PAYMENT',
        customer: goldLoan.customer._id,
        amount: finalPaymentPaise,
        direction: -1,
        description: `Final payment - loan completion - ${goldLoan.customer.name}`,
        relatedDoc: goldLoan._id,
        relatedModel: 'GoldLoan',
        category: 'INCOME'
      });
      await finalPaymentTransaction.save();
    }

    goldLoan.status = 'COMPLETED';
    goldLoan.completionDate = currentDate;
    if (photos.length > 0) goldLoan.completionImages = photos;

    goldLoan.items.forEach(item => {
      if (!item.returnDate) {
        item.returnDate = currentDate;
        item.returnImages = photos;
      }
    });

    await goldLoan.save();

    const completionTransaction = new Transaction({
      type: 'GOLD_LOAN_COMPLETION',
      customer: goldLoan.customer._id,
      amount: 0,
      direction: 0,
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

export const getLoanReport = async (req, res) => {
  try {
    const goldLoan = await GoldLoan.findById(req.params.id).populate('customer');
    if (!goldLoan) {
      return res.status(404).json({ success: false, error: 'Gold loan not found' });
    }

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

    const newItems = items.map(item => ({
      name: item.name || 'Gold Item',
      weightGram: parseFloat(item.weightGram),
      amountPaise: Math.round(parseFloat(item.amount) * 100),
      purityK: parseInt(item.purityK),
      images: item.images || [],
      addedDate: new Date()
    }));

    goldLoan.items.push(...newItems);
    
    const additionalAmount = newItems.reduce((sum, item) => sum + item.amountPaise, 0);
    goldLoan.principalPaise += additionalAmount;

    await goldLoan.save();

    if (additionalAmount > 0) {
      const transaction = new Transaction({
        type: 'GOLD_LOAN_ADDITION',
        customer: goldLoan.customer._id,
        amount: additionalAmount,
        direction: 1,
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

    goldLoan.principalPaise -= removedAmount;

    await goldLoan.save();

    const transaction = new Transaction({
      type: 'GOLD_LOAN_ITEM_REMOVAL',
      customer: goldLoan.customer._id,
      amount: removedAmount,
      direction: -1,
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


export const getBusinessAnalytics = async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear(), month } = req.query;
    
    let startDate, endDate;
    
    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
        startDate = new Date(year, targetMonth, 1);
        endDate = new Date(year, targetMonth + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59, 999);
        break;
    }

    // Gold Loans Analytics
    const loanStats = await GoldLoan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPrincipal: { $sum: '$principalPaise' },
          totalWeight: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.weightGram'] }
              }
            }
          },
          avgLoanAmount: { $avg: '$principalPaise' }
        }
      }
    ]);

    // Interest Collection
    const interestStats = await GoldLoan.aggregate([
      { $unwind: '$payments' },
      {
        $match: {
          'payments.date': { $gte: startDate, $lte: endDate },
          'payments.interestPaise': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: null,
          totalInterest: { $sum: '$payments.interestPaise' },
          interestCount: { $sum: 1 },
          avgInterestPayment: { $avg: '$payments.interestPaise' }
        }
      }
    ]);

    // Daily breakdown for the period
    const dailyBreakdown = await GoldLoan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          loansGiven: { $sum: 1 },
          totalAmount: { $sum: '$principalPaise' },
          totalWeight: { 
            $sum: { 
              $reduce: {
                input: '$items',
                initialValue: 0,
                in: { $add: ['$$value', '$$this.weightGram'] }
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        dateRange: { startDate, endDate },
        loanStats: loanStats.map(stat => ({
          ...stat,
          totalPrincipalRupees: stat.totalPrincipal / 100,
          avgLoanAmountRupees: stat.avgLoanAmount / 100
        })),
        interestStats: interestStats.map(stat => ({
          ...stat,
          totalInterestRupees: stat.totalInterest / 100,
          avgInterestPaymentRupees: stat.avgInterestPayment / 100
        })),
        dailyBreakdown: dailyBreakdown.map(day => ({
          ...day,
          totalAmountRupees: day.totalAmount / 100
        })),
        summary: {
          totalLoansInPeriod: loanStats.reduce((sum, s) => sum + s.count, 0),
          totalBusinessInPeriod: loanStats.reduce((sum, s) => sum + s.totalPrincipal, 0) / 100,
          totalInterestInPeriod: interestStats[0]?.totalInterest / 100 || 0,
          totalGoldWeightInPeriod: loanStats.reduce((sum, s) => sum + s.totalWeight, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDirectionalAnalytics = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    const startDate = fromDate ? new Date(fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = toDate ? new Date(toDate) : new Date();

    const directionalData = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: { $in: ['GOLD_LOAN_GIVEN', 'GOLD_LOAN_PAYMENT', 'GOLD_LOAN_INTEREST_RECEIVED'] }
        }
      },
      {
        $group: {
          _id: {
            direction: '$direction',
            type: '$type'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const outgoing = directionalData.filter(d => d._id.direction === 1);
    const incoming = directionalData.filter(d => d._id.direction === -1);

    res.json({
      success: true,
      data: {
        dateRange: { startDate, endDate },
        outgoing: {
          totalAmount: outgoing.reduce((sum, o) => sum + o.totalAmount, 0) / 100,
          breakdown: outgoing.map(o => ({
            type: o._id.type,
            amount: o.totalAmount / 100,
            count: o.count
          }))
        },
        incoming: {
          totalAmount: incoming.reduce((sum, i) => sum + i.totalAmount, 0) / 100,
          breakdown: incoming.map(i => ({
            type: i._id.type,
            amount: i.totalAmount / 100,
            count: i.count
          }))
        },
        netFlow: (incoming.reduce((sum, i) => sum + i.totalAmount, 0) - 
                  outgoing.reduce((sum, o) => sum + o.totalAmount, 0)) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};