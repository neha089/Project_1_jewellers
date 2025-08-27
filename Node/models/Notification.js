import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["UDHARI_REMINDER", "LOAN_INTEREST_DUE", "GOLD_LOAN_DUE", "PAYMENT_RECEIVED", "GENERAL"],
    required: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    index: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  amount: { type: Number, default: 0 },
  dueDate: { type: Date, index: true },
  isRead: { type: Boolean, default: false, index: true },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
    default: "MEDIUM"
  },
  relatedDoc: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['GoldLoan', 'Loan', 'UdhariTransaction']
  }
}, { timestamps: true });

notificationSchema.index({ isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, dueDate: 1 });

export default mongoose.model("Notification", notificationSchema);