"use client";
// import PasswordProtection from "@/components/PasswordProtection";
import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { Label, Textarea } from "flowbite-react";
const opportunityDetailNoImages = () => {
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.OPPORTUNITIES.name,
      path: PATH.OPPORTUNITIES.path,
    },
    // {
    //   label: PATH.OPPORTUNITYVIEW.name,
    //   path: PATH.OPPORTUNITYVIEW.path,
    // },
  ];

  return (
    <>
      <div className="container px-5 pos_r">
        <div className="pb-6 pt-6 breadcrumbs_s">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="sm:text-left">
            <h1 className="font-bold text-gray-900 header-font">
              Teaching Game
            </h1>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 sm:grid-cols-1 gap_20 items-center">
          <div className="left_desc">
            <div className="post_date py-6 space-y-1">
              <p className="default_text_color text-sm">
                <span className="font-bold">Posted:</span> Sep 2, 2023
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Opportunity expiry date:</span>
                Jan 5, 2024
              </p>
            </div>
            <div className="post_date pb_15 pt-0 space-y-1">
              <p className="default_text_color text-sm">
                <span className="font-bold">Company:</span> Activision
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Contact person:</span>Firstname
                Lastname
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Media:</span> Video Game
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Platform: </span>Console, Mobile, PC
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Start:</span>Oct 2023
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">End:</span>Jun 2024
              </p>
              <p className="default_text_color text-sm">
                <span className="font-bold">Staff months:</span>6
              </p>
            </div>
            <div className="sm:text-left pb_15">
              <h1 className="font-bold text-gray-900 heading-sub-font">
                Services
              </h1>
            </div>
            <div className="pb_15 space-x-2">
              <button
                type="button"
                className="text-gray-900 bg_yellow focus:outline-none font-medium rounded-sm text-xs px-2 py-1"
              >
                Photogrammetry
              </button>
              <button
                type="button"
                className="text-gray-900 bg_yellow focus:outline-none font-medium rounded-sm  text-xs px-2 py-1"
              >
                VFX
              </button>
              <button
                type="button"
                className="text-gray-900 bg_pink focus:outline-none font-medium rounded-sm text-xs px-2 py-1"
              >
                Supplementary Services
              </button>
            </div>
          </div>
          <div className="right_desc md:pt-6">
            <p className="pb_15 text-sm default_text_color">
              Facilisi tempor diam dictum pellentesque aenean aptent eu, risus
              congue viverra primis dapibus penatibus massa nisl, praesent
              mollis velit fusce eleifend vitae. Ante integer vivamus
              ullamcorper orci nibh himenaeos massa hac, vitae eleifend at fusce
              class dictum aptent, fringilla tempor tortor rutrum sociosqu
              lobortis nulla. Lacinia vivamus donec.
            </p>
            <p className="text-sm default_text_color">
              Facilisi tempor diam dictum pellentesque aenean aptent eu, risus
              congue viverra primis dapibus penatibus massa nisl, praesent
              mollis velit fusce eleifend vitae. Ante integer vivamus
              ullamcorper orci nibh himenaeos massa hac, vitae eleifend at fusce
              class dictum aptent, fringilla tempor tortor rutrum sociosqu
              lobortis nulla. Lacinia vivamus donec.
            </p>
          </div>
        </div>

        <div className="py-6">
          <hr />
        </div>
        <div className="interested_opportunity?">
          <div className="sm:text-left pb_15">
            <h1 className="font-bold default_text_color heading-sub-font">
              Interested in this opportunity?
            </h1>
          </div>
          <div className="max-w-md">
            <div className="mb-2 block">
              <Label
                htmlFor="comment"
                className="text-xs font-bold"
                value="Briefly describe why your company is a fit for this opportunity *"
              />
            </div>
            <Textarea
              className="focus:border-blue-300"
              id="comment"
              placeholder="..."
              required
              rows={8}
            />
            <p className="text_xs_13 default_text_color mt-1">
              For example, please include past experience working with this
              company (if known), relevant creative or technical expertise,
              availability of resources, etc.
            </p>
          </div>
          <div className="py-6">
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors  button_blue text-primary-foreground hover:bg-primary/90 h-10 p-5"
              type="button"
            >
              I&apos;m Interested
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
export default opportunityDetailNoImages;
