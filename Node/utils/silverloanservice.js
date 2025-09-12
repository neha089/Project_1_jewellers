// utils/silverloanservice.js
import fs from 'fs/promises';
import path from 'path';

class SilverPriceService {
  constructor() {
    this.priceFilePath = path.join(process.cwd(), 'data', 'silver-prices.json');
    this.defaultPrices = {
      purity99_9: 85.00, // 99.9% pure silver per gram
      purity92_5: 78.00, // 92.5% sterling silver per gram
      purity80: 68.00,   // 80% silver per gram
      lastUpdated: new Date().toISOString(),
      source: 'manual'
    };
    this.loanToValueRatio = 0.75; // 75% of silver value
  }

  // Ensure data directory and price file exists
  async ensureDataDirectory() {
    try {
      const dataDir = path.dirname(this.priceFilePath);
      await fs.mkdir(dataDir, { recursive: true });
      
      try {
        await fs.access(this.priceFilePath);
      } catch (error) {
        // File doesn't exist, create it with default prices
        await fs.writeFile(this.priceFilePath, JSON.stringify(this.defaultPrices, null, 2));
      }
    } catch (error) {
      console.error('Error ensuring data directory:', error);
    }
  }

  // Get current silver prices
  async getCurrentPrices() {
    try {
      await this.ensureDataDirectory();
      const data = await fs.readFile(this.priceFilePath, 'utf8');
      const prices = JSON.parse(data);
      
      return {
        success: true,
        data: {
          purity99_9: prices.purity99_9 || this.defaultPrices.purity99_9,
          purity92_5: prices.purity92_5 || this.defaultPrices.purity92_5,
          purity80: prices.purity80 || this.defaultPrices.purity80,
          lastUpdated: prices.lastUpdated || new Date().toISOString(),
          source: prices.source || 'default',
          loanToValueRatio: this.loanToValueRatio
        }
      };
    } catch (error) {
      console.error('Error getting current silver prices:', error);
      return {
        success: false,
        error: 'Failed to get current silver prices',
        data: this.defaultPrices
      };
    }
  }

  // Update silver prices
  async updatePrices(newPrices) {
    try {
      await this.ensureDataDirectory();
      
      const currentPrices = await this.getCurrentPrices();
      const updatedPrices = {
        ...currentPrices.data,
        ...newPrices,
        lastUpdated: new Date().toISOString()
      };

      // Validate prices
      if (updatedPrices.purity99_9 <= 0 || updatedPrices.purity92_5 <= 0 || updatedPrices.purity80 <= 0) {
        return {
          success: false,
          error: 'All silver prices must be greater than 0'
        };
      }

      await fs.writeFile(this.priceFilePath, JSON.stringify(updatedPrices, null, 2));
      
      return {
        success: true,
        data: updatedPrices,
        message: 'Silver prices updated successfully'
      };
    } catch (error) {
      console.error('Error updating silver prices:', error);
      return {
        success: false,
        error: 'Failed to update silver prices'
      };
    }
  }

  // Calculate silver loan amount based on weight and purity
  async calculateSilverAmount(weightGrams, purityPercent = 92.5) {
    try {
      const prices = await this.getCurrentPrices();
      
      if (!prices.success) {
        return prices;
      }

      let pricePerGram;
      
      // Determine price based on purity
      if (purityPercent >= 99.9) {
        pricePerGram = prices.data.purity99_9;
      } else if (purityPercent >= 92.5) {
        pricePerGram = prices.data.purity92_5;
      } else if (purityPercent >= 80) {
        pricePerGram = prices.data.purity80;
      } else {
        // Calculate proportional price for lower purities
        pricePerGram = prices.data.purity80 * (purityPercent / 80);
      }

      const marketValue = weightGrams * pricePerGram;
      const loanAmount = marketValue * this.loanToValueRatio;

      return {
        success: true,
        data: {
          weightGrams: parseFloat(weightGrams),
          purityPercent: parseFloat(purityPercent),
          pricePerGram: parseFloat(pricePerGram.toFixed(2)),
          marketValue: parseFloat(marketValue.toFixed(2)),
          loanAmount: parseFloat(loanAmount.toFixed(2)),
          loanToValueRatio: this.loanToValueRatio,
          calculatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error calculating silver amount:', error);
      return {
        success: false,
        error: 'Failed to calculate silver loan amount'
      };
    }
  }

  // Calculate gold amount (for compatibility with existing code)
  async calculateGoldAmount(weightGrams, purityK) {
    // Convert karat to percentage for silver (this is a fallback)
    // In reality, silver doesn't use karat system, but keeping for compatibility
    let purityPercent;
    switch (parseInt(purityK)) {
      case 24: purityPercent = 99.9; break;
      case 22: purityPercent = 92.5; break;
      case 18: purityPercent = 80; break;
      default: purityPercent = (purityK / 24) * 99.9; break;
    }
    
    return this.calculateSilverAmount(weightGrams, purityPercent);
  }

  // Get price history (basic implementation)
  async getPriceHistory(days = 30) {
    try {
      // This is a basic implementation - in production, you'd store historical data
      const currentPrices = await this.getCurrentPrices();
      
      if (!currentPrices.success) {
        return currentPrices;
      }

      // Generate mock historical data for demonstration
      const history = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Add some random variation to demonstrate price changes
        const variation = (Math.random() - 0.5) * 2; // ±1 rupee variation
        
        history.push({
          date: date.toISOString().split('T')[0],
          purity99_9: parseFloat((currentPrices.data.purity99_9 + variation).toFixed(2)),
          purity92_5: parseFloat((currentPrices.data.purity92_5 + variation * 0.9).toFixed(2)),
          purity80: parseFloat((currentPrices.data.purity80 + variation * 0.8).toFixed(2))
        });
      }

      return {
        success: true,
        data: {
          history,
          period: `${days} days`,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting price history:', error);
      return {
        success: false,
        error: 'Failed to get price history'
      };
    }
  }

  // Calculate interest based on current silver value
  async calculateInterestOnCurrentValue(originalAmountPaise, weightGrams, purityPercent, interestRateMonthly) {
    try {
      const currentCalculation = await this.calculateSilverAmount(weightGrams, purityPercent);
      
      if (!currentCalculation.success) {
        return currentCalculation;
      }

      const currentValuePaise = Math.round(currentCalculation.data.loanAmount * 100);
      const monthlyInterestPaise = Math.round((currentValuePaise * interestRateMonthly) / 100);
      
      return {
        success: true,
        data: {
          originalLoanAmountPaise: originalAmountPaise,
          currentLoanValuePaise: currentValuePaise,
          valueDifferencePaise: currentValuePaise - originalAmountPaise,
          monthlyInterestPaise: monthlyInterestPaise,
          monthlyInterestRupees: monthlyInterestPaise / 100,
          interestRateMonthly: interestRateMonthly,
          calculatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error calculating interest on current value:', error);
      return {
        success: false,
        error: 'Failed to calculate interest on current value'
      };
    }
  }

  // Bulk calculate for multiple items
  async bulkCalculateItems(items) {
    const results = [];
    
    for (const item of items) {
      const calculation = await this.calculateSilverAmount(
        item.weightGrams, 
        item.purityPercent || 92.5
      );
      
      results.push({
        ...item,
        calculation: calculation.success ? calculation.data : null,
        error: calculation.success ? null : calculation.error
      });
    }

    return {
      success: true,
      data: results,
      calculatedAt: new Date().toISOString()
    };
  }
}

// Create singleton instance
export const silverPriceService = new SilverPriceService();  