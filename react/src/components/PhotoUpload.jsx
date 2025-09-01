import React from "react";
import { Upload, Trash2 } from "lucide-react";

const PhotoUpload = ({ photos, loading, onPhotosChange }) => {
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      if (photos.length < 3) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto = {
            id: Date.now() + Math.random(),
            name: file.name,
            dataUrl: e.target.result,
          };
          onPhotosChange([...photos, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removePhoto = (photoId) => {
    onPhotosChange(photos.filter((photo) => photo.id !== photoId));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Photos (Optional)
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Upload Photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            disabled={loading}
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">Max 3 photos</p>
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.dataUrl}
                alt={photo.name}
                className="w-full h-20 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={loading}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;