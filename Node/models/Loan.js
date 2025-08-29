import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true
  },
  direction: { type: Number, enum: [1, -1], required: true },
  principalPaise: { type: Number, required: true, min: 0 },
  interestRateMonthlyPct: { type: Number, required: true, min: 0 },
  startDate: { type: Date, default: Date.now, index: true },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ["ACTIVE", "CLOSED", "DEFAULTED"],
    default: "ACTIVE",
    index: true
  },
  totalInterestPaid: { type: Number, default: 0 },
  totalPrincipalPaid: { type: Number, default: 0 },
  lastInterestPaymentDate: { type: Date },
  note: String
}, { timestamps: true });

loanSchema.virtual("outstandingPrincipal").get(function() {
  return this.principalPaise - this.totalPrincipalPaid;
});

loanSchema.virtual("monthsElapsed").get(function() {
  const now = new Date();
  const start = this.startDate;
  return Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30));
});

loanSchema.set("toJSON", { virtuals: true });
loanSchema.set("toObject", { virtuals: true });

export default mongoose.model("Loan", loanSchema);