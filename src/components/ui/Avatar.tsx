"use client";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  name: string;
  src: string | null;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  name = "User",
  src,
  size = 48,
  className,
}) => {
  const { selectedCurrency } = useCurrencyStore();
  const [imageError, setImageError] = useState(false);

  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const showDefaultImage =
    (!name || name.trim() === "" || name === "User") &&
    (!src || src.trim() === "" || imageError);
  const showInitials =
    name && (!src || src.trim() === "" || imageError) && !showDefaultImage;
  const showImage = src && !imageError && !showDefaultImage;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-full  text-white ${
        selectedCurrency.name === "USD" ? "bg-raiz-usd-primary" : "bg-primary"
      } ${className} `}
      style={{ width: size, height: size, fontSize: size / 3 }}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name}
          className="rounded-full object-cover"
          width={size}
          height={size}
          onError={() => setImageError(true)}
        />
      ) : showInitials ? (
        <span>{getInitials(name)}</span>
      ) : (
        <Image
          src="/images/default-pfp.svg"
          alt="Default Avatar"
          className="rounded-full object-cover"
          width={size}
          height={size}
        />
      )}
    </div>
  );
};

export default Avatar;
