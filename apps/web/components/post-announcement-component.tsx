"use client";
import { Button, Label, Modal, Textarea, TextInput, Tooltip } from "flowbite-react";
import Breadcrumbs from "./breadcrumb";
import MobileSideMenus from "./mobileSideMenus";
import { PATH } from "@/constants/path";
import Spinner from "./spinner";
import DatePicker from "react-datepicker";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "react-datepicker/dist/react-datepicker.css";
import { authFetcher, authPostdata, authPut, authPutWithData, deleteItem, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Draggable } from "react-drag-reorder";
import { useUserContext } from "@/context/store";
import { redirect, useRouter } from "next/navigation";
import usePagePermissions from "@/hooks/usePagePermissions";
import { set } from "date-fns";
import { sanitizeData } from "@/services/sanitizedata";

export interface Announcement {
  id: number;
  title: string;
  description: string;
  linkUrl?: string;
  imageUrl: string;
  signedImageUrl: string;
  expiryDate: Date;
  orderValue: number;
  isArchieve: boolean;
  isDelete: boolean;
  createdAt: Date;
  isImageLoaded?: boolean;
}


const PostAnnouncementComponent = ({ announceId }: {announceId: number}) => {

  const { user, setUser } = useUserContext();
  const AnnouncementPermissions = usePagePermissions(19);
  const [openAnnouncementModel, setOpenAnnouncementModel] = useState(false);
  const [validateImageDimention, setValidateImageDimention] = useState<string>('');
  const [uploadImageSpinner, setUploadImageSpinner] = useState<boolean>(false);
  const [imageValidation, setImageValidation] = useState<string>('');
  const [imageSignedPath, setImageSignedPath] = useState<string>('');
  const [imagePath, setImagePath] = useState<string>('');

  const [postExpiryDate, setPostExpiryDate] = useState<Date>();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [openDeleteModel, setOpenDeleteModel] = useState<boolean>(false);
  const [openArchiveStatusModel, setOpenArchiveStatusModel] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState<{ id: number, status: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [announcementId, setAnnouncementId] = useState<number | null>(null);
  const [inProgress, setInProgress] = useState(false);
  const [linkedinUrlPopup, setLinkedinUrlPopup] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinUrlError, setLinkedinUrlError] = useState("");
  const [isLinkedinUrlLoading, setIsLinkedinUrlLoading] = useState(false);
  const router = useRouter();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }
  
  if (AnnouncementPermissions.isCompanyUser && !AnnouncementPermissions.canRead ) {
    // console.log(AnnouncementPermissions);
    redirect(PATH.HOME.path);
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
      label: PATH.POST_ANNOUNCEMENTS.name,
      path: PATH.POST_ANNOUNCEMENTS.path,
    },
  ];

  const {
    register,
    setValue,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      announcementTitle: "",
      eventDescription: "",
      announcementUrl: "",
      announcementImageUrl: "",
      postExpiryDate: ""
    },
  });

  const filehandle = async (file: any, type = "") => {
    setImageValidation('');
    setValidateImageDimention('');
    if (file) {
      setUploadImageSpinner(true);
      const fileNameParts = file.name.split(".");
      const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
      if (fileNameParts.length > 2) {
        const error = "Images with multiple extensions (or periods) in the file name are not allowed";
        setValidateImageDimention(error)
        setUploadImageSpinner(false);
        return;
      }
      if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg")) {
        const error = "Only PNG, JPG and JPEG foramt images are allowed";
        setValidateImageDimention(error)
        setUploadImageSpinner(false);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        const fileerror = `File size should not exceed 5MB`;
        setValidateImageDimention(fileerror);
        setUploadImageSpinner(false);
        return;
      }
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        URL.revokeObjectURL(img.src);
        const width = img.width;
        const height = img.height;
        if (width != 800 || height != 800) {
          if(type == "linkedin"){
            const resizedBlob = await resizeImage(file, 800, 800);

            if (resizedBlob) {
              const resizedFile = new File([resizedBlob], file.name, { type: file.type });
              const logoFormData = new FormData();
              logoFormData.append('sourceImage', resizedFile);
              logoFormData.append('destImagepath', "announcements");
  
              const resLogo = await authPostdata(getEndpointUrl(ENDPOINTS.uploadimageCommonMethod), logoFormData);
              if (resLogo) {
                setImageSignedPath(resLogo.fullpath);
                setUploadImageSpinner(false);
                setImagePath(resLogo.fileUrl);
              } else {
                setUploadImageSpinner(false);
              }
            } else {
              console.log("Image resizing failed");
              setUploadImageSpinner(false);
            }
          } else {
            const sizeError = "Please use an image that is in the ratio - 800px wide by 800px tall";
            setValidateImageDimention(sizeError);
            setUploadImageSpinner(false);
            return;
          }
        } else {
          const logoFormData = new FormData();
          if (file) {
            logoFormData.append('sourceImage', file);
            logoFormData.append('destImagepath', "announcements");

            const resLogo = await authPostdata(getEndpointUrl(ENDPOINTS.uploadimageCommonMethod), logoFormData);
            if (resLogo) {
              setImageSignedPath(resLogo.fullpath);
              setUploadImageSpinner(false);
              setImagePath(resLogo.fileUrl);
            } else {
              setUploadImageSpinner(false);
            }
          } else {
            setUploadImageSpinner(false);
          }
        }
      }
    }
  }

  function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
  
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject("FileReader failed to load image");
        }
      };
  
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = maxWidth;
        canvas.height = maxHeight;
      
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
      
        // Calculate cropping dimensions
        const aspectRatio = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
      
        if (aspectRatio > 1) {
          // Landscape: crop sides
          sw = img.height;
          sx = (img.width - sw) / 2;
        } else if (aspectRatio < 1) {
          // Portrait: crop top/bottom
          sh = img.width;
          sy = (img.height - sh) / 2;
        }
      
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, maxWidth, maxHeight);
      
        canvas.toBlob((blob) => {
          resolve(blob);
        }, file.type);
      };
  
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  const handleDateChange = (date: Date) => {
    const dateString = date.toLocaleDateString('en-US');
    setValue("postExpiryDate", dateString, { shouldValidate: true });
    setPostExpiryDate(date);
  };

  const onSubmit = async (formData: any) => {
    if (!imagePath) {
      setImageValidation("Default image required")
      return
    }
    formData.announcementImageUrl = imagePath;
    setInProgress(true);
    if (announcementId) {
      await authPutWithData(getEndpointUrl(ENDPOINTS.updateAnnouncement(announcementId)), sanitizeData(formData));
    } else {
      const response = await authPostdata(getEndpointUrl(ENDPOINTS.addSpAnnouncement), sanitizeData(formData));
      if (response && response.success) {
        const updatedUser = {
          ...user,
          companies: user.companies?.map((company, index) =>
            index === 0 ? { ...company, addedAnnouncement: true } : company
          ) as [typeof user.companies[0]],
        };
        setUser(updatedUser);
      }
    }
    setInProgress(false);
    closeAnnounceModal();
    getAllAnnouncement();
  }

  const getAllAnnouncement = async () => {
    setIsLoading(true);
    const result = await authFetcher(getEndpointUrl(ENDPOINTS.getAnnouncements));
    if (result && result.success) {
      if (result.data && result.data.length > 0) {
        setAnnouncements(result.data);
        if(announceId && announceId) {
          const announcement = result.data.find((item: Announcement) => item.id === announceId);
          if (announcement) {
            editAnnouncement(announcement);
            router.replace(PATH.POST_ANNOUNCEMENTS.path);
          }
        }
      } else {
        setAnnouncements([]);
      }
    }
    setIsLoading(false);
  }

  const handlePosChange = (currentPos: any, newPos: any) => {
    const items = [...announcements];
    const currentItem = items[currentPos];
    items.splice(currentPos, 1);
    items.splice(newPos, 0, currentItem);
    setAnnouncements(items);
    updateOrderValue(items);
  }

  const updateOrderValue = async (items: Announcement[]) => {
    setIsLoading(true);
    const idArr = [];
    for (let item of items) {
      idArr.push(item.id);
    }
    await authPostdata(getEndpointUrl(ENDPOINTS.updateAnnouncementOrder), { ids: idArr }).finally(() => { 
      setIsLoading(false);
    });
  }

  const deleteAnnouncement = async () => {
    if (announcementId) {
      setIsLinkedinUrlLoading(true);
      const result = await deleteItem(getEndpointUrl(ENDPOINTS.deleteAnnouncement(+announcementId)));
      if (result && result.success) {
        getAllAnnouncement();
      }
      setIsLinkedinUrlLoading(false);
      setAnnouncementId(null);
      setOpenDeleteModel(false);
    }
  }

  const setArchiveStats = (id: number, status: boolean) => {
    setArchiveStatus({ id: id, status: status });
    setOpenArchiveStatusModel(true);
  }

  const updateArchiveStatus = async () => {
    if (archiveStatus && archiveStatus.id) {
      setIsLinkedinUrlLoading(true)
      const result = await authPut(getEndpointUrl(ENDPOINTS.toggleAnnouncementArchiveStatus(archiveStatus?.id)));
      if (result && result.success) {
        getAllAnnouncement();
      }
      setIsLinkedinUrlLoading(false);
      setOpenArchiveStatusModel(false);
    }
  }

  const closeAnnounceModal = () => {
    reset();
    setImagePath("");
    setImageSignedPath("");
    setImageValidation("");
    setValidateImageDimention("");
    setOpenAnnouncementModel(false);
    setAnnouncementId(null);
    setPostExpiryDate(undefined);
  }

  useEffect(() => {
    getAllAnnouncement();
  }, []);

  const parseDateKeepLocal = (dateStr: string) => {
    const [year, month, day] = dateStr.slice(0, 10).split('-');
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const editAnnouncement = (announcement: Announcement) => {
    setAnnouncementId(announcement.id);
    setValue("announcementTitle", announcement.title);
    announcement.linkUrl ? setValue("announcementUrl", announcement.linkUrl) : setValue("announcementUrl", "");
    // setValue("announcementUrl", announcement.linkUrl);
    setValue("eventDescription", announcement.description);
    setValue("announcementImageUrl", announcement.imageUrl);
    if (announcement.expiryDate) {
      setValue("postExpiryDate", announcement.expiryDate.toString());
      setPostExpiryDate(parseDateKeepLocal(announcement.expiryDate.toString()));
    }
    setImageSignedPath(announcement.signedImageUrl);
    setImagePath(announcement.imageUrl);
    setOpenAnnouncementModel(true);
  }

  const getLinkedInData = async () => {
    try {
      setIsLinkedinUrlLoading(true);
      if (!linkedinUrl.includes('linkedin.com')) {
        setLinkedinUrlError("Invalid URL.");
        return;
      }
      const data = await authFetcher(getEndpointUrl(ENDPOINTS.getLinkedinData(encodeURIComponent(linkedinUrl))));
      if (!data.title) {
        setLinkedinUrlError("Invalid URL.");
        throw new Error(data.error || 'Something went wrong');
      }

      // setValue("announcementTitle", data.title ? data.title : "");
      setValue("announcementTitle", data.description ? getFirstParagrapth(data.description) : "");
      setValue("announcementUrl", data.url ? data.url : "");
      setValue("eventDescription", data.description ? data.description : "");
      // setValue("announcementImageUrl", announcement.imageUrl);
      if (data.expiryDate) {
        setValue("postExpiryDate", data.expiryDate.toString());
        setPostExpiryDate(new Date(data.expiryDate));
      }

      if (data.image) {
        const file = await urlToFile(data.image, "linkedinImage");
        if (file) {
          filehandle(file, "linkedin");
        }
      }
      setIsLinkedinUrlLoading(false);
      setLinkedinUrlPopup(false);
      setOpenAnnouncementModel(true);
    } catch (err: any) {
      console.log(err)
    } finally {
      setIsLinkedinUrlLoading(false);
    }
  }

  async function urlToFile(imageUrl: string, filename: string): Promise<File> {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const mimeType = blob.type;

    const allowedMimeTypes: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', // some servers may return this (non-standard but seen)
      'image/png': 'png',
    };
    const ext = allowedMimeTypes[mimeType];
    if (!ext) {
      throw new Error(`Invalid image type: ${mimeType}. Only PNG and JPG/JPEG are allowed.`);
    }
    return new File([blob], `${filename}.${ext}`, { type: mimeType });
  }

  function formatTitle(title: string) {
    if (title.length > 80) {
      return title.slice(0, 80).trim() + "...";
    }
    return title;
  }

  function getFirstParagrapth(text: string) {
    const words = text.trim().split('\n'); // split by any whitespace
    return text = words[0];
  }

  return (
    <>
      <div>
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:text-left flex align-middle items-cente">
            <MobileSideMenus></MobileSideMenus>
            <h1 className="font-bold  header-font">Post Announcements</h1>
          </div>
        </div>
        <div className="pt-6">
          <p>Post news on your company profile to grab buyer’s attention. Examples include announcing recently released games you worked on, studio openings, key hires, M&A activity, etc.</p>
        </div>
        <div className="py-6">
          { ((!AnnouncementPermissions.isCompanyUser) || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canWrite)) && 
            <><hr />
              <div className="flex justify-end">
                <div className="text-end my-6">
                  <button type="button"
                    className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2"
                    onClick={() => { setAnnouncementId(null); setOpenAnnouncementModel(true); setPostExpiryDate(undefined); }}
                  >
                    Post New Announcement
                  </button>
                </div>
                <div className="text-end my-6">
                  <button type="button"
                    className="py-2.5 px-5 pr-2 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2"
                    onClick={() => { setAnnouncementId(null); setLinkedinUrlPopup(true); setPostExpiryDate(undefined); }}
                  >
                    <span className="flex items-center gap-[0.5]">Post Announcement from LinkedIn URL
                      <Tooltip content="Share an announcement from an existing LinkedIn post or article" className="tier_tooltip">
                        <svg style={{marginTop: "0px"}} className="ms-1 -mt-0.5 w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="8" height="8 " fill="currentColor" viewBox="0 0 24 24">
                          <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.008-3.018a1.502 1.502 0 0 1 2.522 1.159v.024a1.44 1.44 0 0 1-1.493 1.418 1 1 0 0 0-1.037.999V14a1 1 0 1 0 2 0v-.539a3.44 3.44 0 0 0 2.529-3.256 3.502 3.502 0 0 0-7-.255 1 1 0 0 0 2 .076c.014-.398.187-.774.48-1.044Zm.982 7.026a1 1 0 1 0 0 2H12a1 1 0 1 0 0-2h-.01Z" clip-rule="evenodd" />
                        </svg>
                      </Tooltip>
                    </span>
                  </button>
                </div>
              </div>
            </>
          }
          {
            isLoading ?
            <div className="space-y-4 pb-6">
              <div className="left-0 right-0 text-center absolute w-[100px] m-auto"> <Spinner /> </div>
            </div>
            :
            <div className="space-y-4 pb-6">
              { 
                announcements && announcements.length > 0 ?
                <>
                  {
                    AnnouncementPermissions.isCompanyUser && !AnnouncementPermissions.canWrite ?
                    announcements.map((announcement: Announcement, index: number) => {
                      return (
                        <div key={index} className="space-y-6">
                          <div className="text-base border_list font-medium lg:flex lg:items-center">
                            <div className="flex items-center">
                              <svg className="me-2 cursor-move" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="DotsSixVertical">
                                  <path id="Vector" d="M13 7.5C13 7.79667 12.912 8.08668 12.7472 8.33336C12.5824 8.58003 12.3481 8.77229 12.074 8.88582C11.7999 8.99935 11.4983 9.02906 11.2074 8.97118C10.9164 8.9133 10.6491 8.77044 10.4393 8.56066C10.2296 8.35088 10.0867 8.08361 10.0288 7.79264C9.97094 7.50166 10.0006 7.20006 10.1142 6.92598C10.2277 6.65189 10.42 6.41762 10.6666 6.2528C10.9133 6.08797 11.2033 6 11.5 6C11.8978 6 12.2794 6.15804 12.5607 6.43934C12.842 6.72065 13 7.10218 13 7.5ZM20.5 9C20.7967 9 21.0867 8.91203 21.3334 8.74721C21.58 8.58238 21.7723 8.34811 21.8858 8.07403C21.9994 7.79994 22.0291 7.49834 21.9712 7.20737C21.9133 6.91639 21.7704 6.64912 21.5607 6.43934C21.3509 6.22956 21.0836 6.0867 20.7926 6.02882C20.5017 5.97094 20.2001 6.00065 19.926 6.11418C19.6519 6.22771 19.4176 6.41997 19.2528 6.66665C19.088 6.91332 19 7.20333 19 7.5C19 7.89783 19.158 8.27936 19.4393 8.56066C19.7206 8.84197 20.1022 9 20.5 9ZM11.5 14.5C11.2033 14.5 10.9133 14.588 10.6666 14.7528C10.42 14.9176 10.2277 15.1519 10.1142 15.426C10.0006 15.7001 9.97094 16.0017 10.0288 16.2926C10.0867 16.5836 10.2296 16.8509 10.4393 17.0607C10.6491 17.2704 10.9164 17.4133 11.2074 17.4712C11.4983 17.5291 11.7999 17.4994 12.074 17.3858C12.3481 17.2723 12.5824 17.08 12.7472 16.8334C12.912 16.5867 13 16.2967 13 16C13 15.6022 12.842 15.2206 12.5607 14.9393C12.2794 14.658 11.8978 14.5 11.5 14.5ZM20.5 14.5C20.2033 14.5 19.9133 14.588 19.6666 14.7528C19.42 14.9176 19.2277 15.1519 19.1142 15.426C19.0007 15.7001 18.9709 16.0017 19.0288 16.2926C19.0867 16.5836 19.2296 16.8509 19.4393 17.0607C19.6491 17.2704 19.9164 17.4133 20.2074 17.4712C20.4983 17.5291 20.7999 17.4994 21.074 17.3858C21.3481 17.2723 21.5824 17.08 21.7472 16.8334C21.912 16.5867 22 16.2967 22 16C22 15.6022 21.842 15.2206 21.5607 14.9393C21.2794 14.658 20.8978 14.5 20.5 14.5ZM11.5 23C11.2033 23 10.9133 23.088 10.6666 23.2528C10.42 23.4176 10.2277 23.6519 10.1142 23.926C10.0006 24.2001 9.97094 24.5017 10.0288 24.7926C10.0867 25.0836 10.2296 25.3509 10.4393 25.5607C10.6491 25.7704 10.9164 25.9133 11.2074 25.9712C11.4983 26.0291 11.7999 25.9993 12.074 25.8858C12.3481 25.7723 12.5824 25.58 12.7472 25.3334C12.912 25.0867 13 24.7967 13 24.5C13 24.1022 12.842 23.7206 12.5607 23.4393C12.2794 23.158 11.8978 23 11.5 23ZM20.5 23C20.2033 23 19.9133 23.088 19.6666 23.2528C19.42 23.4176 19.2277 23.6519 19.1142 23.926C19.0007 24.2001 18.9709 24.5017 19.0288 24.7926C19.0867 25.0836 19.2296 25.3509 19.4393 25.5607C19.6491 25.7704 19.9164 25.9133 20.2074 25.9712C20.4983 26.0291 20.7999 25.9993 21.074 25.8858C21.3481 25.7723 21.5824 25.58 21.7472 25.3334C21.912 25.0867 22 24.7967 22 24.5C22 24.1022 21.842 23.7206 21.5607 23.4393C21.2794 23.158 20.8978 23 20.5 23Z" fill="#0071C2" />
                                </g>
                              </svg>
                              <div className="pr-5">{ formatTitle(announcement.title) } { index == 0 ? " - Feature post" : "" }</div>
                            </div>
                            <div className="ms-auto text-end lg:mt-0 mt-3 flex">
                              {AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canDelete &&
                                <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setOpenDeleteModel(true); setAnnouncementId(announcement.id) }}>
                                  <Tooltip content="Delete post" className="tier_tooltip_announcement">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                      <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#E10E0E" />
                                    </svg>
                                  </Tooltip>
                                </button>
                              }
                              
                            </div>
                          </div>
                        </div>
                      )
                    })
                    :
                    <Draggable onPosChange={handlePosChange}>
                      {
                        announcements.map((announcement: Announcement, index: number) => {
                          return (
                            <div key={index} className="space-y-6">
                              <div className="text-base border_list font-medium lg:flex lg:items-center">
                                <div className="flex items-center">
                                  <svg className="me-2 cursor-move  shrink-0" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <g id="DotsSixVertical">
                                      <path id="Vector" d="M13 7.5C13 7.79667 12.912 8.08668 12.7472 8.33336C12.5824 8.58003 12.3481 8.77229 12.074 8.88582C11.7999 8.99935 11.4983 9.02906 11.2074 8.97118C10.9164 8.9133 10.6491 8.77044 10.4393 8.56066C10.2296 8.35088 10.0867 8.08361 10.0288 7.79264C9.97094 7.50166 10.0006 7.20006 10.1142 6.92598C10.2277 6.65189 10.42 6.41762 10.6666 6.2528C10.9133 6.08797 11.2033 6 11.5 6C11.8978 6 12.2794 6.15804 12.5607 6.43934C12.842 6.72065 13 7.10218 13 7.5ZM20.5 9C20.7967 9 21.0867 8.91203 21.3334 8.74721C21.58 8.58238 21.7723 8.34811 21.8858 8.07403C21.9994 7.79994 22.0291 7.49834 21.9712 7.20737C21.9133 6.91639 21.7704 6.64912 21.5607 6.43934C21.3509 6.22956 21.0836 6.0867 20.7926 6.02882C20.5017 5.97094 20.2001 6.00065 19.926 6.11418C19.6519 6.22771 19.4176 6.41997 19.2528 6.66665C19.088 6.91332 19 7.20333 19 7.5C19 7.89783 19.158 8.27936 19.4393 8.56066C19.7206 8.84197 20.1022 9 20.5 9ZM11.5 14.5C11.2033 14.5 10.9133 14.588 10.6666 14.7528C10.42 14.9176 10.2277 15.1519 10.1142 15.426C10.0006 15.7001 9.97094 16.0017 10.0288 16.2926C10.0867 16.5836 10.2296 16.8509 10.4393 17.0607C10.6491 17.2704 10.9164 17.4133 11.2074 17.4712C11.4983 17.5291 11.7999 17.4994 12.074 17.3858C12.3481 17.2723 12.5824 17.08 12.7472 16.8334C12.912 16.5867 13 16.2967 13 16C13 15.6022 12.842 15.2206 12.5607 14.9393C12.2794 14.658 11.8978 14.5 11.5 14.5ZM20.5 14.5C20.2033 14.5 19.9133 14.588 19.6666 14.7528C19.42 14.9176 19.2277 15.1519 19.1142 15.426C19.0007 15.7001 18.9709 16.0017 19.0288 16.2926C19.0867 16.5836 19.2296 16.8509 19.4393 17.0607C19.6491 17.2704 19.9164 17.4133 20.2074 17.4712C20.4983 17.5291 20.7999 17.4994 21.074 17.3858C21.3481 17.2723 21.5824 17.08 21.7472 16.8334C21.912 16.5867 22 16.2967 22 16C22 15.6022 21.842 15.2206 21.5607 14.9393C21.2794 14.658 20.8978 14.5 20.5 14.5ZM11.5 23C11.2033 23 10.9133 23.088 10.6666 23.2528C10.42 23.4176 10.2277 23.6519 10.1142 23.926C10.0006 24.2001 9.97094 24.5017 10.0288 24.7926C10.0867 25.0836 10.2296 25.3509 10.4393 25.5607C10.6491 25.7704 10.9164 25.9133 11.2074 25.9712C11.4983 26.0291 11.7999 25.9993 12.074 25.8858C12.3481 25.7723 12.5824 25.58 12.7472 25.3334C12.912 25.0867 13 24.7967 13 24.5C13 24.1022 12.842 23.7206 12.5607 23.4393C12.2794 23.158 11.8978 23 11.5 23ZM20.5 23C20.2033 23 19.9133 23.088 19.6666 23.2528C19.42 23.4176 19.2277 23.6519 19.1142 23.926C19.0007 24.2001 18.9709 24.5017 19.0288 24.7926C19.0867 25.0836 19.2296 25.3509 19.4393 25.5607C19.6491 25.7704 19.9164 25.9133 20.2074 25.9712C20.4983 26.0291 20.7999 25.9993 21.074 25.8858C21.3481 25.7723 21.5824 25.58 21.7472 25.3334C21.912 25.0867 22 24.7967 22 24.5C22 24.1022 21.842 23.7206 21.5607 23.4393C21.2794 23.158 20.8978 23 20.5 23Z" fill="#0071C2" />
                                    </g>
                                  </svg>
                                  <div className="pr-5">{ formatTitle(announcement.title) } { index == 0 ? " - Feature post" : "" }</div>
                                </div>
                                <div className="ms-auto text-end lg:mt-0 mt-3 lg:flex">
                                  <button
                                    type="button"
                                    disabled={AnnouncementPermissions.isCompanyUser && !AnnouncementPermissions.canWrite}
                                    className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100"
                                    onClick={() => { setArchiveStats(announcement.id, announcement.isArchieve); }}
                                  >
                                    {
                                      announcement.isArchieve ?
                                      <Tooltip content="Show post" className="tier_tooltip_announcement">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                          <path d="M6.73999 4.3275C6.65217 4.22851 6.54558 4.14793 6.42639 4.09044C6.3072 4.03294 6.17778 3.99968 6.04564 3.99257C5.91351 3.98546 5.78127 4.00465 5.6566 4.04902C5.53193 4.0934 5.41731 4.16207 5.31938 4.25107C5.22144 4.34007 5.14215 4.44762 5.08609 4.56749C5.03003 4.68736 4.99832 4.81717 4.9928 4.94938C4.98727 5.0816 5.00804 5.2136 5.05391 5.33772C5.09978 5.46185 5.16982 5.57564 5.25999 5.6725L7.66499 8.31875C3.12499 11.105 1.17249 15.4 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C18.2408 26.0128 20.4589 25.5514 22.5087 24.6462L25.2587 27.6725C25.3466 27.7715 25.4531 27.8521 25.5723 27.9096C25.6915 27.9671 25.8209 28.0003 25.9531 28.0074C26.0852 28.0145 26.2175 27.9953 26.3421 27.951C26.4668 27.9066 26.5814 27.8379 26.6793 27.7489C26.7773 27.6599 26.8566 27.5524 26.9126 27.4325C26.9687 27.3126 27.0004 27.1828 27.0059 27.0506C27.0115 26.9184 26.9907 26.7864 26.9448 26.6623C26.899 26.5381 26.8289 26.4244 26.7387 26.3275L6.73999 4.3275ZM12.6562 13.8075L17.865 19.5387C17.0806 19.9514 16.1814 20.0919 15.3085 19.938C14.4357 19.7842 13.6386 19.3449 13.0425 18.689C12.4464 18.0331 12.085 17.1978 12.0151 16.3143C11.9452 15.4307 12.1707 14.549 12.6562 13.8075ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86663 18.7087 3.89526 17.414 3.12499 16C3.71124 14.9012 5.58249 11.8263 9.04374 9.8275L11.2937 12.2963C10.4227 13.4119 9.97403 14.7995 10.0272 16.214C10.0803 17.6284 10.6317 18.9785 11.584 20.0256C12.5363 21.0728 13.8282 21.7496 15.2312 21.9363C16.6343 22.1231 18.0582 21.8078 19.2512 21.0462L21.0925 23.0713C19.4675 23.6947 17.7405 24.0097 16 24ZM16.75 12.0712C16.4894 12.0215 16.2593 11.8703 16.1102 11.6509C15.9611 11.4315 15.9053 11.1618 15.955 10.9012C16.0047 10.6407 16.1559 10.4105 16.3753 10.2614C16.5948 10.1123 16.8644 10.0565 17.125 10.1062C18.3995 10.3533 19.56 11.0058 20.4333 11.9664C21.3067 12.9269 21.8462 14.1441 21.9712 15.4362C21.9959 15.7003 21.9147 15.9634 21.7455 16.1675C21.5762 16.3717 21.3328 16.5003 21.0687 16.525C21.0375 16.5268 21.0062 16.5268 20.975 16.525C20.725 16.5261 20.4838 16.4335 20.2987 16.2655C20.1136 16.0976 19.9981 15.8664 19.975 15.6175C19.8908 14.758 19.5315 13.9486 18.9504 13.3097C18.3694 12.6708 17.5977 12.2364 16.75 12.0712ZM30.91 16.4075C30.8575 16.525 29.5912 19.3287 26.74 21.8825C26.6426 21.9725 26.5282 22.0423 26.4036 22.0877C26.2789 22.1331 26.1465 22.1533 26.014 22.147C25.8814 22.1407 25.7515 22.1081 25.6317 22.0511C25.5119 21.9942 25.4047 21.9139 25.3162 21.8151C25.2277 21.7162 25.1598 21.6008 25.1163 21.4754C25.0729 21.3501 25.0549 21.2173 25.0633 21.0849C25.0716 20.9525 25.1063 20.8231 25.1652 20.7042C25.2241 20.5854 25.306 20.4794 25.4062 20.3925C26.8051 19.1358 27.9801 17.6505 28.8812 16C28.1093 14.5847 27.1358 13.2891 25.9912 12.1538C23.2087 9.39875 19.8475 8 16 8C15.1893 7.99901 14.3799 8.06465 13.58 8.19625C13.4499 8.21925 13.3166 8.21626 13.1876 8.18743C13.0587 8.15861 12.9368 8.10452 12.8289 8.0283C12.721 7.95209 12.6293 7.85525 12.559 7.74338C12.4887 7.63151 12.4413 7.50683 12.4196 7.37654C12.3978 7.24625 12.402 7.11293 12.432 6.98428C12.462 6.85564 12.5172 6.73421 12.5945 6.62703C12.6717 6.51984 12.7694 6.42901 12.8819 6.3598C12.9944 6.29058 13.1195 6.24434 13.25 6.22375C14.1589 6.07367 15.0787 5.99883 16 6C20.36 6 24.3212 7.6575 27.4575 10.7937C29.8112 13.1475 30.87 15.4963 30.9137 15.595C30.9706 15.7229 31 15.8613 31 16.0012C31 16.1412 30.9706 16.2796 30.9137 16.4075H30.91Z" fill="#8899A8" />
                                        </svg>
                                      </Tooltip>
                                      :
                                      <Tooltip content="Hide post" className="tier_tooltip_announcement">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                          <path d="M30.9137 15.595C30.87 15.4963 29.8112 13.1475 27.4575 10.7937C24.3212 7.6575 20.36 6 16 6C11.64 6 7.67874 7.6575 4.54249 10.7937C2.18874 13.1475 1.12499 15.5 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C20.36 26 24.3212 24.3425 27.4575 21.2075C29.8112 18.8538 30.87 16.5062 30.9137 16.4075C30.9706 16.2796 31 16.1412 31 16.0012C31 15.8613 30.9706 15.7229 30.9137 15.595ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86704 18.7084 3.89572 17.4137 3.12499 16C3.89551 14.5862 4.86686 13.2915 6.00874 12.1562C8.79124 9.39875 12.1525 8 16 8C19.8475 8 23.2087 9.39875 25.9912 12.1562C27.1352 13.2912 28.1086 14.5859 28.8812 16C27.98 17.6825 24.0537 24 16 24ZM16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88377 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7573 20.2426C12.5965 21.0818 13.6656 21.6532 14.8294 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3924 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.1159 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0768 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8863 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20Z" fill="#0071C2" />
                                        </svg>
                                      </Tooltip>
                                    }
                                  </button>
                                  <button disabled={AnnouncementPermissions.isCompanyUser && !AnnouncementPermissions.canWrite} type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { editAnnouncement(announcement); }}>
                                    <Tooltip content="Edit post" className="tier_tooltip_announcement">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                        <path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" fill="#0071C2" />
                                      </svg>
                                    </Tooltip>
                                  </button>
                                  {((!AnnouncementPermissions.isCompanyUser) || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canDelete)) &&
                                    <button  type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setOpenDeleteModel(true); setAnnouncementId(announcement.id) }}>
                                      <Tooltip content="Delete post" className="tier_tooltip_announcement">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                          <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#E10E0E" />
                                        </svg>
                                      </Tooltip>
                                    </button>
                                  }
                                  
                                </div>
                              </div>
                            </div>
                          )
                        })
                      }
                    </Draggable>
                  }
                </>
                :
                <>
                  <div className="pt-6 text-center">
                    <p className="text-sm font-normal italic">
                      It looks like you don't have any Announcements yet.
                      <br />
                      You can use Announcements to share latest news about your company.
                    </p>
                    { ((!AnnouncementPermissions.isCompanyUser) || (AnnouncementPermissions.isCompanyUser && AnnouncementPermissions.canWrite)) && 
                      <p className="pt-6 text-sm font-normal">
                        <button className="link_color underline"
                          onClick={() => { setAnnouncementId(null); setOpenAnnouncementModel(true); setPostExpiryDate(undefined); }}>
                          Click here to post an Announcement
                        </button>
                      </p>
                    }
                  </div>
                </>
              }
            </div>
          }
        </div>

        <Modal show={openAnnouncementModel} onClose={closeAnnounceModal} size="lg" className="text_box_readuce add_advertisement">
          <Modal.Header className="modal_header"> {announcementId ? "Update Announcement" : "Post Announcement"}  </Modal.Header>
          <form className="overflow-auto flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
            <Modal.Body className="m-auto">
              <div>
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="announcementTitle" value="Announcement Title" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <TextInput {...register("announcementTitle", ({
                  required: {
                    value: true,
                    message: "Announcement title required"
                  }
                }))} type="text" placeholder="" shadow sizing="sm" />
                <p className="text-red-600 text-xs">
                  {errors?.announcementTitle?.message}
                </p>
              </div>

              <div className="mt-1">
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="eventDescription" value="Announcement Description" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <Textarea {...register("eventDescription", ({
                  required: {
                    value: true,
                    message: "Announcement title required"
                  }
                }))} placeholder="" shadow rows={10} />
                <p className="text-red-600 text-xs">
                  {errors?.eventDescription?.message}
                </p>
              </div>

              <div className="mt-1">
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="announcementUrl" value="Announcement URL" className="font-bold text-xs" />
                  {/* <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span> */}
                </div>
                <TextInput {...register("announcementUrl")} type="text" placeholder="" shadow sizing="sm" />
                {/* <p className="text-red-600 text-xs">
                  {errors?.announcementUrl?.message}
                </p> */}
              </div>

              <div className="mt-1">
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="banner" value="Announcement Image" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <p className="text-xs"> For best results, We recommend 800px by 800px. Please keep the file size under 5MB.</p>
                <div className="relative mt-2">
                  <label htmlFor="annoucement-expiry-date"
                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Announcement Image
                  </label>
                  <input id="annoucement-expiry-date" type="file"
                    onChange={(e) => filehandle(e.target.files && e.target.files.length > 0 ? e.target.files[0] : "")}
                    accept="image/*"
                  />
                  <p className="text-red-600 text-xs">
                    {imageValidation}
                  </p>
                  <p className="text-red-600 text-xs">
                    {validateImageDimention}
                  </p>
                  {uploadImageSpinner && <div className="top-3 absolute left-36"> <Spinner /></div>}
                  {
                    !uploadImageSpinner &&
                    <img
                      className="mt-2"
                      src={imageSignedPath}
                      width={160}
                    />
                  }
                </div>
              </div >

              <div className="mt-1">
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="postExpiryDate" value="Post Expiry Date" className="font-bold text-xs" />
                  {/* <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span> */}
                </div>
                <DatePicker
                  autoComplete="off"
                  minDate={new Date()}
                  className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                  {...register("postExpiryDate")}
                  selected={postExpiryDate}
                  onChange={(date: Date) => {
                    handleDateChange(date);
                  }}
                />
                {/* <p className="text-red-600 text-xs">
                  {errors?.postExpiryDate?.message}
                </p> */}
              </div>
            </Modal.Body >
            <Modal.Footer className="modal_footer">
              <Button color="gray" onClick={closeAnnounceModal}> Cancel</Button>
              <Button type="submit" isProcessing={inProgress}> {announcementId ? "Update" : "Add"} </Button>
            </Modal.Footer>
          </form >
        </Modal >

        <Modal
          show={openArchiveStatusModel}
          onClose={() => { setOpenArchiveStatusModel(false); }}
          size="sm"
        >
          <Modal.Header className="modal_header">
            <b>Are you sure?</b>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-6">
              <div className="">
                <p className="text-sm default_text_color font-normal leading-6">
                  {archiveStatus && archiveStatus.status ? 'You are about to show the Announcement' : 'You are about to hide the Announcement'}
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button
              color="gray"
              className="h-[40px] button_cancel"
              isProcessing={isLinkedinUrlLoading}
              onClick={() => {
                setOpenArchiveStatusModel(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-[40px] button_blue"
              onClick={updateArchiveStatus}
            >
              Yes
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={openDeleteModel}
          onClose={() => { setOpenDeleteModel(false); setAnnouncementId(null); }}
          size="sm"
        >
          <Modal.Header className="modal_header">
            <b>Are you sure?</b>
          </Modal.Header>
          <Modal.Body>
            <div className="space-y-6">
              <div className="">
                <p className="text-sm default_text_color font-normal leading-6">
                  You are about to delete the announcement
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button
              color="gray"
              className="h-[40px] button_cancel"
              onClick={() => {
                setOpenDeleteModel(false);
                setAnnouncementId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-[40px] button_blue"
              onClick={deleteAnnouncement}
              isProcessing={isLinkedinUrlLoading}
            >
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal
          show={linkedinUrlPopup}
          onClose={() => { setLinkedinUrlPopup(false), setLinkedinUrlError(""); }}
          size="sm"
        >
          <Modal.Header className="modal_header">
            <b>Post Announcement</b>
          </Modal.Header>
          <Modal.Body>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="eventDescription" value="Linkedin URL" className="font-bold text-xs" />
              </div>
              <TextInput type="text" onChange={(e) => { setLinkedinUrl(e.target.value); setLinkedinUrlError(""); }} placeholder="Paste the LinkedIn URL here" shadow sizing="sm" />
              {
                linkedinUrlError && linkedinUrlError != "" &&
                <p className="text-red-600 text-xs pt-0.5">
                  {linkedinUrlError}
                </p>
              }
            </div>
          </Modal.Body>
          <Modal.Footer className="modal_footer">
            <Button
              color="gray"
              className="h-[40px] button_cancel"
              onClick={() => {
                setLinkedinUrlPopup(false), setLinkedinUrlError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-[40px] button_blue"
              isProcessing={isLinkedinUrlLoading}
              onClick={getLinkedInData}
            >
              Next
            </Button>
          </Modal.Footer>
        </Modal>

      </div>
    </>
  );

}

export default PostAnnouncementComponent;