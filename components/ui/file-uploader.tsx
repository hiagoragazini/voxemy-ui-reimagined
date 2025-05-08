
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, X, AlertCircle, FileIcon } from "lucide-react";

interface FileUploaderProps {
  accept: string;
  maxSize: number; // In MB
  onFileSelect: (file: File) => void;
  label?: string;
  description?: string;
}

export function FileUploader({
  accept,
  maxSize,
  onFileSelect,
  label = "Arraste e solte um arquivo ou clique para selecionar",
  description,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert maxSize to bytes
  const maxSizeBytes = maxSize * 1024 * 1024;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSizeBytes) {
      setError(`O arquivo é muito grande. Tamanho máximo: ${maxSize}MB`);
      return false;
    }

    // Check file type based on accept prop
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = `.${file.name.split('.').pop()}`;
    
    if (
      acceptedTypes.length && 
      !acceptedTypes.some(type => 
        type === file.type || 
        type === fileExtension || 
        (type.includes('*') && file.type.includes(type.replace('*', '')))
      )
    ) {
      setError(`Tipo de arquivo não suportado. Formatos aceitos: ${accept}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        onFileSelect(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        onFileSelect(selectedFile);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleButtonClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        ref={inputRef}
        className="hidden"
      />

      {!file ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200 flex flex-col items-center justify-center
            ${isDragging ? 'border-violet-400 bg-violet-50' : 'border-gray-300 hover:border-gray-400'}
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          style={{ minHeight: '120px' }}
        >
          <UploadCloud className={`h-10 w-10 mb-3 ${error ? 'text-red-400' : 'text-violet-400'}`} />
          
          <p className="text-sm font-medium mb-1">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          
          {error && (
            <div className="flex items-center text-red-600 text-sm mt-2">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="h-8 w-8 text-violet-500 mr-3" />
              <div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemoveFile}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
