import useSWR from "swr";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { fetcher } from "./fetcher";

export function useCompleteSetupTokenValidate(token: string) {
  const { data, error, isLoading, mutate } = useSWR(
    `${getEndpointUrl(
      ENDPOINTS.validateCompleteSetupAccountToken,
    )}?token=${token}`,
    fetcher,
  );
  return { data, error, isLoading, mutate };
}
