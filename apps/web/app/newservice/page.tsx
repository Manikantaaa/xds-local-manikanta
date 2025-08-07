"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { Button, Modal, Label, Textarea } from "flowbite-react";
const Noprojects = () => {
  const [openModal, setOpenModal] = useState(false);
  const [thankModal, setThankModal] = useState(false);
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
  ];
  const [status, setStatus] = useState("3");
  function onClickStatus1(val: string) {
    setStatus(val);
  }
  return (
    <>
      {/* Report this Service Provider */}
      <Modal show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Report this Service Provider</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="">
              <div className="mb-2 block">
                <Label
                  htmlFor="comment"
                  className="font-bold text-xs"
                  value="Please explain why you are reporting this company *"
                />
              </div>
              <Textarea
                id="comment"
                placeholder=""
                required
                rows={8}
                className="w-full focus:border-blue-500"
              />
              <p className="pt-6 text-sm default_text_color">
                Note: Submissions are not anonymous. Our team will review this
                report and may contact you for further details.
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px]"
            color="gray"
            onClick={() => setOpenModal(false)}
          >
            Cancel
          </Button>
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenModal(false);
              setThankModal(true);
            }}
          >
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Report this Service Provider End */}

      {/*Thank you */}
      <Modal show={thankModal} onClose={() => setThankModal(false)}>
        <Modal.Header className="modal_header font-bold">
          <b>Thank you</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6 text-sm">
            Our team will review this report and may contact you for further
            details.
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            onClick={() => setThankModal(false)}
            className="px-4 h-[40px] button_blue"
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Thank you End */}
      <div className="container px-5 pos_r">
        <div className="pb-6 pt-6  flex justify-between">
          <div className="breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div
            onClick={() => setOpenModal(true)}
            className="text-sm text-blue-300"
          >
            <Link href="#">
              <svg
                className="w-4 h-4 text-blue-300 mr-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 16 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 1v18M1 3.652v9c5.6-5.223 8.4 2.49 14-.08v-9c-5.6 2.57-8.4-5.143-14 .08Z"
                />
              </svg>
              Report
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 gap_20 lg:grid-cols-1 ">
          <div className="first_grid relative">
            <div className="lg:flex items-start gap_20">
              <Image
                src="/16x9image.png"
                alt=""
                className="aspect-square w-36 rounded-lg object-cover"
                width={150}
                height={150}
              />
              <div className="">
                <h3 className="profile_title_font text-gray-900">
                  Thunder & Lightning Industries Inc
                </h3>
                <div className="py-2.5 pl-1">
                  <Link href="/billing-payment">
                    <button
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
                      type="button"
                    >
                      Subscribe to enable editing of this company profile
                    </button>
                  </Link>
                </div>
                <Link href="#" className="link_color text-sm pl-1">
                  Click here to learn more about the benefits of subscribing to
                  XDS Spark
                </Link>
              </div>
            </div>

            <div className="relative bottom-0 left-0 pt-6">
              <p className="pb-2.5">
                <span className="font-bold text-sm">Company size :</span> 50-100
              </p>
              <button
                type="button"
                className="default_text_color bg_yellow focus:outline-none font-medium rounded-sm text-xs px-2 py-1 me-2 "
              >
                Photogrammetry
              </button>
              <button
                type="button"
                className="default_text_color bg_yellow focus:outline-none font-medium rounded-sm  text-xs px-2 py-1 me-2 "
              >
                VFX
              </button>
              <button
                type="button"
                className="default_text_color bg_pink focus:outline-none font-medium rounded-sm text-xs px-2 py-1 me-2 "
              >
                Supplementary Services
              </button>
            </div>
          </div>
          <div className="Second_grid hidden">
            <Image
              className="h-auto max-w-full"
              src="/16x9 image.png"
              alt="image description"
              width={640}
              height={348}
            />
          </div>
        </div>
        <div className="sm:block pt-6">
          <div className="border-b border-t border-gray-200 relative">
            <nav className="-mb-px flex lg:gap-6 gap-2" aria-label="Tabs">
              <a
                href="javascript:void(0)"
                onClick={() => {
                  onClickStatus1("1");
                }}
                className={`shrink-0 border-b-2 px-1 py-2 font-bold text-sm ${
                  status == "1"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Our Work
              </a>
              <a
                href="javascript:void(0)"
                onClick={() => {
                  onClickStatus1("2");
                }}
                className={`shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${
                  status == "2"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Certifications & Diligence
              </a>
              <a
                href="javascript:void(0)"
                onClick={() => {
                  onClickStatus1("3");
                }}
                className={`shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${
                  status == "3"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                About
              </a>
              <a
                href="javascript:void(0)"
                onClick={() => {
                  onClickStatus1("4");
                }}
                className={`shrink-0 border-b-2 px-1 py-2 font-bold  text-sm ${
                  status == "4"
                    ? "shrink-0 border-b-2 px-1  text-sky-600  border-sky-500 "
                    : "border-transparent default_text_color hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Contact
              </a>
            </nav>
            <div className="absolute right-0 top-0 mt-1 xs_mobile_top_55">
              <button
                className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
              >
                <Image
                  src="exit-right.svg"
                  className="w-3 h-3 text-blue-300"
                  alt=""
                  width={12}
                  height={12}
                />
                <span className=""> Website </span>
              </button>
              <button
                className="text-sm inline-flex items-center justify-center gap-1.5 rounded-sm border-0 border-gray-200 px-3 py-1 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                type="button"
              >
                <Image
                  src="plus.svg"
                  className="w-3 h-3 text-blue-300"
                  alt=""
                  width={12}
                  height={12}
                />
                <span className=""> Add To...</span>
              </button>
            </div>
          </div>
          {status == "1" ? (
            <>
              <div className="project-highlights py-6">
                <div className="sm:flex sm:items-center sm:justify-between pb-6">
                  <div className="sm:text-left">
                    <h1 className="font-bold text-gray-900 header-font">
                      Project Highlights
                    </h1>
                  </div>
                </div>
                <div className="sm:text-left pb-6 italic">Coming Soon... </div>
              </div>
            </>
          ) : status == "2" ? (
            <div className="certificationsdiligence pb-6">
              <div className="sm:flex sm:items-center sm:justify-between py-6">
                <div className="sm:text-left">
                  <h1 className="font-bold text-gray-900 header-font">
                    <span className="xs_mobile_hide">
                      Certifications & Diligence
                    </span>{" "}
                    <span className="lg:hidden md:hidden">Certidiligence</span>
                  </h1>
                </div>
              </div>
              <div className="sm:text-left pb-6 italic">Coming Soon... </div>
            </div>
          ) : status == "3" ? (
            <div className="aboutus">
              <div className="sm:flex sm:items-center sm:justify-between py-6">
                <div className="sm:text-left">
                  <h1 className="font-bold text-gray-900 header-font">About</h1>
                </div>
              </div>
              <div className="sm:text-left pb-6">
                <p className="text-sm">
                  Facilisi tempor diam dictum pellentesque aenean aptent eu,
                  risus congue viverra primis dapibus penatibus massa nisl,
                  praesent mollis velit fusce eleifend vitae. Ante integer
                  vivamus ullamcorper orci nibh himenaeos massa hac, vitae
                  eleifend at fusce class dictum aptent, fringilla tempor tortor
                  rutrum sociosqu lobortis nulla. Lacinia vivamus donec euismod
                  facilisis aliquet taciti sollicitudin diam, fermentum cras
                  libero cubilia nec ornare tempus augue, luctus a tristique
                  arcu ultrices eleifend quisque.
                </p>
                <div className="pt-6">
                  <Link href="#" className="link_color  text-sm">
                    Click to request XDS Spark admins to edit or remove this
                    company profile.
                  </Link>
                </div>
              </div>
            </div>
          ) : status == "4" ? (
            <div className="contactus">
              <div className="sm:flex sm:items-center sm:justify-between py-6">
                <div className="sm:text-left">
                  <h1 className="font-bold text-gray-900 header-font">
                    Contact
                  </h1>
                </div>
              </div>
              <div className="sm:text-left pb-6 italic">Coming Soon... </div>
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </>
  );
};
export default Noprojects;
