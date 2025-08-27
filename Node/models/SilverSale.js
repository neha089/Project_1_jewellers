const mongoose = require('mongoose');

const silverSaleSchema = new mongoose.Schema({
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customer', 
    required: true 
  },
  weight: { 
    type: Number, 
    required: true,
    min: 0
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  silverRate: {
    type: Number,
    required: true,
    min: 0
  },
  purity: {
    type: Number,
    default: 99.9,
    min: 1,
    max: 100
  },
  saleDate: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

silverSaleSchema.index({ customerId: 1 });
silverSaleSchema.index({ saleDate: -1 });

module.exports = mongoose.model('SilverSale', silverSaleSchema);