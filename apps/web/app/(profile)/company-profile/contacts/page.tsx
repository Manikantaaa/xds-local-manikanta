"use client";

import Breadcrumbs from "@/components/breadcrumb";
import MobileSideMenus from "@/components/mobileSideMenus";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { authFetcher } from "@/hooks/fetcher";
import { Button, Label, Select, TextInput, Tooltip } from "flowbite-react";
import { redirect } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import ButtonSpinner from "@/components/ui/buttonspinner";
import profilePlaceHolder from "@/public/profile-user.png"
import {
  Control,
  FieldValues,
  SubmitHandler,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { toast } from "react-toastify";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import ImageCrop from "@/components/imageCrop";
import Image from "next/image";
import { useProfileStatusContext } from "@/context/profilePercentage";

interface Contacts {
  countryId: string;
  email: string;
  linkedInUrl: string;
  name: string;
  title: string;
  profilePic: string,
  fullprofileUrl: string,
  calendarLink: string,
}

const breadcrumbItems = [
  {
    label: PATH.HOME.name,
    path: PATH.HOME.path,
  },
  {
    label: PATH.COMPANY_PROFILE.name,
    path: PATH.COMPANY_PROFILE.path,
  },
  {
    label: PATH.CONTACT.name,
    path: PATH.CONTACT.path,
  },
];

const Contact = () => {
  const { user } = useUserContext();
  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
  }

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    control,
    setValue,
    getValues,
  } = useForm<{ contacts: Contacts[] }>({
    defaultValues: {
      contacts: [
        {
          countryId: "",
          email: "",
          linkedInUrl: "",
          name: "",
          title: "",
          profilePic: "",
          fullprofileUrl: "",
        },
      ],
    },
  });

  const { fields, append, remove, } = useFieldArray({
    control: control as Control<{ contacts: Contacts[] }>,
    name: "contacts",
  });
  watch("contacts")
  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    [],
  );

  const [showAddContact, setShowAddContact] = useState<boolean>(true);
  const [canRender, setCanRender] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  //
  const [openImageModal, setOpenImageModal] = useState(false);
  const [genratedimageUrl, setgenratedimageUrl] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [errorDisplay, setErrorDisplay] = useState<string>('');
  const [currentIndexImage, setCurrentIndexImage] = useState<number>(-1);

  const { error, success, submitForm } = useCommonPostData<{
    id: number;
    contacts: Contacts[];
  }>({
    url: getEndpointUrl(ENDPOINTS.saveContacts),
  });

  const fetchContacts = useCallback(async () => {
    if (user) {
      await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getCompanyContacts(user.companyId))}`,
      )
        .then((result) => {
          const theContactsArr: Contacts[] = [];
          for (const contact of result.data) {
            const theContact = {
              name: contact.name,
              email: contact.email,
              title: contact.title,
              countryId: contact.countryId,
              linkedInUrl: contact.linkedInUrl,
              profilePic: contact.profilePic,
              fullprofileUrl: contact.fullprofileUrl,
              calendarLink: contact.calendarLink,
            };
            theContactsArr.push(theContact);
          }

          if (theContactsArr.length > 2) {
            setShowAddContact(false);
          }

          if (theContactsArr.length > 0) {
            const theContacts: { contacts: Contacts[] } = {
              contacts: theContactsArr,
            };
            reset(theContacts);
          }
          setCanRender(true);
        })
        .catch((err) => {
          setCanRender(true);
          console.log(err);
        });
    } else {
      setCanRender(true);
    }
  }, [reset, user]);

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getCountries)}`)
      .then((countries) => {
        setCountries(countries);
        fetchContacts();
      })
      .catch((err) => {
        console.log(err);
      });

    if (success) {
      toast.success("Your changes have been saved 👍");
    }
    if (error) {
      toast.error("Something's wrong. Please try again.");
    }
  }, [success, error, fetchContacts]);

  const onSubmit = (async (data: { contacts: Contacts[] }) => {
    setButtonLoader(true);
    const postData = {
      id: user.companyId,
      contacts: data.contacts,
    };
    const response = await submitForm(postData);
    if (response) {
      setButtonLoader(false);
      let profilePic = '';
      if(data.contacts.length > 0 ){
        if((data.contacts[0] && data.contacts[0].profilePic == '') || (data.contacts[1] && data.contacts[1].profilePic == '') || (data.contacts[2] && data.contacts[2].profilePic == '')) {
          profilePic = '';
        } else {
          profilePic = data.contacts[0].profilePic;
        }
      }
      if (profilepercentage) {
        setProfilepercentage({
          generalInfoProfilePerc: profilepercentage ? profilepercentage.generalInfoProfilePerc : 0,
          aboutProfilePerc: profilepercentage ? profilepercentage.aboutProfilePerc : 0,
          ourWorkAlbumsProfilePerc: profilepercentage ?  profilepercentage.ourWorkAlbumsProfilePerc : 0,
          ourWorkProjectProfilePerc: profilepercentage ?  profilepercentage.ourWorkProjectProfilePerc : 0,
          servicesProfilePerc: profilepercentage ?  profilepercentage.servicesProfilePerc : 0,
          certificationsProfilePerc: profilepercentage ?  profilepercentage.certificationsProfilePerc : 0,
          contactsProfilePerc: 16,
          profileCompleted: profilepercentage.profileCompleted,
          bannerAssetId: profilepercentage.bannerAssetId,
        });
      };
    } else {
      setButtonLoader(false);
    }
  }) as SubmitHandler<FieldValues>;

  function addNewContact(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    if (fields.length > 1) {
      setShowAddContact(false);
    }
    const aContact: Contacts = {
      countryId: "",
      email: "",
      linkedInUrl: "",
      name: "",
      title: "",
      profilePic: "",
      fullprofileUrl: "",
      calendarLink:"",
    };
    append(aContact);
  }

  function removeContact(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    indexToRemove: number,
  ) {
    e.preventDefault();
    remove(indexToRemove);
    setShowAddContact(true);
  }

  const handleDataReceived = (data: any) => {
    // Handle the received data from the child component

    if (!data || !data.data) {
      setOpenImageModal(false);
      return;
    }
    if (typeof data.data === 'string') {
      setErrorDisplay(data.data);
      setgenratedimageUrl("");
    } else {
      setValue(`contacts.${currentIndexImage}.profilePic`, data.data.fileUrl, { shouldDirty: true });
      setValue(`contacts.${currentIndexImage}.fullprofileUrl`, data.data.fullpath, { shouldDirty: true });
      setgenratedimageUrl(data.data.fullpath);
      setErrorDisplay('');

    }
    setTimeout(() => {
      setOpenImageModal(false);
    }, 1500);

  };

  function deleteProfilePic(Index: number) {
    setValue(`contacts.${Index}.profilePic`, "", { shouldDirty: true });
    setValue(`contacts.${Index}.fullprofileUrl`, "", { shouldDirty: true });
  }
  usePreventBackNavigation(isDirty);
  return (
    <>
      {
        canRender ?
          <div>

            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left flex align-middle items-cente">
                <MobileSideMenus></MobileSideMenus>
                <h1 className="font-bold  header-font">Contacts</h1>
              </div>
            </div>
            <div className="py-6">
              <hr />
            </div>
            <div className="lg:w-[550px] ">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <p className="text-sm pb-6">
                    Add key contacts here as they will be visible on your company profile.
                  </p>
                </div>

                {fields.map((contact, index) => (
                  <div key={index} className="mb-6">
                    <div className="p-3 uploading_images_bg space-y-1">
                      <div className="firstname pt-0">
                        <p className="text-sm pb-3 font-semibold">Contact {index + 1}</p>
                        <div className="firstname">
                          <div className="mb-1 block">
                            {/* <Label
                            
                            value={`Profile Image`}
                            className="font-bold text-xs"
                          />  */}
                          </div>
                          <div className="text-center">
                            <div className="w-[120px] m-auto relative">
                              {(getValues(`contacts.${index}.fullprofileUrl`) && getValues(`contacts.${index}.fullprofileUrl`) != "") ?
                                <Image src={getValues(`contacts.${index}.fullprofileUrl`)} width={130} height={130} alt="" className="m-auto rounded-full" />
                                :
                                <Image src={profilePlaceHolder} width={130} height={130} alt="" className="m-auto rounded-full" />

                              }

                              {(getValues(`contacts.${index}.fullprofileUrl`) && getValues(`contacts.${index}.fullprofileUrl`) != "") &&
                                <div className="delete_icon cursor-pointer" onClick={() => { (getValues(`contacts.${index}.fullprofileUrl`) && getValues(`contacts.${index}.fullprofileUrl`) != "") && deleteProfilePic(index) }}>
                                  <svg className="w-5 h-5 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                                  </svg>
                                </div>
                              }


                            </div>
                            <div className="flex items-center justify-center ml-6">
                              <Label htmlFor={`file-upload-${index}`}
                                className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2 mt-2'>
                                <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>
                                Upload Photo
                              </Label> <Tooltip className="tier_tooltip_2 text-left text-sm" content="Only PNG and JPEG images are accepted. Image size should be larger than 250x250px, and must be below 5Mb.">
                                <svg className="ms-2 mt-2.5 w-5 h-5 text-gray-800 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                  <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                </svg>

                              </Tooltip></div>
                            {/* <Button onClick={() => setOpenModal(true)}>Toggle modal</Button> */}
                            <TextInput
                              type="file"
                              id={`file-upload-${index}`}
                              accept="image/*"
                              {...register(`contacts.${index}.profilePic`)}

                              onChange={(e) => {
                                if (e?.target?.files && e?.target?.files.length > 0) {
                                  setCurrentIndexImage(index);
                                  setUploadedImage(e?.target?.files[0]);
                                  setOpenImageModal(true);
                                  setgenratedimageUrl("");
                                  setErrorDisplay('');

                                }
                                e.target.value = '';
                              }} />
                          </div>
                          {errors &&
                            errors.contacts &&
                            errors.contacts[index]?.profilePic ? (
                            <p className="text-red-600 text-xs">Email is required</p>
                          ) : (
                            ""
                          )}
                        </div>
                        <div className="mb-1 block">
                          <Label

                            value="Name "
                            className="font-bold text-xs"
                          /><span style={{ color: 'red' }}>*</span>
                        </div>
                        <TextInput
                          autoComplete="off"

                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`contacts.${index}.name`, {
                            required: true,
                          })}
                        />
                        {errors && errors.contacts && errors.contacts[index]?.name ? (
                          <p className="text-red-600 text-xs">Name is required</p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label

                            value="Email "
                            className="font-bold text-xs"
                          /> <span style={{ color: 'red' }}>*</span>
                        </div>
                        <TextInput
                          autoComplete="off"

                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`contacts.${index}.email`, {
                            required: true,
                          })}
                          placeholder="example@email.com"
                        />
                        {errors &&
                          errors.contacts &&
                          errors.contacts[index]?.email ? (
                          <p className="text-red-600 text-xs">Email is required</p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label

                            value="Title "
                            className="font-bold text-xs"
                          /><span style={{ color: 'red' }}>*</span>
                        </div>
                        <TextInput
                          autoComplete="off"

                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`contacts.${index}.title`, {
                            required: true,
                          })}
                        />
                        {errors &&
                          errors.contacts &&
                          errors.contacts[index]?.title ? (
                          <p className="text-red-600 text-xs">Title is required</p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label

                            value="Country"
                            className="font-bold text-xs"
                          />
                          <span style={{ color: 'red' }}>*</span>
                        </div>
                        <Select
                          {...register(`contacts.${index}.countryId`, {
                            required: true,
                          })}
                        >
                          <option value="">
                            Select the country for this contact person
                          </option>
                          {countries.map((country, index) => (
                            <option key={index} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </Select>
                        {errors &&
                          errors.contacts &&
                          errors.contacts[index]?.countryId ? (
                          <p className="text-red-600 text-xs">
                            Please Select a country
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            value="Your LinkedIn Profile URL"
                            className="font-bold text-xs"
                          />
                          <span style={{ color: 'red' }}>*</span>
                        </div>
                        <TextInput
                          autoComplete="off"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          placeholder="https://www.linkedin.com/in/yourprofilename/"
                          {...register(`contacts.${index}.linkedInUrl`, {
                            required: true,
                          })}
                        />
                        {errors &&
                          errors.contacts &&
                          errors.contacts[index]?.linkedInUrl ? (
                          <p className="text-red-600 text-xs">
                            LinkedIn Url is required
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="calenderLink">
                        <div className="mb-1 block">
                          <div className="flex items-center">
                            <Label
                              value={`Calendar Link`}
                              className="font-bold text-xs"
                            />
                            <Tooltip
                              className="tier_tooltip_2 text-left text-sm"
                              content="Enter your personal calendar link to allow others to book meetings with you (Eg. Calendly, Doodle, Acuity, etc.)"
                            >
                              <svg
                                className="ms-1 w-4 h-4 text-gray-800"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </Tooltip>
                          </div>
                        </div>
                        <TextInput
                          autoComplete="off"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          placeholder=""
                          {...register(`contacts.${index}.calendarLink`, {
                            required: false,
                          })}
                        />
                        {/* {errors &&
                          errors.contacts &&
                          errors.contacts[index]?.calendarLink ? (
                          <p className="text-red-600 text-xs">
                            LinkedIn Url is required
                          </p>
                        ) : (
                          ""
                        )} */}
                      </div>

                      {index != 0 ? (
                        <div className="text-right pt-2">
                          <p className="text-sm text_mute">
                            {/* <Link href="#"> */}
                            <button onClick={(e) => removeContact(e, index)}>
                              <svg
                                className="me-1 w-3. h-3 "
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 18 20"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                                ></path>
                              </svg>{" "}
                              Remove this contact
                            </button>
                            {/* </Link> */}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                ))}

                <div className="another_location">
                  {showAddContact && (
                    <button
                      type="button"
                      className="searc_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
                      onClick={(e) => addNewContact(e)}
                    >
                      Add Another Contact
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap justify-end pb-6 pt-6">
                  <div className="left_btn inline-flex">
                    {/* <Button
                    type="button"
                    className="button_cancel hover:border-gray-100 h-[40px] px-4 mr-2"
                  >
                    Cancel
                  </Button> */}
                    <Button
                      type="submit"
                      className="bg-white button_blue hover:bg-white h-[40px] px-4"
                      disabled={buttonLoader}
                    > {buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
                    </Button>

                  </div>
                </div>
              </form>
            </div>
            {openImageModal && (
              <ImageCrop uploadedImage={uploadedImage} openImageModal={openImageModal} onDataReceived={handleDataReceived} />
            )}
          </div>

          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>
  );
};

export default Contact;
