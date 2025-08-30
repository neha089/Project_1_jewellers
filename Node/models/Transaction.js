import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "GOLD_LOAN_GIVEN","GOLD_LOAN_DISBURSEMENT", "GOLD_LOAN_PAYMENT", "GOLD_LOAN_CLOSURE",
      "LOAN_GIVEN","LOAN_TAKEN", "LOAN_PAYMENT", "LOAN_CLOSURE",
      "UDHARI_GIVEN", "UDHARI_RECEIVED",
      "GOLD_PURCHASE", "SILVER_PURCHASE", "GOLD_SALE", "SILVER_SALE",
      "GOLD_LOAN_INTEREST_RECEIVED", "LOAN_INTEREST_RECEIVED","INTEREST_PAID","GOLD_LOAN_ITEM_REMOVAL","GOLD_LOAN_COMPLETION"
    ],
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },
  amount: { type: Number, required: true },
  direction: { type: Number, enum: [1, -1], required: true }, // +1 outgoing, -1 incoming
  description: { type: String, required: true },
  date: { type: Date, default: Date.now, index: true },
  relatedDoc: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['GoldLoan', 'Loan', 'UdhariTransaction', 'MetalSale', 'GoldPurchase']
  },
  category: {
    type: String,
    enum: ["INCOME", "EXPENSE"],
    required: true,
    index: true
  }
}, { timestamps: true });

transactionSchema.index({ date: -1, category: 1 });
transactionSchema.index({ customer: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);