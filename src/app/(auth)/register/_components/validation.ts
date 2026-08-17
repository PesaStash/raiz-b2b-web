import { z } from "zod";

export const nameRegex = /^[A-Za-z\-]{3,}$/;

export const newPasswordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password must be at most 200 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one symbol",
  );

export const otpSchema = z
  .string()
  .trim()
  .length(6, "OTP must be exactly 6 characters")
  .regex(/^[A-Za-z0-9]{6}$/, "OTP must only contain letters and numbers");

export function sanitizeOtpInput(value: string, length = 6) {
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, length);
}

export const registerFormSchemas = {
  1: z.object({
    firstName: z
      .string()
      .nonempty("First name is required")
      .min(3, "First name must be at least 3 characters")
      .regex(nameRegex, "First name can only contain letters and hyphens"),
    lastName: z
      .string()
      .nonempty("Last name is required")
      .min(3, "Last name must be at least 3 characters")
      .regex(nameRegex, "Last name can only contain letters and hyphens"),
    email: z.string().email("Invalid email address"),
    country_id: z.string().min(1, "Country is required"),
    referral_code: z.string().optional(),
  }),
  2: z
    .object({
      password: newPasswordSchema,
      confirmPassword: z.string().nonempty("Confirm Password is required"),
      referral_code: z.string().optional(),
    })
    .refine((data) => data.confirmPassword === data.password, {
      message: "Password must match with your new password",
      path: ["confirmPassword"],
    }),
  3: z.object({
    otp: otpSchema,
  }),
  4: z.object({}),
};

export const generalOTPFormSchema = z.object({
  otp: otpSchema,
});

export const loginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
    })
    .trim()
    .email("Invalid email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(1, "Password is required")
    .max(200, "Password must be at most 200 characters"),
});

export const pinSchema = z
  .object({
    pin: z
      .string()
      .length(4, "PIN must be exactly 4 digits")
      .regex(/^\d{4}$/, "PIN must contain only numbers"),
    confirmPin: z
      .string()
      .length(4, "PIN must be exactly 4 digits")
      .regex(/^\d{4}$/, "PIN must contain only numbers"),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: "PINs must match",
    path: ["confirmPin"],
  });
