"use client";

import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadProfilePicture } from "@/services/user";
import { useUser } from "@/lib/hooks/useUser";
import { toast } from "sonner";
import { uploadFileToS3 } from "@/utils/helpers";

type Props = {
  size?: "sm" | "md";
  className?: string;
};

const sizeClasses = {
  sm: { img: "size-14", btn: "size-7 -bottom-0.5 -right-0.5", icon: 12 },
  md: { img: "size-16", btn: "size-6 bottom-0 right-0", icon: 14 },
};

const ProfileAvatarUpload = ({ size = "md", className = "" }: Props) => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const displayImage =
    previewUrl ||
    user?.business_account?.business_image ||
    "/images/default-pfp.svg";

  const uploadImgMutation = useMutation({
    mutationFn: (imageUrl: string) => UploadProfilePicture(imageUrl),
    onSuccess: (response) => {
      toast.success(response?.message);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setPreviewUrl(null);
    },
    onError: () => {
      setPreviewUrl(null);
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const uploadFile = useCallback(
    async (selectedFile: File) => {
      setIsUploading(true);
      try {
        const { url } = await uploadFileToS3(selectedFile, selectedFile.name);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(selectedFile));
        uploadImgMutation.mutate(url);
      } catch (err: unknown) {
        toast.error((err as Error)?.message || "Failed to upload image");
        setPreviewUrl(null);
      } finally {
        setIsUploading(false);
      }
    },
    [previewUrl, uploadImgMutation],
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.warning("Image size should be less than 5MB");
      return;
    }
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.warning("Please upload a valid image file (JPEG, PNG, WEBP)");
      return;
    }
    uploadFile(selectedFile);
    if (inputRef.current) inputRef.current.value = "";
  };

  const dims = sizeClasses[size];
  const busy = isUploading || uploadImgMutation.isPending;

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
