"use client";
import { useState } from "react";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { HiOutlineLockClosed } from "react-icons/hi";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import useCommonPostData from "@/hooks/commonPostData";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import useCheckOldPassword from "@/hooks/useCheckOldPassword";
import MobileSideMenus from "@/components/mobileSideMenus";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { sanitizeData } from "@/services/sanitizedata";
import ButtonSpinner from "@/components/ui/buttonspinner";

const ChangePassword = () => {
  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MY_PROFILE.name,
      path: PATH.MY_PROFILE.path,
    },
    {
      label: PATH.CHANGE_PASSWORD.name,
      path: PATH.CHANGE_PASSWORD.path,
    },
  ];

  const { error, success, checkCredentials } = useCheckOldPassword();
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  const { submitForm } = useCommonPostData<any>({
    url: getEndpointUrl(ENDPOINTS.changePassword),
  });

  const { handleSubmit, register, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  async function updatePassword(data: {
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  }) {
    setButtonLoader(true);
    const postData = {
      id: user?.isCompanyUser ? user?.CompanyAdminId : user?.id,
      isCompanyUser: user?.isCompanyUser,
    };

    const isValid = await validateOldPasswordAndUpdateNew(data.oldPassword, data.newPassword);
    if(!isValid){
      toast.error("Please enter correct old password");
      setButtonLoader(false);
      return;
    }

    submitForm(sanitizeData(postData)).then((result) => {
      if (result.data.success) {
        setButtonLoader(false);
        setValue("oldPassword", "");
        setValue("newPassword", "");
        setValue("confirmPassword", "");
        toast.success("Password changed successfully");
      } else {
        setButtonLoader(false);
      }
    });
  }

  async function onClickEyeIcon(val: number) {
    if (val == 1) {
      setShowOldPassword(!showOldPassword);
    } else if (val == 2) {
      setShowNewPassword(!showNewPassword);
    } else if (val == 3) {
      setShowConfirmPassword(!showConfirmPassword);
    }
  }

  const validateOldPasswordAndUpdateNew = async (value: string, newPassword: string): Promise<any> => {
    if (user) {
      const isSuccess: boolean = await checkCredentials({
        email: user.isCompanyUser ? user.CompanyAdminEmail as string:  user.email as string,
        newpassword: newPassword,
        password: value as string,
      });
      if (isSuccess) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  //   function validatePassword(password: string): boolean  {
  //     // Check if the password length is at least 6 characters
  //     if (password.length < 6) {
  //         return false;
  //     }
  //     if (!/[a-zA-Z]/.test(password)) {
  //         return false;
  //     }
  //     if (!/\d/.test(password)) {
  //         return false;
  //     }
  //     return true;
  // }

  function validatePassword(password: string): boolean {
    const trimmedPassword = password.trim();
    // Remove leading/trailing spaces
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{6,}$/;
    return regex.test(trimmedPassword);
  }

  console.log(user)
  return (
    <>
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />{" "}
      </div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left flex align-middle items-cente">
          <MobileSideMenus></MobileSideMenus>
          <h1 className="font-bold  header-font">Change Password</h1>
        </div>
      </div>
      <div className="py-6">

        <form onSubmit={handleSubmit(updatePassword)}>
          <div className="flex max-w-md flex-col gap-6">
            <div className="firstname">
              <div className="mb-2 block ">
                <Label
                  htmlFor="old_password"
                  value="Old Password"
                  className="font-bold text-xs"
                />
              </div>
              <div className="input_with_addon relative">
                <TextInput
                  autoComplete="off"
                  id="old_password"
                  className="focus:border-blue-300"
                  icon={HiOutlineLockClosed}
                  type={showOldPassword ? "text" : "password"}
                  sizing="md"
                  placeholder="••••••••"
                  {...register("oldPassword", {
                    required: {
                      value: true,
                      message: "Old password required"
                    },
                  //  validate: {
                  //    checkOldPassword: async (value) => await validateOldPassword(value) || "Please enter correct old password"
                  //  }
                  })
                  }
                  onChange={(e) => { e.target.value != "" ? setOldPasswordError("") : ""; }}
                />
                {
                  showOldPassword ?
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
              <p className="text-red-600 text-xs mt-2">
                {oldPasswordError != "" && oldPasswordError}
              </p>
              <p className="text-red-600 text-xs mt-2">
                {typeof errors?.oldPassword?.message === "string" && errors?.oldPassword?.message}
              </p>
            </div>


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
                      comparePassword: (value) => value == watch('newPassword') || "Password not matched"
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
                className="button_blue h-[40px] px-4"
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
              </Button>
            </div>
            {/* <div>
              {showToast && (
                <Alert
                  color="info"
                  withBorderAccent
                  className="bg-white box_shadow border_color text-sm default_text_color"
                >
                  <span className="font-bold">
                    Your password has been changed 👍
                  </span>
                </Alert>
              )}
            </div> */}
          </div>
        </form>
      </div>
    </>
  );
};
export default ChangePassword;
