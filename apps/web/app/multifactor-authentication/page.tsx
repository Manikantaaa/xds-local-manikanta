"use client";

import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import axios from "axios";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import OtpInput from 'react-otp-input';
import { toast } from "react-toastify";
import Link from "next/link";
import { encryptString } from "@/services/common-methods";

function MultifactorAuthentication() {
  const { user, accessToken, setUser } = useUserContext();
  const router = useRouter();
  if (user) {
    router.push(PATH.HOME.path);
  }

  if (!accessToken) {
    router.push(PATH.HOME.path);
  }

  const [enteredOtp, setEnteredOtp] = useState("");
  const [isCheckedDuration, setIsCheckedDuration] = useState(false);
  const [allowedToResend, setAllowedToResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [canRender, setCanRender] = useState(true);
  const [startTimer, setStartTimer] = useState(Date.now())

  const validateOtp = async() => {
    setIsLoading(true);
    const postData = {
      theOtp: enteredOtp,
      accessToken: accessToken
    }
    await axios.post(getEndpointUrl(ENDPOINTS.validateTwoFactorAuth), postData).then((result) => {
      if(result && result.data && accessToken) {
        Cookies.set("token", accessToken, {secure: true, sameSite: 'Lax'});
        if(isCheckedDuration) {
          const toSaveData = {
            userId: result.data.isCompanyUser ? result.data.CompanyAdminId : result.data.id,
            time: new Date().toDateString()
          }
          let theData = JSON.stringify(toSaveData);
          theData = encryptString(theData, process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
          localStorage.setItem("twoFactorAuthCheckedTime", theData);
        } else {
          localStorage.removeItem("twoFactorAuthCheckedTime");
        }
        setCanRender(false);
        setUser(result.data);
      }
    }).catch((err) => {
      console.log(err);
      toast.error("An incorrect code has been entered", {autoClose: 3000});
    }).finally(() => {
      setIsLoading(false);
    });
  }

  // const keepTheTime = (val: boolean) => {
  //   if(val) {
  //     localStorage.setItem("twoFactorAuthCheckedTime", new Date().toDateString());
  //   } else {
  //     localStorage.removeItem("twoFactorAuthCheckedTime");
  //   }
  // }

  const resendOtp = async() => {
    setIsLoading(true);
    const postData = {
      accessToken: accessToken
    }
    await axios.post(getEndpointUrl(ENDPOINTS.resendOtp), postData).then(() => {
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      setIsLoading(false);
      setStartTimer(Date.now());
      setTime(120);
      setAllowedToResend(false);
    });
  }

  const [time, setTime] = useState(120);

  useEffect(() => {
    const startTime = Date.now(); // Record the start time

    const timerId = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Calculate elapsed time in seconds
      const remainingTime = 120 - elapsedTime; // Adjust based on your initial time (120)

      if (remainingTime > 0) {
        setTime(remainingTime);
      } else {
        clearInterval(timerId);
        setTime(0);
        setAllowedToResend(true);
      }
    }, 1000);
    return () => clearInterval(timerId);
  }, [startTimer]);

  return (
    <>
      {
        accessToken && accessToken != "" && canRender &&
        <div className="lg:w-[440px] space-y-6 my-6 mx-auto lg:px-0 px-6 mt-8">
          <img src="authentication.png" className="m-auto w-28" />
          <h4 className="font-bold text-center text-[22px]"> Two Factor Authentication</h4>
          <p className="text-sm">As you have 2FA enabled in your XDS Spark settings, a verification code has been sent to your email. This code will be valid for 15 minutes.</p>
          <hr />
          <div>
            <div className="mb-0 block">
              <Label htmlFor="email1" value="Enter Security Code" className="font-bold text-xs" />
            </div>
          </div>
          <OtpInput
            inputStyle="inputStyle"
            numInputs={6}
            onChange={setEnteredOtp}
            // renderSeparator={<span>{" - "}</span>}
            value={enteredOtp}
            inputType="text"
            renderInput={(props) => <input {...props} />}
            shouldAutoFocus
          />
          <div className="flex items-center gap-2">
            <Checkbox id="remember" checked={isCheckedDuration} onChange={(e) => { setIsCheckedDuration(e.target.checked); }}/>
            <Label htmlFor="remember">Remember for two weeks</Label>
          </div>
          <div className="pt-1">
            <Button disabled={isLoading} type="button" className="w-full button_blue" onClick={(e) => { e.preventDefault(); validateOtp(); }}> Verify & Continue </Button>
          </div>
          <p className="text-sm text-center">Haven't received code?
            <button disabled={!allowedToResend} className={`ml-1 ${allowedToResend && 'link_color'}`} onClick={(e) => { e.preventDefault(); resendOtp() }}>
              Resend a new code <span style={{color: "black"}}>{ !allowedToResend ? (time >= 10 ? ' in '+time+' sec' : ' in 0'+time+' sec') : ""}</span> 
            </button>
          </p>
          <p className="text-sm text-center">Having trouble? 
            <Link prefetch={false} href="mailto:info@xds-spark.com?subject=XDS Spark - Technical Support" target="_blank" className="text-sky-600 ml-1">
              Contact Us
            </Link>
          </p>
        </div>
      }
    </>
  );
}

export default MultifactorAuthentication;
