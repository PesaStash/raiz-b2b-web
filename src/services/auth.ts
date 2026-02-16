import { AuthAxios } from "@/lib/authAxios";
import { PublicAxios } from "@/lib/publicAxios";
import { IChangePasswordPayload, IResetPinPayload } from "@/types/services";

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  country_id: string;
  referral_code: string | null;
}

export interface IResetPasswordPayload {
  password: string;
  otp: string;
  email: string;
}

export async function CountriesApi() {
  const response = await PublicAxios.get("/countries/");
  return response.data;
}

export const SignupApi = async (data: IRegisterPayload) => {
  const response = await PublicAxios.post("/business/auth/sign-up/", data);
  return response?.data;
};

export const SignupVerifyOtpApi = async (data: {
  otp: string;
  email: string;
}) => {
  const response = await PublicAxios.post("/business/auth/verify-otp/", data, {
    params: {
      medium: "email",
    },
  });
  return response?.data;
};

export const ResendSignupOtpApi = async (data: { email: string }) => {
  const response = await PublicAxios.post("/business/auth/refresh-otp/", data, {
    params: {
      medium: "email",
    },
  });
  return response?.data;
};

export async function LoginApi(data: ILoginPayload) {
  const response = await PublicAxios.post("/business/auth/login/", data);
  return response.data;
}

export const LoginOtpApi = async (data: { email: string; otp: string }) => {
  const response = await PublicAxios.post("/business/auth/login/otp/", data, {
    params: {
      medium: "email",
    },
  });
  return response?.data;
};

export const ForgotPasswordApi = async (data: { email: string }) => {
  const response = await PublicAxios.post(
    "/business/auth/forgot-password/",
    data
  );
  return response?.data;
};

export const ResetPasswordApi = async (data: IResetPasswordPayload) => {
  const response = await PublicAxios.post(
    "/business/auth/business/reset-password/",
    data
  );
  return response?.data;
};

export const LogoutApi = async (token: string) => {
  const response = await AuthAxios.post("/business/auth/logout/", null, {
    params: {
      token,
    },
  });
  return response?.data;
};

export async function ForgotTransactionPinApi() {
  const response = await AuthAxios.post(
    "/business/auth/transaction-pin/forgot/"
  );
  return response.data;
}

export async function SetTransactionPinApi(data: { transaction_pin: string }) {
  const response = await AuthAxios.patch(
    "/business/auth/transaction-pin/",
    data
  );
  return response.data;
}

export async function ResetTransactionPinApi(data: IResetPinPayload) {
  const response = await AuthAxios.patch(
    "/business/auth/transaction-pin/reset/",
    data
  );
  return response.data;
}

export const ChangePasswordApi = async (data: IChangePasswordPayload) => {
  const response = await AuthAxios.patch(
    "/business/auth/password/change/",
    data
  );
  return response?.data;
};
