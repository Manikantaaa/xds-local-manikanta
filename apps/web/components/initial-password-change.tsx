"use client";
import { Button, Label, TextInput } from "flowbite-react";
import { useCallback, useState } from "react";
import { HiOutlineLockClosed } from "react-icons/hi";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useUserContext } from "@/context/store";
import { redirect, useRouter } from "next/navigation";
import { PATH } from "@/constants/path";
import useCommonPostData from "@/hooks/commonPostData";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { sanitizeData } from "@/services/sanitizedata";
import Link from "next/link";

const InitialPasswordChange = () => {

  const { user, mutate } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }

  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  const { submitForm } = useCommonPostData<{newPassword: string}>({
    url: getEndpointUrl(ENDPOINTS.passwordChange),
  });

  const { handleSubmit, register, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    }
  });

  const resetAsyncForm = useCallback(async () => {
    await mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validatePassword(password: string): boolean {
    const trimmedPassword = password.trim();
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/;
    return regex.test(trimmedPassword);
  }

  async function onClickEyeIcon(val: number) {
    if (val == 2) {
      setShowNewPassword(!showNewPassword);
    } else if (val == 3) {
      setShowConfirmPassword(!showConfirmPassword);
    }
  }

  async function updatePassword() {
    setButtonLoader(true);
    const postData = {
      newPassword: watch("newPassword")
      // id: user?.id,
    };

    submitForm(sanitizeData(postData)).then((result) => {
      if (result.data.success) {
        toast.success("Password changed successfully");
        resetAsyncForm();
        setTimeout(() => {
          setButtonLoader(false);
          router.push(PATH.HOME.path);
        }, 1000);
      } else {
        setButtonLoader(false);
      }
    });
  }

  return(
    <>
      <div className="lg:w-[440px] space-y-6 my-6 mx-auto lg:px-0 px-6">
        <h4 className="font-bold text-center text-[22px]">Change Password</h4>
        <p className="pt-2">For security reasons, please change your password.</p>
        <hr />
        <form className="w-full space-y-6 my-5" onSubmit={handleSubmit(updatePassword)}>
          <div className="flex max-w-md flex-col gap-6">
            <div className="lasttname">
              <div className="mb-2 block">
                <Label
                  htmlFor="new_password"
                  value="New Password"
                  className="font-bold text-xs"
                />
              </div>
              <div className="input_with_addon relative">
                <TextInput
                  autoComplete="off"
                  id="new_password"
                  icon={HiOutlineLockClosed}
                  className="focus:border-red-300"
                  // type="password"
                  type={showNewPassword ? "text" : "password"}
                  sizing="md"
                  placeholder="••••••••"
                  {...register("newPassword", {
                    required: {
                      value: true,
                      message: "Password required"
                    },
                    validate: {
                      comparePattern: (value) => validatePassword(value) || "Min 6 characters with at least one number, one letter, one special character"
                    }
                  })
                  }
                />
                {
                  showNewPassword ?
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
                {typeof errors?.newPassword?.message === "string" && errors?.newPassword?.message}
              </p>
            </div>

            <div className="email">
              <div className="mb-2 block">
                <Label
                  htmlFor="confirm_password"
                  value="Confirm New Password"
                  className="font-bold text-xs"
                />
              </div>
              <div className="input_with_addon relative">
                <TextInput
                  autoComplete="off"
                  id="confirm_password"
                  icon={HiOutlineLockClosed}
                  className="focus:border-red-300"
                  // type="password"
                  type={showConfirmPassword ? "text" : "password"}
                  sizing="md"
                  placeholder="••••••••"
                  {...register("confirmPassword", {
                    validate: {
                      comparePassword: (value) => value == watch('newPassword') || "The password does not match"
                    }
                  })
                  }
                />
                {
                  showConfirmPassword ?
                  <span className="addon addhovereffect" onClick={() => onClickEyeIcon(3)}>
                    <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 14c-.5-.6-.9-1.3-1-2 0-1 4-6 9-6m7.6 3.8A5 5 0 0 1 21 12c0 1-3 6-9 6h-1m-6 1L19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </span>
                  :
                  <span className="addon addhovereffect" onClick={() => onClickEyeIcon(3)}>
                    <svg className="w-[22px] h-[22px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-width="1" d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z" />
                      <path stroke="currentColor" stroke-width="1" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </span>
                }
              </div>
              <p className="text-red-600 text-xs mt-2">
                {typeof errors?.confirmPassword?.message === "string" && errors?.confirmPassword?.message}
              </p>
            </div>

            <div className="flex flex-wrap justify-end">
              <Button
                type="submit"
                className="w-full button_blue"
                disabled={buttonLoader}
              >{buttonLoader ? "Loading..." : "Save"}
              </Button>
            </div>
            <p className="text-sm text-center">Need help? 
              <Link prefetch={false} href="mailto:info@xds-spark.com?subject=XDS Spark - Support Request" target="_blank" className="text-sky-600 ml-1">
                Contact Us
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  );
}

export default InitialPasswordChange;