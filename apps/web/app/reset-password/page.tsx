
"use client"

import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineLockClosed } from "react-icons/hi";
import { Button, Label, TextInput } from "flowbite-react";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import ButtonSpinner from "@/components/ui/buttonspinner";



const ResetPassword = () => {

  const { user: loggedInUser } = useUserContext();
  const router = useRouter();

  if (loggedInUser) {
    router.push(PATH.HOME.path);
  }

  // const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/;

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  if (!token || token == "") {
    router.push(PATH.HOME.path);
  }

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);

  const { success, submitForm } = useCommonPostData<{ token: string, password: string }>({
    url: getEndpointUrl(ENDPOINTS.resetNewPassword),
  });

  useEffect(() => {
    document.title = "XDS Spark - Reset Password";
    if (success) {
      toast.success("Your password has been updated 👍");
      setValue("confirmPassword", "");
      setValue("token", "");
      setValue("newPassword", "");
      router.push("/reset-password-succes");
    } else {
      fetchUserDetails();
    }

  }, [success]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      token: "",
      newPassword: "",
      confirmPassword: ""
    }
  });



  async function fetchUserDetails() {
    if (token && token != "") {
      await fetcher(`${getEndpointUrl(ENDPOINTS.getUserFromPasswordToken(token))}`).then((result) => {
        if (result && result.data && result?.data?.user?.email || (result && result.data && result?.data?.companyAdminUser?.email)) {
          setValue("token", token);
        } else {
          router.push("/");
        }
      }).catch((err) => {
        console.log(err);
        router.push("/");
      });
    }
  }

  const submitResetPassword = async (data: { token: string, newPassword: string, confirmPassword: string }) => {
    setButtonLoader(true);
    const postData: { token: string, password: string } = {
      token: data.token,
      password: data.newPassword
    }
    const res = await submitForm(postData);

    if(res) {
      setButtonLoader(false);
    } else {
      setButtonLoader(false);
    }
  }

  async function onClickEyeIcon(val: number) {
    if (val == 1) {
      setShowNewPassword(!showNewPassword);
    } else if (val == 2) {
      setShowConfirmPassword(!showConfirmPassword);
    }
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {
        (token && token != "") ?
          <div className="w-full lg:max-w-[440px] px-5 mx-auto">
            <div className="pt-6">
              <div className="flex justify-center">
                <h1 className="font-bold  header-font">Reset Password</h1>
              </div>
            </div>
            <div className="py-6">
              {" "}
              <hr />{" "}
            </div>
            <form onSubmit={handleSubmit(submitResetPassword)} className="flex flex-col gap-6">
              <div className="firstname">
                <div className="mb-2 block ">
                  <Label
                    htmlFor="new-password"
                    value="New Password"
                    className="font-bold text-xs"
                  />
                </div>
                <div className="input_with_addon relative">
                  <TextInput
                    autoComplete="off"
                    id="new-password"
                    className="focus:border-blue-300"
                    icon={HiOutlineLockClosed}
                    // type="password"
                    type={showNewPassword ? "text" : "password"}
                    sizing="md"
                    placeholder="••••••••"
                    {...register("newPassword", {
                      required: {
                        value: true,
                        message: "Please enter password",
                      },
                      validate: {
                        pattern: (value) => passwordRegex.test(value) || "Min 6 characters with at least one number, one letter, one special character"
                      }
                    })}
                  />
                  {
                    showNewPassword ?
                      <span className="addon addhovereffect" onClick={() => onClickEyeIcon(1)}>
                        <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 14c-.5-.6-.9-1.3-1-2 0-1 4-6 9-6m7.6 3.8A5 5 0 0 1 21 12c0 1-3 6-9 6h-1m-6 1L19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </span>
                      :
                      <span className="addon addhovereffect" onClick={() => onClickEyeIcon(1)}>
                        <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-width="1" d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z" />
                          <path stroke="currentColor" stroke-width="1" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </span>
                  }
                </div>
                {/* <p className="text-red-600 text-xs mt-2">
                  {typeof errors?.newPassword?.message === "string" &&
                    errors?.newPassword?.message}
                </p> */}
                {(errors.newPassword?.message as string) ? (
                  <p className="font-medium text-red-500 text-xs mt-1">
                    {errors.newPassword?.message as string}
                  </p>
                ) : (
                  <p className="font-medium text-gray-500 text-xs mt-1">
                    Min 6 characters with at least one number, one letter, one special character
                  </p>
                )}
              </div>
              <div className="firstname">
                <div className="mb-2 block ">
                  <Label
                    htmlFor="confirm-password"
                    value="Re-enter Password"
                    className="font-bold text-xs"
                  />
                </div>
                <div className="input_with_addon relative">
                  <TextInput
                    autoComplete="off"
                    id="confirm-password"
                    className="focus:border-blue-300"
                    icon={HiOutlineLockClosed}
                    type={showConfirmPassword ? "text" : "password"}
                    // type="password"
                    sizing="md"
                    placeholder="••••••••"
                    {...register("confirmPassword", {
                      required: {
                        value: true,
                        message: "Please enter confirm-password",
                      },
                      validate: {
                        comparePassword: (value) => value == watch('newPassword') || "Password not matched"
                      }
                    })}
                  />
                  {
                    showConfirmPassword ?
                      <span className="addon addhovereffect" onClick={() => onClickEyeIcon(2)}>
                        <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 14c-.5-.6-.9-1.3-1-2 0-1 4-6 9-6m7.6 3.8A5 5 0 0 1 21 12c0 1-3 6-9 6h-1m-6 1L19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </span>
                      :
                      <span className="addon addhovereffect" onClick={() => onClickEyeIcon(2)}>
                        <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-width="1" d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z" />
                          <path stroke="currentColor" stroke-width="1" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </span>
                  }
                </div>
                <p className="text-red-600 text-xs mt-2">
                  {typeof errors?.confirmPassword?.message === "string" &&
                    errors?.confirmPassword?.message}
                </p>
              </div>
              <Button type="submit" className="button_blue h-[40px]" disabled= {buttonLoader}>
                {buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Submit'}
                
              </Button>
            </form>
          </div> 
        : 
          ""
      }

    </Suspense>
  )

}

export default ResetPassword;
