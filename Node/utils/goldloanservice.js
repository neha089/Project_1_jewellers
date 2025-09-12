import mongoose from 'mongoose';
import axios from 'axios';

const goldPriceSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, unique: true },
  purity22K: { type: Number, required: true }, // per gram
  purity24K: { type: Number, required: true }, // per gram
  purity18K: { type: Number, required: true }, // per gram
  silverPrice: { type: Number, required: false }, // per gram
  purity22KPerTola: { type: Number, required: false }, // per 10g
  purity24KPerTola: { type: Number, required: false },
  purity18KPerTola: { type: Number, required: false },
  silverPricePerTola: { type: Number, required: false },
  updatedBy: { type: String, default: 'system' },
  source: { type: String, default: 'manual' },
}, { timestamps: true });

const GoldPrice = mongoose.model('GoldPrice', goldPriceSchema);

class GoldPriceService {
  // 1. Fetch live rates (Gold & Silver in INR)
  static async fetchLiveAhmedabadRates() {
    try {
      const response = await axios.get('https://metals-api.com/api/latest', {
        params: {
          access_key:'1972b530a49942f9cce55742d4413ca6',
          base: 'INR',
          symbols: 'XAU,XAG' // Gold (XAU), Silver (XAG)
        }
      });

      if (response.data && response.data.success) {
        const { rates } = response.data;

        // Metals-API returns per ounce (31.1035 g)
        const goldPerGram = rates['XAU'] / 31.1035;
        const silverPerGram = rates['XAG'] / 31.1035;

        // Convert to 10g (tola for jewelers in India)
        const goldPerTola24K = goldPerGram * 10;
        const goldPerTola22K = goldPerTola24K * (22 / 24);
        const goldPerTola18K = goldPerTola24K * (18 / 24);
        const silverPerTola = silverPerGram * 10;

        return {
          purity24K: goldPerGram,
          purity22K: goldPerGram * (22 / 24),
          purity18K: goldPerGram * (18 / 24),
          silverPrice: silverPerGram,
          purity24KPerTola: goldPerTola24K,
          purity22KPerTola: goldPerTola22K,
          purity18KPerTola: goldPerTola18K,
          silverPricePerTola: silverPerTola,
          source: 'api-metals',
          isDefault: false,
          date: new Date()
        };
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('Error fetching live rates:', err.message);
      return null;
    }
  }

  // 2. Get current prices
  static async getCurrentPrices() {
    const live = await this.fetchLiveAhmedabadRates();
    if (live) return live;

    // fallback → DB
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dbEntry = await GoldPrice.findOne({ date: { $gte: today } }).sort({ date: -1 });
    if (dbEntry) return { ...dbEntry.toObject(), isDefault: false };

    // fallback → static
    return {
      purity24K: 7000,
      purity22K: 6500,
      purity18K: 5500,
      silverPrice: 85,
      purity24KPerTola: 70000,
      purity22KPerTola: 65000,
      purity18KPerTola: 55000,
      silverPricePerTola: 850,
      date: new Date(),
      isDefault: true
    };
  }

  // 3. Update DB
  static async updatePrices(priceData = {}) {
    try {
      const live = await this.fetchLiveAhmedabadRates();
      const dataToSave = live || {
        ...priceData,
        updatedBy: priceData.updatedBy || 'admin',
        source: priceData.source || (live ? 'api-metals' : 'manual'),
        date: new Date()
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const updated = await GoldPrice.findOneAndUpdate(
        { date: { $gte: today } },
        dataToSave,
        { new: true, upsert: true }
      );

      return { success: true, data: updated };
    } catch (error) {
      console.error('Error updating gold prices:', error);
      return { success: false, error: error.message };
    }
  }

  // 4. Calculate loan
  static async calculateGoldAmount(weightGrams, purityK) {
    try {
      const prices = await this.getCurrentPrices();
      let pricePerGram = prices[`purity${parseInt(purityK)}K`] ||
        (prices.purity24K * (parseInt(purityK) / 24));

      const marketValue = weightGrams * pricePerGram;
      const loanAmount = Math.round(marketValue * 0.85);

      return {
        success: true,
        data: {
          weightGrams,
          purityK: parseInt(purityK),
          pricePerGram,
          marketValue,
          loanAmount,
          loanPercentage: 85,
          goldPrices: prices
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async calculateSilverAmount(weightGrams) {
    try {
      const prices = await this.getCurrentPrices();
      const silverRate = prices.silverPrice || 0;
      const marketValue = weightGrams * silverRate;
      const loanAmount = Math.round(marketValue * 0.90);

      return {
        success: true,
        data: {
          weightGrams,
          pricePerGram: silverRate,
          marketValue,
          loanAmount,
          loanPercentage: 90
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPriceHistory(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const history = await GoldPrice.find({ date: { $gte: startDate } }).sort({ date: -1 });
      return { success: true, data: history };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export { GoldPrice, GoldPriceService };