"use client";

import { copyToClipboard } from "@/utils/helpers";
import Image from "next/image";
import React from "react";


interface CopyButtonProps {
    value: string;              
    className?: string;         
    iconSrc?: string;          
    alt?: string;            
    size?: number;            
}

const CopyButton = ({
    value,
    className,
    iconSrc = "/icons/copy.svg",
    alt = "copy",
    size = 16,
}: CopyButtonProps) => {
    return (
        <button
            type="button"
            onClick={() => copyToClipboard(value)}
            className={className}
        >
            <Image src={iconSrc} alt={alt} width={size} height={size} />
        </button>
    );
};

export default CopyButton;
