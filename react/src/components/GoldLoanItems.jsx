import React from "react";
import { Plus, Trash2, X, Upload } from "lucide-react";

const GoldLoanItems = ({ items, errors, loading, onItemsChange, currentGoldPrice }) => {
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "",
      weight: "",
      purity: "22",
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
        
        // Auto-calculate amount based on weight, purity, and current gold price
        if ((field === "weight" || field === "purity") && currentGoldPrice) {
          const weight = parseFloat(field === "weight" ? value : item.weight) || 0;
          const purity = parseFloat(field === "purity" ? value : item.purity) || 22;
          
          if (weight > 0) {
            // Calculate market value: weight * purity ratio * current price
            const marketValue = weight * (purity / 24) * currentGoldPrice.pricePerGram;
            // Loan amount is typically 70-80% of market value
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
    files.forEach((file) => {
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
                  },
                ],
              }
            : item
        );
        onItemsChange(updatedItems);
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
        <h4 className="text-md font-medium text-gray-900">Gold Items</h4>
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

      {currentGoldPrice && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800 text-sm">
            <span className="font-medium">Current Gold Price:</span>
            <span>₹{currentGoldPrice.pricePerGram.toFixed(2)}/gram (24K)</span>
            <span className="text-xs text-yellow-600">
              Last updated: {new Date(currentGoldPrice.lastUpdated).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {items.map((item, index) => (
        <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
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
                  errors[`item_${index}_name`] ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="e.g., Gold Chain, Ring, etc."
                disabled={loading}
              />
              {errors[`item_${index}_name`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (grams) *
              </label>
              <input
                type="number"
                step="0.1"
                value={item.weight}
                onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors[`item_${index}_weight`] ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="0.0"
                disabled={loading}
              />
              {errors[`item_${index}_weight`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_weight`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purity (K)
              </label>
              <select
                value={item.purity}
                onChange={(e) => updateItem(item.id, "purity", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="24">24K</option>
                <option value="22">22K</option>
                <option value="18">18K</option>
                <option value="14">14K</option>
              </select>
            </div>

           
          </div>

          {/* Item Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Photos
            </label>
            <div className="border border-dashed border-gray-300 rounded-lg p-3">
              <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
                <Upload size={14} className="inline mr-1" />
                Add Photos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleItemImageUpload(item.id, e)}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            {item?.images?.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {item.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-16 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemImage(item.id, image.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={loading}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {errors.items && (
        <p className="text-red-500 text-sm">{errors.items}</p>
      )}

    </div>
  );
};

export default GoldLoanItems;
