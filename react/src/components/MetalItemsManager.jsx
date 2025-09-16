import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Camera, X, Calculator } from 'lucide-react';

const MetalItemsManager = ({ 
  items = [], 
  onItemsChange, 
  metalType = "Gold", 
  currentPrices = null,
  errors = {},
  loading = false 
}) => {
  const [localItems, setLocalItems] = useState(items);

  // Gold purity options
  const goldPurities = [
    { value: '24K', label: '24K (99.9% Pure)', purity: 0.999 },
    { value: '22K', label: '22K (91.6% Pure)', purity: 0.916 },
    { value: '20K', label: '20K (83.3% Pure)', purity: 0.833 },
    { value: '18K', label: '18K (75% Pure)', purity: 0.75 },
    { value: '16K', label: '16K (66.6% Pure)', purity: 0.666 },
    { value: '14K', label: '14K (58.3% Pure)', purity: 0.583 },
    { value: '12K', label: '12K (50% Pure)', purity: 0.5 },
    { value: '10K', label: '10K (41.6% Pure)', purity: 0.416 }
  ];

  // Silver purity options
  const silverPurities = [
    { value: '999', label: '999 (99.9% Pure)', purity: 0.999 },
    { value: '925', label: '925 (Sterling Silver)', purity: 0.925 },
    { value: '900', label: '900 (Coin Silver)', purity: 0.9 },
    { value: '800', label: '800 (European Silver)', purity: 0.8 }
  ];

  const purities = metalType === "Gold" ? goldPurities : silverPurities;

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Default item structure
  const createNewItem = () => ({
    id: Date.now() + Math.random(),
    itemName: '',
    description: '',
    purity: metalType === "Gold" ? '22K' : '925',
    weight: '',
    ratePerGram: '',
    makingCharges: '0',
    wastage: '0',
    taxAmount: '0',
    photos: [],
    hallmarkNumber: '',
    certificateNumber: ''
  });

  const addItem = () => {
    const newItems = [...localItems, createNewItem()];
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const removeItem = (itemId) => {
    const newItems = localItems.filter(item => item.id !== itemId);
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const updateItem = (itemId, field, value) => {
    const newItems = localItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate item total when relevant fields change
        if (['weight', 'ratePerGram', 'makingCharges', 'wastage', 'taxAmount'].includes(field)) {
          updatedItem.calculatedTotal = calculateItemTotal(updatedItem);
        }
        
        return updatedItem;
      }
      return item;
    });
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  const calculateItemTotal = (item) => {
    const weight = parseFloat(item.weight) || 0;
    const rate = parseFloat(item.ratePerGram) || 0;
    const making = parseFloat(item.makingCharges) || 0;
    const wastage = parseFloat(item.wastage) || 0;
    const tax = parseFloat(item.taxAmount) || 0;
    
    const baseAmount = weight * rate;
    const wastageAmount = (baseAmount * wastage) / 100;
    const total = baseAmount + wastageAmount + making + tax;
    
    return total.toFixed(2);
  };

  const useCurrentPrice = (itemId, purity) => {
    if (!currentPrices || !currentPrices.rates) return;
    
    const priceForPurity = currentPrices.rates[purity];
    if (priceForPurity) {
      const priceInRupees = priceForPurity / 100; // Convert from paise
      updateItem(itemId, 'ratePerGram', priceInRupees.toString());
    }
  };

  const handlePhotoAdd = (itemId, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const newPhoto = {
        id: Date.now() + Math.random(),
        file: file,
        dataUrl: e.target.result,
        name: file.name
      };
      
      const newItems = localItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            photos: [...item.photos, newPhoto]
          };
        }
        return item;
      });
      
      setLocalItems(newItems);
      onItemsChange(newItems);
    };
    
    reader.readAsDataURL(file);
  };

  const removePhoto = (itemId, photoId) => {
    const newItems = localItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          photos: item.photos.filter(photo => photo.id !== photoId)
        };
      }
      return item;
    });
    
    setLocalItems(newItems);
    onItemsChange(newItems);
  };

  // Calculate total weight and amount across all items
  const totals = localItems.reduce(
    (acc, item) => {
      const weight = parseFloat(item.weight) || 0;
      const total = parseFloat(calculateItemTotal(item)) || 0;
      return {
        weight: acc.weight + weight,
        amount: acc.amount + total
      };
    },
    { weight: 0, amount: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header with totals */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {metalType} Items ({localItems.length})
          </h3>
          <p className="text-sm text-gray-500">
            Add individual {metalType.toLowerCase()} items with their details
          </p>
        </div>
        
        {localItems.length > 0 && (
          <div className="text-right bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-700">
              Total Weight: {totals.weight.toFixed(2)}g
            </div>
            <div className="text-lg font-bold text-blue-800">
              Total Amount: ₹{totals.amount.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Current prices display */}
      {currentPrices && !currentPrices.isFallback && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2">
            Current {metalType} Prices (₹/gram)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {Object.entries(currentPrices.rates).map(([purity, price]) => (
              <div key={purity} className="text-green-700">
                <span className="font-medium">{purity}:</span> ₹{(price / 100).toFixed(0)}
              </div>
            ))}
          </div>
          <p className="text-xs text-green-600 mt-2">
            Last updated: {new Date(currentPrices.fetchedAt || Date.now()).toLocaleString()}
          </p>
        </div>
      )}

      {/* Items list */}
      <div className="space-y-6">
        {localItems.map((item, index) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
            {/* Item header */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-md font-semibold text-gray-800">
                Item {index + 1}
              </h4>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={loading}
                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                title="Remove item"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Item details grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Item Name */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={item.itemName}
                  onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${index}_name`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Gold Chain, Silver Ring"
                  disabled={loading}
                />
                {errors[`item_${index}_name`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
                )}
              </div>

              {/* Purity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purity *
                </label>
                <div className="flex gap-2">
                  <select
                    value={item.purity}
                    onChange={(e) => updateItem(item.id, 'purity', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  >
                    {purities.map(purity => (
                      <option key={purity.value} value={purity.value}>
                        {purity.label}
                      </option>
                    ))}
                  </select>
                  {currentPrices && (
                    <button
                      type="button"
                      onClick={() => useCurrentPrice(item.id, item.purity)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      title="Use current market price"
                    >
                      <Calculator size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (grams) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={item.weight}
                  onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${index}_weight`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.000"
                  disabled={loading}
                />
                {errors[`item_${index}_weight`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
                )}
              </div>

              {/* Rate per gram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate per Gram (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.ratePerGram}
                  onChange={(e) => updateItem(item.id, 'ratePerGram', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[`item_${index}_rate`] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors[`item_${index}_rate`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_rate`]}</p>
                )}
              </div>

              {/* Making Charges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Making Charges (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.makingCharges}
                  onChange={(e) => updateItem(item.id, 'makingCharges', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>

              {/* Wastage % */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wastage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={item.wastage}
                  onChange={(e) => updateItem(item.id, 'wastage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.0"
                  disabled={loading}
                />
              </div>

              {/* Tax Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.taxAmount}
                  onChange={(e) => updateItem(item.id, 'taxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hallmark Number
                </label>
                <input
                  type="text"
                  value={item.hallmarkNumber}
                  onChange={(e) => updateItem(item.id, 'hallmarkNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate Number
                </label>
                <input
                  type="text"
                  value={item.certificateNumber}
                  onChange={(e) => updateItem(item.id, 'certificateNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Optional item description..."
                disabled={loading}
              />
            </div>

            {/* Photos */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              <div className="flex flex-wrap gap-3">
                {item.photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(item.id, photo.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoAdd(item.id, e.target.files[0])}
                    className="hidden"
                    disabled={loading}
                  />
                  <Camera size={20} className="text-gray-400" />
                </label>
              </div>
            </div>

            {/* Item total */}
            {(item.weight && item.ratePerGram) && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Item Calculation:</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Base: {item.weight}g × ₹{item.ratePerGram}/g = ₹{((parseFloat(item.weight) || 0) * (parseFloat(item.ratePerGram) || 0)).toFixed(2)}</div>
                  {parseFloat(item.wastage || 0) > 0 && (
                    <div>Wastage ({item.wastage}%): +₹{(((parseFloat(item.weight) || 0) * (parseFloat(item.ratePerGram) || 0) * (parseFloat(item.wastage) || 0)) / 100).toFixed(2)}</div>
                  )}
                  {parseFloat(item.makingCharges || 0) > 0 && (
                    <div>Making Charges: +₹{parseFloat(item.makingCharges || 0).toFixed(2)}</div>
                  )}
                  {parseFloat(item.taxAmount || 0) > 0 && (
                    <div>Tax: +₹{parseFloat(item.taxAmount || 0).toFixed(2)}</div>
                  )}
                </div>
                <div className="text-sm font-bold text-gray-800 mt-2 pt-2 border-t border-gray-200">
                  Item Total: ₹{calculateItemTotal(item)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add item button */}
      <div className="text-center">
        <button
          type="button"
          onClick={addItem}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={16} />
          Add {metalType} Item
        </button>
      </div>

      {/* Error message for items */}
      {errors.items && (
        <div className="text-red-500 text-sm text-center">
          {errors.items}
        </div>
      )}
    </div>
  );
};

export default MetalItemsManager;
