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
  showChooseLink?: boolean;
  onChooseBeneficiary?: () => void;
  submitLabel?: string;
}

const CreateBeneficiary = ({
  channel,
  onCreated,
  showChooseLink = false,
  onChooseBeneficiary,
  submitLabel = "Save Recipient",
}: Props) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
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
      // phone is UI-only for design parity; API does not accept it yet

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

  const inputClassName =
    "w-full bg-[#f4f2f7] rounded-2xl px-4 py-3.5 text-raiz-gray-950 text-sm outline-none placeholder:text-raiz-gray-400 focus:ring-2 focus:ring-primary2/15";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-raiz-gray-950 text-sm font-bold leading-tight">
          Add Beneficiary
        </h4>
        {showChooseLink && onChooseBeneficiary && (
          <button
            type="button"
            onClick={onChooseBeneficiary}
            className="text-primary2 text-sm font-medium"
          >
            Choose Beneficiary
          </button>
        )}
      </div>

      <div>
        <label className="text-raiz-gray-950 text-xs font-medium mb-1.5 block">
          Recipient Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter full name"
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-raiz-gray-950 text-xs font-medium mb-1.5 block">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-raiz-gray-950 text-xs font-medium mb-1.5 block">
          Phone Number (Optional)
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter a china number"
          className={inputClassName}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-dashed border-[#0f8c8c] bg-[rgba(230,235,255,0.3)] rounded-lg p-5 flex flex-col items-center gap-2.5 hover:bg-[rgba(230,235,255,0.5)] transition-colors"
        >
          {preview ? (
            <>
              <Image
                src={preview}
                alt="QR code preview"
                width={80}
                height={80}
                className="rounded-lg object-cover"
              />
              <span className="text-[#0f8c8c] text-[13px] underline">Change</span>
            </>
          ) : (
            <>
              <div className="relative size-10 overflow-hidden">
                <Image
                  src="/icons/document-upload.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="size-full object-contain"
                />
              </div>
              <p className="text-raiz-gray-700 text-sm text-center">
                Upload a QR Code Image
              </p>
              <span className="text-[#0f8c8c] text-[13px] underline">Browse</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        {fileError && <p className="text-red-500 text-xs mt-1">{fileError}</p>}
      </div>

      {submitError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200">
          <p className="text-red-600 text-xs">{submitError}</p>
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          disabled={!isValid || loading}
          width="full"
          loading={loading}
        >
          {loading ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default CreateBeneficiary;
