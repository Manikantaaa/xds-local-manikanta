"use client";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { PortfolioProject } from "@/types/companies.type";
import {
  Button,
  Label,
  Modal,
  TextInput,
  Select,
  Textarea,
} from "flowbite-react";
import { ChangeEvent, SyntheticEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authFetcher } from "@/hooks/fetcher";
import Multiselect from "multiselect-react-dropdown";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import commonPatchData from "@/hooks/commonPatchData";
import { FiAlertTriangle } from "react-icons/fi";
import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import Link from "next/link";
import { redirect } from "next/navigation";
import Spinner from "@/components/spinner";
import { isValidJSON } from "@/constants/serviceColors";
import { sanitizeData } from "@/services/sanitizedata";
import { deletes3FileHook } from "@/hooks/deletes3File";
import UniqueFormId from "@/hooks/useRandomId";
import useGetThumbnails from "@/hooks/useGetThumbnails";
import { videoFileTypes } from "@/components/ProjectComponent";
import ButtonSpinner from "@/components/ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";

interface PortfolioProjectDto {
  project: {
    name: string;
    projectCDate: Date;
    platforms: number[];
    description: string;
    fileUrls: { type: string; fileUrl: string }[];
  };
  id?: number;
  UniqueFormId?: string;
}

interface TheProject {
  fileName: any;
  id: number;
  name: string;
  projectCDate: Date;
  platforms: number[];
  description: string;
  fileUrls: { type: string; fileUrl: string, thumbnail: string }[];
  deletdFilePaths?: string[]
  testimonial: {
    name: string;
    title: string;
    companyname: string;
    message: string;
  }
}

const UpdateProject = (params: { params: { projectId: number } }) => {
  const { user } = useUserContext();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [platforms, setPlatforms] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [selectedPlatforms, setSelectedPlatforms] = useState<
    { id: number; name: string }[]
  >([]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [companyId, setCompanyId] = useState<number>();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<videoFileTypes[]>([]);
  const [portfolioFileUrls, setportfolioFileUrls] = useState<
    { type: string; fileUrl: string, thumbnail: string }[]
  >([]);
  const [embededUrl, setEmbededUrl] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isValidEmbed, setIsValidEmbed] = useState(true);
  const [canEmbedded, setcanEmbedded] = useState(true);
  const [fileSize, setFileSize] = useState<boolean>(false);
  const [fileValidation, setFileValidation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [canRender, setCanRender] = useState(false);
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_' + new Date().getTime());
  const [isFileuploading, setIsFileuploading] = useState<boolean>(false);
  const [deletedFilePaths, setDeletedFilePaths] = useState<string[]>([]);
  // const { handleDelete, response } = deletes3FileHook();
  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  //unique form Id
  useEffect(() => {
    if (user) {
      const formId = UniqueFormId(user?.id);
      setUniqueFormId(formId);
    }

  }, []);

  // useEffect(() => {
  //   if (deletedFilePath) {
  //     try {
  //       const deletdfileurl = deletedFilePath;
  //       handleDelete(deletdfileurl);
  //       setDeletedFilePath(undefined);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  // }, [deletedFilePath])

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
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
      label: PATH.PROJECTS.name,
      path: PATH.PROJECTS.path,
    },
    {
      label: "Update Project",
      path: "Update Project",
    },
  ];
  useEffect(() => {
    fetchInformations();
    fetchPlatforms();
  }, []);

  async function fetchInformations() {
    if (user) {
      await authFetcher(
        `${getEndpointUrl(
          ENDPOINTS.getSinglePortfolioProject(params.params.projectId),
        )}`,
      )
        .then((result) => {
          if (result.success && result.data.length > 0) {
            const projectData = result.data[0];

            const theSingleProject: TheProject = {
              id: projectData.id,
              name: projectData.name,
              projectCDate: projectData.completionDate,
              description: isValidJSON(projectData.description) ? JSON.parse(projectData.description) : projectData.description,
              platforms: [],
              fileUrls: [],
              fileName: [],
              testimonial: {
                name: projectData.testimonial_name,
                companyname: projectData.testimonial_company,
                title: projectData.testimonial_title,
                message: projectData.testimonial_feedback,
              }
            };
            setSelectedDate(new Date(projectData.completionDate));
            const imageUrls: string[] = [];
            const videoUrls: videoFileTypes[] = [];
            if (
              projectData.PlatformsOpt &&
              projectData.PlatformsOpt.length > 0
            ) {
              const platformsarr: { id: number; name: string }[] = [];
              projectData.PlatformsOpt.forEach((platform: any) => {
                theSingleProject.platforms.push(platform.platforms.id);
                platformsarr.push(platform.platforms);
              });
              setSelectedPlatforms(platformsarr);
            }

            if (projectData.FileUploads && projectData.FileUploads.length > 0) {
              projectData.FileUploads.forEach((file: any) => {
                theSingleProject.fileUrls.push({
                  type: file.type,
                  fileUrl: file.fileUrl,
                  thumbnail: file.thumbnail,
                });
              });

              projectData.FileUploads.forEach((file: any) => {
                theSingleProject.fileName.push({
                  type: file.type,
                  fileUrl: file.fileName,
                  thumbnail: file.thumbnail,
                  signedUrl: file.fileUrl,
                });
              });
              theSingleProject.fileUrls.forEach((imageFiles: any) => {
                if (imageFiles.type == "image") {
                  imageUrls.push(imageFiles.fileUrl);
                }
                setPreviewImages(imageUrls);
              });

              theSingleProject.fileName.forEach((videoFiles: any) => {
                if (videoFiles.type == "video") {
                  videoUrls.push({ fileUrl: videoFiles.fileUrl, thumbnail: videoFiles.thumbnail, type: videoFiles.type, signedUrl: videoFiles.signedUrl });
                }

                setVideoFile(videoUrls);
              });
            }
            setportfolioFileUrls(theSingleProject.fileName);
            const project = {
              project: theSingleProject,
            };
            reset(project);
          }
          setCanRender(true);
        })
        .catch((err) => {
          setCanRender(true);
          console.log(err);
        });
    }
  }

  async function fetchPlatforms() {
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getPlatforms)}`)
      .then((result) => {
        setPlatforms(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    getValues,
    formState: { errors, isDirty },
    clearErrors,
    setError,
  } = useForm<{ project: TheProject }>({
    defaultValues: {
      project: {
        name: "",
        projectCDate: new Date(),
        platforms: [],
        description: "",
        fileUrls: [],
        testimonial: {
          name: '',
          title: '',
          companyname: '',
          message: '',

        }
      },
    },
  });
  const watchTestimonialDesc = watch("project.testimonial.message", "");
  const watchTestimonialName = watch("project.testimonial.name", "");
  const watchTestimonialTitle = watch("project.testimonial.title", "");
  const watchTestimonialCompanyName = watch("project.testimonial.companyname", "");
  const { submitForm: saveProject, success } =
    commonPatchData<PortfolioProjectDto>({
      url: getEndpointUrl(
        ENDPOINTS.updateSinglePortfolioProject(params.params.projectId),
      ),
    });

  const onsubmit = (data: { project: TheProject }) => {
    if (data.project.fileUrls.length > 20) {
      alert("Images/Videos Max upload limit reached");
      return;
    }
    data.project.description = JSON.stringify(data.project.description);
    data.project.deletdFilePaths = deletedFilePaths;
    let postData: PortfolioProjectDto = {
      id: user?.companyId,
      project: data.project,
      UniqueFormId: uniqueFormId,
    };
    postData = sanitizeData(postData);
    saveProject(postData)
      .then((result) => {
        if (result && result.data && result.data.success) {
          toast.success("Project successfully updated 👍");
          router.push("/company-profile/our-works?goto=2");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  function handleDateChange(date: Date) {
    setSelectedDate(date);
    register(`project.projectCDate`, {
      required: true,
    });
    setValue("project.projectCDate", date);
  }

  useEffect(() => {
    if (portfolioFileUrls) {
      setValue(`project.fileUrls`, portfolioFileUrls);
      if (errors.project && errors.project.fileUrls) {
        clearErrors(`project.platforms`);
      }
    }
  }, [portfolioFileUrls]);

  function onAddOrRemovePlatforms(
    theSelectedPlatforms: { id: number; name: string }[],
  ) {
    const platforms: number[] = [];
    for (const item of theSelectedPlatforms) {
      platforms.push(item.id);
    }
    setValue(`project.platforms`, platforms);
    if (platforms.length > 0) {
      if (errors.project && errors.project.platforms) {
        clearErrors(`project.platforms`);
      }
    } else {
      if (errors.project) {
        setError(`project.platforms`, {
          type: "required",
          message: "Platform is required.",
        });
      }
    }
  }

  // const validateDimensions = (file:File) => {
  //   return new Promise((resolve) => {
  //     const img = new window.Image();
  //     img.src = URL.createObjectURL(file);
  //     img.onload = () => {
  //       URL.revokeObjectURL(img.src); 
  //       const width = img.width;
  //       const aspectRatio = img.width / img.height;
  //       const isSixteenNine = Math.abs(aspectRatio - (16 / 9)) < 0.01; 
  //       const isWidthValid = width >= 1280;
  //       if (!isSixteenNine || !isWidthValid) {
  //         let errorMessage = `Uploading file does not allow `;
  //       if (!isSixteenNine) errorMessage += "aspect ratio is not 16:9 ";
  //       if (!isWidthValid) errorMessage = `Uploading file does not allow width is below 1280 pixels`;
  //       setfileDimension(true);
  //       // alert(errorMessage);
  //       resolve(false);
  //       } else {
  //         resolve(true);
  //       }
  //     };
  //     img.onerror = () => {
  //       // alert("There was an error processing your file: " + file.name);
  //       resolve(false);
  //     };
  //   });
  // };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (isLoading || isFileuploading) {
      alert("Please wait upload inprogress...");
      return;
    }
    setFileSize(false);
    setFileValidation('');
    const files = event.target.files;
    if (files) {
      if (files.length > 20) {
        setFileValidation("Max of 20 images/videos are allowed");
        return;
      }

      let filesExceedSizeLimit = false;
      let filesHaveInvalidExtension = false;
      let allFilesValid = false;
      // for (const file of files) {
      //   const dimension = await validateDimensions(file);
      //   if (!dimension) {
      //     allFilesValid = true;
      //   }
      // }

      Array.from(files).forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          setFileSize(true);
          filesExceedSizeLimit = true;
        }
        const fileNameParts = file.name.split(".");
        const fileExtension =
          fileNameParts[fileNameParts.length - 1].toLowerCase();
        if (fileNameParts.length > 2) {
          setFileValidation("Images with multiple extensions (or periods) in the file name are not allowed");
          filesHaveInvalidExtension = true;
        }
        if (fileExtension !== "png" && fileExtension !== "jpg") {
          setFileValidation("." + fileExtension + " is not allowed");
          filesHaveInvalidExtension = true;
        }
      });

      if (filesExceedSizeLimit || filesHaveInvalidExtension || allFilesValid) {
        return;
      }
      setSelectedFiles(Array.from(files));
      setCompanyId(user?.companyId);
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      handleUpload();
    }
  }, [selectedFiles]);

  const handleRemoveImage = (index: number) => {
    if (isLoading || isFileuploading) {
      alert("Please wait upload inprogress...");
      return;
    }
    setFileSize(false);
    setFileValidation('');
    const updatedImages = [...previewImages];
    updatedImages.splice(index, 1);
    setPreviewImages(updatedImages);
    const deleteImgfromArr = [...portfolioFileUrls];
    const currentDeletedFile = deleteImgfromArr.splice(index, 1);
    const newFilePath = [...deletedFilePaths, currentDeletedFile[0].fileUrl];
    setDeletedFilePaths(newFilePath);
    setportfolioFileUrls(deleteImgfromArr);
  };

  const removeVideoUrl = (index: number) => {
    if (isLoading || isFileuploading) {
      alert("Please wait upload inprogress...");
      return;
    }
    setFileSize(false);
    setFileValidation('');
    const updatedVideo = [...videoFile];
    updatedVideo.splice(index, 1);
    setVideoFile(updatedVideo);
    const deletevideofromAllarr = previewImages.length;
    const deleteVdofromArr = [...portfolioFileUrls];
    deleteVdofromArr.splice(deletevideofromAllarr + index, 1);
    setportfolioFileUrls(deleteVdofromArr);
  };

  const { error: fileerror, submitForm: saveFiles } =
    useCommonPostData<FormData>({
      url: getEndpointUrl(ENDPOINTS.uploadmultipleimages),
    });

  const handleUpload = () => {

    if (portfolioFileUrls && portfolioFileUrls.length + selectedFiles.length > 20) {
      setFileValidation("Max of 20 images/videos are allowed");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    selectedFiles.forEach(async (file: File, index: number) => {
      const fileUrl = URL.createObjectURL(file);
      setPreviewImages((prevImages) => [...prevImages, fileUrl]);
    });
    selectedFiles.forEach(async (file: File, index: number) => {
      const formData = new FormData();
      formData.append(`files`, file);
      formData.append(`formId`, uniqueFormId);



      if (companyId !== undefined) {
        formData.append("companyId", companyId.toString());
      }
      formData.append("existingId", (params && params.params && params.params.projectId) ? params.params.projectId.toString() : '0');
      formData.append("formtype", "ourwork-projects-files");

      await saveFiles(formData)
        .then((response) => {
          console.log(portfolioFileUrls);
          if (response.data) {
            setportfolioFileUrls((portfoliofiles) => [
              ...portfoliofiles,
              { type: "image", thumbnail: response.data.data.thumbnailurl[0], fileUrl: response.data.data.fileurl[0], active: false },
            ]);
          }
          if (index === selectedFiles.length - 1) {
            setIsLoading(false);
          }
        }).catch((err) => {
          setIsLoading(false);
          console.log(err);
        })
      // const xhr = new XMLHttpRequest();
      // xhr.open("POST", getEndpointUrl(ENDPOINTS.uploadmultipleimages), true);
      // const fileUrl = URL.createObjectURL(file);
      // setPreviewImages((prevImages) => [fileUrl, ...prevImages]);
      // xhr.upload.onprogress = function (event) {
      //   if (event.lengthComputable) {
      //     const startTime = new Date().getTime();
      //     const timeout = 1000 * selectedFiles.length;
      //     const intervalId = setInterval(() => {
      //       const currentTime = new Date().getTime();
      //       const elapsedTime = currentTime - startTime;
      //       let percentComplete = (elapsedTime / timeout) * 100;
      //       percentComplete = Math.min(Math.max(percentComplete, 0), 100);
      //       setUploadProgress((prevProgress) => {
      //         const updatedProgress: number[] = prevProgress
      //           ? [...prevProgress]
      //           : [];
      //         updatedProgress[index] = percentComplete;
      //         return updatedProgress;
      //       });
      //       if (percentComplete >= 100) {
      //         clearInterval(intervalId);
      //       }
      //     }, 100);
      //   }
      // };
      // xhr.onload = function () {
      //   if (xhr.status >= 200 && xhr.status < 300) {
      //     console.log(`File ${index + 1} Upload Successful`);
      //     const response = JSON.parse(xhr.response);
      //     setportfolioFileUrls((portfoliofiles) => [
      //       { type: "image", fileUrl: response.data[0] },
      //       ...portfoliofiles,
      //     ]);
      //     setIsLoading(false);
      //   } else {
      //     setIsLoading(false);
      //     console.log(`File ${index + 1} Upload Failed`);
      //   }
      // };
      // xhr.onerror = function () {
      //   setIsLoading(false);
      //   console.error(
      //     `Error during upload of file ${index + 1}:`,
      //     xhr.statusText,
      //   );
      // };
      // xhr.send(formData);
    });
  };

  const { error: videothumberror, success: videothumbsuccess, submitForm: VideoThumbnail } = useCommonPostData<{ youtubeThumb: string, companyId: number, existingId: string, formtype: string }>({
    url: getEndpointUrl(ENDPOINTS.videoThumbnails),
  });

  const onSetUrl = (val: string) => {
    setIsValidEmbed(true);
    setcanEmbedded(true);
    if (val && val != "") {
      const embeddedUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:embed\/|live\/|watch\?v=|v\/|watch\?.+&v=)([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|vimeo\.com\/(?:channels\/[A-Za-z0-9]+\/)?(?:videos?\/)?(\d+))/;
      const isValidEmbeddedUrl = embeddedUrlRegex.test(val);
      if (isValidEmbeddedUrl) {
        setEmbededUrl(val);
      } else {
        setIsValidEmbed(false);
      }
    }
  };

  async function onClickPortfolioAddVideo() {
    if (portfolioFileUrls.length > 19) {
      alert("Max upload limit reached");
      return;
    }
    if (embededUrl != "") {
      setIsFileuploading(true);
      let thumnnail: { thumbnailUrl: string, convertedEmbeddedUrl: string, canBeEmbedded?: boolean } | undefined = await useGetThumbnails(embededUrl);
      if (thumnnail && thumnnail.thumbnailUrl && thumnnail.canBeEmbedded) {
        const videothumbnail = await VideoThumbnail({ youtubeThumb: thumnnail.thumbnailUrl, companyId: user?.companyId ? user?.companyId : 0, existingId: '0', formtype: 'ourwork-projects-files' });

        const DBfile = {
          type: "video",
          fileUrl: thumnnail.convertedEmbeddedUrl || embededUrl,
          thumbnail: (videothumbnail?.data?.filepath) ? videothumbnail?.data?.filepath : thumnnail.thumbnailUrl,
        };

        const Displayfile = {
          type: "video",
          fileUrl: thumnnail.convertedEmbeddedUrl || embededUrl,
          thumbnail: (videothumbnail?.data?.filepath) ? videothumbnail?.data?.filepath : thumnnail.thumbnailUrl,
          signedUrl: (videothumbnail?.data?.signedImgUrl) ? videothumbnail?.data?.signedImgUrl : thumnnail.thumbnailUrl,
        };
        const theFileUrls = [...portfolioFileUrls];
        theFileUrls.push(DBfile);
        setportfolioFileUrls(theFileUrls);
        setVideoFile((prevFiles) => [...prevFiles, Displayfile]);
        setIsFileuploading(false);
        setEmbededUrl("");
      } else {
        setcanEmbedded(false);
        setIsFileuploading(false);
      }

    }
    setOpenModal(false);
  }

  const checkValidations = () => {

    if (isLoading || isFileuploading) {
      alert("Please wait upload inprogress...");
      return;
    }

    if (portfolioFileUrls && portfolioFileUrls.length > 19) {
      alert("Max upload limit reached");
      return;
    } else {
      setOpenModal(true);
    }
  };

  const handleFileChangeInprogress = (e: SyntheticEvent<HTMLInputElement>) => {
    if (isLoading || isFileuploading) {
      e.preventDefault()
      alert("Please wait upload inprogress...");
      return;
    }
  }
  usePreventBackNavigation(isDirty);
  return (
    <>
      {
        canRender ?
          <section>
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold  header-font">Our Work</h1>
              </div>
            </div>
            <div className="sm:text-left py-6">
              <h2 className="font-bold  heading-sub-font">Update Project</h2>
            </div>
            <form onSubmit={handleSubmit(onsubmit)}>
              <div className="py-6 pt-0 lg:w-[600px]">
                <div>
                  <div className="py-4 px-4 bg-gray-100 ">
                    {/* <p className="text-sm pb-2">Project 1</p> */}
                    <div className="flex max-w-md flex-col gap-6">
                      <div className="firstname">
                        <div className="mb-2 block">
                          <Label
                            htmlFor="base"
                            value="Project Name"
                            className="font-bold text-xs"
                          />
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`project.name`, {
                            required: true,
                          })}
                        />
                        {errors && errors.project && errors.project?.name ? (
                          <p className="text-red-600 text-xs">
                            Please enter project name
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="lasttname">
                        <div className="mb-2 block">
                          <Label
                            htmlFor="base"
                            value="Project Completion Date"
                            className="font-bold text-xs"
                          />
                        </div>
                        <DatePicker
                          autoComplete="off"
                          selected={selectedDate}
                          // value = {completiondate}
                          showMonthYearPicker
                          dateFormat="MM/yyyy"
                          className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                          onChange={(date: Date) => {
                            handleDateChange(date);
                          }}
                        />
                        <p className="text-xs pt-2 text-gray-500">
                          This should be the date the project went live
                        </p>
                        {errors && errors.project && errors.project?.projectCDate ? (
                          <p className="text-red-600 text-xs">Please select a date</p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="email">
                        <div className="mb-2 block">
                          <Label
                            htmlFor="base"
                            value="Platforms"
                            className="font-bold text-xs"
                          />
                        </div>
                        <Multiselect
                          emptyRecordMsg="-"
                          options={platforms}
                          displayValue="name"
                          onSelect={(e) => onAddOrRemovePlatforms(e)}
                          onRemove={(e) => onAddOrRemovePlatforms(e)}
                          selectedValues={selectedPlatforms}
                          {...register(`project.platforms`, {
                            required: true,
                          })}
                        />
                        {errors && errors.project && errors.project?.platforms ? (
                          <p className="text-red-600 text-xs">
                            Please select at least one platform
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="linkedInprofile">
                        <div className="mb-2 block">
                          <Label
                            htmlFor="base"
                            value="Description"
                            className="font-bold text-xs"
                          />
                        </div>
                        <Textarea
                          id="comment"
                          placeholder=""
                          rows={8}
                          {...register(`project.description`, {
                            required: true,
                          })}
                        />
                        {errors && errors.project && errors.project?.description ? (
                          <p className="text-red-600 text-xs">
                            Please fill the description
                          </p>
                        ) : (
                          ""
                        )}
                      </div>

                      <div className="lg:w-[450px] w-full">
                        <h1 className="font-bold default_text_color heading-sub-font pb-2">
                          Project Images and Videos (upto 20)
                        </h1>
                        <p className="default_text_color text-sm">
                          Upload video or image files. Follow these guidelines for
                          best results:
                        </p>
                        <ul className="text-sm pt-2 list-disc space-y-1 list-inside">
                          <li>
                            <span> Recommend 16:9 ratio - 1280px wide by 720px tall
                            </span>
                          </li>
                          <li>
                            {fileSize ? <span className="font-medium text-red-500">Keep files under 5 MB each</span> :
                              <span> Keep files under 5 MB each
                              </span>
                            }
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="logo_image pt-3 space-y-2">
                      <label
                        htmlFor="file-upload"
                        className="custom-file-upload inline-flex items-center justify-center  px-6 py-2 text-sm reset_btn h-[40px] font-medium"
                      >
                        Browse images ...
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        onClick={(e: React.MouseEvent<HTMLInputElement>) => handleFileChangeInprogress(e)}
                        onChange={handleFileChange}
                        multiple
                      />
                      <button
                        // onClick={() => setOpenModal(true)}
                        onClick={() => checkValidations()}
                        type="button"
                        className="reset_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
                      >Add a shared video link from YouTube or Vimeo
                        {/* Add embedded video{" "}
                        <span className="xs_mobile_hide">
                          (e.g. YouTube, Vimeo, etc) ...
                        </span> */}
                      </button>
                      {fileValidation &&
                        <p className="text-red-600 text-sm">{fileValidation}</p>
                      }
                    </div>
                    {previewImages && previewImages.length > 0 &&
                      <div
                        className="uploading_images_bg p-2.5 rounded-sm mb-6"
                        id="browseImages"
                        style={{ display: "flex", flexWrap: "wrap" }}
                      >
                        <div className="grid grid-cols-3 gap-5">
                          {previewImages.map((previewImage, index) => (
                            portfolioFileUrls[videoFile.length + index] ?
                              <div
                                className="relative border-dashed dashed_bg_color rounded-sm border-b-0 h-25 active_image img_view_portfolio_thumb"
                                key={index}
                                style={{ position: "relative", height: "86px" }}
                              >
                                <img
                                  src={previewImage}
                                  alt={`Preview ${index + 1}`}
                                  width={150}
                                  height={98}
                                />
                                <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                                  <button
                                    onClick={() => handleRemoveImage(index)}
                                    type="button"
                                  >
                                    <svg
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
                              :
                              <div key={`loader_${index}`} className="flex justify-center m-auto items-center">
                                <Spinner />
                              </div>
                          ))}
                        </div>
                      </div>

                    }

                    {videoFile.length > 0 ? (
                      <div
                        className="uploading_images_bg p-2.5 rounded-sm mb-6"
                        id="browseImages"
                        style={{ display: "flex", flexWrap: "wrap" }}
                      >
                        {videoFile?.map((videoFiles, index) => (
                          <div>
                            {/* <h4>Video </h4> */}
                            <div
                              className="relative border_1 border-dashed dashed_bg_color rounded-sm border-b-0 h-25 img_view_portfolio_thumb"
                              key={index}
                            >

                              <img
                                src={videoFiles.signedUrl}
                                alt=""
                                width={150}
                                height={98}
                              />
                              <div className="absolute inset-0 flex justify-center items-center">
                                <img
                                  src="/play-icon.png"
                                  alt="Play icon"
                                  width={35}
                                  height={35}
                                />
                              </div>

                              <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                                <button
                                  onClick={() => removeVideoUrl(index)}
                                  type="button"
                                >
                                  <svg
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
                          </div>
                        ))}
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="testimonial">
                  <div className="sm:text-left py-6">
                    <h2 className="font-bold  heading-sub-font">Client Testimonial (Optional)</h2>
                  </div>
                  <div className=" pt-0 lg:w-[600px]">
                    <div>
                      <div className="py-4 px-4 bg-gray-100 ">
                        <div className="flex max-w-md flex-col gap-6">
                          <div className="cname pb-2">
                            <div className="mb-2 block">
                              <Label htmlFor="comment" value="Testimonial" className="font-bold text-xs" />
                            </div>
                            <Textarea autoComplete="off" id="comment" placeholder="" {...register(`project.testimonial.message`, {
                              validate: value => ((value && value.trim().length < 800) || !value) || "Please keep the description under 800 characters for best results."
                            })} rows={8} />
                            {errors && errors.project && errors.project?.testimonial && errors.project?.testimonial.message &&
                              <p className="text-red-600 text-xs pt-1">
                                Please keep the description under 800 characters for best results.
                              </p>
                            }
                          </div>
                          <div className="tname">
                            <div className="mb-2 block">
                              <Label className="font-bold text-xs" htmlFor="Tname" value="Name" />
                            </div>
                            <TextInput id="Tname" type="text" autoComplete="off"
                              {...register(`project.testimonial.name`, {
                                validate: () => { return (watchTestimonialDesc && watchTestimonialDesc.trim().length > 0) ? (watchTestimonialName.trim().length > 0) : true }
                              })}
                            />
                            {errors && errors.project && errors.project?.testimonial?.name &&
                              <p className="text-red-600 text-xs">
                                Name is required
                              </p>}
                          </div>
                          <div className="btitle">
                            <div className="mb-2 block">
                              <Label className="font-bold text-xs" htmlFor="Btitle" value="Business Title" />
                            </div>
                            <TextInput autoComplete="off" id="btitle" type="text" {...register(`project.testimonial.title`, {
                              validate: () => { return (watchTestimonialDesc && watchTestimonialDesc.trim().length > 0) ? (watchTestimonialTitle.trim().length > 0) : true }
                            })} />
                            {errors && errors.project && errors.project?.testimonial?.title &&
                              <p className="text-red-600 text-xs">
                                Title is required
                              </p>}
                          </div>
                          <div className="cname">
                            <div className="mb-2 block">
                              <Label className="font-bold text-xs" htmlFor="Cname" value="Company Name" />
                            </div>
                            <TextInput autoComplete="off" id="Cname" type="text" {...register(`project.testimonial.companyname`, {
                              validate: () => { return (watchTestimonialDesc && watchTestimonialDesc.trim().length > 0) ? (watchTestimonialCompanyName.trim().length > 0) : true }
                            })} />
                            {errors && errors.project && errors.project?.testimonial?.companyname &&
                              <p className="text-red-600 text-xs">
                                Company Name is required
                              </p>}

                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 py-6">
                  <Button
                    type="button"
                    className="button_cancel h-[40px] px-4 border-gray-50-100"
                  >
                    <Link prefetch={false} href="/company-profile/our-works?goto=2">Cancel</Link>
                  </Button>
                  {(isLoading || isFileuploading) ?
                    <div className="flex justify-center items-center">
                      <Spinner />
                    </div>
                    :
                    <Button type="submit" className="button_blue h-[40px] px-4">
                      Update
                    </Button>
                  }
                </div>
              </div>
            </form>
            <Modal
              size="sm"
              show={openModal}
              onClose={() => {
                setOpenModal(false), setIsValidEmbed(true);
              }}
            >
              <Modal.Header className="modal_header">
                <b>Shared Video Link</b>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-2.5">
                  <p className="text-sm leading-relaxed default_text_color">
                    Paste the shared video link from YouTube or Vimeo.
                  </p>
                  <form>
                    <div
                      className={`flowbite_input_radius_6 ${isValidEmbed ? "" : "FiAlertTriangle"
                        }`}
                    >
                      <TextInput
                        autoComplete="off"
                        id="embed"
                        type="text"
                        placeholder="Paste the shared video link here"
                        required
                        rightIcon={(isValidEmbed && canEmbedded) ? undefined : FiAlertTriangle}
                        color={(isValidEmbed && canEmbedded) ? "" : "failure"}
                        onChange={(e) => onSetUrl(e.target.value)}
                        helperText={
                          !canEmbedded ? <span className="text-xs">
                            Video cannot be embedded due to it’s privacy settings at the source. Adjust those settings to allow the video to be displayed in XDS Spark.
                          </span> :

                            !isValidEmbed && (
                              <span className="text-xs">
                                You may only enter a shared link from YouTube or Vimeo.
                              </span>
                            )
                        }
                      />
                    </div>
                  </form>
                </div>
              </Modal.Body>
              <Modal.Footer className="modal_footer">
                <Button
                  color="gray"
                  onClick={() => {
                    setOpenModal(false), setIsValidEmbed(true);
                  }}
                  className="h-[40px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => onClickPortfolioAddVideo()}
                  className={`h-[40px] button_blue ${isValidEmbed ? "" : "hidden"}`}
                >
                  {isFileuploading ? <ButtonSpinner></ButtonSpinner> :
                    'Add Video'}
                </Button>
              </Modal.Footer>
            </Modal>
          </section>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }

    </>
  );
};
export default UpdateProject;
