import { AuthAxios, CustomAxiosRequestConfig } from "@/lib/authAxios";
import { PublicAxios } from "@/lib/publicAxios";
import { ICountry } from "@/types/misc";
import { RoutingNumberInfoResponse } from "@/types/services";

export const FetchCountriesWithIdApi = async (
  country_id: string | null,
): Promise<ICountry> => {
  const response = await AuthAxios.get(`/countries/${country_id}/`);
  return response?.data;
};

export async function GetUsdBankName({
  rn,
}: {
  rn: string;
}): Promise<RoutingNumberInfoResponse> {
  const response = await PublicAxios.get(
    `https://routing-number-bank-lookup.p.rapidapi.com/api/v1/${rn}?paymentType=wire&format=json`,
    {
      headers: {
        "X-Rapidapi-Key": "57495f0247msh190d549d1481a5dp1d95a6jsn47144fb0ae66",
        "X-Rapidapi-Host": "routing-number-bank-lookup.p.rapidapi.com",
        Host: "routing-number-bank-lookup.p.rapidapi.com",
      },
      silent: true,
    } as CustomAxiosRequestConfig,
  );

  // console.log('CALLED GET USD BANK NAME', response.data[0]);
  return response.data[0];
}
