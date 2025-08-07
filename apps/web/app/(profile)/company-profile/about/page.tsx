"use client";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import { Button, Textarea, Label, FileInput, Tooltip, Modal } from "flowbite-react";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Company } from "@/types/companies.type";
import useFormUpdate from "@/hooks/useFormUpdate";
import { toast } from "react-toastify";
import MobileSideMenus from "@/components/mobileSideMenus";
import { isValidJSON } from "@/constants/serviceColors";
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";
import ButtonSpinner from "@/components/ui/buttonspinner";
import Link from "next/link";
import { formatDate } from "@/services/common-methods";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { useProfileStatusContext } from "@/context/profilePercentage";

const Companyabout = () => {
  const { user } = useUserContext();
  const [canRender, setCanRender] = useState(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [loader, setLoader] = useState<boolean>(false);
  const [validateRatecard, setValidateRatecard] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [profileFilePath, setProfileFilePath] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileDate, setFileDate] = useState<string>('');
  const [fileFullName, setFileFullName] = useState<string>('');
  const [deletedFilePaths, setDeletedFilePaths] = useState<string[]>([]);
  const [removeModel, setRemoveModel] = useState<boolean>(false);

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

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
      label: PATH.ABOUT.name,
      path: PATH.ABOUT.path,
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    reset,
    getValues,
  } = useForm();
  const { success, submitForm } = useFormUpdate<any>({
    url: getEndpointUrl(ENDPOINTS.updateCompanyAbout(user.companyId)),
  });

  const fetchInformations = useCallback(async () => {
    if (user) {
      await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getCompanyAboutById(user.companyId))}`,
      )
        .then((result: Company) => {
          if (isValidJSON(result.about)) {
            setValue("about", JSON.parse(result.about));
            setFilePath(result?.profilePdfPath);
            if (result.profilePdfName) {
              const fileName = result.profilePdfName.split("---");
              setFileName(fileName[0]);
              setFileDate(fileName[1]);
              setFileFullName(result.profilePdfName);
            }
          } else {
            setValue("about", result.about);
            setFilePath(result?.profilePdfPath);
            if (result.profilePdfName) {
              const fileName = result.profilePdfName.split("---");
              setFileName(fileName[0]);
              setFileDate(fileName[1]);
              setFileFullName(result.profilePdfName);
            }
          }
          if(result?.profilePdfPath){
            const fileName = result.profilePdfPath.split("rateCard/");
            setProfileFilePath("user_images/user_"+user.companyId+"/rateCard/"+fileName[1]);
          }
          setCanRender(true);
        })
        .catch((err) => {
          setCanRender(true);
          console.log(err);
        });
    }
  }, [setValue, user]);

  useEffect(() => {
    fetchInformations();
    if (success) {
      toast.success("Your changes have been saved 👍");
    }
  }, [success]);

  const onSubmit = (async (data: { about: string, profilePdf: string, profilePdfName: string, deletedFilePath: string }) => {
    setButtonLoader(true);
    const formattedtext = JSON.stringify(data.about);
    const response = await submitForm(sanitizeData({ about: formattedtext, profilePdf: profileFilePath, profilePdfName: fileFullName, deletedFilePath: deletedFilePaths }));
    if (response) {
      reset(getValues());
      setButtonLoader(false);
      if (profilepercentage && !profilepercentage.profileCompleted) {
        setProfilepercentage({
          generalInfoProfilePerc: profilepercentage.generalInfoProfilePerc,
          aboutProfilePerc: 16,
          ourWorkAlbumsProfilePerc: profilepercentage.ourWorkAlbumsProfilePerc,
          ourWorkProjectProfilePerc: profilepercentage.ourWorkProjectProfilePerc,
          servicesProfilePerc: profilepercentage.servicesProfilePerc,
          certificationsProfilePerc: profilepercentage.certificationsProfilePerc,
          contactsProfilePerc: profilepercentage.contactsProfilePerc,
          profileCompleted: profilepercentage.profileCompleted,
          bannerAssetId: profilepercentage.bannerAssetId,
        });
      };
    } else {
      setButtonLoader(false);
    }

  }) as SubmitHandler<FieldValues>;

  const deleteFile = async () => {
    setLoader(true);
    setDeletedFilePaths((deleteFile) => [
      ...deleteFile,
      profileFilePath,
    ]);
    setFileName('');
    setFileDate('');
    setProfileFilePath('');
    setFileFullName('');
    setLoader(false);
    setRemoveModel(false);
    setValidateRatecard('');
  }

  const { submitForm: submitUploadRateCard } = useFormUpdate({
    url: getEndpointUrl(ENDPOINTS.uploadRateCard),
  });

  const filehandle = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDeletedFilePaths((deleteFile) => [
      ...deleteFile,
      profileFilePath,
    ]);
    const file: any = e.target.files;
    setValidateRatecard('');
    if (file && file.length > 0) {
      uploadPdfFile(file);
    }
    
  }

  const uploadPdfFile = async(file: File[]) => {
    const fileNameParts = file[0].name.split(".");
    const fileExtension =
      fileNameParts[fileNameParts.length - 1].toLowerCase();
    if (fileNameParts.length > 2) {
      setValidateRatecard("Files with multiple extensions (or periods) in the file name are not allowed");
      return;
    }
    if ((fileExtension !== "pdf")) {
      setValidateRatecard("Only a PDF file can be uploaded.");
      return;
    }
    if (file[0].size > 25 * 1024 * 1024) {
      setValidateRatecard("PDF file size must be below 25 Mb");
      return;
    }
    const uploadRateCard = new FormData();
    uploadRateCard.append("companyId", (user.companyId).toString());
    uploadRateCard.append("userId", ((user && user.companyId) ? user.companyId : 0).toString());
    uploadRateCard.append("file", file[0]);
    uploadRateCard.append("filaName", file[0].name + '---' + formatDate(new Date()).toString());
    uploadRateCard.append("pdfType", "companyPdf");
    setLoader(true);
    const res = await submitUploadRateCard(uploadRateCard);
    if (res && res.data.singedUrl) {
      setFileFullName(res.data.fileName);
      const fileName = res.data.fileName.split("---");
      setFileName(fileName[0]);
      setFileDate(fileName[1]);
      setFilePath(res.data.singedUrl);
      setProfileFilePath(res.data.fileUrl);
      setLoader(false);
    }
    else {
      console.log(res);
    }
    setLoader(false);
  }

  const handleDragLeave = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragOver = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDragEnter = (e: any) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const multipleFiles = e.dataTransfer.files;
        if (multipleFiles.length > 0) {
          uploadPdfFile(multipleFiles);
        }
  };
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
                <h1 className="font-bold  header-font">About</h1>
              </div>
            </div>
            <div className="py-6">
              <hr />
            </div>
            <div className="lg:w-[550px] ">
              <form onSubmit={handleSubmit(onSubmit)}>
                {user && user.userRoles[0] && user.userRoles[0].roleCode == "service_provider" && user.isPaidUser ?
                  <>
                    <div className="firstname pt-0">
                      <div className="mb-2 block">
                        <Label
                          htmlFor="base"
                          value="Briefly describe your company here. "
                          className="font-bold text-xs"
                        />
                        <span className="text-red-600 font-bold text-xs">*</span>
                      </div>
                      <Textarea
                        id="about"
                        placeholder=""
                        rows={8}
                        {...register("about", {
                          required: {
                            value: true,
                            message: "This field is required",
                          },
                        })}
                      />
                    </div>
                    <p className="text-red-600 text-xs pt-2 ">
                      {typeof errors?.about?.message === "string" &&
                        errors?.about?.message}
                    </p>
                    <div className=" pt-4">
                      <div className="">
                        <div className="mb-2 block">
                          <div className="flex items-center">
                          <Label
                            htmlFor="base"
                            value="Upload your company profile PDF here"
                            className="font-bold text-xs" />
                          <Tooltip className="tier_tooltip" content="This PDF may contain non-sensitive information like company history, key services, project examples, client testimonials, contact info, etc.">
                            <svg className="ms-1 -mt-0.5 w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.008-3.018a1.502 1.502 0 0 1 2.522 1.159v.024a1.44 1.44 0 0 1-1.493 1.418 1 1 0 0 0-1.037.999V14a1 1 0 1 0 2 0v-.539a3.44 3.44 0 0 0 2.529-3.256 3.502 3.502 0 0 0-7-.255 1 1 0 0 0 2 .076c.014-.398.187-.774.48-1.044Zm.982 7.026a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2h-.01Z" clip-rule="evenodd" />
                            </svg>
                          </Tooltip>
                          </div>
                        </div>
                        <div className="flex w-full items-center justify-center">
                          <Label
                            htmlFor="profilePdf"
                            className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                            onDragEnter={handleDragEnter}
                            onSubmit={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                          >
                            <div className="flex flex-col items-center justify-center pb-6 pt-5">
                              <svg
                                className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 20 16"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                />
                              </svg>
                              
                              {loader ?
                              <>
                                <div className="">
                                  <Spinner />
                                </div>
                                <div>
                                <p className="text-xs text-gray-600">Please wait upload inprogress...</p>
                                </div>
                              </>
                              :
                              <>
                              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Upload Company Profile PDF under 25 Mb</p>
                              <FileInput className="hidden" id="profilePdf"
                              accept=".pdf"
                              onChange={filehandle} />
                              </>
                            }
                            </div>
                          </Label>
                        </div>
                      </div>
                      
                    </div>
                    {validateRatecard && validateRatecard != '' &&
                      <p className="text-red-600 text-sm pt-2">{validateRatecard}</p>
                    }
                    {fileName && fileName != "" &&
                    <div id="alert-5" className="mt-4 flex items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800" role="alert">
                    <svg id="svg5" height="40" viewBox="0 0 8.4666662 8.4666662" width="40" xmlns="http://www.w3.org/2000/svg" ><linearGradient id="linearGradient2739"><stop id="stop2737" offset="0" stop-color="#0ecc24" /></linearGradient><linearGradient id="linearGradient2667"><stop id="stop2665" offset="0" /></linearGradient><g id="layer1"><path id="path7475-3" d="m7.0042201 2.7572899.0000021 4.2424495a.96438989.93754153 0 0 1 -.9643902.9375426h-3.6132311a.96439044.93754206 0 0 1 -.9643901-.9375426v-5.5330345a.96438716.93753887 0 0 1 .9643901-.93753836l2.297092.00000726z" fill="#f00" paint-order="normal" /><path id="path6360-9" d="m4.8239089.62708677c-.1849285.47603273-.6129065 1.20584653-.1813568 1.81929103.112127.1701454.7950977.4331655 1.223737.5849395.273591.096879.4986515.4022643.4986515.6930783l.035883 2.831766c0 .5177899-.4314791.9373166-.9640968.9373166h-3.6132202c-.080357 0-.1583555-.00985-.2329895-.02785.1716193.2915406.490562.4715459.8360859.4718713h3.6132197c.5328374.0001307.9648089-.4198489.9646327-.9378513v-4.2425604z" fill="#d40000" paint-order="normal" /><path id="path6696-7" d="m1.9608657 1.1051841a.13711579.13711579 0 0 1 .1376559.1356314v.3846264a.13711579.13711579 0 0 1 -.1376559.1376558.13711579.13711579 0 0 1 -.1356314-.1376558v-.3846264a.13711579.13711579 0 0 1 .1356314-.1356314z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /><path id="path6702-2" d="m1.9608657 1.8541935a.13711527.13711527 0 0 1 .1376559.1376558v.056681a.13711527.13711527 0 0 1 -.1376559.1356322.13711527.13711527 0 0 1 -.1356314-.1356314v-.0566818a.13711527.13711527 0 0 1 .1356314-.1376558z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /><path id="path7319-7" d="m4.7238093.52928308-.2996833 1.17118412a.5954101.58172648 0 0 0 .4797478.7149008l2.1004635.3420318z" fill="#ff8080" /><path id="path395410" d="m4.2389522 3.4770532c-.1596197.0022802-.2706822.1038085-.3245789.1644319-.1249868.1405849-.1307061.3332855-.0889113.5200764.041794.1867911.1312974.3856206.2404886.5870277.012255.022607.025827.037874.038564.060523-.2195704.399596-.5216019.8346101-.785203 1.181554-.3422389.081358-.6698027.1212697-.8666157.3427899-.1647918.1857217-.1762467.4678692 0 .632019.0766693.0673117.1839297.1013949.2774484.1028407.0878251-.0010147.1627792-.0260163.2228135-.0626658.2300868-.1404682.3799181-.438773.5457859-.7835963l1.3449145-.3133313c.2017715.2501195.4117498.495277.6620128.5725662.1160352.0358349.2385601.0315905.3481462-.0080326.1095863-.0396272.2120056-.1180247.2586993-.2388817.0814939-.2195685-.0083738-.462814-.2185322-.5726238-.1631532-.0880252-.3664745-.1030172-.5929198-.0931958-.1157128.0050184-.2379606.0174-.3620718.0353501-.1466937-.2235349-.344119-.5189603-.516327-.8066274.1010179-.2004997.1887551-.3978521.2265627-.5789937.0422106-.2022382.0337777-.4014367-.0808773-.554891-.0822492-.1299817-.2077411-.1854922-.3293989-.1863395zm.1103288.3465383c.049899.06438.066838.1742784.032672.3379695-.018978.0909616-.0832566.2130543-.1296106.3240439-.066501-.1370123-.1361836-.2774693-.160147-.3845675-.0321603-.1437321-.0100622-.2234184.0267815-.2774456.025882-.042274.060968-.068184.1112749-.071085.052989-.00296.08813.031222.1190292.071085zm-.0830179 1.2388649c.1288908.2053467.2660841.4189679.3781449.5923836l-.8998235.2185272c.1814972-.2753264.3719312-.5562629.5216786-.8109108zm1.4964968.8398354c.098941.053381.1286841.1379554.09266.2329899-.033878.087573-.1969596.1111282-.2688755.08516-.09765-.030156-.25505-.2111728-.3990289-.360463.039821-.00987.088239-.01658.125868-.018212.1447831-.00637.3142848-.00296.4493764.060525zm-2.688758.4675866c-.0952233.1548031-.2024723.365063-.2651266.4033137-.0619506.0426085-.1334721.0267289-.1697889-.010176-.0501981-.0483999-.0588454-.1576579.0203531-.2469157.0807112-.0776475.1960246-.1101204.4145624-.146222z" fill="#fff" stroke-linecap="round" stroke-linejoin="round" /></g></svg>
                    <span className="sr-only">Info</span>
                    <div className="ms-3 text-sm font-medium text-gray-800 dark:text-gray-300">
                      {fileName}
                    </div>
                    <div className="ms-auto">
                      <button type="button" className=" bg-gray-50 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white" data-dismiss-target="#alert-5" aria-label="Close">
                      <Link prefetch={false} href={filePath} target="__blank" className="items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                          <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                        </Link>
                      </button>
                      <button type="button" className="ms-1 bg-gray-50 text-gray-500 rounded-lg focus:ring-2 focus:ring-gray-400 p-1.5 hover:bg-gray-200 inline-flex items-center justify-center h-8 w-8 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white" data-dismiss-target="#alert-5" aria-label="Close"  onClick={()=>setRemoveModel(true)}>
                      <Link prefetch={false} href={''} >
                        <svg className="w-6 h-6 text-red-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                        </svg>
                        </Link>
                      </button>
                    </div>
                  </div>
                  }

                  </>
                  : (user && user.userRoles[0] && user.userRoles[0].roleCode == "service_provider" && !user.isPaidUser ?
                    <><Textarea
                      id="about"
                      placeholder=""
                      rows={8}
                      {...register("about", {
                        required: {
                          value: true,
                          message: "This field is required",
                        },
                        validate: {
                          noEmail: (value) =>
                            !/\S+@\S+\.\S+/.test(value) ||
                            "Email address entry is not allowed",
                        },
                      })}
                    />
                      <p className="text-red-600 text-xs pt-2 ">
                        {typeof errors?.about?.message === "string" &&
                          errors?.about?.message}
                      </p>
                    </>
                    : ''
                  )

                }



                <div className="flex flex-wrap justify-end pb-6 pt-6">
                  <div className="left_btn inline-flex">
                    <Button
                      type="submit"
                      className="bg-white button_blue hover:bg-white h-[40px] px-4"
                      disabled={buttonLoader}
                    >
                      {buttonLoader ? <ButtonSpinner></ButtonSpinner> :
                        'Save'}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
      <Modal
                show={removeModel}
                onClose={() => { setRemoveModel(false);}}
                size="sm"
            >
                <Modal.Header className="modal_header">
                    <b>Are you sure?</b>
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div className="">
                            <p className="text-sm default_text_color font-normal leading-6">
                                You are about to delete
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button
                        color="gray"
                        className="h-[40px] button_cancel"
                        onClick={() => {
                            setRemoveModel(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-[40px] button_blue"
                        onClick= {deleteFile}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>

    </>
  );
};
export default Companyabout;
