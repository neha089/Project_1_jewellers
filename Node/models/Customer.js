import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true, match: /^[0-9]{6}$/ }
});

const customerSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  phone: { 
    type: String, 
    required: true,
    unique: true,
    match: /^[0-9]{10}$/
  },
  address: addressSchema,
  adhaarNumber: { 
    type: String, 
    required: true,
    unique: true,
    match: /^[0-9]{12}$/
  },
  email: {
    type: String,
    lowercase: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  totalAmountTakenFromJewellers: { 
    type: Number, 
    default: 0,
    min: 0
  },
  totalAmountTakenByUs: { 
    type: Number, 
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  }
}, {
  timestamps: true
});

customerSchema.index({ phone: 1 });
customerSchema.index({ adhaarNumber: 1 });
customerSchema.index({ email: 1 });

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
