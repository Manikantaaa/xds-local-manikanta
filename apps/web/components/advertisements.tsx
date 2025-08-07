import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Modal, Label, TextInput, Tooltip, Select, Spinner } from "flowbite-react";
import { authFetcher, authPostdata, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import "/public/css/detatable.css";
import { formatDate, getUTCDateFormatEndTime, getUTCDateFormatStartTime } from "@/services/common-methods";
import { useUserContext } from "@/context/store";
import { sanitizeData } from "@/services/sanitizedata";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useFormUpdate from "@/hooks/useFormUpdate";
import Link from "next/link";
// import Spinner from "./spinner";

interface adFieldsTypes {
  id?: number;
  companyName: string;
  adImagePath: string;
  mobileAdImagePath: string;
  adURL: string;
  adPage: string;
  startDate: Date;
  endDate: Date;
  isArchieve: boolean;
  signedImgUrl?: string;
  mbSignedImgUrl?: string;
  logoSignedImgUrl?: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  clicksReceived?: number | undefined;
}
interface tableFieldsTypes {
  id: number;
  companyName: string;
  adImagePath: string;
  mobileAdImagePath: string;
  adURL: string;
  adURLStaticPage: string | null;
  adPage: string;
  startDate: Date;
  endDate: Date;
  isArchieve: boolean;
  signedImgUrl: string;
  mbSignedImgUrl: string;
  logoSignedImgUrl: string;
  createdAt: Date;
  updatedAt: Date;
  clicksReceived: number;
}

const AdvertisementsContent = () => {

  const [adPage, setAdPage] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [adImagePath, setAdImagePath] = useState<string>('');
  const [adSigndeUrl, setAdSigndeUrl] = useState<string>('');
  const [mbAdImagePath, setMbAdImagePath] = useState<string>('');
  const [mbAdSigndeUrl, setMbAdSigndeUrl] = useState<string>('');
  const [adURL, setAdURL] = useState<string>('');
  const [adStaticPageURL, setAdStaticPageURL] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [stringStartDate, setStringStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<Date>();
  const [stringEndDate, setStringEndDate] = useState<string>('');
  const [openAdsModal, setOpenAdsModal] = useState<boolean>(false);
  const [validateWebDimension, setValidateWebDimension] = useState<string>('');
  const [validateMbDimension, setValidateMbDimension] = useState<string>('');
  const [display, setDisplay] = useState<boolean>(false);
  const [allAds, setAllAds] = useState<tableFieldsTypes[]>([]);
  const [adId, setAdId] = useState<number>(0);
  const [uploadSpinner, setUploadSpinner] = useState<boolean>(false);
  const [uploadMbSpinner, setUploadMbSpinner] = useState<boolean>(false);
  const [validating, setvalidating] = useState<string>('');
  const [isUpdateNote, setIsUpdateNote] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDisplayModel, setOpenDisplayModel] = useState(false);

  const [logoImagePath, setLogoImagePath] = useState<string>('');
  const [logoSigndeUrl, setLogoSigndeUrl] = useState<string>('');
  const [uploadLogoSpinner, setUploadLogoSpinner] = useState<boolean>(false);
  const [validateLogoDimension, setValidateLogoDimension] = useState<string>('');

  const { user } = useUserContext();

  useEffect(() => {
    setIsLoading(true);
    getAllAdsList();
  }, []);

  const getAllAdsList = async () => {
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getAllAds)}`)
      .then((result) => {
        if (result) {
          setAllAds(result);
          setIsLoading(false);
        }
      }).catch((err) => {
        console.log(err);
        setIsLoading(false);
      })
  };

  const tableHeaderstyle = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F4FA",
      },
    },
  };

  const archieveAd = (rowData: tableFieldsTypes) => {

    setAdId(rowData.id ? rowData.id : 0);
    setAdPage(rowData.adPage);
    setCompanyName(rowData.companyName);
    setAdImagePath(rowData.adImagePath);
    setAdURL(rowData.adURL);
    setAdStaticPageURL(rowData.adURLStaticPage ? rowData.adURLStaticPage : "");
    setStringStartDate(formatDate(rowData.startDate));
    setStringEndDate(formatDate(rowData.endDate));
    setOpenDisplayModel(true);
    setvalidating('');
    setvalidating('');
    setDisplay(rowData.isArchieve);
  }

  const displayAd = () => {
    let updateNote = {
      type: 'live', postdata: {
        companyName: companyName,
        adImagePath: adImagePath,
        adURL: adURL,
        adPage: adPage,
        startDate: stringStartDate,
        endDate: stringEndDate,
        isArchieve: display,
      }
    }
    updateNote = sanitizeData(updateNote);
    authPutWithData(`${getEndpointUrl(ENDPOINTS.updateAd(+adId))}`, updateNote)
      .then((result) => {
        if (result) {
          if (result.success == false) {
            setvalidating('A maximum of 4 ads were already present within the selected date range. Please select different dates');
          } else {
            getAllAdsList();
            setOpenDisplayModel(false);
          }

        }
      }).catch((err) => {
        console.log(err);
        setOpenDisplayModel(false);
      });
  }

  const deleteAdvertisement = (id: number) => {
    if (confirm("Are you sure want to delete this Ad")) {
      deleteItem(`${getEndpointUrl(ENDPOINTS.deleteAd(+id))}`).then(() => {
        getAllAdsList();
      });
    }
  }

  const updateAds = (rowData: tableFieldsTypes) => {
    setAdId(rowData.id ? rowData.id : 0);
    setAdPage(rowData.adPage);
    setCompanyName(rowData.companyName);
    setAdImagePath(rowData.adImagePath);
    setMbAdImagePath(rowData.mobileAdImagePath);
    setAdURL(rowData.adURL);
    setAdStaticPageURL(rowData.adURLStaticPage ? rowData.adURLStaticPage : "");
    setAdSigndeUrl(rowData.signedImgUrl ? rowData.signedImgUrl : '');
    setMbAdSigndeUrl(rowData.mbSignedImgUrl ? rowData.mbSignedImgUrl : '');
    setLogoSigndeUrl(rowData.logoSignedImgUrl ? rowData.logoSignedImgUrl : '');
    setStartDate(rowData.startDate);
    const newstart = rowData.startDate ? new Date(rowData.startDate).toLocaleDateString('en-US') : '';
    setStringStartDate(newstart);
    setEndDate(rowData.endDate);
    const newend = rowData.endDate ? new Date(rowData.endDate).toLocaleDateString('en-US') : '';
    setStringEndDate(newend);
    setOpenAdsModal(true);
    setDisplay(rowData.isArchieve);
    setvalidating('');
    setValidateMbDimension('');
    setValidateWebDimension('');
  }

  const columns = [
    {
      id: "created",
      name: "Date Created",
      cell: (row: tableFieldsTypes) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);

        // Compare the Date objects
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      id: "updated",
      name: "Last Updated",
      cell: (row: tableFieldsTypes) => formatDate(row.updatedAt),
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => {
        const dateA = new Date(a.updatedAt);
        const dateB = new Date(b.updatedAt);

        // Compare the Date objects
        return dateA.getTime() - dateB.getTime();
      },
    },
    {
      id: "company",
      name: "Company Name",
      cell: (row: tableFieldsTypes) => row.companyName,
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => a.companyName.localeCompare(b.companyName),
    },
    {
      id: "image",
      name: "Ad Image",
      cell: (row: tableFieldsTypes) => (
        <div className="text-blue-300">
          <img
            src={row.signedImgUrl || "/circle-no-image-available.jpg"}
            className="w-16"
            alt=""
          />
        </div>
      ),
    },
    {
      id: "url",
      name: "URL",
      cell: (row: tableFieldsTypes) =>
      (<Link target="_blank" className="link_color whte_nowrap" href={row.adURL ? (row.adURL.startsWith('http://') || row.adURL.startsWith('https://') ? row.adURL : `https://${row.adURL}`) : '#'} >{row.adURL}

      </Link>),
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => a.adURL.localeCompare(b.adURL),
    },
    {
      id: "page",
      name: "Ad Page",
      cell: (row: tableFieldsTypes) => row.adPage === "home" ? 'Home Page' : 'Service Provider',
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => a.adPage.localeCompare(b.adPage),
    },
    {
      id: "duration",
      name: "Date Range",
      cell: (row: tableFieldsTypes) =>

        formatDate(row.startDate) + ' - ' + formatDate(row.endDate),

      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      id: "updatedAt",
      name: "Clicks Received",
      cell: (row: tableFieldsTypes) => row.clicksReceived,
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => new Date(a.clicksReceived).getTime() - new Date(b.clicksReceived).getTime(),
    },
    {
      id: "status",
      name: "Status",
      cell: (row: tableFieldsTypes) => (
        <div>
          {/* orange_c, red_c, green_c */}
          <button> 
            <svg
              className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${row.isArchieve ? "red_c" : (getUTCDateFormatStartTime(row.startDate) <= getUTCDateFormatEndTime(new Date()) && getUTCDateFormatEndTime(row.endDate) >= getUTCDateFormatEndTime(new Date()) ? 'green_c' : (getUTCDateFormatStartTime(row.startDate) > getUTCDateFormatEndTime(new Date())) ? 'orange_c' : "red_c")
                }`}
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m12 20c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8-4.41828 0-8 3.58172-8 8 0 4.4183 3.58172 8 8 8z" />
            </svg>
          </button>
          {row.isArchieve ? "Archived" :  (getUTCDateFormatStartTime(row.startDate) <= getUTCDateFormatEndTime(new Date()) && getUTCDateFormatEndTime(row.endDate) >= getUTCDateFormatEndTime(new Date()) ? 'Live' : (getUTCDateFormatStartTime(row.startDate) > getUTCDateFormatEndTime(new Date())) ? 'Not Started' : "Expired")}
          {/* { getUTCDateFormatStartTime(row.startDate) < getUTCDateFormatEndTime(new Date()) &&  getUTCDateFormatStartTime(row.endDate) < getUTCDateFormatEndTime(new Date()) ? 'Not Started' : getUTCDateFormatEndTime(row.endDate) < getUTCDateFormatEndTime(new Date()) ? 'Expired' : (row.isArchieve ? "Archived" : "Live")} */}
        </div>
      ),
      sortable: true,
      sortFunction: (a: tableFieldsTypes, b: tableFieldsTypes) => {
        const getStatus = (row: tableFieldsTypes) => {
          if (getUTCDateFormatStartTime(row.startDate) > getUTCDateFormatEndTime(new Date())) {
            return "NotStarted";
          } else if (new Date(new Date(row.endDate).setHours(23, 59, 59, 999)) < new Date()) {
            return "Expired";
          } else if (row.isArchieve) {
            return "Archived";
          } else {
            return "Live";
          }
        };

        const statusOrder = { Live: 0, Archived: 1, NotStarted: 2, Expired: 3 };
        const statusA = getStatus(a);
        const statusB = getStatus(b);

        if (statusOrder[statusA] < statusOrder[statusB]) {
          return 1;
        } else if (statusOrder[statusA] > statusOrder[statusB]) {
          return -1;
        }
        return 'Live'.localeCompare('Archived');
      },
    },

    {
      id: "actions",
      name: "Actions",
      cell: (row: tableFieldsTypes) => (
        <div>
          <>
            {row.isArchieve ? (
              <button onClick={() => { archieveAd(row) }}>
                <Tooltip content="Live">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 green_c`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                  </svg>
                </Tooltip>
              </button>
            ) : (
              <button onClick={() => { archieveAd(row) }}>
                <Tooltip content="Archive">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 red_c`}
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                  </svg>
                </Tooltip>
              </button>
            )}

            <button className="text-blue-300 mr-1.5" onClick={(e) => { e.preventDefault(); updateAds(row); setIsUpdateNote(true); }}>
              <Tooltip content="Edit">
                {" "}
                <svg className="w-3.5 h-3.5 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z"></path></svg>
              </Tooltip>
            </button>
            <button onClick={() => deleteAdvertisement(row.id)}>
              <Tooltip content="Delete">
                {" "}
                <svg
                  className="me-2 w-4 h-4 blue_c  dark:text-white"
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
                  />
                </svg>
              </Tooltip>
            </button>
          </>
        </div>
      ),
      // <button className='btn btn-success' onClick={() => handleButtonClick(row)}>Click Me</button>,
    },
  ];

  async function openAddNewAdModal() {
    setUploadMbSpinner(false);
    setvalidating('');
    setAdPage('home');
    setCompanyName('');
    setAdImagePath('');
    setAdURL('');
    setAdStaticPageURL('');
    setAdSigndeUrl('');
    setMbAdSigndeUrl('');
    setStartDate(undefined);
    setEndDate(undefined);
    setStringEndDate('');
    setStringStartDate('');
    setValidateMbDimension('');
    setValidateWebDimension('');
    setOpenAdsModal(true);
    setLogoSigndeUrl('');
    setValidateLogoDimension('');
  }

  async function addNewNote() {
    const isValidForm = checkValidityOfNotesForm();
    if (!isValidForm) {
      setvalidating('All fields are required');
      return;
    };
    if(adPage == "home" && adStaticPageURL == "") {
      setvalidating('All fields are required');
      return;
    }
    let addedNewNote = {
      companyName: companyName,
      adImagePath: adImagePath,
      mobileAdImagePath: mbAdImagePath,
      logoImagePath: logoImagePath,
      adURL: adURL,
      adURLStaticPage: adStaticPageURL,
      adPage: adPage,
      startDate: stringStartDate,
      endDate: stringEndDate,
      isArchieve: false,
    }
    addedNewNote = sanitizeData(addedNewNote);
    await authPostdata(`${getEndpointUrl(ENDPOINTS.savingAdsData)}`, addedNewNote)
      .then((res) => {
        if (res.success == false) {
          setvalidating('A maximum of 4 ads were already present within the selected date range. Please select different dates');
        } else {
          getAllAdsList();
          setOpenAdsModal(false);
        }
      }).catch((err) => {
        console.log(err);
        setvalidating('There was an error, Please try again.');
        setTimeout(() => {
          setOpenAdsModal(false);
          setvalidating('');
        }, 2000);

      });

  }

  async function updateNote() {
    const isValidForm = checkValidityOfNotesForm();
    if (!isValidForm) {
      setvalidating('All fields are required');
      return;
    }
    if(adPage == "home" && adStaticPageURL == "") {
      setvalidating('All fields are required');
      return;
    }
    if (validating && validating != '') {
      return;
    }
    let updateNote = {
      type: '', postdata: {
        companyName: companyName,
        adImagePath: adImagePath,
        mobileAdImagePath: mbAdImagePath,
        logoImagePath: logoImagePath,
        adURL: adURL,
        adURLStaticPage: adStaticPageURL,
        adPage: adPage,
        startDate: stringStartDate,
        endDate: stringEndDate,
        isArchieve: display,
      }
    }
    updateNote = sanitizeData(updateNote);
    await authPutWithData(`${getEndpointUrl(ENDPOINTS.updateAd(adId))}`, updateNote)
      .then((result) => {
        if (result) {
          if (result.success == false) {
            setvalidating('A maximum of 4 ads were already present within the selected date range. Please select different dates');
          } else {
            getAllAdsList();
            setOpenAdsModal(false);
          }

        }
      }).catch((err) => {
        console.log(err);
        setOpenAdsModal(false);
      });

  }

  function checkValidityOfNotesForm(): boolean {
    if ((adPage && adPage == "") || adImagePath == "" || companyName == "" || mbAdImagePath == "" || adURL == "" || !startDate || !endDate) {
      // setIsValidNotesFormData(false);
      return false;
    } else {
      // setIsValidNotesFormData(true);
      return true;
    }
  }

  const handleDateChange = (date: Date, inputfrom: string) => {
    if (inputfrom == 'start') {
      console.log(endDate);
      if (endDate && (new Date(endDate) < new Date(date))) {
        setvalidating('Start date must be less than end date');
      } else {
        const dateString = date.toLocaleDateString('en-US');
        setStringStartDate(dateString);
        setStartDate(date);
        setvalidating('');
      }

    } else if (inputfrom == 'approxEndDate') {

      if (startDate && (new Date(startDate) > new Date(date))) {
        setvalidating('End date must be grater than start date');
      } else {
        const dateString = date.toLocaleDateString('en-US');
        setStringEndDate(dateString);
        setEndDate(date);
        setvalidating('');
      }

    }
  };
  const { submitForm: submitImageForm } = useFormUpdate<FormData>({
    url: getEndpointUrl(ENDPOINTS.uploadBannerAdsImage),
  });

  const setvalues = () => {
    setUploadSpinner(false);
    setUploadMbSpinner(false);
    setUploadLogoSpinner(false);
  }

  const filehandle = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: string,
  ) => {
    setvalidating('');
    setValidateMbDimension('');
    setValidateWebDimension('');
    setValidateLogoDimension('');
    const file: any = e.target.files;
    if (file && file.length > 0) {
      if (type === "web") {
        setUploadSpinner(true);
      } else if(type == "logo"){
        setUploadLogoSpinner(true);
      } else {
        setUploadMbSpinner(true);
      }

      const fileNameParts = file[0].name.split(".");
      const fileExtension =
        fileNameParts[fileNameParts.length - 1].toLowerCase();
      if (fileNameParts.length > 2 && type == "web") {
        setValidateWebDimension("Images with multiple extensions (or periods) in the file name are not allowed");
        setvalues();
        return;
      } else if(fileNameParts.length > 2 && type == "mobile") {
        setValidateMbDimension("Images with multiple extensions (or periods) in the file name are not allowed");
        setvalues();
        return
      } else if(fileNameParts.length > 2 && type == "logo") {
        setValidateLogoDimension("Images with multiple extensions (or periods) in the file name are not allowed");
        setvalues();
      }


      if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg" && type =="web")) {
        setValidateWebDimension("Only PNG, JPG and JPEG foramt images are allowed");
        setvalues();
        return;
      } else if((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg" && type =="mobile")){
        setValidateMbDimension("Only PNG, JPG and JPEG foramt images are allowed");
        setvalues();
        return;
      } else if((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg" && type =="logo")) {
        setValidateLogoDimension("Only PNG, JPG and JPEG foramt images are allowed");
        setvalues();
      }

      if (file.size > 5 * 1024 * 1024 && type == "web") {
        setValidateWebDimension(`File size should not exceed 5MB`);
        setvalues();
        return;
      } else if(file.size > 5 * 1024 * 1024 && type == "mobile"){
        setValidateMbDimension(`File size should not exceed 5MB`);
        setvalues();
        return;
      } else if(file.size > 5 * 1024 * 1024 && type == "logo"){
        setValidateLogoDimension(`File size should not exceed 5MB`);
        setvalues();
        return;
      }
      const img = new window.Image();
      img.src = URL.createObjectURL(file[0]);
      img.onload = async () => {
        URL.revokeObjectURL(img.src);
        const width = img.width;
        const height = img.height;
        // const isSixteenNine = Math.abs(aspectRatio - (64 / 5)) < 0.01;
        if (adPage == "home") {
          if (type === "web" && (width !== 1920 || height !== 150)) {
            setValidateWebDimension('Please use an image that is in the ratio - 1920px wide by 150px tall');
            setvalues();
            return;
          }
          else if (type === "mobile" && (width !== 430 || height !== 70)) {
            setValidateMbDimension('Please use an image that is in the ratio - 430px wide by 70px tall');
            setvalues();
            return;
          } else if (type === "logo" && (width !== 100 || height !== 100)) {
            setValidateLogoDimension('Please use an image that is in the ratio - 100px wide by 100px tall');
            setvalues();
            return;
          } else {
            const logoFormData = new FormData();
            if (file && file[0]) {
              logoFormData.append("files", file[0]);
              logoFormData.append("companyId", user?.companyId ? user?.companyId.toString() : '1');
              const resLogo = await submitImageForm(logoFormData);
              if (resLogo && resLogo.status === 200) {
                if (type === "web") {
                  setAdImagePath(resLogo.data.data.fileUrls[0]);
                  setAdSigndeUrl(resLogo.data.data.signdeUrls[0]);
                  setUploadSpinner(false);
                } else if(type == "mobile") {
                  setMbAdImagePath(resLogo.data.data.fileUrls[0]);
                  setMbAdSigndeUrl(resLogo.data.data.signdeUrls[0]);
                  setUploadMbSpinner(false);
                } else {
                  setLogoImagePath(resLogo.data.data.fileUrls[0]);
                  setLogoSigndeUrl(resLogo.data.data.signdeUrls[0]);
                  setUploadLogoSpinner(false);
                }

              }
            }
          }
        }
        else if (adPage == "serviceProvider") {
          if (type === "web" && (width !== 320 || height !== 120)) {
            setValidateWebDimension('Please use an image that is in the ratio - 320px wide by 120px tall');
            setUploadSpinner(false);
            setUploadMbSpinner(false);
            return;
          }
          else if (type === "mobile" && (width !== 430 || height !== 70)) {
            setValidateMbDimension('Please use an image that is in the ratio - 430px wide by 70px tall');
            setUploadSpinner(false);
            setUploadMbSpinner(false);
          }
          else {
            const logoFormData = new FormData();
            if (file && file[0]) {
              logoFormData.append("files", file[0]);
              logoFormData.append("companyId", user?.companyId ? user?.companyId.toString() : '1');
              const resLogo = await submitImageForm(logoFormData);
              if (resLogo && resLogo.status === 200) {
                if (type === "web") {
                  setAdImagePath(resLogo.data.data.fileUrls[0]);
                  setAdSigndeUrl(resLogo.data.data.signdeUrls[0]);
                  setUploadSpinner(false);
                } else {
                  setMbAdImagePath(resLogo.data.data.fileUrls[0]);
                  setMbAdSigndeUrl(resLogo.data.data.signdeUrls[0]);
                  setUploadMbSpinner(false);
                }

              }
            }
          }
        }
        else {
          setUploadSpinner(false);
          setUploadMbSpinner(false);
          return;
        }
      }
    }
  }

  return (
    <>
      <div className="flex items-center justify-between pb-6">
        <div className="text-left">
          <h1 className="font-bold default_text_color header-font">
            Advertisements
          </h1>
        </div>
        <div className="link_color text-sm cursor-pointer" onClick={() => { setIsUpdateNote(false); openAddNewAdModal(); }}>
          <svg className="w-3.5 h-3.5 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z"></path></svg>
          Add Advertisement
        </div>
      </div>
      {!isLoading ?
        <div className="py-0">
          {allAds && allAds.length > 0 ?
            <DataTable
              customStyles={tableHeaderstyle}
              columns={columns}
              data={allAds}
              highlightOnHover={true}
              defaultSortFieldId="created" // Specify the default sorted column (e.g., 'name')
              defaultSortAsc={false}
              pagination={true}
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 20, 50, allAds.length]}
              paginationComponentOptions={{
                rowsPerPageText: "Records per page:",
                rangeSeparatorText: "out of",
              }}
            // conditionalRowStyles={conditionalRowStyles}
            />
            :
            <p className="flex text-sm font-normal items-center italic">
              You have not yet added any advertisements.
            </p>
          }

        </div>
        :
        <div className="flex justify-center items-center pt-32">
          <Spinner color="warning" aria-label="Extra large spinner example" size="xl" />
        </div>
      }


      <Modal show={openAdsModal} onClose={() => setOpenAdsModal(false)} size="lg" className="text_box_readuce add_advertisement">
        <Modal.Header className="modal_header">{isUpdateNote ? "Update Advertisement" : "Add Advertisement"}</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-2">
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="title" value="Ad Placement" className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
              </div>
              <Select
                sizing="sm" id="adPages"
                onChange={(e) => { setAdPage(e.target.value); setvalidating(''); setAdSigndeUrl(''); setAdImagePath(''); setValidateMbDimension(''); setValidateWebDimension(''); setMbAdImagePath(''); setMbAdSigndeUrl('') }}
                value={adPage}
              >
                <option value="home">Home</option>
                <option value="serviceProvider">Browse Service Providers</option>
              </Select>
            </div>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="company" value="Company Name" className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
              </div>
              <TextInput onChange={(e) => { setCompanyName(e.target.value); setvalidating('') }} name="noteTitle" value={companyName} type="text" placeholder="" required shadow sizing="sm" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="banner" value="Web Ad Banner" className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
              </div>
              <p className="text-xs"> For best results, We recommend {adPage === "home" ? '1920px by 150px' : '320px by 120px'}. Please keep the file size under 5MB.</p>
              <div className="relative mt-2">
                <label htmlFor="file-upload"
                  className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                  <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Web Banner Image
                </label>
                <input id="file-upload" type="file"
                  onChange={(e) => filehandle(e, "web")}
                />
                {uploadSpinner && <div className="top-1.5 absolute left-52"><Spinner color="warning" /></div>
                }
              </div>
              {validateWebDimension &&
                <span className="text-xs text-red-600">{validateWebDimension}</span>
              }

              {!uploadSpinner &&
                <img
                  className="mt-2"
                  src={adSigndeUrl}
                  width={160}
                />
              }

            </div>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="banner" value="Mobile Ad Banner" className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
              </div>
              <p className="text-xs"> For best results, We recommend {adPage === "home" ? '430px by 70px' : '430px by 70px'}. Please keep the file size under 5MB.</p>
              <div className="relative mt-2">
                <label htmlFor="mb-file-upload"
                  className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                  <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Mobile Banner Image
                </label>
                <input id="mb-file-upload" type="file"
                  onChange={(e) => filehandle(e, "mobile")}
                />
                {uploadMbSpinner && <div className="top-1.5 absolute left-56"><Spinner color="warning" /></div>
                }
              </div>
              {validateMbDimension &&
                <span className="text-xs text-red-600">{validateMbDimension}</span>
              }

              {!uploadMbSpinner &&
                <img
                  className="mt-2"
                  src={mbAdSigndeUrl}
                  width={160}
                />
              }

            </div>
            {adPage == "home" &&
              <div>
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="logo" value="Company Logo" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <p className="text-xs"> For best results, We recommend 100px by 100px. Please keep the file size under 5MB.</p>
                <div className="relative mt-2">
                  <label htmlFor="logo-file-upload"
                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Company Logo Image
                  </label>
                  <input id="logo-file-upload" type="file"
                    onChange={(e) => filehandle(e, "logo")}
                  />
                  {uploadLogoSpinner && <div className="top-1.5 absolute left-56"><Spinner color="warning" /></div>
                  }
                </div>
                {validateLogoDimension &&
                  <span className="text-xs text-red-600">{validateLogoDimension}</span>
                }
                {!uploadLogoSpinner &&
                  <img
                    className="mt-2"
                    src={logoSigndeUrl}
                  />
                }

              </div>
            }

            {adPage == "home" &&
              <div>
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="urlStaticPage" value="Website URL for .com page" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <TextInput onChange={(e) => { setAdStaticPageURL(e.target.value); setvalidating('') }} name="noteTitle" value={adStaticPageURL} type="text" placeholder="" required shadow sizing="sm" />
              </div>
            }
            
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="url" value="Profile URL for in-app" className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
              </div>
              <TextInput onChange={(e) => { setAdURL(e.target.value); setvalidating('') }} name="noteTitle" value={adURL} type="text" placeholder="" required shadow sizing="sm" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">


              <div>
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="startDate" value="Start Date" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <DatePicker
                  autoComplete="off"
                  className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                  selected={startDate}
                  onChange={(date: Date) => {
                    handleDateChange(date, 'start');
                  }}
                />
              </div>
              <div>
                <div className="mb-2 inline-flex items-center">
                  <Label htmlFor="endDate" value="End Date" className="font-bold text-xs" />
                  <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                </div>
                <DatePicker
                  autoComplete="off"
                  className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                  selected={endDate && new Date(new Date(endDate).toUTCString())}
                  onChange={(date: Date) => {
                    handleDateChange(date, 'approxEndDate');
                  }}
                />
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <div className="text-xs text-red-600 lg:mr-6">{validating}</div>
          <Button color="gray" onClick={() => setOpenAdsModal(false)}> Cancel</Button>
          <Button onClick={(e) => { e.preventDefault(); isUpdateNote ? updateNote() : addNewNote() }}> {isUpdateNote ? "Update Advertisement" : "Add Advertisement"}</Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={openDisplayModel}
        onClose={() => { setOpenDisplayModel(false); }}
        size="sm"
      >
        <Modal.Header className="modal_header">
          <b>Are you sure?</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <p className="text-sm default_text_color font-normal leading-6">
                Are you sure want to {display ? 'Live' : 'Archive'} this Ad
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          {validating &&
            <span className="text-xs text-red-600">{validating}</span>
          }
          <Button
            color="gray"
            className="h-[40px] button_cancel"
            onClick={() => {
              setOpenDisplayModel(false);
            }}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={displayAd}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
export default AdvertisementsContent;