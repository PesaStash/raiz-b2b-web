"use client";

import Image from "next/image";
import React, { useRef } from "react";

export const SWIFT_INVOICE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];
export const SWIFT_MAX_INVOICE_BYTES = 15 * 1024 * 1024;

export function validateSwiftInvoice(file: File): string | null {
  if (!SWIFT_INVOICE_TYPES.includes(file.type)) {
    return "Upload a JPEG, PNG, GIF, WEBP, or PDF invoice.";
  }
  if (file.size > SWIFT_MAX_INVOICE_BYTES) {
    return "Invoice must be 15 MB or smaller.";
  }
  return null;
}

interface Props {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
  onError?: (message: string) => void;
}

const SwiftInvoiceDropzone = ({ file, error, onChange, onError }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (next?: File) => {
    if (!next) {
      onChange(null);
      onError?.("");
      return;
    }
    const validationError = validateSwiftInvoice(next);
    if (validationError) {
      onChange(null);
      onError?.(validationError);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onError?.("");
    onChange(next);
  };

  return (
    <div className="w-full">
      <p className="text-raiz-gray-950 text-sm font-medium mb-3">
        Invoice upload (optional)
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border border-dashed border-[#0f8c8c] bg-[rgba(230,235,255,0.3)] rounded-lg p-5 flex flex-col items-center gap-3.5 hover:bg-[rgba(230,235,255,0.5)] transition-colors"
      >
        <div className="relative size-10 overflow-hidden">
          <Image
            src="/icons/document-upload.svg"
            alt=""
            width={40}
            height={40}
            className="size-full object-contain"
          />
        </div>
        {file ? (
          <>
            <p className="text-raiz-gray-700 text-sm text-center break-all">
              {file.name}
            </p>
            <span className="text-[#0f8c8c] text-[13px] underline">Change</span>
          </>
        ) : (
          <>
            <p className="text-raiz-gray-700 text-sm text-center">
              Upload a PDF or image
            </p>
            <span className="text-[#0f8c8c] text-[13px] underline">Browse</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,image/jpeg,image/png,image/gif,image/webp,application/pdf"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {error ? <p className="text-red-600 text-xs mt-2">{error}</p> : null}
      {file ? (
        <button
          type="button"
          onClick={() => {
            handleFile(undefined);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="mt-2 text-raiz-gray-500 text-xs underline"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
};

export default SwiftInvoiceDropzone;
