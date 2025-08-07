"use client";

import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPostdata } from "@/hooks/fetcher";
import { Modal, Tooltip, Button } from "flowbite-react";
import Link from "next/link";
import { redirect, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import profileimage from "@/public/no-image-available.jpg";
import { serviceColoring } from "@/constants/serviceColors";
import CustomLightBox from "./ui/lightbox";
import { companyPortfolioTypes, portfolioAlbumFilesTypes } from "@/types/serviceProviderDetails.type";
import { useUserContext } from "@/context/store";
import Spinner from "./spinner";
import { PATH } from "@/constants/path";
import ButtonSpinner from "./ui/buttonspinner";
import "../public/css/sharedListComponent.css";
import { LazyLoadImage } from "react-lazy-load-image-component";


interface SharedList {
  id: number;
  list: {
    id: number;
    name: string;
    description: string;
  };
  company: {
    id: number;
    slug: string;
    name: string;
    companyAddress: string[];
    bannerLogo: {
      url: string;
    };
    services: {
      id: number;
      groupId: number;
      serviceName: string;
    }[];
    portfolioAlbums: {
      id: number;
      name: string;
      file: {
        fileUrl: string;
        thumbnail: string;
        type: string;
        isLoading?: boolean;
      }[];
    }[];
    website: string;
  }
}

interface Album {
  id: number;
  name: string;
  file: {
    fileUrl: string;
    thumbnail: string;
    type: string;
    isLoading?: boolean;
  }[];
}

const SharedListComponent = () => {
  const route = useRouter();
  const searchParams = useSearchParams();
  const currentUrl = usePathname();
  const token = searchParams.get("token");
  const listId = searchParams.get("list");
  const [companiesShared, setCompaniesShared] = useState<SharedList []>([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [fullAblumsModal, setFullAblumsModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album>();
  const [activeSlider, setActiveSlider] = useState<number | undefined>(undefined);
  const [isOpenSilder, setIsOpenSilder] = useState<boolean>(false);
  const [isValidLink, setIsValidLink] = useState<boolean>(false);
  const [listName, setListName] = useState<string>("");
  const [openInvalidLinkModal, setOpenInvalidLinkModal] = useState<boolean>(false);
  const [currentLightBoxItems, setCurrentLightBoxItems] = useState<{
    fileUrl: string;
    thumbnail: string;
    type: string;
  }[]>([]);
  const [openAddToListModal, setOpenAddToListModal] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [listAddSuccessMessage, setListAddSuccessMessage] = useState("");

  const { user } = useUserContext();

  const onSelectAnyAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setFullAblumsModal(true);
  };

  function setAlbumIndex(index: number) {
    console.log(companiesShared);
    setActiveSlider(index);
    setIsOpenSilder(true);
    if(selectedAlbum && selectedAlbum.file) {
      setCurrentLightBoxItems(selectedAlbum.file);
    }
  }

  useEffect(() => {
    // if(!user && localStorage.getItem("clickedLogout") == "1") {
    //   redirect(PATH.HOME.path);
    // }
    if(currentUrl == "/shared-list" && !user) {
      window.addEventListener('popstate', function(event) {
        window.location.reload();
      });
    }
    getTheCompanyDetails();
  }, [user]);

  async function getTheCompanyDetails() {
    let theUrl = `${getEndpointUrl(ENDPOINTS.getPublicCompaniesInList(token))}`;
    if(listId && listId != "") {
      theUrl = `${getEndpointUrl(ENDPOINTS.getCompnaiesInPublicProjectList(token, +listId))}`;
    }
    setTimeout(() => {
      authFetcher(theUrl).then((result) => {
        if(result.success && result.data) {
          document.title = "XDS Spark - " + result.data[0]?.list?.name;
          setIsValidLink(true);
          if(result.data[0].company){
            setListName(result.data[0].list.name);
            setCompaniesShared(result.data);
          } else {
            setListName(result.data[0].list.name);
          }
        }
      }).catch((err) => {
        setOpenInvalidLinkModal(true);
        console.log(err);
      }).finally(() => {
        setIsLoading(false);
      });
    }, 1000);
  }
  
  const onClickSeeMore = (companySlug: string) => {
    if(user && user.id) {
      route.push(`/serviceproviders-details/${companySlug}`);
    } else {
      if (companySlug && companySlug != "") {
        localStorage.setItem("viewCompanyProfile", companySlug);
      }
      setOpenModal(true);
    }
  }

  const onClickSignUp = () => {
    setOpenInvalidLinkModal(false);
    route.push(PATH.STATIC_PAGE.path);
    setIsLoading(true);
  }

  const onClickAddToList = () => {
    if(user && user.id) {
      setListAddSuccessMessage("");
      setOpenAddToListModal(true);
    } else {
      setIsLoading(true)
      route.push(PATH.STATIC_PAGE.path);
    }
  }

  const addListInUser = async () => {
    if(user && user.id) {
      setButtonLoader(true);
      const url = `${getEndpointUrl(ENDPOINTS.addListInUser)}`;
      try {
        const response = await authPostdata(url, {
          token: token
        });
        if(response && response.success) {
          setListAddSuccessMessage("List added successfully!");
          setButtonLoader(false);
          setTimeout(() => {
            setOpenAddToListModal(false);
            setListAddSuccessMessage("");
          }, 700);
        }
      } catch(err) {
        console.log(err);
      } finally {
        setButtonLoader(false);
      }
    } else {
      route.push(PATH.STATIC_PAGE.path);
    }
  }

  return(
    <>
      {
        !isLoading ?
          isValidLink ?
          <div className="w-full lg:container px-5 pos_r">
            <div className={`flex justify-between ${ user ? 'py-6' : 'pt-28 pb-6' } `}>
              <div className="text-left">
                <h1 className="default_text_color header-font">{listName}</h1>
              </div>
              {
                user && user.id &&
                <div className="text-right shrink-0">
                  <button
                    className={`addtotour text-sm font-medium inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 link_color transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none`}
                    type="button"
                    onClick={() => { onClickAddToList() }}
                  >
                    <Image
                      src="plus.svg"
                      className={`w-3.5 h-3.5 link_color`}
                      alt=""
                      width={14}
                      height={14}
                    />
                    <span className="">Add to My Lists</span>
                  </button>
                </div>
              }
            </div>
            <div><p className={`${companiesShared[0]?.list?.description ? "pb-6" : ""}`}>{companiesShared[0]?.list?.description}</p></div>
            <div className=""><hr /></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-5 sm:grid-cols-3 py-6 ">
              {
                companiesShared.length > 0 &&
                companiesShared.map((item: SharedList, index: number) => (
                  <div key={index} className="overflow-hidden rounded-lg shadow transition hover:shadow-lg card_shadow">
                    <article className="">
                      <Image
                        alt=""
                        src={item.company?.bannerLogo?.url || profileimage}
                        width={150}
                        height={150}
                        className="h-46 w-full object-cover cursor-pointer"
                        onClick={() => onClickSeeMore(item.company.slug)}
                      />
                      <div className="bg-white p-2.5">
                        <h3 className="text-lg font-semibold pb-2 pl-1">{item.company?.name}</h3>
                        <ul className="space-y-2.5 text-sm font-medium">
                          {
                            item.company.companyAddress.length > 0 &&
                            <li className="flex items-center">
                              <svg className="top-0  w-[18px] h-[18px] me-1.5 flex-shrink-0" viewBox="0 0 13 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_8_39)">
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.50002 3.96317C5.06408 3.96317 3.90002 5.14608 3.90002 6.6053C3.90002 8.06448 5.06408 9.24742 6.50002 9.24742C7.93594 9.24742 9.10002 8.06448 9.10002 6.6053C9.10002 5.14608 7.93594 3.96317 6.50002 3.96317ZM5.20002 6.6053C5.20002 5.87568 5.78205 5.28422 6.50002 5.28422C7.21801 5.28422 7.80002 5.87568 7.80002 6.6053C7.80002 7.33486 7.21801 7.92636 6.50002 7.92636C5.78205 7.92636 5.20002 7.33486 5.20002 6.6053Z" fill="#555758" />
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M11.0962 1.93464C8.55777 -0.64488 4.44221 -0.64488 1.9038 1.93464C-0.634601 4.51416 -0.634601 8.69641 1.9038 11.2759L5.91781 15.3549C6.23934 15.6817 6.76065 15.6817 7.0822 15.3549L11.0962 11.2759C13.6346 8.69641 13.6346 4.51416 11.0962 1.93464ZM2.82305 2.86877C4.85377 0.805155 8.14625 0.805155 10.177 2.86877C12.2077 4.93239 12.2077 8.2782 10.177 10.3418L6.5 14.0783L2.82305 10.3418C0.792318 8.2782 0.792318 4.93239 2.82305 2.86877Z" fill="#555758" />
                                </g>
                                <defs>
                                  <clipPath id="clip0_8_39">
                                    <rect width="13" height="15.6" fill="white" />
                                  </clipPath>
                                </defs>
                              </svg>
                              { item.company.companyAddress.join(", ") }
                            </li>
                          }
                          
                          <li className="flex items-center">
                            <Link  prefetch={false} href={
                              item.company?.website && (item.company?.website.startsWith('http://') || item.company?.website.startsWith('https://') ?  item.company?.website : `https://${item.company?.website}`)} target="_blank" className="hover:text-blue-350 link_color">
                              <svg className=" w-[18px] h-[18px] me-1.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M14.498 5.72949C13.6237 2.94267 10.9385 0.984391 7.98388 0.999999C4.31144 0.933593 1.10376 4.16419 1.16649 7.82861C1.1702 9.38938 1.69759 10.8871 2.66991 12.0977C3.95409 13.6987 5.8662 14.6318 7.91552 14.6572C8.44753 14.7226 8.70986 14.0028 8.24852 13.7222C7.21257 12.7782 6.43207 11.5907 6.02044 10.2773H7.94628C8.22265 10.2773 8.44628 10.0537 8.44628 9.77734C8.44628 9.50098 8.22265 9.27734 7.94628 9.27734H5.76653C5.67879 8.8038 5.62987 8.32144 5.62987 7.83203C5.62987 7.33966 5.67885 6.85513 5.76677 6.37988H10.2039C10.2414 6.5936 10.2735 6.8103 10.2934 7.03125C10.3174 7.29053 10.5351 7.48584 10.791 7.48584C10.8061 7.48584 10.8213 7.48535 10.8369 7.48389C11.1118 7.45898 11.3144 7.21533 11.2895 6.94043C11.2723 6.75162 11.2483 6.56464 11.2197 6.37988H13.6459C13.7686 6.84714 13.8335 7.33237 13.8335 7.82861C13.8335 8.28271 13.7788 8.74609 13.6714 9.20557C13.6084 9.47412 13.7754 9.74316 14.0444 9.80615C14.3115 9.86767 14.582 9.70215 14.645 9.4331C14.77 8.89941 14.8335 8.35937 14.8335 7.82861C14.8335 7.10303 14.7197 6.39404 14.498 5.72949ZM12.5513 4.1875C12.849 4.55478 13.0918 4.95492 13.2874 5.37988H10.9943C10.6881 4.19724 10.0863 3.0986 9.32314 2.15228C10.5871 2.44534 11.7223 3.15185 12.5513 4.1875ZM3.45018 4.18506C4.27422 3.15591 5.40004 2.45343 6.66494 2.15802C5.89094 3.10255 5.297 4.19852 4.97789 5.37988H2.71218C2.90737 4.95605 3.15087 4.55472 3.45018 4.18506ZM5.10497 10.7046C5.44664 11.72 5.98101 12.6675 6.66835 13.5032C5.41036 13.2091 4.27712 12.5031 3.44872 11.4702C3.15075 11.1024 2.90807 10.7021 2.71261 10.2773H4.97802C5.019 10.4202 5.05669 10.564 5.10497 10.7046ZM4.74718 9.27734H2.35412C2.2314 8.81009 2.16649 8.32486 2.16649 7.82861C2.16649 7.33386 2.23101 6.84985 2.35424 6.37988H4.7474C4.6697 6.85617 4.62987 7.34122 4.62987 7.83203C4.62987 8.32004 4.66967 8.80289 4.74718 9.27734ZM6.05224 5.27246C6.4475 4.1033 7.11852 3.04144 8.0009 2.1738C8.87215 3.04553 9.53551 4.10992 9.92772 5.27783C9.93938 5.31271 9.94539 5.34521 9.95647 5.37988H6.02034C6.03194 5.34436 6.04012 5.30783 6.05224 5.27246Z" fill="#0071c2" />
                                <path d="M14.1362 10.4805L10.4346 7.88867C10.167 7.70166 9.83107 7.67285 9.53663 7.81006C9.24122 7.94775 9.04786 8.22363 9.01906 8.54931L8.6255 13.0508C8.59083 13.4453 8.80372 13.8013 9.16749 13.9575C9.53175 14.1152 9.93507 14.0239 10.1983 13.728L10.4849 13.4048L10.5843 13.6181C10.5844 13.6183 10.5844 13.6185 10.5845 13.6187C10.5844 13.6185 10.5845 13.6188 10.5845 13.6187L10.9859 14.4795C11.1387 14.8071 11.4644 15 11.8047 15C11.9321 15 12.0615 14.9727 12.1846 14.9155L13.2774 14.4058C13.4956 14.3042 13.6611 14.123 13.7437 13.8965C13.8257 13.6704 13.815 13.4253 13.7134 13.207L13.2124 12.1328L13.6441 12.1211C14.0401 12.1099 14.3692 11.8579 14.4829 11.4785C14.5967 11.0991 14.4605 10.7075 14.1362 10.4805ZM11.0693 12.292C10.9888 12.1172 10.8084 12.0026 10.6162 12.0034C10.4746 12.0034 10.3379 12.064 10.2422 12.1714L9.64747 12.8418L10.0005 8.80517L13.3198 11.1294L12.4238 11.1543C12.2554 11.1592 12.1006 11.248 12.0122 11.3916C11.9238 11.5347 11.9131 11.7129 11.9844 11.8657L12.7656 13.541L11.8506 13.9678L11.0693 12.292Z" fill="#0071c2" />
                              </svg>
                              { item.company?.website.length < 35 ? item.company?.website : item.company?.website.slice(0, 35) + "... " }</Link>
                          </li>

                          <li className="flex items-center">
                            <button onClick={() => onClickSeeMore(item.company.slug)} className="hover:text-blue-350 flex">
                              <svg className="w-[20px] h-[20px] me-1.5 flex-shrink-0" viewBox="0 0 18 18" fill="#0071c2" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5 15.384L2.2125 15.3847C2.17275 15.3847 2.1345 15.3682 2.10675 15.3405C2.07825 15.312 2.0625 15.2745 2.0625 15.2347V14.1465C2.0625 13.524 2.50725 12.975 3.19275 12.5085C4.41675 11.673 6.3975 11.1465 8.625 11.1465C9.11925 11.1465 9.60075 11.1727 10.065 11.223C10.374 11.256 10.6515 11.0325 10.6845 10.7235C10.7175 10.4152 10.494 10.1377 10.185 10.104C9.68175 10.05 9.15975 10.0215 8.625 10.0215C6.1335 10.0215 3.92775 10.6447 2.55825 11.5785C1.5135 12.291 0.9375 13.1962 0.9375 14.1465V15.234C0.9375 15.5722 1.07175 15.897 1.311 16.1362C1.55025 16.3747 1.87425 16.5097 2.2125 16.509C3.4875 16.5097 10.5 16.509 10.5 16.509C10.8105 16.509 11.0625 16.257 11.0625 15.9465C11.0625 15.6367 10.8105 15.384 10.5 15.384Z" fill="#0071c2" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.625 1.125C6.348 1.125 4.5 2.973 4.5 5.25C4.5 7.527 6.348 9.375 8.625 9.375C10.902 9.375 12.75 7.527 12.75 5.25C12.75 2.973 10.902 1.125 8.625 1.125ZM8.625 2.25C10.281 2.25 11.625 3.594 11.625 5.25C11.625 6.906 10.281 8.25 8.625 8.25C6.969 8.25 5.625 6.906 5.625 5.25C5.625 3.594 6.969 2.25 8.625 2.25Z" fill="#0071c2" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M15.8408 14.625C15.7583 14.8597 15.6232 15.0757 15.4432 15.2557C15.1267 15.5722 14.6978 15.75 14.25 15.75C13.8022 15.75 13.3733 15.5722 13.0568 15.2557C12.7403 14.9392 12.5625 14.5102 12.5625 14.0625V11.0625C12.5625 10.752 12.3105 10.5 12 10.5C11.6895 10.5 11.4375 10.752 11.4375 11.0625V14.0625C11.4375 14.8087 11.7337 15.5235 12.261 16.0515C12.789 16.5787 13.5038 16.875 14.25 16.875C14.9962 16.875 15.711 16.5787 16.239 16.0515C16.5383 15.7515 16.7632 15.3915 16.902 15C17.0055 14.7075 16.8517 14.3857 16.5585 14.2822C16.266 14.1787 15.9443 14.3325 15.8408 14.625Z" fill="#0071c2" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5473 9.90375C13.7655 9.80325 14.0048 9.75 14.25 9.75C14.6978 9.75 15.1268 9.92775 15.4433 10.2443C15.7598 10.5608 15.9375 10.9897 15.9375 11.4375V12.5625C15.9375 12.873 16.1895 13.125 16.5 13.125C16.8105 13.125 17.0625 12.873 17.0625 12.5625C17.0625 12.1785 17.0625 11.7975 17.0625 11.4375C17.0625 10.6913 16.7663 9.9765 16.239 9.4485C15.711 8.92125 14.9963 8.625 14.25 8.625C13.842 8.625 13.4423 8.7135 13.0785 8.88075C12.7965 9.00975 12.672 9.34425 12.801 9.62625C12.9308 9.90825 13.2645 10.0327 13.5473 9.90375Z" fill="#0071c2" />
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6875 11.625V13.875C13.6875 14.1855 13.9395 14.4375 14.25 14.4375C14.5605 14.4375 14.8125 14.1855 14.8125 13.875V11.625C14.8125 11.3145 14.5605 11.0625 14.25 11.0625C13.9395 11.0625 13.6875 11.3145 13.6875 11.625Z" fill="#0071c2" />
                              </svg>
                              <span className="w-[90%] inline-block link_color">XDS Spark Company Profile</span>
                            </button>
                              {/* {
                                companyId == item.company.id ?
                                <svg className="w-4 h-4 ml-2 dark:text-green-400 flex-shrink-0 green_c" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                </svg>
                                :
                                <svg onClick={() => onClickCopy(item.company.id)}  className="ml-2 cursor-pointer" enable-background="new 0 0 32 32" height="18" viewBox="0 0 32 32" width="18" xmlns="http://www.w3.org/2000/svg" id="fi_3138853"><g id="Layer_1"><g><path d="m26.5718 2.1602h-16.874c-1.7964 0-3.2578 1.4658-3.2578 3.2676v1.0117h-1.0225c-1.7964 0-3.2578 1.4658-3.2578 3.2686v16.8643c0 1.8018 1.4614 3.2676 3.2578 3.2676h16.8745c1.8022 0 3.2681-1.4658 3.2681-3.2676v-1.0117h1.0117c1.8022 0 3.2686-1.4658 3.2686-3.2686v-16.8644c-.0001-1.8017-1.4664-3.2675-3.2686-3.2675zm-3.0117 24.4121c0 .6992-.5688 1.2676-1.2681 1.2676h-16.8745c-.6934 0-1.2578-.5684-1.2578-1.2676v-16.8643c0-.6992.5645-1.2686 1.2578-1.2686h2.0225 14.852c.6992 0 1.2681.5693 1.2681 1.2686v14.8525zm4.2802-4.2803c0 .6992-.5688 1.2686-1.2686 1.2686h-1.0117v-13.8526c0-1.8027-1.4658-3.2686-3.2681-3.2686h-13.852v-1.0117c0-.6992.5645-1.2676 1.2578-1.2676h16.874c.6997 0 1.2686.5684 1.2686 1.2676z" fill="rgb(0,0,0, .8)"></path></g></g></svg>
                              } */}
                          </li>

                          <li className="flex items-center">
                            <div className="text-blue-300 space-y-1 mt-1">
                              {
                                item.company.services.map((item, index) => (
                                  <span className=" inline-block" key={index}>
                                    <button type="button" className={`text-gray-900 bg_${serviceColoring[item.groupId]} focus:outline-none font-medium rounded-sm text-sm px-2 mr-1 py-1 cursor-default`}>{item.serviceName}</button>
                                  </span>
                                ))
                              }
                            </div>
                          </li>

                          {
                            item.company.portfolioAlbums.length > 0 &&
                            <li className="flex items-center">
                              <p className="mt-1 text-xs font-medium opacity-80">Portfolio Attachments:</p>
                            </li>
                          }
                        </ul>

                        {
                          item.company.portfolioAlbums.length > 0 &&
                          <div className="grid grid-cols-5 gap-4 lg:grid-cols-5 lg:gap-2 mt-2.5 mb-1">
                            {
                              item.company.portfolioAlbums.map((album, index) => (
                                index < 4 &&
                                <div className="cursor-pointer" key={index} onClick={() => { onSelectAnyAlbum(album); }}>
                                  <Tooltip content={album.name}><Image width={150} height={150} alt="" src={album.file[0]?.thumbnail} className=" h-8 w-full object-cover rounded-[4px]" /></Tooltip>
                                </div>
                              ))
                            }
                            {
                              item.company.portfolioAlbums.length > 4 &&
                              <div className=" text-center text-xs font-medium link_color cursor-pointer" onClick={() => onClickSeeMore(item.company.slug)}>
                                <svg className="block m-auto" width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <g clip-path="url(#clip0_13_646)">
                                    <path d="M14.375 4.0625V10.3125C14.375 10.6577 14.0952 10.9375 13.75 10.9375C13.4049 10.9375 13.125 10.6577 13.125 10.3125V4.0625C13.125 3.02856 12.2839 2.1875 11.25 2.1875H4.375C4.02985 2.1875 3.75 1.90765 3.75 1.5625C3.75 1.21735 4.02985 0.9375 4.375 0.9375H11.25C12.9732 0.9375 14.375 2.33948 14.375 4.0625ZM11.875 6.5625V10.9375C11.875 12.6605 10.4732 14.0625 8.75 14.0625H3.75C2.02683 14.0625 0.625 12.6605 0.625 10.9375V6.5625C0.625 4.83948 2.02683 3.4375 3.75 3.4375H8.75C10.4732 3.4375 11.875 4.83948 11.875 6.5625ZM10.625 6.5625C10.625 5.52856 9.78394 4.6875 8.75 4.6875H3.75C2.71607 4.6875 1.875 5.52856 1.875 6.5625V10.9375C1.875 11.9714 2.71607 12.8125 3.75 12.8125H8.75C9.78394 12.8125 10.625 11.9714 10.625 10.9375V6.5625ZM8.125 8.125H6.875V6.875C6.875 6.52985 6.59516 6.25 6.25 6.25C5.90485 6.25 5.625 6.52985 5.625 6.875V8.125H4.375C4.02985 8.125 3.75 8.40485 3.75 8.75C3.75 9.09515 4.02985 9.375 4.375 9.375H5.625V10.625C5.625 10.9702 5.90485 11.25 6.25 11.25C6.59516 11.25 6.875 10.9702 6.875 10.625V9.375H8.125C8.47016 9.375 8.75 9.09515 8.75 8.75C8.75 8.40485 8.47016 8.125 8.125 8.125Z" fill="#0077CC" />
                                  </g>
                                  <defs>
                                    <clipPath id="clip0_13_646">
                                      <rect width="15" height="15" fill="white" />
                                    </clipPath>
                                  </defs>
                                </svg>
                                See&nbsp;More
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </article>
                  </div>
                ))
              }
            </div>
            {companiesShared.length == 0 && <div className="text-center">There is no companies</div> }
            {isOpenSilder && <CustomLightBox setIsOpenSilder={(value: boolean) => setIsOpenSilder(value)} openSlider={isOpenSilder} activeSlider={activeSlider} setCurrentLightBoxItems={(value: companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]) => setCurrentLightBoxItems(value)} currentItems={currentLightBoxItems}></CustomLightBox>}
          </div>
          :
          <Modal show={openInvalidLinkModal} size="md" onClose={() => { setOpenInvalidLinkModal(false); route.push("/login")}} popup>
            <Modal.Header className="modal_header">
            </Modal.Header>
            <Modal.Body>
              <div className="text-center pt-12 pb-12">
                <h2 className="mb-3 text-xl font-semibold text-gray-90">
                  Invalid URL
                </h2>
              </div>
            </Modal.Body>
          </Modal>
        :
        <div className="min-h-screen flex justify-center items-center">
          <Spinner />
        </div>
      }
      <Modal show={openModal} size="md" onClose={() => setOpenModal(false)} popup>
        <Modal.Header className="z-10" />
        <Modal.Body>
          <div className="text-center pt-24">
            <div className="absolute w-full -top-10 -z-5"><Image className="m-auto" src="/spark_mascot.png" alt="" width={170} height={170} /></div>
            <h3 className="mb-3 text-xl font-semibold text-gray-90">
              <Link href="/login" className="link_color">Login</Link> to view the full profile
            </h3>
            <p className="font-semibold text-gray-90 pb-4"> Don't have an account? <button onClick={() => onClickSignUp()} className="link_color">Sign Up </button></p>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        size="6xl"
        className="fullportfolio"
        show={fullAblumsModal}
        onClose={() => setFullAblumsModal(false)}
      >
        <Modal.Header className="modal_header font-bold p-0"></Modal.Header>
        <Modal.Body className="modal_body">
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 ">
              {selectedAlbum != undefined && selectedAlbum && selectedAlbum.file.map((album, index) =>
                <div
                  key={index}
                  className="relative popup_thumbnails"
                > 
                  { 
                    album.isLoading &&
                    <div className="absolute inset-0 flex justify-center items-center">
                      <Spinner/>
                    </div>
                  }
                  <LazyLoadImage
                    effect="blur"
                    width={640}
                    // height={360}
                    className="h-auto max-w-full"
                    src={album.type === 'image' ? album.thumbnail || "" : album.thumbnail || "/video-thumb.jpg"}
                    alt="image description"
                    onClick={() => setAlbumIndex(index)}
                    beforeLoad={() => {
                      album.isLoading = true;
                      setSelectedAlbum({ ...selectedAlbum });
                    }}
                    onLoad={() => {
                      album.isLoading = false;
                      setSelectedAlbum({ ...selectedAlbum });
                    }}
                  />
                </div>
              )}

            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        size="sm"
        show={openAddToListModal}
        onClose={() => setOpenAddToListModal(false)}
      >
        <Modal.Header className="modal_header font-bold">
          <b>Add to My Lists</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6 text-sm font-normal">
            Are you sure want to add { companiesShared[0]?.list?.name } to your lists?
          </div>
          {/* <br/> */}
          {
            listAddSuccessMessage && listAddSuccessMessage != "" &&
            <div className="font-medium text-green-600 text-sm mt-5"><p>{listAddSuccessMessage}</p></div>
          }
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            type="submit"
            className="button_cancel h-[40px] px-4 border-gray-50-100"
            onClick={() => setOpenAddToListModal(false)}
          >
            Cancel
          </Button>
          {
            listAddSuccessMessage == "" &&
            <Button
              onClick={() => { addListInUser() }}
              className="px-4 h-[40px] button_blue"
              disabled={buttonLoader}
            >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Add'}
            </Button>
          }
        </Modal.Footer>
      </Modal>
    </>
  );

}

export default SharedListComponent;