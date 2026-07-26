/**
 * Temporary client-side encryption for payment-link URL query params only.
 * Remove once payment links use plain query params or backend-signed tokens.
 * NEXT_PUBLIC_ENCRYPTION_KEY remains required until that migration is done.
 */
import AES256 from "aes-everywhere";

const PUBLIC_KEY = `${process.env.NEXT_PUBLIC_ENCRYPTION_KEY}`;

export const encryptData = (data: string): string =>
  AES256.encrypt(data, PUBLIC_KEY);

export const decryptData = (encryptedData: string): string =>
  AES256.decrypt(encryptedData, PUBLIC_KEY);
