// goldPriceService.js - Service to fetch current gold prices from external APIs

class GoldPriceService {
  constructor() {
    this.cache = null;
    this.cacheExpiry = null;
    this.cacheValidityMinutes = 30; // Cache for 30 minutes
  }

  async getCurrentGoldPrice() {
    // Check if we have valid cached data
    if (this.cache && this.cacheExpiry && new Date() < this.cacheExpiry) {
      console.log("Returning cached gold price");
      return this.cache;
    }

    try {
      console.log("Fetching fresh gold price data...");
      
      // Try multiple APIs for reliability
      let priceData = null;
      
      // Primary API - MetalpriceAPI (free tier)
      try {
        priceData = await this.fetchFromMetalPriceAPI();
      } catch (error) {
        console.log("MetalpriceAPI failed, trying backup...");
      }

      // Backup API - GoldAPI
      if (!priceData) {
        try {
          priceData = await this.fetchFromGoldAPI();
        } catch (error) {
          console.log("GoldAPI failed, trying another backup...");
        }
      }

      // Backup API - CurrencyAPI (has precious metals)
      if (!priceData) {
        try {
          priceData = await this.fetchFromCurrencyAPI();
        } catch (error) {
          console.log("CurrencyAPI failed, using fallback...");
        }
      }

      // Final fallback - use a reasonable default price
      if (!priceData) {
        console.log("All APIs failed, using fallback price");
        priceData = this.getFallbackPrice();
      }

      // Cache the result
      this.cache = priceData;
      this.cacheExpiry = new Date(Date.now() + this.cacheValidityMinutes * 60 * 1000);

      return priceData;
    } catch (error) {
      console.error("Failed to fetch gold price:", error);
      return this.getFallbackPrice();
    }
  }

  async fetchFromMetalPriceAPI() {
    // MetalpriceAPI - Free tier allows limited requests
    const response = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=YOUR_API_KEY&base=INR&symbols=XAU');
    
    if (!response.ok) {
      throw new Error('MetalpriceAPI request failed');
    }

    const data = await response.json();
    
    if (data.success && data.rates && data.rates.XAU) {
      // XAU is price per troy ounce in INR
      // Convert to price per gram (1 troy ounce = 31.1035 grams)
      const pricePerGram = data.rates.XAU / 31.1035;
      
      return {
        pricePerGram: Math.round(pricePerGram),
        currency: 'INR',
        source: 'MetalpriceAPI',
        lastUpdated: new Date().toISOString(),
        quality: '24K',
      };
    }
    
    throw new Error('Invalid MetalpriceAPI response');
  }

  async fetchFromGoldAPI() {
    // Alternative: GoldAPI (may require API key)
    const response = await fetch('https://www.goldapi.io/api/XAU/INR');
    
    if (!response.ok) {
      throw new Error('GoldAPI request failed');
    }

    const data = await response.json();
    
    if (data.price_gram_24k) {
      return {
        pricePerGram: Math.round(data.price_gram_24k),
        currency: 'INR',
        source: 'GoldAPI',
        lastUpdated: new Date().toISOString(),
        quality: '24K',
      };
    }
    
    throw new Error('Invalid GoldAPI response');
  }

  async fetchFromCurrencyAPI() {
    // Using a free currency API that includes precious metals
    // Note: This might not have gold prices, but keeping as example
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
    
    if (!response.ok) {
      throw new Error('CurrencyAPI request failed');
    }

    // This API typically doesn't have gold rates, so this will likely fail
    // Keeping as placeholder for when you find a suitable free API
    throw new Error('CurrencyAPI does not provide gold rates');
  }

  async fetchFromIndianGoldRateAPI() {
    // Try to fetch from an Indian gold rate API (if available)
    // This is a placeholder - you'll need to find a suitable Indian API
    try {
      const response = await fetch('https://api.example-indian-gold.com/current-rate');
      const data = await response.json();
      
      if (data.goldPrice24K) {
        return {
          pricePerGram: Math.round(data.goldPrice24K),
          currency: 'INR',
          source: 'Indian Gold Rate API',
          lastUpdated: new Date().toISOString(),
          quality: '24K',
        };
      }
    } catch (error) {
      console.log('Indian Gold Rate API failed:', error);
    }
    
    throw new Error('Indian Gold Rate API not available');
  }

  getFallbackPrice() {
    // Fallback with a reasonable current price for Indian market
    // You should update this periodically or fetch from a reliable source
    const basePricePerGram = 6800; // Approximate 24K gold price in INR per gram
    
    // Add some randomness to simulate market fluctuation (±2%)
    const fluctuation = (Math.random() - 0.5) * 0.04; // -2% to +2%
    const currentPrice = basePricePerGram * (1 + fluctuation);

    return {
      pricePerGram: Math.round(currentPrice),
      currency: 'INR',
      source: 'Fallback Price',
      lastUpdated: new Date().toISOString(),
      quality: '24K',
      note: 'Using fallback price - live data unavailable',
    };
  }

  // Convert 24K price to other purities
  convertPurity(price24K, targetPurityK) {
    return (price24K * targetPurityK) / 24;
  }

  // Get historical price (mock implementation)
  async getHistoricalPrice(date) {
    // This would connect to a historical price API
    // For now, return current price with a note
    const currentPrice = await this.getCurrentGoldPrice();
    return {
      ...currentPrice,
      note: 'Historical prices not available - showing current price',
      requestedDate: date,
    };
  }

  // Calculate price for different purities
  getPricesForAllPurities(price24K) {
    return {
      '24K': price24K,
      '22K': this.convertPurity(price24K, 22),
      '18K': this.convertPurity(price24K, 18),
      '14K': this.convertPurity(price24K, 14),
    };
  }

  // Validate if price seems reasonable (basic sanity check)
  isPriceReasonable(pricePerGram) {
    // Gold price in India typically ranges from 5000-8000 INR per gram
    return pricePerGram >= 4000 && pricePerGram <= 10000;
  }

  // Clear cache manually if needed
  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  }

  // Get cache status
  getCacheStatus() {
    return {
      hasCache: !!this.cache,
      cacheValid: this.cacheExpiry && new Date() < this.cacheExpiry,
      cacheExpiry: this.cacheExpiry,
      minutesUntilExpiry: this.cacheExpiry 
        ? Math.max(0, Math.ceil((this.cacheExpiry - new Date()) / (1000 * 60)))
        : 0,
    };
  }
}

export default new GoldPriceService();