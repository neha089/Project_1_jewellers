// services/interestService.js
import GoldLoan from '../models/GoldLoan.js';
import { GoldPriceService } from '../utils/goldloanservice.js';

export class InterestCalculationService {
  
  // Calculate accumulated pending interest with proper logic
  static async calculateAccumulatedInterest(loanId) {
    try {
      const loan = await GoldLoan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      const startDate = new Date(loan.startDate);
      const currentDate = new Date();
      
      // Get current active principal (based on current gold prices for unreturned items)
      const activeItems = loan.items.filter(item => !item.returnDate);
      let currentActivePrincipal = 0;
      
      for (const item of activeItems) {
        const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
        currentActivePrincipal += calculation.success ? 
          Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
      }

      const monthlyInterestAmount = Math.round((currentActivePrincipal * loan.interestRateMonthlyPct) / 100);
      
      // Calculate total months elapsed
      const monthsElapsed = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                           (currentDate.getMonth() - startDate.getMonth()) + 1;
      
      // Calculate total interest due up to current month
      const totalInterestDue = monthsElapsed * monthlyInterestAmount;
      
      // Calculate total interest received
      const totalInterestReceived = loan.payments.reduce((sum, p) => sum + p.interestPaise, 0);
      
      // Calculate accumulated pending interest
      const accumulatedPending = Math.max(0, totalInterestDue - totalInterestReceived);
      
      return {
        currentActivePrincipal,
        monthlyInterestAmount,
        monthsElapsed,
        totalInterestDue,
        totalInterestReceived,
        accumulatedPending,
        nextMonthInterest: monthlyInterestAmount,
        calculation: {
          formula: `${monthsElapsed} months × ₹${(monthlyInterestAmount / 100).toFixed(2)} = ₹${(totalInterestDue / 100).toFixed(2)}`,
          pendingFormula: `₹${(totalInterestDue / 100).toFixed(2)} - ₹${(totalInterestReceived / 100).toFixed(2)} = ₹${(accumulatedPending / 100).toFixed(2)}`
        }
      };
    } catch (error) {
      throw new Error(`Error calculating accumulated interest: ${error.message}`);
    }
  }

  // Process partial interest payment with accumulation logic
  static async processPartialInterestPayment(loanId, paymentAmountPaise, paymentMonth = null) {
    try {
      const loan = await GoldLoan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Get current accumulated pending interest
      const interestData = await this.calculateAccumulatedInterest(loanId);
      const { accumulatedPending, monthlyInterestAmount } = interestData;

      // Determine payment month
      const currentDate = new Date();
      const forMonth = paymentMonth || `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const [year, month] = forMonth.split('-');
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthName = monthNames[parseInt(month) - 1];

      // Calculate new accumulated pending after this payment
      const newAccumulatedPending = Math.max(0, accumulatedPending - paymentAmountPaise);
      
      // Add next month's interest to the pending amount
      const finalPendingAmount = newAccumulatedPending + monthlyInterestAmount;

      return {
        success: true,
        paymentMonth: forMonth,
        paymentMonthName: monthName,
        paymentYear: parseInt(year),
        paymentAmount: paymentAmountPaise,
        pendingBefore: accumulatedPending,
        pendingAfter: newAccumulatedPending,
        nextMonthInterest: monthlyInterestAmount,
        finalPendingAmount,
        isPartialPayment: paymentAmountPaise < accumulatedPending,
        isFullPayment: paymentAmountPaise >= accumulatedPending,
        excessAmount: Math.max(0, paymentAmountPaise - accumulatedPending),
        summary: {
          message: paymentAmountPaise >= accumulatedPending ? 
            `Full pending interest cleared. Next month interest: ₹${(monthlyInterestAmount / 100).toFixed(2)}` :
            `Partial payment received. Remaining pending: ₹${(newAccumulatedPending / 100).toFixed(2)}. Next month total: ₹${(finalPendingAmount / 100).toFixed(2)}`
        }
      };
    } catch (error) {
      throw new Error(`Error processing partial payment: ${error.message}`);
    }
  }

  // Get detailed interest breakdown by month
  static async getDetailedInterestBreakdown(loanId) {
    try {
      const loan = await GoldLoan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      const startDate = new Date(loan.startDate);
      const currentDate = new Date();
      
      // Get current active principal
      const activeItems = loan.items.filter(item => !item.returnDate);
      let currentActivePrincipal = 0;
      
      for (const item of activeItems) {
        const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
        currentActivePrincipal += calculation.success ? 
          Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
      }

      const monthlyInterestAmount = Math.round((currentActivePrincipal * loan.interestRateMonthlyPct) / 100);
      
      const breakdown = [];
      let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      let accumulatedPending = 0;
      
      while (currentMonth <= currentDate) {
        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        const monthName = currentMonth.toLocaleString('default', { month: 'long' });
        const year = currentMonth.getFullYear();
        
        // Find payments for this month
        const monthPayments = loan.payments.filter(p => p.forMonth === monthKey && p.interestPaise > 0);
        const totalPaidForMonth = monthPayments.reduce((sum, p) => sum + p.interestPaise, 0);
        
        // Add monthly interest to accumulated pending
        accumulatedPending += monthlyInterestAmount;
        
        // Subtract payments from accumulated pending
        accumulatedPending = Math.max(0, accumulatedPending - totalPaidForMonth);
        
        breakdown.push({
          month: monthKey,
          monthName,
          year,
          monthlyInterestDue: monthlyInterestAmount,
          paymentsMade: totalPaidForMonth,
          accumulatedPendingAfterMonth: accumulatedPending,
          payments: monthPayments.map(p => ({
            date: p.date,
            amount: p.interestPaise / 100,
            notes: p.notes
          })),
          isPaid: totalPaidForMonth >= monthlyInterestAmount,
          isPartiallyPaid: totalPaidForMonth > 0 && totalPaidForMonth < monthlyInterestAmount,
          isOverdue: currentMonth < new Date() && totalPaidForMonth < monthlyInterestAmount
        });
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      return {
        success: true,
        data: {
          loanInfo: {
            id: loan._id,
            startDate: loan.startDate,
            currentActivePrincipal: currentActivePrincipal / 100,
            interestRate: loan.interestRateMonthlyPct,
            monthlyInterestAmount: monthlyInterestAmount / 100
          },
          breakdown,
          summary: {
            totalMonths: breakdown.length,
            totalInterestDue: breakdown.reduce((sum, m) => sum + m.monthlyInterestDue, 0) / 100,
            totalInterestReceived: breakdown.reduce((sum, m) => sum + m.paymentsMade, 0) / 100,
            currentAccumulatedPending: accumulatedPending / 100,
            nextMonthInterest: monthlyInterestAmount / 100,
            projectedNextMonthTotal: (accumulatedPending + monthlyInterestAmount) / 100
          }
        }
      };
    } catch (error) {
      throw new Error(`Error getting interest breakdown: ${error.message}`);
    }
  }

  // Calculate item-wise repayment scenarios
  static async calculateRepaymentScenarios(loanId, repaymentAmountPaise) {
    try {
      const loan = await GoldLoan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Get current values for all active items
      const activeItems = loan.items.filter(item => !item.returnDate);
      const itemsWithCurrentValue = [];
      
      for (const item of activeItems) {
        const calculation = await GoldPriceService.calculateGoldAmount(item.weightGram, item.purityK);
        const currentValue = calculation.success ? 
          Math.round(calculation.data.loanAmount * 100) : item.amountPaise;
        
        itemsWithCurrentValue.push({
          ...item.toObject(),
          currentValuePaise: currentValue,
          originalValuePaise: item.amountPaise,
          priceChange: currentValue - item.amountPaise,
          priceChangePercentage: ((currentValue - item.amountPaise) / item.amountPaise * 100).toFixed(2)
        });
      }

      // Generate different scenarios
      const scenarios = [];

      // Scenario 1: Maximum items (start with cheapest)
      let runningTotal = 0;
      const maxItems = [];
      const sortedByCheapest = [...itemsWithCurrentValue].sort((a, b) => a.currentValuePaise - b.currentValuePaise);
      
      for (const item of sortedByCheapest) {
        if (runningTotal + item.currentValuePaise <= repaymentAmountPaise) {
          maxItems.push(item);
          runningTotal += item.currentValuePaise;
        }
      }

      scenarios.push({
        type: 'maximum_items',
        description: 'Return maximum number of items',
        items: maxItems,
        totalValue: runningTotal,
        excessAmount: repaymentAmountPaise - runningTotal,
        itemCount: maxItems.length
      });

      // Scenario 2: High value items first
      runningTotal = 0;
      const highValueItems = [];
      const sortedByValue = [...itemsWithCurrentValue].sort((a, b) => b.currentValuePaise - a.currentValuePaise);
      
      for (const item of sortedByValue) {
        if (runningTotal + item.currentValuePaise <= repaymentAmountPaise) {
          highValueItems.push(item);
          runningTotal += item.currentValuePaise;
        }
      }

      if (highValueItems.length !== maxItems.length || runningTotal !== scenarios[0].totalValue) {
        scenarios.push({
          type: 'high_value_first',
          description: 'Return highest value items first',
          items: highValueItems,
          totalValue: runningTotal,
          excessAmount: repaymentAmountPaise - runningTotal,
          itemCount: highValueItems.length
        });
      }

      // Scenario 3: Single best item
      const bestSingleItem = itemsWithCurrentValue
        .filter(item => item.currentValuePaise <= repaymentAmountPaise)
        .sort((a, b) => b.currentValuePaise - a.currentValuePaise)[0];

      if (bestSingleItem) {
        scenarios.push({
          type: 'single_best',
          description: 'Return single highest value item',
          items: [bestSingleItem],
          totalValue: bestSingleItem.currentValuePaise,
          excessAmount: repaymentAmountPaise - bestSingleItem.currentValuePaise,
          itemCount: 1
        });
      }

      return {
        success: true,
        data: {
          repaymentAmount: repaymentAmountPaise / 100,
          totalAvailableItems: itemsWithCurrentValue.length,
          totalCurrentValue: itemsWithCurrentValue.reduce((sum, item) => sum + item.currentValuePaise, 0) / 100,
          scenarios: scenarios.map(scenario => ({
            ...scenario,
            totalValueRupees: scenario.totalValue / 100,
            excessAmountRupees: scenario.excessAmount / 100,
            items: scenario.items.map(item => ({
              ...item,
              currentValueRupees: item.currentValuePaise / 100,
              originalValueRupees: item.originalValuePaise / 100,
              priceChangeRupees: item.priceChange / 100
            }))
          })),
          allItems: itemsWithCurrentValue.map(item => ({
            ...item,
            currentValueRupees: item.currentValuePaise / 100,
            originalValueRupees: item.originalValuePaise / 100,
            priceChangeRupees: item.priceChange / 100,
            canReturnAlone: item.currentValuePaise <= repaymentAmountPaise
          }))
        }
      };
    } catch (error) {
      throw new Error(`Error calculating repayment scenarios: ${error.message}`);
    }
  }

  // Get pre-filled interest amount based on pending calculations
  static async getPreFilledInterestAmount(loanId) {
    try {
      const interestData = await this.calculateAccumulatedInterest(loanId);
      
      return {
        success: true,
        data: {
          preFilledAmount: interestData.accumulatedPending / 100,
          monthlyAmount: interestData.monthlyInterestAmount / 100,
          nextMonthProjected: (interestData.accumulatedPending + interestData.monthlyInterestAmount) / 100,
          calculation: interestData.calculation,
          breakdown: {
            monthsElapsed: interestData.monthsElapsed,
            currentActivePrincipal: interestData.currentActivePrincipal / 100,
            totalDue: interestData.totalInterestDue / 100,
            totalReceived: interestData.totalInterestReceived / 100,
            pending: interestData.accumulatedPending / 100
          }
        }
      };
    } catch (error) {
      throw new Error(`Error getting pre-filled interest: ${error.message}`);
    }
  }

  // Process interest payment with accumulation logic
  static async processInterestPaymentWithAccumulation(loanId, paymentAmountPaise, paymentData = {}) {
    try {
      const loan = await GoldLoan.findById(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Get current interest calculation
      const interestData = await this.calculateAccumulatedInterest(loanId);
      const { accumulatedPending, monthlyInterestAmount } = interestData;

      // Process the payment
      const paymentProcessing = await this.processPartialInterestPayment(
        loanId, 
        paymentAmountPaise, 
        paymentData.forMonth
      );

      if (!paymentProcessing.success) {
        throw new Error(paymentProcessing.error);
      }

      // Create payment record with enhanced tracking
      const paymentRecord = {
        date: new Date(),
        principalPaise: 0,
        interestPaise: paymentAmountPaise,
        forMonth: paymentProcessing.paymentMonth,
        forYear: paymentProcessing.paymentYear,
        forMonthName: paymentProcessing.paymentMonthName,
        photos: paymentData.photos || [],
        notes: paymentData.notes || 'Interest payment with accumulation',
        // Enhanced tracking
        pendingAtTimeOfPayment: accumulatedPending,
        monthlyInterestAtPayment: monthlyInterestAmount,
        activePrincipalAtPayment: interestData.currentActivePrincipal,
        isPartialPayment: paymentProcessing.isPartialPayment,
        remainingInterestForMonth: paymentProcessing.finalPendingAmount,
        accumulationData: {
          previousPending: accumulatedPending,
          paymentMade: paymentAmountPaise,
          newPending: paymentProcessing.pendingAfter,
          nextMonthAddition: monthlyInterestAmount,
          projectedNextTotal: paymentProcessing.finalPendingAmount
        }
      };

      return {
        success: true,
        paymentRecord,
        summary: paymentProcessing.summary,
        interestData,
        projectedNextMonth: {
          pendingAmount: paymentProcessing.finalPendingAmount / 100,
          formula: `₹${(paymentProcessing.pendingAfter / 100).toFixed(2)} + ₹${(monthlyInterestAmount / 100).toFixed(2)} = ₹${(paymentProcessing.finalPendingAmount / 100).toFixed(2)}`
        }
      };
    } catch (error) {
      throw new Error(`Error processing interest payment: ${error.message}`);
    }
  }

  // Get last 3 payment details for display
  static getLastThreePayments(loan) {
    return loan.payments
      .filter(p => p.interestPaise > 0 || p.principalPaise > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
      .map(p => {
        const paymentDate = new Date(p.date);
        const daysAgo = Math.floor((new Date() - paymentDate) / (1000 * 60 * 60 * 24));
        
        return {
          date: p.date,
          formattedDate: paymentDate.toLocaleDateString('en-IN'),
          daysAgo,
          month: p.forMonthName,
          year: p.forYear,
          interestAmount: p.interestPaise / 100,
          principalAmount: p.principalPaise / 100,
          totalAmount: (p.interestPaise + p.principalPaise) / 100,
          paymentType: p.principalPaise > 0 ? 'Combined' : 'Interest Only',
          notes: p.notes,
          wasPartial: p.isPartialPayment || false,
          itemsReturned: p.itemsReturned ? p.itemsReturned.length : 0
        };
      });
  }

  // Calculate optimal item selection for repayment amount
  static calculateOptimalItemSelection(items, targetAmountPaise) {
    // Sort items by value efficiency (value per gram)
    const itemsWithEfficiency = items.map(item => ({
      ...item,
      efficiency: item.currentValuePaise / item.weightGram,
      valuePerPurity: item.currentValuePaise / item.purityK
    }));

    // Multiple selection strategies
    const strategies = [
      {
        name: 'value_ascending',
        description: 'Lowest value items first',
        items: [...itemsWithEfficiency].sort((a, b) => a.currentValuePaise - b.currentValuePaise)
      },
      {
        name: 'value_descending',
        description: 'Highest value items first',
        items: [...itemsWithEfficiency].sort((a, b) => b.currentValuePaise - a.currentValuePaise)
      },
      {
        name: 'efficiency',
        description: 'Best value per gram',
        items: [...itemsWithEfficiency].sort((a, b) => b.efficiency - a.efficiency)
      },
      {
        name: 'weight_ascending',
        description: 'Lightest items first',
        items: [...itemsWithEfficiency].sort((a, b) => a.weightGram - b.weightGram)
      }
    ];

    const results = strategies.map(strategy => {
      let runningTotal = 0;
      const selectedItems = [];
      
      for (const item of strategy.items) {
        if (runningTotal + item.currentValuePaise <= targetAmountPaise) {
          selectedItems.push(item);
          runningTotal += item.currentValuePaise;
        }
      }

      return {
        strategy: strategy.name,
        description: strategy.description,
        itemsSelected: selectedItems.length,
        totalValue: runningTotal,
        excessAmount: targetAmountPaise - runningTotal,
        efficiency: selectedItems.length > 0 ? runningTotal / targetAmountPaise : 0,
        items: selectedItems
      };
    });

    // Return best strategy (most items with least excess)
    const bestStrategy = results.reduce((best, current) => {
      if (current.itemsSelected > best.itemsSelected) return current;
      if (current.itemsSelected === best.itemsSelected && current.excessAmount < best.excessAmount) return current;
      return best;
    }, results[0]);

    return {
      recommendedStrategy: bestStrategy,
      allStrategies: results,
      targetAmount: targetAmountPaise / 100
    };
  }
}

export default InterestCalculationService;