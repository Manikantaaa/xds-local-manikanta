"use client";

import LabelInput from "@/components/labelInput";
import { Button } from "@/components/ui/button";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import ImageUploadPreview from "./bannerUploadPreview";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useCompanyGeneral } from "@/hooks/useCompanyGeneralInfo";
import { useCallback, useEffect, useMemo, useState } from "react";
import { IGeneralInfoFormProps } from "@/types/update-general-info-form.type";
import useFormUpdate from "@/hooks/useFormUpdate";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { toast } from "react-toastify";
import LogoUploadPreview from "./logoUploadPreview";
import { Select } from "flowbite-react";
import { authFetcher } from "@/hooks/fetcher";
import Spinner from "@/components/spinner";
import UniqueFormId from "@/hooks/useRandomId";
import ButtonSpinner from "./ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { useProfileStatusContext } from "@/context/profilePercentage";
import MobileSideMenus from "@/components/mobileSideMenus";

const requiredMessage = "This field is required.";

export interface IGeneralInfoFormSubmitProps {
  name: string;
  website: string;
  shortDescription?: string;
  previewLogoUrl?: string;
  previewBannerUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  companySize: string;
  deletedLogo?: string;
  deletedBanner?: string;
  uniqueFormId?: string;
}

const GeneralInfoForm = () => {
  const { user, setUser } = useUserContext();
  const [companysizes, setCompanysizes] = useState([]);
  const [canRender, setCanRender] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_'+new Date().getTime());
  const [validateLogoDimension, setvalidateLogoDimension] = useState<string>("");
  const [validateBannerDimension, setvalidateBannerDimension] = useState<string>("");

  if (!user) {
    redirect(PATH.HOME.path);
  }

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

  //unique form Id
  useEffect(() => {
    if(user) {
      const formId = UniqueFormId(user?.id);
      setUniqueFormId(formId);
    }
    
  }, []);

  const {
    data: companyGeneralInfo,
    isLoading: generalInfoLoading,
    mutate,
  } = useCompanyGeneral(user.companyId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: useMemo(() => {
      return {
        name: companyGeneralInfo?.name,
        website: companyGeneralInfo?.website,
        shortDescription: companyGeneralInfo?.shortDescription,
        logoFile: companyGeneralInfo?.logoUrl,
        bannerFile: companyGeneralInfo?.bannerUrl,
        companySize: companyGeneralInfo?.companySize?.toString(),
      };
    }, [
      companyGeneralInfo?.bannerUrl,
      companyGeneralInfo?.logoUrl,
      companyGeneralInfo?.name,
      companyGeneralInfo?.shortDescription,
      companyGeneralInfo?.website,
      companyGeneralInfo?.companySize,
    ]),
  });

  const {
    isLoading,
    error,
    success,
    submitForm,
    reset: submitFormReset,
  } = useFormUpdate<IGeneralInfoFormSubmitProps>({
    url: getEndpointUrl(ENDPOINTS.companyGeneralInfo(user.companyId)),
  });

  const { submitForm: submitImageForm } = useFormUpdate<FormData>({
    url: getEndpointUrl(ENDPOINTS.uploadSingle),
  });

  const { submitForm: submitBannerImageForm } = useFormUpdate<FormData>({
    url: getEndpointUrl(ENDPOINTS.uploadBanner),
  });

  const onSubmit = (async (data: IGeneralInfoFormProps) => {
    setButtonLoader(true);
    const logoFormData = new FormData();

    let logoUrl = companyGeneralInfo.logoUrl;
    let deletedLogo;
    if (data.logoFile && data.logoFile[0]) {
      logoFormData.append("file", data.logoFile[0]);
      logoFormData.append("companyId", user.companyId.toString());

      const resLogo = await submitImageForm(logoFormData);
      logoUrl = resLogo?.data;
      if (companyGeneralInfo.logoUrl) {
        deletedLogo = companyGeneralInfo.logoUrl;
      }
      
    }

    const bannerFormData = new FormData();
    let bannerUrl;
    let deletedBanner;
    if (!data.bannerFile) {
      // If no banner file provided, remove the banner
      bannerUrl = "";
      if (companyGeneralInfo.bannerUrl) {
        deletedBanner = companyGeneralInfo.bannerUrl;
      }
    } else if (data.bannerFile[0]) {
      // If a new banner file is present, upload it
      bannerFormData.append("file", data.bannerFile[0]);
      bannerFormData.append("companyId", user.companyId.toString());
      const resBanner = await submitBannerImageForm(bannerFormData);
      bannerUrl = resBanner.data;
      if (companyGeneralInfo.bannerUrl) {
        deletedBanner = companyGeneralInfo.bannerUrl;
      }
    } else {
      // If the same banner file is retained, keep the current banner URL
      bannerUrl = companyGeneralInfo.bannerUrl;
    }

    // Submit the form data with updated logo and banner URLs
    const response = await submitForm({
      ...data,
      logoUrl,
      bannerUrl,
      deletedLogo,
      deletedBanner,
      uniqueFormId,
    });
    if(response){
      if (profilepercentage) {
        setProfilepercentage({
          generalInfoProfilePerc: 20,
          aboutProfilePerc: profilepercentage.aboutProfilePerc,
          ourWorkAlbumsProfilePerc: profilepercentage.ourWorkAlbumsProfilePerc,
          ourWorkProjectProfilePerc: profilepercentage.ourWorkProjectProfilePerc,
          servicesProfilePerc: profilepercentage.servicesProfilePerc,
          certificationsProfilePerc: profilepercentage.certificationsProfilePerc,
          contactsProfilePerc: profilepercentage.contactsProfilePerc,
          profileCompleted: bannerUrl != ''? profilepercentage.profileCompleted : false ,
          bannerAssetId: bannerUrl != ''? bannerUrl : null,
        });
       setUser({...user, slug: response.data})
      };
    };
    setButtonLoader(false);
    submitFormReset();
    resetAsyncForm();
    reset(data);
  }) as SubmitHandler<FieldValues>;

  const resetAsyncForm = useCallback(async () => {
    await mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (companyGeneralInfo) {
      companyGeneralInfo.companySize = companyGeneralInfo?.companySize?.toString();
      reset(companyGeneralInfo);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyGeneralInfo]);

  useEffect(() => {
    async function getCompanySizes() {
      try {
        const companysizeslist = await authFetcher(
          getEndpointUrl(ENDPOINTS.getcompanysizeslist),
        );
        if (companysizeslist.success) {
          setCompanysizes(companysizeslist.list);
        } else {
          console.log(
            `Api Responded with statuscode ${companysizeslist.statuscode}`,
          );
        }
        setCanRender(true);
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }
    getCompanySizes();
  }, []);

  useEffect(() => {
    if (success) {
      toast.success("Your changes have been saved 👍");
      setButtonLoader(false);
      
    }
    if (error) {
      toast.error("Something's wrong. Please try again.");
      setButtonLoader(false);
    }
  }, [success, error]);
  usePreventBackNavigation(isDirty);
  return (
    <>
      {
        canRender ?
        <>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left flex align-middle items-cente">
              <MobileSideMenus></MobileSideMenus>
              <h1 className="font-bold  header-font">General Info</h1>
            </div>
          </div>
          <div className="py-6">
            <hr />
          </div>
          <form
            className="space-y-6 mt-0 lg:w-[25rem] pb-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {/* <h2 className="font-bold text-2xl">General Info</h2> */}
            <LabelInput
              register={register("name", {
                required: requiredMessage,
              })}
              label="Company Name"
              required={true}
              errorMessage={errors.name?.message as string}
            />
            <LabelInput
              register={register("website", {
                required: requiredMessage,
              })}
              label="Company Website"
              required={true}
              placeholder="https://example.com"
              errorMessage={errors.website?.message as string}
            />
            {/* {user?.isPaidUser && */}
              <div>
                <Label htmlFor={"shortDescription"} className="font-bold text-xs">Short Company Description 
                  {/* {user?.isPaidUser &&  */}
                  <span style={{ color: 'red' }}> *</span>
                   {/* } */}
                  </Label>
                <Textarea
                  id={"shortDescription"}
                  {...register("shortDescription", {
                    // ...(user?.isPaidUser && {
                      required: requiredMessage,
                      validate: value => value.length < 200 || "Please keep the description to under 200 characters for best results. This is approximately 1-3 sentences."
                    // })
                  })}
                  // readOnly={!user?.isPaidUser}
                />
                {(errors.shortDescription?.message as string) ? (
                  <p className="font-medium text-red-500 text-xs mt-1">
                    {errors.shortDescription?.message as string}
                  </p>
                ) : (
                  <p className="font-medium text-gray-500 text-xs mt-1">
                    Please keep the description to under 200 characters for best
                    results. This is approximately 1-3 sentences.
                  </p>
                )}
              </div>
            {/* } */}
            <div>
              <Label htmlFor={"shortDescription"} className="font-bold text-xs">Company Size <span style={{ color: 'red' }}> *</span></Label>
              <Select
                id="companySizes"
                {...register(`companySize`, {
                  required: requiredMessage,
                })}
              >
                <option value="">Select</option>
                {companysizes.map((size: { id: number; size: string }, index) => (
                  <option key={index} value={size.id}>
                    {size.size}
                  </option>
                ))}
              </Select>
              <p className="font-medium text-red-500 text-xs mt-1">
                {errors.companySize?.message as string}
              </p>
            </div>
            <p className="font-bold text-sm">Company Logo <span style={{ color: 'red' }}> *</span></p>
            <p className="text-sm text-dark-800">
              Your logo will display at the top of your profile page. For best
              results, use an square image. We recommend 150px by 150px. Please keep
              the file size under 5MB.
            </p>
            <div>
              <LogoUploadPreview
                previewShape="square"
                buttonLabel="Add logo image"
                removeLabel="Remove logo image"
                defaultValue={companyGeneralInfo?.previewLogoUrl}
                register={register}
                isLoading={generalInfoLoading}
                setValue={setValue}
                setvalidateDimension = {setvalidateLogoDimension}

              />
              { validateLogoDimension !='' &&
                <p className="font-medium text-red-500 text-xs mt-1">
                {validateLogoDimension}
                </p>
              }
              {validateLogoDimension == "" &&
                <p className="font-medium text-red-500 text-xs mt-1">
                  {errors.logoFile?.message as string}
                </p>
              }
              
            </div>
           
              <div>
                <p className="font-bold text-sm pb-6">Banner</p>
                <p className="text-sm text-dark-800">
                  Your banner will display at the top of your profile page. Please use an
                  image that is 16:9 ratio - 800px wide by 450px tall. Also keep the file
                  size under 10MB.
                </p>
                <div className="py-6">
                  <ImageUploadPreview
                    previewShape="rectangle"
                    buttonLabel="Add banner image"
                    removeLabel="Remove banner image"
                    defaultValue={companyGeneralInfo?.previewBannerUrl}
                    register={register}
                    isLoading={generalInfoLoading}
                    setValue={setValue}
                    setvalidateBannerDimension= {setvalidateBannerDimension}
                  /> 
                  { validateBannerDimension && validateBannerDimension != '' &&
                    <p className="font-medium text-red-500 text-xs mt-1"> 
                    {validateBannerDimension}
                  </p>
                  }
                  {validateBannerDimension == "" &&
                    <p className="font-medium text-red-500 text-xs mt-1">
                      {errors.bannerFile?.message as string}
                    </p>
                  }
                </div>
              </div>
           

            <div className="flex items-center justify-end">
              <Button
                type="submit"
                className="w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100"
                disabled={!isDirty || isLoading || buttonLoader}
              > {buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
              </Button>
            </div>
          </form>
        </>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
    </>

  );
};

export default GeneralInfoForm;
