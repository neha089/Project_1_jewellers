import mongoose from "mongoose";

const metalSaleSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  metal: { type: String, enum: ["GOLD", "SILVER"], required: true, index: true },
  weightGram: { type: Number, required: true, min: 0 },
  amountPaise: { type: Number, required: true, min: 0 },
  ratePerGramPaise: { type: Number, required: true, min: 0 },
  purityK: { type: Number, min: 0 },
  date: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

metalSaleSchema.index({ customer: 1, date: -1 });

export default mongoose.model("MetalSale", metalSaleSchema);