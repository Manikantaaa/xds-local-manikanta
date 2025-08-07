import { useState } from "react";
import axios from "axios";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Cookies from "js-cookie";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";

interface UseUpdateRegistrationRequest {
  isLoading: boolean;
  error: string;
  success: boolean;
  updateRegistrationRequestStatus: (id: number, type: string) => Promise<void>;
}

const useUpdateRegistrationRequest = (): UseUpdateRegistrationRequest => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateRegistrationRequestStatus = async (
    id: number,
    type: string,
  ): Promise<void> => {
    setIsLoading(true);
    setError("");
    try {
      const token = Cookies.get("token");
      let url: string = "";
      if (type == "approve") {
        url = getEndpointUrl(ENDPOINTS.approveRegistration(id));
      } else if (type == "reject") {
        url = getEndpointUrl(ENDPOINTS.rejectRegistration(id));
      }
      await axios.put(url, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(error.response?.data);
        if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
          await signOut(auth);
          Cookies.remove("token");
          // localStorage.setItem("tokenExpired", "1");
          // window.location.reload();
          window.location.href = '/login';
        } else {
          setError(
            error.response?.data?.message ||
              "An error occurred while submitting the form",
          );
        }
      } else {
        console.error(error);
        setError("An error occurred while submitting the form");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, updateRegistrationRequestStatus };
};

export default useUpdateRegistrationRequest;
