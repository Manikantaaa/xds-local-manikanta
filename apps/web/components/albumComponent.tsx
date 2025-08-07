"use client";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import {
  Button,
  Label,
  Modal,
  TextInput,
  Tooltip,
} from "flowbite-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";
import { FiAlertTriangle } from "react-icons/fi";
import Link from "next/link";
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";
import { DraggableImageUploads } from "./draggableImageUploads";
import { useParams, useRouter } from "next/navigation";
import useGetThumbnails from "@/hooks/useGetThumbnails";
import { authFetcher } from "@/hooks/fetcher";
import { Fileresponse, draggableComponentResponseType, portfolioAlbumVideoType, responseDataType, sponcersLogotypes } from "@/types/draggableImages.type";
import UniqueFormId from "@/hooks/useRandomId";
import ButtonSpinner from "./ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { useProfileStatusContext } from "@/context/profilePercentage";
import { PATH } from "@/constants/path";
import { redirect } from "next/navigation";


const AlbumComponent = () => {

  const { user } = useUserContext();
  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();
  const router = useRouter();
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [portfolioVideoUrls, setportfolioVideoUrls] = useState<
    portfolioAlbumVideoType[]
  >([]);
  const [embededUrl, setEmbededUrl] = useState<string>("");
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [isValidEmbed, setIsValidEmbed] = useState(true);
  const [canEmbedded, setcanEmbedded] = useState(true);
  const [fileSize, setFileSize] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [ErrorMessage, setErrorMessage] = useState<{ field: string, Message: string }>({ field: '', Message: '' });

  //fileupload functions
  const inputAlbumRef = useRef<HTMLInputElement>(null);
  const [indexValues, setIndexValues] = useState<sponcersLogotypes[]>([]);
  const [responseData, setResponseData] = useState<responseDataType | undefined>();

  //
  const [selectedVideoUrls, setSelectedVideoUrls] = useState<portfolioAlbumVideoType>()

  const [deletedFilePaths, setDeletedFilePaths] = useState<string[]>([]);
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_' + new Date().getTime());
  const [imageUploadInprogress, setImageUploadInprogress] = useState<boolean>(false);

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

  useEffect(() => {
    //checking image validation
    if (indexValues.length > 0 || portfolioVideoUrls.length > 0) {
      setErrorMessage({ field: 'source', Message: '' });
    }
  }, [indexValues, portfolioVideoUrls])
  //apis
  const { error, success, submitForm } = useCommonPostData<FormData>({
    url: getEndpointUrl(ENDPOINTS.addportfolioalbum),
  });

  const { error: videothumberror, success: videothumbsuccess, submitForm: VideoThumbnail } = useCommonPostData<{ youtubeThumb: string, companyId: number, existingId: string, formtype: string }>({
    url: getEndpointUrl(ENDPOINTS.videoThumbnails),
  });



  const paramsdata = useParams();
  let albumId: string = "0";
  if (paramsdata && paramsdata.albumId && typeof paramsdata.albumId === 'string') {
    albumId = paramsdata["albumId"];
  }

  useEffect(() => {
    async function getalbumDetails() {
      if (user && albumId) {
        await authFetcher(
          `${getEndpointUrl(ENDPOINTS.getPortfolioAlbumsById(Number(albumId)))}`,
        )
          .then((result) => {
            if (result.success && result.data.data.length > 0) {
              const response = result.data.data[0];
              const Responsdatadata: draggableComponentResponseType = [];
              const ReposneVideoUrls: portfolioAlbumVideoType[] = [];
              inputAlbumRef.current ? inputAlbumRef.current.value = response.albumName : '';
              const dbFiles: sponcersLogotypes[] = [];

              response.portfolioAlbumFiles.map((albumfiles: Fileresponse) => {
                if (albumfiles.type === 'image') {
                  const currentFile: sponcersLogotypes = {
                    type: albumfiles.type,
                    filename: albumfiles.fileName,
                    signedUrl: albumfiles.signedfileUrl,
                    thumnnail: albumfiles.thumbnail,
                    selectedFile: albumfiles.isSelected,
                    indexId: albumfiles.fileIndex
                  };
                  const ImageresponseData = {
                    type: albumfiles.type,
                    signedUrl: albumfiles.signedfileUrl,
                    selectedIndex: albumfiles.isSelected,
                    fileUrl: albumfiles.fileUrl,
                    fileName: albumfiles.fileName,
                    id: albumfiles.id,
                    thumbnail: albumfiles.thumbnail,
                  }
                  Responsdatadata.push(ImageresponseData)

                  dbFiles.push(currentFile);
                } else {
                  const currentVideoFile = {
                    type: albumfiles.type,
                    fileUrl: albumfiles.thumbnail,
                    thumnnail: albumfiles.thumbnail,
                    signedUrl: albumfiles.signedfileUrl,
                  };
                  ReposneVideoUrls.push(currentVideoFile);

                  const videoResponseData = {
                    type: albumfiles.type,
                    signedUrl: albumfiles.signedfileUrl,
                    selectedIndex: albumfiles.isSelected,
                    fileUrl: albumfiles.fileUrl,
                    fileName: albumfiles.fileName,
                    id: albumfiles.id,
                    thumbnail: albumfiles.thumbnail,
                  }
                  Responsdatadata.push(videoResponseData);

                  const currentFile: sponcersLogotypes = {
                    type: albumfiles.type,
                    filename: albumfiles.fileName,
                    signedUrl: albumfiles.signedfileUrl,
                    thumnnail: albumfiles.thumbnail,
                    selectedFile: albumfiles.isSelected,
                    indexId: albumfiles.fileIndex
                  };
                  dbFiles.push(currentFile);
                }
              });
              setportfolioVideoUrls(ReposneVideoUrls);
              setResponseData({ data: Responsdatadata });
              setIndexValues(dbFiles)
            }
            setIsLoading(false);
          })
          .catch((err) => {
            console.log(err);
          });
      }
    }
    getalbumDetails();
  }, [albumId])

  const onsubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputAlbumRef.current && !inputAlbumRef.current.value) {
      setErrorMessage({ field: 'name', Message: 'Album Name required' });

      inputAlbumRef.current.scrollIntoView({ behavior: 'smooth', });
      inputAlbumRef.current.focus()
      return;
    } else if (indexValues.length <= 0 && portfolioVideoUrls.length <= 0) {
      setErrorMessage({ field: 'source', Message: 'Select at least one Image/Video' });
      return;
    }
    const albumdata: {
      albumId?: string
      albumName: string;
      albumFiles: sponcersLogotypes[];
      deletedFilePaths: string[];
      formid: string;
    } = {
      albumId: albumId,
      albumName: inputAlbumRef.current ? inputAlbumRef.current.value : "",
      albumFiles: indexValues,
      deletedFilePaths: deletedFilePaths,
      formid: uniqueFormId,
    };
    const sanitizedData = sanitizeData(albumdata);
    submitForm(sanitizedData).then((response) => {
      setIsDirty(false);
      if (response.data && response.data.StatusCode !== 201) {
        toast.error('An Error occurred, Try Again Later');
      } else {
        toast.success(`Album successfully ${(albumId && albumId != '0') ? 'updated' : 'created'} 👍`);
        const timeoutId = setTimeout(() => {
          router.push("/company-profile/our-works?goto=1", undefined,);
          if (profilepercentage && !profilepercentage.profileCompleted) {
            setProfilepercentage({
              generalInfoProfilePerc: profilepercentage ? profilepercentage.generalInfoProfilePerc : 0,
              aboutProfilePerc: profilepercentage ? profilepercentage.aboutProfilePerc : 0,
              ourWorkAlbumsProfilePerc: 8,
              ourWorkProjectProfilePerc: 8,
              servicesProfilePerc: profilepercentage ? profilepercentage.servicesProfilePerc : 0,
              certificationsProfilePerc: profilepercentage ? profilepercentage.certificationsProfilePerc : 0,
              contactsProfilePerc: profilepercentage ? profilepercentage.contactsProfilePerc : 0,
              profileCompleted: profilepercentage ? profilepercentage.profileCompleted : false,
              bannerAssetId: profilepercentage.bannerAssetId,
            });
          };
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    })

  };

  async function onClickPortfolioAddVideo() {
    // if (portfolioVideoUrls && portfolioVideoUrls.length > 19) {
    //   setFileValidation("Upload images and videos upto 20 only");
    //   return;
    // }
    if (setIsDirty) {
      setIsDirty(true);
    }
    setImageUploadInprogress(true);
    if (embededUrl != "") {
      let thumnnail: { thumbnailUrl: string, convertedEmbeddedUrl: string, canBeEmbedded?: boolean } | undefined = await useGetThumbnails(embededUrl);
      if (thumnnail && thumnnail.thumbnailUrl && thumnnail.canBeEmbedded) {

        const videothumbnail = await VideoThumbnail({ youtubeThumb: thumnnail.thumbnailUrl, companyId: user?.companyId ? user?.companyId : 0, formtype: "album", existingId: albumId });
        const file = {
          type: "video",
          thumnnail: (videothumbnail?.data?.filepath) ? videothumbnail?.data?.filepath : thumnnail.thumbnailUrl,
          fileUrl: thumnnail?.convertedEmbeddedUrl ? thumnnail?.convertedEmbeddedUrl : embededUrl,
          active: false,
          signedUrl: (videothumbnail?.data?.signedImgUrl) ? videothumbnail?.data?.signedImgUrl : thumnnail.thumbnailUrl,
        };

        setSelectedVideoUrls(file);
        const theFileUrls = [...portfolioVideoUrls];
        theFileUrls.push(file);
        setportfolioVideoUrls(theFileUrls);
        setErrorMessage({ field: 'source', Message: '' });
        setEmbededUrl("");
        setOpenModal(false)
        setImageUploadInprogress(false);

      } else {
        setcanEmbedded(false);
        setImageUploadInprogress(false);
      }

    } else {
      setIsValidEmbed(false);
      setImageUploadInprogress(false);
    }
  }
  const onSetUrl = (val: string) => {
    setIsValidEmbed((prev) => !prev);
    if (val && val != "") {
  const embeddedUrlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:(?:embed|live|watch\?v=|v|watch\?.+&v=|shorts)\/([a-zA-Z0-9_-]{11}))|youtu\.be\/([a-zA-Z0-9_-]{11})|vimeo\.com\/(?:channels\/[A-Za-z0-9]+\/)?(?:videos?\/)?(\d+)(?:\/([a-zA-Z0-9]+))?)/;

      const isValidEmbeddedUrl = embeddedUrlRegex.test(val);

      if (isValidEmbeddedUrl) {
        setEmbededUrl(val);
        setcanEmbedded(true);
        setIsValidEmbed(true);
      } else {
        setIsValidEmbed(false);
      }
    }
    else {
      setIsValidEmbed(false);
    }
  }

  const removeVideoUrl = (index: number) => {
    const updatedVideo = [...portfolioVideoUrls];
    updatedVideo.splice(index, 1);
    setportfolioVideoUrls(updatedVideo);
  };

  const checkvalidation = () => {
    if (imageUploadInprogress) {
      alert("Please wait upload inprogress...");
      return;
    }
    if ((portfolioVideoUrls && portfolioVideoUrls.length > 100)) {
      alert("Upload images and videos upto 20 only");
      return;
    } else if (!inputAlbumRef.current?.value) {
      alert("Please first add an Album Name");
      return;
    } else {
      setOpenModal(true);
    }
  };
  const handleAlbumNameChange = () => {
    setIsDirty(true);
    if (inputAlbumRef.current && inputAlbumRef.current.value.trim() != "") {
      setErrorMessage({ field: 'name', Message: '' });
    }
  }

  usePreventBackNavigation(isDirty);
  return (
    <>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold  header-font">Our Work</h1>
        </div>
      </div>
      <div className="sm:text-left py-6">
        <h2 className="font-bold  heading-sub-font"> {(albumId && albumId != '0') ? 'Update Album' : <div className="inline-flex"> <span>Create Album</span>  <Tooltip
          content="Albums may represent your company’s service lines, or perhaps genres of different types of work. It’s upto you!."
          className="tier_tooltip"
        >
          <svg
            className="w-4 h-4 text-gray-800 ml-2 cursor-pointer"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              fillRule="evenodd"
              d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
              clipRule="evenodd"
            />
          </svg>
        </Tooltip>{" "} </div>}

        </h2>

      </div>
      <form onSubmit={(e) => onsubmit(e)}>
        <div className="py-6 pt-0 lg:w-[800px]">
          <div>
            <div className="py-4 px-4 bg-gray-100 ">
              <div className="flex max-w-md flex-col gap-6">
                <div className="firstname">
                  <div className="mb-2 block">
                    <Label
                      htmlFor="base"
                      value="Album Name "
                      className="font-bold text-xs"
                    />
                    <span className="text-red-600 font-bold text-xs">*</span>
                  </div>
                  <TextInput
                    autoComplete="off"
                    id="base"
                    ref={inputAlbumRef}
                    onChange={handleAlbumNameChange}
                    className="focus:border-blue-300"
                    type="text"
                    sizing="md"
                  />
                  {ErrorMessage && ErrorMessage.field == 'name' &&
                    <p className="text-red-600 text-sm">{ErrorMessage.Message}</p>
                  }
                </div>
                <div className="lg:w-[450px] w-full">
                  <h1 className="font-bold default_text_color heading-sub-font pb-2">
                    Album Images and Videos (upto 100)
                    <span className="text-red-600 font-bold text-lg">*</span>
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
                      {fileSize ? <span className="font-medium text-red-500">Keep files under 7 MB each</span> :
                        <span> Keep files under 7 MB each
                        </span>
                      }
                    </li>
                  </ul>
                </div>
              </div>
              <div className="logo_image pt-3 pb-6 space-y-2">
                <button
                  // onClick={() => setOpenModal(true)}
                  onClick={() => { checkvalidation(); setFileSize(false) }}
                  type="button"
                  className="reset_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
                >Add a shared video link from YouTube or Vimeo
                  {/* Add embedded video{" "}
                  <span className="xs_mobile_hide">
                    (e.g. YouTube, Vimeo, etc) ... */}

                </button>
                {ErrorMessage && ErrorMessage.field == 'source' &&
                  <p className="text-red-600 text-sm">{ErrorMessage.Message}</p>
                }
              </div>

              <DraggableImageUploads setIsDirty={setIsDirty} imageUploadInprogress={imageUploadInprogress} setImageUploadInprogress={setImageUploadInprogress} albumId={albumId} albumName={inputAlbumRef.current && inputAlbumRef.current.value} uniqueFormId={uniqueFormId} setDeletedFilePaths={setDeletedFilePaths} deletedFilePaths={deletedFilePaths} setportfolioVideoUrls={setportfolioVideoUrls} portfolioVideoUrls={selectedVideoUrls} component={'album'} isSelectRequired={false} uploadtext={"JPG, PNG and GIF image formats only (Max 7 MB each)."} setIndexValues={setIndexValues} indexValues={indexValues} responseData={responseData} ></DraggableImageUploads>

            </div>
            {/* <div className="py-1 px-4 bg-gray-100 ">
              {portfolioVideoUrls && portfolioVideoUrls.length > 0 && (

                <div
                  className="uploading_images_bg p-2.5 rounded-sm mb-6"
                  id="browseImages"
                  style={{ display: "flex", flexWrap: "wrap" }}
                >
                  <h4 className="pb-3">Videos</h4>
                  <div className="grid grid-cols-5 gap-4 p-0">
                    {portfolioVideoUrls?.map((videoFile, index) => (
                      <div key={videoFile.type + '_' + index} className="relative border-dashed rounded-sm border-2 border-gray-400">

                        <div
                          className="relative img_view_portfolio_thumb border_none active flex"
                          key={index}
                        >
                          <img
                            // src="/video-thumb.jpg"
                            src={(videoFile?.thumnnail) ? videoFile?.thumnnail : '/video-thumb.jpg'}
                            alt=""
                            width={150}
                            height={98}
                          />
                          <div className="close_icon absolute link_color cursor-pointer flex items-center gap-2">
                            <button type="button" onClick={() => removeVideoUrl(index)}>
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
            </div> */}
          </div>
          <div className="flex flex-wrap justify-end gap-2 py-6">
            <Button
              type="button"
              className="button_cancel h-[40px] px-4 border-gray-50-100"
            >
              <Link prefetch={false} href="/company-profile/our-works?goto=1">Cancel</Link>
            </Button>
            {isLoading ?
              <div className="flex justify-center items-center">
                <Spinner />
              </div>
              :
              <Button type="submit" className="button_blue h-[40px] px-4">
                {(albumId && albumId != '0') ? 'Update' : 'Create'}
              </Button>
            }
          </div>
        </div>
      </form>
      <Modal
        size="sm"
        show={openModal}
        onClose={() => {
          setEmbededUrl("");
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
            type="button"
            color="gray"
            onClick={() => {
              setOpenModal(false), setIsValidEmbed(true); setEmbededUrl("");
            }}
            className="h-[40px]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onClickPortfolioAddVideo()}
            className={`h-[40px] button_blue ${isValidEmbed ? "" : "hidden"}`}
          >
            {imageUploadInprogress ? <ButtonSpinner></ButtonSpinner> :
              'Add Video'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
export default AlbumComponent;
