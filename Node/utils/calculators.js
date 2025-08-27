export const calculateInterest = (principal, rate, months) => {
  return principal * (rate / 100) * months;
};

export const calculateCompoundInterest = (principal, rate, months, compoundFrequency = 1) => {
  return principal * Math.pow((1 + rate / (100 * compoundFrequency)), compoundFrequency * months) - principal;
};

export const calculateEMI = (principal, rate, months) => {
  const monthlyRate = rate / (100 * 12);
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
              (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
};

export const calculateGoldLoanInterest = (goldLoan) => {
  const today = new Date();
  const monthsElapsed = Math.floor((today - goldLoan.startDate) / (1000 * 60 * 60 * 24 * 30));
  const expectedInterest = goldLoan.principalPaise * (goldLoan.interestRateMonthlyPct / 100) * monthsElapsed;
  const paidInterest = goldLoan.interestReceivedPaise || 0;
  const dueInterest = Math.max(0, expectedInterest - paidInterest);
  
  return {
    expectedInterest,
    paidInterest,
    dueInterest,
    monthsElapsed
  };
};