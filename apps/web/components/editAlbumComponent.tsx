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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authFetcher } from "@/hooks/fetcher";
import Multiselect from "multiselect-react-dropdown";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import commonPatchData from "@/hooks/commonPatchData";
import { FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";
interface PortfolioProjectDto {
  project: PortfolioProject;
  id?: number;
}

const EditAlbumComponent = (params: { params: { albumId: string } }) => {
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
  const [videoFile, setVideoFile] = useState<string[]>([]);
  const [portfolioFileUrls, setportfolioFileUrls] = useState<
    { type: string; fileUrl: string; active: boolean }[]
  >([]);
  const [embededUrl, setEmbededUrl] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isValidEmbed, setIsValidEmbed] = useState(true);
  const [fileSize, setFileSize] = useState<boolean>(false);
  const [fileValidation, setFileValidation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchInformations();
  }, []);

  async function fetchInformations() {
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
    getValues,
    watch,
    formState: { errors },
    clearErrors,
    setError,
  } = useForm<{ project: PortfolioProject }>({
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
  useEffect(() => {
    // console.log(project.fileUrls);

    if (portfolioFileUrls.length > 0) {
      setValue(`project.fileUrls`, portfolioFileUrls);
      if (errors.project && errors.project.fileUrls) {
        clearErrors(`project.platforms`);
      }
    }
  }, [portfolioFileUrls]);

  const { submitForm: saveProject, success } =
    useCommonPostData<PortfolioProjectDto>({
      url: getEndpointUrl(ENDPOINTS.saveSinglePortfolioProject),
    });

  const onsubmit = (data: { project: PortfolioProject }) => {
    data.project.description = JSON.stringify(data.project.description);
    const postData: PortfolioProjectDto = {
      id: user?.companyId,
      project: sanitizeData(data.project),
    };
    saveProject(postData)
      .then((result) => {
        if (result && result.data && result.data.success) {
          toast.success("Project successfully Created 👍");
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

  function onAddOrRemovePlatforms(
    theSelectedPlatforms: { id: number; name: string }[],
  ) {
    const thePlatforms: number[] = [];
    for (const item of theSelectedPlatforms) {
      thePlatforms.push(item.id);
    }
    setValue(`project.platforms`, thePlatforms);
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

  function onClickPortfolioAddVideo() {
    if (portfolioFileUrls && portfolioFileUrls.length > 19) {
      setFileValidation("Upload images and videos upto 20 only");
      return;
    }
    if (embededUrl != "") {
      const file = {
        type: "video",
        fileUrl: embededUrl,
        active: false,
      };
      const theFileUrls = [...portfolioFileUrls];
      theFileUrls.push(file);
      setportfolioFileUrls(theFileUrls);
      setVideoFile((prevFiles) => [...prevFiles, embededUrl]);
    }
    setOpenModal(false);
  }

  const onSetUrl = (val: string) => {
    setIsValidEmbed(true);
    if (val && val != "") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(val, 'text/html');
      const iframes = doc.getElementsByTagName('iframe');
      if (iframes.length === 1) {
        const src = iframes[0].src;
        const embeddedUrlRegex =
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/embed\/([a-zA-Z0-9_-]{11})|youtu\.be\/([a-zA-Z0-9_-]{11})|vimeo\.com\/video\/(\d+))/;
        const isValidEmbeddedUrl = embeddedUrlRegex.test(src);
        if (isValidEmbeddedUrl) {
          setEmbededUrl(val);
        } else {
          setIsValidEmbed(false);
        }
      }
      else {
        setIsValidEmbed(false);
      }
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {

    const files = event.target.files;
    setFileSize(false);
    setFileValidation("");
    if (files) {

      let filesExceedSizeLimit = false;
      let filesHaveInvalidExtension = false;
      let allFilesValid = false;

      // for (const file of files) {
      //   const dimension = await validateDimensions(file);
      //   if (!dimension) {
      //     allFilesValid = true;
      //   }
      // }
      for (const file of files) {
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
          setFileValidation(
            "." + fileExtension + " is not allowed",
          );
          filesHaveInvalidExtension = true;
        }
      };
      if (files.length > 20) {
        setFileValidation("Max of 20 images/videos are allowed");
        return;
      }

      if (filesExceedSizeLimit || filesHaveInvalidExtension || allFilesValid) {
        return;
      }
      else {
        setSelectedFiles(Array.from(files));

        setCompanyId(user?.companyId);
      }

    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      handleUpload();
    }
  }, [selectedFiles]);

  const handleRemoveImage = (index: number) => {
    setFileSize(false);
    setFileValidation("");
    const updatedImages = [...previewImages];
    updatedImages.splice(index, 1);
    setPreviewImages(updatedImages);
    const deleteImgfromArr = [...portfolioFileUrls];
    deleteImgfromArr.splice(index, 1);
    setportfolioFileUrls(deleteImgfromArr);
  };

  const removeVideoUrl = (index: number) => {
    setFileSize(false);
    setFileValidation("");
    const updatedVideo = [...videoFile];
    updatedVideo.splice(index, 1);
    setVideoFile(updatedVideo);
    const deletevideofromAllarr = previewImages.length;
    const deleteVdofromArr = [...portfolioFileUrls];
    deleteVdofromArr.splice(deletevideofromAllarr + index, 1);
    setportfolioFileUrls(deleteVdofromArr);
  };

  const handleUpload = () => {
    setIsLoading(true);
    selectedFiles.forEach((file: File, index: number) => {
      // const fileUrl = URL.createObjectURL(file);
      const formData = new FormData();
      formData.append(`files`, file);
      if (portfolioFileUrls && portfolioFileUrls.length > 19) {
        setFileValidation("Max of 20 images/videos are allowed");
        return;
      }
      if (companyId !== undefined) {
        formData.append("companyId", companyId.toString());
      }
      const xhr = new XMLHttpRequest();
      xhr.open("POST", getEndpointUrl(ENDPOINTS.uploadmultipleimages), true);
      const fileUrl = URL.createObjectURL(file);
      setPreviewImages((prevImages) => [fileUrl, ...prevImages]);

      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const startTime = new Date().getTime();
          const timeout = 1000 * selectedFiles.length;
          const intervalId = setInterval(() => {
            const currentTime = new Date().getTime();
            const elapsedTime = currentTime - startTime;
            let percentComplete = (elapsedTime / timeout) * 100;
            percentComplete = Math.min(Math.max(percentComplete, 0), 100);
            setUploadProgress((prevProgress) => {
              const updatedProgress: number[] = prevProgress
                ? [...prevProgress]
                : [];
              updatedProgress[index] = percentComplete;
              return updatedProgress;
            });
            if (percentComplete >= 100) {
              clearInterval(intervalId);
            }
          }, 100);
        }
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log(`File ${index + 1} Upload Successful`);
          const response = JSON.parse(xhr.response);
          setportfolioFileUrls((portfoliofiles) => [
            { type: "image", fileUrl: response.data[0], active: false },
            ...portfoliofiles,
          ]);
          setIsLoading(false);
        } else {
          setIsLoading(false);
          console.log(`File ${index + 1} Upload Failed`);
        }
      };
      xhr.onerror = function () {
        setIsLoading(false);
        console.error(
          `Error during upload of file ${index + 1}:`,
          xhr.statusText,
        );
      };
      xhr.send(formData);
    });
  };

  const checkvalidation = () => {
    if (portfolioFileUrls && portfolioFileUrls.length > 19) {
      alert("Upload images and videos upto 20 only");
      return;
    } else {
      setOpenModal(true);
    }
  };

  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold  header-font">Our Work</h1>
        </div>
      </div>
      <div className="sm:text-left py-6">
        <h2 className="font-bold  heading-sub-font">Create Album</h2>
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
                      value="Album Name"
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
              <div className="logo_image pt-3 pb-6 space-y-2">
                <label
                  htmlFor="file-upload"
                  className="custom-file-upload inline-flex items-center justify-center  px-6 py-2 text-sm reset_btn h-[40px] font-medium"
                >
                  Browse images ...
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                />
                <button
                  // onClick={() => setOpenModal(true)}
                  onClick={() => { checkvalidation(); setFileSize(false) }}
                  type="button"
                  className="reset_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
                >
                  Add embedded video{" "}
                  <span className="xs_mobile_hide">
                    (e.g. YouTube, Vimeo, etc) ...
                  </span>
                </button>
                {fileValidation &&
                  <p className="text-red-600 text-sm">{fileValidation}</p>
                }
              </div>
              {previewImages && previewImages.length > 0 && (
                <div
                  className="uploading_images_bg p-2.5 rounded-sm mb-6"
                  id="browseImages"
                  style={{ display: "flex", flexWrap: "wrap" }}
                >
                  <div className="grid grid-cols-6 gap-4">
                    {previewImages.map((previewImage, index) => (
                      <div
                        className="relative border-dashed dashed_bg_color rounded-sm border-b-0 active_image img_view_portfolio_thumb"
                        key={index}
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

                        {uploadProgress[index] !== undefined &&
                          uploadProgress[index] < 100 && (
                            <div
                              style={{ width: "100%" }}
                              className="absolute -bottom-2 left-0 w-full"
                            >
                              <progress
                                value={uploadProgress[index]}
                                max="100"
                                style={{ height: "6px", width: "100%" }}
                              />
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {videoFile && videoFile.length > 0 && (
                <div
                  className="uploading_images_bg p-2.5 rounded-sm mb-6"
                  id="browseImages"
                  style={{ display: "flex", flexWrap: "wrap" }}
                >
                  <div className="grid grid-cols-6 gap-4">
                    {videoFile?.map((videoFile, index) => (
                      <div>
                        {/* <h4>Video</h4> */}
                        <div
                          className="relative border_1 border-dashed dashed_bg_color rounded-sm border-b-0 h-25 img_view_portfolio_thumb"
                          key={index}
                        >
                          <img
                            src="/video-thumb.jpg"
                            alt=""
                            width={150}
                            height={98}
                          />
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
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 py-6">
            <Button
              type="button"
              className="button_cancel h-[40px] px-4 border-gray-50-100"
            >
              <Link prefetch={false} href="/company-profile/our-works?goto=2">Cancel</Link>
            </Button>
            {isLoading ?
              <div className="flex justify-center items-center">
                <Spinner />
              </div>
              :
              <Button type="submit" className="button_blue h-[40px] px-4">
                Create
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
          <b>Video Embed Code</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-2.5">
            <p className="text-sm leading-relaxed default_text_color">
              Paste the embed code (e.g. YouTube, Vimeo) for your video.
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
                  placeholder="Paste embed code here"
                  required
                  rightIcon={isValidEmbed ? undefined : FiAlertTriangle}
                  color={isValidEmbed ? "" : "failure"}
                  onChange={(e) => onSetUrl(e.target.value)}
                  helperText={
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
            Add Video
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default EditAlbumComponent;