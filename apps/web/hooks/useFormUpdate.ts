import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { auth } from "@/services/firebase";
import { signOut } from "firebase/auth";

interface UseFormSubmitProps {
  url: string;
}

interface UseFormSubmitResult<T> {
  isLoading: boolean;
  error: string;
  success: boolean;
  mailCheck?: string;
  setMailcheck? : (v:string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submitForm: (data: T) => Promise<any>;
  reset: () => void;
}

const useFormUpdate = <T>({
  url,
}: UseFormSubmitProps): UseFormSubmitResult<T> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mailCheck, setMailcheck] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitForm = async (data: T): Promise<any> => {
    setIsLoading(true);
    setError("");

    try {
      const token = Cookies.get("token");

      setSuccess(false);
      const res = await axios.put(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess(true);
      if (res.data == "Mail is already existed.") {
        setMailcheck(res.data);
        setIsLoading(false);
      }
      else {
        setMailcheck("");
      }
      return res;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        console.log(error);
        if(error.response?.data && error.response?.data.statusCode && (error.response?.data.statusCode == 401 || error.response?.data.statusCode == 404)) {
          await signOut(auth);
          Cookies.remove("token");
          // localStorage.setItem("tokenExpired", "1");
          // window.location.reload();
          window.location.href = '/login';
        } else {
          setError(error.response?.data?.message || "An error occurred");
        }
      } else {
        
        setError(error);
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    // setSuccess(false);
    setError("");
    setMailcheck("");
  };

  return { isLoading, error, success, submitForm, mailCheck, setMailcheck, reset };
};

export default useFormUpdate;
