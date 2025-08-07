"use client";

import LabelInput from "@/components/labelInput";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { useBackupPersonalContact } from "@/hooks/useBackupPersonalContact";
import useFormUpdate from "@/hooks/useFormUpdate";
import { IPersonalSettingFormProps } from "@/types/update-personal-setting-form.type";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import MobileSideMenus from "../../mobileSideMenus";
import { Input } from "../../ui/input";
import { sanitizeData } from "@/services/sanitizedata";
import { Label, TextInput } from "flowbite-react";
import ButtonSpinner from "../../ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { authFetcher } from "@/hooks/fetcher";
import Spinner from "@/components/spinner";

const requiredMessage = "This field is required.";

const PersonalSettingsCompanyAdmin = () => {
  const { user, mutate, handleSignOut } = useUserContext();
  const [canRender, setCanRender] = useState(false);

  if (!user) {
    redirect(PATH.HOME.path);
  }
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      firstName: "",
      LastName: "",
      email: "",
    },
  });

  const watchedEmail = watch("email");
  const [isPrimaryEmailChangedSuccess, setIsPrimaryEmailChangedSuccess] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  const {
    isLoading,
    error,
    success,
    submitForm,
    mailCheck,
    setMailcheck,
    reset: submitFormReset,
  } = useFormUpdate<{firstName: string;LastName: string;email: string;}>({
    url: getEndpointUrl(ENDPOINTS.updateCompanyUser),
  });

  const onSubmit = ((data: {firstName: string;LastName: string;email: string;}) => {
    setButtonLoader(true);
    data.email = data.email.trim().toLowerCase();
    submitForm(sanitizeData(data));
    reset(data);
    submitFormReset();
  }) as SubmitHandler<FieldValues>;

  const resetAsyncForm = useCallback(async () => {
    await mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    getBackupPersonalContactDetails();
  }, []);

  async function getBackupPersonalContactDetails() {
    if(user && user.id) {
      const UserData = await authFetcher(`${getEndpointUrl(ENDPOINTS.findUserProfile)}`);
      setCanRender(true);
      reset({
        firstName: UserData.firstName,
        LastName: UserData.LastName,
        email: UserData.email,
      });
    }
  }

  useEffect(() => {
    if (success) {
      if (mailCheck != '') {
        toast.error("This email address cannot be used at this time. Please try a different address.");
      }
      else {
        if (
          watchedEmail.trim().toLowerCase() !== user?.CompanyAdminEmail?.trim().toLowerCase()
        ) {
          setIsPrimaryEmailChangedSuccess(true);
        } else {
          toast.success("Your changes have been saved 👍");
          resetAsyncForm();
        }
      }

    }
    if (error) {
      console.log(error);
      toast.error("Something's wrong. Please try again.");
    }
    setButtonLoader(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, error, resetAsyncForm]);

  function logoutTheUser() {
    handleSignOut();
  }

  usePreventBackNavigation(isDirty);
  return (
    <>
    {
      canRender ?
    <section>
      <form
        className="space-y-6 mt-0 lg:w-[25rem]"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:text-left flex align-middle items-cente">
            <MobileSideMenus></MobileSideMenus>
            <h1 className="font-bold  header-font">Personal Settings</h1>
          </div>
        </div>
        <div className="sm:text-left py-0">
          <h2 className="font-bold  heading-sub-font">
            Your Info
          </h2>
        </div>
        <LabelInput
          register={register("firstName", {
            required: requiredMessage,
          })}
          label="First Name"
          required={true}
          errorMessage={errors.firstName?.message as string}
        />
        <LabelInput
          register={register("LastName", {
            required: requiredMessage,
          })}
          required={true}
          label="Last Name"
          errorMessage={errors.LastName?.message as string}
        />

  
        <div>
          <Label
            htmlFor="Email"
            className="font-bold text-xs"
          >
            Email  <span style={{ color: 'red' }}> *</span>
          </Label>
          <TextInput
            onKeyUp={() => { setMailcheck && setMailcheck("") }}
            autoComplete="off"
            id="email"
            className="focus:border-blue-300"
            type="email"
            sizing="md"
            {...register("email", {
              required: {
                value: true,
                message: "This field is required.",
              },
            })}
          />
          <p className="text-red-600 text-xs">
            {typeof errors?.email?.message === "string" &&
              errors?.email?.message}
          </p>
          
          {watchedEmail != '' && mailCheck && mailCheck != '' &&
            <p className="font-medium text-red-500 text-xs mt-1">
              This email address cannot be used at this time. Please try a different address.
            </p>
          }
          <p className="font-medium text-gray-500 text-xs mt-1">
            Note: Changing your email will require you to login after saving
          </p>

        </div>
       
        <div className="text-right">
          <Button
           type="submit"
            className="w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100"
            disabled={!isDirty || isLoading || buttonLoader}
          >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
          </Button>
        </div>
        <div className="devider pb-6">
          <div className="w-full">
            {isPrimaryEmailChangedSuccess && (
              <div
                className="flex flex-col gap-2 p-4 border-cyan-500 dark:bg-cyan-200 dark:text-cyan-800 rounded-lg border-t-4 bg-white box_shadow border_color text-sm text-gray-900"
                role="alert"
              >
                <div
                  className="flex items-center"
                  data-testid="flowbite-alert-wrapper"
                >
                  <div>
                    <span className="font-bold">
                      Your changes have been saved. Since you changed your email address, you will be logged out. Alternatively,
                      <button className="link_color mx-1" onClick={(e) => { e.preventDefault(); logoutTheUser(); }} > Click here to login</button>.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </section>
    :
    <div className="min-h-screen flex justify-center items-center">
      <Spinner />
    </div>
    }
    </>
  );
};

export default PersonalSettingsCompanyAdmin;
