"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadB2bBusinessImage } from "@/services/user";
import { useUser } from "@/lib/hooks/useUser";
import { toast } from "sonner";
import { normalizeS3ObjectUrl } from "@/utils/helpers";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

const MAX_FILE_SIZE_BYTES = 5_242_880; // 5 MiB
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const sizeClasses = {
  sm: { img: "size-14", btn: "size-7 -bottom-0.5 -right-0.5", icon: 12 },
  md: { img: "size-16", btn: "size-6 bottom-0 right-0", icon: 14 },
};

const ProfileAvatarUpload = ({ size = "md", className = "" }: Props) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayImage =
    previewUrl ||
    normalizeS3ObjectUrl(user?.business_account?.business_image) ||
    "/images/default-pfp.svg";

  const uploadImgMutation = useMutation({
    mutationFn: (file: File) => uploadB2bBusinessImage(file),
    onSuccess: (response) => {
      toast.success(response?.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setPreviewUrl(null);
    },
    onError: (err: unknown) => {
      setPreviewUrl(null);
      // AuthAxios already toasts API errors. Toast only for non-API failures (e.g. S3 PUT).
      if (err instanceof Error) {
        toast.error(err.message || "Failed to upload image");
      }
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadFile = useCallback(
    (selectedFile: File) => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      uploadImgMutation.mutate(selectedFile);
    },
    [previewUrl, uploadImgMutation],
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      toast.warning("Image size should be less than 5MB");
      return;
    }
    if (!VALID_TYPES.includes(selectedFile.type as (typeof VALID_TYPES)[number])) {
      toast.warning("Please upload a valid image file (JPEG, PNG, WEBP)");
      return;
    }
    uploadFile(selectedFile);
    if (inputRef.current) inputRef.current.value = "";
  };

  const dims = sizeClasses[size];
  const busy = uploadImgMutation.isPending;

  return (
    <div className={`relative shrink-0 ${className}`}>
      <Image
        src={displayImage}
        width={size === "sm" ? 56 : 64}
        height={size === "sm" ? 56 : 64}
        alt="Profile"
        className={`${dims.img} rounded-full object-cover`}
        onError={() => setPreviewUrl("/images/default-pfp.svg")}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`${dims.btn} bg-raiz-gray-700 rounded-full border-2 border-white absolute left-[20%] flex items-center justify-center ${
          busy ? "opacity-50 cursor-not-allowed" : "active:scale-95"
        }`}
        aria-label="Upload profile picture"
      >
        {busy ? (
          <span className="text-[10px] text-white animate-spin">⌀</span>
        ) : (
          <Image
            src="/icons/camera.svg"
            width={dims.icon}
            height={dims.icon}
            alt=""
          />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleImageUpload}
        disabled={busy}
      />
    </div>
  );
};

export default ProfileAvatarUpload;
