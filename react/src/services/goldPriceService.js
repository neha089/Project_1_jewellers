// services/goldPriceService.js
class GoldPriceService {
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  static cache = {
    data: null,
    timestamp: null
  };

  // Primary API - Free gold price API with India support
  static async fetchFromMetalsAPI() {
    try {
      const response = await fetch('https://api.metals.live/v1/spot/gold', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Metals API failed');
      
      const data = await response.json();
      return {
        success: true,
        source: 'metals-api',
        usdPerOunce: data.price
      };
    } catch (error) {
      console.warn('Metals API failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Backup API - Alternative gold price source
  static async fetchFromGoldAPI() {
    try {
      const response = await fetch('https://api.goldapi.io/api/XAU/INR', {
        headers: {
          'x-access-token': 'goldapi-demo-key', // You'll need to get a free API key
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('GoldAPI failed');
      
      const data = await response.json();
      return {
        success: true,
        source: 'goldapi',
        inrPerOunce: data.price
      };
    } catch (error) {
      console.warn('GoldAPI failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Fallback - Use hardcoded Ahmedabad rates (updated from search results)
  static getFallbackPrices() {
    return {
      success: true,
      source: 'fallback-ahmedabad',
      data: {
        purity24K: 10500, // Current Ahmedabad rate for 24K
        purity22K: 9625,  // Current Ahmedabad rate for 22K  
        purity18K: 7875,  // Current Ahmedabad rate for 18K
        purity14K: 6125,  // Calculated proportionally
        silverPrice: 95,  // Approximate silver rate
        isDefault: true,
        lastUpdated: new Date().toISOString(),
        location: 'Ahmedabad, Gujarat'
      }
    };
  }

  // Convert USD/ounce to INR/gram with purity adjustments
  static convertToIndianRates(usdPerOunce) {
    const USD_TO_INR = 83; // Approximate exchange rate
    const TROY_OUNCE_TO_GRAM = 31.1035;
    const AHMEDABAD_MARKUP = 1.02; // 2% markup for local rates
    
    const inrPerGram24K = Math.round((usdPerOunce * USD_TO_INR / TROY_OUNCE_TO_GRAM) * AHMEDABAD_MARKUP);
    
    return {
      purity24K: inrPerGram24K,
      purity22K: Math.round(inrPerGram24K * 0.917), // 22K = 91.7% purity
      purity18K: Math.round(inrPerGram24K * 0.750), // 18K = 75% purity
      purity14K: Math.round(inrPerGram24K * 0.583), // 14K = 58.3% purity
      silverPrice: 95, // Approximate silver rate
      isDefault: false,
      lastUpdated: new Date().toISOString(),
      location: 'Ahmedabad, Gujarat'
    };
  }

  // Main function to get current gold prices
  static async getCurrentGoldPrices() {
    // Check cache first
    if (this.cache.data && this.cache.timestamp && 
        (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
      return {
        success: true,
        data: this.cache.data,
        cached: true
      };
    }

    try {
      // Try primary API
      let result = await this.fetchFromMetalsAPI();
      
      if (result.success) {
        const rates = this.convertToIndianRates(result.usdPerOunce);
        this.cache.data = rates;
        this.cache.timestamp = Date.now();
        
        return {
          success: true,
          data: rates,
          source: result.source
        };
      }

      // Try backup API
      result = await this.fetchFromGoldAPI();
      
      if (result.success) {
        const inrPerGram24K = Math.round(result.inrPerOunce / 31.1035);
        const rates = {
          purity24K: inrPerGram24K,
          purity22K: Math.round(inrPerGram24K * 0.917),
          purity18K: Math.round(inrPerGram24K * 0.750),
          purity14K: Math.round(inrPerGram24K * 0.583),
          silverPrice: 95,
          isDefault: false,
          lastUpdated: new Date().toISOString(),
          location: 'Ahmedabad, Gujarat'
        };
        
        this.cache.data = rates;
        this.cache.timestamp = Date.now();
        
        return {
          success: true,
          data: rates,
          source: result.source
        };
      }

      // Use fallback rates
      const fallback = this.getFallbackPrices();
      this.cache.data = fallback.data;
      this.cache.timestamp = Date.now();
      
      return fallback;
      
    } catch (error) {
      console.error('All gold price APIs failed:', error);
      
      // Return fallback rates
      const fallback = this.getFallbackPrices();
      this.cache.data = fallback.data;
      this.cache.timestamp = Date.now();
      
      return fallback;
    }
  }

  // Calculate gold loan amount based on weight, purity and current rates
  static async calculateGoldLoanAmount(weightGrams, purityK, goldPrices = null) {
    try {
      let prices = goldPrices;
      
      if (!prices) {
        const priceResult = await this.getCurrentGoldPrices();
        if (!priceResult.success) {
          throw new Error('Unable to fetch gold prices');
        }
        prices = priceResult.data;
      }

      // Get price per gram based on purity
      let pricePerGram;
      switch (purityK) {
        case 24:
          pricePerGram = prices.purity24K;
          break;
        case 22:
          pricePerGram = prices.purity22K;
          break;
        case 18:
          pricePerGram = prices.purity18K;
          break;
        case 14:
          pricePerGram = prices.purity14K;
          break;
        default:
          // Calculate proportionally for other purities
          pricePerGram = Math.round(prices.purity24K * (purityK / 24));
      }

      const marketValue = weightGrams * pricePerGram;
      const loanAmount = Math.round(marketValue * 0.85); // 85% of market value
      
      return {
        success: true,
        data: {
          marketValue,
          loanAmount,
          pricePerGram,
          weightGrams,
          purityK,
          loanToValueRatio: 0.85,
          priceSource: prices.isDefault ? 'fallback' : 'live',
          calculatedAt: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.error('Gold loan calculation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get historical gold prices (if needed)
  static async getHistoricalPrices(date) {
    try {
      // This would integrate with historical price APIs
      // For now, return current prices
      return await this.getCurrentGoldPrices();
    } catch (error) {
      console.error('Historical prices fetch failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cache (useful for testing or manual refresh)
  static clearCache() {
    this.cache.data = null;
    this.cache.timestamp = null;
  }

  // Get cache info
  static getCacheInfo() {
    return {
      hasCache: !!this.cache.data,
      age: this.cache.timestamp ? Date.now() - this.cache.timestamp : null,
      data: this.cache.data
    };
  }
}

export default GoldPriceService;