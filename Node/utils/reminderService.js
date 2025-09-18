import Notification from '../models/Notification.js';
import GoldLoan from '../models/GoldLoan.js';
import Loan from '../models/Loan.js';
import Udhar from '../models/Udhar.js';

export const generateDailyReminders = async () => {
  try {
    console.log('Generating daily reminders...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Clear old notifications (older than 30 days)
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await Notification.deleteMany({ 
      createdAt: { $lt: thirtyDaysAgo },
      isRead: true 
    });

    // 1. Gold Loan Interest Due Reminders
    const goldLoansWithInterestDue = await GoldLoan.find({
      status: 'ACTIVE'
    }).populate('customer', 'name phone');

    for (const goldLoan of goldLoansWithInterestDue) {
      const monthsElapsed = Math.floor((today - goldLoan.startDate) / (1000 * 60 * 60 * 24 * 30));
      const expectedInterest = goldLoan.principalPaise * (goldLoan.interestRateMonthlyPct / 100) * monthsElapsed;
      const paidInterest = goldLoan.interestReceivedPaise;
      
      if (expectedInterest > paidInterest) {
        const dueInterest = expectedInterest - paidInterest;
        
        // Check if notification already exists for today
        const existingNotification = await Notification.findOne({
          type: 'GOLD_LOAN_INTEREST_DUE',
          customer: goldLoan.customer._id,
          relatedDoc: goldLoan._id,
          createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'GOLD_LOAN_INTEREST_DUE',
            customer: goldLoan.customer._id,
            title: `Gold Loan Interest Due - ${goldLoan.customer.name}`,
            message: `Interest of ₹${(dueInterest / 100).toFixed(2)} is due for gold loan. Principal: ₹${(goldLoan.principalPaise / 100).toFixed(2)}`,
            amount: dueInterest,
            dueDate: today,
            priority: 'HIGH',
            relatedDoc: goldLoan._id,
            relatedModel: 'GoldLoan'
          });
        }
      }
    }

    // 2. Regular Loan Interest Due Reminders
    const loansWithInterestDue = await Loan.find({
      status: 'ACTIVE'
    }).populate('customer', 'name phone');

    for (const loan of loansWithInterestDue) {
      const monthsElapsed = Math.floor((today - loan.startDate) / (1000 * 60 * 60 * 24 * 30));
      const expectedInterest = loan.principalPaise * (loan.interestRateMonthlyPct / 100) * monthsElapsed;
      const paidInterest = loan.totalInterestPaid;
      
      if (expectedInterest > paidInterest) {
        const dueInterest = expectedInterest - paidInterest;
        
        const existingNotification = await Notification.findOne({
          type: 'LOAN_INTEREST_DUE',
          customer: loan.customer._id,
          relatedDoc: loan._id,
          createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'LOAN_INTEREST_DUE',
            customer: loan.customer._id,
            title: `Loan Interest Due - ${loan.customer.name}`,
            message: `Interest of ₹${(dueInterest / 100).toFixed(2)} is due for loan. Principal: ₹${(loan.principalPaise / 100).toFixed(2)}`,
            amount: dueInterest,
            dueDate: today,
            priority: 'HIGH',
            relatedDoc: loan._id,
            relatedModel: 'Loan'
          });
        }
      }
    }

    // 3. Udhari Repayment Reminders
    const pendingUdharis = await Udhar.find({
      kind: 'GIVEN',
      isCompleted: false,
      sourceType: 'UDHARI'
    }).populate('customer', 'name phone');

    for (const udhari of pendingUdharis) {
      const daysSinceGiven = Math.floor((today - udhari.takenDate) / (1000 * 60 * 60 * 24));
      let priority = 'MEDIUM';
      
      if (daysSinceGiven > 30) priority = 'HIGH';
      if (daysSinceGiven > 60) priority = 'URGENT';
      
      // Remind every 7 days after 7 days
      if (daysSinceGiven >= 7 && daysSinceGiven % 7 === 0) {
        const existingNotification = await Notification.findOne({
          type: 'UDHARI_REMINDER',
          customer: udhari.customer._id,
          relatedDoc: udhari._id,
          createdAt: {
            $gte: new Date(today.setHours(0, 0, 0, 0)),
            $lt: new Date(today.setHours(23, 59, 59, 999))
          }
        });

        if (!existingNotification) {
          await Notification.create({
            type: 'UDHARI_REMINDER',
            customer: udhari.customer._id,
            title: `Udhari Repayment Reminder - ${udhari.customer.name}`,
            message: `Outstanding udhari amount: ₹${(udhari.outstandingBalance / 100).toFixed(2)}. Given ${daysSinceGiven} days ago.`,
            amount: udhari.outstandingBalance,
            dueDate: today,
            priority,
            relatedDoc: udhari._id,
            relatedModel: 'Udhar'
          });
        }
      }
    }

    console.log('Daily reminders generated successfully');
  } catch (error) {
    console.error('Error generating daily reminders:', error);
  }
};
