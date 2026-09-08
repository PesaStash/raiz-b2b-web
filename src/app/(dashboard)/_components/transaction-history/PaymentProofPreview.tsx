"use client";

import CenterModalHeader from "@/components/layouts/CenterModalHeader";
import Button from "@/components/ui/Button";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  proofUrl: string;
  onBack: () => void;
}

type ProofKind = "image" | "pdf" | "unknown";

const proofKindFromUrl = (url: string): ProofKind => {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(pathname)) return "image";
    if (pathname.endsWith(".pdf")) return "pdf";
  } catch {
    return "unknown";
  }
  return "unknown";
};

function saveBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function filenameFromDisposition(header: string | null, fallback: string) {
  const match = header?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

const PaymentProofPreview = ({ proofUrl, onBack }: Props) => {
  const [failedImage, setFailedImage] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const kind = proofKindFromUrl(proofUrl);
  const showImage = kind === "image" || (kind === "unknown" && !failedImage);

  const downloadProof = async () => {
    setDownloading(true);
    try {
      const response = await fetch("/api/payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: proofUrl }),
      });
      if (!response.ok) {
        throw new Error("Unable to download payment proof");
      }

      const blob = await response.blob();
      saveBlob(
        blob,
        filenameFromDisposition(
          response.headers.get("content-disposition"),
          "payment-proof",
        ),
      );
    } catch {
      toast.error("Unable to download payment proof. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CenterModalHeader close={onBack} />
      <h2 className="mb-4 text-xl font-bold text-raiz-gray-950">
        Payment Proof
      </h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-raiz-gray-50">
        {showImage ? (
          // Signed proof URLs are used as-is and may come from any host.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proofUrl}
            alt="Payment proof"
            className="max-h-[60vh] w-full object-contain"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <iframe
            src={proofUrl}
            title="Payment proof"
            className="h-[60vh] w-full border-0"
          />
        )}
      </div>
      <div className="w-full py-5">
        <Button
          onClick={downloadProof}
          loading={downloading}
          disabled={downloading}
          className="gap-1.5 items-center"
          variant="secondary"
        >
          Download telex
        </Button>
      </div>
    </div>
  );
};

export default PaymentProofPreview;
