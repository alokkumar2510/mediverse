"use client";

import { useCallback, useState } from "react";
import { useDropzone, type DropzoneOptions, type FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileImage, X, CheckCircle2, AlertCircle } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: DropzoneOptions["accept"];
  maxSize?: number;
  label?: string;
  hint?: string;
  className?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelect,
  accept = { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".bmp"] },
  maxSize = 10 * 1024 * 1024, // 10 MB
  label = "Drop your file here",
  hint = "PNG, JPG, WEBP up to 10 MB",
  className,
  disabled = false,
}: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const msg = rejected[0]?.errors[0]?.message ?? "File not accepted";
        setError(msg);
        return;
      }
      if (accepted[0]) {
        setSelectedFile(accepted[0]);
        onFileSelect(accepted[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        id="file-dropzone"
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all duration-200",
          isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.01]",
          isDragReject && "border-destructive bg-destructive/5",
          !isDragActive && !selectedFile && "border-border hover:border-primary/50 hover:bg-accent/50",
          selectedFile && "border-green-500/50 bg-green-500/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {selectedFile ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
              </div>
              <button
                onClick={clear}
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className={cn(
                "p-4 rounded-2xl transition-colors",
                isDragActive ? "bg-primary/15" : "bg-muted"
              )}>
                {isDragActive ? (
                  <FileImage className="h-8 w-8 text-primary animate-bounce" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {isDragActive ? "Release to upload" : label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  or <span className="text-primary">browse</span> — {hint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-destructive"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  );
}