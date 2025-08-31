// components/PhotoUpload.jsx - Enhanced Photo Upload Component
import React from "react";
import { Upload, Trash2, Image, AlertTriangle } from "lucide-react";

const PhotoUpload = ({
  photos,
  onPhotosChange,
  loading,
  showUpload = true
}) => {
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxPhotos = 3;
    
    // Filter valid files
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is 5MB.`);
        return false;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`File "${file.name}" has invalid type. Only JPEG, PNG, and WebP are allowed.`);
        return false;
      }
      return true;
    });

    // Check total photo limit
    const remainingSlots = maxPhotos - photos.length;
    const filesToProcess = validFiles.slice(0, remainingSlots);
    
    if (validFiles.length > remainingSlots) {
      alert(`Only ${remainingSlots} more photo(s) can be added. Maximum limit is ${maxPhotos} photos.`);
    }

    // Process valid files
    filesToProcess.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = {
          id: Date.now() + index,
          name: file.name,
          dataUrl: e.target.result,
          size: file.size,
          type: file.type,
          uploadDate: new Date().toISOString()
        };
        
        onPhotosChange(prevPhotos => [...prevPhotos, newPhoto]);
      };
      
      reader.onerror = () => {
        alert(`Failed to read file "${file.name}". Please try again.`);
      };
      
      reader.readAsDataURL(file);
    });

    // Clear the input
    e.target.value = '';
  };

  const removePhoto = (photoId) => {
    if (window.confirm('Are you sure you want to remove this photo?')) {
      const newPhotos = photos.filter((photo) => photo.id !== photoId);
      onPhotosChange(newPhotos);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (!showUpload) return null;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Image size={14} />
          Transaction Photos (Optional)
          <span className="text-xs text-gray-500">
            ({photos.length}/3 photos)
          </span>
        </label>
        
        {/* Upload Area */}
        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          photos.length >= 3 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}>
          {photos.length < 3 ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  loading 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}>
                  <Upload size={16} />
                  Choose Photos
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={loading || photos.length >= 3}
                  />
                </label>
                <p className="text-xs text-gray-500">
                  or drag and drop images here
                </p>
              </div>
              <div className="mt-4 text-xs text-gray-500 space-y-1">
                <p>• Maximum 3 photos • Max 5MB each</p>
                <p>• Supports JPEG, PNG, WebP formats</p>
                <p>• Photos help with loan verification and records</p>
              </div>
            </>
          ) : (
            <div className="text-gray-500">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">Maximum photo limit reached (3/3)</p>
              <p className="text-xs mt-1">Remove a photo to add new ones</p>
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h6 className="font-medium text-gray-900">Uploaded Photos</h6>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div key={photo.id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="aspect-w-16 aspect-h-12">
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-32 object-cover"
                  />
                </div>
                
                {/* Photo Info */}
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 truncate" title={photo.name}>
                    {photo.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(photo.size)} • {photo.type.split('/')[1].toUpperCase()}
                  </div>
                  {photo.uploadDate && (
                    <div className="text-xs text-gray-400 mt-1">
                      Uploaded: {new Date(photo.uploadDate).toLocaleTimeString()}
                    </div>
                  )}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:opacity-100"
                  disabled={loading}
                  title="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
                
                {/* Photo Number */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black bg-opacity-50 text-white text-xs rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Tips */}
      {photos.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h6 className="text-sm font-medium text-blue-900 mb-2">Photo Tips:</h6>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Take clear, well-lit photos of items or documents</li>
            <li>• Include multiple angles for gold items</li>
            <li>• Capture any serial numbers or hallmarks</li>
            <li>• Photos serve as backup documentation</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;