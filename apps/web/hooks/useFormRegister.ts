import { useState } from "react";
import axios from "axios";

interface UseFormSubmitProps {
  url: string;
}

interface UseFormSubmitResult<T> {
  isLoading: boolean;
  error: string;
  success: boolean;
  submitForm: (data: T) => Promise<void>;
}

const useFormRegister = <T>({
  url,
}: UseFormSubmitProps): UseFormSubmitResult<T> => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submitForm = async (data: T): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      await axios.post(url, data);
      setSuccess(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error(error.response.data);
        setError(error.response.data.message);
      } else if (error.request) {
        // The request was made but no response was received
        console.error(error.request);
        setError("Seems like there is a network issue from your end");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error", error.message);
        setError("An error occurred while submitting the form");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, submitForm };
};

export default useFormRegister;
