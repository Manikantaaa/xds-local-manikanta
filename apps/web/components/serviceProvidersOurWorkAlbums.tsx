import { FlowbiteCarouselTheme, Modal } from "flowbite-react";
import Image from "next/image";
import { ComponentProps, ReactNode, use, useEffect, useState } from "react";
import { DeepPartial } from "react-hook-form";
import FsLightbox from "fslightbox-react";
import { isValidJSON } from "@/constants/serviceColors";
import { useUserContext } from "@/context/store";
import FreeTierAlerts from "./ui/freeTierAlerts";
import Link from "next/link";

type workportfolioTypes = {
  portfolioProjectId: number;
  type?: string;
  fileUrl?: string;
};
type companyPortfolioTypes = {
  name: string;
  completionDate: string;
  description: string;
  testimonial_name: string;
  testimonial_company: string;
  testimonial_title: string;
  testimonial_feedback: string;
  FileUploads: [{ fileUrl: string; type: string }];
  PlatformsOpt: [
    {
      platforms: {
        name: string;
      };
    },
  ];
};

export interface CarouselProps extends ComponentProps<"div"> {
  indicators?: boolean;
  leftControl?: ReactNode;
  rightControl?: ReactNode;
  draggable?: boolean;
  slide?: boolean;
  slideInterval?: number;
  theme?: DeepPartial<FlowbiteCarouselTheme>;
  onSlideChange?: (slide: number) => void;
  pauseOnHover?: boolean;
  activeSlide?: number;
}
const ServiceProvidersOurWorkAlbums = ({
  portfolio,
  companyProjects,
}: {
  portfolio: workportfolioTypes[];
  companyProjects: companyPortfolioTypes[];
}) => {
  const [fullportfolioModal, setFullportfolioModal] = useState(false);
  const [portfoliosourceUrls, setPortfolioSourceUrls] = useState<string[]>([]);
  const [portfoliosourceUrlsvideo, setPortfolioSourceUrlsvideo] = useState<
    string[]
  >([]);
  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const { user } = useUserContext();
  useEffect(() => {
    if (portfolio.length > 0) {
      let portfolioCount = 0;
      const portfolioUrlsimage: string[] = portfolio
        .map((portfolioItem) => {
          let finalUrl: string | undefined = portfolioItem.fileUrl;
          if (finalUrl && portfolioItem.type === "image") {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(finalUrl, "text/html");
            const iframeElement = parsedHtml.querySelector("iframe");
            if (iframeElement) {
              finalUrl = iframeElement.getAttribute("src") || undefined;
            }
            portfolioCount += 1;
            if (user && !user?.isPaidUser && portfolioCount < 5) {
              return finalUrl;
            } else if (user?.isPaidUser) {
              return finalUrl;
            }
          } else {
            return undefined;
          }
        })
        .filter((url): url is string => typeof url === "string");

      const portfolioUrlsvideo: string[] = portfolio
        .map((portfolioItem) => {
          let finalUrl: string | undefined = portfolioItem.fileUrl;
          if (
            finalUrl &&
            finalUrl.startsWith("<iframe") &&
            portfolioItem.type === "video"
          ) {
            const parser = new DOMParser();
            const parsedHtml = parser.parseFromString(finalUrl, "text/html");
            const iframeElement = parsedHtml.querySelector("iframe");
            if (iframeElement) {
              finalUrl = iframeElement.getAttribute("src") || undefined;
            }
            return finalUrl;
          }
        })
        .filter((url): url is string => typeof url === "string");

      setPortfolioSourceUrls(portfolioUrlsimage);
      console.log();
      setPortfolioSourceUrlsvideo(portfolioUrlsvideo);
    }
  }, [portfolio]);

  const [lightboxController, setLightboxController] = useState({
    toggler: false,
    slide: 1,
  });
  function openLightboxOnSlide(number: number) {
    setLightboxController({
      toggler: !lightboxController.toggler,
      slide: number,
    });
  }
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshLightbox = () => {
    // Increment the key to trigger a re-render of FsLightbox
    setRefreshKey((prevKey) => prevKey + 1);
  };
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number>(0);

  const [projectLightboxController, setProjectLightboxController] = useState({
    toggler: false,
    slide: 1,
  });
  function projectHightlights(projectIndex: number, fileIndex: number) {
    setSelectedProjectIndex(projectIndex);
    setProjectLightboxController({
      toggler: !projectLightboxController.toggler,
      slide: fileIndex,
    });
  }
  return (
    <>
      <div className="portfolio">
        <div className="sm:flex sm:items-center sm:justify-between py-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Portfolio
            </h1>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-2">
          <div className="portfolio_images relative album_name_hover">
            <Image
              onClick={() => setFullportfolioModal(true)}
              width={640}
              height={360}
              className="h-auto max-w-full"
              src={"/demo/xds_demo (4).jpg"}
              alt="image description"
            />
            <div className="album_name absolute bottom-0">Album 1</div>
          </div>
          <div className="portfolio_images relative album_name_hover">
            <Image
              onClick={() => setFullportfolioModal(true)}
              width={640}
              height={360}
              className="h-auto max-w-full"
              src={"/demo/xds_demo (5).jpg"}
              alt="image description"
            />
            <div className="album_name absolute bottom-0">Album 2</div>
          </div>
          <div className="portfolio_images relative album_name_hover">
            <Image
              onClick={() => setFullportfolioModal(true)}
              width={640}
              height={360}
              className="h-auto max-w-full"
              src={"/demo/xds_demo (1).jpg"}
              alt="image description"
            />
            <div className="album_name absolute bottom-0">Album 3</div>
          </div>
          <div className="portfolio_images relative album_name_hover">
            <Image
              onClick={() => setFullportfolioModal(true)}
              width={640}
              height={360}
              className="h-auto max-w-full"
              src={"/demo/xds_demo (3).jpg"}
              alt="image description"
            />
            <div className="album_name absolute bottom-0">Album 4</div>
          </div>
          <div className="portfolio_images relative album_name_hover">
            <Image
              onClick={() => setFullportfolioModal(true)}
              width={640}
              height={360}
              className="h-auto max-w-full"
              src={"/demo/xds_demo (2).jpg"}
              alt="image description"
            />
            <div className="album_name absolute bottom-0">Album 5</div>
          </div>
        </div>

        {/* {portfolio && portfolio.length > 0 && (
          <div className="py-6 text-right">
            <button
              onClick={() => (user?.isPaidUser) ? setFullportfolioModal(true) : setOpenPopup(true)}
              className={`${!user?.isPaidUser && 'link_disabled'} text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-0 hover:text-blue-400 focus:outline-none}`}
              type="button"
            >
              <Image
                width={500}
                height={300}
                src="/expand.svg"
                className="w-2.5 h-2.5 text-blue-300"
                alt=""
              />

              <span className=""> See Full Portfolio </span>
            </button>
          </div>
        )} */}
      </div>
      <div className="project-highlights pb-12">
        <div className="sm:flex sm:items-center sm:justify-between pb-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Project Highlights
            </h1>
          </div>
        </div>

        {companyProjects.length > 0 ? (
          companyProjects.map((projects: companyPortfolioTypes, index) => (
            ((!user?.isPaidUser && index < 1) || (user?.isPaidUser)) &&
            <>
              <div key={index + projects.name} className="sm:text-left pb-6">
                <h1
                  key={`heading_${index + projects.name}`}
                  className="font-bold default_text_color heading-sub-font"
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
                      className="portfolio_images"
                    >
                      <Image
                        key={`image_${`portfolios` + portfolioIndex}`}
                        width={640}
                        height={360}
                        className="h-auto max-w-full"
                        src={portfolios.fileUrl || ""}
                        alt="image description"
                        onClick={() => {
                          projectHightlights(index, portfolioIndex + 1);
                        }}
                      />
                    </div>
                  ) : portfolios.fileUrl &&
                    portfolios.fileUrl.startsWith("<iframe") ? (
                    <div
                      key={`videodiv_${`portfolios` + portfolioIndex}`}
                      className="portfolio_images"
                    >
                      <Image
                        width={640}
                        height={360}
                        className="h-auto max-w-full"
                        src={"/video-thumb.jpg"}
                        alt="image description"
                        onClick={() => {
                          projectHightlights(index, portfolioIndex + 1);
                        }}
                      />
                    </div>
                  ) : (
                    <div key={`videodiv_${`portfolios` + portfolioIndex}`}>
                      <video
                        key={`video_${`portfolios` + portfolioIndex}`}
                        controls
                        preload="none"
                        aria-label="Video player"
                      >
                        <source
                          src={portfolios.fileUrl || ""}
                          type="video/mp4"
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  );


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
            {(!user?.isPaidUser && user?.userRoles[0]?.roleCode === 'buyer') && <Link href="/billing-payment" className="link text-center text-blue-300 font-500 mt-3">Subscribe to see more Project Highlights if available.</Link>}
            </>
          ))
        ) : (
          <p className="text-sm">Coming Soon</p>
        )}
      </div>
      {/*Portfolio Modal */}
      <Modal
        size="7xl"
        className="fullportfolio"
        show={fullportfolioModal}
        onClose={() => setFullportfolioModal(false)}
      >
        <Modal.Header className="modal_header font-bold p-0"></Modal.Header>
        <Modal.Body className="modal_body">
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-7 gap-4 ">
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (1).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (2).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (3).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (4).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (5).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (6).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (7).jpg"}
                  alt="image description"
                  // onClick={() => openLightboxOnSlide(index + 1)}
                />
              </div>
              <div className="popup_thumbnails">
                <Image
                  width={640}
                  height={360}
                  className="h-auto max-w-full"
                  src={"/demo/xds_demo (8).jpg"}
                  alt="image description"
                  onClick={() => openLightboxOnSlide(1)}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* Portfolio End */}

      {/*Light Box  Starts*/}
      {/* <button type="button" onClick={() => openLightboxOnSlide(2)}>
				Open the lightbox on the second slide.
			</button> */}
      <FsLightbox
        toggler={lightboxController.toggler}
        sources={[...portfoliosourceUrls, ...portfoliosourceUrlsvideo]}
        slide={lightboxController.slide}
        exitFullscreenOnClose={true}
        types={[
          ...new Array(portfoliosourceUrls.length).fill("image"),
          ...new Array(portfoliosourceUrlsvideo.length).fill("youtube"),
        ]}
      />

      {selectedProjectIndex !== null && (
        <FsLightbox
          key={refreshKey} // This will trigger a re-render when refreshKey changes
          toggler={projectLightboxController.toggler}
          sources={
            companyProjects[selectedProjectIndex]?.FileUploads.map(
              (portfolio) => portfolio.fileUrl || "",
            ) || []
          }
          slide={projectLightboxController.slide}
          exitFullscreenOnClose={true}
          types={
            companyProjects[selectedProjectIndex]?.FileUploads.map(
              (portfolio) => (portfolio.type === "image" ? "image" : "youtube"),
            ) || []
          }
          onClose={refreshLightbox}
        />
      )}
      {/*Light Box  Ends*/}
      <FreeTierAlerts isOpen={openPopup} setOpenPopup={setOpenPopup} bodymessage={'DEFAULT'} />
    </>
  );
};

export default ServiceProvidersOurWorkAlbums;