"use client"
import { Button } from 'flowbite-react';
import { useEffect, useState } from "react";
import axios from "axios";
import { getEndpointUrl, ENDPOINTS } from "@/constants/endpoints";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { DraggableImageUploads } from '@/components/draggableImageUploads';
import { authFetcher } from '@/hooks/fetcher';
import { responseDataType, sponcersLogotypes } from '@/types/draggableImages.type';

const SponsersLogos = () => {

  const [indexValues, setIndexValues] = useState<sponcersLogotypes[]>([]);
  const [responseData, setResponseData] = useState<responseDataType | undefined>();
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_'+new Date().getTime());
  const [deletedFilePaths, setDeletedFilePaths] = useState<string[]>([]);
  const [imageUploadInprogress, setImageUploadInprogress] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  useEffect(() => {
    async function getsponseresData() {
      const data = await authFetcher(
        ` ${getEndpointUrl(ENDPOINTS.getSponcerslogoUrls("sponsered"))}`,
      )
      setResponseData(data)
    }
    getsponseresData();
  }, []);

  const savefiles = () => {
    const token = Cookies.get("token");
    axios.post(
      `${getEndpointUrl(ENDPOINTS.savethesponcersLogos)}`,
      {indexValues,
      uniqueFormId, 
      deletedFilePaths,
      fileType: "sponsered"},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ).then((result) => {
      if (result && result.data && result.data.success) {
        toast.success("Your changes have been saved 👍");
      }
      setIsDirty(false);
    })
      .catch((err) => {
        console.log(err);
      });
  } 
   
  return (
    <>
      <div className="w-full px-5 pos_r">
        <div className="sm:flex sm:items-center sm:justify-center py-6">
          <div className="text-center sm:text-left">
            <h1 className="text-gray-900 header-font">Upload Home Page Buyer Logos</h1>
          </div>
        </div>
        <div className='pb-6'><hr /></div>
        <form className="flex w-[100%] lg:w-[800px] flex-col gap-6 m-auto">
          {/* <div> <p className='text-sm'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></div> */}
          <DraggableImageUploads setImageUploadInprogress = {setImageUploadInprogress} imageUploadInprogress = {imageUploadInprogress} uniqueFormId = {uniqueFormId} setDeletedFilePaths = {setDeletedFilePaths} deletedFilePaths = {deletedFilePaths} component='sponsers' isSelectRequired = {true} indexValues={indexValues} setIndexValues={setIndexValues} responseData={responseData}></DraggableImageUploads>
        </form>
        <div className="flex w-[100%] lg:w-[800px] flex-col  m-auto py-6">
          <div className="left_btn inline-flex justify-end">
            <Button type="submit" className="bg-white button_blue hover:bg-white h-[40px] px-4" onClick={() => savefiles()}>Save</Button>
          </div>
        </div>
      </div>

    </>
  );
}
export default SponsersLogos;
