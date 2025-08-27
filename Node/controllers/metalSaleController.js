import MetalSale from '../models/MetalSale.js';
import Transaction from '../models/Transaction.js';

export const createMetalSale = async (req, res) => {
  try {
    const metalSale = new MetalSale(req.body);
    await metalSale.save();

    // Create transaction record
    const transaction = new Transaction({
      type: req.body.metal === 'GOLD' ? 'GOLD_SALE' : 'SILVER_SALE',
      customer: metalSale.customer,
      amount: metalSale.amountPaise,
      direction: -1, // incoming
      description: `${metalSale.metal} sale - ${metalSale.weightGram}g at ${metalSale.ratePerGramPaise/100}/g`,
      relatedDoc: metalSale._id,
      relatedModel: 'MetalSale',
      category: 'INCOME'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: metalSale });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllMetalSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, customer, metal, fromDate, toDate } = req.query;
    const query = {};
    
    if (customer) query.customer = customer;
    if (metal) query.metal = metal;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const sales = await MetalSale.find(query)
      .populate('customer', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await MetalSale.countDocuments(query);

    res.json({
      success: true,
      data: sales,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};