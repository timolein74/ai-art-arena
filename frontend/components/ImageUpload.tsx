'use client';

import { useState, useCallback } from 'react';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  disabled?: boolean;
  currentImage?: string;
}

export function ImageUpload({ onUpload, disabled, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    setError(null);
    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to Cloudinary
      const cloudName = 'dpsad3ivn';
      const uploadPreset = 'ai_art_arena';
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload failed');
      }

      onUpload(data.secure_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearImage = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <label 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-48
          rounded-2xl cursor-pointer overflow-hidden
          transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'}
          ${dragActive ? 'ring-2 ring-purple-500 ring-offset-2' : ''}
          ${preview 
            ? 'border-2 border-green-400 shadow-lg shadow-green-100' 
            : 'border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50 hover:border-purple-400'
          }
        `}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); clearImage(); }}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-sm bg-green-500 px-3 py-1 rounded-full shadow-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Uploaded</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {uploading ? (
              <>
                <div className="w-12 h-12 mb-3">
                  <svg className="w-full h-full animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
                <p className="text-purple-600 font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mb-3 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-1">
                  {dragActive ? 'Drop your image here!' : 'Click or drag to upload'}
                </p>
                <p className="text-gray-400 text-sm">PNG, JPG, GIF up to 10MB</p>
              </>
            )}
          </div>
        )}
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled || uploading}
        />
      </label>

      {error && (
        <p className="text-sm text-red-500 text-center px-4 py-2 rounded-lg bg-red-50 border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}

export default ImageUpload;
