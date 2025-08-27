import GoldPurchase from "../models/GoldPurchase.js";
import Transaction from '../models/Transaction.js';

export const createGoldPurchase = async (req, res) => {
  try {
    const goldPurchase = new GoldPurchase(req.body);
    await goldPurchase.save();

    // Create transaction record
    const transaction = new Transaction({
      type: 'GOLD_PURCHASE',
      amount: goldPurchase.totalPaise,
      direction: 1, // outgoing
      description: `Gold purchase from ${goldPurchase.partyName} - ${goldPurchase.items.length} items`,
      relatedDoc: goldPurchase._id,
      relatedModel: 'GoldPurchase',
      category: 'EXPENSE'
    });
    await transaction.save();

    res.status(201).json({ success: true, data: goldPurchase });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getAllGoldPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10, partyName, fromDate, toDate } = req.query;
    const query = {};
    
    if (partyName) query.partyName = { $regex: partyName, $options: 'i' };
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const purchases = await GoldPurchase.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await GoldPurchase.countDocuments(query);

    res.json({
      success: true,
      data: purchases,
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
