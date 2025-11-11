'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

interface DocumentUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function DocumentUpload({
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/jpg'],
  className,
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: UploadedFile[] = [];
    const remainingSlots = maxFiles - files.length;

    Array.from(fileList).slice(0, remainingSlots).forEach((file) => {
      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        return;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File ${file.name} is not a supported type`);
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = {
        id,
        file,
        uploading: false,
        uploaded: false,
      };

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, preview: e.target?.result as string } : f))
          );
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
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
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    const updatedFiles = files.filter((f) => f.id !== id);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Attachments (optional)
      </label>
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        
        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Supported: PDF, DOCX, TXT, PNG, JPG (max {maxSizeMB}MB each, up to {maxFiles} files)
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.file.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                    {getFileIcon(file.file)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.file.size)}</p>
                </div>
                {file.uploading && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                )}
                {file.uploaded && (
                  <span className="text-xs text-green-600">Uploaded</span>
                )}
                {file.error && (
                  <span className="text-xs text-red-600">{file.error}</span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeFile(file.id)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

