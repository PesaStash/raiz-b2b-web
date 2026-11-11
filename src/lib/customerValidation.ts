import { z } from "zod";

export interface CustomerValues {
  customerType: string;
  fullname: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country_code: string;
}

export type CustomerErrors = Partial<Record<keyof CustomerValues, string>>;

/** Validate raw Formik values so empty strings retain field-specific messages. */
export function validateCustomer(values: CustomerValues): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!["individual", "business"].includes(values.customerType)) {
    return { customerType: "Select a customer type." };
  }
  const name = values.customerType === "individual" ? "fullname" : "companyName";
  const nameLabel = name === "fullname" ? "Full name" : "Business name";
  if (!values[name]?.trim()) errors[name] = `${nameLabel} is required.`;
  else if (values[name].trim().length < 2)
    errors[name] = `${nameLabel} must contain at least 2 characters.`;

  if (!values.email?.trim()) errors.email = "Email address is required.";
  else if (!z.string().email().safeParse(values.email.trim()).success)
    errors.email = "Enter a valid email address.";
  if (!values.phone?.trim()) errors.phone = "Phone number is required.";
  else if (!/^\+?[1-9]\d{6,14}$/.test(values.phone) || values.phone.length < 10)
    errors.phone = "Enter a valid phone number including the country code.";
  if (!values.address?.trim()) errors.address = "Street address is required.";
  else if (values.address.trim().length < 3)
    errors.address = "Enter a complete street address.";
  if (!values.city?.trim()) errors.city = "City is required.";
  if (!values.state?.trim()) errors.state = "State or region is required.";
  if (!/^[A-Z]{2}$/.test(values.country_code ?? ""))
    errors.country_code = "Select an address country.";
  return errors;
}
