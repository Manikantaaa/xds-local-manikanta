"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { FileContext } from "@/context/localFileStore";
import useCommonPostData from "@/hooks/commonPostData";
import { getFile, setFile } from "@/services/fileStore";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export interface ExcelUsers {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyWebUrl: string;
  linkedInUrl: string;
  role: string;
}

const CreateCompanies = () => {
  const router = useRouter();
  const [status, setStatus] = useState("1");
  const [errMessage, setErrorMessage] = useState("");
  const [insertedCount, setInsertedCount] = useState(0);

  const contextValue = useContext(FileContext);
  if (contextValue === null) {
    throw new Error("FileContext not found!");
  }
  const { file, setFile } = contextValue;

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY.name,
      path: PATH.COMPANY.path,
    },
    {
      label: "Create New Companies",
      path: "Create New Companies",
    },
  ];

  const {
    submitForm: submitSelectedCompany,
    success,
    error,
  } = useCommonPostData<FormData>({
    url: getEndpointUrl(ENDPOINTS.importExcelData),
  });

  useEffect(() => {
    sendExcelData();
  }, []);

  async function sendExcelData() {
    if (file) {
      console.log("got file checked...");
      const excelFormData = new FormData();
      excelFormData.append("file", file);
      await submitSelectedCompany(excelFormData)
        .then((result) => {
          if (result.data.success) {
            setInsertedCount(result.data.data.count);
            console.log("got success");
            setFile(null);
            setStatus("3");
            return false;
          }
        })
        .catch((err) => {
          setStatus("4");
          setErrorMessage(error);
          console.log(error);
          return false;
        });
    }
  }

  function onClickStatus(val: string) {
    setStatus(val);
  }

  function goToCompanies() {
    router.push("/admin/company");
  }

  return (
    <div className="w-full px-5 pos_r">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:text-left">
          <h1 className="font-bold text-gray-900 header-font">
            Create New Companies
          </h1>
        </div>
      </div>
      {status == "1" ? (
        <div
          role="status"
          onClick={() => {
            onClickStatus("3");
          }}
        >
          <p className="py-6 text-[0.875rem]">
            <svg
              aria-hidden="true"
              className="mr-2 w-4 h-4 text-gray-400 animate-spin dark:text-gray-400 fill-blue-600"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
            <span className="sr-only">Loading...</span> Create New Companies
          </p>
        </div>
      ) : status == "3" ? (
        <div>
          <div className="py-6">
            <p className="p_text">
              <svg
                className="mr-1 "
                id="Layer_1"
                enableBackground="new 0 0 512 512"
                height="14"
                viewBox="0 0 512 512"
                width="14"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  clipRule="evenodd"
                  d="m256 0c-141.2 0-256 114.8-256 256s114.8 256 256 256 256-114.8 256-256-114.8-256-256-256z"
                  fill="#4bae4f"
                  fillRule="evenodd"
                />
                <path
                  d="m206.7 373.1c-32.7-32.7-65.2-65.7-98-98.4-3.6-3.6-3.6-9.6 0-13.2l37.7-37.7c3.6-3.6 9.6-3.6 13.2 0l53.9 53.9 138.6-138.7c3.7-3.6 9.6-3.6 13.3 0l37.8 37.8c3.7 3.7 3.7 9.6 0 13.2l-183.3 183.1c-3.6 3.7-9.5 3.7-13.2 0z"
                  fill="#fff"
                />
              </svg>
              Created {insertedCount} New Companies and {insertedCount} Users
            </p>

            {/* <p className="p_text py-6"><svg className="mr-1 " id="Layer_1" enableBackground="new 0 0 512 512" height="14" viewBox="0 0 512 512" width="14" xmlns="http://www.w3.org/2000/svg"><path clipRule="evenodd" d="m256 0c-141.2 0-256 114.8-256 256s114.8 256 256 256 256-114.8 256-256-114.8-256-256-256z" fill="#4bae4f" fillRule="evenodd" /><path d="m206.7 373.1c-32.7-32.7-65.2-65.7-98-98.4-3.6-3.6-3.6-9.6 0-13.2l37.7-37.7c3.6-3.6 9.6-3.6 13.2 0l53.9 53.9 138.6-138.7c3.7-3.6 9.6-3.6 13.3 0l37.8 37.8c3.7 3.7 3.7 9.6 0 13.2l-183.3 183.1c-3.6 3.7-9.5 3.7-13.2 0z" fill="#fff" /></svg> Email invites sent to 100 Users</p> */}

            <div className="py-6">
              <Button
                type="button"
                onClick={() => {
                  goToCompanies();
                }}
                className="p-5"
              >
                Go to Company List
              </Button>
            </div>
          </div>
        </div>
      ) : status == "4" ? (
        <div className="py-6">
          <p className="p_text">
            <svg
              className="mr-1 "
              id="fi_9759080"
              enableBackground="new 0 0 32 32"
              height="16"
              viewBox="0 0 32 32"
              width="16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g>
                <path
                  d="m16 2c-18.5.6-18.5 27.4 0 28 18.5-.6 18.5-27.4 0-28z"
                  fill="#f44336"
                ></path>
                <path
                  d="m17.4 16 4.2-4.2c.9-.9-.5-2.3-1.4-1.4l-4.2 4.2-4.2-4.2c-.9-.9-2.3.5-1.4 1.4l4.2 4.2-4.2 4.2c-.9.9.5 2.3 1.4 1.4l4.2-4.2 4.2 4.2c.9.9 2.3-.5 1.4-1.4z"
                  fill="#eee"
                ></path>
              </g>
            </svg>
            We Couldn&apos;t Create new companies because of the following
            error(s);
          </p>
          <p className="p_text mt-2 ml-5">{errMessage}</p>
          <div className="py-6">
            <Button
              type="button"
              onClick={() => {
                goToCompanies();
              }}
              className="p-5 text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm me-2 mb-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                goToCompanies();
              }}
              className="p-5 "
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};
export default CreateCompanies;
