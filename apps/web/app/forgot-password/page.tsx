"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import useCommonPostData from "@/hooks/commonPostData";
import { Button, Label, TextInput } from "flowbite-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiAlertTriangle } from "react-icons/fi";
import { PATH } from "@/constants/path";
import ButtonSpinner from "@/components/ui/buttonspinner";

const ForgotPassword = () => {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isClickedSubmit, setIsClickedSubmit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmittede] = useState(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  const { success, error: passwordError, submitForm } = useCommonPostData<{email: string}>({
    url: getEndpointUrl(ENDPOINTS.sendResetPasswordLink),
  });

  // useEffect(() => {
  //   if(passwordError && passwordError != "") {
  //     setErrorMessage("Sorry, we could not find that email in Spark. Please check the email and try again.")
  //     console.log(passwordError);
  //   }
  // }, [passwordError, success]);

  async function onClickSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsClickedSubmit(true);
    setSubmittede(false);
    setErrorMessage("");
    if(!email || email == "") {
      return;
    }
    setButtonLoader(true);
    submitForm({email: email.toLowerCase()}).then((result) => {
      if(result && result.data && result.data.success) {
        setButtonLoader(false);
        setEmail("");
        setSubmittede(true);
        setErrorMessage("If this email address exists, you will receive an email with a password reset link from XDS Spark.");
        // toast.success("Please check your email, and proceed to set up password");
        
        // setIsClickedSubmit(false);
      } else {
        setButtonLoader(false);
        setEmail("");
        setSubmittede(true);
        setErrorMessage("If this email address exists, you will receive an email with a password reset link from XDS Spark.");
      }
    });
  }

  function onChangeEmailText(emailVal: string) {
    setIsClickedSubmit(false);
    setEmail(emailVal);
  }

  useEffect(() => {
    document.title = "XDS Spark - Forgot Password";
  }, []);

  return (
    <div>
      <div className="w-full lg:max-w-[440px] px-5 mx-auto">
        <div className="pt-6">
          <div className="flex justify-center">
            <h1 className="font-bold  header-font">Forgot Password</h1>
          </div>
        </div>
        <div className="py-6">
          {" "}
          <hr />{" "}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onClickSubmit(e) }} className="flex flex-col gap-4">
          <div className={`flowbite_input_radius_6 ${
            isClickedSubmit && errorMessage != "" ? "" : ""
          }`}>
            <div className="mb-2 block text-red-600">
              <Label htmlFor="email1" value="Email" style={{color: isClickedSubmit && errorMessage != "" ? '' : "" }} />
            </div>
            <TextInput 
              autoComplete="off" 
              id="email1" 
              type="email" 
              value={ email } 
              onChange={(e) => onChangeEmailText(e.target.value)} 
            />
            {
              isClickedSubmit && email == "" && !submitted ? <p className="text-red-600 text-xs pt-2">Please enter email</p>: ""
            } 
            {
              isClickedSubmit && errorMessage != "" ? <p className="text-green-500 text-xs pt-2">{errorMessage}</p>: ""
            }
          </div>
            <Button type="submit" className="button_blue h-[40px]" disabled={buttonLoader}>
              {buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Submit'}
              
            </Button>
          <div className="link_color">
            <button onClick={(e) => { e.preventDefault(); router.push(PATH.HOME.path) }}>Login</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
