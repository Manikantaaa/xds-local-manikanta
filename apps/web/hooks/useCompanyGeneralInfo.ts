import useSWR from "swr";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { authFetcher } from "./fetcher";

export function useCompanyGeneral(companyId: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `${getEndpointUrl(ENDPOINTS.companyGeneralInfo(companyId))}`,
    authFetcher,
  );
  return { data, error, isLoading, mutate };
}
