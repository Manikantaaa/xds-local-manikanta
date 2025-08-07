import { Dispatch, SetStateAction, useState } from "react";
import { UseLoginProps } from "@/types/user.type";
import axios from "axios";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useUserContext } from "@/context/store";
import Cookies from "js-cookie";
import { isValidDate } from "@/services/common-methods";

interface UseLoginResult {
  isLoading: boolean;
  error: string;
  success: boolean;
  login: ({ email, password, checkedRemember2f, savedUserId }: UseLoginProps) => Promise<void>;
  setError: Dispatch<SetStateAction<string>>;
}

const useLogin = (): UseLoginResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { setUser, setAccessToken } = useUserContext();

  const login = async ({ email, password, checkedRemember2f, savedUserId }: UseLoginProps): Promise<any> => {
    setIsLoading(true);
    setError("");
    try {
      const firebaseUser = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await firebaseUser.user.getIdToken();
      const res = await axios.post(getEndpointUrl(ENDPOINTS.login), {
        idToken,
        checkedRemember2f,
        storedUserId: savedUserId
      });
      setSuccess(true);
      if(res.data.checkedTerms) {
        if(res.data.isCompanyUser && !res.data.isLoggedInOnce){
          return res.data;
        }
        if(res.data.enable2Fa) {
          if(!res.data?.twoFactorDetails?.isActive) {
            Cookies.set("token", idToken, {secure: true, sameSite: 'Lax'});
            setUser(res.data);
          } else {
            const theCheckedDate = localStorage.getItem("twoFactorAuthCheckedTime");
            if(theCheckedDate && theCheckedDate != "") {
              if(isValidDate(theCheckedDate)) {
                if(checkedRemember2f) {
                  Cookies.set("token", idToken, {secure: true, sameSite: 'Lax'});
                  setUser(res.data);
                }
              } else {
                const idToCheck = res.data.isCompanyUser ? res.data.CompanyAdminId : res.data.id
                if(checkedRemember2f && idToCheck == savedUserId) {
                  Cookies.set("token", idToken, {secure: true, sameSite: 'Lax'});
                  setUser(res.data);
                }
              }
            }
            setAccessToken(idToken);
          }
        } else {
          Cookies.set("token", idToken, {secure: true, sameSite: 'Lax'});
          setUser(res.data);
        }
      }
      return res.data;
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
          setError("Your email or password is not correct.");
        } else {
          console.error(error);
          setError("An error occurred while submitting the form");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, success, login, setError };
};

export default useLogin;
