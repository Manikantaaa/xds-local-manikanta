"use client";
import { Button, Tooltip } from "flowbite-react";
import MobileSideMenus from "./mobileSideMenus";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/store";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Spinner from "./spinner";
import { toast } from "react-toastify";

const SecuritySettingComponent = () => {

  const [twoFactorAuthChecked, setTwoFactorAuthChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getTwoFactorAuthSettings = async() => {
    setIsLoading(true);
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getUsersSecuritySettings)}`).then((result) => {
      if(result && result.data){
        setTwoFactorAuthChecked(result.data.isActive);
      }
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
    });
  }

  const updatedUsersSecuritySetting = async(isChecked: boolean) => {
    setTwoFactorAuthChecked(isChecked);
    await authFetcher(`${getEndpointUrl(ENDPOINTS.saveUsersSecuritySetting(isChecked))}`).then((result) => {
      if(result && result.success){
        localStorage.removeItem("twoFactorAuthCheckedTime");
        toast.success("Your changes have been saved 👍");
      }
    }).catch((err) => {
      toast.error("error in saving security issue");
    })
  }

  useEffect(() => {
    getTwoFactorAuthSettings();
  }, []);

  return (
    <>
      {
        !isLoading ?
        <>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left flex align-middle items-cente">
              <MobileSideMenus></MobileSideMenus>
              <h1 className="font-bold  header-font">Security Settings</h1>
            </div>
          </div>
          <br></br>

          <div className="two_factor_authentication_box">
            <p className="font-bold">Two Factor Authentication</p>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 items-center">
              <div className="lg:col-span-3">
                <p className="text-sm text-dark-800 inline-flex">
                  Protect your account with additional security by enabling Two Factor Authentication.
                  <Tooltip
                    content="By enabling 2FA, the next time you attempt to login, you will receive a security code to your email. This code must be entered in order to login."
                    className="tier_tooltip "
                  >
                    <svg
                      className="w-4 h-4 text-gray-800 ml-1 cursor-pointer xs_mobile_hide"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Tooltip>
                </p>
              </div>
              <div className="text-right">
                <label className="inline-flex items-center cursor-pointer">
                  <input name="twoFactorAuthCheck" checked={twoFactorAuthChecked} onChange={ (e) => updatedUsersSecuritySetting(e.target.checked) } type="checkbox" id="twoFactorAuth" className="sr-only peer" />
                  <div className="relative w-14 h-7 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all  peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* <div className="text-right mt-6">
            <Button className="w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100 button_blue" onClick={(e) => { e.preventDefault(); updatedUsersSecuritySetting()}}>
              Save
            </Button>
          </div> */}
        </>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
      
    </>
  );
}

export default SecuritySettingComponent;