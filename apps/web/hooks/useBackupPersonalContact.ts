import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { authFetcher } from "./fetcher";

export async function useBackupPersonalContact(userId: number) {
  const data = await authFetcher(`${getEndpointUrl(ENDPOINTS.backupPersonalContact(userId))}`);
  return { data };
}
