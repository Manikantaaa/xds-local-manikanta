"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {  useUserContext } from "./store";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Cookies from "js-cookie";
 

export type profileStatusTypes = {
  generalInfoProfilePerc: number,
  aboutProfilePerc: number,
  ourWorkAlbumsProfilePerc: number,
  ourWorkProjectProfilePerc: number,
  servicesProfilePerc: number,
  certificationsProfilePerc: number,
  contactsProfilePerc: number,
  profileCompleted: boolean,
  bannerAssetId: number,
} | null;
interface ProfileStatusContextType {
  profilepercentage: profileStatusTypes | null;
  setProfilepercentage: (filled: profileStatusTypes) => void;
}
 
const ProfileStatusContext = createContext<ProfileStatusContextType | undefined>(undefined);
 
export const ProfileStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUserContext();
  const [profilepercentage, setProfilepercentage] = useState<profileStatusTypes>(null);
  const token = Cookies.get("token");
    const fetchUserData = async () => {
        try {
          const companyId = user?.companyId || 0;
          const response = await authFetcher(getEndpointUrl(ENDPOINTS.getCompanyProfileStatus(companyId)));
          if (response) {
            let profilePic = '';
            if(response?.CompanyContacts.length == 0 || (response?.CompanyContacts[0] && response?.CompanyContacts[0].profilePic == '') || (response?.CompanyContacts[1] && response?.CompanyContacts[1].profilePic == '') || (response?.CompanyContacts[2] && response?.CompanyContacts[2].profilePic == '')) {
              profilePic = '';
            } else {
              profilePic = response?.CompanyContacts[0].profilePic;
            }
            setProfilepercentage({
              generalInfoProfilePerc: response.generalInfoProfilePerc,
              aboutProfilePerc: response.aboutProfilePerc,
              ourWorkAlbumsProfilePerc: response.ourWorkAlbumsProfilePerc,
              ourWorkProjectProfilePerc: response.ourWorkProjectProfilePerc,
              servicesProfilePerc: response.servicesProfilePerc,
              certificationsProfilePerc: response.certificationsProfilePerc,
              contactsProfilePerc: response.contactsProfilePerc,
              profileCompleted: response.profileCompleted,
              bannerAssetId: response.bannerAssetId,
            })
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
    };
    if(!profilepercentage && token) {
      fetchUserData();
    }
 
  return (
    <ProfileStatusContext.Provider value={{ profilepercentage, setProfilepercentage }}>
      {children}
    </ProfileStatusContext.Provider>
  );
};
 
export const useProfileStatusContext = () => {
  const context = useContext(ProfileStatusContext);
  if (!context) {
    throw new Error("ProfileStatusContext must be used within a ProfileStatusProvider");
  }
  return context;
};