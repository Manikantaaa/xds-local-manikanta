import useSWR from "swr";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { authFetcher } from "./fetcher";

export function usePortfolioFiles(companyId: number) {
  if (companyId != 0) {
    const { data, error, isLoading, mutate } = useSWR(
      `${getEndpointUrl(ENDPOINTS.getCompanyPortfolio(companyId))}`,
      authFetcher,
    );
    return { data, error, isLoading, mutate };
  }
  else {
    const { data, error, isLoading, mutate } = useSWR(
      `${getEndpointUrl(ENDPOINTS.getSponcerslogoUrls("sponsered"))}`,
      authFetcher,
    );
    return { data, error, isLoading, mutate };
  }
}
