"use client";

import { PasswordInput } from "./ui/passwordInput";
import { Button } from "flowbite-react";
import { SubmitHandler, useForm } from "react-hook-form";
import useLogin from "@/hooks/useLogin";
import LabelInput from "./labelInput";
import { useEffect, useState } from "react";
import Link from "next/link";
import useLoginWithTerms from "@/hooks/useLoginWithTerms";
import { useProfileStatusContext } from "@/context/profilePercentage";
import { useRouter } from "next/navigation";
import { PATH } from "@/constants/path";
import { decodedString, encryptString, getDaysBetweenTwoDates, isValidDate, remeberMecheckedToken } from "@/services/common-methods";

type LoginFormProps = {
  email?: string;
  password?: string;
  checkedTerms?: boolean;
  checkedRemember2f?: string;
  savedUserId?: number;
};

const LoginForm = () => {
  const [isTermsChecked, setIsTermsChecked] = useState(true);
  const { setProfilepercentage } =useProfileStatusContext();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormProps>();

  const { isLoading, error, setError, success, login } = useLogin();
  const { isLoading: termsLoading, error: tearmsError, setError: tearmsSetError, success: tearmsSuccess, login: tearmsLogin } = useLoginWithTerms();

  const [isSetRememberDuration, setIsSetRememberDuration] = useState(false);
  const [savedUserId, setSavedUserId] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);

  const onSubmit: SubmitHandler<LoginFormProps> = async(data) => {
    setLocalLoading(true);
    if(isTermsChecked) {
      const userData: any = await login({
        email: data.email?.trim().toLowerCase() as string,
        password: data.password?.trim() as string,
        checkedRemember2f: remeberMecheckedToken(isSetRememberDuration.toString(), data.email?.trim().toLowerCase() as string),
        savedUserId: savedUserId
      });
      if(userData){
        if(!userData.checkedTerms) {
          setIsTermsChecked(false);
        } else if(userData.isCompanyUser && !userData.isLoggedInOnce) {
          setIsTermsChecked(false);
        } else {
          if(userData.twoFactorDetails?.isActive){
            router.push(PATH.TWO_FACTOR_AUTH.path);
          }
        }
        setLocalLoading(false);
      } else {
        setLocalLoading(false);
      }
    } else {
      const userData: any = await tearmsLogin({
        email: data.email?.trim().toLowerCase() as string,
        password: data.password?.trim() as string,
        checkedTerms: data.checkedTerms as boolean,
        checkedRemember2f: remeberMecheckedToken(isSetRememberDuration.toString(), data.email?.trim().toLowerCase() as string),
        savedUserId: savedUserId
      });
      if(userData && userData.twoFactorDetails?.isActive){
        router.push(PATH.TWO_FACTOR_AUTH.path);
      } else {
        setLocalLoading(false);
      }
    }
  };

  useEffect(() => {
    const theCheckedDate = localStorage.getItem("twoFactorAuthCheckedTime");
    if(theCheckedDate && theCheckedDate != "") {
      if(isValidDate(theCheckedDate)) {
        const daysDiff = getDaysBetweenTwoDates(new Date(theCheckedDate), new Date());
        if(daysDiff < 14) {
          setIsSetRememberDuration(true);
        }
      } else {
        let theData: any = decodedString(theCheckedDate, process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY);
        theData = JSON.parse(theData);
        if(theData && theData.time && theData.userId) {
          const daysDiff = getDaysBetweenTwoDates(new Date(theData.time), new Date());
          if(daysDiff < 14) {
            setIsSetRememberDuration(true);
            setSavedUserId(theData.userId);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    setProfilepercentage(null);
  },[]);

  function checkError(val: string){
    if(val && val != "") {
      setError("");
    }
  }

  return (
    <div className="lg:w-[440px] space-y-6 my-6 mx-auto lg:px-0 px-6">
      <h4 className="font-bold text-center text-[22px]">
        {
          isTermsChecked ? 
          "Login" :
          "One more thing... please read and accept our Terms of Service"
        }
      </h4>
      {
        !isTermsChecked && 
        <p className="text-sm">
          Our records show that you haven't yet accepted the XDS Spark Terms of Service. 
          Please read and accept the XDS Spark Terms of Service by checking the box below.
        </p>
      }
      <hr />
      <form className="w-full space-y-6 my-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <LabelInput
            className="w-full appearance-none outline-none"
            id="email"
            disabled={!isTermsChecked}
            register={register("email", {
              required: "This field is required",
            })}
            onChange={(e) => { checkError(e.target.value) }}
            label="Email"
          />
        </div>
        <div>
          <PasswordInput
            register={register("password", {
              required: "This field is required",
            })}
            style={{opacity: 1}}
            className={!isTermsChecked ? "opacity-less appearance-none outline-none" : "appearance-none outline-none" }
            disabled={!isTermsChecked}
            label="Password"
            onChange={(e) => { checkError(e.target.value) }}
            errorMessage={errors.password?.message}
          />
        </div>
        {
          !isTermsChecked && 
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("checkedTerms", { required: true })}
              id="checkedTerms"
              className="peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-400 data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor={"checkedTerms"}
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pl-2"
            >
              I agree to the&nbsp;
              <a
                href="/XDS Spark Terms and Conditions of Use.pdf"
                target="_blank"
                className="underline text-blue-300"
              >
                XDS Spark Terms and Conditions
              </a>
            </label>
          </div>
        }
        {error && (
            error === "ACCOUNT_ISSUE_CONTACT_SUPPORT" ? (
             <p className="font-medium text-red-500 text-xs mt-5">There is a problem with your account. Please <Link href={`mailto:info@xds-spark.com`} className="link_color" target="_blank"><u>Contact Us</u></Link> for details</p>
            ):
            (error == "freeCompanyAdmin" ? <p className="font-medium text-red-500 text-xs mt-5">Your Company Admin account is currently not active. For questions or support, <Link href={`mailto:support@xds-spark.com`} className="link_color" target="_blank"><u>Contact Us!</u></Link></p>
            :
            <p className="font-medium text-red-500 text-xs mt-5">{error}</p>
            )
          )
        }
        <Button
          type="submit"
          className="w-full button_blue"
          disabled={localLoading || !isValid}
        >
          {localLoading ? "Loading..." : "Login"}
        </Button>
        {
          isTermsChecked &&
          <div>
            <Link prefetch={false} className="text-blue-350 hover:underline text-sm" href="/forgot-password">
              Forgot Password
            </Link>
            <Link
            prefetch={false}
              className="text-blue-350 hover:underline text-sm"
              href="/registration"
              style={{ marginLeft: "20px" }}
            >
              Sign Up
            </Link>
          </div>
        }
        
      </form>
    </div>
  );
};

export default LoginForm;
