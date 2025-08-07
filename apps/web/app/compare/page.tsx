"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useRandomDataContext } from "@/context/random-data-store";
import { authPostdata, fetcher } from "@/hooks/fetcher";
import Link from "next/link";
import { useEffect, useState } from "react";
import profileimage from "@/public/no-image-available.jpg";
import { isValidJSON, serviceColoring } from "@/constants/serviceColors";
import { useRouter } from "next/navigation";
import { useUserContext } from "@/context/store";
import Spinner from "@/components/spinner";
import { useAuthentication } from "@/services/authUtils";
import { Modal, Tooltip } from "flowbite-react";
import Image from "next/image";
import { companyPortfolioTypes, portfolioAlbumFilesTypes, portfolioTypes } from "@/types/serviceProviderDetails.type";
import CustomLightBox from "@/components/ui/lightbox";
import profilePlaceHolder from "@/public/profile-user.png"

const Compare = () => {
  const router = useRouter();
  const { user } = useUserContext();
  // if (!user) {
  //   router.push(PATH.HOME.path);
  // }
  useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: true });
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPARE.name,
      path: PATH.COMPARE.path,
    },
  ];
  const { companyCounts, setCompanyCounts } = useRandomDataContext();
  if(companyCounts == 0) {
    router.push(PATH.BROWSESERVICEPROVIDERS.path);
  }
  const [companiesToCompare, setCompaniesToCompare] = useState<any[]>([]);
  const [fullportfolioModal, setFullportfolioModal] = useState(false);
  const [currentAlbumPopupData, setCurrentAlbumPopupData] = useState<portfolioTypes["portfolioAlbumFiles"]>([]);
  const [activeSlider, setActiveSlider] = useState<number | undefined>(undefined);
  const [isOpenSilder, setIsOpenSilder] = useState<boolean>(false);
  const [currentLightBoxItems, setCurrentLightBoxItems] = useState<companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAlbumLoading, setIsAlbumLoading] = useState(false);
  const [albumId, setAlbumId] = useState(0);
  const subject = "Enquiry from XDS Spark";
  const body = "“This email was originally generated from XDS Spark”";

  useEffect(() => {
    const comparingCompaniesString = localStorage.getItem("comparingCompanies");
    let comparingCompanies = [];
    if (comparingCompaniesString) {
      comparingCompanies = JSON.parse(comparingCompaniesString);
    }
    const top5Companies = comparingCompanies.slice(0, 5);
    localStorage.setItem("comparingCompanies", JSON.stringify(top5Companies));
    const scrollContainer = document.querySelector<HTMLElement>('[data-drag-scroll-enabled="true"]');
    if (!scrollContainer) return;
    let isDown = false;
    let startX: number;
    let scrollLeft: number;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      scrollContainer.classList.add('active', 'no-select');
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    };

    const handleMouseUp = () => {
      isDown = false;
      scrollContainer.classList.remove('active', 'no-select');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 2;
      scrollContainer.scrollLeft = scrollLeft - walk;
    };

    scrollContainer.addEventListener('mousedown', handleMouseDown);
    scrollContainer.addEventListener('mouseup', handleMouseUp);
    scrollContainer.addEventListener('mousemove', handleMouseMove);
    scrollContainer.addEventListener('mouseleave', handleMouseUp);

    getComparingCompaniesDetails(top5Companies);

    return () => {
      scrollContainer.removeEventListener('mousedown', handleMouseDown);
      scrollContainer.removeEventListener('mouseup', handleMouseUp);
      scrollContainer.removeEventListener('mousemove', handleMouseMove);
      scrollContainer.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  const getComparingCompaniesDetails = async (ids: number[]) => {
    if (ids.length > 0) {
      let postData = {
        companyIds: ids
      }
      setIsLoading(true);
      await authPostdata(`${getEndpointUrl(ENDPOINTS.getCompaniesForComparing)}`, postData).then((result) => {
        const resultData = result.data;
        if (resultData.length > 0) {
          for (const item of resultData) {
            item.showFullCertificate = false;
            item.showFullSecurity = false;
            item.showFullTools = false;
          }
          setCompaniesToCompare(resultData);
        }
        setIsLoading(false);
      }).catch((err) => {
        setIsLoading(false);
        console.log(err)
      });
    }
  }

  const removeCompanyFromComparing = (index: number) => {
    const companyId = companiesToCompare[index].id;
    companiesToCompare.splice(index, 1);
    const comparingCompaniesString = localStorage.getItem("comparingCompanies");
    let comparingCompanies = [];
    if (comparingCompaniesString) {
      comparingCompanies = JSON.parse(comparingCompaniesString);
    }
    comparingCompanies = comparingCompanies.filter((item: any) => item != companyId);
    setCompanyCounts(comparingCompanies.length);
    localStorage.setItem("comparingCompanies", JSON.stringify(comparingCompanies));
    if (companiesToCompare.length == 0) {
      router.push("/serviceproviders");
    }
  }

  const makeTheStringCorrect = (data: string = "", val = 0) => {
    if (!data) {
      data = "";
    }
    if (isValidJSON(data)) {
      if (JSON.parse(data).length < 400) {
        return JSON.parse(data)
      } else {
        if (val == 1) {
          return `${JSON.parse(data).substring(0, 400) + "..."}`
        } else {
          return `${JSON.parse(data)}`
        }
      }
    } else {
      if (data.length < 400) {
        return data;
      } else {
        if (val == 1) {
          return `${data.substring(0, 400) + "..."}`
        } else {
          return `${JSON.parse(data)}`
        }
      }
    }
  }

  const updateComparingCompanies = (flag: string, index: number) => {
    const theCompanies = [...companiesToCompare];
    theCompanies[index][flag] = !theCompanies[index][flag];
    setCompaniesToCompare(theCompanies);
  }

  const onSelectAnyAlbum = (albumId: number) => {
    setAlbumId(albumId);
    setIsAlbumLoading(true);
    setCurrentAlbumPopupData([]);
    fetcher(getEndpointUrl(ENDPOINTS.getAlbumFilesById(albumId))).then((response) => {
      if (response && response.data) {
        setCurrentAlbumPopupData(response.data);
        setFullportfolioModal(true);
      }
      setIsAlbumLoading(false);
    }).catch((error) => {
      setIsAlbumLoading(false);
      console.log(error);
    });
  };

  function setAlbumIndex(fileIndex: number) {
    setActiveSlider(fileIndex);
    setIsOpenSilder(true);
    setCurrentLightBoxItems(currentAlbumPopupData);
  }

  return (
    <>
      <div className={`min-h-screen flex justify-center items-center ${isLoading ? 'visible' : 'invisible'}`} style={{display: !isLoading ? 'none' : ''}}>
        <Spinner />
      </div>
      <div className={`w-full lg:container px-5 pos_r pb-10 ${!isLoading ? 'visible' : 'invisible'}`}>
        {/* <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div> */}
        {/* <div className="flex justify-between">
          <div className="text-left">
            <h1 className="default_text_color header-font">Compare</h1>
          </div>
        </div>
        <div className="py-6"><hr /></div> */}
        <div className="compare_company  table_scrool_f mb-10 no-select pb-6 mt-6" data-drag-scroll-enabled={true}>
          {
            companiesToCompare && companiesToCompare.length > 0 &&
            <table className="table_compare -ml-10">
              <tr className="compare_table_fixed">
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="td_width">
                      <div className="flex items-start gap_20 relative">
                        <div className="compare_company_profile_thumb">
                          <Link href={`/serviceproviders-details/${companiesToCompare[0].slug}`}><img src={companiesToCompare[0]?.logoAsset?.url || "/no-image-available.jpg"} alt="" loading="lazy" width="150" height="150" decoding="async" data-nimg="1" className="aspect-square w-36 rounded-lg object-cover" /></Link>
                        </div>
                        <div>
                          <h3 className="comare_title  default_text_color pr-5">{companiesToCompare[0]?.name}</h3>
                        </div>
                        <div className="absolute -right-5 top-0">
                          <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => removeCompanyFromComparing(0)}
                          >
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g id="XCircle">
                                <path id="Vector" d="M10.8538 6.35375L9.20688 8L10.8538 9.64625C10.9002 9.69271 10.9371 9.74786 10.9622 9.80855C10.9873 9.86925 11.0003 9.9343 11.0003 10C11.0003 10.0657 10.9873 10.1308 10.9622 10.1914C10.9371 10.2521 10.9002 10.3073 10.8538 10.3538C10.8073 10.4002 10.7521 10.4371 10.6915 10.4622C10.6308 10.4873 10.5657 10.5003 10.5 10.5003C10.4343 10.5003 10.3693 10.4873 10.3086 10.4622C10.2479 10.4371 10.1927 10.4002 10.1463 10.3538L8.5 8.70687L6.85375 10.3538C6.8073 10.4002 6.75215 10.4371 6.69145 10.4622C6.63075 10.4873 6.5657 10.5003 6.5 10.5003C6.43431 10.5003 6.36925 10.4873 6.30855 10.4622C6.24786 10.4371 6.19271 10.4002 6.14625 10.3538C6.0998 10.3073 6.06295 10.2521 6.03781 10.1914C6.01266 10.1308 5.99972 10.0657 5.99972 10C5.99972 9.9343 6.01266 9.86925 6.03781 9.80855C6.06295 9.74786 6.0998 9.69271 6.14625 9.64625L7.79313 8L6.14625 6.35375C6.05243 6.25993 5.99972 6.13268 5.99972 6C5.99972 5.86732 6.05243 5.74007 6.14625 5.64625C6.24007 5.55243 6.36732 5.49972 6.5 5.49972C6.63268 5.49972 6.75993 5.55243 6.85375 5.64625L8.5 7.29313L10.1463 5.64625C10.1927 5.59979 10.2479 5.56294 10.3086 5.5378C10.3693 5.51266 10.4343 5.49972 10.5 5.49972C10.5657 5.49972 10.6308 5.51266 10.6915 5.5378C10.7521 5.56294 10.8073 5.59979 10.8538 5.64625C10.9002 5.6927 10.9371 5.74786 10.9622 5.80855C10.9873 5.86925 11.0003 5.9343 11.0003 6C11.0003 6.0657 10.9873 6.13075 10.9622 6.19145C10.9371 6.25214 10.9002 6.3073 10.8538 6.35375ZM15 8C15 9.28558 14.6188 10.5423 13.9046 11.6112C13.1903 12.6801 12.1752 13.5132 10.9874 14.0052C9.79973 14.4972 8.49279 14.6259 7.23192 14.3751C5.97104 14.1243 4.81285 13.5052 3.90381 12.5962C2.99477 11.6872 2.3757 10.529 2.1249 9.26809C1.87409 8.00721 2.00282 6.70028 2.49479 5.51256C2.98676 4.32484 3.81988 3.30968 4.8888 2.59545C5.95772 1.88122 7.21442 1.5 8.5 1.5C10.2234 1.50182 11.8756 2.18722 13.0942 3.40582C14.3128 4.62441 14.9982 6.27665 15 8ZM14 8C14 6.9122 13.6774 5.84883 13.0731 4.94436C12.4687 4.03989 11.6098 3.33494 10.6048 2.91866C9.59977 2.50238 8.4939 2.39346 7.42701 2.60568C6.36011 2.8179 5.3801 3.34172 4.61092 4.11091C3.84173 4.8801 3.3179 5.86011 3.10568 6.927C2.89347 7.9939 3.00238 9.09977 3.41867 10.1048C3.83495 11.1098 4.5399 11.9687 5.44437 12.5731C6.34884 13.1774 7.41221 13.5 8.5 13.5C9.95819 13.4983 11.3562 12.9184 12.3873 11.8873C13.4184 10.8562 13.9983 9.45818 14 8Z" fill="#0071C2" />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="td_width">
                      <div className="lg:flex items-start gap_20 relative">
                        <div className="compare_company_profile_thumb">
                          <Link href={`/serviceproviders-details/${companiesToCompare[1].slug}`}><img src={companiesToCompare[1]?.logoAsset?.url || "/no-image-available.jpg"} alt="" loading="lazy" width="150" height="150" decoding="async" data-nimg="1" className="aspect-square w-36 rounded-lg object-cover" /></Link>
                        </div>
                        <div>
                          <h3 className="comare_title  default_text_color pr-5">{companiesToCompare[1]?.name}</h3>
                        </div>
                        <div className="absolute -right-5 top-0">
                          <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => removeCompanyFromComparing(1)}
                          >
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g id="XCircle">
                                <path id="Vector" d="M10.8538 6.35375L9.20688 8L10.8538 9.64625C10.9002 9.69271 10.9371 9.74786 10.9622 9.80855C10.9873 9.86925 11.0003 9.9343 11.0003 10C11.0003 10.0657 10.9873 10.1308 10.9622 10.1914C10.9371 10.2521 10.9002 10.3073 10.8538 10.3538C10.8073 10.4002 10.7521 10.4371 10.6915 10.4622C10.6308 10.4873 10.5657 10.5003 10.5 10.5003C10.4343 10.5003 10.3693 10.4873 10.3086 10.4622C10.2479 10.4371 10.1927 10.4002 10.1463 10.3538L8.5 8.70687L6.85375 10.3538C6.8073 10.4002 6.75215 10.4371 6.69145 10.4622C6.63075 10.4873 6.5657 10.5003 6.5 10.5003C6.43431 10.5003 6.36925 10.4873 6.30855 10.4622C6.24786 10.4371 6.19271 10.4002 6.14625 10.3538C6.0998 10.3073 6.06295 10.2521 6.03781 10.1914C6.01266 10.1308 5.99972 10.0657 5.99972 10C5.99972 9.9343 6.01266 9.86925 6.03781 9.80855C6.06295 9.74786 6.0998 9.69271 6.14625 9.64625L7.79313 8L6.14625 6.35375C6.05243 6.25993 5.99972 6.13268 5.99972 6C5.99972 5.86732 6.05243 5.74007 6.14625 5.64625C6.24007 5.55243 6.36732 5.49972 6.5 5.49972C6.63268 5.49972 6.75993 5.55243 6.85375 5.64625L8.5 7.29313L10.1463 5.64625C10.1927 5.59979 10.2479 5.56294 10.3086 5.5378C10.3693 5.51266 10.4343 5.49972 10.5 5.49972C10.5657 5.49972 10.6308 5.51266 10.6915 5.5378C10.7521 5.56294 10.8073 5.59979 10.8538 5.64625C10.9002 5.6927 10.9371 5.74786 10.9622 5.80855C10.9873 5.86925 11.0003 5.9343 11.0003 6C11.0003 6.0657 10.9873 6.13075 10.9622 6.19145C10.9371 6.25214 10.9002 6.3073 10.8538 6.35375ZM15 8C15 9.28558 14.6188 10.5423 13.9046 11.6112C13.1903 12.6801 12.1752 13.5132 10.9874 14.0052C9.79973 14.4972 8.49279 14.6259 7.23192 14.3751C5.97104 14.1243 4.81285 13.5052 3.90381 12.5962C2.99477 11.6872 2.3757 10.529 2.1249 9.26809C1.87409 8.00721 2.00282 6.70028 2.49479 5.51256C2.98676 4.32484 3.81988 3.30968 4.8888 2.59545C5.95772 1.88122 7.21442 1.5 8.5 1.5C10.2234 1.50182 11.8756 2.18722 13.0942 3.40582C14.3128 4.62441 14.9982 6.27665 15 8ZM14 8C14 6.9122 13.6774 5.84883 13.0731 4.94436C12.4687 4.03989 11.6098 3.33494 10.6048 2.91866C9.59977 2.50238 8.4939 2.39346 7.42701 2.60568C6.36011 2.8179 5.3801 3.34172 4.61092 4.11091C3.84173 4.8801 3.3179 5.86011 3.10568 6.927C2.89347 7.9939 3.00238 9.09977 3.41867 10.1048C3.83495 11.1098 4.5399 11.9687 5.44437 12.5731C6.34884 13.1774 7.41221 13.5 8.5 13.5C9.95819 13.4983 11.3562 12.9184 12.3873 11.8873C13.4184 10.8562 13.9983 9.45818 14 8Z" fill="#0071C2" />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="td_width">
                      <div className="lg:flex items-start gap_20 relative">
                        <div className="compare_company_profile_thumb">
                          <Link href={`/serviceproviders-details/${companiesToCompare[2].slug}`}><img src={companiesToCompare[2]?.logoAsset?.url || "/no-image-available.jpg"} alt="" loading="lazy" width="150" height="150" decoding="async" data-nimg="1" className="aspect-square w-36 rounded-lg object-cover" /></Link>
                        </div>
                        <div>
                          <h3 className="comare_title  default_text_color pr-5">{companiesToCompare[2]?.name}</h3>
                        </div>
                        <div className="absolute -right-5 top-0">
                          <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => removeCompanyFromComparing(2)}
                          >
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g id="XCircle">
                                <path id="Vector" d="M10.8538 6.35375L9.20688 8L10.8538 9.64625C10.9002 9.69271 10.9371 9.74786 10.9622 9.80855C10.9873 9.86925 11.0003 9.9343 11.0003 10C11.0003 10.0657 10.9873 10.1308 10.9622 10.1914C10.9371 10.2521 10.9002 10.3073 10.8538 10.3538C10.8073 10.4002 10.7521 10.4371 10.6915 10.4622C10.6308 10.4873 10.5657 10.5003 10.5 10.5003C10.4343 10.5003 10.3693 10.4873 10.3086 10.4622C10.2479 10.4371 10.1927 10.4002 10.1463 10.3538L8.5 8.70687L6.85375 10.3538C6.8073 10.4002 6.75215 10.4371 6.69145 10.4622C6.63075 10.4873 6.5657 10.5003 6.5 10.5003C6.43431 10.5003 6.36925 10.4873 6.30855 10.4622C6.24786 10.4371 6.19271 10.4002 6.14625 10.3538C6.0998 10.3073 6.06295 10.2521 6.03781 10.1914C6.01266 10.1308 5.99972 10.0657 5.99972 10C5.99972 9.9343 6.01266 9.86925 6.03781 9.80855C6.06295 9.74786 6.0998 9.69271 6.14625 9.64625L7.79313 8L6.14625 6.35375C6.05243 6.25993 5.99972 6.13268 5.99972 6C5.99972 5.86732 6.05243 5.74007 6.14625 5.64625C6.24007 5.55243 6.36732 5.49972 6.5 5.49972C6.63268 5.49972 6.75993 5.55243 6.85375 5.64625L8.5 7.29313L10.1463 5.64625C10.1927 5.59979 10.2479 5.56294 10.3086 5.5378C10.3693 5.51266 10.4343 5.49972 10.5 5.49972C10.5657 5.49972 10.6308 5.51266 10.6915 5.5378C10.7521 5.56294 10.8073 5.59979 10.8538 5.64625C10.9002 5.6927 10.9371 5.74786 10.9622 5.80855C10.9873 5.86925 11.0003 5.9343 11.0003 6C11.0003 6.0657 10.9873 6.13075 10.9622 6.19145C10.9371 6.25214 10.9002 6.3073 10.8538 6.35375ZM15 8C15 9.28558 14.6188 10.5423 13.9046 11.6112C13.1903 12.6801 12.1752 13.5132 10.9874 14.0052C9.79973 14.4972 8.49279 14.6259 7.23192 14.3751C5.97104 14.1243 4.81285 13.5052 3.90381 12.5962C2.99477 11.6872 2.3757 10.529 2.1249 9.26809C1.87409 8.00721 2.00282 6.70028 2.49479 5.51256C2.98676 4.32484 3.81988 3.30968 4.8888 2.59545C5.95772 1.88122 7.21442 1.5 8.5 1.5C10.2234 1.50182 11.8756 2.18722 13.0942 3.40582C14.3128 4.62441 14.9982 6.27665 15 8ZM14 8C14 6.9122 13.6774 5.84883 13.0731 4.94436C12.4687 4.03989 11.6098 3.33494 10.6048 2.91866C9.59977 2.50238 8.4939 2.39346 7.42701 2.60568C6.36011 2.8179 5.3801 3.34172 4.61092 4.11091C3.84173 4.8801 3.3179 5.86011 3.10568 6.927C2.89347 7.9939 3.00238 9.09977 3.41867 10.1048C3.83495 11.1098 4.5399 11.9687 5.44437 12.5731C6.34884 13.1774 7.41221 13.5 8.5 13.5C9.95819 13.4983 11.3562 12.9184 12.3873 11.8873C13.4184 10.8562 13.9983 9.45818 14 8Z" fill="#0071C2" />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="td_width">
                      <div className="lg:flex items-start gap_20 relative">
                        <div className="compare_company_profile_thumb">
                          <Link href={`/serviceproviders-details/${companiesToCompare[3].slug}`}><img src={companiesToCompare[3]?.logoAsset?.url || "/no-image-available.jpg"} alt="" loading="lazy" width="150" height="150" decoding="async" data-nimg="1" className="aspect-square w-36 rounded-lg object-cover" /></Link>
                        </div>
                        <div>
                          <h3 className="comare_title  default_text_color pr-5">{companiesToCompare[3]?.name}</h3>
                        </div>
                        <div className="absolute -right-5 top-0">
                          <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => removeCompanyFromComparing(3)}
                          >
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g id="XCircle">
                                <path id="Vector" d="M10.8538 6.35375L9.20688 8L10.8538 9.64625C10.9002 9.69271 10.9371 9.74786 10.9622 9.80855C10.9873 9.86925 11.0003 9.9343 11.0003 10C11.0003 10.0657 10.9873 10.1308 10.9622 10.1914C10.9371 10.2521 10.9002 10.3073 10.8538 10.3538C10.8073 10.4002 10.7521 10.4371 10.6915 10.4622C10.6308 10.4873 10.5657 10.5003 10.5 10.5003C10.4343 10.5003 10.3693 10.4873 10.3086 10.4622C10.2479 10.4371 10.1927 10.4002 10.1463 10.3538L8.5 8.70687L6.85375 10.3538C6.8073 10.4002 6.75215 10.4371 6.69145 10.4622C6.63075 10.4873 6.5657 10.5003 6.5 10.5003C6.43431 10.5003 6.36925 10.4873 6.30855 10.4622C6.24786 10.4371 6.19271 10.4002 6.14625 10.3538C6.0998 10.3073 6.06295 10.2521 6.03781 10.1914C6.01266 10.1308 5.99972 10.0657 5.99972 10C5.99972 9.9343 6.01266 9.86925 6.03781 9.80855C6.06295 9.74786 6.0998 9.69271 6.14625 9.64625L7.79313 8L6.14625 6.35375C6.05243 6.25993 5.99972 6.13268 5.99972 6C5.99972 5.86732 6.05243 5.74007 6.14625 5.64625C6.24007 5.55243 6.36732 5.49972 6.5 5.49972C6.63268 5.49972 6.75993 5.55243 6.85375 5.64625L8.5 7.29313L10.1463 5.64625C10.1927 5.59979 10.2479 5.56294 10.3086 5.5378C10.3693 5.51266 10.4343 5.49972 10.5 5.49972C10.5657 5.49972 10.6308 5.51266 10.6915 5.5378C10.7521 5.56294 10.8073 5.59979 10.8538 5.64625C10.9002 5.6927 10.9371 5.74786 10.9622 5.80855C10.9873 5.86925 11.0003 5.9343 11.0003 6C11.0003 6.0657 10.9873 6.13075 10.9622 6.19145C10.9371 6.25214 10.9002 6.3073 10.8538 6.35375ZM15 8C15 9.28558 14.6188 10.5423 13.9046 11.6112C13.1903 12.6801 12.1752 13.5132 10.9874 14.0052C9.79973 14.4972 8.49279 14.6259 7.23192 14.3751C5.97104 14.1243 4.81285 13.5052 3.90381 12.5962C2.99477 11.6872 2.3757 10.529 2.1249 9.26809C1.87409 8.00721 2.00282 6.70028 2.49479 5.51256C2.98676 4.32484 3.81988 3.30968 4.8888 2.59545C5.95772 1.88122 7.21442 1.5 8.5 1.5C10.2234 1.50182 11.8756 2.18722 13.0942 3.40582C14.3128 4.62441 14.9982 6.27665 15 8ZM14 8C14 6.9122 13.6774 5.84883 13.0731 4.94436C12.4687 4.03989 11.6098 3.33494 10.6048 2.91866C9.59977 2.50238 8.4939 2.39346 7.42701 2.60568C6.36011 2.8179 5.3801 3.34172 4.61092 4.11091C3.84173 4.8801 3.3179 5.86011 3.10568 6.927C2.89347 7.9939 3.00238 9.09977 3.41867 10.1048C3.83495 11.1098 4.5399 11.9687 5.44437 12.5731C6.34884 13.1774 7.41221 13.5 8.5 13.5C9.95819 13.4983 11.3562 12.9184 12.3873 11.8873C13.4184 10.8562 13.9983 9.45818 14 8Z" fill="#0071C2" />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="td_width">
                      <div className="lg:flex items-start gap_20 relative">
                        <div className="compare_company_profile_thumb">
                          <Link href={`/serviceproviders-details/${companiesToCompare[4].slug}`}><img src={companiesToCompare[4]?.logoAsset?.url || "/no-image-available.jpg"} alt="" loading="lazy" width="150" height="150" decoding="async" data-nimg="1" className="aspect-square w-36 rounded-lg object-cover" /></Link>
                        </div>
                        <div>
                          <h3 className="comare_title  default_text_color pr-5">{companiesToCompare[4]?.name}</h3>
                        </div>
                        <div className="absolute -right-5 top-0">
                          <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => removeCompanyFromComparing(4)}
                          >
                            <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g id="XCircle">
                                <path id="Vector" d="M10.8538 6.35375L9.20688 8L10.8538 9.64625C10.9002 9.69271 10.9371 9.74786 10.9622 9.80855C10.9873 9.86925 11.0003 9.9343 11.0003 10C11.0003 10.0657 10.9873 10.1308 10.9622 10.1914C10.9371 10.2521 10.9002 10.3073 10.8538 10.3538C10.8073 10.4002 10.7521 10.4371 10.6915 10.4622C10.6308 10.4873 10.5657 10.5003 10.5 10.5003C10.4343 10.5003 10.3693 10.4873 10.3086 10.4622C10.2479 10.4371 10.1927 10.4002 10.1463 10.3538L8.5 8.70687L6.85375 10.3538C6.8073 10.4002 6.75215 10.4371 6.69145 10.4622C6.63075 10.4873 6.5657 10.5003 6.5 10.5003C6.43431 10.5003 6.36925 10.4873 6.30855 10.4622C6.24786 10.4371 6.19271 10.4002 6.14625 10.3538C6.0998 10.3073 6.06295 10.2521 6.03781 10.1914C6.01266 10.1308 5.99972 10.0657 5.99972 10C5.99972 9.9343 6.01266 9.86925 6.03781 9.80855C6.06295 9.74786 6.0998 9.69271 6.14625 9.64625L7.79313 8L6.14625 6.35375C6.05243 6.25993 5.99972 6.13268 5.99972 6C5.99972 5.86732 6.05243 5.74007 6.14625 5.64625C6.24007 5.55243 6.36732 5.49972 6.5 5.49972C6.63268 5.49972 6.75993 5.55243 6.85375 5.64625L8.5 7.29313L10.1463 5.64625C10.1927 5.59979 10.2479 5.56294 10.3086 5.5378C10.3693 5.51266 10.4343 5.49972 10.5 5.49972C10.5657 5.49972 10.6308 5.51266 10.6915 5.5378C10.7521 5.56294 10.8073 5.59979 10.8538 5.64625C10.9002 5.6927 10.9371 5.74786 10.9622 5.80855C10.9873 5.86925 11.0003 5.9343 11.0003 6C11.0003 6.0657 10.9873 6.13075 10.9622 6.19145C10.9371 6.25214 10.9002 6.3073 10.8538 6.35375ZM15 8C15 9.28558 14.6188 10.5423 13.9046 11.6112C13.1903 12.6801 12.1752 13.5132 10.9874 14.0052C9.79973 14.4972 8.49279 14.6259 7.23192 14.3751C5.97104 14.1243 4.81285 13.5052 3.90381 12.5962C2.99477 11.6872 2.3757 10.529 2.1249 9.26809C1.87409 8.00721 2.00282 6.70028 2.49479 5.51256C2.98676 4.32484 3.81988 3.30968 4.8888 2.59545C5.95772 1.88122 7.21442 1.5 8.5 1.5C10.2234 1.50182 11.8756 2.18722 13.0942 3.40582C14.3128 4.62441 14.9982 6.27665 15 8ZM14 8C14 6.9122 13.6774 5.84883 13.0731 4.94436C12.4687 4.03989 11.6098 3.33494 10.6048 2.91866C9.59977 2.50238 8.4939 2.39346 7.42701 2.60568C6.36011 2.8179 5.3801 3.34172 4.61092 4.11091C3.84173 4.8801 3.3179 5.86011 3.10568 6.927C2.89347 7.9939 3.00238 9.09977 3.41867 10.1048C3.83495 11.1098 4.5399 11.9687 5.44437 12.5731C6.34884 13.1774 7.41221 13.5 8.5 13.5C9.95819 13.4983 11.3562 12.9184 12.3873 11.8873C13.4184 10.8562 13.9983 9.45818 14 8Z" fill="#0071C2" />
                              </g>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                }

                {
                  companyCounts < 5 &&
                  <td className="table_compare_last_child_border_none">
                    <div className="w-[240px]">
                      <div className="compare_company flex-none relative">
                        <button className="text-base font-semibold link_color" onClick={(e) => {
                          e.preventDefault();
                          router.push("/serviceproviders");
                        }}> + Compare another company
                        </button>
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td >
                    <div className="space-y-4 mt-4 text-sm">
                      <p className="truncate lg:w-[320px] w-[150px]">Website: <Link target="_blank" href={companiesToCompare[0].website && (companiesToCompare[0].website.startsWith('http://') || companiesToCompare[0].website.startsWith('https://') ? companiesToCompare[0].website : `https://${companiesToCompare[0].website}`)} className="link_color">{(companiesToCompare[0]?.website) ? companiesToCompare[0]?.website : ""}</Link></p>
                      <p>Employees: {companiesToCompare[0]?.companySizes?.size}</p>
                      <p>Founded: {companiesToCompare[0].CertificationAndDiligence?.foundingYear ? new Date(companiesToCompare[0].CertificationAndDiligence?.foundingYear as string).getFullYear() : ""}</p>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td >
                    <div className="space-y-4 mt-4 text-sm">
                      <p className="truncate lg:w-[320px] w-[150px]">Website: <Link target="_blank" href={companiesToCompare[1].website && (companiesToCompare[0].website.startsWith('http://') || companiesToCompare[1].website.startsWith('https://') ? companiesToCompare[1].website : `https://${companiesToCompare[1].website}`)} className="link_color">{(companiesToCompare[1]?.website) ? companiesToCompare[1]?.website : ""} </Link></p>
                      <p>Employees: {companiesToCompare[1]?.companySizes?.size}</p>
                      <p>Founded: {companiesToCompare[1].CertificationAndDiligence?.foundingYear ? new Date(companiesToCompare[1].CertificationAndDiligence?.foundingYear as string).getFullYear() : ""}</p>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td >
                    <div className="space-y-4 mt-4 text-sm">
                      <p className="truncate lg:w-[320px] w-[150px]">Website: <Link target="_blank" href={companiesToCompare[2].website && (companiesToCompare[2].website.startsWith('http://') || companiesToCompare[2].website.startsWith('https://') ? companiesToCompare[2].website : `https://${companiesToCompare[2].website}`)} className="link_color">{(companiesToCompare[2]?.website) ? companiesToCompare[2]?.website : ""}</Link></p>
                      <p>Employees: {companiesToCompare[2]?.companySizes?.size}</p>
                      <p>Founded: {companiesToCompare[2].CertificationAndDiligence?.foundingYear ? new Date(companiesToCompare[2].CertificationAndDiligence?.foundingYear as string).getFullYear() : ""}</p>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td >
                    <div className="space-y-4 mt-4 text-sm">
                      <p className="truncate lg:w-[320px] w-[150px]">Website: <Link target="_blank" href={companiesToCompare[3].website && (companiesToCompare[3].website.startsWith('http://') || companiesToCompare[3].website.startsWith('https://') ? companiesToCompare[3].website : `https://${companiesToCompare[3].website}`)} className="link_color">{(companiesToCompare[3]?.website) ? companiesToCompare[3]?.website : ""}</Link></p>
                      <p>Employees: {companiesToCompare[3]?.companySizes?.size}</p>
                      <p>Founded: {companiesToCompare[3].CertificationAndDiligence?.foundingYear ? new Date(companiesToCompare[3].CertificationAndDiligence?.foundingYear as string).getFullYear() : ""}</p>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td >
                    <div className="space-y-4 mt-4 text-sm">
                      <p className="truncate lg:w-[320px] w-[150px]">Website: <Link target="_blank" href={companiesToCompare[4].website && (companiesToCompare[4].website.startsWith('http://') || companiesToCompare[4].website.startsWith('https://') ? companiesToCompare[4].website : `https://${companiesToCompare[4].website}`)} className="link_color">{(companiesToCompare[4]?.website) ? companiesToCompare[4]?.website : ""}</Link></p>
                      <p>Employees: {companiesToCompare[4]?.companySizes?.size}</p>
                      <p>Founded: {companiesToCompare[4].CertificationAndDiligence?.foundingYear ? new Date(companiesToCompare[4].CertificationAndDiligence?.foundingYear as string).getFullYear() : ""}</p>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Services</h4>
                      <div className="space-y-1 mt-4">
                        {companiesToCompare[0]?.ServicesOpt?.map(
                          (services: any) =>
                            services.service &&
                            services.service.serviceName && (
                              <button
                                key={`user_2${services.service.serviceName}`}
                                type="button"
                                className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Services</h4>
                      <div className="space-y-1 mt-4">
                        {companiesToCompare[1]?.ServicesOpt?.map(
                          (services: any) =>
                            services.service &&
                            services.service.serviceName && (
                              <button
                                key={`user_2${services.service.serviceName}`}
                                type="button"
                                className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Services</h4>
                      <div className="space-y-1 mt-4">
                        {companiesToCompare[2]?.ServicesOpt?.map(
                          (services: any) =>
                            services.service &&
                            services.service.serviceName && (
                              <button
                                key={`user_2${services.service.serviceName}`}
                                type="button"
                                className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Services</h4>
                      <div className="space-y-1 mt-4">
                        {companiesToCompare[3]?.ServicesOpt?.map(
                          (services: any) =>
                            services.service &&
                            services.service.serviceName && (
                              <button
                                key={`user_2${services.service.serviceName}`}
                                type="button"
                                className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Services</h4>
                      <div className="space-y-1 mt-4">
                        {companiesToCompare[4]?.ServicesOpt?.map(
                          (services: any) =>
                            services.service &&
                            services.service.serviceName && (
                              <button
                                key={`user_2${services.service.serviceName}`}
                                type="button"
                                className={`default_text_color cursor-default bg_${serviceColoring[services.service.groupId]} focus:outline-none font-medium rounded-sm text_xs_13 px-2 py-1 mr-1`}
                              >
                                {services.service.serviceName}
                              </button>
                            ),
                        )}
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Albums</h4>
                      <div className="space-y-1 mt-4 grid grid-cols-4 gap-1 lg:grid-cols-4 lg:gap-1 mt-2.5 mb-1">
                        {
                          companiesToCompare[0]?.portfolioAlbum?.map((album: any, index: any) => (
                            <>
                              {
                                index < 8 &&
                                <div className={`cursor-pointer ${index == 0 ? 'mt-1' : ''} relative`} key={index} onClick={() => { onSelectAnyAlbum(album.portfolioAlbumFiles[0]?.albumId); }}>
                                  {
                                    isAlbumLoading && album.portfolioAlbumFiles[0]?.albumId == albumId &&
                                    <div className={`absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100`}>
                                      <Spinner />
                                    </div>
                                  }
                                  <Tooltip content={album.albumName}>
                                    <Image width={150} height={150} alt="" src={album.portfolioAlbumFiles[0]?.thumbnail} className=" h-12 w-full object-cover rounded-[4px]" />
                                    {
                                      album.portfolioAlbumFiles[0]?.type !== 'image' && 
                                      <div className="absolute inset-0 flex justify-center items-center">
                                        <Image
                                          src="/play-icon.png"
                                          alt="Play icon"
                                          width={20}
                                          height={20}
                                        />
                                      </div>
                                    }
                                  </Tooltip>
                                </div>
                              }
                            </>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Albums</h4>
                      <div className="space-y-1 mt-4 grid grid-cols-4 gap-1 lg:grid-cols-4 lg:gap-1 mt-2.5 mb-1">
                        {
                          companiesToCompare[1]?.portfolioAlbum?.map((album: any, index: any) => (
                            <>
                              {
                                index < 8 &&
                                <div className={`cursor-pointer ${index == 0 ? 'mt-1' : ''} relative`} key={index} onClick={() => { onSelectAnyAlbum(album.portfolioAlbumFiles[0]?.albumId); }}>
                                  {
                                    isAlbumLoading && album.portfolioAlbumFiles[0]?.albumId == albumId &&
                                    <div className={`absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100`}>
                                      <Spinner />
                                    </div>
                                  }
                                  <Tooltip content={album.albumName}>
                                    <Image width={150} height={150} alt="" src={album.portfolioAlbumFiles[0]?.thumbnail} className=" h-12 w-full object-cover rounded-[4px]" />
                                    {
                                      album.portfolioAlbumFiles[0]?.type !== 'image' && 
                                      <div className="absolute inset-0 flex justify-center items-center">
                                        <Image
                                          src="/play-icon.png"
                                          alt="Play icon"
                                          width={20}
                                          height={20}
                                        />
                                      </div>
                                    }
                                  </Tooltip>
                                </div>
                              }
                            </>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Albums</h4>
                      <div className="space-y-1 mt-4 grid grid-cols-4 gap-1 lg:grid-cols-4 lg:gap-1 mt-2.5 mb-1">
                        {
                          companiesToCompare[2]?.portfolioAlbum?.map((album: any, index: any) => (
                            <>
                              {
                                index < 8 &&
                                <div className={`cursor-pointer ${index == 0 ? 'mt-1' : ''} relative`} key={index} onClick={() => { onSelectAnyAlbum(album.portfolioAlbumFiles[0]?.albumId); }}>
                                  {
                                    isAlbumLoading && album.portfolioAlbumFiles[0]?.albumId == albumId &&
                                    <div className={`absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100`}>
                                      <Spinner />
                                    </div>
                                  }
                                  <Tooltip content={album.albumName}>
                                    <Image width={150} height={150} alt="" src={album.portfolioAlbumFiles[0]?.thumbnail} className=" h-12 w-full object-cover rounded-[4px]" />
                                    {
                                      album.portfolioAlbumFiles[0]?.type !== 'image' && 
                                      <div className="absolute inset-0 flex justify-center items-center">
                                        <Image
                                          src="/play-icon.png"
                                          alt="Play icon"
                                          width={20}
                                          height={20}
                                        />
                                      </div>
                                    }
                                  </Tooltip>
                                </div>
                              }
                            </>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Albums</h4>
                      <div className="space-y-1 mt-4 grid grid-cols-4 gap-1 lg:grid-cols-4 lg:gap-1 mt-2.5 mb-1">
                        {
                          companiesToCompare[3]?.portfolioAlbum?.map((album: any, index: any) => (
                            <>
                              {
                                index < 8 &&
                                <div className={`cursor-pointer ${index == 0 ? 'mt-1' : ''} relative`} key={index} onClick={() => { onSelectAnyAlbum(album.portfolioAlbumFiles[0]?.albumId); }}>
                                  {
                                    isAlbumLoading && album.portfolioAlbumFiles[0]?.albumId == albumId &&
                                    <div className={`absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100`}>
                                      <Spinner />
                                    </div>
                                  }
                                  <Tooltip content={album.albumName}>
                                    <Image width={150} height={150} alt="" src={album.portfolioAlbumFiles[0]?.thumbnail} className=" h-12 w-full object-cover rounded-[4px]" />
                                    {
                                      album.portfolioAlbumFiles[0]?.type !== 'image' && 
                                      <div className="absolute inset-0 flex justify-center items-center">
                                        <Image
                                          src="/play-icon.png"
                                          alt="Play icon"
                                          width={20}
                                          height={20}
                                        />
                                      </div>
                                    }
                                  </Tooltip>
                                </div>
                              }
                            </>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Albums</h4>
                      <div className="space-y-1 mt-4 grid grid-cols-4 gap-1 lg:grid-cols-4 lg:gap-1 mt-2.5 mb-1">
                        {
                          companiesToCompare[4]?.portfolioAlbum?.map((album: any, index: any) => (
                            <>
                              {
                                index < 8 &&
                                <div className={`cursor-pointer ${index == 0 ? 'mt-1' : ''} relative`} key={index} onClick={() => { onSelectAnyAlbum(album.portfolioAlbumFiles[0]?.albumId); }}>
                                  {
                                    isAlbumLoading && album.portfolioAlbumFiles[0]?.albumId == albumId &&
                                    <div className={`absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100`}>
                                      <Spinner />
                                    </div>
                                  }
                                  <Tooltip content={album.albumName}>
                                    <Image width={150} height={150} alt="" src={album.portfolioAlbumFiles[0]?.thumbnail} className=" h-12 w-full object-cover rounded-[4px]" />
                                    {
                                      album.portfolioAlbumFiles[0]?.type !== 'image' && 
                                      <div className="absolute inset-0 flex justify-center items-center">
                                        <Image
                                          src="/play-icon.png"
                                          alt="Play icon"
                                          width={20}
                                          height={20}
                                        />
                                      </div>
                                    }
                                  </Tooltip>
                                </div>
                              }
                            </>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>              

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Certifications</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[0].CertificationAndDiligence?.certifications?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[0].showFullCertificate ?
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.certifications)
                                    :
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.certifications, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.certifications)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullCertificate", 0) }}>{companiesToCompare[0].CertificationAndDiligence?.certifications?.length > 400 ? companiesToCompare[0].showFullCertificate ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Certifications</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[1].CertificationAndDiligence?.certifications?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[1].showFullCertificate ?
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.certifications)
                                    :
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.certifications, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.certifications)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullCertificate", 1) }}>{companiesToCompare[1].CertificationAndDiligence?.certifications?.length > 400 ? companiesToCompare[1].showFullCertificate ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Certifications</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[2].CertificationAndDiligence?.certifications?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[2].showFullCertificate ?
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.certifications)
                                    :
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.certifications, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.certifications)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullCertificate", 2) }}>{companiesToCompare[2].CertificationAndDiligence?.certifications?.length > 400 ? companiesToCompare[2].showFullCertificate ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Certifications</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[3].CertificationAndDiligence?.certifications?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[3].showFullCertificate ?
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.certifications)
                                    :
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.certifications, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.certifications)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullCertificate", 3) }}>{companiesToCompare[3].CertificationAndDiligence?.certifications?.length > 400 ? companiesToCompare[3].showFullCertificate ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Certifications</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[4].CertificationAndDiligence?.certifications?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[4].showFullCertificate ?
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.certifications)
                                    :
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.certifications, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.certifications)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullCertificate", 4) }}>{companiesToCompare[4].CertificationAndDiligence?.certifications?.length > 400 ? companiesToCompare[4].showFullCertificate ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Security</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[0].CertificationAndDiligence?.Security?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[0].showFullSecurity ?
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.Security)
                                    :
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.Security, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.Security)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullSecurity", 0) }}>{companiesToCompare[0].CertificationAndDiligence?.Security?.length > 400 ? companiesToCompare[0].showFullSecurity ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Security</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[1].CertificationAndDiligence?.Security?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[1].showFullSecurity ?
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.Security)
                                    :
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.Security, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.Security)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullSecurity", 1) }}>{companiesToCompare[1].CertificationAndDiligence?.Security?.length > 400 ? companiesToCompare[1].showFullSecurity ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Security</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[2].CertificationAndDiligence?.Security?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[2].showFullSecurity ?
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.Security)
                                    :
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.Security, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.Security)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullSecurity", 2) }}>{companiesToCompare[2].CertificationAndDiligence?.Security?.length > 400 ? companiesToCompare[2].showFullSecurity ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Security</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[3].CertificationAndDiligence?.Security?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[3].showFullSecurity ?
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.Security)
                                    :
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.Security, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.Security)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullSecurity", 3) }}>{companiesToCompare[3].CertificationAndDiligence?.Security?.length > 400 ? companiesToCompare[3].showFullSecurity ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Security</h4>
                      <div className="space-y-4 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[4].CertificationAndDiligence?.Security?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[4].showFullSecurity ?
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.Security)
                                    :
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.Security, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.Security)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullSecurity", 4) }}>{companiesToCompare[4].CertificationAndDiligence?.Security?.length > 400 ? companiesToCompare[4].showFullSecurity ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Platforms</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[0].CompanyPlatformExperience && companiesToCompare[0].CompanyPlatformExperience?.length > 0 && companiesToCompare[0].CompanyPlatformExperience.map((platforms: { platforms: { name: string, } }) => (
                            <p className="text-sm">
                              {platforms.platforms.name}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Platforms</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[1].CompanyPlatformExperience && companiesToCompare[1].CompanyPlatformExperience?.length > 0 && companiesToCompare[1].CompanyPlatformExperience.map((platforms: { platforms: { name: string, } }) => (
                            <p className="text-sm">
                              {platforms.platforms.name}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Platforms</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[2].CompanyPlatformExperience && companiesToCompare[2].CompanyPlatformExperience?.length > 0 && companiesToCompare[2].CompanyPlatformExperience.map((platforms: { platforms: { name: string, } }) => (
                            <p className="text-sm">
                              {platforms.platforms.name}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Platforms</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[3].CompanyPlatformExperience && companiesToCompare[3].CompanyPlatformExperience?.length > 0 && companiesToCompare[3].CompanyPlatformExperience.map((platforms: { platforms: { name: string, } }) => (
                            <p className="text-sm">
                              {platforms.platforms.name}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Platforms</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[4].CompanyPlatformExperience && companiesToCompare[4].CompanyPlatformExperience?.length > 0 && companiesToCompare[4].CompanyPlatformExperience.map((platforms: { platforms: { name: string, } }) => (
                            <p className="text-sm">
                              {platforms.platforms.name}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Game Engines</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[0].CompanyGameEngines && companiesToCompare[0].CompanyGameEngines?.length > 0 && companiesToCompare[0].CompanyGameEngines.map((gameEngine: { gameEngineName: string }) => (
                            <p className="text-sm">
                              {gameEngine.gameEngineName}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Game Engines</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[1].CompanyGameEngines && companiesToCompare[1].CompanyGameEngines?.length > 0 && companiesToCompare[1].CompanyGameEngines.map((gameEngine: { gameEngineName: string }) => (
                            <p className="text-sm">
                              {gameEngine.gameEngineName}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Game Engines</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[2].CompanyGameEngines && companiesToCompare[2].CompanyGameEngines?.length > 0 && companiesToCompare[2].CompanyGameEngines.map((gameEngine: { gameEngineName: string }) => (
                            <p className="text-sm">
                              {gameEngine.gameEngineName}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Game Engines</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[3].CompanyGameEngines && companiesToCompare[3].CompanyGameEngines?.length > 0 && companiesToCompare[3].CompanyGameEngines.map((gameEngine: { gameEngineName: string }) => (
                            <p className="text-sm">
                              {gameEngine.gameEngineName}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Game Engines</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[4].CompanyGameEngines && companiesToCompare[4].CompanyGameEngines?.length > 0 && companiesToCompare[4].CompanyGameEngines.map((gameEngine: { gameEngineName: string }) => (
                            <p className="text-sm">
                              {gameEngine.gameEngineName}
                            </p>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Tools & Software</h4>
                      <div className="space-y-1 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[0].CertificationAndDiligence?.tools?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[0].showFullTools ?
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.tools)
                                    :
                                    makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.tools, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[0].CertificationAndDiligence?.tools)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullTools", 0) }}>{companiesToCompare[0].CertificationAndDiligence?.tools?.length > 400 ? companiesToCompare[0].showFullTools ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Tools & Software</h4>
                      <div className="space-y-1 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[1].CertificationAndDiligence?.tools?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[1].showFullTools ?
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.tools)
                                    :
                                    makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.tools, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[1].CertificationAndDiligence?.tools)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullTools", 1) }}>{companiesToCompare[1].CertificationAndDiligence?.tools?.length > 400 ? companiesToCompare[1].showFullTools ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Tools & Software</h4>
                      <div className="space-y-1 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[2].CertificationAndDiligence?.tools?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[2].showFullTools ?
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.tools)
                                    :
                                    makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.tools, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[2].CertificationAndDiligence?.tools)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullTools", 2) }}>{companiesToCompare[2].CertificationAndDiligence?.tools?.length > 400 ? companiesToCompare[2].showFullTools ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Tools & Software</h4>
                      <div className="space-y-1 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[3].CertificationAndDiligence?.tools?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[3].showFullTools ?
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.tools)
                                    :
                                    makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.tools, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[3].CertificationAndDiligence?.tools)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullTools", 3) }}>{companiesToCompare[3].CertificationAndDiligence?.tools?.length > 400 ? companiesToCompare[3].showFullTools ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Tools & Software</h4>
                      <div className="space-y-1 mt-4">
                        <p className="text-sm whitespace-break-spaces">
                          {
                            companiesToCompare[4].CertificationAndDiligence?.tools?.length > 400 ?
                              <>
                                {
                                  companiesToCompare[4].showFullTools ?
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.tools)
                                    :
                                    makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.tools, 1)
                                }
                              </>
                              :
                              makeTheStringCorrect(companiesToCompare[4].CertificationAndDiligence?.tools)
                          }
                          <span style={{ cursor: "pointer" }} className="link_color" onClick={() => { updateComparingCompanies("showFullTools", 4) }}>{companiesToCompare[4].CertificationAndDiligence?.tools?.length > 400 ? companiesToCompare[4].showFullTools ? " See less" : " See more" : ""}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Locations</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[0].CompanyAddress?.map((add: any, index: number) => (
                            <div className="text-sm" key={index}>
                              <p>{add.location_name}</p>
                              <p>{add.address1}</p>
                              <p>{add.address2}</p>
                              <p>
                                {" "}
                                {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Locations</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[1].CompanyAddress?.map((add: any, index: number) => (
                            <div className="text-sm" key={index}>
                              <p>{add.location_name}</p>
                              <p>{add.address1}</p>
                              <p>{add.address2}</p>
                              <p>
                                {" "}
                                {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Locations</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[2].CompanyAddress?.map((add: any, index: number) => (
                            <div className="text-sm" key={index}>
                              <p>{add.location_name}</p>
                              <p>{add.address1}</p>
                              <p>{add.address2}</p>
                              <p>
                                {" "}
                                {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Locations</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[3].CompanyAddress?.map((add: any, index: number) => (
                            <div className="text-sm" key={index}>
                              <p>{add.location_name}</p>
                              <p>{add.address1}</p>
                              <p>{add.address2}</p>
                              <p>
                                {" "}
                                {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Locations</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[4].CompanyAddress?.map((add: any, index: number) => (
                            <div className="text-sm" key={index}>
                              <p>{add.location_name}</p>
                              <p>{add.address1}</p>
                              <p>{add.address2}</p>
                              <p>
                                {" "}
                                {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Project Highlights</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[0].portfolioProjects?.map((project: any, indexM: number) => (
                            <div key={indexM}>
                              <h5 className="font-semibold text-base default_text_color mt-4">{project.name}</h5>
                              <div className="space-y-4 mt-1">
                                <p className="text-sm">
                                  {
                                    new Date(project.completionDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  }
                                  <br />Type: {
                                    project.PlatformsOpt?.map((item: any, index: any) => (
                                      <span key={`projects_${index + item.platforms.name}`}>
                                        {item.platforms.name}
                                        {index < project.PlatformsOpt?.length - 1 && ", "}
                                      </span>
                                    ))
                                  }
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Project Highlights</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[1].portfolioProjects?.map((project: any, indexM: number) => (
                            <div key={indexM}>
                              <h5 className="font-semibold text-base default_text_color mt-4">{project.name}</h5>
                              <div className="space-y-4 mt-1">
                                <p className="text-sm">
                                  {
                                    new Date(project.completionDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  }
                                  <br />Type: {
                                    project.PlatformsOpt?.map((item: any, index: any) => (
                                      <span key={`projects_${index + item.platforms.name}`}>
                                        {item.platforms.name}
                                        {index < project.PlatformsOpt?.length - 1 && ", "}
                                      </span>
                                    ))
                                  }
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Project Highlights</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[2].portfolioProjects?.map((project: any, indexM: number) => (
                            <div key={indexM}>
                              <h5 className="font-semibold text-base default_text_color mt-4">{project.name}</h5>
                              <div className="space-y-4 mt-1">
                                <p className="text-sm">
                                  {
                                    new Date(project.completionDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  }
                                  <br />Type: {
                                    project.PlatformsOpt?.map((item: any, index: any) => (
                                      <span key={`projects_${index + item.platforms.name}`}>
                                        {item.platforms.name}
                                        {index < project.PlatformsOpt?.length - 1 && ", "}
                                      </span>
                                    ))
                                  }
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Project Highlights</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[3].portfolioProjects?.map((project: any, indexM: number) => (
                            <div key={indexM}>
                              <h5 className="font-semibold text-base default_text_color mt-4">{project.name}</h5>
                              <div className="space-y-4 mt-1">
                                <p className="text-sm">
                                  {
                                    new Date(project.completionDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  }
                                  <br />Type: {
                                    project.PlatformsOpt?.map((item: any, index: any) => (
                                      <span key={`projects_${index + item.platforms.name}`}>
                                        {item.platforms.name}
                                        {index < project.PlatformsOpt?.length - 1 && ", "}
                                      </span>
                                    ))
                                  }
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Project Highlights</h4>
                      <div className="space-y-4 mt-4">
                        {
                          companiesToCompare[4].portfolioProjects?.map((project: any, indexM: number) => (
                            <div key={indexM}>
                              <h5 className="font-semibold text-base default_text_color mt-4">{project.name}</h5>
                              <div className="space-y-4 mt-1">
                                <p className="text-sm">
                                  {
                                    new Date(project.completionDate).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })
                                  }
                                  <br />Type: {
                                    project.PlatformsOpt?.map((item: any, index: any) => (
                                      <span key={`projects_${index + item.platforms.name}`}>
                                        {item.platforms.name}
                                        {index < project.PlatformsOpt?.length - 1 && ", "}
                                      </span>
                                    ))
                                  }
                                </p>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>

              <tr>
                {
                  companiesToCompare && companiesToCompare[0] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Contacts</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[0]?.CompanyContacts?.map((contact: any) =>
                            <div className="flex items-center gap-4 mb-4">
                              <Image
                                src= { contact.profilePic || profilePlaceHolder }
                                alt=""
                                className="rounded-full object-cover"
                                width={55}
                                height={55}
                              />
                              <div>
                                <p className="font-compare-contact-heading default_text_color">{ contact.title }</p>
                                <div className="link_color text-sm">
                                  <Link prefetch={ false } href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank">{ contact.name }</Link>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[1] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Contacts</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[1]?.CompanyContacts?.map((contact: any) =>
                            <div className="flex items-center gap-4 mb-4">
                              <Image
                                src= { contact.profilePic || profilePlaceHolder }
                                alt=""
                                className="rounded-full object-cover"
                                width={55}
                                height={55}
                              />
                              <div>
                                <p className="font-compare-contact-heading default_text_color">{ contact.title }</p>
                                <div className="link_color text-sm">
                                  <Link prefetch={ false } href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank">{ contact.name }</Link>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[2] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Contacts</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[2]?.CompanyContacts?.map((contact: any) =>
                            <div className="flex items-center gap-4 mb-4">
                              <Image
                                src= { contact.profilePic || profilePlaceHolder }
                                alt=""
                                className="rounded-full object-cover"
                                width={55}
                                height={55}
                              />
                              <div>
                                <p className="font-compare-contact-heading default_text_color">{ contact.title }</p>
                                <div className="link_color text-sm">
                                  <Link prefetch={ false } href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank">{ contact.name }</Link>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[3] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Contacts</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[3]?.CompanyContacts?.map((contact: any) =>
                            <div className="flex items-center gap-4 mb-4">
                              <Image
                                src= { contact.profilePic || profilePlaceHolder }
                                alt=""
                                className="rounded-full object-cover"
                                width={55}
                                height={55}
                              />
                              <div>
                                <p className="font-compare-contact-heading default_text_color">{ contact.title }</p>
                                <div className="link_color text-sm">
                                  <Link prefetch={ false } href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank">{ contact.name }</Link>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </td>
                }
                {
                  companiesToCompare && companiesToCompare[4] &&
                  <td>
                    <div className="content_section mt-4">
                      <h4 className="font-semibold text-lg default_text_color">Contacts</h4>
                      <div className="space-y-1 mt-4">
                        {
                          companiesToCompare[4]?.CompanyContacts?.map((contact: any) =>
                            <div className="flex items-center gap-4 mb-4">
                              <Image
                                src= { contact.profilePic || profilePlaceHolder }
                                alt=""
                                className="rounded-full object-cover"
                                width={55}
                                height={55}
                              />
                              <div>
                                <p className="font-compare-contact-heading default_text_color">{ contact.title }</p>
                                <div className="link_color text-sm">
                                  <Link prefetch={ false } href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank">{ contact.name }</Link>
                                </div>
                              </div>
                            </div>
                          )
                        }
                      </div>
                    </div>
                  </td>
                }
              </tr>
            </table>
          }
        </div>
        <Modal
          size="6xl"
          className="fullportfolio"
          show={fullportfolioModal}
          onClose={() => setFullportfolioModal(false)}
        >
          <Modal.Header className="modal_header font-bold p-0"></Modal.Header>
          <Modal.Body className="modal_body">
            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 ">
                {currentAlbumPopupData != undefined && currentAlbumPopupData && currentAlbumPopupData.map((portfolios, index) =>

                  <div
                    key={`imagediv_${portfolios.id}`}
                    className="relative popup_thumbnails"
                  >
                    <Image
                      key={`image_${portfolios.id}`}
                      width={640}
                      height={360}
                      className="h-auto max-w-full"
                      src={portfolios.type === 'image' ? portfolios.thumbnail || "" : portfolios.thumbnail || "/video-thumb.jpg"}
                      alt="image description"
                      onClick={() => setAlbumIndex(index)}
                    />
                    {
                      portfolios.type !== 'image' && 
                      <div className="absolute inset-0 flex justify-center items-center">
                        <Image
                          src="/play-icon.png"
                          alt="Play icon"
                          width={33}
                          height={33}
                          onClick={() => setAlbumIndex(index)}
                        />
                      </div>
                    }
                  </div>
                )}

              </div>
            </div>
          </Modal.Body>
        </Modal>
        {isOpenSilder && <CustomLightBox setIsOpenSilder={(value: boolean) => setIsOpenSilder(value)} openSlider={isOpenSilder} activeSlider={activeSlider} setCurrentLightBoxItems={(value: companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]) => setCurrentLightBoxItems(value)} currentItems={currentLightBoxItems}></CustomLightBox>}
      </div>
    </>
  );
};

export default Compare;