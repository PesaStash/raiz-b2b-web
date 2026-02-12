import { z } from "zod";

export const nameRegex = /^[A-Za-z\-]{3,}$/;

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
  2: z.object({
    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .refine(
        (password) =>
          [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/].filter((regex) =>
            regex.test(password)
          ).length >= 2,
        {
          message:
            "Password must contain at least 2 of these: one uppercase, one lowercase, one number, one special character",
        }
      ),
  }),
  3: z
    .object({
      password: z.string().optional(), // Include password as optional
      confirmPassword: z.string().nonempty("Confirm Password is required"),
    })
    .refine((data) => data.confirmPassword === data.password, {
      message: "Password must match with your new password",
      path: ["confirmPassword"],
    }),
  4: z.object({
    otp: z
      .string()
      .length(6, "OTP must be exactly 6 characters")
      .regex(/^[A-Za-z0-9]{6}$/, "OTP must only contain letters and numbers"),
  }),
  5: z.object({}),
};

export const generalOTPFormSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be exactly 6 characters")
    .regex(/^[A-Za-z0-9]{6}$/, "OTP must only contain letters and numbers"),
});

// export const registerFormSchema = z.object({
//   firstName: z.string().nonempty("First name is required"),
//   lastName: z.string().nonempty("Last name is required"),
//   email: z.string().email("Invalid email address"),
//   password: z
//     .string({
//       required_error: "Password is required",
//     })
//     .min(8, "Password must be at least 8 characters")
//     .refine(
//       (password) =>
//         [/[A-Z]/, /[a-z]/, /\d/, /[!@#$%^&*(),.?":{}|<>]/].filter((regex) =>
//           regex.test(password)
//         ).length >= 2,
//       {
//         message:
//           "Password must contain at least 2 of these rules: one uppercase letter, one lowercase letter, one numeric character, one special character",
//       }
//     ),
//   // username: z
//   //   .string()
//   //   .min(3, "Username must be at least 3 characters long")
//   //   .regex(
//   //     /^[a-zA-Z0-9._]+$/,
//   //     "Usernames can only contain letters, numbers, underscores, and periods."
//   //   ),
//   // phone_number: z
//   //   .string()
//   //   .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
//   // country_id: z.string().min(1, "Country is required"),
//   referral_code: z.string().optional(),
//   otp: z
//     .string()
//     .length(4, "OTP must be exactly 4 digits")
//     .regex(/^\d{4}$/, "OTP must only contain numbers"),
//   // useCases: z.array(z.number()).optional(),
// });

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
    .min(8, "Password must be at least 8 characters"),
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
