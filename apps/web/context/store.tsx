"use client";
import {
  createContext,
  useContext,
  Dispatch,
  SetStateAction,
  useState,
  ReactNode,
  useEffect,
} from "react";
import Cookies from "js-cookie";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import axios from "axios";
import Spinner from "@/components/spinner";
import { auth, signOut } from "@/services/firebase";
import { IBackupPersonalContact } from "@/types/backup-personal-contact.type";
import { PASSWORD_STATUS, Roles, USER_TYPE } from "@/types/user.type";


export type User = {
  slug: string,
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  linkedInUrl: string;
  companyId: number;
  userRoles: Roles[];
  backupPersonalContact: IBackupPersonalContact;
  isPaidUser: boolean;
  stripeSubscriptionId?: string;
  isAddedFromCsv: boolean;
  accessExpirationDate: Date | null;
  checkedTerms: boolean;
  passwordNeedToChange: PASSWORD_STATUS;
  isLoggedInOnce?: boolean;
  isPasswordChanged?: boolean;
  userType: USER_TYPE;
  isCompanyUser?: boolean;
  CompanyAdminId?: number;
  CompanyAdminEmail?: string;
  lastLoginDate?: Date | null;
  companyUsersLimit: number;
  pagePermissions: {canDelete : boolean,canRead: boolean, canWrite:boolean,groupId:number,id:number,pageId:number}[];
  companies: [
    {
      name: string;
      isTourCompleted: boolean,
      CompanyContacts: [
        {
          name: string;
        },
      ];
      addedAnnouncement: boolean
    },
  ];
};

interface UserContextProps {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  mutate: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  intrestCount: number | null;
  setIntrestCount: Dispatch<SetStateAction<number | null>>;
  accessToken: string | null;
  setAccessToken: Dispatch<SetStateAction<string | null>>;
}

const UserContext = createContext<UserContextProps>({
  user: null,
  setUser: () => null,
  mutate: async () => { },
  handleSignOut: async () => { },
  intrestCount: null,
  setIntrestCount: () => null,
  accessToken: null,
  setAccessToken: () => null
});

export const UserContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [intrestCount, setIntrestCount] = useState<number | null>(0);
  const token = Cookies.get("token");
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  let isSafari = false;
  let isFirefox = false;
  if (typeof window !== 'undefined' && window.navigator) {
    isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  }
  
  const mutate = async () => {
    try {
      const response = await axios.post(getEndpointUrl(ENDPOINTS.verifyToken), {
        idToken: token
      });
      setUser(response.data);
      if (response.data) {
        if(localStorage.getItem("isLoggedIn") == null || localStorage.getItem("isLoggedIn") != '1'){
          localStorage.removeItem("previouscountrysearch");
          localStorage.removeItem("oldCompanySizes");
          localStorage.removeItem("regionCheckboxFilter");
          localStorage.removeItem("previousServiceSearches");
          localStorage.removeItem("inputsearchvalue");
          localStorage.removeItem("selectedServiceCapabilities");
          localStorage.removeItem("selectedIdServiceCapabilities");
          localStorage.removeItem("prevIsPremiumUsersOnly");
          localStorage.removeItem("comparingCompanies");
          localStorage.removeItem("StoredEvents");
        }
        localStorage.setItem("isLoggedIn", "1");
      }
    } catch (error) {
      setUser(null);
      setIntrestCount(0);
      Cookies.remove("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("marketpageCrousal");
      localStorage.removeItem("homepageCrousal");
      localStorage.removeItem("spsCrousal");
      setTimeout(() => {
        localStorage.removeItem("viewCompanyProfile");
        localStorage.removeItem("generalInfo");
      }, 50);
      if(token){
        let userId = user?.id;
        if(user?.isCompanyUser){
          userId = user.CompanyAdminId;
        }
        await axios.post(getEndpointUrl(ENDPOINTS.signingOut), {
          accessToken: token,
          // userId: userId,
          // isCompanyUser: user?.isCompanyUser
        },  {
        headers: {
          // "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      }
      await signOut(auth);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if(token){
        let userId = user?.id;
        if(user?.isCompanyUser){
          userId = user.CompanyAdminId;
        }
        await axios.post(getEndpointUrl(ENDPOINTS.signingOut), {
          accessToken: token,
          // userId: userId,
          // isCompanyUser: user?.isCompanyUser
        }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      }
      await signOut(auth);
    } catch (e) {
      console.log(e);
    } finally {
      setUser(null);
      setIntrestCount(0);
      Cookies.remove("token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("previouscountrysearch");
      localStorage.removeItem("oldCompanySizes");
      localStorage.removeItem("regionCheckboxFilter");
      localStorage.removeItem("previousServiceSearches");
      localStorage.removeItem("inputsearchvalue");
      localStorage.removeItem("selectedServiceCapabilities");
      localStorage.removeItem("selectedIdServiceCapabilities");
      localStorage.removeItem("prevIsPremiumUsersOnly");
      localStorage.removeItem("comparingCompanies");
      localStorage.removeItem("oldPlatforms");
      localStorage.removeItem("selectedFilters");
      localStorage.removeItem("StoredEvents");
      localStorage.setItem("clickedLogout", "1");
      localStorage.removeItem("marketpageCrousal");
      localStorage.removeItem("homepageCrousal");
      localStorage.removeItem("spsCrousal");
      setTimeout(() => {
        localStorage.removeItem("viewCompanyProfile");
        localStorage.removeItem("generalInfo");
        // localStorage.removeItem("clickedLogout");
      }, 50);
      // router.push("/");
    }
  };

  // useEffect(() => {
  //   token ? mutate() : setLoading(false);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [token]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (token) {
        await mutate();
      } else {
        setLoading(false);
      }
    };
    if (isSafari || isFirefox) {
      setTimeout(() => {
        fetchUserData();
      }, 1000)
    } else {
      fetchUserData();
    }

  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  // const router = useRouter();

  return (
    <UserContext.Provider value={{ user, setUser, mutate, handleSignOut, intrestCount, setIntrestCount, accessToken, setAccessToken }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
