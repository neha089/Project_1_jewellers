import mongoose from "mongoose";

const loanItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weightGram: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true, min: 0 },   // appraised value for the item
  purityK: { type: Number, min: 0 },                       // e.g., 22 for 22k
  images: [{ type: String }],                              // URLs or file names
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  principalPaise: { type: Number, default: 0, min: 0 },
  interestPaise: { type: Number, default: 0, min: 0 },
  photos: [{ type: String }]
}, { _id: false });

const goldLoanSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  items: { type: [loanItemSchema], validate: v => v.length > 0 },
  interestRateMonthlyPct: { type: Number, required: true, min: 0 }, // e.g., 2.0 for 2% per month
  principalPaise: { type: Number, required: true, min: 0 }, // total principal handed to customer
  startDate: { type: Date, default: Date.now, index: true },
  dueDate: { type: Date },
  status: { type: String, enum: ["ACTIVE", "CLOSED", "AUCTIONED"], default: "ACTIVE", index: true },
  payments: [paymentSchema]
}, { timestamps: true });

goldLoanSchema.virtual("amountRepaidPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.principalPaise, 0);
});
goldLoanSchema.virtual("interestReceivedPaise").get(function () {
  return (this.payments || []).reduce((s, p) => s + p.interestPaise, 0);
});
goldLoanSchema.virtual("outstandingPaise").get(function () {
  return Math.max(0, this.principalPaise - this.amountRepaidPaise);
});

goldLoanSchema.set("toJSON", { virtuals: true });
goldLoanSchema.set("toObject", { virtuals: true });

export default mongoose.model("GoldLoan", goldLoanSchema);
