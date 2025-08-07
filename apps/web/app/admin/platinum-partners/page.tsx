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
import Breadcrumbs from '@/components/breadcrumb';
import Link from 'next/link';
import { PATH } from '@/constants/path';

const PlatinumPartners = () => {

  const [indexValues, setIndexValues] = useState<sponcersLogotypes[]>([]);
  const [responseData, setResponseData] = useState<responseDataType | undefined>();
  const [uniqueFormId, setUniqueFormId] = useState<string>('newformid_' + new Date().getTime());
  const [deletedFilePaths, setDeletedFilePaths] = useState<string[]>([]);
  const [imageUploadInprogress, setImageUploadInprogress] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [hideAndShow, setHideAndShow] = useState(true);
  useEffect(() => {
    async function getsponseresData() {
      const data = await authFetcher(
        ` ${getEndpointUrl(ENDPOINTS.getSponcerslogoUrls("platinum"))}`,
      )
      setResponseData(data)
    }
    getsponseresData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setHideAndShow(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const savefiles = () => {
    const token = Cookies.get("token");
    axios.post(
      `${getEndpointUrl(ENDPOINTS.savethesponcersLogos)}`,
      {
        indexValues,
        uniqueFormId,
        deletedFilePaths,
        fileType: "platinum"
      },
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

  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.CONTENT.name,
      path: PATH.CONTENT.path,
    },
    {
      label: 'Platinum Partners',
      path: 'Platinum Partners',
    },
  ];

  return (
    <div className="w-full px-5 pos_r">
      <div className="pb-6 pt-6 breadcrumbs_s">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-8">
        <div className="faq_list">
          <h1 className="font-bold text-gray-900 header-font text_font_size"> <button onClick={() => setHideAndShow(!hideAndShow)} type="button" id="radix-:r1m:" aria-haspopup="menu" aria-expanded="false" data-state="closed" className="md:hidden inline-block focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2"><svg className="w-[26px] h-[26px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"></path></svg></button>Content </h1>
          {hideAndShow ? <ul className="mt-4 sidebar_list_gap mobile_hide_menu">
            <li><Link href="/admin/faq" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">FAQs</Link></li>
            <li><Link href="/admin/advertisements" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Advertisements</Link></li>
            <li><Link href="/admin/events" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Events</Link></li>
            <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Service Categories</Link></li>
            <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Articles</Link></li>
            <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
            <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0  anchor_active">Platinum Partners</Link></li>
          </ul>
            : ''}
        </div>
        <div className="faq_content col-span-4">
          <div className="sm:flex sm:items-center sm:justify-center">
            <div className="text-center sm:text-left">
              <h1 className="text-gray-900 header-font pb-6">Upload Platinum Partner logos </h1>
            </div>
          </div>
          <div className='pb-6'><hr /></div>
          <form className="flex lg:w-[800px] flex-col gap-6 m-auto">
            {/* <div> <p className='text-sm'>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p></div> */}
            <DraggableImageUploads setImageUploadInprogress={setImageUploadInprogress} imageUploadInprogress={imageUploadInprogress} uniqueFormId={uniqueFormId} setDeletedFilePaths={setDeletedFilePaths} deletedFilePaths={deletedFilePaths} component='platinumpartners' isSelectRequired={true} indexValues={indexValues} setIndexValues={setIndexValues} responseData={responseData} uploadtext='JPG or PNG image formats only (MAX. 5 MB each), 320 x 200 dimensions.'></DraggableImageUploads>
          </form>
          <div className="flex lg:w-[800px] flex-col gap-6 m-auto py-6">
            <div className="left_btn inline-flex justify-end">
              <Button type="submit" className="bg-white button_blue hover:bg-white h-[40px] px-4" onClick={() => savefiles()}>Save</Button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
export default PlatinumPartners;
