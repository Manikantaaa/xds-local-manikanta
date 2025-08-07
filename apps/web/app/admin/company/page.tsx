"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authFileFetcher, authFileFetcherByPost } from "@/hooks/fetcher";
import { Company } from "@/types/user.type";
import { formatDate, getRoleString, getUserTypeString } from "@/services/common-methods";
import useCommonPostData from "@/hooks/commonPostData";
import { Button, Modal, Tooltip,Radio, Label } from "flowbite-react";
import "../../../public/css/detatable.css";
// import { FileContext } from "@/context/localFileStore";
import Spinner from "@/components/spinner";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import CreateCompanyPopup from "@/components/admin/create-new-compnay";
/* eslint-disable @typescript-eslint/no-explicit-any */

interface MailType {
  companyId?: number;
  type: number;
  msg: string;
}

const acceptableFileType = ".csv";
const AdminCompaniesList = () => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedRows, setSelectedRows] = useState<Company[]>([]);
  const [searchString, setSearchString] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [canRender, setCanRender] = useState(false);
  const [openSingleMailSendPopup, setOpenSingleMailSendPopup] = useState(false);
  const [openMultipleMailSendPopup, setOpenMultipleMailSendPopup] = useState(false);
  const [singleMailDetail, setSingleMailDetail] = useState<MailType>();
  const [mulipleMailDetails, setMulitpleMailDetail] = useState<MailType>();
  const [userType, setUserType] = useState<string>("freeUser");
  const [multipleMailSuccess, setMultipleMailSuccess] = useState(false);
  const [multipleMailLoader, setMultipleMailLoader] = useState(false);
  const [singleMailSuccess, setSingleMailSuccess] = useState(false);
  const [singleMailLoader, setSingleMailLoader] = useState(false);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [failedMails, setFailedMails] = useState<string[]>([]);
  const [successmailCount, setSuccessmailCount] = useState<number>(0);
  const [hideAndShow, setHideAndShow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [openAddCompanyModel, setOpenAddCompanyModel] = useState<boolean>(false);
  const [reloadPage, setReloadPage] = useState<boolean>(false);

  // const contextValue = useContext(FileContext);

  // Handling the case where contextValue is null
  // if (contextValue === null) {
  //   throw new Error("FileContext not found!");
  // }

  // At this point, TypeScript knows that contextValue is not null
  // const { file, setFile } = contextValue;

  const columns = [
    {
      id: "createdAt",
      name: "Date Created",
      cell: (row: Company) => formatDate(row.createdAt),
      sortable: true,
      sortFunction: (a: Company, b: Company) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      id: "updateAt",
      name: "Last Updated",
      cell: (row: Company) => formatDate(row.updatedAt),
      sortable: true,
      sortFunction: (a: Company, b: Company) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      id: "company",
      name: "Company",
      cell: (row: Company) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.id}`} passHref>
            {" "}
            {row.name}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Company, b: Company) => a.name.localeCompare(b.name),
    },
    {
      id: "website",
      name: "Website",
      cell: (row: Company) => (
        <div className="text-blue-300">
          <Link prefetch={false} 
          href={row.website &&
            (row.website.startsWith('http://') || row.website.startsWith('https://') ?
            row.website : `https://${row.website}`)}
          // href={row.website} 
          target="_blank">
            {row.website}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Company, b: Company) =>
        a.website.localeCompare(b.website),
    },
    {
      id: "contact",
      name: "Primary Contact",
      cell: (row: Company) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`mailto:${row.user.email}`}>
            {" "}
            {`${row.user.firstName} ${row.user.lastName} | ${row.user.email}`}{" "}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: Company, b: Company) =>
        a.user.firstName.localeCompare(b.user.firstName),
    },
    {
      id: "role",
      name: "Role",
      cell: (row: Company) => getRoleString(row.user.userRoles[0].roleCode),
      sortFunction: (a: Company, b: Company) =>
        getRoleString(a.user.userRoles[0].roleCode).localeCompare(
          getRoleString(b.user.userRoles[0].roleCode),
        ),
      sortable: true,
    },
    {
      id: "type",
      name: "Sub Status",
      cell: (row: Company) => getUserTypeString(row.user),
      sortFunction: (a: Company, b: Company) => getUserTypeString(a.user).localeCompare(getUserTypeString(b.user)),
      sortable: true,
    },
    {
      id: "expiryDate",
      name: "Expiry Date",
      cell: (row: Company) => getTheExpiryDetails(row),
      // cell: (row: Company) => formatDate(row.user.accessExpirationDate),
      sortable: true,
      // sortFunction: () => "Archived".localeCompare("Live"),
      sortFunction: (a: Company, b: Company) => new Date(a.user?.accessExpirationDate).getTime() - new Date(b.user?.accessExpirationDate).getTime(),
    },
    {
      id: "status",
      name: "Status",
      cell: (row: Company) => (
        <div>
          <button>
            <svg
              className={`w-3.5 h-3.5 me-1 flex-shrink-0 ${row.isArchieve ? "red_c" : "green_c"}`}
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m12 20c4.4183 0 8-3.5817 8-8 0-4.41828-3.5817-8-8-8-4.41828 0-8 3.58172-8 8 0 4.4183 3.58172 8 8 8z" />
            </svg>
          </button>
          {row.isArchieve ? "Archived" : "Live"}
        </div>
      ),
      sortable: true,
      sortFunction: (a: Company, b: Company) => {
        return a.isArchieve === b.isArchieve ? 0 : a.isArchieve ? 1 : -1;
      },
    },
    {
      id: "actions",
      name: "Actions",
      cell: (row: Company) => (
        <div>
          <>
            {row.isArchieve ? (
              <button onClick={() => setArchieveStatus(row.id, 2)}>
                <Tooltip content="Live">
                  {" "}
                  <svg
                    className={`w-4 h-4 me-2 green_c flex-shrink-0 ${row.isArchieve ? "green_c" : "red_c"
                      }`}
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
              <button onClick={() => setArchieveStatus(row.id, 1)}>
                <Tooltip content="Archive">
                  {" "}
                  <svg
                    className="me-2 w-4 h-4 red_c"
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

            <button disabled={row.user.userType == "paid" || row.user.userType == "trial"} onClick={(e) => sendMailConfirmation(e, row.user.id, 0)}>
              {
                (row.user.userType == "paid" || row.user.userType == "trial") ?
                  <svg
                    className= "me-2 w-[18px] h-[18px] disabled_c"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                    />
                  </svg>
                  :
                  <Tooltip content="Send welcome mail">
                    {" "}
                    <svg
                      className="me-2 w-[18px] h-[18px] blue_c"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2"
                        d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                      />
                    </svg>
                  </Tooltip>
              }

            </button>
            {/* <button disabled={row.user.userType == "paid" || row.user.userType == "trial"} onClick={(e) => sendMailConfirmation(e, row.user.id, 2)}>
              {
                (row.user.userType == "paid" || row.user.userType == "trial") ?
                  <svg
                    className="me-2 w-[18px] h-[18px] red_c"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                    />
                  </svg>
                  :
                  <Tooltip content="Make Trial User">
                    {" "}
                    <svg
                      className="me-2 w-[18px] h-[18px] red_c"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="2"
                        d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                      />
                    </svg>
                  </Tooltip>
              }

            </button> */}

            <button onClick={() => deleteCompany(row.id)}>
              <Tooltip content="Delete">
                <svg
                  className="me-2 w-4 h-4 blue_c "
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

  function getTheExpiryDetails(row: Company) {
    if(row && row.user?.accessExpirationDate) {
      if(new Date(row.user?.accessExpirationDate) > new Date()) {
        const theDate = formatDate(row.user?.accessExpirationDate);
        return theDate;
      } else {
        return "Expired";
      }
    } else {
      return "-";
    }
  }

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY.name,
      path: PATH.COMPANY.path,
    },
  ];

  const { data: companiesData, mutate } = useSWR(
    `${getEndpointUrl(ENDPOINTS.getCompaniesWithPagination(searchString))}`,
    authFetcher,
  );

  const {
    submitForm: saveExcelData,
    success: successSavedExcelData,
    error: excelError,
  } = useCommonPostData<FormData>({
    url: getEndpointUrl(ENDPOINTS.importExcelData),
  });

  const {
    submitForm: saveExcelData1,
    success: successSavedExcelData1,
    error: excelError1,
  } = useCommonPostData<FormData>({
    url: getEndpointUrl(ENDPOINTS.sendFreeSpMail),
  });

  async function onSelectFreeSpsFile(event: React.ChangeEvent<HTMLInputElement>) {
    alert("Do you want to upload Csv?");
    if (event.target.files) {
      if (event.target.files.length > 0) {
        const excelFile: File = event.target.files[0];
        // setFile(excelFile);

        const excelFormData = new FormData();
        excelFormData.append("file", excelFile);
        await saveExcelData1(excelFormData)
          .then((result) => {
            if (result && result.data && result.data.success) {
              alert("Mails send Successfully");
              // setFile(null);
              const fileInput = document.getElementById(
                "file-upload1",
              ) as HTMLInputElement | null;
              if (fileInput) {
                fileInput.value = "";
              }
              return false;
            }
          })
          .catch((err) => {
            console.log(err);
            return false;
          });
        // router.push("/admin/company/create-companies");
      }
    }
  }

  async function onSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      if (event.target.files.length > 0) {
        const excelFile: File = event.target.files[0];
        // setFile(excelFile);

        const excelFormData = new FormData();
        excelFormData.append("file", excelFile);

        await saveExcelData(excelFormData)
          .then((result) => {
            if (result && result.data && result.data.success) {
              alert("Successfully saved data");
              // setFile(null);
              const fileInput = document.getElementById(
                "file-upload",
              ) as HTMLInputElement | null;
              if (fileInput) {
                fileInput.value = "";
              }
              return false;
            }
          })
          .catch((err) => {
            console.log(err);
            return false;
          });
        // router.push("/admin/company/create-companies");
      }
    }
  }

  function setArchieveStatus(id: number, type: number) {
    if (type == 1) {
      if (confirm("Are you sure want to Archive this company")) {
        authFetcher(`${getEndpointUrl(ENDPOINTS.archiveCompany(id))}`).then(
          () => {
            mutate();
          },
        );
      }
    } else {
      if (confirm("Are you sure want to Un-Archive this company")) {
        authFetcher(`${getEndpointUrl(ENDPOINTS.deArchiveCompany(id))}`).then(
          () => {
            mutate();
          },
        );
      }
    }
  }

  if(reloadPage) {
      mutate();
  };

  const { success: multipleMailSendSuccess, submitForm: submitSelectedCompany, setSuccess: multipleMailSetSuccess  } = useCommonPostData<{
    companyIds: number[],
    type: string
  }>({
    url: getEndpointUrl(ENDPOINTS.sendMultipleMails),
  });

  useEffect(() => {
    if (companiesData && companiesData.success) {
      setCompanies(companiesData.data?.result);
      setCanRender(true);
    }
    if (excelError) {
      console.log(excelError);
      alert(excelError);
    }
    if (excelError1) {
      console.log(excelError1);
      alert(excelError1);
    }
    if(multipleMailSendSuccess) {
      multipleMailSetSuccess(false);
      setOpenMultipleMailSendPopup(false);
      setMultipleMailLoader(false);
      setMultipleMailSuccess(true);
    }
  }, [companiesData, searchString, excelError, excelError1, successSavedExcelData1, multipleMailSendSuccess, successSavedExcelData, singleMailSuccess]);

  function deleteCompany(id: number) {
    if (confirm("Are you sure want to delete this company")) {
      authFetcher(`${getEndpointUrl(ENDPOINTS.deleteCompany(id))}`).then(() => {
        mutate();
      });
    }
  }

  function onClickSearch(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    setSearchString(searchString);
  }

  function sendMailConfirmation(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    companyId: number,
    type: number
  ) {
    e.preventDefault()
    setUserType("freeUser");
    setSingleMailDetail({
      companyId: companyId,
      type: type,
      msg: "",
    });
    setOpenSingleMailSendPopup(true);
  }

  // const capitalizeFirstLetter = (str: string) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

  async function sendMail() {
    
    setSingleMailLoader(true);
    if (singleMailDetail && singleMailDetail.companyId) {
      await authFetcher(`${getEndpointUrl(ENDPOINTS.sendPassword(singleMailDetail?.companyId, userType))}`).then((result) => {
        setSingleMailLoader(false);
        setOpenSingleMailSendPopup(false);
        setSingleMailSuccess(true);
      }).catch((err) => {
        setOpenSingleMailSendPopup(false);
        console.log(err);
        setSingleMailLoader(false);
      });
    }
  }

  // ***** This one is for sending mail to the users ******
  async function sendWelcomeMailToMultiple(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.preventDefault();
    setUserType("freeUser");
    if (selectedRows.length > 0) {
      setMulitpleMailDetail({
        msg: "Are you sure want to send welcome mails to selected companies",
        type: 1,
      });
    } else {
      setMulitpleMailDetail({
        msg: "Please select atleast one company",
        type: 2,
      });
    }
    setOpenMultipleMailSendPopup(true);
  }

  // ***** downloading the csv with email and password ******
  // async function downloadCsvWithUserCredentials(
  //   e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  // ) {
  //   e.preventDefault();
  //   if (selectedRows.length > 0) {
  //     const isConfirm: boolean = confirm(
  //       "Are you sure want to send welcome mails to selected companies",
  //     );
  //     if (isConfirm) {
  //       const selectedUsersIds: number[] = selectedRows.map((item: Company) => item.id);
  //       const postData = {
  //         companies: selectedUsersIds,
  //       };
  //       await authFileFetcherByPost(`${getEndpointUrl(ENDPOINTS.sendMultipleMails)}`, postData).then((result) => {
  //         // const blob = new Blob([result], { type: 'text/csv' });
  //         const link = document.createElement("a");
  //         link.href = window.URL.createObjectURL(result);
  //         link.download = "users.csv";
  //         link.click();
  //       }).catch((error) => {
  //         console.log(error);
  //       }).finally(() => {
  //       });
  //     }
  //   } else {
  //     alert("Please select atleast one company");
  //   }
  // }

  // const { submitForm: exportCsv, success: exportCsvSuccess, error } = useCommonPostData<FormData>({
  //   url: getEndpointUrl(ENDPOINTS.importExcelData),
  // });

  async function downloadCsvTamplate() {
    const csvCompaniesTemplateUrl = "../CSV_Template.csv";

    try {
      const response = await fetch(csvCompaniesTemplateUrl);

      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "XDS-Spark_CSV_Template.csv";
      link.click();

    } catch (error) {
      console.error("Error downloading CSV file:", error);
    }
  }

  async function downloadCsv(
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) {
    e.preventDefault();
    setCanRender(false);
    authFileFetcher(
      `${getEndpointUrl(ENDPOINTS.downloadCompaniesCsv(searchString))}`,
    )
      .then((result) => {
        setCanRender(true);
        // const blob = new Blob([result], { type: 'text/csv' });
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(result);
        link.download = "XDS-Spark_Company_Export.csv";
        link.click();
      })
      .catch((error) => {
        setCanRender(true);
        console.log(error);
      });
  }

  const handleSelectedRowsChange = (selected: {
    allSelected: boolean;
    selectedCount: number;
    selectedRows: Company[];
  }) => {
    setSelectedRows(selected.selectedRows);
  };

  async function sendMultipleMails() {
    let type = 0;
    if (mulipleMailDetails?.type && mulipleMailDetails.type != 0) {
      type = mulipleMailDetails.type;
    }
    if (type == 1) {
      const selectedUsersIds: number[] = selectedRows.map((item: Company) => item.user.id);
      const postData = {
        companyIds: selectedUsersIds,
        type: userType
      };
      submitSelectedCompany(postData)
      .then((result) => {
        console.log(result.data);
        if(result.data[0]?.failedMail && result.data[0]?.failedMail.length > 0) {
          setFailedCount(result.data[0].failedMail.length);
          setFailedMails(result.data[0].failedMail);
        }

        if(result.data[0]?.successMails && result.data[0]?.successMails.length > 0) {
          setSuccessmailCount(result.data[0].successMails.length);
        }
        
        // if (result && result.data && result.data.success) {
        // }
      })
      .catch((err) => {
        console.log(err);
        return false;
      });

    }
    setMultipleMailLoader(true);
  }

  const handleUserTypeChange = (event:any) => {
    setUserType(event?.target.value);
  }

  useEffect (()=>{
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setHideAndShow(window.innerWidth > 768);
    };
  
    handleResize();
    window.addEventListener("resize", handleResize);
  
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  },[]);

  return (
    <>
      {
        canRender ?
          <div className="w-full px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="flex items-center justify-between relative" id="target_menu">
              <div className="sm:text-left">
                <h1 className="font-bold text-gray-900 header-font">Companies</h1>                
              </div>
              <button onClick={()=>setHideAndShow(!hideAndShow)} type="button" id="radix-:r1m:" aria-haspopup="menu" aria-expanded="false" data-state="closed" className="absolute right-0 block md:hidden focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2"><svg className="w-[26px] h-[26px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"></path></svg></button>
                <div className="m_dropdown_menuopen">
                
                { hideAndShow &&
                   <div  id="ggggg" className="mt-12 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-start space-x-0.5 company_admin">
                <button type="button" 
                  className="text-sm font-medium inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  onClick={() => setOpenAddCompanyModel(true)}>
                    <svg
                  className="w-3.5 h-3.5 me-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z" />
                </svg>
                    Create Company
                  </button>
                <button
                  className="text-sm font-medium inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={(e) => sendWelcomeMailToMultiple(e)}
                >
                  <svg
                    className="w-[18px] h-[18px] blue_c me-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                    />
                  </svg>
                  <span className=""> Send Welcome Mail </span>
                </button>

                {/* <button
                  className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={(e) => downloadCsvWithUserCredentials(e)}
                >
                  <svg
                    className="w-[18px] h-[18px] blue_c  me-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="m3.5 5.5 7.9 6c.4.3.8.3 1.2 0l7.9-6M4 19h16c.6 0 1-.4 1-1V6c0-.6-.4-1-1-1H4a1 1 0 0 0-1 1v12c0 .6.4 1 1 1Z"
                    />
                  </svg>
                  <span className=""> Download email/password CSV </span>
                </button> */}

                <button
                  className="text-sm font-medium inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={() => downloadCsvTamplate()}
                >
                  {" "}
                  <svg
                    className="w-3.5 h-3.5 text-blue-300  me-1"
                    version="1.1"
                    fill="#0071C2"
                    id="fi_25407"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 475.078 475.077"
                  >
                    <g>
                      <g>
                        <path
                          d="M467.083,318.627c-5.324-5.328-11.8-7.994-19.41-7.994H315.195l-38.828,38.827c-11.04,10.657-23.982,15.988-38.828,15.988
                    c-14.843,0-27.789-5.324-38.828-15.988l-38.543-38.827H27.408c-7.612,0-14.083,2.669-19.414,7.994
                    C2.664,323.955,0,330.427,0,338.044v91.358c0,7.614,2.664,14.085,7.994,19.414c5.33,5.328,11.801,7.99,19.414,7.99h420.266
                    c7.61,0,14.086-2.662,19.41-7.99c5.332-5.329,7.994-11.8,7.994-19.414v-91.358C475.078,330.427,472.416,323.955,467.083,318.627z
                      M360.025,414.841c-3.621,3.617-7.905,5.424-12.854,5.424s-9.227-1.807-12.847-5.424c-3.614-3.617-5.421-7.898-5.421-12.844
                    c0-4.948,1.807-9.236,5.421-12.847c3.62-3.62,7.898-5.431,12.847-5.431s9.232,1.811,12.854,5.431
                    c3.613,3.61,5.421,7.898,5.421,12.847C365.446,406.942,363.638,411.224,360.025,414.841z M433.109,414.841
                    c-3.614,3.617-7.898,5.424-12.848,5.424c-4.948,0-9.229-1.807-12.847-5.424c-3.613-3.617-5.42-7.898-5.42-12.844
                    c0-4.948,1.807-9.236,5.42-12.847c3.617-3.62,7.898-5.431,12.847-5.431c4.949,0,9.233,1.811,12.848,5.431
                    c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z"
                        ></path>
                        <path
                          d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                    c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                    c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                    h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z"
                        ></path>
                      </g>
                    </g>
                  </svg>
                  <span className=""> Download CSV Template</span>
                </button>
                <button
                  className="text-sm font-medium inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                  type="button"
                  onClick={(e) => downloadCsv(e)}
                >
                  {" "}
                  <svg
                    className="w-3.5 h-3.5 text-blue-300  me-1"
                    version="1.1"
                    fill="#0071C2"
                    id="fi_25407"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 475.078 475.077"
                  >
                    <g>
                      <g>
                        <path
                          d="M467.083,318.627c-5.324-5.328-11.8-7.994-19.41-7.994H315.195l-38.828,38.827c-11.04,10.657-23.982,15.988-38.828,15.988
                    c-14.843,0-27.789-5.324-38.828-15.988l-38.543-38.827H27.408c-7.612,0-14.083,2.669-19.414,7.994
                    C2.664,323.955,0,330.427,0,338.044v91.358c0,7.614,2.664,14.085,7.994,19.414c5.33,5.328,11.801,7.99,19.414,7.99h420.266
                    c7.61,0,14.086-2.662,19.41-7.99c5.332-5.329,7.994-11.8,7.994-19.414v-91.358C475.078,330.427,472.416,323.955,467.083,318.627z
                      M360.025,414.841c-3.621,3.617-7.905,5.424-12.854,5.424s-9.227-1.807-12.847-5.424c-3.614-3.617-5.421-7.898-5.421-12.844
                    c0-4.948,1.807-9.236,5.421-12.847c3.62-3.62,7.898-5.431,12.847-5.431s9.232,1.811,12.854,5.431
                    c3.613,3.61,5.421,7.898,5.421,12.847C365.446,406.942,363.638,411.224,360.025,414.841z M433.109,414.841
                    c-3.614,3.617-7.898,5.424-12.848,5.424c-4.948,0-9.229-1.807-12.847-5.424c-3.613-3.617-5.42-7.898-5.42-12.844
                    c0-4.948,1.807-9.236,5.42-12.847c3.617-3.62,7.898-5.431,12.847-5.431c4.949,0,9.233,1.811,12.848,5.431
                    c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z"
                        ></path>
                        <path
                          d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                    c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                    c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                    h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z"
                        ></path>
                      </g>
                    </g>
                  </svg>
                  <span className=""> Download Companies CSV </span>
                </button>
                <label
                  htmlFor="file-upload"
                  className="text-sm font-medium custom-file-upload inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-300 focus:outline-none "
                >
                  <svg
                    className="w-3.5 h-3.5 text-blue-300  me-1"
                    fill="#0071C2"
                    version="1.1"
                    id="Capa_1"
                    xmlns="http://www.w3.org/2000/svg"
                    x="0px"
                    y="0px"
                    viewBox="0 0 475.078 475.077"
                  >
                    <g>
                      <g>
                        <path
                          d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262
                                        c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262
                                        H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41
                                        c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361
                                        C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428
                                        s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428
                                        s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978
                                        c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847
                                        s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428
                                        c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"
                        />
                        <path
                          d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096
                                        c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42
                                        c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426
                                        L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"
                        />
                      </g>
                    </g>
                  </svg>
                  Upload CSV to create Companies 
                  <Tooltip 
                    content="For Buyers and SPs, all the fields are mandatory to be filled in. Insert NA for information that is not available. Also ensure that duplicate emails are not present."
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
                </Tooltip>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept={acceptableFileType}
                  onChange={(e) => onSelectFile(e)}
                />
                {/* <label
                  htmlFor="file-upload1"
                  className="text-sm font-medium custom-file-upload inline-flex items-center lg:justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-300 focus:outline-none "
                >
                  Upload 6M CSV
                </label>
                <input
                  id="file-upload1"
                  type="file"
                  accept={acceptableFileType}
                  onChange={(e) => onSelectFreeSpsFile(e)}
                /> */}
              </div>
              } 
              </div>
            </div>
            <div className="pt-6">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 pb-6">
                <form className="flex items-center">
                  <label htmlFor="voice-search" className="sr-only">
                    Search
                  </label>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 12 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g id="&#226;&#152;&#160;&#239;&#184;&#143; Icon / Color">
                          <path
                            id="Union"
                            d="M8.45324 8.98349L11.3571 11.8881C11.4306 11.9608 11.5266 11.9976 11.6226 11.9976C11.7186 11.9976 11.8146 11.9608 11.8881 11.8881C12.0343 11.7411 12.0343 11.5041 11.8881 11.3571L9.21461 8.6843C11.0001 6.6243 10.9145 3.49228 8.95782 1.53506C6.91083 -0.511688 3.58017 -0.511688 1.53468 1.53506C-0.511559 3.58181 -0.511559 6.91331 1.53468 8.96006C2.52668 9.95156 3.84485 10.4976 5.24625 10.4976C5.4532 10.4976 5.62116 10.3296 5.62116 10.1226C5.62116 9.91556 5.4532 9.74756 5.24625 9.74756C4.0443 9.74756 2.91508 9.27956 2.0648 8.42981C0.310985 6.67481 0.310985 3.82031 2.0648 2.06531C3.81786 0.310313 6.67164 0.311063 8.4277 2.06531C10.1815 3.82031 10.1815 6.67481 8.4277 8.42981C8.28149 8.57606 8.28149 8.81381 8.4277 8.96006C8.43594 8.96834 8.44446 8.97615 8.45324 8.98349Z"
                            fill="#343741"
                          />
                        </g>
                      </svg>
                    </div>
                    <input
                      type="search"
                      id="voice-search"
                      onChange={(e) => setSearchString(e.target.value.trim())}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Search by Company, Primary Contact"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center py-2 px-6 ms-2 text-sm font-medium text-gray-600 searc_btn  border border-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-non"
                    onClick={(e) => onClickSearch(e)}
                  >
                    Search
                  </button>
                </form>
              </div>
              {/* { isLoading ?
          <div className="pt-4 flex justify-center items-center">
            <Spinner />
          </div>
          : ''
        } */}
              <div className="companies_table">
                <DataTable
                  columns={columns}
                  data={companies}
                  highlightOnHover={true}
                  pagination={true}
                  selectableRows={true}
                  // paginationServer
                  paginationPerPage={10}
                  defaultSortFieldId="createdAt" // Specify the default sorted column (e.g., 'name')
                  defaultSortAsc={false}
                  paginationTotalRows={companies.length}
                  paginationRowsPerPageOptions={[10, 20, 50, 100, companies.length]}
                  paginationComponentOptions={{
                    rowsPerPageText: "Records per page:",
                    rangeSeparatorText: "out of",
                  }}
                  // onChangePage={(pageNo) => setPage((pageNo - 1) * +rowCount)}
                  // onChangeRowsPerPage={(rowCount) =>
                  //   handleRowsPerPageChange(+rowCount)
                  // }
                  onSelectedRowsChange={handleSelectedRowsChange}
                />
              </div>
            </div>
            <Modal show={openModal} onClose={() => setOpenModal(false)}>
              <Modal.Header>Terms of Service</Modal.Header>
              <Modal.Body>
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    With less than a month to go before the European Union enacts new
                    consumer privacy laws for its citizens, companies around the world
                    are updating their terms of service agreements to comply.
                  </p>
                  <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    The European Union’s General Data Protection Regulation (G.D.P.R.)
                    goes into effect on May 25 and is meant to ensure a common set of
                    data rights in the European Union. It requires organizations to
                    notify users as soon as possible of high-risk data breaches that
                    could personally affect them.
                  </p>
                </div>
              </Modal.Body>
              <Modal.Footer className="text-end">
                <Button onClick={() => setOpenModal(false)}>I accept</Button>
                <Button color="gray" onClick={() => setOpenModal(false)}>
                  Decline
                </Button>
              </Modal.Footer>
            </Modal>
            {/* popup for asking to send mail or not */}
            <Modal show={openSingleMailSendPopup} size="md" onClose={() => setOpenSingleMailSendPopup(false)}>
              <Modal.Header className="modal_header font-extrabold"><small><b>Send welcome mail as . . .</b></small>
              </Modal.Header>
              <Modal.Body>
                <div className="text-center">
                  {/* <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" /> */}
                  {/* <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                    {singleMailDetail?.msg}
                  </h3> */}
                  <fieldset className="flex max-w-md flex-col gap-4 pb-6">
                    {/* <legend className="mb-4 text-left font-bold">Send welcome email as . . .</legend> */}
                    <div className="flex items-center gap-2">
                      <Radio id="freeUser" name="userType" value="freeUser" checked={userType =="freeUser"} onChange={handleUserTypeChange} />
                      <Label htmlFor="freeUser">Foundational</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio id="trialUserMonth" name="userType" value="trialUserMonth" checked={userType =="trialUserMonth"} onChange={handleUserTypeChange} />
                      <Label htmlFor="trialUserMonth">30d Trial</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio id="trialUserYear" name="userType" value="trialUserYear" checked={userType =="trialUserYear"} onChange={handleUserTypeChange} />
                      <Label htmlFor="trialUserYear">1y Membership</Label>
                    </div> 
                    {/* <div className="flex items-center gap-2">
                      <Radio id="trialUser8Week" name="userType" value="trialUser8Week" checked={userType =="trialUser8Week"} onChange={handleUserTypeChange} />
                      <Label htmlFor="trialUser8Week">8w Trial</Label>
                    </div>                   */}
                    <div className="flex items-center gap-2">
                      <Radio id="trialUser6months" name="userType" value="trialUser6months" checked={userType =="trialUser6months"} onChange={handleUserTypeChange} />
                      <Label htmlFor="trialUser6months">6m Trial</Label>
                    </div>                  
                  </fieldset>
                  <div className="flex justify-center gap-4">
                    {
                      singleMailLoader ? 
                      <Spinner></Spinner>
                      :
                      <Button className="button_blue" onClick={(e) => { e.preventDefault(); sendMail(); }} >
                        {"Okay"}
                      </Button>
                    }
                  </div>
                </div>
              </Modal.Body>
            </Modal>

            <Modal show={openMultipleMailSendPopup} size="sm" onClose={() => setOpenMultipleMailSendPopup(false)}>
              <Modal.Header className="modal_header font-extrabold"><small><b>Send welcome mail as . . .</b></small></Modal.Header>
              <Modal.Body>
                <div className="text-center">
                  {
                    mulipleMailDetails?.type == 2 ?
                    <>
                      <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                      <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        {mulipleMailDetails?.msg}
                      </h3>
                    </>
                    :
                    ""
                  }
                  {
                    mulipleMailDetails?.type != 2 ?
                    <fieldset className="flex max-w-md flex-col gap-4 pb-6">
                      {/* <legend className="mb-4 text-left font-bold">Send welcome email as . . .</legend> */}
                      <div className="flex items-center gap-2">
                        <Radio id="freeUser" name="userType" value="freeUser" checked={userType =="freeUser"} onChange={handleUserTypeChange} />
                        <Label htmlFor="freeUser">Foundational</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio id="trialUserMonth" name="userType" value="trialUserMonth" checked={userType =="trialUserMonth"} onChange={handleUserTypeChange} />
                        <Label htmlFor="trialUserMonth">30d Trial</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio id="trialUserYear" name="userType" value="trialUserYear" checked={userType =="trialUserYear"} onChange={handleUserTypeChange} />
                        <Label htmlFor="trialUserYear">1y Membership</Label>
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <Radio id="trialUser8Week" name="userType" value="trialUser8Week" checked={userType =="trialUser8Week"} onChange={handleUserTypeChange} />
                        <Label htmlFor="trialUser8Week">8w Trial</Label>
                      </div>                  */}
                      <div className="flex items-center gap-2">
                        <Radio id="trialUser6months" name="userType" value="trialUser6months" checked={userType =="trialUser6months"} onChange={handleUserTypeChange} />
                        <Label htmlFor="trialUser6months">6m Trial</Label>
                      </div>                 
                    </fieldset>
                    :
                    ""
                  }
                  <div className="flex justify-center gap-4">
                    {
                      multipleMailLoader ? 
                      <Spinner></Spinner>
                      :
                      <Button className="button_blue" onClick={selectedRows && selectedRows.length > 0 ? (e) => { e.preventDefault(); sendMultipleMails(); } : (e) => setOpenMultipleMailSendPopup(false) } >
                        {"Okay"}
                      </Button>
                    }
                  </div>
                </div>
              </Modal.Body>
            </Modal>

            <Modal show={multipleMailSuccess} size="sm" onClose={() => {multipleMailSetSuccess(false); setMultipleMailSuccess(false);}}>
              <Modal.Header className="modal_header">
                <b>Details</b>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-6">
                  <div className=""><p>Total welcome emails sent: {successmailCount+failedCount}</p><br/><p>Successfully sent: {successmailCount}</p><p>Failed emails       : {failedCount}</p><br/>{failedMails.map((mail) => <p>{mail}</p> )}</div>
                  {/* <div className="">Mails has been {successmailCount} successfully sent to the selected users and failed {failedCount} emails.{failedMails.map((mail) => <p>{mail}</p> )}</div> */}
                </div>
              </Modal.Body>
              <Modal.Footer className="modal_footer">
                <Button
                  className="h-[40px] button_blue"
                  onClick={() => {
                    multipleMailSetSuccess(false);
                    setMultipleMailSuccess(false);
                  }}
                >
                  Ok
                </Button>
              </Modal.Footer>
            </Modal>

            <Modal show={singleMailSuccess} size="sm" onClose={() => { setSingleMailSuccess(false); }}>
              <Modal.Header className="modal_header">
                <b>Details</b>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-6">
                  <div className="">Welcome mail is successfully sent to the selected user.</div>
                </div>
              </Modal.Body>
              <Modal.Footer className="modal_footer">
                <Button
                  className="h-[40px] button_blue"
                  onClick={() => {
                    setSingleMailSuccess(false);
                  }}
                >
                  Ok
                </Button>
              </Modal.Footer>
            </Modal>
            <CreateCompanyPopup openAddCompanyModel = {openAddCompanyModel} setOpenAddCompanyModel = {setOpenAddCompanyModel} setreloadPage = {setReloadPage}/>
          </div>
          
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>

  );
};
export default AdminCompaniesList;
/* eslint-disable @typescript-eslint/no-explicit-any */
