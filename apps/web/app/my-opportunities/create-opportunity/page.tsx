"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import {
  Checkbox,
  Label,
  TextInput,
  Textarea,
  FileInput,
  Select,
  Radio,
  Tooltip,
} from "flowbite-react";
import { useState, useEffect, useRef, KeyboardEvent, } from "react";
import { authFetcher, fetcher } from "@/hooks/fetcher";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { useForm } from "react-hook-form";
import { useUserContext } from "@/context/store";
import Image from "next/image";
import useCommonPostData from "@/hooks/commonPostData";
import {  redirect, useRouter } from "next/navigation";
import Multiselect from "multiselect-react-dropdown";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Spinner from "@/components/spinner";
import { ServiceCapabilities } from "@/types/companies.type";
import Link from "next/link";
import { toast } from "react-toastify";
import { sanitizeData } from "@/services/sanitizedata";
import { useAuthentication } from "@/services/authUtils";
import { deletes3FileHook } from "@/hooks/deletes3File";
import UniqueFormId from "@/hooks/useRandomId";
import ButtonSpinner from "@/components/ui/buttonspinner";


const MyOpportunitynotanonymous = () => {
  const { user } = useUserContext();
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  if (user && user?.userRoles[0].roleCode === 'service_provider') {
    redirect(PATH.HOME.path);
  }
  const router = useRouter();
  const {
    register,
    setFocus,
    setError,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      oppStatus: "",
      industryId: "",
      platforms: [],
      technologies: "",
      approxEndDateCondition: "",
      approxStartDateCondition: "",
      showCompanyName: false,
      showContactPerson: false,
      approxStartDate: "",
      approxEndDate: "",
      expiryDate: "",
      staffMonths: "",
      showcompanyname: user && user?.companies && user?.companies[0].name,
      contactPersonName:
        user &&
        user?.companies[0] &&
        user?.companies[0]?.CompanyContacts &&
        user?.companies[0]?.CompanyContacts[0]?.name,
      isReceiveEmailEnabled: true,
      servicesselected: [],
      capabilitiesSelected: [],
      inputfiles: [],
      combinedservices: [],
      dbInputFiles: [],
    },
  });
  const [serviceAndCapabilities, setServiceAndCapabilities] = useState<
    ServiceCapabilities[]
  >([]);
  const watchStartDate = watch("approxStartDateCondition", "");
  const watchIndustryId = watch("industryId", "");
  const watchEndDate = watch("approxEndDateCondition", "");
  const watchShowCompanyName = watch("showCompanyName", true);
  const watchShowPersonName = watch("showContactPerson", true);
  const watchInputfiles = watch("inputfiles", []);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<
    { type: string; fileUrl: string }[]
  >([]);
  const [uploadedSignedFileUrls, setUploadedSignedFileUrls] = useState<
    { type: string; fileUrl: string }[]
  >([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [oppExpiryDate, setOppExpiryDate] = useState<Date>();
  const [platforms, setPlatforms] = useState<platformsDto[]>([]);
  const [industryTypes, setIndustryTypes] = useState<indstryDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pdfCount, setPdfCount] = useState<number>(0);
  const [imageCount, setImageCount] = useState<number>(0);
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_' + new Date().getTime());
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState(false);

  //unique form Id
  useEffect(() => {
    if (user) {
      const formId = UniqueFormId(user?.id);
      setUniqueFormId(formId);
    }

  }, []);

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.MYOPPERTUNITIES.name,
      path: PATH.MYOPPERTUNITIES.path,
    },
    {
      label: PATH.NEWOPPERTUNITY.name,
      path: PATH.NEWOPPERTUNITY.path,
    },
  ];
  const handleServicesCheckboxChange = (servicesId: string[]) => {
    let updatedServices = [...selectedServices];
    servicesId.forEach((serviceId) => {
      const isSelected = updatedServices.includes(serviceId);
      const capabilities = serviceAndCapabilities.filter((value) => value.id.toString() == serviceId);
      const capabilityIds = capabilities[0].capabilities.map((value) => value.id.toString());
      handleCapabilitiesCheckboxChange(capabilityIds, true);

      if (isSelected) {
        updatedServices = updatedServices.filter(
          (service) => service !== serviceId,
        );
      } else {
        updatedServices.push(serviceId);
      }
    });
    setSelectedServices(updatedServices);
  };

  const handleCapabilitiesCheckboxChange = (capabilitiesId: string[], isUncheked: boolean = false) => {

    let updatedcapabilities = [...selectedCapabilities];
    capabilitiesId.forEach((capabilityId) => {
      const isSelected = updatedcapabilities.includes(capabilityId);
      if (isSelected || isUncheked) {
        updatedcapabilities = updatedcapabilities.filter(
          (service) => service !== capabilityId,
        );
      } else {
        updatedcapabilities.push(capabilityId);
      }
    });
    setSelectedCapabilities(updatedcapabilities);
  };
  useEffect(() => {
    async function getservices() {
      const result1 = await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getServiceAndCapabilities)}`,
      );
      const masterServiceAndCapabilities = result1.data;
      const updatedServiceAndCapabilities: ServiceCapabilities[] =
        masterServiceAndCapabilities.map((service: ServiceCapabilities) => ({
          ...service,
          isChecked: false,
          showCapabilities: false,
          capabilities: service.capabilities.map(
            (capability: {
              id: number;
              capabilityName: string;
              isChecked: boolean;
            }) => ({
              ...capability,
              isChecked: false,
            }),
          ),
        }));
      setServiceAndCapabilities(updatedServiceAndCapabilities);
      getIndustryTypes();
    }
    async function getplatforms() {
      try {
        const serviceslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getPlatforms),
        );
        if (serviceslist) {
          setPlatforms(serviceslist);
        } else {
          console.log(
            `Api Responded with statuscode ${serviceslist.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }

    async function getIndustryTypes() {
      try {
        const serviceslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getindustrytype),
        );
        if (serviceslist) {
          setIndustryTypes(serviceslist.data);
          getplatforms();
        } else {
          console.log(
            `Api Responded with statuscode ${serviceslist.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }
    getservices();
  }, []);

  const { error: fileerror, submitForm: saveFiles } =
    useCommonPostData<FormData>({
      url: getEndpointUrl(ENDPOINTS.myopportunitysavefiles),
    });

  async function handleUploadedFile(event: React.FormEvent<HTMLInputElement>) {
    clearErrors('inputfiles');
    const fileUrls: { type: string; fileUrl: string }[] = [...uploadedFileUrls];
    const fileSignedUrls: { type: string; fileUrl: string }[] = [...uploadedSignedFileUrls];
    const selectedFiles: FileList | null = event.currentTarget.files;
    if (selectedFiles && pdfCount+imageCount+ selectedFiles?.length > 11) {
      setError('inputfiles', {
        type: 'manual',
        message: 'You can upload only one PDF file and 10 images'
      });
      return;
    }

    if (selectedFiles && selectedFiles.length > 0) {
      const files = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileNameParts = selectedFiles[i].name.split(".");
        const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
        if (fileNameParts.length > 2) {
          setError('inputfiles', {
            type: 'manual',
            message: 'Images with multiple extensions (or periods) in the file name are not allowed'
          });
          return;
        }
        if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg" && fileExtension !== "pdf")) {
          setError('inputfiles', {
            type: 'manual',
            message: 'Only a PNG, JPG, JPEG, PDF file can be uploaded'
          });
          return;
        }
        if (selectedFiles[i].type.startsWith('image/')) {
         
          if (imageCount+ selectedFiles?.length > 10) {
            setError('inputfiles', {
              type: 'manual',
              message: 'You can only upload upto 10 images.'
            });
            return;
          }
          const MAX_IMAGE_SIZE = 7 * 1024 * 1024; // 32MB in bytes
          if (selectedFiles[i].size > MAX_IMAGE_SIZE) {
            setError('inputfiles', {
              type: 'manual',
              message: 'Image file size must be below 7MB'
            });
            return;
          }
          // setImageCount((prevpdfCount) => prevpdfCount + 1);
        } else if (selectedFiles[i].type === 'application/pdf') {
          const MAX_PDF_SIZE = 32 * 1024 * 1024; // 32MB in bytes
          if (pdfCount + selectedFiles?.length > 1) {
            setError('inputfiles', {
              type: 'manual',
              message: 'You can only upload one PDF file'
            });
            return;
          }

          if (selectedFiles[i].size > MAX_PDF_SIZE) {
            setError('inputfiles', {
              type: 'manual',
              message: 'PDF file size must be below 32MB'
            });
            return;
          }
          // setPdfCount((prevImageCount) => prevImageCount + 1);
        }
        // files.append("uplaodinputfiles", selectedFiles[i]);
      }
      for (let i = 0; i < selectedFiles.length; i++) {
        if (selectedFiles[i].type.startsWith('image/')) {
          setPdfCount((prevImageCount) => prevImageCount + 1);
        } else if (selectedFiles[i].type === 'application/pdf') {
          setPdfCount((prevPdfCount) => prevPdfCount + 1);
        }
        files.append("uplaodinputfiles", selectedFiles[i]);
      }
      files.append(`formId`, uniqueFormId);
      setIsLoading(true);
      if (user) {
        const userId = user.companyId;
        files.append("companyId", userId.toString());
      }

      await saveFiles(files)
        .then((result) => {
          if (result.data) {
            setIsLoading(false);
            const signedsavedFileUrls: { type: string, url: string }[] = result.data.data.signedurls;

            signedsavedFileUrls.forEach((url) => {
              let type = 'image';
              if (url.type == 'application/pdf') {
                type = 'file';
              }
              fileSignedUrls.push({ type, fileUrl: url.url });
            });
            const savedforDBFileUrls: { type: string, url: string }[] = result.data.data.fileUrls;

            savedforDBFileUrls.forEach((url) => {
              let type = 'image';
              if (url.type == 'application/pdf') {
                type = 'file';
              }
              fileUrls.push({ type: type, fileUrl: url.url });
            });
            setUploadedSignedFileUrls(fileSignedUrls);
            setUploadedFileUrls(fileUrls);
          } else {
            if (fileerror) {
            }
          }
          console.log('pdf count: %d', pdfCount)
          console.log('image count: %d', imageCount)
        })
        .catch((err) => {
          setIsLoading(false);
          console.log(err);
        });
    }
  }

  const handleFileRemove = (index: number) => {
    clearErrors('inputfiles');
    const updatedUploadedFileUrls = [...uploadedFileUrls];
    const updatedSignedUploadedFileUrls = [...uploadedSignedFileUrls];
    const deletedfile = updatedUploadedFileUrls.splice(index, 1);
    if (deletedfile && deletedfile[0].fileUrl) {
      if (deletedfile[0].type == 'file') {
        setPdfCount((prevPdfcount) => prevPdfcount - 1);
      } else {
        setImageCount((prevImageCount) => prevImageCount - 1)
      }
    }
    updatedSignedUploadedFileUrls.splice(index, 1);
    setUploadedFileUrls(updatedUploadedFileUrls);
    setUploadedSignedFileUrls(updatedSignedUploadedFileUrls);
    const updatedFiles = [...watchInputfiles];
    updatedFiles.splice(index, 1);
    setValue("inputfiles", updatedFiles);
  };

  //save form
  const { error, success, submitForm } = useCommonPostData<opportunityForm>({
    url: getEndpointUrl(ENDPOINTS.createmyOpportunity),
  });

  useEffect(() => {
    setFocus("inputfiles");
  }, [setFocus]);

  const onSubmit = (data: opportunityForm) => {
    if (pdfCount > 1) {
      setError('inputfiles', {
        type: 'manual',
        message: 'You can only upload one PDF file'
      });
      return;
    } else if (imageCount > 10) {
      setError('inputfiles', {
        type: 'manual',
        message: 'You can only upload upto 10 images.'
      });
      return;
    }
    setButtonLoader(true);
    uploadedFileUrls.map((uploadedFileUrl) => {
      data.dbInputFiles.push(uploadedFileUrl);
    });
    data.approxStartDate = data.approxStartDate && new Date(data.approxStartDate).toLocaleDateString('en-US');
    data.approxEndDate = data.approxEndDate && new Date(data.approxEndDate).toLocaleDateString('en-US');
    // data.description = JSON.stringify(data.description);
    // data.companyId = 200;
    data.companyId = user?.companyId ? user?.companyId : 1;

    data.capabilitiesSelected.forEach(selectedCapabilityId => {
      const foundService = serviceAndCapabilities.find(service =>
        service.capabilities.some(capability => capability.id === Number(selectedCapabilityId))
      );

      const updatedata = {
        serviceId: foundService?.id || 0,
        capabilityId: selectedCapabilityId
      }
      data.combinedservices.push(updatedata);
    });

    data.servicesselected.forEach((service) => {

      const updatedata = {
        serviceId: Number(service),
        capabilityId: null,
      }
      data.combinedservices.push(updatedata);
    });

    const sanitizedData: opportunityForm = sanitizeData(data) as opportunityForm;
    sanitizedData.description = JSON.stringify(sanitizedData.description);
    sanitizedData.uniqueFormId = uniqueFormId;
    submitForm(sanitizedData).then((response) => {
      if (response.data && response.data.StatusCode !== 200) {
        setButtonLoader(false);
        toast.error('An Error occurred, Try Again Later');
      } else {
        setButtonLoader(false);
        toast.success('Opportunity successfully created 👍');
        const timeoutId = setTimeout(() => {
          router.push("/my-opportunities", undefined,);
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }).catch((err) => {
      console.log(err);
      setButtonLoader(false);
      toast.error('An Error occurred, Try Again Later');
    });
  };
  function onAddOrRemovePlatforms(
    theSelectedPlatforms: { id: number; name: string }[],
  ) {
    const platforms: number[] = [];
    for (const item of theSelectedPlatforms) {
      platforms.push(item.id);
    }
    setValue(`platforms`, platforms as never[]);
  }
  const handleDateChange = (date: Date, inputfrom: string) => {
    if (inputfrom == 'start') {
      const dateString = date.toLocaleDateString('en-US');
      setValue("approxStartDate", dateString);
      setStartDate(date);
    } else if (inputfrom == 'approxEndDate') {
      const dateString = date.toLocaleDateString('en-US');
      setValue("approxEndDate", dateString);
      setEndDate(date);
    } else if (inputfrom == 'expiryDate') {
      const dateString = date.toLocaleDateString('en-US');
      setValue("expiryDate", dateString);
      setOppExpiryDate(date);
    }
  };
  const inputlengthValidation = (e: KeyboardEvent<HTMLInputElement>) => {
    setError("staffMonths", {
      message: ''
    });
    const textInput = e.target as HTMLInputElement;
    const staffValue = textInput.value;
    const staffValueAsNumber = parseFloat(staffValue);
    if (staffValueAsNumber > 1000 || staffValueAsNumber < 1) {
      setError("staffMonths", {
        type: 'manual',
        message: 'Estimated Staff months must be between 1 and 1000'
      });
      setValue("staffMonths", "");
    }
  };

  const handleDragEnter = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  
    if (e.dataTransfer.files.length > 0) {
      // Create a synthetic event with files
      const syntheticEvent = {
        currentTarget: { files: e.dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>;
  
      handleUploadedFile(syntheticEvent);
    }
  };

  return (
    <div className="w-full lg:container px-5 pos_r">
      <div className="py-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex justify-between">
          <div className="text-left">
            <h1 className="defult_text_color header-font">New Opportunity</h1>
          </div>
        </div>
        <div className="devider pt-6">
          <hr />
        </div>
        <div className="py-6">

          <div className="grid lg:grid-cols-3 lg:gap-28 gap-10">
            <div className="pe-4">
              
              <div className="flex flex-col gap-5">
                <div className="bg-[#E6F1FA] p-2.5 rounded-md">
                  <p className=" font-bold text-sm ">Anonymity Settings</p>
                  <p className="italic text-sm leading-6 pt-3">Note - opportunities are anonymous by default. Check the boxes below to allow others to see your company and/or your name.</p>
                  <div className="pt-3">
                    <div className="companyName flex items-center gap-2">
                      <Checkbox
                        id="companyName"
                        {...register("showCompanyName")}
                      />
                      <Label htmlFor="showCompanyName" className="flex">
                        Show Company Name
                      </Label>
                      {/* <Tooltip
                      content="Your company name is displayed by default. Unselect this if you prefer to remain anonymous."
                      className="tier_tooltip"
                    >
                      <svg
                        className="-ml-1 w-[16px] h-[16px] text-gray-600 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                          clip-rule="evenodd"
                        />
                      </svg>{" "}
                    </Tooltip> */}
                    </div>
                    {watchShowCompanyName && (
                      <>
                        <div className="mb-2 block pl-6">
                          <label className="font-bold text-sm" data-testid="flowbite-label" htmlFor="name">{watch("showcompanyname")}</label>
                        </div>
                        {/* <TextInput
                          autoComplete="off"
                          id="showcompanyname"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          readOnly
                          {...register("showcompanyname")}
                        /> */}
                      </>
                    )}
                  </div>
                  <div className="pt-3">
                    <div className="contactPerson flex items-center gap-2">
                      <Checkbox
                        id="contactPerson"
                        {...register("showContactPerson")}
                      />
                      <Label htmlFor="contactPerson" className="flex">
                        Show Contact Person
                      </Label>
                    </div>

                    {watchShowPersonName && (
                      <>
                        <div className="mb-2 block">
                          <label className="text-gray-900 dark:text-white font-bold text-xs" data-testid="flowbite-label" htmlFor="name">Contact Person </label>
                        </div>
                        <TextInput
                          id="contactPersonName"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register("contactPersonName", {
                            required: {
                              value: true,
                              message: "Contact person name is required",
                            },
                          })}
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="name">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="name"
                      className="font-bold text-xs"
                    >
                      Opportunity Name <span style={{ color: 'red' }}>*</span>
                    </Label>
                  </div>
                  <TextInput
                    autoComplete="off"
                    id="name"
                    className="focus:border-blue-300"
                    type="text"
                    sizing="md"
                    {...register("name", {
                      required: {
                        value: true,
                        message: "Name is required",
                      },
                    })}
                  />
                  <p className="text-red-600 text-xs">
                    {typeof errors?.name?.message === "string" &&
                      errors?.name?.message}
                  </p>
                </div>
                <div className="Description">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="Description"
                      value="Description"
                      className="font-bold text-xs"
                    />
                  </div>
                  <Textarea
                    id="Description"
                    placeholder="Leave a comment..."
                    rows={4}
                    {...register("description")}
                  />
                </div>
                <div className="files">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"
                      value="Images & Files"
                      className="font-bold text-xs"
                    />
                  </div>
                  <Label

                    htmlFor="dropzone-file"
                    className="dark:hover:bg-bray-800 flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragEnter}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                      <svg
                        className="mb-4"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="25"
                        viewBox="0 0 24 25"
                        fill="none"
                      >
                        <path
                          d="M13.5 15.6714L16.2746 12.7567C16.5941 12.4144 17.1131 12.4144 17.4311 12.7567C17.7506 13.0991 17.7506 13.6576 17.4311 13.9999L14.5061 17.0742C13.5476 18.1044 12.0011 18.1077 11.0396 17.0742L8.11462 13.9999C7.79513 13.6576 7.79513 13.0991 8.11462 12.7567C8.43262 12.4144 8.95162 12.4144 9.27112 12.7567L12 15.6234V2.83333C12 2.3731 12.3358 2 12.75 2C13.1642 2 13.5 2.3731 13.5 2.83333V15.6714ZM6.26957 9.5C5.56114 9.5 4.9512 10.0047 4.81226 10.7058L3.02886 19.7058C3.00967 19.8027 3 19.9012 3 20C3 20.8284 3.66538 21.5 4.48617 21.5H21.0135C21.1114 21.5 21.209 21.4902 21.305 21.4709C22.1099 21.3084 22.6318 20.5182 22.4709 19.7058L20.6874 10.7058C20.5485 10.0047 19.9386 9.5 19.2301 9.5H6.26957ZM9 8V9.5H16.5V8H19.2379C20.6565 8 21.8779 9.00938 22.1561 10.4117L23.9416 19.4117C24.264 21.0363 23.2188 22.6168 21.6071 22.9417C21.4149 22.9805 21.2194 23 21.0235 23H4.47596C2.83238 23 1.5 21.6569 1.5 20C1.5 19.8024 1.51936 19.6054 1.55779 19.4117L3.34337 10.4117C3.62157 9.00938 4.84295 8 6.26154 8H9Z"
                          fill="#343741"
                        />
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">
                          Select or drag and drop multiple files
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, PDF (Max 10 images & 1 PDF)</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">750 x 422 dimensions.</p>

                    </div>
                    <FileInput
                      id="dropzone-file"
                      className="hidden"
                      multiple
                      {...register("inputfiles")}
                      onChange={(e) => handleUploadedFile(e)}
                      ref={inputFileRef}
                    />
                  </Label>

                  {fileerror && <p className="text-red-600 text-xs p-3">{fileerror}</p>}
                  <p className="text-red-600 text-xs p-3">
                    {typeof errors?.inputfiles?.message === "string" &&
                      errors?.inputfiles?.message}
                  </p>

                  <hr />
                  {isLoading ?
                    <div className="pt-4 flex justify-center items-center">
                      <Spinner />
                    </div>
                    : ''
                  }
                  <div className="grid grid-cols-2 gap-2 pt-6">
                    {uploadedSignedFileUrls &&
                      uploadedSignedFileUrls.map((url, index) => (
                        <div className="relative img_view_h" key={`fileurl_${index}`}>
                          {/* <Link href={url.fileUrl} target="__blank">
                          {url.fileUrl}{" "}
                        </Link> */}
                          {(url.type == 'image') ?
                            <Image
                              src={url.fileUrl}
                              className="inline-flex ms-1 divide-y "
                              alt={url.fileUrl}
                              width={100}
                              height={100}
                            />
                            :
                            <Link prefetch={false} href={url.fileUrl} target="__blank">
                              <Image
                                src="/pdf.png"
                                title={url.fileUrl}
                                className="inline-flex ms-1 divide-y "
                                alt={url.fileUrl}
                                width={100}
                                height={100}
                              />
                            </Link>

                          }
                          <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                            <button type="button">
                              <svg
                                onClick={() => handleFileRemove(index)}
                                className="w-[18px] h-[18px] red_c dark:text-white"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="m13 7-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                />
                              </svg>
                            </button>
                          </div>

                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className="pe-4">
              <div className="flex max-w-md flex-col gap-5">
                <div className="status">
                  <div className="mb-2 block flex items-center gap-2">
                    <Label
                      htmlFor="oppStatus"
                      className="font-bold text-xs"
                    >
                      Status <span style={{ color: 'red' }}>*</span>
                    </Label>
                    <Tooltip
                      content="Select Draft if you want to continue editing this opportunity after you select Save. Or, select Publish if you would like to publish the opportunity when you select Save."
                      className="tier_tooltip"
                    >
                      <svg
                        className="-ml-1 w-[16px] h-[16px] text-gray-600 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                          clip-rule="evenodd"
                        />
                      </svg>{" "}
                    </Tooltip>
                  </div>
                  <Select
                    id="oppStatus"
                    {...register("oppStatus", {
                      required: {
                        value: true,
                        message: "Status is required",
                      },
                    })}
                  >
                    <option value={""}>Select</option>
                    <option value={'draft'}>Draft</option>
                    <option value={'publish'}>Publish</option>
                  </Select>
                  <p className="text-red-600 text-xs">
                    {typeof errors?.oppStatus?.message === "string" &&
                      errors?.oppStatus?.message}
                  </p>
                </div>
                <div className="status">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="industryId"
                      className="font-bold text-xs"
                    >
                      Industry Type <span style={{ color: 'red' }}>*</span>
                    </Label>
                  </div>
                  <Select
                    id="industryId"
                    {...register("industryId", {
                      required: {
                        value: true,
                        message: "industry Type is required",
                      },
                    })}
                  >
                    <option value={""}>Select</option>
                    {industryTypes &&
                      industryTypes.map((industries) => (
                        <option key={`option_${industries.id}`} value={industries.id}>{industries.name}</option>
                      ))}
                  </Select>
                  <p className="text-red-600 text-xs">
                    {typeof errors?.industryId?.message === "string" &&
                      errors?.industryId?.message}
                  </p>
                </div>
                  {watchIndustryId && watchIndustryId === "1" &&
                    <div className="status">
                      <div className="mb-2 block">
                        <Label
                          htmlFor="Platforms"
                          className="font-bold text-xs"
                        >
                          Platforms <span style={{ color: 'red' }}>*</span>
                        </Label></div>
                      <Multiselect
                        className="block w-full"
                        emptyRecordMsg="-"
                        options={platforms}
                        displayValue="name"
                        onSelect={(e) => onAddOrRemovePlatforms(e)}
                        onRemove={(e) => onAddOrRemovePlatforms(e)}

                        {...register("platforms", {
                          required: {
                            value: true,
                            message: "Platforms are required",
                          },
                        })}
                      />
                      <p className="text-red-600 text-xs">
                        {typeof errors?.platforms?.message === "string" &&
                          errors?.platforms?.message}
                      </p>
                    </div>
                    // :
                    // <div className="status">
                    //   <div className="mb-2 block">
                    //     <Label
                    //       htmlFor="Platforms"
                    //       className="font-bold text-xs"
                    //     >
                    //       Platforms
                    //     </Label></div>
                    //   <Multiselect
                    //     className="block w-full"
                    //     emptyRecordMsg="-"
                    //     options={platforms}
                    //     displayValue="name"
                    //     onSelect={(e) => onAddOrRemovePlatforms(e)}
                    //     onRemove={(e) => onAddOrRemovePlatforms(e)}
                    //   />
                    // </div>
                  }
                <div className="status">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"
                      className="font-bold text-xs"
                    >
                      Tools & Technologies
                    </Label>
                  </div>
                  <TextInput
                    autoComplete="off"
                    id="technologies"
                    className="focus:border-blue-300"
                    placeholder="Tool or tech capabilities required"
                    type="text"
                    sizing="md"
                    {...register("technologies")}
                  />
                </div>
                <div className="status">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"

                      className="font-bold text-xs"
                    >
                      Approximate Start Date <span style={{ color: 'red' }}>*</span>
                    </Label>
                  </div>
                  <fieldset className="flex max-w-md flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Radio
                        id="startdatecondtion1"
                        {...register("approxStartDateCondition", {
                          required: {
                            value: true,
                            message: "Approximate Start Date is required",
                          },
                        })}
                        value="1"
                      />
                      <Label htmlFor="startdatecondtion1">
                        To Be Determined
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio
                        id="startdatecondtion2"
                        {...register("approxStartDateCondition", {
                          required: {
                            value: true,
                            message: "Approximate Start Date is required",
                          },
                        })}
                        value="2"
                      />
                      <Label htmlFor="startdatecondtion2">Ongoing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio
                        id="startdatecondtion3"
                        {...register("approxStartDateCondition", {
                          required: {
                            value: true,
                            message: "Approximate Start Date is required",
                          },
                        })}
                        value="3"
                      />
                      <Label htmlFor="startdatecondtion3">
                        Specific Start date
                      </Label>
                    </div>
                    {/* <p className="text-red-600 text-xs">
                      {typeof errors.approxStartDateCondition?.message === "string" &&
                        errors?.approxStartDateCondition.message}
                    </p> */}
                  </fieldset>
                  {watchStartDate && watchStartDate === "3" && (
                    <div className="pl-6 pt-4">
                      {/* <TextInput
                        id="approxStartDate"
                        className="focus:border-blue-300"
                        type="text"
                        sizing="md"
                        {...register("approxStartDate", {
                          validate: (value) => {
                            if (watchStartDate == "3" && !value) {
                              return "Specific start date is required";
                            }
                            return true;
                          },
                        })}
                      /> */}

                      <DatePicker
                        autoComplete="off"
                        className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"

                        selected={startDate}
                        {...register("approxStartDate", {
                          required: "Startdate is required",
                        })}
                        dateFormat="dd/MM/yyyy"
                        onChange={(date: Date) => {
                          handleDateChange(date, 'start');
                        }}
                      />
                      <p className="text-red-600 text-xs">
                        <p className="text-red-600 text-xs">
                          {typeof errors.approxStartDate?.message === "string" &&
                            errors?.approxStartDate.message}
                        </p>
                      </p>
                    </div>
                  )}
                </div>
                <div className="status">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"
                      className="font-bold text-xs"
                    >
                      Approximate End Date <span style={{ color: 'red' }}>*</span>
                    </Label>
                  </div>
                  <fieldset className="flex max-w-md flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Radio
                        id="tobedeterminedend"
                        {...register("approxEndDateCondition", {
                          required: {
                            value: true,
                            message: "End date condtion is required",
                          },
                        })}
                        value="1"
                      // defaultChecked
                      />
                      <Label htmlFor="tobedeterminedend">
                        To Be Determined
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio
                        id="Ongoing"
                        {...register("approxEndDateCondition", {
                          required: {
                            value: true,
                            message: "End date condtion is required",
                          },
                        })}
                        value="2"
                      />
                      <Label htmlFor="Ongoing">Ongoing</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio
                        id="Specificend"
                        {...register("approxEndDateCondition", {
                          required: {
                            value: true,
                            message: "End date condtion is required",
                          },
                        })}
                        value="3"
                      />
                      <Label htmlFor="Specificend">Specific end date</Label>
                    </div>
                    {/* <p className="text-red-600 text-xs">
                      {typeof errors.approxEndDateCondition?.message === "string" &&
                        errors?.approxEndDateCondition.message}
                    </p> */}
                  </fieldset>
                  {watchEndDate && watchEndDate == "3" && (
                    <div className="pl-6 pt-4">
                      <DatePicker
                        autoComplete="off"
                        className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                        selected={endDate}
                        {...register("approxEndDate", {
                          required: "End Date is required",
                        })}
                        onChange={(date: Date) => {
                          handleDateChange(date, 'approxEndDate');
                        }}


                      />
                      <p className="text-red-600 text-xs">

                        {typeof errors.approxEndDate?.message === "string" &&
                          errors?.approxEndDate.message}
                      </p>

                    </div>
                  )}
                </div>
                <div className="Estimated">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"

                      className="font-bold text-xs"
                    >
                      Estimated Number of Staff Months <span style={{ color: 'red' }}>*</span>
                    </Label>
                  </div>
                  <TextInput
                    autoComplete="off"
                    id="staffMonths"
                    className="focus:border-blue-300"
                    type="number"
                    sizing="md"
                    min={1}
                    max={1000}
                    onKeyUp={(e) => inputlengthValidation(e)}
                    {...register("staffMonths", {
                      required: {
                        value: true,
                        message: "Staff Months is required",
                      },
                      pattern: {
                        value: /^[0-9]*$/,
                        message: "Please enter only numeric values",
                      },
                      validate: value => {
                        const parsedValue = parseInt(value);
                        return (parsedValue >= 1 && parsedValue <= 1000) || "Estimated Staff months must be between 1 and 1000";
                      }
                    })}
                  />
                  {/* <p className="text-red-600 text-xs">
                    {typeof errors?.staffMonths?.message === "string" &&
                      errors?.staffMonths?.message}
                  </p> */}
                </div>
                <div className="Expiry Date">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="expiryDate"

                      className="font-bold text-xs"
                    >
                      Expiry Date of Post <span style={{ color: 'red' }}> *</span>
                    </Label>
                  </div>
                  <DatePicker
                    className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                    selected={oppExpiryDate}
                    autoComplete="off"
                    closeOnScroll={true}
                    {...register("expiryDate",
                      {
                        required: {
                          value: true,
                          message: 'Expiry date of post is required'
                        }
                      })}
                    onChange={(date: Date) => {
                      handleDateChange(date, 'expiryDate');
                    }}
                  />
                  {/* <p className="text-red-600 text-xs">

                    {typeof errors.expiryDate?.message === "string" &&
                      errors?.expiryDate.message}
                  </p> */}
                </div>
                
                {/* <div className="companyName flex items-center gap-2">
                  <Checkbox
                    id="showCompanyName"
                    {...register("showCompanyName")}
                  />
                  <Label htmlFor="showCompanyName" className="flex">
                    Show Company Name
                  </Label><Tooltip
                    content="Your company name is displayed by default. Unselect this if you prefer to remain anonymous."
                    className="tier_tooltip"
                  >
                    <svg
                      className="-ml-1 w-[16px] h-[16px] text-gray-600 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9-3a1.5 1.5 0 0 1 2.5 1.1 1.4 1.4 0 0 1-1.5 1.5 1 1 0 0 0-1 1V14a1 1 0 1 0 2 0v-.5a3.4 3.4 0 0 0 2.5-3.3 3.5 3.5 0 0 0-7-.3 1 1 0 0 0 2 .1c0-.4.2-.7.5-1Zm1 7a1 1 0 1 0 0 2 1 1 0 1 0 0-2Z"
                        clip-rule="evenodd"
                      />
                    </svg>{" "}
                  </Tooltip>
                </div>
                {watchShowCompanyName && (
                  <TextInput
                    autoComplete="off"
                    id="showcompanyname"
                    className="focus:border-blue-300"
                    type="text"
                    sizing="md"
                    readOnly
                    {...register("showcompanyname")}
                  />
                )} */}

                {/* <div className="contactPerson flex items-center gap-2">
                  <Checkbox
                    id="contactPerson"
                    {...register("showContactPerson")}
                  />
                  <Label htmlFor="contactPerson" className="flex">
                    Show Contact Person
                  </Label>
                </div>
                {watchShowPersonName && (
                  <TextInput
                    id="contactPersonName"
                    className="focus:border-blue-300"
                    type="text"
                    sizing="md"
                    {...register("contactPersonName", {
                      required: {
                        value: true,
                        message: "Contact person name is required",
                      },
                    })}
                  />

                )} */}
                <p className="text-red-600 text-xs">
                  {typeof errors?.contactPersonName?.message === "string" &&
                    errors?.contactPersonName?.message}
                </p>
                {/* <div className="contactPerson flex items-center gap-2">
                  <Checkbox
                    id="emailnotification"
                    {...register("isReceiveEmailEnabled")}
                  />
                  <Label htmlFor="emailnotification" className="flex">
                    Receive Email Notifications
                  </Label>
                </div> */}
              </div>
            </div>
            <div className="third_section pl-6">
              <h3 className="text-sm font-bold pb-3">Services  <span style={{ color: 'red' }}>*</span></h3>
              <div
                id="dropdownDefaultCheckbox"
                className="z-10  bg-white  divide-gray-100 rounded-lg dark:bg-gray-700 dark:divide-gray-600"
              >

                {/* {services.map((service: service, index) => (
                    <li key={`opp_service_${index}`}>
                      <div className="flex items-center">
                        <input
                          key={service.id}
                          id={`checkbox-item-${service.serviceName}`}
                          type="checkbox"
                          checked={selectedServices.includes(
                            service.serviceName,
                          )}
                          value={service.id}
                          {...register("servicesselected", {
                            validate: {
                              validate: (value) => {
                                if (value.length > 3 || value.length <= 0) {
                                  return "Select Min of 1  service Max of 3  services";
                                }
                                return true;
                              },
                            },
                          })}
                          onChange={() =>
                            handleServicesCheckboxChange([service.serviceName])
                          }
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                        />
                        <label
                          htmlFor={`checkbox-item-${service.serviceName}`}
                          className="ms-2 text-sm  default_text_color "
                        >
                          {service.serviceName}
                        </label>
                      </div>
                    </li>
                  ))} */}

                <ul className="pt-0 space_y_3  mt-3 text-sm text-gray-700">
                  {serviceAndCapabilities.map(
                    (service: ServiceCapabilities, sIndex) => (
                      <li key={`main_services_` + sIndex} className={`pl-3 relative ul_before_border ${service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg')))}`}>
                        <div className="flex items-center">

                          <input
                            id={`checkbox-service-${service.id}`}
                            type="checkbox"
                            value={service.id}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                            {...register(`servicesselected`,
                              {
                                validate: (value) => {
                                  if (value.length > 10 || value.length <= 0) {
                                    return "Select 1-10 Services that represent the opportunity";
                                  }
                                  return true;
                                },
                              })}
                            onChange={() =>
                              handleServicesCheckboxChange([
                                service.id.toString()
                              ])
                            }
                            checked={selectedServices.includes(
                              service.id.toString(),
                            )}
                          />
                          <label
                            htmlFor={`checkbox-service-${service.id}`}
                            className="ms-2 text-sm  default_text_color cursor-pointer"
                          >
                            {service.serviceName}
                          </label>
                        </div>
                        {
                          <>
                            {selectedServices.includes(
                              service.id.toString(),
                            ) ? service.capabilities.map((capability: { id: number; capabilityName: string; isChecked: boolean; }, cIndex) => (
                              <ul className="ps-8 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200" 
                              >
                                <li key={capability.id}>
                                  <div className="flex items-center">
                                    <input
                                      key={`checkbox-${service.id}-${capability.id}-${selectedCapabilities.length}`} // Forces fresh render

                                      id={`checkbox-capability-${capability.id}`}
                                      type="checkbox"
                                      value={capability.id}
                                      //   name={capability.capabilityName}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                      {...register("capabilitiesSelected")}
                                      checked={selectedCapabilities.length > 0 && selectedCapabilities.includes(
                                        capability.id.toString()
                                      )}

                                      onChange={() =>
                                        handleCapabilitiesCheckboxChange([
                                          capability.id.toString()
                                        ])
                                      }
                                    />
                                    <label
                                      htmlFor={`checkbox-capability-${capability.id}`}
                                      className="ms-2 text-sm  default_text_color cursor-pointer"
                                    >
                                      {capability.capabilityName}
                                    </label>
                                  </div>
                                </li>
                              </ul>
                            ),
                            )
                              : ""}
                          </>
                        }
                      </li>
                    ),
                  )}
                </ul>

                <p className="text-red-600 text-xs pt-4">
                  {errors.servicesselected && errors.servicesselected?.message}
                </p>
              </div>
            </div>
          </div>

          <div className="devider py-6">
            <hr />

          </div>
          <div className="flex justify-end ">
            <button
              type="button"
              onClick={() => { router.push('/my-opportunities') }}
              className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-cyan-700 border border-transparent enabled:hover:bg-cyan-800 focus:ring-cyan-300 dark:bg-cyan-600 dark:enabled:hover:bg-cyan-700 dark:focus:ring-cyan-800 rounded-lg focus:ring-2 button_cancel hover:border-gray-100 h-[40px] px-4 mr-2"
            >
              Cancel
            </button>

            {isLoading ?
              <div className="flex justify-center items-center">
                <Spinner />
              </div>
              :

              <button
                type="submit"
                className="group flex items-center justify-center p-0.5 text-center font-medium relative focus:z-10 focus:outline-none text-white bg-cyan-700 border border-transparent enabled:hover:bg-cyan-800 focus:ring-cyan-300 dark:bg-cyan-600 dark:enabled:hover:bg-cyan-700 dark:focus:ring-cyan-800 rounded-lg focus:ring-2 button_blue h-[40px] px-8"
                disabled={buttonLoader}
              >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
              </button>
            }
          </div>
        </div>
      </form>
    </div>
  );
};
export default MyOpportunitynotanonymous;

export type opportunityForm = {
  companyId?: number,
  name: string;
  description: string | null;
  oppStatus: string;
  industryId: string;
  platforms: string[];
  technologies: string;
  approxEndDateCondition: string;
  approxStartDateCondition: string;
  showCompanyName: boolean;
  showContactPerson: boolean;
  approxStartDate: string | null;
  approxEndDate: string | null;
  staffMonths: string;
  showcompanyname: string | boolean | null;
  contactPersonName: string | null;
  isReceiveEmailEnabled: boolean;
  servicesselected: string[];
  capabilitiesSelected: string[];
  inputfiles: string[];
  dbInputFiles: { type: string, fileUrl: string }[],
  combinedservices: { serviceId: number, capabilityId: string | null }[],
  uniqueFormId?: string;
};

type indstryDto = {
  id: number;
  name: string;
};
type platformsDto = {
  id: number;
  name: string;
};
