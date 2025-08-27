import xlsx from 'xlsx';
import path from 'path';

export const exportToExcel = (data, filename, sheetName = 'Sheet1') => {
  try {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const filepath = path.join(process.cwd(), 'exports', filename);
    xlsx.writeFile(workbook, filepath);
    
    return filepath;
  } catch (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
};

export const formatCustomerForExport = (customer) => ({
  'Name': customer.name,
  'Phone': customer.phone,
  'Email': customer.email || '',
  'City': customer.city,
  'State': customer.state,
  'Pincode': customer.pincode,
  'Adhaar Number': customer.adhaarNumber,
  'Status': customer.status,
  'Total Amount Taken From Jewellers': customer.totalAmountTakenFromJewellers / 100,
  'Total Amount Taken By Us': customer.totalAmountTakenByUs / 100,
  'Created At': customer.createdAt,
  'Updated At': customer.updatedAt
});

export const formatTransactionForExport = (transaction) => ({
  'Date': transaction.date,
  'Type': transaction.type,
  'Customer Name': transaction.customer?.name || 'N/A',
  'Customer Phone': transaction.customer?.phone || 'N/A',
  'Amount (₹)': transaction.amount / 100,
  'Direction': transaction.direction === 1 ? 'Outgoing' : 'Incoming',
  'Category': transaction.category,
  'Description': transaction.description
});

export const formatGoldLoanForExport = (goldLoan) => ({
  'Customer Name': goldLoan.customer?.name || 'N/A',
  'Customer Phone': goldLoan.customer?.phone || 'N/A',
  'Principal Amount (₹)': goldLoan.principalPaise / 100,
  'Interest Rate (% per month)': goldLoan.interestRateMonthlyPct,
  'Start Date': goldLoan.startDate,
  'Due Date': goldLoan.dueDate,
  'Status': goldLoan.status,
  'Items Count': goldLoan.items?.length || 0,
  'Total Weight (g)': goldLoan.items?.reduce((sum, item) => sum + item.weightGram, 0) || 0,
  'Amount Repaid (₹)': goldLoan.amountRepaidPaise / 100,
  'Interest Received (₹)': goldLoan.interestReceivedPaise / 100,
  'Outstanding (₹)': goldLoan.outstandingPaise / 100,
  'Payments Count': goldLoan.payments?.length || 0
});
