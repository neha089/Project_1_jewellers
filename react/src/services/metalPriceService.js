// services/metalPriceService.js
import axios from 'axios';

class MetalPriceService {
  constructor() {
    this.apiKey = 'f8ac6102aad7156aaf9a4ef7892ae961';
    this.baseUrl = 'https://api.metalpriceapi.com/v1';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // Get current metal prices (Gold and Silver)
  async getCurrentPrices() {
    const cacheKey = 'current_prices';
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheTimeout) {
      return cachedData.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/latest`, {
        params: {
          api_key: this.apiKey,
          base: 'INR',
          currencies: 'XAU,XAG' // XAU = Gold, XAG = Silver
        }
      });

      if (response.data.success) {
        const rates = response.data.rates;
        
        // Convert troy ounce to grams and calculate rates
        // 1 troy ounce = 31.1034768 grams
        const goldPricePerGram = (1 / rates.XAU) / 31.1034768 * 100; // in paise
        const silverPricePerGram = (1 / rates.XAG) / 31.1034768 * 100; // in paise

        const priceData = {
          gold: {
            pricePerGram: Math.round(goldPricePerGram),
            pricePerGramRupees: goldPricePerGram / 100,
            // Calculate different purity rates
            rates: {
              '24K': Math.round(goldPricePerGram),
              '22K': Math.round(goldPricePerGram * 0.916), // 22K = 91.6% pure
              '20K': Math.round(goldPricePerGram * 0.833), // 20K = 83.3% pure
              '18K': Math.round(goldPricePerGram * 0.75),  // 18K = 75% pure
              '16K': Math.round(goldPricePerGram * 0.666), // 16K = 66.6% pure
              '14K': Math.round(goldPricePerGram * 0.583), // 14K = 58.3% pure
              '12K': Math.round(goldPricePerGram * 0.5),   // 12K = 50% pure
              '10K': Math.round(goldPricePerGram * 0.416)  // 10K = 41.6% pure
            }
          },
          silver: {
            pricePerGram: Math.round(silverPricePerGram),
            pricePerGramRupees: silverPricePerGram / 100,
            // Calculate different purity rates
            rates: {
              '999': Math.round(silverPricePerGram * 0.999), // 99.9% pure
              '925': Math.round(silverPricePerGram * 0.925), // 92.5% pure (Sterling)
              '900': Math.round(silverPricePerGram * 0.900), // 90% pure
              '800': Math.round(silverPricePerGram * 0.800)  // 80% pure
            }
          },
          timestamp: new Date(),
          source: 'metalpriceapi.com',
          lastUpdated: response.data.timestamp
        };

        // Cache the result
        this.cache.set(cacheKey, {
          data: priceData,
          timestamp: Date.now()
        });

        return priceData;
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (error) {
      console.error('Error fetching metal prices:', error);
      
      // Return fallback/default prices if API fails
      return this.getFallbackPrices();
    }
  }

  // Get historical prices for a specific date
  async getHistoricalPrices(date) {
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const cacheKey = `historical_${formattedDate}`;
    const cachedData = this.cache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < this.cacheTimeout) {
      return cachedData.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${formattedDate}`, {
        params: {
          api_key: this.apiKey,
          base: 'INR',
          currencies: 'XAU,XAG'
        }
      });

      if (response.data.success) {
        const rates = response.data.rates;
        const goldPricePerGram = (1 / rates.XAU) / 31.1034768 * 100;
        const silverPricePerGram = (1 / rates.XAG) / 31.1034768 * 100;

        const historicalData = {
          date: formattedDate,
          gold: {
            pricePerGram: Math.round(goldPricePerGram),
            rates: {
              '24K': Math.round(goldPricePerGram),
              '22K': Math.round(goldPricePerGram * 0.916),
              '20K': Math.round(goldPricePerGram * 0.833),
              '18K': Math.round(goldPricePerGram * 0.75),
              '16K': Math.round(goldPricePerGram * 0.666),
              '14K': Math.round(goldPricePerGram * 0.583),
              '12K': Math.round(goldPricePerGram * 0.5),
              '10K': Math.round(goldPricePerGram * 0.416)
            }
          },
          silver: {
            pricePerGram: Math.round(silverPricePerGram),
            rates: {
              '999': Math.round(silverPricePerGram * 0.999),
              '925': Math.round(silverPricePerGram * 0.925),
              '900': Math.round(silverPricePerGram * 0.900),
              '800': Math.round(silverPricePerGram * 0.800)
            }
          },
          source: 'metalpriceapi.com'
        };

        this.cache.set(cacheKey, {
          data: historicalData,
          timestamp: Date.now()
        });

        return historicalData;
      } else {
        throw new Error('Historical data not available');
      }
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return this.getFallbackPrices();
    }
  }

  // Get price trend over a date range
  async getPriceTrend(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const trends = [];

      // Get prices for each day in the range (limit to avoid too many API calls)
      const maxDays = 30; // Limit to 30 days
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const step = daysDiff > maxDays ? Math.ceil(daysDiff / maxDays) : 1;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + step)) {
        try {
          const priceData = await this.getHistoricalPrices(d);
          trends.push({
            date: d.toISOString().split('T')[0],
            goldPrice: priceData.gold.pricePerGram / 100,
            silverPrice: priceData.silver.pricePerGram / 100
          });
        } catch (error) {
          console.warn(`Failed to get price for ${d.toISOString().split('T')[0]}`);
        }
      }

      return trends;
    } catch (error) {
      console.error('Error fetching price trends:', error);
      return [];
    }
  }

  // Get fallback prices when API is unavailable
  getFallbackPrices() {
    // These are approximate fallback rates (update periodically)
    return {
      gold: {
        pricePerGram: 650000, // ₹6500 per gram in paise
        pricePerGramRupees: 6500,
        rates: {
          '24K': 650000,
          '22K': 595400,
          '20K': 541450,
          '18K': 487500,
          '16K': 432900,
          '14K': 378950,
          '12K': 325000,
          '10K': 270400
        }
      },
      silver: {
        pricePerGram: 8500, // ₹85 per gram in paise
        pricePerGramRupees: 85,
        rates: {
          '999': 8492,
          '925': 7863,
          '900': 7650,
          '800': 6800
        }
      },
      timestamp: new Date(),
      source: 'fallback_data',
      lastUpdated: null,
      isFallback: true
    };
  }

  // Get specific purity rate for gold
  getGoldRate(purity) {
    const prices = this.getCurrentPrices();
    return prices.gold.rates[purity] || prices.gold.rates['22K'];
  }

  // Get specific purity rate for silver
  getSilverRate(purity) {
    const prices = this.getCurrentPrices();
    return prices.silver.rates[purity] || prices.silver.rates['925'];
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new MetalPriceService();
