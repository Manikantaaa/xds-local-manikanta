import { Modal } from "flowbite-react";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";

import { isValidJSON } from "@/constants/serviceColors";
import { useUserContext } from "@/context/store";
import FreeTierAlerts from "./ui/freeTierAlerts";
import { BodyMessageType } from "@/constants/popupBody";
import CustomLightBox from "./ui/lightbox";
import { companyPortfolioTypes, portfolioAlbumFilesTypes, portfolioTypes } from "@/types/serviceProviderDetails.type";
import { authPostdata, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import Spinner from "./spinner";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { ScrollArea } from "./ui/scroll-area";

const ServiceproviderOurWork = ({
  portfolio,
  companyProjects,
  isPaidProfile,
  setPortfolio,
  setCompanyProjects,
  portfolioProjectName
}: {  
  portfolio: portfolioTypes[];
  companyProjects: companyPortfolioTypes[];
  isPaidProfile: boolean,
  setPortfolio: (arg: any) => void,
  setCompanyProjects: (arg: any) => void,
  portfolioProjectName: string,
}) => {
  const [fullportfolioModal, setFullportfolioModal] = useState(false);

  const [popupMessage, setPopupMessage] = useState<BodyMessageType>('DEFAULT');
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const [seeFullPortfolio, setSeeFullPortfolio] = useState<boolean>(false);
  const { user } = useUserContext();

  //
  const [currentAlbumPopupData, setCurrentAlbumPopupData] = useState<portfolioTypes["portfolioAlbumFiles"]>([]);
  const [isAlbumFilesFetching, setisAlbumFilesFetching] = useState<boolean>(false);
  const [currentClickedAlbumID, setCurrentClickedAlbumID] = useState<number>(0);
  const [isOpenSilder, setIsOpenSilder] = useState<boolean>(false);
  const [activeSlider, setActiveSlider] = useState<number | undefined>(undefined);

  const [currentLightBoxItems, setCurrentLightBoxItems] = useState<companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]>([]);

  function setAlbumIndex(fileIndex: number) {
    setActiveSlider(fileIndex);
    setIsOpenSilder(true);
    setCurrentLightBoxItems(currentAlbumPopupData);
  }
  function setProjectLightBox(projectIndex: number, fileIndex: number) {
    setActiveSlider(fileIndex);
    setIsOpenSilder(true);
    setCurrentLightBoxItems(companyProjects[projectIndex].FileUploads)
  }

  const handleopenpop = () => {
    setOpenPopup(true);
    setPopupMessage('SERVICE_SEE_FULL_PORTFOLIO')
  }


  const fetchAlbumFiles = (albumId: number) => {
    setisAlbumFilesFetching(true)
    setCurrentAlbumPopupData([]);
    setCurrentClickedAlbumID(albumId);
    fetcher(getEndpointUrl(ENDPOINTS.getAlbumFilesById(albumId)))
      .then(response => {
        if (response && response.data) {
          const filteredData = response.data.map((item: portfolioAlbumFilesTypes) => {
            return {
              ...item,
              isLoaded: false // Add the isLoaded property here
            };
          });
          setCurrentAlbumPopupData(filteredData);
          setFullportfolioModal(true);
        }
      })
      .catch(error => {
        console.log(error);
      }).finally(() => {
        setisAlbumFilesFetching(false);
      });
  };

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await fetchAlbumFiles();
  //     if (data) {
  //       setCurrentAlbumPopupData(data);
  //     }
  //   };

  //   fetchData();
  // }, [fetchAlbumFiles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpenSilder((prevState) => {
          if (!prevState) {
            setFullportfolioModal(false)
          }
          return prevState
        })
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const observerTarget = useRef<HTMLDivElement | null>(null);
  const projectHeaderRef = useRef<HTMLDivElement | null>(null);
  const projectRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // When the target element is no longer visible, header is sticky
        setIsHeaderSticky(!entry.isIntersecting);
      },
      {
        // This is the root margin, negative value creates a trigger point above the element
        //rootMargin: "-70px 0px 0px 0px", // Slightly more than NavBarBuyer height
        threshold: 0
      }
    );
    
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    if(portfolioProjectName != ""){
      const projectName = portfolioProjectName ?  portfolioProjectName.split('-')[0] : "";
      setActiveProject(projectName);
    }
    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, []);
  const [activeProject, setActiveProjectState] = useState<string | null>(null);
  const isFirstRender = useRef(true);

  function setActiveProject(name: string): void {
    setActiveProjectState(name);
  }
  // Scroll to the selected project when activeProject changes
useEffect(() => {
  // Skip scrolling on the first render when the page loads
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }

const tryScroll = () => {
  if (activeProject) {
    const projectElement = projectRefs.current[activeProject];
    if (projectElement) {
      // Default heights
      let navbarHeight = 69; // example: default navbar height
      // Adjust this value based on your actual navbar height
      let projectHeaderHeight =60;

      // Adjust offsets based on URL parameters
      if (portfolioProjectName  != "") {
        navbarHeight = 72; // example: reduce navbar
        projectHeaderHeight = 60; // example: reduce header
      }

      const totalOffset = navbarHeight + projectHeaderHeight + 25;

      const projectPosition = projectElement.getBoundingClientRect().top;
      const scrollPosition = window.pageYOffset;
      const offsetPosition = projectPosition + scrollPosition - totalOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      // Try again after a short delay
      setTimeout(tryScroll, 100);
    }
  }
};


  if (activeProject) {
    requestAnimationFrame(() => {
      setTimeout(tryScroll, 200); // Delay to ensure DOM is ready
    });
  }
}, [activeProject]);

 const updateClicks = async(id: number) => {
    if (user && user.userRoles[0].roleCode == "service_provider") {
      await authPostdata(getEndpointUrl(ENDPOINTS.manageTestmonialStatViewCount), { ids: id, type: "click" });
    }
  }
useEffect(() => {
  const onLoad = () => {
    console.log('Window fully loaded');
  };
  if(portfolioProjectName != ""){
    updateClicks(Number(portfolioProjectName.split('-')[1]));
  }

  window.addEventListener('load', onLoad);
  return () => window.removeEventListener('load', onLoad);
}, []);
// useEffect(() => {
//   // Set the first project as active by default
//   // if (companyProjects.length > 0 && !activeProject) {
//   //   setActiveProject(companyProjects[0].name);
//   // }
// }, [companyProjects]);
return (
  <>
  
    <div className="portfolio w-full lg:container px-5 pos_r">
        <div className="sm:flex sm:items-center sm:justify-between py-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font certi_mobile_show">
              Portfolio Albums
            </h1>
          </div>
        </div>
        {(portfolio.length > 0 && isPaidProfile) ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-2">
            {portfolio.map((portfolios, index) => {
              if ((index < 4 && portfolios && portfolios.portfolioAlbumFiles && portfolios.portfolioAlbumFiles[0]) || seeFullPortfolio) {
                if (portfolios && portfolios.portfolioAlbumFiles && portfolios.portfolioAlbumFiles[0] && portfolios.portfolioAlbumFiles[0].type === "image") {
                  return (
                    <div className="portfolio_images album_name_hover relative" onClick={() => { fetchAlbumFiles(portfolios.portfolioAlbumFiles[0].albumId) }}>
                      {
                        (currentClickedAlbumID === portfolios.portfolioAlbumFiles[0].albumId && isAlbumFilesFetching) &&
                        <div className="absolute top-0 w-full items-center flex justify-center h-[100%] custom_loader z-[10]">
                          <Spinner></Spinner>
                        </div>
                      }
                      {
                        <div className="absolute inset-0 flex justify-center items-center">
                          {
                            portfolios.isLoaded === false &&
                            <Spinner/>
                          }
                        </div>
                      }
                      <LazyLoadImage
                        effect="blur"
                        width={640}
                        // height={360}
                        className="h-auto max-w-full"
                        src={portfolios && portfolios.portfolioAlbumFiles && portfolios.portfolioAlbumFiles[0].thumbnail || ""}
                        alt="image description"
                        onLoad={() => {
                          portfolios.isLoaded = true;
                          setPortfolio([...portfolio]);
                        }}
                        beforeLoad={() => {
                          portfolios.isLoaded = false;
                          setPortfolio([...portfolio]);
                        }}
                      />
                      <div className="imag_overlay" onClick={() => { fetchAlbumFiles(portfolios.portfolioAlbumFiles[0].albumId) }}></div>
                      <div className="album_name absolute bottom-0">{portfolios.albumName}</div>

                    </div>
                  );
                } else {
                  return (


                    <div className="portfolio_images relative album_name_hover" onClick={() => { fetchAlbumFiles(portfolios.portfolioAlbumFiles[0].albumId) }}>

                      {(currentClickedAlbumID === portfolios.portfolioAlbumFiles[0].albumId && isAlbumFilesFetching) &&
                        <div className="absolute top-0 w-full items-center flex justify-center h-[100%] bg-gray-transparent-100"><Spinner></Spinner></div>}
                        {
                          <div className="absolute inset-0 flex justify-center items-center">
                            {
                              portfolios.isLoaded === false &&
                              <Spinner/>
                            }
                          </div>
                        }
                        <LazyLoadImage
                          effect="blur"
                          width={640}
                          // height={360}
                          className="h-auto max-w-full"
                          src={portfolios && portfolios.portfolioAlbumFiles && portfolios.portfolioAlbumFiles[0].thumbnail || ""}
                          alt="image description"
                          onLoad={() => {
                            portfolios.isLoaded = true;
                            setPortfolio([...portfolio]);
                          }}
                          beforeLoad={() => {
                            portfolios.isLoaded = false;
                            setPortfolio([...portfolio]);
                          }}
                        />
                        <div className="absolute inset-0 flex justify-center items-center">
                          <Image
                            src="/play-icon.png"
                            alt="Play icon"
                            width={50}
                            height={50}
                          />
                        </div>
                      <div className="imag_overlay" onClick={() => { fetchAlbumFiles(portfolios.portfolioAlbumFiles[0].albumId) }}></div>
                      <div className="album_name absolute bottom-0">{portfolios.albumName}</div>
                    </div>
                  );
                }
              } else {
                return null;
              }
            })}
          </div>
        ) : (
          <p className="text-sm pb-6">Coming Soon</p>
        )}

        {(portfolio && portfolio.length > 0 && isPaidProfile) && (
          <div className="py-6 text-right">
            {!seeFullPortfolio && portfolio.length > 4 &&
              <button
                onClick={() => (user?.isPaidUser || user?.userRoles[0].roleCode === "buyer") ? setSeeFullPortfolio(true) : handleopenpop()}
                className={`${(!user?.isPaidUser && user?.userRoles[0].roleCode === "service_provider") && 'link_disabled'} text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none}`}
                type="button"
              >
                <Image
                  width={500}
                  height={300}
                  src="/expand.svg"
                  className="w-2.5 h-2.5 text-blue-300"
                  alt=""
                />

                <span className=""> See All Albums</span>
              </button>
            }
          </div>
        )}
      </div>
        {/* Observer target for sticky header */}
      <div ref={observerTarget} className="h-[1px]"></div>
        <div className={`sticky top-[75px] z-40 w-full bg-white transition-shadow duration-200 ${isHeaderSticky ? 'shadow-lg' : 'shadow-none'}`}>
          <div className="mx-auto py-4 px-5 lg:container">
            <h2 
              className="font-bold default_text_color header-font "
              ref={projectHeaderRef}
            >
              Project Highlights
            </h2>
          </div>
        </div>
      {companyProjects.length > 0 ? 
      <div className="project-highlights pb-12 lg:container px-5 pos_r">
        {/* <div className="sm:flex sm:items-center sm:justify-between pb-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Project Highlights
            </h1>
          </div>
        </div> */}
        <div className=" mx-auto pt-2">
        <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4 lg:w-1/5">
                      <div className="sticky top-[155px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                          Projects
                        </h3>
                        <ScrollArea className="h-[300px] md:h-[400px]">
                          <div className="p-2">
                            {companyProjects.map((project) => (
                              <button
                              key={project.name}
                              onClick={() => setActiveProject(project.name)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors mb-1 ${
                                activeProject === project.name
                                ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
                              }`}
                              >
                              {project.name}
                              </button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </div>
        <div className="w-full md:w-3/4 lg:w-4/5">
        {(companyProjects.length > 0 && isPaidProfile) ? (
                  companyProjects.map((projects: companyPortfolioTypes, index) => (
                    ((user?.userRoles[0].roleCode === "buyer") || (user?.isPaidUser)) &&
                    <>
                    <div className={`${index === 0 ? "mb-8" : " mb-8 mt-12 pt-8 border-gray-200 border-t"} `}>
                <div key={index + projects.name} className="sm:text-left"
                  ref={(el) => {projectRefs.current[projects.name] = el}}
                >
                        <h1
                          key={`heading_${index + projects.name}`}
                          className="default_text_color heading-sub-font text-xl font-bold text-gray-900 dark:text-white mb-3"
                        >
                          {projects.name}
                        </h1>
                      </div>
                      <b className="text-sm">Project Completion Date: </b>
                      <span
                        key={`date_${index + projects.name}`}
                        className="py-6 text-sm"
                      >
                        {new Date(projects.completionDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                        })}
                      </span>
                      <p key={`platform_${index + projects.name}`} className="text-sm">
                        <b>Platforms:</b>{" "}
                        {projects.PlatformsOpt.map((item, index) => (
                          <span key={`projects_${index + item.platforms.name}`}>
                            {item.platforms.name}
                            {index < projects.PlatformsOpt.length - 1 && ", "}
                          </span>
                        ))}
                      </p>
                      <p key={`desc_${index + projects.name}`} className="py-6 text-sm whitespace-break-spaces">
                        {isValidJSON(projects.description) ? JSON.parse(projects.description) : projects.description}
                      </p>

                      {/* Corrected mapping of projects.FileUploads */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pb-6">
                        {projects.FileUploads.map((portfolios, portfolioIndex) => {
                          return portfolios.type === "image" ? (
                            <div
                              key={`imagediv_${`portfolios_` + portfolioIndex}`}
                              className="relative portfolio_images"
                            >
                              {
                                <div className="absolute inset-0 flex justify-center items-center">
                                  {
                                    portfolios.isLoaded === false &&
                                    <Spinner/>
                                  }
                                </div>
                              }
                              <LazyLoadImage
                                effect="blur"
                                key={`image_${`portfolios` + portfolioIndex}`}
                                width={640}
                                // height={360}
                                className="h-auto max-w-full"
                                src={portfolios.thumbnail || portfolios.fileUrl}
                                alt="image description"
                                onClick={() => {
                                  setProjectLightBox(index, portfolioIndex);
                                }}
                                onLoad={() => {
                                  portfolios.isLoaded = true;
                                  setCompanyProjects([...companyProjects]);
                                }}   
                              />
                            </div>
                          ) : portfolios.fileUrl &&

                          <div
                            key={`videodiv_${`portfolios` + portfolioIndex}`}
                            className="relative portfolio_images"
                            onClick={() => {
                              setProjectLightBox(index, portfolioIndex);
                            }}
                          >
                            {
                              <div className="absolute inset-0 flex justify-center items-center">
                                {
                                  portfolios.isLoaded === false &&
                                  <Spinner/>
                                }
                              </div>
                            }
                            <LazyLoadImage
                              effect="blur"
                              width={640}
                              // height={360}
                              className="h-auto max-w-full"
                              src={portfolios.thumbnail || "/video-thumb.jpg"}
                              // src={"/video-thumb.jpg"}
                              alt="image description"
                              onLoad={() => {
                                portfolios.isLoaded = true;
                                setCompanyProjects([...companyProjects]);
                              }}
                            />
                            <div className="absolute inset-0 flex justify-center items-center">
                              <Image
                                src="/play-icon.png"
                                alt="Play icon"
                                width={50}
                                height={50}
                                onClick={() => {
                                  setProjectLightBox(index, portfolioIndex);
                                }}
                              />
                            </div>
                          </div>
                        }
                        )}
                      </div>

                      {projects.testimonial_feedback && projects.testimonial_feedback.length > 0 &&
                        <div className="testimonials pb-6">
                          {/* <h3 className="font-bold text-base pb-6">Client Testimonial</h3> */}
                          <figure className="border-s-4 border-gray-300 dashed_bg_color p-4">
                            <blockquote>
                              <p className="text-sm italic font-medium ">"{projects.testimonial_feedback}"</p>
                            </blockquote>
                            <figcaption className="flex items-center justify-start mt-3 space-x-3 pb-1 rtl:space-x-reverse">
                              <div className="flex items-center divide-gray-500">
                                <cite className="pe-3 text-sm font-medium ">{projects.testimonial_name}, {projects.testimonial_title}, {projects.testimonial_company}</cite>
                              </div>
                            </figcaption>
                          </figure>
                        </div>
                      }
                      {/* {(!user?.isPaidUser && user?.userRoles[0]?.roleCode === 'buyer') && <Link href="/billing-payment" className="link text-center text-blue-300 font-500 mt-3">Subscribe to see more Project Highlights if available.</Link>} */}
                      </div>
                    </>
                  ))
                ) : (
                  <p className="text-sm">Coming Soon</p>
                )}
        </div>

        </div>
        </div>
      </div> 
      :
        <div className="project-highlights pb-12 lg:container px-5 pos_r">
          <p className="text-sm pb-6">Coming Soon</p>
        </div>
      }
      {/*Portfolio Modal */}
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
                  onClick={() => setAlbumIndex(index)}
                >
                  {
                    <div className="absolute inset-0 flex justify-center items-center">
                      {
                        portfolios.isLoaded === false &&
                        <Spinner/>
                      }
                    </div>
                  }
                  <LazyLoadImage
                    key={`image_${portfolios.id}`}
                    effect="blur"
                    width={640}
                    // height={360}
                    className="h-auto max-w-full"
                    src={portfolios.type === 'image' ? portfolios.thumbnail || "" : portfolios.thumbnail || "/video-thumb.jpg"}
                    alt="image description"
                    onClick={() => setAlbumIndex(index)}
                    onLoad={() => {
                      portfolios.isLoaded = true
                      setCurrentAlbumPopupData([...currentAlbumPopupData]);
                    }}
                  />
                  {portfolios.type !== 'image' &&
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
      {/* Portfolio End */}


      {/*Light Box  Ends*/}
      {isOpenSilder && <CustomLightBox setIsOpenSilder={(value: boolean) => setIsOpenSilder(value)} openSlider={isOpenSilder} activeSlider={activeSlider} setCurrentLightBoxItems={(value: companyPortfolioTypes["FileUploads"] | portfolioAlbumFilesTypes[]) => setCurrentLightBoxItems(value)} currentItems={currentLightBoxItems}></CustomLightBox>}
      <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={popupMessage} />
    </>
  );
};

export default ServiceproviderOurWork;
