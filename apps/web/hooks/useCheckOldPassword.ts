import { useState } from "react";
import { UseLoginProps } from "@/types/user.type";
import axios from "axios";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { signInWithEmailAndPassword, reauthenticateWithCredential, EmailAuthProvider, updatePassword, getIdToken } from "firebase/auth";
import { auth, } from "@/services/firebase";
import { useUserContext } from "@/context/store";
import Cookies from "js-cookie";

interface UseLoginResult {
  isLoading: boolean;
  error: string;
  success: boolean;
  checkCredentials: ({ email, newpassword, password }: UseLoginProps) => Promise<boolean>;
}

const useCheckOldPassword = (): UseLoginResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const checkCredentials = async ({
    email,
    newpassword,
    password,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: UseLoginProps): Promise<any> => {
    setSuccess(false);
    setIsLoading(true);
    setError("");
    try {
      const user = auth.currentUser;
      if (!user) {
        throw Error("Invalid User")
      }
      const credential = EmailAuthProvider.credential(email, password);
      await reauthenticateWithCredential(
        user,
        credential,
      )
      if (newpassword) {
        updatePassword(user, newpassword);
      }
      const token = await getIdToken(user, true);
      Cookies.set("token", token, { secure: true, sameSite: 'Lax' });
      setSuccess(true);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.log(error);

        console.error(error.response?.data);
        setError(
          error.response?.data?.message ||
          "An error occurred while submitting the form",
        );
      } else {
        if (
          error.code === "auth/invalid-email" ||
          error.code === "auth/invalid-login-credentials"
        ) {
          setError("Email or password is not correct.");
        } else {
          console.error(error);
          setError("An error occurred while submitting the form");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, checkCredentials };
};

export default useCheckOldPassword;
