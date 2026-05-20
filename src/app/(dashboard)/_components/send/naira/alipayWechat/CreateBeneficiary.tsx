"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { CreateAlipayWechatBeneficiaryApi } from "@/services/transactions";
import { IAlipayWechatBeneficiary } from "@/types/services";
import Button from "@/components/ui/Button";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

interface Props {
  channel: "alipay" | "wechat";
  onCreated: (beneficiary: IAlipayWechatBeneficiary) => void;
  onCancel: () => void;
}

const CreateBeneficiary = ({ channel, onCreated, onCancel }: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [fileError, setFileError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Please upload a JPEG, PNG, GIF, or WebP image.");
      setQrFile(null);
      setPreview("");
      return;
    }

    setFileError("");
    setQrFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !qrFile) return;

    setSubmitError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("channel", channel);
      form.append("name", name.trim());
      form.append("email", email.trim());
      form.append("qr_code", qrFile);

      const beneficiary = await CreateAlipayWechatBeneficiaryApi(form);
      onCreated(beneficiary);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create beneficiary. Please try again.";
      setSubmitError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    !!qrFile &&
    !fileError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-raiz-gray-500 text-xs mb-1.5 block">
          Recipient name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Li Wei"
          className="w-full border border-raiz-gray-200 rounded-2xl px-4 py-3 text-raiz-gray-950 text-sm outline-none focus:border-raiz-purple-500 transition-colors bg-white placeholder:text-raiz-gray-300"
        />
      </div>

      <div>
        <label className="text-raiz-gray-500 text-xs mb-1.5 block">
          Recipient email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. li.wei@example.com"
          className="w-full border border-raiz-gray-200 rounded-2xl px-4 py-3 text-raiz-gray-950 text-sm outline-none focus:border-raiz-purple-500 transition-colors bg-white placeholder:text-raiz-gray-300"
        />
      </div>

      <div>
        <label className="text-raiz-gray-500 text-xs mb-1.5 block">
          QR code image
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-raiz-gray-200 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-raiz-purple-400 transition-colors bg-white"
        >
          {preview ? (
            <Image
              src={preview}
              alt="QR code preview"
              width={80}
              height={80}
              className="rounded-lg object-cover"
            />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-raiz-gray-100 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-raiz-gray-400"
                >
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-raiz-gray-500 text-xs">
                Tap to upload QR code
              </span>
              <span className="text-raiz-gray-300 text-[10px]">
                JPEG, PNG, GIF, or WebP
              </span>
            </>
          )}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 text-raiz-purple-600 text-xs"
          >
            Change image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileError && (
          <p className="text-red-500 text-xs mt-1">{fileError}</p>
        )}
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-xs">{submitError}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          width="full"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || loading}
          width="full"
          
          loading={loading}
        >
        
          {loading ? "Saving…" : "Save beneficiary"}
        </Button>
      </div>
    </form>
  );
};

export default CreateBeneficiary;
