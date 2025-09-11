import axios from 'axios';

export class GoldPriceService {
  static METALS_API_KEY = process.env.METALS_API_KEY || 'your-metals-api-key';
  static GOLD_API_KEY = process.env.GOLD_API_KEY || 'your-gold-api-key';
  
  // Cache for gold prices (5 minute cache)
  static priceCache = {
    data: null,
    timestamp: null,
    duration: 5 * 60 * 1000 // 5 minutes
  };

  /**
   * Fetch current gold prices from multiple external APIs with fallbacks
   */
  static async fetchCurrentGoldPrices() {
    try {
      // Check cache first
      if (this.priceCache.data && 
          this.priceCache.timestamp && 
          (Date.now() - this.priceCache.timestamp) < this.priceCache.duration) {
        return { success: true, data: this.priceCache.data };
      }

      let prices = null;

      // Try Method 1: MetalsAPI (Primary)
      try {
        const response = await axios.get(`https://metals-api.com/api/latest?access_key=${this.METALS_API_KEY}&base=USD&symbols=XAU,XAG`, {
          timeout: 5000
        });

        if (response.data && response.data.rates) {
          const goldPriceUsdPerOunce = 1 / response.data.rates.XAU;
          const silverPriceUsdPerOunce = 1 / response.data.rates.XAG;
          const usdToInr = await this.getUSDToINRRate();
          
          const goldPriceInrPerGram = (goldPriceUsdPerOunce * usdToInr) / 31.1035;
          const silverPriceInrPerGram = (silverPriceUsdPerOunce * usdToInr) / 31.1035;

          prices = {
            purity24K: Math.round(goldPriceInrPerGram),
            purity22K: Math.round(goldPriceInrPerGram * 0.916),
            purity18K: Math.round(goldPriceInrPerGram * 0.750),
            silverPrice: Math.round(silverPriceInrPerGram),
            lastUpdated: new Date(),
            source: 'metals-api.com',
            usdRate: goldPriceUsdPerOunce,
            inrConversion: usdToInr
          };
        }
      } catch (error) {
        console.log('MetalsAPI failed, trying backup...');
      }

      // Try Method 2: FreeAPI Backup
      if (!prices) {
        try {
          const response = await axios.get('https://api.metals.live/v1/spot/gold', {
            timeout: 5000
          });

          const goldPriceUsdPerOunce = response.data.price;
          const usdToInr = await this.getUSDToINRRate();
          const goldPriceInrPerGram = (goldPriceUsdPerOunce * usdToInr) / 31.1035;

          prices = {
            purity24K: Math.round(goldPriceInrPerGram),
            purity22K: Math.round(goldPriceInrPerGram * 0.916),
            purity18K: Math.round(goldPriceInrPerGram * 0.750),
            silverPrice: Math.round(goldPriceInrPerGram * 0.015),
            lastUpdated: new Date(),
            source: 'metals.live',
            usdRate: goldPriceUsdPerOunce,
            inrConversion: usdToInr
          };
        } catch (error) {
          console.log('Backup API also failed');
        }
      }

      // Fallback to default prices
      if (!prices) {
        prices = {
          purity24K: 6800, // Default fallback - update based on current market
          purity22K: 6230,
          purity18K: 5100,
          silverPrice: 105,
          lastUpdated: new Date(),
          source: 'fallback',
          usdRate: 2000,
          inrConversion: 83
        };
      }

      // Update cache
      this.priceCache.data = prices;
      this.priceCache.timestamp = Date.now();

      return { success: true, data: prices };
    } catch (error) {
      console.error('Error fetching gold prices:', error);
      return { 
        success: false, 
        error: 'Failed to fetch current gold prices',
        fallbackUsed: true
      };
    }
  }

  /**
   * Get USD to INR conversion rate
   */
  static async getUSDToINRRate() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 3000
      });
      return response.data.rates.INR || 83; // Default to 83 if fails
    } catch (error) {
      return 83; // Fallback rate
    }
  }

  /**
   * Calculate loan amount based on current market prices
   */
  static async calculateGoldAmount(weightGrams, purityK, loanToValueRatio = 0.75) {
    try {
      const pricesResult = await this.fetchCurrentGoldPrices();
      if (!pricesResult.success) {
        return pricesResult;
      }

      const prices = pricesResult.data;
      let pricePerGram;

      // Determine price based on purity
      switch (parseInt(purityK)) {
        case 24:
          pricePerGram = prices.purity24K;
          break;
        case 22:
          pricePerGram = prices.purity22K;
          break;
        case 18:
          pricePerGram = prices.purity18K;
          break;
        default:
          // Calculate custom purity (linear interpolation)
          pricePerGram = Math.round((prices.purity24K * parseInt(purityK)) / 24);
      }

      const marketValue = weightGrams * pricePerGram;
      const loanAmount = Math.round(marketValue * loanToValueRatio);

      return {
        success: true,
        data: {
          weightGrams: parseFloat(weightGrams),
          purityK: parseInt(purityK),
          pricePerGram,
          marketValue: Math.round(marketValue),
          loanAmount,
          loanToValueRatio,
          pricesUsed: prices,
          calculationBreakdown: {
            formula: `${weightGrams}g × ₹${pricePerGram}/g × ${loanToValueRatio * 100}% = ₹${loanAmount}`,
            marketValueFormula: `${weightGrams}g × ₹${pricePerGram}/g = ₹${Math.round(marketValue)}`,
            loanFormula: `₹${Math.round(marketValue)} × ${loanToValueRatio * 100}% = ₹${loanAmount}`
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Error calculating gold amount: ${error.message}`
      };
    }
  }
}