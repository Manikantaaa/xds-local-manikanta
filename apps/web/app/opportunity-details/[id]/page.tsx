"use client";
import Breadcrumbs, { CrumbItem } from "@/components/breadcrumb";

import { PATH } from "@/constants/path";
import Image from "next/image";
import { Label, Textarea, Button, Modal } from "flowbite-react";
import { createRef, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetcher, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { formatDate } from "@/services/common-methods";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { redirect } from "next/navigation";
import { isValidJSON, serviceColoring } from "@/constants/serviceColors";
import ButtonSpinner from "@/components/ui/buttonspinner";

import Link from "next/link";
import Spinner from "@/components/spinner";
import { useAuthentication } from "@/services/authUtils";
import path from "path";

type selectedImages = {
  albumId: number;
  albumName: string;
  type: string;
  checkedCount: number;
  files:{
    imagePath: string;
    imageFile: string;
    fileId: number;
    isChecked: boolean;
  }[];
}

const Opportunityview = () => {
  const [apiresponse, setApiresponse] = useState<opportunityTypes>();
  const paramsdata = useParams();
  const opportunityId = Number(paramsdata.id);
  const [mainBannerSrc, setMainBannerSrc] = useState<string>("");
  const [currentBannerType, setCurrentBannerType] = useState<string>("");
  const [isIamIntrestedAdded, SetIsIamIntrestedAdded] =
    useState<boolean>(false);
  const textareaRef = createRef<HTMLTextAreaElement>();
  const [descValid, setDescvalid] = useState<boolean>(false);
  const [breadcrumbItems, setBreadcrumbItems] = useState<CrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [onlyPdf, setOnlyPdf] = useState<boolean>(false);
  const { user } = useUserContext();
  const router = useRouter()
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [selectAlbumfiles, setSelectAlbumFiles] = useState<selectedImages[]>([]);
  const [filesCheckedCount, setFilesCheckedCount] = useState<number>(0);
  const [previewFiles, setPreviewFiles] = useState<{id: number, type: string, fileUrl:string}[]>([]);

  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });

  if (!user) {
    localStorage.setItem("viewOppDetails", opportunityId.toString());
    redirect(PATH.STATIC_PAGE.path);
  }

  useEffect(() => {
    async function getopportunityDetails() {
      const response = await fetcher(
        getEndpointUrl(ENDPOINTS.getopportunityDetails(opportunityId, Number(user?.companyId))),
      );

      if (!response.list) {
        // setIsLoading(false);
        router.replace('/404');
        return;
      } else {
        setIsLoading(false);
      }

      // if (user?.companyId !== response.list?.companyId) {
      //    router.push("/home");
      //  }
      //  else 
      // {
      setApiresponse(response.list);
      if (response.list?.FileUploads.length > 0) {

        if (response.list.FileUploads.length == 1 && response.list.FileUploads[0].type === 'file') {
          setOnlyPdf(true);
        }
        for (const file of response.list.FileUploads) {
          if (file.type === 'image' || file.type == 'video') {
            setMainBannerSrc(file.fileUrl);
            setCurrentBannerType(file.type);
            break;
          }
        }

      }
      if (response.list?.serviceProvidersIntrests.length) {
        SetIsIamIntrestedAdded(true);
      }

      setBreadcrumbItems([
        {
          label: PATH.HOME.name,
          path: PATH.HOME.path,
        },
        // {
        //   label: PATH.OPPORTUNITIES.name,
        //   path: PATH.OPPORTUNITIES.path,
        // },
        {
          label: response.list.name,
          path: "",
        },
      ]);
      //}
    }
    getopportunityDetails();

  }, [opportunityId]);

  useEffect(()=>{
    fetchInformations();
  },[]);

  const handleSourceChange = (fileurl: string, filetype: string) => {
    setMainBannerSrc(fileurl);
    setCurrentBannerType(filetype);
  };


  const { submitForm: submitOpportunitiesForm } = useCommonPostData<postData>({
    url: getEndpointUrl(ENDPOINTS.addopportunityintrest),
  });

  const saveIamIntrestedInput = async () => {
    // serviceProvidersIntrests
    setDescvalid(false);
    if (!textareaRef?.current?.value) {
      setDescvalid(true);
      return;
    } else {
      setButtonLoader(true);
 
        const filesData = selectAlbumfiles.map((album) => {
            // Filter out unchecked files
            const updatedFiles = album.files.filter((file) => file.isChecked);

            // If no checked files remain, skip this album
            if (updatedFiles.length === 0) return null;

            return {
              ...album,
              files: updatedFiles,
              checkedCount: updatedFiles.length,
            };
          })
          .filter((album): album is selectedImages => album !== null) // Ensure correct type
      const postData = {
        companyId: user?.companyId || 1,
        opportunityId: opportunityId,
        description: textareaRef?.current?.value,
        addedFiles: previewFiles.length > 0 ? filesData : [],
      };
      const result = await submitOpportunitiesForm(postData);
      if (result.data.success) {
        setButtonLoader(false);
        SetIsIamIntrestedAdded(true);
      }
      setButtonLoader(false);
    }
  };
  const [openModal, setOpenModal] = useState(false);

  async function fetchInformations() {
    if (user) {
      let albumsData: selectedImages[] = [];
      await authFetcher(
        `${getEndpointUrl(ENDPOINTS.getPortfolioAlbums(user.companyId))}`,
      )
        .then((result) => {

          if (result.success && result.data.data.length > 0) {
            for(const album of result.data.data){
              let filesData: {imagePath: string, imageFile: string, fileId: number, isChecked: boolean;}[] = [];
              album.portfolioAlbumFiles.map((file:{id: number, fileUrl: string, thumbnail: string})=>{
                filesData.push({imagePath: file.fileUrl, imageFile: file.thumbnail, fileId: file.id, isChecked: false});
              })
              albumsData.push({albumId: album.id, albumName:album.albumName, type: 'albums', files: filesData, checkedCount: 0})
            }
            // setSelectAlbumFiles((prevFiles) => [...prevFiles, ...albumsData]);
          }

          // setIsLoading(false);
        })
        .catch((err) => {
          console.log(err);
        });
        await authFetcher(
          `${getEndpointUrl(ENDPOINTS.getPortfolioProjects(user.companyId))}`,
        )
          .then((result) => {
            if (result.success && result.data.response.length > 0) {
              // let projectsData: selectedImages[] = [];
            for(const project of result.data.response){
              let filesData: {imagePath: string, imageFile: string, fileId: number, isChecked: boolean;}[] = [];
              project.FileUploads.map((file:{id: number, fileUrl: string, thumbnail: string})=>{
                filesData.push({imagePath : file.fileUrl, imageFile: file.thumbnail, fileId: file.id, isChecked: false});
              })
              albumsData.push({albumId: project.id, albumName:project.name, type: 'projects', files: filesData, checkedCount: 0})
            }
            // const allData = [...selectAlbumfiles, ...projectsData];
            // setSelectAlbumFiles(allData);
            }
          })
          .catch((err) => {
            console.log(err);
          });
          setSelectAlbumFiles(albumsData);
    };
  }

  const selectImage = (albumId: number, fileId: number, type: string) => {

    if (type == "albums") {
      setSelectAlbumFiles((prevAlbums) =>
        prevAlbums.map((album) => {
          if (album.albumId === albumId && album.type === type) {
            const updatedFiles = album.files.map((file) =>
              file.fileId === fileId
                ? { ...file, isChecked: !file.isChecked }
                : file
            );
            const newCheckedCount = updatedFiles.filter((file) => file.isChecked).length;

            return { ...album, files: updatedFiles, checkedCount: newCheckedCount };
          }

          return album;
        })
      );
    } else if(type == "projects") {
      setSelectAlbumFiles((prevAlbums) =>
        prevAlbums.map((album) => {
          if (album.albumId === albumId && album.type === type) {
            const updatedFiles = album.files.map((file) =>
              file.fileId === fileId
                ? { ...file, isChecked: !file.isChecked }
                : file
            );
            const newCheckedCount = updatedFiles.filter((file) => file.isChecked).length;

            return { ...album, files: updatedFiles, checkedCount: newCheckedCount  };
          }

          return album;
        })
      );
    }
  }

  console.log(selectAlbumfiles);

  useEffect(()=>{
    setFilesCheckedCount(selectAlbumfiles.reduce((sum, album) => sum + album.checkedCount, 0));
  }, [selectAlbumfiles]);

  const saveTheSelectedFiles = () => {
    setPreviewFiles(
      selectAlbumfiles.flatMap(album =>
        album.files
          .filter(file => file.isChecked)
          .map(file => ({
            id: album.albumId,  // Include albumId
            type: album.type,
            fileUrl: file.imageFile   // Store imageFile as fileUrl
          }))
      )
    );
    

    setOpenModal(false);
  }
  const updateToSelectedFiles = () => {
    setSelectAlbumFiles((prevAlbums) =>
      prevAlbums.map((album) => {
        const updatedFiles = album.files.map((file) => ({
          ...file,
          isChecked: previewFiles.some(
            (preview) => preview.fileUrl === file.imageFile && preview.id === album.albumId // Check both conditions
          ),
        }));

        // Count checked files
        const newCheckedCount = updatedFiles.filter((file) => file.isChecked).length;

        return {
          ...album,
          files: updatedFiles,
          checkedCount: newCheckedCount,
        };
      })
    );
    setOpenModal(true);
  }

  return (
    <>
      {
        !isLoading ?
          <div className="container px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font">
                  {apiresponse?.name}
                </h1>
              </div>
            </div>
            {(apiresponse?.FileUploads.length && apiresponse?.FileUploads.length > 0 && !onlyPdf) ? (
              <div className="lg:grid lg:grid-cols-2 gap_20">
                <div className="content ">
                  <div className="left_desc">
                    <div className="post_date py-6 space-y-1">
                      <p className="default_text_color text-sm">
                        <span className="font-bold">Posted: </span>{" "}
                        {formatDate(apiresponse?.createdAt).toString()}
                      </p>
                      <p className="default_text_color text-sm">
                        <span className="font-bold">
                          Opportunity expiry date:{" "}
                        </span>{" "}
                        {apiresponse?.expiryDate
                          ? formatDate(apiresponse?.expiryDate).toString()
                          : "None"}
                      </p>
                    </div>
                    <div className="post_date pb_15 pt-0 space-y-1">

                      <p className="default_text_color text-sm">
                        <span className="font-bold">Company:</span>{" "}
                        {apiresponse?.showCompanyName ? (apiresponse?.company?.name) : (
                          "Anonymous"
                        )}
                      </p>


                      {/* <p className="default_text_color text-sm">
                      <span className="font-bold">Contact person: </span>
                      {apiresponse?.showContactPerson ? (apiresponse?.contactPersonName) : "Anonymous"}
                    </p> */}

                      <p className="default_text_color text-sm">
                        <span className="font-bold">Industry Type: </span>{" "}
                        {/* {apiresponse?.media} */}
                        {apiresponse?.industryTypes.name}
                      </p>
                      <p className="default_text_color text-sm">
                        <span className="font-bold">Platforms: </span>
                        {apiresponse?.PlatformsOpt.length > 0
                          ? apiresponse.PlatformsOpt.map(
                            (platform) => platform.platforms.name).join(", ")
                          : "No platforms available"}
                      </p>
                      {apiresponse?.technologies &&
                        <p className="default_text_color text-sm">
                          <span className="font-bold">Tools/Technologies: </span>
                          {apiresponse?.technologies}
                        </p>
                      }
                      <p className="default_text_color text-sm">
                        <span className="font-bold">Start: </span>
                        {apiresponse?.approxStartDateCondition == "3"
                          ? formatDate(apiresponse?.approxStartDate).toString()
                          : apiresponse?.approxStartDateCondition == "1"
                            ? "To be determined"
                            : "Ongoing"}
                      </p>
                      <p className="default_text_color text-sm">
                        <span className="font-bold">End: </span>
                        {apiresponse?.approxEndDateCondition == "3"
                          ? formatDate(apiresponse?.approxEndDate).toString()
                          : apiresponse?.approxEndDateCondition == "1"
                            ? "To be determined"
                            : "Ongoing"}
                      </p>
                      <p className="default_text_color text-sm">
                        <span className="font-bold">Staff months: </span>
                        {apiresponse?.staffMonths}
                      </p>
                    </div>
                    <div className="sm:text-left pb_15">
                      <h1 className="font-bold text-gray-900 heading-sub-font">
                        Services
                      </h1>
                    </div>
                    <div className="space-y-1">
                      {apiresponse?.ServicesOpt?.map(
                        (services, index) =>
                          services.service &&
                          services.service.serviceName && (
                            <span key={`opp_services_${index}`} className="inline-block">
                              <button
                                type="button"
                                className={`text-gray-900 bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            </span>
                          ),
                      )}
                    </div>
                  </div>
                  <div className="right_desc ">
                    <p className="pb_15 py-4 text-sm default_text_color whitespace-break-spaces">
                      {apiresponse?.description && isValidJSON(apiresponse?.description) ? JSON.parse(apiresponse?.description) : apiresponse?.description}
                    </p>
                  </div>
                  <div className="">

                    {apiresponse?.FileUploads.map((pdfFile, index) =>
                      pdfFile.type === 'file' ? (

                        <Link prefetch={false} target="__blank" href={pdfFile.fileUrl} className="font-bold" key={index}>
                          <button
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                            type="button">  View Document <svg className="w-4 h-4 text-white-800 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z" />
                              <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg></button>
                        </Link>
                      ) : null
                    )}

                  </div>
                </div>
                <div className="col-start-2 pad_top_24">
                  <div className="grid gap-4">
                    {currentBannerType == "image" ? (
                      <div className="opportuniy_main_thumb">
                        <Image
                          className="h-auto max-w-full rounded-lg"
                          src={mainBannerSrc}
                          alt=""
                          width={672}
                          height={379}
                        />
                      </div>
                    ) : currentBannerType == "video" ? (
                      <video
                        controls
                        aria-label="Video player"
                        width={672}
                        height={379}
                      >
                        <source src={mainBannerSrc || ""} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : null}
                    <div className="grid grid-cols-5 gap-4">
                      {apiresponse?.FileUploads.map((files, index) =>
                        files.type == "image" ? (
                          <div
                            key={`${index}_opportunity_image_${files.type}`}
                            className="opportuniy_small_thumb"
                          >
                            <Image
                              className="h-auto max-w-full rounded-lg"
                              src={files.fileUrl}
                              alt=""
                              width={114}
                              height={66}
                              onClick={() =>
                                handleSourceChange(files.fileUrl, files.type)
                              }
                            />
                          </div>
                        ) :
                          files.type == "video" ?
                            (
                              <div key={`${index}_opportunity_video_${files.type}`}>
                                <Image
                                  className="h-auto max-w-full rounded-lg"
                                  src="/video-thumb.jpg"
                                  alt=""
                                  width={114}
                                  height={66}
                                  onClick={() =>
                                    handleSourceChange(files.fileUrl, files.type)
                                  }
                                />
                              </div>
                            ) : null,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:grid lg:grid-cols-3 sm:grid-cols-1 gap_20">
                <div className="left_desc">
                  <div className="post_date py-6 space-y-1">
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Posted:</span>{" "}
                      {formatDate(apiresponse?.createdAt).toString()}
                    </p>
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Opportunity expiry date:</span>{" "}
                      {apiresponse?.expiryDate
                        ? formatDate(apiresponse?.expiryDate).toString()
                        : "None"}
                    </p>
                  </div>
                  <div className="post_date pb_15 pt-0 space-y-1">
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Company:</span>{" "}
                      {apiresponse?.showCompanyName ? (apiresponse?.company?.name) : (
                        "Anonymous"
                      )}
                    </p>
                    {/* {apiresponse?.showContactPerson ? (
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Contact person:</span>
                      {apiresponse?.contactPersonName}
                    </p>
                  ) : null} */}
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Industry Type:</span>{" "}
                      {apiresponse?.industryTypes.name}
                    </p>
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Platform: </span>
                      {apiresponse && apiresponse?.PlatformsOpt.length > 0
                        ? apiresponse.PlatformsOpt.map(
                          (platform) => platform.platforms.name).join(", ")
                        : "No platforms available"}
                    </p>
                    {apiresponse?.technologies &&
                      <p className="default_text_color text-sm">
                        <span className="font-bold">Tools/Technologies: </span>
                        {apiresponse?.technologies}
                      </p>
                    }
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Start: </span>
                      {apiresponse?.approxStartDateCondition == "3"
                        ? formatDate(apiresponse?.approxStartDate).toString()
                        : apiresponse?.approxStartDateCondition == "1"
                          ? "To be determined"
                          : "Ongoing"}
                    </p>
                    <p className="default_text_color text-sm">
                      <span className="font-bold">End: </span>
                      {apiresponse?.approxEndDateCondition == "3"
                        ? formatDate(apiresponse?.approxEndDate).toString()
                        : apiresponse?.approxEndDateCondition == "1"
                          ? "To be determined"
                          : "Ongoing"}
                    </p>
                    <p className="default_text_color text-sm">
                      <span className="font-bold">Staff months: </span>
                      {apiresponse?.staffMonths}
                    </p>
                  </div>
                  <div className="sm:text-left pb_15">
                    <h1 className="font-bold text-gray-900 heading-sub-font">
                      Services
                    </h1>
                  </div>
                  <div className="space-y-1">
                    {apiresponse?.ServicesOpt?.map(
                      (services, index) =>
                        services.service &&
                        services.service.serviceName && (
                          <span key={`opp_services_${index}`} className="inline-block">
                            <button
                              type="button"
                              className={`text-gray-900 bg_${serviceColoring[services.service.groupId]
                                } focus:outline-none font-medium rounded-sm text-sm px-2 py-1 mr-1`}
                            >
                              {services.service.serviceName}
                            </button>
                          </span>
                        ),
                    )}
                  </div>
                </div>
                <div className="right_desc lg:col-span-2 pt-6">
                  <p className="pb_15 text-sm default_text_color whitespace-break-spaces">
                    {apiresponse?.description && isValidJSON(apiresponse?.description) ? JSON.parse(apiresponse?.description) : apiresponse?.description}
                  </p>
                </div>
                <div className="">


                  {apiresponse?.FileUploads.map((pdfFile, index) =>
                    pdfFile.type === 'file' ? (

                      <Link prefetch={false} target="__blank" href={pdfFile.fileUrl} className="font-bold" key={index}>
                        <button
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                          type="button">  View Document<svg className="w-4 h-4 text-white-800 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6Z" />
                            <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg></button>
                      </Link>
                    ) : null
                  )}

                </div>
              </div>
            )}
            <div className="py-6">
              <hr />
            </div>
            {user?.companyId === apiresponse?.companyId ?
              <div className="py-2">
                <button
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                  type="button"
                  onClick={() => router.push(`/my-opportunities/update-opportunity/${opportunityId}`)}
                >
                  Edit Opportunity
                </button>
              </div>
              :
              (user?.isPaidUser && user.userRoles[0].roleCode == 'service_provider' &&
                <div className="interested_opportunity? pb-6">
                  <div className="sm:text-left pb_15">
                    <h1 className="font-bold default_text_color heading-sub-font">
                      Interested in this opportunity?
                    </h1>
                  </div>
                  {!isIamIntrestedAdded ? (
                    <>
                      <div className="max-w-md">
                        <div className="mb-2 block">
                          <Label
                            htmlFor="comment"
                            className="text-xs font-bold"
                          >
                            Briefly describe why your company is a fit for this opportunity <span style={{ color: 'red' }}>*</span>
                          </Label>
                        </div>
                        <Textarea
                          className="focus:border-blue-300"
                          id="comment"
                          placeholder="..."
                          required
                          rows={8}
                          ref={textareaRef}
                        />
                        {descValid && (
                          <span className="text-red-600 text-xs">
                            Description Required
                          </span>
                        )}
                         <p className="text-xs text-gray-500 pt-1" >For example, please include past experience working with this company (if known), relevant creative or technical expertise, availability or resources, etc.</p>
                      </div>
                     
                      {previewFiles.length > 0 ? 
                          <>
                              <div className="sm:text-left py-6 flex gap-2 items-center">
                                <h1 className="font-bold default_text_color text-[14px]">Added Portfolio Items</h1>
                                <span className="text-[#0071C2] text-sm" style={{cursor: 'pointer'}} onClick={updateToSelectedFiles}>Edit</span>
                              </div>
                              <div className="sm:text-left pb-6 flex gap-4 items-center">
                                <h1 className="font-bold default_text_color text-[14px]">Supporting media</h1>
                              </div>
                              <div className="media_images lg:w-[40rem] pb-6">
                                <div className="grid grid-cols-3  lg:grid-cols-5 gap-x-3 gap-y-12">
                                  {previewFiles.length > 0 && previewFiles.map((previews:{id: number, type: string, fileUrl: string})=>(
                                      <>
                                        <div className="image_check_uncheck">
                                            <img src={`${previews.fileUrl}`} className="h-auto w-full rounded-sm" />                  
                                          </div>
                                      </>
                                    ))
                                  }
                                </div>
                              </div>
                          </>
                      :     
                        <div className="pt-6">
                          <a href="#" className="text-[#0071C2] text-sm" onClick={()=> setOpenModal(true)}>
                            Add Projects and Portfolio items from your profile (optional) </a>
                        </div>
                      }
                      <div className="py-6">
                        <button
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5 w-[132px]"
                          type="button"
                          onClick={saveIamIntrestedInput}
                          disabled={buttonLoader}
                        >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : <>I&apos;m Interested</>}

                        </button>
                      </div>
              
                    </>
                  ) : (
                    <>
                      <p className="font-italic">
                        Thanks for submitting you're interest in this opportunity. We have notified the company.
                      </p>
                      <p className="font-italic">
                        They will review your interest and reply to those that they feel are best suited.
                      </p>
                    </>
                  )}
                </div>
              )
              
            }
          </div>

          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
      <Modal show={openModal} onClose={() => setOpenModal(false)} size="7xl">
        <Modal.Body>
          <div className="">
            <div>
              <h2 className="text-[22px] text-[#1A1C21] font-bold">Add {selectAlbumfiles.length > 0 && filesCheckedCount > 0 ? "media - "+filesCheckedCount+"/15 max selected" :"profile items (max 15)"}</h2>
              <a href={`/serviceproviders-details/${user?.companyId}`} target="_blank" className="text-[#0071C2] text-[14px] py-6 block italic">View your profile in a new tab <svg className="w-[16px] h-[16px] text-[#0071C2]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 14v4.833A1.166 1.166 0 0 1 16.833 20H5.167A1.167 1.167 0 0 1 4 18.833V7.167A1.166 1.166 0 0 1 5.167 6h4.618m4.447-2H20v5.768m-7.889 2.121 7.778-7.778" />
              </svg>
              </a>
            </div>
            <div className="albums">
              <h2 className="text-[16px] text-[#1A1C21] font-bold">Portfolio items</h2>
              {selectAlbumfiles && selectAlbumfiles.length > 0 && selectAlbumfiles.map((album: selectedImages) => (
                  <div>
                    {album.type == "albums" && 
                    <>
                       <p className="py-6">{album.albumName}</p>
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                          {album.files.length > 0 && 
                          <>
                            {album.files.map((portfolioAlbumFile: { fileId: number, imageFile: string, isChecked: boolean})=>(
                            <div className={` ${portfolioAlbumFile.isChecked ? ' image_check_uncheck image_check_uncheck_active' : 'image_check_uncheck'}`}>
                                <img src={portfolioAlbumFile.imageFile} className="h-auto w-full rounded-sm" />
                                <button className={`img_click_check ${filesCheckedCount < 15 ?  'cursor-pointer' :(portfolioAlbumFile.isChecked ? 'cursor-pointer': 'cursor-not-allowed')}`} disabled = {filesCheckedCount > 14 && !portfolioAlbumFile.isChecked} onClick={()=>selectImage(album.albumId, portfolioAlbumFile.fileId, album.type
                                  )}>
                                  <span className="img_click_check_bg">
                                  { !portfolioAlbumFile.isChecked ? 
                                      <svg className="w-[18px] h-[18px] text-[#005EC4]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  :
                                    <svg className="w-[18px] h-[18px] text-[#007E77]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                  }
                                  </span>
                                </button>
                              </div>
                            ))}
                          </>}
                        </div>
                    </>
                    }
                  </div>
                ))}
            </div>
            <div className="project_highlights pt-6">
              <h2 className="text-[16px] text-[#1A1C21] font-bold">Images from your Project Highlights</h2>
              {selectAlbumfiles && selectAlbumfiles.length > 0 && selectAlbumfiles.map((project: selectedImages)=>(
                <>
                  {project.type == "projects" && 
                    <>
                      <p className="py-6">{project.albumName}</p>
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        {project.files.length > 0 && project.files.map((file:{fileId: number, imageFile: string, isChecked: boolean})=>(
                          <>
                            <div className={` ${file.isChecked ? 'image_check_uncheck_active image_check_uncheck' : 'image_check_uncheck'}`}>
                              <img src={file.imageFile} className="h-auto w-full rounded-sm" />
                              <button className={`img_click_check ${filesCheckedCount < 15 ?  'cursor-pointer' :(file.isChecked ? 'cursor-pointer': 'cursor-not-allowed')}`} disabled = {filesCheckedCount > 14 && !file.isChecked} onClick={()=>selectImage(project.albumId, file.fileId, project.type)}>
                                <span className="img_click_check_bg cursor-pointer">
                                  { !file.isChecked ? 
                                      <svg className="w-[18px] h-[18px] text-[#005EC4]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  :
                                      <svg className="w-[18px] h-[18px] text-[#007E77]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                  }
                                </span>
                              </button>
                            </div>
                          </>
                        ))}
                      </div>
                    </>
                  }

                </>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button color="gray" onClick={() => setOpenModal(false)} >
            Cancel
          </Button>
          <Button onClick={saveTheSelectedFiles} >Add</Button>
        </Modal.Footer>
      </Modal>
    </>

  );
};
export default Opportunityview;

export type recentlyViewedTypes = {
  viewedCompany: {
    id: number;
    slug: string,
    bannerAsset: {
      url: string;
    };
    logoAsset: {
      url: string;
    };
    name: string;
    ServicesOpt: [
      {
        service: {
          serviceName: string;
          groupId: number;
        };
      },
    ];
  }
};

export type recentlyJoinedTypes = {
  id: number;
  slug: string,
  bannerAsset: {
    url: string;
  };
  logoAsset: {
    url: string;
  };
  name: string;
  ServicesOpt: [
    {
      service: {
        serviceName: string;
        groupId: number;
      };
    },
  ];
};

export type ServicesOpt = {
  service: {
    serviceName: string;
    groupId: number;
  };
};
export type opportunityTypes = {
  id?: string;
  FileUploads: [
    {
      id: number;
      type: string;
      fileUrl: string;
      // thumbUrl: string;
    },
  ];
  ServicesOpt: [{ service: { id: number; serviceName: string, groupId: number } }];
  approxEndDate: Date;
  approxEndDateCondition: string;
  approxStartDate: Date;
  approxStartDateCondition: string;
  expiryDate: Date;
  company: { name: string; logoAsset: { url: string } };
  companyId: number;
  createdAt: Date;
  description: string;
  industryTypes: {
    name: string;
  };
  name: string;
  oppStatus: string;
  serviceProvidersIntrests: [];
  showCompanyName: true;
  showContactPerson: true;
  contactPersonName: string;
  staffMonths: 435;
  PlatformsOpt: [
    platforms: {
      platforms: any;
      name: string;
    },
  ];
  technologies: string;
};

type postData = {
  comapany_id?: number;
  opportunityId: number;
  description?: string;
};
