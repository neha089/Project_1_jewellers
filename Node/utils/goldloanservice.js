// utils/goldloanservice.js - Enhanced with external gold price API
import axios from 'axios';

export class GoldPriceService {
  static GOLD_API_KEY = process.env.GOLD_API_KEY || 'goldapi-key-here'; // Get from goldapi.io
  static BASE_URL = 'https://www.goldapi.io/api';
  
  // Cache for gold prices (5 minute cache)
  static priceCache = {
    data: null,
    timestamp: null,
    duration: 5 * 60 * 1000 // 5 minutes
  };

  /**
   * Fetch current gold prices from external API
   */
  static async fetchCurrentGoldPrices() {
    try {
      // Check cache first
      if (this.priceCache.data && 
          this.priceCache.timestamp && 
          (Date.now() - this.priceCache.timestamp) < this.priceCache.duration) {
        return { success: true, data: this.priceCache.data };
      }

      // Alternative: Use metals-api.com (free tier available)
      const response = await axios.get('https://api.metals.live/v1/spot/gold', {
        headers: {
          'Accept': 'application/json'
        }
      });

      // Convert to Indian prices (assuming USD to INR conversion)
      const usdToInr = 83; // You might want to fetch this dynamically too
      const goldPriceUsdPerOunce = response.data.price;
      const goldPriceInrPerGram = (goldPriceUsdPerOunce * usdToInr) / 31.1035; // Convert ounce to gram

      // Calculate different purities
      const prices = {
        purity24K: Math.round(goldPriceInrPerGram),
        purity22K: Math.round(goldPriceInrPerGram * 0.916), // 22K is 91.6% pure
        purity18K: Math.round(goldPriceInrPerGram * 0.750), // 18K is 75% pure
        silverPrice: Math.round(goldPriceInrPerGram * 0.015), // Silver is roughly 1.5% of gold
        lastUpdated: new Date(),
        source: 'metals.live'
      };

      // Update cache
      this.priceCache.data = prices;
      this.priceCache.timestamp = Date.now();

      return { success: true, data: prices };
    } catch (error) {
      console.error('Error fetching gold prices:', error);
      
      // Fallback to default prices if API fails
      const fallbackPrices = {
        purity24K: 6500, // Default fallback price per gram
        purity22K: 5950,
        purity18K: 4875,
        silverPrice: 95,
        lastUpdated: new Date(),
        source: 'fallback'
      };

      return { success: true, data: fallbackPrices };
    }
  }

  /**
   * Get current gold prices (with caching)
   */
  static async getCurrentPrices() {
    const result = await this.fetchCurrentGoldPrices();
    return result.data;
  }

  /**
   * Calculate loan amount based on weight and purity
   */
  static async calculateGoldAmount(weightGrams, purityK, loanToValueRatio = 0.75) {
    try {
      const prices = await this.getCurrentPrices();
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
          // Calculate custom purity
          pricePerGram = (prices.purity24K * parseInt(purityK)) / 24;
      }

      const marketValue = weightGrams * pricePerGram;
      const loanAmount = marketValue * loanToValueRatio; // 75% of market value

      return {
        success: true,
        data: {
          weightGrams: parseFloat(weightGrams),
          purityK: parseInt(purityK),
          pricePerGram,
          marketValue,
          loanAmount,
          loanToValueRatio,
          pricesUsed: prices
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Error calculating gold amount: ${error.message}`
      };
    }
  }

  /**
   * Calculate silver amount
   */
  static async calculateSilverAmount(weightGrams, loanToValueRatio = 0.70) {
    try {
      const prices = await this.getCurrentPrices();
      const marketValue = weightGrams * prices.silverPrice;
      const loanAmount = marketValue * loanToValueRatio;

      return {
        success: true,
        data: {
          weightGrams: parseFloat(weightGrams),
          pricePerGram: prices.silverPrice,
          marketValue,
          loanAmount,
          loanToValueRatio,
          metal: 'silver'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Error calculating silver amount: ${error.message}`
      };
    }
  }

  /**
   * Update manual prices (admin override)
   */
  static async updatePrices(priceData) {
    try {
      // Here you would typically save to database
      // For now, we'll update the cache
      const updatedPrices = {
        ...priceData,
        lastUpdated: new Date(),
        source: 'manual'
      };

      this.priceCache.data = updatedPrices;
      this.priceCache.timestamp = Date.now();

      return { success: true, data: updatedPrices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get historical price trend (if API supports it)
   */
  static async getPriceTrend(days = 7) {
    try {
      // This would require a more advanced API
      // For now, return mock trend data
      const currentPrices = await this.getCurrentPrices();
      const trend = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Mock data - in real implementation, fetch historical data
        trend.push({
          date: date.toISOString().split('T')[0],
          price24K: currentPrices.purity24K + (Math.random() - 0.5) * 200,
          price22K: currentPrices.purity22K + (Math.random() - 0.5) * 180,
          price18K: currentPrices.purity18K + (Math.random() - 0.5) * 150
        });
      }

      return { success: true, data: trend };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}