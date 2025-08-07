"use client";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { Button } from "@/components/ui/button";
import { Modal, TextInput } from "flowbite-react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import "react-datepicker/dist/react-datepicker.css";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import Image from "next/image";
import { usePortfolioFiles } from "@/hooks/usePortfolioFiles";
import Spinner from "@/components/spinner";

interface PortfolioFiles {
  id: number | null;
  fileUrls: {
    type: string;
    fileUrl: string;
  }[];
}

interface PreviewFiles {
  from: string;
  type: string;
  imgUrl: string;
  signedImgUrl: string;
  // thumbnailSignedUrl:string;
  idSelected: boolean;
}

const PortfolioFiles = () => {
  const { user } = useUserContext();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [companyId, setCompanyId] = useState<number>();
  const [previewImages, setPreviewImages] = useState<PreviewFiles[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<string[]>([]);
  const [portfolioFileUrls, setportfolioFileUrls] = useState<
    { type: string; fileUrl: string; active: boolean }[]
  >([]);
  const [embededUrl, setEmbededUrl] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [activeClass, setActiveClass] = useState<string[]>([]);
  const [isValidEmbed, setIsValidEmbed] = useState(true);
  const [fileSize, setFileSize] = useState<boolean>(false);
  const [fileValidation, setFileValidation] = useState<string>("");
  const [fileExt, setFileExt] = useState<boolean>(false);
  const [canRender, setCanRender] = useState(false);
  // const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!user) {
    redirect(PATH.HOME.path);
  }
  const { data: companyGeneralInfo, isLoading: generalInfoLoading } =
    usePortfolioFiles(user.companyId);

  useEffect(() => {
    const previewImageUrls: PreviewFiles[] = [...previewImages];
    const previewVideoUrls: string[] = [];
    const portfolioFiles = companyGeneralInfo?.data?.images;
    const videoUrls = companyGeneralInfo?.data?.videoUrls;

    if (portfolioFiles && portfolioFiles.length > 0) {
      portfolioFiles.forEach((item: any) => {
        previewImageUrls.push({
          type: item.type,
          from: "server",
          imgUrl: item.fileUrl,
          signedImgUrl: item.signedUrl,
          // thumbnailSignedUrl: item.thumbnailSignedUrl,
          idSelected: item.isSelected,
        });
      });
    }
    setPreviewImages(previewImageUrls);

    const activeImages: string[] = [];
    previewImageUrls.forEach((item) => {
      if (item.idSelected) {
        activeImages.push(item.imgUrl);
      }
    });
    setActiveClass(activeImages);

    if (videoUrls && videoUrls.length > 0) {
      videoUrls.forEach((item: any) => {
        previewVideoUrls.push(item.fileUrl);
      });
    }
    setVideoFile(previewVideoUrls);
    setCanRender(true);
  }, [generalInfoLoading]);

  function onClickPortfolioAddVideo() {
    if (portfolioFileUrls && portfolioFileUrls.length > 99) {
      setFileValidation("Max of 100 images/videos are allowed");
      return;
    }
    if (embededUrl != "") {
      setVideoFile((prevFiles) => [...prevFiles, embededUrl]);
    }
    setOpenModal(false);
  }

  const onSetUrl = (val: string) => {
    setFileValidation("");
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
  //       //   let errorMessage = `Uploading file does not allow `;
  //       // if (!isSixteenNine) errorMessage += "aspect ratio is not 16:9. ";
  //       // if (!isWidthValid) errorMessage = `Uploading file does not allow width is below 1280 pixels.`;
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
    setFileValidation("");
    setFileSize(false);
    setFileExt(false);
    const files = event.target.files;
    if (files) {
      if (files.length > 100) {
        setFileValidation("Max of 100 images/videos are allowed");
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

      Array.from(files).forEach(async (file) => {
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
        if ((fileExtension !== "png" && fileExtension !== "jpg")) {
          setFileExt(true);
          filesHaveInvalidExtension = true;
        }
      });

      if (filesExceedSizeLimit || filesHaveInvalidExtension || allFilesValid) {
        return;
      }
      else {
        setSelectedFiles(Array.from(files));
        setCompanyId(user.companyId);
      }
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      handleUpload();
    }
  }, [selectedFiles]);

  const handleRemoveImage = (index: number, imageUrl: string) => {
    const previousActiveClass = [...activeClass];
    const previewedImages = [...previewImages];
    const activeIndex = previousActiveClass.indexOf(imageUrl);
    previousActiveClass.splice(activeIndex, 1);
    setActiveClass(previousActiveClass);
    previewedImages.splice(index, 1);
    setPreviewImages(previewedImages);
  };

  const removeVideoUrl = (index: number) => {
    const updatedVideo = [...videoFile];
    updatedVideo.splice(index, 1);
    setVideoFile(updatedVideo);
  };

  const handleUpload = () => {
    // setIsLoading(true);
    const returnedDataAfterUpload: PreviewFiles[] = [];
    const uploadPromises = selectedFiles.map((file, index) => {
      return new Promise<void>((resolve, reject) => {
        const formData = new FormData();
        formData.append(`files`, file);
        if (portfolioFileUrls && portfolioFileUrls.length > 99) {
          setFileValidation("Max of 100 images/videos are allowed");
          return;
        }
        if (companyId !== undefined) {
          formData.append("companyId", companyId.toString());
        }
        const xhr = new XMLHttpRequest();
        xhr.open(
          "POST",
          getEndpointUrl(ENDPOINTS.saveFilesForCompanyPortfolio),
          true,
        );
        const fileUrl = URL.createObjectURL(file);
        setPreviewImages((prevImages) => [
          {
            type: "image",
            imgUrl: fileUrl,
            from: "local",
            signedImgUrl: fileUrl,
            // thumbnailSignedUrl: fileUrl,
            idSelected: false,
          },
          ...prevImages,
        ]);
        xhr.upload.onprogress = function (event) {
          if (event.lengthComputable) {
            const startTime = new Date().getTime();
            const timeout = 1500 * selectedFiles.length;
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
            const response = JSON.parse(xhr.response);
            const item = {
              from: "server",
              type: "image",
              imgUrl: response.data[0].imgUrl,
              signedImgUrl: response.data[0].signedImgUrl,
              // thumbnailSignedUrl: response.data[0].thumbnailSignedUrl,
              idSelected: response.data[0].idSelected,
            };
            returnedDataAfterUpload.push(item);
            setportfolioFileUrls((portfoliofiles) => [
              { type: "image", fileUrl: response.data[0], active: false },
              ...portfoliofiles,
            ]);
            // setIsLoading(false);
            resolve();
          } else {
            // setIsLoading(false);
            reject(`File ${index + 1} Upload Failed`);
          }
        };
        xhr.onerror = function () {
          // setIsLoading(false);
          console.error(
            `Error during upload of file ${index + 1}:`,
            xhr.statusText,
          );
        };
        xhr.send(formData);
      });
    });

    Promise.all(uploadPromises).then(() => {
      const onlyServerUrls: PreviewFiles[] = [];

      returnedDataAfterUpload.forEach((item) => {
        onlyServerUrls.push(item);
      });
      for (let item of previewImages) {
        if (item.from == "server") {
          onlyServerUrls.push(item);
        }
      }
      setPreviewImages(onlyServerUrls);
    });
  };

  const {
    submitForm: savePortfoliofiles,
    success,
    error,
  } = useCommonPostData<PortfolioFiles>({
    url: getEndpointUrl(ENDPOINTS.savePortfolieData),
  });

  const savePortfolio = () => {
    const allItemsToSend: { type: string; fileUrl: string; active: boolean }[] =
      [];
    previewImages.forEach((item) => {
      allItemsToSend.push({
        type: item.type,
        fileUrl: item.imgUrl,
        active: item.idSelected,
      });
    });

    videoFile.forEach((item) => {
      allItemsToSend.push({
        type: "video",
        fileUrl: item,
        active: false,
      });
    });

    const postData = {
      fileUrls: allItemsToSend,
      id: user.companyId,
    };
    savePortfoliofiles(postData);
  };

  useEffect(() => {
    if (success) {
      toast.success("Your changes have been saved 👍");
    }
    if (error) {
      toast.error("Something's wrong. Please try again.");
    }
  }, [success, error]);

  const onSelecteImage = (index: number, imageUrl: string) => {
    const previousPreviewImages = [...previewImages];
    const previousActiveClass = [...activeClass];
    if (activeClass.includes(imageUrl)) {
      const activeIndex = previousActiveClass.indexOf(imageUrl);
      previousActiveClass.splice(activeIndex, 1);
      setActiveClass(previousActiveClass);
      previousPreviewImages[index].idSelected =
        !previousPreviewImages[index].idSelected;
      setPreviewImages(previousPreviewImages);
    } else {
      if (activeClass.length < 4) {
        previousPreviewImages[index].idSelected =
          !previousPreviewImages[index].idSelected;
        previousActiveClass.push(previousPreviewImages[index].imgUrl);
        setActiveClass(previousActiveClass);
        setPreviewImages(previousPreviewImages);
      } else {
        alert("Maximum number of images already selected");
      }
    }
  };

  const checkValidations = () => {
    if (portfolioFileUrls && portfolioFileUrls.length > 99) {
      alert("Upload images and videos upto 100 only");
      return;
    } else {
      setOpenModal(true);
    }
  };

  return (
    <>
      {
        canRender ?
        <section>
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
                      id="embed"
                      autoComplete="off"
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
          <div className="sm:text-left pb-6">
            <h1 className="font-bold default_text_color heading-sub-font">
              Add Images and Videos (100 max)
            </h1>
          </div>
          <div className="lg:w-[450px] w-full">
            <p className="default_text_color text-sm">
              Upload images or add embeded video links that you would like to appear
              on your portfolio. Follow these guidelines for best results:
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
              <li>

                {fileExt ? <span className="font-medium text-red-500">JPG or PNG image formats only</span> :
                  <span> JPG or PNG image formats only
                  </span>
                }
              </li>
            </ul>
          </div>
          <div className="logo_image py-6 space-y-2">
            <label
              htmlFor="file-upload"
              className="custom-file-upload inline-flex items-center justify-center  px-6 py-2 text-sm reset_btn h-[40px] font-medium"
            >
              Browse images ...
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={(e) => handleFileChange(e)}
              multiple
            />
            <button
              onClick={() => { checkValidations(); setFileValidation(""); setFileSize(false); setFileExt(false); }}
              type="button"
              className="reset_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
            >
              Add embedded video{" "}
              <span className="xs_mobile_hide">(e.g. YouTube, Vimeo, etc) ...</span>
            </button>
            {fileValidation &&
              <p className="text-red-600 text-sm">{fileValidation}</p>
            }
          </div>

          <div className="pb-6">
            <p className="text-sm">
              Please check four images below as highlight images for your profile
              page
            </p>
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
                    className="relative border-dashed dashed_bg_color rounded-sm border-b-0 active_image"
                    key={index}
                  >
                    {/* <div className={previewImage.idSelected ? 'active' : ''} style={{position :"relative"}}> */}
                    <div
                      className={`img_view_portfolio_thumb border_none ${previewImage.idSelected ? "active" : ""
                        }`}
                      style={{ position: "relative", height: "86px" }}
                    >
                      <img
                        src={previewImage.signedImgUrl}
                        alt={`Preview ${index + 1}`}
                        width={150}
                        height={98}
                      />
                      <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                        <div
                          onClick={() => onSelecteImage(index, previewImage.imgUrl)}
                        >
                          {previewImage.idSelected ? (
                            <svg
                              className="w-[18px] h-[18px] green_c dark:text-white"
                              aria-hidden="true"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-[18px] h-[18px] text-blue-300 dark:text-white"
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
                                d="m7 10 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                          )}
                        </div>
                        <button onClick={() => handleRemoveImage(index, previewImage.imgUrl)}>
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
                            className="absolute -bottom-2 left-0"
                          >
                            <progress
                              value={uploadProgress[index]}
                              max="100"
                              style={{ height: "6px", width: "100%" }}
                            />
                          </div>
                        )}
                    </div>
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
                      <Image
                        src="/video-thumb.jpg"
                        alt=""
                        width={150}
                        height={98}
                      />
                      <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                        <button onClick={() => removeVideoUrl(index)}>
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

          <div className="flex flex-wrap justify-end pb-12">
            <div className="left_btn inline-flex">
              {/* <Button
          type="submit"
          className="button_cancel hover:border-gray-100 h-[40px] px-4 mr-2"
        >
          Cancel
        </Button> */}
              {/* {isLoading ?
          <> 
            <Button
              type="submit"
              disabled
              className="w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100"
              onClick={() => savePortfolio()}
            >
              Save
            </Button>
              <div className="flex justify-center items-center">
                <Spinner />
              </div> 
            </>         
            : */}
              <Button
                type="submit"
                className="w-[7rem] disabled:bg-gray-150/20 shadow-none disabled:text-[#A2ABBA] disabled:opacity-100"
                onClick={() => savePortfolio()}
              >
                Save
              </Button>
              {/* } */}
            </div>
          </div>
        </section>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
    </>
  );
};

export default PortfolioFiles;
