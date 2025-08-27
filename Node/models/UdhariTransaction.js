import mongoose from "mongoose";

const udhariTxnSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Customer", 
    required: true, 
    index: true 
  },

  kind: { 
    type: String, 
    enum: ["GIVEN", "TAKEN", "REPAYMENT", "INTEREST"], 
    required: true, 
    index: true 
  },

  principalPaise: { type: Number, default: 0, min: 0 }, 
  interestPaise: { type: Number, default: 0, min: 0 },

  direction: { type: Number, enum: [1, -1], required: true },
  // +1 means money goes from you → customer
  // -1 means money comes from customer → you

  takenDate: { type: Date, default: Date.now, index: true },
  returnDate: { type: Date }, 

  // NEW: track where this money movement came from
  sourceType: { 
    type: String, 
    enum: ["UDHARI", "GOLD_LOAN", "LOAN" , "OTHER"], 
    default: "UDHARI",
    index: true
  },
  sourceRef: { type: mongoose.Schema.Types.ObjectId }, // optional link to loan/interest doc

  note: String,
}, { timestamps: true });

udhariTxnSchema.index({ customer: 1, takenDate: -1 });
udhariTxnSchema.index({ sourceType: 1 });

export default mongoose.model("UdhariTransaction", udhariTxnSchema);
