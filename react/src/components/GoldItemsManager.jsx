// components/GoldItemsManager.jsx - Fixed with Better API Integration
import React, { useState, useCallback } from "react";
import { 
  Plus, Trash2, Calculator, Clock, TrendingUp, 
  DollarSign, Info, X, Upload, RefreshCw, AlertTriangle
} from "lucide-react";
import GoldPriceService from "../services/goldPriceService";

const GoldItemsManager = ({
  items,
  goldPrices,
  loadingPrices,
  autoCalculationEnabled,
  calculatingAmount,
  errors,
  loading,
  onItemsChange,
  onAutoCalculationToggle,
  onRefreshPrices,
  calculateTotalAmount
}) => {
  
  const [calculatingItems, setCalculatingItems] = useState(new Set());
  const [priceErrors, setPriceErrors] = useState({});

  // Add new item
  const addItem = () => {
    const newItems = [
      ...items,
      {
        id: Date.now() + Math.random(), // Ensure unique ID
        name: "",
        weight: "",
        amount: "",
        purity: "22",
        images: [],
        autoCalculated: false,
        marketValue: 0,
        pricePerGram: 0,
      },
    ];
    onItemsChange(newItems);
  };

  // Remove item with confirmation for items with data
  const removeItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    const hasData = item && (item.name || item.weight || item.amount || item.images.length > 0);
    
    if (hasData && !window.confirm('Are you sure you want to remove this item? All data will be lost.')) {
      return;
    }
    
    const newItems = items.filter((item) => item.id !== itemId);
    onItemsChange(newItems);
  };

  // Update item field with validation
  const updateItem = useCallback((itemId, field, value) => {
    const newItems = items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Reset auto-calculated flag if manually editing amount
        if (field === "amount" && item.autoCalculated) {
          updatedItem.autoCalculated = false;
        }
        
        // Clear errors for this field
        if (priceErrors[itemId]) {
          setPriceErrors(prev => ({
            ...prev,
            [itemId]: null
          }));
        }
        
        return updatedItem;
      }
      return item;
    });
    
    onItemsChange(newItems);

    // Trigger auto-calculation if weight or purity changed and auto-calc is enabled
    if ((field === "weight" || field === "purity") && value && autoCalculationEnabled && goldPrices) {
      // Debounce the calculation to avoid too many API calls
      setTimeout(() => handleItemCalculation(itemId), 500);
    }
  }, [items, onItemsChange, autoCalculationEnabled, goldPrices, priceErrors]);

  // Calculate individual item amount using external API with error handling
  const handleItemCalculation = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item || !item.weight || !item.purity) return;

    const weight = parseFloat(item.weight);
    const purity = parseInt(item.purity);

    // Validation
    if (weight <= 0) {
      setPriceErrors(prev => ({...prev, [itemId]: 'Weight must be greater than 0'}));
      return;
    }

    if (purity < 1 || purity > 24) {
      setPriceErrors(prev => ({...prev, [itemId]: 'Purity must be between 1K and 24K'}));
      return;
    }

    setCalculatingItems(prev => new Set([...prev, itemId]));

    try {
      const calculation = await GoldPriceService.calculateGoldLoanAmount(
        weight,
        purity,
        goldPrices
      );
      
      if (calculation.success) {
        const newItems = items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              amount: calculation.data.loanAmount.toFixed(2),
              autoCalculated: true,
              marketValue: calculation.data.marketValue,
              pricePerGram: calculation.data.pricePerGram
            };
          }
          return item;
        });
        
        onItemsChange(newItems);
        setPriceErrors(prev => ({...prev, [itemId]: null}));
      } else {
        setPriceErrors(prev => ({
          ...prev, 
          [itemId]: calculation.error || 'Calculation failed'
        }));
      }
    } catch (error) {
      console.error('Item calculation failed:', error);
      setPriceErrors(prev => ({
        ...prev, 
        [itemId]: 'Calculation failed - please try again'
      }));
    } finally {
      setCalculatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Calculate all items
  const calculateAllItems = async () => {
    if (!goldPrices) {
      alert('Gold prices not available. Please refresh prices first.');
      return;
    }

    const itemsToCalculate = items.filter(item => 
      item.weight && item.purity && parseFloat(item.weight) > 0
    );

    if (itemsToCalculate.length === 0) {
      alert('No items with valid weight and purity found.');
      return;
    }

    for (const item of itemsToCalculate) {
      await handleItemCalculation(item.id);
    }
  };

  // Handle item image upload with validation
  const handleItemImageUpload = (itemId, e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has invalid type. Only JPEG, PNG, and WebP are allowed.`);
        return false;
      }
      return true;
    });

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newItems = items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                images: [
                  ...item.images,
                  {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    dataUrl: e.target.result,
                    size: file.size,
                    type: file.type
                  },
                ].slice(0, 5), // Limit to 5 images per item
              }
            : item
        );
        onItemsChange(newItems);
      };
      reader.onerror = () => {
        alert(`Failed to read file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove item image
  const removeItemImage = (itemId, imageId) => {
    const newItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            images: item.images.filter((img) => img.id !== imageId),
          }
        : item
    );
    onItemsChange(newItems);
  };

  // Get price display color based on market conditions
  const getPriceDisplayColor = (prices) => {
    if (!prices || prices.isDefault) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Format price trend display
  const formatPriceSource = (prices) => {
    if (!prices) return 'Loading...';
    if (prices.isDefault) return 'Default rates (Live prices unavailable)';
    return `Live rates • Last updated: ${new Date(prices.lastUpdated).toLocaleTimeString()}`;
  };

  return (
    <div className="space-y-4">
      {/* Current Gold Prices Display */}
      <div className={`border rounded-lg p-4 ${goldPrices?.isDefault ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className={getPriceDisplayColor(goldPrices)} size={16} />
            <h4 className={`font-medium ${getPriceDisplayColor(goldPrices)}`}>
              Current Gold Prices - Ahmedabad
            </h4>
            {goldPrices?.isDefault && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                <AlertTriangle size={10} />
                Default
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshPrices}
              disabled={loadingPrices}
              className={`text-xs px-3 py-1 rounded border transition-colors flex items-center gap-1 ${
                loadingPrices 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <RefreshCw size={12} className={loadingPrices ? 'animate-spin' : ''} />
              {loadingPrices ? 'Updating...' : 'Refresh Prices'}
            </button>
          </div>
        </div>
        
        {goldPrices ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
              <div className="bg-white rounded-lg p-3 border">
                <span className={`${getPriceDisplayColor(goldPrices)} font-medium`}>22K Gold:</span>
                <div className="font-bold text-lg text-gray-900">₹{goldPrices.purity22K}/g</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <span className={`${getPriceDisplayColor(goldPrices)} font-medium`}>24K Gold:</span>
                <div className="font-bold text-lg text-gray-900">₹{goldPrices.purity24K}/g</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <span className={`${getPriceDisplayColor(goldPrices)} font-medium`}>18K Gold:</span>
                <div className="font-bold text-lg text-gray-900">₹{goldPrices.purity18K}/g</div>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <span className={`${getPriceDisplayColor(goldPrices)} font-medium`}>Silver:</span>
                <div className="font-bold text-lg text-gray-900">₹{goldPrices.silverPrice}/g</div>
              </div>
            </div>
            <div className={`text-xs p-2 rounded ${goldPrices.isDefault ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              <div className="flex items-center justify-between">
                <span>
                  Loan amounts auto-calculated at 85% of market value • {formatPriceSource(goldPrices)}
                </span>
                {goldPrices.note && (
                  <span className="italic">• {goldPrices.note}</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="animate-spin mx-auto mb-2">
              <RefreshCw size={20} />
            </div>
            <div className="text-sm text-gray-600">Loading gold prices...</div>
          </div>
        )}
      </div>

      {/* Items Header with Controls */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          Gold Items ({items.length})
          {autoCalculationEnabled && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
              <Calculator size={10} />
              Auto-calc ON
            </span>
          )}
        </h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={calculateAllItems}
            disabled={!goldPrices || items.length === 0 || calculatingAmount}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Calculator size={12} />
            Calculate All
          </button>
          <button
            type="button"
            onClick={() => onAutoCalculationToggle(!autoCalculationEnabled)}
            className={`text-xs px-3 py-1 rounded transition-colors flex items-center gap-1 ${
              autoCalculationEnabled 
                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Calculator size={10} />
            {autoCalculationEnabled ? 'Disable Auto-calc' : 'Enable Auto-calc'}
          </button>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Items List */}
      {items.map((item, index) => {
        const itemCalculating = calculatingItems.has(item.id);
        const itemError = priceErrors[item.id];
        
        return (
          <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-800 flex items-center gap-2">
                Item {index + 1}
                {item.autoCalculated && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                    <Calculator size={10} />
                    Auto-calculated
                  </span>
                )}
              </h5>
              <div className="flex items-center gap-2">
                {itemCalculating && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                    <RefreshCw size={10} className="animate-spin" />
                    Calculating...
                  </span>
                )}
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                    disabled={loading}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {itemError && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1">
                <AlertTriangle size={12} />
                {itemError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors[`item_${index}_name`] ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="e.g., Gold Chain, Ring, Coin"
                  disabled={loading}
                />
                {errors[`item_${index}_name`] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {errors[`item_${index}_name`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (grams) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  value={item.weight}
                  onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors[`item_${index}_weight`] ? "border-red-300 bg-red-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="0.0"
                  disabled={loading}
                />
                {errors[`item_${index}_weight`] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {errors[`item_${index}_weight`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purity (K)
                </label>
                <select
                  value={item.purity}
                  onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 transition-colors"
                  disabled={loading}
                >
                  <option value="24">24K (Pure Gold)</option>
                  <option value="22">22K (Standard)</option>
                  <option value="18">18K (Jewelry)</option>
                  <option value="14">14K (Lower Grade)</option>
                  <option value="10">10K (Minimal)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  Loan Amount (₹) *
                  {item.autoCalculated && goldPrices && (
                    <button
                      type="button"
                      onClick={() => handleItemCalculation(item.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 px-1 py-0.5 rounded hover:bg-blue-50"
                      disabled={loading || itemCalculating}
                    >
                      <RefreshCw size={10} className={itemCalculating ? 'animate-spin' : ''} />
                      Recalc
                    </button>
                  )}
                </label>
                <input
                  type="number"
                  step="1"
                  min="100"
                  max="10000000"
                  value={item.amount}
                  onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors[`item_${index}_amount`] ? "border-red-300 bg-red-50" : 
                    item.autoCalculated ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  placeholder="Auto-calculated based on weight & purity"
                  disabled={loading}
                />
                {errors[`item_${index}_amount`] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    {errors[`item_${index}_amount`]}
                  </p>
                )}
                {item.autoCalculated && item.marketValue && (
                  <div className="text-xs mt-1 space-y-1 bg-green-50 p-2 rounded border border-green-200">
                    <p className="text-green-700 flex items-center justify-between">
                      <span>Market value:</span>
                      <span className="font-medium">₹{item.marketValue.toFixed(2)}</span>
                    </p>
                    <p className="text-green-700 flex items-center justify-between">
                      <span>Rate per gram:</span>
                      <span className="font-medium">₹{item.pricePerGram}/g</span>
                    </p>
                    <p className="text-blue-700 flex items-center justify-between border-t border-green-300 pt-1">
                      <span>Loan (85%):</span>
                      <span className="font-bold">₹{item.amount}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Item Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Photos (Optional - Max 5 photos, 5MB each)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors">
                <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-2 w-fit">
                  <Upload size={14} />
                  Add Photos ({item.images.length}/5)
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleItemImageUpload(item.id, e)}
                    className="hidden"
                    disabled={loading || item.images.length >= 5}
                  />
                </label>
              </div>

              {item.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-3">
                  {item.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.dataUrl}
                        alt={image.name}
                        className="w-full h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemImage(item.id, image.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        disabled={loading}
                        title="Remove photo"
                      >
                        <X size={10} />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
                        {image.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {errors.items && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-700 text-sm flex items-center gap-1">
            <AlertTriangle size={14} />
            {errors.items}
          </p>
        </div>
      )}

      {/* Total Amount Display */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700 flex items-center gap-2">
            <DollarSign size={16} className="text-blue-600" />
            Total Loan Amount:
          </span>
          <span className="text-3xl font-bold text-blue-600">
            ₹{calculateTotalAmount().toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>
            {items.length} item{items.length !== 1 ? 's' : ''} • 
            Total weight: {items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(1)}g
          </span>
          <span className="flex items-center gap-1 text-blue-600">
            <Info size={12} />
            85% of market value • LTV Ratio
          </span>
        </div>
        {items.some(item => item.autoCalculated) && (
          <div className="text-xs text-green-700 mt-2 bg-green-100 rounded p-2">
            Auto-calculated items use live gold prices. Manual amounts override calculations.
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldItemsManager;