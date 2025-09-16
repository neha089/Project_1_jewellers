import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';

const MetalTransactionItems = ({ 
  items, 
  onItemsChange, 
  metalType = "Gold", 
  errors = {}, 
  loading = false,
  transactionType = "SELL" // "BUY" or "SELL"
}) => {
  const [draggedItem, setDraggedItem] = useState(null);

  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      description: '',
      weight: '',
      purity: metalType === "Gold" ? "22K" : "999",
      makingCharges: '0',
      itemValue: '',
      photos: []
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (itemId) => {
    onItemsChange(items.filter(item => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    onItemsChange(items.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handlePhotoUpload = (itemId, event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const item = items.find(item => item.id === itemId);
        if (item) {
          const newPhotos = [...item.photos, {
            id: Date.now() + Math.random(),
            file: file,
            dataUrl: e.target.result,
            name: file.name
          }];
          updateItem(itemId, 'photos', newPhotos);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (itemId, photoId) => {
    const item = items.find(item => item.id === itemId);
    if (item) {
      const newPhotos = item.photos.filter(photo => photo.id !== photoId);
      updateItem(itemId, 'photos', newPhotos);
    }
  };

  const purityOptions = metalType === "Gold" 
    ? ["24K", "22K", "20K", "18K", "16K", "14K", "12K", "10K"]
    : ["999", "925", "900", "800"];

  const getItemError = (itemIndex, field) => {
    return errors[`item_${itemIndex}_${field}`];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">
          {metalType} Items {transactionType === "BUY" ? "Purchased" : "Sold"}
        </h4>
        <button
          type="button"
          onClick={addItem}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
          <p>No items added yet</p>
          <p className="text-sm mt-1">Click "Add Item" to get started</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4 hover:border-gray-300 transition-colors"
          >
            {/* Item Header */}
            <div className="flex items-center justify-between">
              <h5 className="font-medium text-gray-900">
                Item {index + 1}
              </h5>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={loading}
                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Item Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Item Name */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getItemError(index, 'name') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="e.g., Gold Chain, Silver Ring"
                  disabled={loading}
                />
                {getItemError(index, 'name') && (
                  <p className="text-red-500 text-xs mt-1">{getItemError(index, 'name')}</p>
                )}
              </div>

              {/* Purity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purity *
                </label>
                <select
                  value={item.purity}
                  onChange={(e) => updateItem(item.id, 'purity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  {purityOptions.map(purity => (
                    <option key={purity} value={purity}>{purity}</option>
                  ))}
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (grams) *
                </label>
                <input
                  type="number"
                  value={item.weight}
                  onChange={(e) => updateItem(item.id, 'weight', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getItemError(index, 'weight') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.001"
                  disabled={loading}
                />
                {getItemError(index, 'weight') && (
                  <p className="text-red-500 text-xs mt-1">{getItemError(index, 'weight')}</p>
                )}
              </div>

              {/* Making Charges */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Making Charges (₹)
                </label>
                <input
                  type="number"
                  value={item.makingCharges}
                  onChange={(e) => updateItem(item.id, 'makingCharges', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              {/* Item Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Value (₹) *
                </label>
                <input
                  type="number"
                  value={item.itemValue}
                  onChange={(e) => updateItem(item.id, 'itemValue', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getItemError(index, 'itemValue') 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
                {getItemError(index, 'itemValue') && (
                  <p className="text-red-500 text-xs mt-1">{getItemError(index, 'itemValue')}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Optional item description..."
                rows={2}
                disabled={loading}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos
              </label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                    <Upload size={16} />
                    <span>Upload Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoUpload(item.id, e)}
                      disabled={loading}
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    Max 5MB per photo
                  </span>
                </div>

                {/* Photo Preview */}
                {item.photos && item.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {item.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="w-full h-20 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(item.id, photo.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          disabled={loading}
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                          {photo.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Items Summary */}
      {items.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">Summary</h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Items:</span>
              <p className="font-medium">{items.length}</p>
            </div>
            <div>
              <span className="text-gray-600">Total Weight:</span>
              <p className="font-medium">
                {items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0).toFixed(3)}g
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total Value:</span>
              <p className="font-medium">
                ₹{items.reduce((sum, item) => sum + (parseFloat(item.itemValue) || 0), 0).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total Making Charges:</span>
              <p className="font-medium">
                ₹{items.reduce((sum, item) => sum + (parseFloat(item.makingCharges) || 0), 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error for items array */}
      {errors.items && (
        <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.items}
        </div>
      )}
    </div>
  );
};

export default MetalTransactionItems;