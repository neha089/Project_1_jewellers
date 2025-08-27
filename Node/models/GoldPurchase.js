import mongoose from "mongoose";

const purchasedItemSchema = new mongoose.Schema({
  name: String,
  weightGram: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true, min: 0 },
  purityK: { type: Number, min: 0 },
  metal: { type: String, enum: ["GOLD", "SILVER"], required: true, index: true },
}, { _id: false });

const goldPurchaseSchema = new mongoose.Schema({
  partyName: { type: String, trim: true, index: true },
  items: { type: [purchasedItemSchema], validate: v => v.length > 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

export default mongoose.model("GoldPurchase", goldPurchaseSchema);