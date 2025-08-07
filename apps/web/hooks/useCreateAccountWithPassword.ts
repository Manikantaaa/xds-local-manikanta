import { useState } from "react";
import { UseAccountRegisterProps } from "@/types/user.type";
import axios from "axios";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";

interface UseAccountRegisterResult {
  isLoading: boolean;
  error: {message: string, status: number};
  success: boolean;
  setupPassword: ({
    token,
    password,
  }: UseAccountRegisterProps) => Promise<void>;
}

const useAccountRegister = (): UseAccountRegisterResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{message: string, status: number}>({message: "", status: 0});
  const [success, setSuccess] = useState(false);

  const setupPassword = async ({
    token,
    password,
  }: UseAccountRegisterProps): Promise<void> => {
    setIsLoading(true);
    setError({message: "", status: 0});
    try {
      await axios.post(getEndpointUrl(ENDPOINTS.setupPassword), {
        token,
        password,
      });

      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        setError({ message: error.response?.data?.message || "An error occurred while submitting the form", status: error.response?.data?.statusCode});
      } else {
        console.error(error);
        setError({message: "An error occurred while submitting the form", status: 0});
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, setupPassword };
};

export default useAccountRegister;
