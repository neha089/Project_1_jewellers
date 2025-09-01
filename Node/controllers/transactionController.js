import Transaction from '../models/Transaction.js';

export const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, category, customer, fromDate, toDate } = req.query;
    const query = {};
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (customer) query.customer = customer;
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }

    const transactions = await Transaction.find(query)
      .populate('customer', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Transaction.countDocuments(query);

    // Get summary
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: transactions,
      summary: {
        income: summary.find(s => s._id === 'INCOME')?.total || 0,
        expense: summary.find(s => s._id === 'EXPENSE')?.total || 0,
        totalTransactions: summary.reduce((sum, s) => sum + s.count, 0)
      },
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

export const getRecentTransactions = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const transactions = await Transaction.find()
      .populate('customer', 'name phone')
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};