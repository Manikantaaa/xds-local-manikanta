"use client";


import Image from "next/image";
import Link from "next/link";
import { Carousel } from 'flowbite-react';
import { useUserContext } from "@/context/store";
import { redirect, useSearchParams } from "next/navigation";
import { PATH } from "@/constants/path";
import "../../public/css/buyer-benifits.css";
import { useEffect } from "react";
const BuyersBenefit = () => {
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  if (!user) {
    redirect(PATH.HOME.path);
  }
  if (user?.userRoles[0].roleCode != 'buyer') {
    redirect(PATH.HOME.path);
  }
  useEffect(() => {
    document.title = "XDS Spark - Buyer Benefits";
  },[])
  return (
    <>
      <div className="bg_buyer  relative">
        <div className="relative top-0 z-40 w-full text-center lg:py-20 px-2.5 lg:px-0 mobile_relative py-10">
          <h1 className="benifit_title text-white">Bring your team onboard with a <br />PREMIUM Buyer membership</h1>
          <p className="text-white benifit_text lg:py-12 lg:w-[830px]">
            With over 500 Service Providers to search, upgrade today and have your team experience the full power of a XDS Spark <Link href="#" className="color_yellow_p font-semibold"> Premium Membership. </Link>
            <span className="block mt-5">Spark is an innovative platform for accelerating your company’s growth and success through its proven features, comprehensive resources, and above all, the invaluable guidance of our expert-led team. </span>
          </p>
          <Link prefetch={false} href={`${(user?.userRoles[0].roleCode === 'buyer' || searchParams.get("gotoPage") && searchParams.get("gotoPage") === "subscription") ? 'my-profile/subscriptions' : `/serviceproviders-details/${user?.slug}`}`
          } className="head_back mobile_head_btn">
            <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="21" height="21" viewBox="0 0 21 21" fill="none">


              <g clip-path="url(#clip0_112_237)">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5003 0C4.71015 0 0 4.71015 0 10.4997C0 16.2893 4.71015 21 10.5003 21C16.2904 21 21.0005 16.2893 21.0005 10.4997C21.0005 4.71015 16.2904 -0.000509262 10.5003 -0.000509262V0ZM16.3573 11.9986H8.43075C8.43075 11.9986 10.3521 13.9205 11.5424 15.1103C12.0507 15.6186 12.0507 16.4431 11.5424 16.9514C11.4586 17.0352 11.3738 17.12 11.29 17.2038C10.7817 17.7121 9.95772 17.7121 9.44941 17.2038C7.89179 15.6462 4.80006 12.5544 3.72214 11.4765C3.47795 11.2328 3.34053 10.9013 3.34053 10.5565V10.4451C3.34053 10.1003 3.47795 9.76921 3.72214 9.52502C4.80006 8.4471 7.89128 5.35537 9.44941 3.79775C9.95772 3.28944 10.7823 3.28944 11.29 3.79775C11.3738 3.88153 11.4586 3.96633 11.5424 4.05011C12.0507 4.55842 12.0507 5.38244 11.5424 5.89075C10.3521 7.08055 8.43075 9.00241 8.43075 9.00241H16.3573C17.0766 9.00241 17.659 9.5853 17.659 10.3041V10.6974C17.659 11.4167 17.0766 11.9991 16.3573 11.9991V11.9986Z" fill="#F4E56F" />
              </g>
              <defs>
                <clipPath id="clip0_112_237">
                  <rect width="21" height="21" fill="white" transform="matrix(1 0 0 -1 0 21)" />
                </clipPath>
              </defs>
            </svg> Head back to your profile to subscribe today! </Link>
        </div>
      </div>
      <div className="px-0">
        <div className="">
          <div className="container lg:w-[1100px] m-auto">
            <div className="lg:py-20 py-10">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-32">
                <div className="grid_item_1">
                  <p className="buyer_benifits_title lg:mb-6">PREMIUM BENEFITS FOR</p>
                  <h3 className="buyer_h2title">Access for <br /><span className="text-[#9B53D2]">five</span> team members</h3>
                  <p className="buyer_inner_text_19 mt-6">What does upgrading to five user <br /> licenses offer? </p>
                </div>
                <div className="grid_item_2">
                  <p className="text-[19px]"><span className="text-[#9B53D2] font-bold">Collaborate Better:</span> More seats means team members can engage with the platform and collaborate on partner discovery.</p>
                  <p className="my-8 text-[19px]"><span className="text-[#9B53D2] font-bold">Partner Management:</span> Team members can contribute in My Spark by adding rates, performance reviews and partner notes.</p>
                  <p className="text-[19px]">
                    <span className="text-[#9B53D2] font-bold">Scale Your Growth: </span> As your business grows, so should your access. Ensure teams can stay connected and aligned on Spark.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* <div className="bg-[#f6f3f3]">
            <div className="container lg:w-[1100px] m-auto">
              <div className="lg:py-20">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-32">
                  <div className="grid_item_1">
                    <p className="buyer_benifits_title lg:mb-6">PREMIUM MEMBERSHIP BENEFIT: </p>
                    <h3 className="buyer_h2title">Get an exclusive  consulting session</h3>
                    <p className="buyer_inner_text_19 mt-6">Book time with Co-Founder, Sam Carlisle</p>

                    <p className="text-[19px] mt-10">
                      In continuing to advance external development, XDS Spark offers <b>consulting services</b> to level-up the effectiveness of your organization.</p>
                    <p className="text-[19px] mt-5">
                      We draw on <b>decades of experience</b> in supporting and learning from studios at the cutting edge of game development.</p>
                  </div>
                  <div className="grid_item_2 pharagaph_underline">
                    <p className="buyer_inner_text_19 mb-2.5">XDS Spark consulting can help you with: </p>
                    <p className="text-[19px]">Guidance to source the right partners to fit your development vision</p>
                    <p className="text-[19px]">External development strategy </p>
                    <p className="text-[19px]">Company evaluation</p>
                    <p className="text-[19px]">Training</p>
                    <p className="text-[19px]">Post-mortems </p>
                    <p className="text-[19px]">Due diligence</p>
                    <p className="text-[19px]"> Insights into the external development landscape</p>
                    <p className="text-[19px] font-bold">...and more</p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          <div className="manage_relationship lg:py-20 py-10 bpad_10">
            <div className="container lg:w-[1100px] m-auto">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-32">
                <div className="grid_item_1">
                  <h5 className="buyer_rtitle">Upgrade to your team <br />to <span className="text-[#D88DFF]">Buyer Premium</span> today</h5>
                  <p className="buyer_title_text pt-6">$88 for 5 users/month, billed annually</p>
                  <p className="buyer_inner_italic">$99 for 5 users/billed monthly</p>
                </div>
                <div className="grid_item_1">
                  <h2 className="account_title">ACCOUNT MANAGEMENT</h2>
                  <div className="flex items-strat mt-3 -ml-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#ffffff"></path></svg>
                    <span className="text-[19px] font-normal ms-3 text-white">Up to <span className="text-[#D88DFF] font-bold">5 user accounts</span> for your teams</span>
                  </div>
                  <div className="flex items-strat mt-3 -ml-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#ffffff"></path></svg>
                    <span className="text-[19px] font-normal ms-3 text-white ">Share or restrict <span className="font-bold italic">My Spark</span> data by user</span>
                  </div>
                  <h2 className="account_title mt-10">CONSULTATION</h2>
                  <div className="flex items-strat mt-3 -ml-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#ffffff"></path></svg>
                    <span className="text-[19px] font-normal ms-3 text-white"><span className="text-[#D88DFF] font-bold">Receive a complimentary consultation</span><br /> session to learn about how to get the most value from Spark for your team or studio</span>
                  </div>
                </div>
              </div>
              <div className="bg-[#fff] rounded-[10px] p-10 mt-20 shadow_box_m">
                <h2 className="buyer_fondation_title"><span className="plus_border_bottom">PLUS</span> all the quality features found in your Buyer Foundational Membership</h2>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-32 mt-10">
                  <div className="grid_item_1">
                    <h2 className="account_title"><span className="text-[#8E3FCB]">DISCOVER SERVICE PROVIDERS</span></h2>
                    <div className="flex items-strat mt-2.5 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3">View over 500 rich Service Provider profiles including portfolios, project highlights, platforms, engines, certifications, security, company history & more</span>
                    </div>
                    <div className="flex items-strat mt-3 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">Access Service Provider contact information</span>
                    </div>
                    <div className="flex items-strat mt-3 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">Perform side-by-side comparisons of Service Providers</span>
                    </div>
                    <div className="flex items-strat mt-3 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">View events Service Providers are attending</span>
                    </div>
                  </div>
                  <div className="grid_item_2">
                     <h2 className="account_title"><span className="text-[#8E3FCB]">MANAGE OPPORTUNITIES </span></h2>
                    <div className="flex items-strat mt-2.5 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3">Post project opportunities <span className="underline italic">anonymously</span> for Service Providers to bid on</span>
                    </div> 
                    <h2 className="account_title mt-3"><span className="text-[#8E3FCB]">PARTNER MANAGEMENT </span></h2>
                    <div className="flex items-strat mt-2.5 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">In <span className="italic">My Spark,</span> manage partner relationship data including legal, security, rates, performance, capacity & notes</span>
                    </div>
                    <div className="flex items-strat mt-3 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">Create and share projects, and short-list Service Providers to present partner options to stakeholders</span>
                    </div>
                  </div>
                  <div className="grid_item_3">
                    <h2 className="account_title"><span className="text-[#8E3FCB]">ACCOUNT MANAGEMENT</span></h2>
                    <div className="flex items-strat mt-2.5 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3">Recieve one (1) user account to manage your profile</span>
                    </div>
                    <h2 className="account_title mt-5"><span className="text-[#8E3FCB]">PARTNER MANAGEMENT </span></h2>
                    <div className="flex items-strat mt-3 -ml-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none"><path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2"></path></svg>
                      <span className="text-[17px] font-normal ms-3 ">Secure server hosting</span>
                    </div>
                  </div>

                </div>
              </div>
              <div className="footer_overlay_2 m-auto text-center py-5 mt-12">
                <div>
                  <h2 className="pb-2 ready_to_j">Ready to ignite your company’s journey with XDS Spark?</h2>


                  <Link prefetch={false} href={`${(user?.userRoles[0].roleCode === 'buyer' || searchParams.get("gotoPage") && searchParams.get("gotoPage") === "subscription") ? 'my-profile/subscriptions' : `/serviceproviders-details/${user?.slug}`}`
                  } className="head_back head_back_2"> <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="21" height="21" viewBox="0 0 21 21" fill="none">

                      <g clip-path="url(#clip0_112_237)">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.5003 0C4.71015 0 0 4.71015 0 10.4997C0 16.2893 4.71015 21 10.5003 21C16.2904 21 21.0005 16.2893 21.0005 10.4997C21.0005 4.71015 16.2904 -0.000509262 10.5003 -0.000509262V0ZM16.3573 11.9986H8.43075C8.43075 11.9986 10.3521 13.9205 11.5424 15.1103C12.0507 15.6186 12.0507 16.4431 11.5424 16.9514C11.4586 17.0352 11.3738 17.12 11.29 17.2038C10.7817 17.7121 9.95772 17.7121 9.44941 17.2038C7.89179 15.6462 4.80006 12.5544 3.72214 11.4765C3.47795 11.2328 3.34053 10.9013 3.34053 10.5565V10.4451C3.34053 10.1003 3.47795 9.76921 3.72214 9.52502C4.80006 8.4471 7.89128 5.35537 9.44941 3.79775C9.95772 3.28944 10.7823 3.28944 11.29 3.79775C11.3738 3.88153 11.4586 3.96633 11.5424 4.05011C12.0507 4.55842 12.0507 5.38244 11.5424 5.89075C10.3521 7.08055 8.43075 9.00241 8.43075 9.00241H16.3573C17.0766 9.00241 17.659 9.5853 17.659 10.3041V10.6974C17.659 11.4167 17.0766 11.9991 16.3573 11.9991V11.9986Z" fill="#F4E56F" />
                      </g>
                      <defs>
                        <clipPath id="clip0_112_237">
                          <rect width="21" height="21" fill="white" transform="matrix(1 0 0 -1 0 21)" />
                        </clipPath>
                      </defs>
                    </svg> Head back to your profile to subscribe today! </Link>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="container lg:w-[1100px] m-auto">
          <div className="lg:py-20 py-10 lets_talk">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-32">
              <div className="grid_item_1">
                <h2 className="text-[#8E3FCB] text-[34px] font-extrabold">Let’s talk Enterprise</h2>
                <p className="text-[29px] leading-[38px] py-14">Have Spark become a <span className="font-bold">bespoke solution</span> for your studio or company! </p>
                <p className="text-[22px] leading-[38px]">Enterprise includes everything in <br />PREMIUM membership, plus...</p>
                <a href="mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry" target="__blank">
                  <button className="enterprixe_contactus mt-14 bg-[#BF5AF3] mb-10">CONTACT US</button></a>
              </div>
              <div className="grid_item_1">
                <h2 className="account_title"><span className="text-[#8E3FCB]">ACCOUNT MANAGEMENT</span></h2>
                <div className="pharagaph_underline_1">
                  <p className="text-[18px]">Unlimited user accounts to provide to team members</p>
                  <p className="text-[18px]">Add Service Provider's that are private to your company</p>
                </div>
                <h2 className="account_title mt-5"><span className="text-[#8E3FCB]">CUSTOMIZATION</span></h2>
                <div className="pharagaph_underline_1">
                  <p className="text-[18px]">White-labeled database ready for your branding, with support to integrate your existing database</p>
                  <p className="text-[18px]">Bespoke feature development including API integration into your procurement systems</p>
                  <p className="text-[18px]">Build an internal external dev Hub with community features</p>
                </div>
                <h2 className="account_title mt-5"><span className="text-[#8E3FCB]">ROADMAP INPUT</span></h2>
                <div className="pharagaph_underline_1">
                  <p className="text-[18px]">Tailored development of features to support your unique processes & systems</p>
                </div>
                <h2 className="account_title mt-5"><span className="text-[#8E3FCB]">SECURITY</span></h2>
                <div className="pharagaph_underline_1">
                  <p className="text-[18px]">Choose your preferred, secured platform hosting provider</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg_buyer lg:py-20 py-10 testimonials_section">
          <div className="container lg:w-[1100px] m-auto">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 justify-center">
              <div className="">
                <img src="/ProfileHugo.png" className="m-auto" />
              </div>
              <div className=" lg:col-span-2">
                <p className="text-[24px] text-white text-center">“Spark delivers value in finding new partners to cover concrete needs, and the platform has been improving at a fast pace.”</p>
                <p className="text-[17px] mt-9 text-center text-white font-bold">Mika Schulman, Director, Art Production and Outsourcing, Scopely</p>
              </div>
              <div className="">
                <img src="/PprofileHugo.png" className="m-auto" />
              </div>
            </div>
          </div>
        </div>
       <div className="lg:w-[1100px] m-auto relative lg:pt-20 pt-10">
          <h6 className="text-[#462C87] text-[17px] font-bold uppercase text-center tracking-[0.51px] lg:px-0 px-10">LEVERAGE your membership with this VALUABLE feature!</h6>
          <h5 className="benifit_h1_color text-center mt-2.5 text-[#462C87]">Post Project opportunities to Global Service Providers</h5>

          <div className="text-center mt-14 list_ul px-2.5">
            <p className=""><svg className="w-5 h-5 me-3 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg>
              Post <u>anonymously</u> without compromising the confidentiality of your company or project</p>
            <p className="py-5"> <svg className="w-5 h-5 me-3  flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg>
              Discover geographically diverse partners and short-list candidates </p>
            <p className=""> <svg className="w-5 h-5 me-3  flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20"><path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z"></path></svg>
              Share top candidates with your teams to determine best fit </p>
          </div>
          <h5 className="text-[19px] font-semibold text-[#462C87] text-center mt-14">With Spark's diverse collection of companies of all sizes, <br />matching partners to suitable projects has never been easier. </h5>
          <div className="lg:w-[784px] mt-14 lg:pt-0 m-auto">
            <div className="block p-0 img_box_shadow w-full text-center">
              <Image src="/opportunity_banner.png" alt="" width={850} height={442} className="m-auto" />
            </div>
          </div>
        </div>
        <div className="buyer_footer_bg">
          <div className="buyer_footer_alignment lg:space-x-10 space-x-4">
            <Link href="#" className="lg:text-[25px] text-[16px] font-extrabold text-white tracking-[.25px]">Have questions?</Link>
            <a target="__blank" href="mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry"><button className="enterprixe_contactus bg-[#F9EA6F]"><span className="text-[#462C87]">CONTACT US</span></button></a>
          </div>
        </div> 
        {/* <div className=" text-center py-14">
          <p className=" text-[25px] font-normal mb-4">Have questions?</p>
          <a href="mailto:info@xds-spark.com?subject=XDS Spark - General Enquiry" target="__blank">
          <button className="enterprixe_contactus m-auto bg-[#BF5AF3]">CONTACT US</button></a>
        </div> */}


      </div>


    </>
  );
};

export default BuyersBenefit;
