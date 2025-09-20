import React from "react";
import { Plus, Trash2, X, Upload } from "lucide-react";

const SilverLoanItems = ({ items, errors, loading, onItemsChange, currentSilverPrice }) => {
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      weightGram: "",
      amount: "",
      purity: "99.9",
      images: [],
    };
    onItemsChange([...items, newItem]);
  };

  const removeItem = (itemId) => {
    onItemsChange(items.filter((item) => item.id !== itemId));
  };

  const updateItem = (itemId, field, value) => {
    const updatedItems = items.map((item) => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        if ((field === "weightGram" || field === "purity") && currentSilverPrice) {
          const weight = parseFloat(field === "weightGram" ? value : item.weightGram) || 0;
          const purity = parseFloat(field === "purity" ? value : item.purity) || 99.9;
          
          if (weight > 0) {
            const marketValue = weight * (purity / 100) * currentSilverPrice.pricePerGram;
            const loanAmount = marketValue * 0.75;
            updatedItem.amount = loanAmount.toFixed(2);
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const handleItemImageUpload = (itemId, e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024;
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
        const updatedItems = items.map((item) =>
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
                ].slice(0, 5),
              }
            : item
        );
        onItemsChange(updatedItems);
      };
      reader.onerror = () => {
        alert(`Failed to read file ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeItemImage = (itemId, imageId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            images: item.images.filter((img) => img.id !== imageId),
          }
        : item
    );
    onItemsChange(updatedItems);
  };

  const calculateTotalAmount = () => {
    return items.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-900">Silver Items</h4>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          disabled={loading}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {currentSilverPrice && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-800 text-sm">
            <span className="font-medium">Current Silver Price:</span>
            <span>₹{currentSilverPrice.pricePerGram.toFixed(2)}/gram (99.9%)</span>
            <span className="text-xs text-blue-600">
              Last updated: {new Date(currentSilverPrice.lastUpdated).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h5 className="font-medium text-gray-800">Item {index + 1}</h5>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700"
                disabled={loading}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_name`] ? "border-red-300 bg-red-50" : "border-blue-300 hover:border-blue-400"
                }`}
                placeholder="e.g., Silver Coin, Chain, Bar"
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
                value={item.weightGram}
                onChange={(e) => updateItem(item.id, "weightGram", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_weightGram`] ? "border-red-300 bg-red-50" : "border-blue-300 hover:border-blue-400"
                }`}
                placeholder="0.0"
                disabled={loading}
              />
              {errors[`item_${index}_weightGram`] && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {errors[`item_${index}_weightGram`]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="90"
                max="99.9"
                value={item.purity}
                onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400"
                placeholder="99.9"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (₹) *
                {currentSilverPrice && (
                  <span className="text-xs text-blue-600 block">Auto-calculated</span>
                )}
              </label>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => updateItem(item.id, "amount", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_amount`] ? "border-red-300 bg-red-50" : "border-blue-300 hover:border-blue-400"
                } ${currentSilverPrice ? "bg-blue-50" : ""}`}
                placeholder="0"
                disabled={loading}
              />
              {errors[`item_${index}_amount`] && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  {errors[`item_${index}_amount`]}
                </p>
              )}
              {currentSilverPrice && item.weightGram && item.purity && (
                <p className="text-xs text-blue-600 mt-1">
                  Market value: ₹{(parseFloat(item.weightGram || 0) * (parseFloat(item.purity || 99.9) / 100) * currentSilverPrice.pricePerGram).toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Item Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Photos (Optional - Max 5 photos, 5MB each)
            </label>
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-3 hover:border-blue-400">
              <label className="cursor-pointer bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors flex items-center gap-2 w-fit">
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

            {item?.images?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2">
                {item.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-16 object-cover rounded border border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemImage(item.id, image.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      disabled={loading}
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
      ))}

      {errors.items && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-red-700 text-sm flex items-center gap-1">
            <AlertTriangle size={14} />
            {errors.items}
          </p>
        </div>
      )}

      {/* Total Amount Display */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-700">Total Loan Amount:</span>
          <span className="text-xl font-bold text-blue-600">
            ₹{calculateTotalAmount().toFixed(2)}
          </span>
        </div>
        {currentSilverPrice && (
          <div className="text-xs text-blue-600 mt-1">
            Based on current silver price: ₹{currentSilverPrice.pricePerGram.toFixed(2)}/gram (99.9%)
          </div>
        )}
      </div>
    </div>
  );
};

export default SilverLoanItems;
