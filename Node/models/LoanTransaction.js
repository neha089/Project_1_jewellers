import mongoose from "mongoose";

const udhariTxnSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  kind: { 
    type: String, 
    enum: ["], 
    required: true, 
    index: true 
  },
  principalPaise: { type: Number, required: true, min: 0 }, // store absolute value; sign via direction
  interestPaise: { type: Number, default: 0, min: 0 },
  direction: { type: Number, enum: [1, -1], required: true }, 
  // direction=+1 means money moved from you -> customer (asset increases),
  // direction=-1 means money moved customer -> you (asset decreases).
  takenDate: { type: Date, default: Date.now, index: true },
  returnDate: { type: Date }, // optional promise/expected date
  note: String,
}, { timestamps: true });

udhariTxnSchema.index({ customer: 1, takenDate: -1 });

export default mongoose.model("UdhariTransaction", udhariTxnSchema);
