import mongoose from "mongoose";

const loanItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightGram: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true, min: 0 },
  purityK: { type: Number, min: 0 },
  images: [{ type: String }],
  returnDate: { type: Date }, // When item was returned
  returnImages: [{ type: String }] // Images when returning item
}, { _id: true });

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  principalPaise: { type: Number, default: 0, min: 0 },
  interestPaise: { type: Number, default: 0, min: 0 },
  forMonth: { type: String, required: true }, // Format: "YYYY-MM"
  forYear: { type: Number, required: true },
  forMonthName: { type: String, required: true }, // e.g., "January", "February"
  photos: [{ type: String }],
  notes: { type: String }
}, { _id: true });

const goldLoanSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  items: { type: [loanItemSchema], validate: v => v.length > 0 },
  interestRateMonthlyPct: { type: Number, required: true, min: 0 },
  principalPaise: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now, index: true },
  dueDate: { type: Date },
  status: { type: String, enum: ["ACTIVE", "CLOSED", "AUCTIONED"], default: "ACTIVE", index: true },
  payments: [paymentSchema],
  closureDate: { type: Date },
  closureImages: [{ type: String }], // Images when loan is closed and gold returned
  notes: { type: String }
}, { timestamps: true });

// Virtual fields for calculations
goldLoanSchema.virtual("amountRepaidPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.principalPaise, 0);
});

goldLoanSchema.virtual("interestReceivedPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.interestPaise, 0);
});

goldLoanSchema.virtual("outstandingPaise").get(function () {
  return Math.max(0, this.principalPaise - this.amountRepaidPaise);
});

// Calculate total interest due up to current date
goldLoanSchema.virtual("totalInterestDuePaise").get(function () {
  if (this.status === 'CLOSED') return 0;
  
  const startDate = new Date(this.startDate);
  const currentDate = new Date();
  
  // Calculate number of months
  const months = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + 
                 (currentDate.getMonth() - startDate.getMonth()) + 1;
  
  const monthlyInterest = (this.principalPaise * this.interestRateMonthlyPct) / 100;
  return Math.max(0, months * monthlyInterest);
});

// Calculate pending interest (due - received)
goldLoanSchema.virtual("pendingInterestPaise").get(function () {
  return Math.max(0, this.totalInterestDuePaise - this.interestReceivedPaise);
});

// Method to calculate interest for specific month
goldLoanSchema.methods.calculateMonthlyInterest = function() {
  return Math.round((this.principalPaise * this.interestRateMonthlyPct) / 100);
};

// Method to get payment history by month
goldLoanSchema.methods.getPaymentsByMonth = function() {
  const paymentsByMonth = {};
  
  this.payments.forEach(payment => {
    const key = payment.forMonth;
    if (!paymentsByMonth[key]) {
      paymentsByMonth[key] = {
        month: payment.forMonth,
        monthName: payment.forMonthName,
        year: payment.forYear,
        payments: []
      };
    }
    paymentsByMonth[key].payments.push(payment);
  });
  
  return Object.values(paymentsByMonth).sort((a, b) => {
    return new Date(a.month) - new Date(b.month);
  });
};

goldLoanSchema.set("toJSON", { virtuals: true });
goldLoanSchema.set("toObject", { virtuals: true });

export default mongoose.model("GoldLoan", goldLoanSchema);