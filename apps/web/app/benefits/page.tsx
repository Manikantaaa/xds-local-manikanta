"use client";


import Image from "next/image";
import Link from "next/link";
import { Carousel } from 'flowbite-react';
import { useUserContext } from "@/context/store";
import { redirect, useSearchParams } from "next/navigation";
import { PATH } from "@/constants/path";
import "../../public/css/buyer-benifits.css";
import { useEffect } from "react";
const Benifits = () => {
  const { user } = useUserContext();
  const searchParams = useSearchParams();
  if (!user) {
    redirect(PATH.HOME.path);
  }
  if (user?.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  useEffect(() => {
    document.title = "XDS Spark - SP Benefits";
  }, [])
  return (
    <>
      <div className="bg_buyer relative lg:h-[720px]">
        {/* <video autoPlay loop muted style={{ width: '100%', height: 'auto' }}>
          <source src="/Premiere.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video> */}
        <div className="relative top-0 z-40 w-full text-center lg:py-24 py-10 px-2.5 lg:px-0 mobile_relative">
          <h1 className="benifit_title text-white">Ignite Your Presence on XDS Spark!</h1>
          <p className="text-white benifit_text lg:py-7 lg:w-[830px]">Join today and experience the full power of an XDS Spark  <Link href="#" className="color_yellow_p font-semibold">premium membership,</Link> an innovative platform for accelerating your company's growth and success through its proven features, comprehensive resources, and above all, the invaluable guidance of our expert-driven team.</p>


          <Link prefetch={false} href={`${(user?.userRoles[0].roleCode === 'buyer' || searchParams.get("gotoPage") && searchParams.get("gotoPage") === "subscription") ? 'my-profile/subscriptions' : `/serviceproviders-details/${user?.slug}`}`
          } className="head_back mobile_head_btn"> <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="21" height="21" viewBox="0 0 21 21" fill="none">


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
      <div className="background_bg">
        <div className="lg:w-[553px] m-auto relative bpad_10">
          <div className="lg:-mt-80 pt-10 lg:pt-0">
            <div className="block p-0 img_box_shadow w-full text-center">
              {/* <Image src="/profile_company-1.png" alt="" width={553} height={703} className="m-auto" /> */}
              <div className="spark_slider">
                <div className="slider_height_fix">
                  <Carousel>
                    <img src="../profile_company-1.png" className="w-full" />
                    <img src="../profile_company-2.png" className="w-full" />
                    <img src="../profile_company-3.png" className="w-full" />
                    <img src="../profile_company-4.png" className="w-full" />
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* <div className="lg:w-[900px] m-auto relative lg:py-20 py-10 bpad_10">
          <div className="block text-center">
            <h5 className="text-[#9B53D2] lg:text-[25px] text-[18px] font-extrabold tacking-[0.25px;] uppercase">CREATE Standout, Effective Company Profiles</h5>
            <ul className="space-y-7 text-gray-500 list-inside benifit_ul_list py-7">
                  <li className="flex items-center justify-center">                   
                  Highlight recent projects &nbsp; | &nbsp; Showcase top portfolio pieces
                  </li>
                </ul>
                <p className="benifit_text_color ">We understand what gives buyers confidence in a service provider. Spark ensures that your profile is visible, and presented in the best light to captivate active buyers.</p>
          </div>
        </div> */}
        <div className="lg:w-[900px] m-auto relative lg:py-20 py-10 bpad_10">
          <div className="grid lg:grid-cols-2 lg:gap-20 gap-10">
            <div className="">
              <div className="block">
                <h5 className="text-[#9B53D2] lg:text-[25px] text-[18px] font-extrabold tacking-[0.25px;] uppercase">Standout, Effective Company Profiles</h5>
                <p className="benifit_text_color  py-7">We understand what gives buyers confidence in a service provider. Spark ensures that your profile is visible, and presented in the best light to captivate active buyers.</p>

                <ul className="max-w-md space-y-7 text-gray-500 list-inside benifit_ul_list">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 me-3 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    Highlight recent projects
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 me-3  flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    Showcase top portfolio pieces
                  </li>

                </ul>

              </div>
            </div>
            <div className="">
              <div className="block">
                <h5 className="text-[#9B53D2] lg:text-[25px] text-[18px] font-extrabold tacking-[0.25px;] uppercase">SUBMIT your interest to global opportunities</h5>
                <p className="benifit_text_color  py-7">Find the right projects with Spark's diverse collection of companies of all sizes, selecting the most suitable projects has never been easier. Don’t let opportunities pass you by!</p>

                <ul className="max-w-md space-y-7 text-gray-500 list-inside benifit_ul_list">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 me-3 flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    Collaborate to land more ambitious engagements!
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 me-3  flex-shrink-0" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="#9B53D2" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    Discover other Service Providers to partner up with
                  </li>

                </ul>

              </div>
            </div>
          </div>
          <div className="lg:mt-44 pt-0 lg:pt-0 "></div>
        </div>
      </div>
      <div className="lg:w-[700px] m-auto relative mb-5">
        <div className="lg:-mt-44 pt-5 lg:pt-0 bpad_10">
          <div className="block p-0 img_box_shadow w-full text-center">
            <Image src="/opportunity_banner.png" alt="" width={850} height={442} className="m-auto rounded-md" />
          </div>
        </div>
      </div>
      <div className="buyer_reverse_bg lg:mt-0">
        <div className="lg:w-[1200px] m-auto relative lg:py-20 py-10 bpad_10">
          <div className="lg:mb-24 mb-10">
            <h6 className=" pb-2.5 text-center text-[17px] font-extrabold text-[#FFF3A0]">GET YOUR BUSINESS READY TO STANDOUT! </h6>
            <h5 className="text-center lg:text-[28px] text-[22px] text-white font-extrabold tacking-[1.96px] lg:leading-[45px]">SERVICE PROVIDER MEMBERSHIP BENEFITS</h5>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-0">
            <div className=" prce_bg_shadow">
              <div className="w-full p-4 sm:p-8">
                <div className="height_fix">
                  <h5 className="mb-4 price_list_title">Foundational</h5>
                  <div className="color_pink text-center"><span className="font_22px mt-3">Complimentary ($0)</span></div>
                  <p className="font_19px text-base italic text-center my-16">Maintain a basic account allowing Buyers to <b>discover you! </b></p>
                </div>
                <div className="my-5 text-center"><a target="_blank" href="/registration?userType=foundational"><button className="sign_up_button">Sign up</button></a></div>
                <div className="mt-10"></div>
                <ul role="list" className="space-y-5">
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">COMPANY PROFILE</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Maintain a foundational company profile for visibility to Buyers in Spark:</span>
                    </div>
                    <div className="flex items-strat mt-3"><span className="text-base font-normal  ms-5 text_dark">• Company logo <br />• Banner image<br />• Company description <br /> • Website <br />• Company size<br />• Key services</span></div>
                    {/* <ul className="ps-7 mt-1 space-y-1 list-inside list-disc text_dark">
                        <li>Buyers can discover you</li>
                        <li>View other basic profiles</li>
                      </ul> */}
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">SEARCH & FILTER</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">View other Service Provider profiles</span>
                    </div>
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Receive one (1) user account to manage your company profile</span>
                    </div>
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Secure server hosting</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="premium_bg_shadow">
              <div className="w-full p-4 sm:p-8">
                <div className="height_fix_center">
                  <h5 className="mb-4 price_list_title">Premium</h5>
                  <div className="color_pink text-center"><span className="font_22px mt-3">$88 for 5 users/month,billed annually</span></div>
                  <p className=" font-semibold opacity-70 my-5 italic text-center">$99 for 5 users/billed monthly</p>
                  <p className="font_19px text-base italic text-center"><b>Full access</b> to maintain a rich company profile, and access other key features!</p>
                </div>
                <div className="my-5 text-center"><a target="_blank" href="/registration"><button className="sign_up_button">Sign up</button></a></div>
                <div className="mt-10"></div>
                <h2 className="block text-[17px] font-bold mb-4 text-[#643B82]">Everything in FOUNDATIONAL, plus..</h2>
                <ul role="list" className="space-y-5">
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">PROFILE</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Maintain a rich company profile with portfolio, project highlights, platforms, engines, certifications, security, company history, contacts & more</span>
                    </div>
                    <div className="flex items-strat mt-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Promote XDS-related events you will be attending</span>
                    </div>
                  </li>
                  <li className="text-start">
                      <h2 className="block text-base font-bold color_pink_light mb-4">RESPOND TO OPPORTUNITIES</h2>
                      <div className="flex items-strat">
                        <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                          <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                        </svg>
                        <span className="text-base font-normal  ms-3 text_dark">Review and respond to project opportunities posted by Buyers</span>
                      </div>
                    </li> 
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">PARTNER MANAGEMENT</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">View rich company profiles of other Service Providers, and discover companies to increase your capacity and offerings</span>
                    </div>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">In <span className="italic">My Spark,</span> manage partner relationship data including legal, security, rates, performance, capacity & notes</span>
                    </div>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Create and share projects and lists to cultivate Service Provider candidate partnerships</span>
                    </div>
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Recieve five (5) user accounts to manage your company profile</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            <div className="prce_bg_shadow">
              <div className="w-full p-4 sm:p-8">
                <div className="height_fix">
                  <h5 className="mb-4 price_list_title">Enterprise</h5>
                  <div className="color_pink text-center"><span className="font_22px mt-3">Let's Talk</span></div>
                  <p className=" font-normal text-center my-16 text-[18px] w-[300px] m-auto">Let Spark become a <b>bespoke solution</b> for your internal teams! </p>
                </div>
                <div className="my-5 text-center"><a href="mailto:info@xds-spark.com?subject=XDS Spark - Enterprise Enquiry"><button className="sign_up_button">Contact Us</button></a></div>
                <div className="mt-10"></div>
                <h2 className="block text-[17px] font-bold mb-4 text-[#643B82]">Everything in PREMIUM, plus...</h2>
                <ul role="list" className="space-y-5">
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">ACCOUNT MANAGEMENT</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Unlimited user accounts to provide to team members</span>
                    </div>
                    <div className="flex items-strat mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Add Service Provider's that are private to your company</span>
                    </div>
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">CUSTOMIZATION</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">White-labeled database ready for your branding, with support to integrate your existing database</span>
                    </div>
                    <div className="flex items-strat mt-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Bespoke feature development including API integration into your procurement systems</span>
                    </div>
                    <div className="flex items-strat mt-4 ">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Build an internal external dev Hub with community features</span>
                    </div>
                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">ROADMAP INPUT</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Tailored development of features to support your unique processes & systems</span>
                    </div>

                  </li>
                  <li className="text-start">
                    <h2 className="block text-base font-bold color_pink_light mb-4">SECURITY</h2>
                    <div className="flex items-strat">
                      <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 w-[12px] h-[12px] mt-2" viewBox="0 0 11 13" fill="none">
                        <path d="M10.7235 2.32275L3.87581 12.2073C3.54173 12.6896 3.00007 12.6896 2.66599 12.2073L0.283837 8.76873C-0.0898688 8.22929 -0.0987087 7.33346 0.282008 6.80458C0.651142 6.29198 1.23792 6.29814 1.60187 6.82306L3.27105 9.23249L9.39087 0.398639C9.75909 -0.13288 10.3556 -0.13288 10.7238 0.398639C11.0921 0.930157 11.0921 1.79123 10.7238 2.32275H10.7235Z" fill="#9B53D2" />
                      </svg>
                      <span className="text-base font-normal  ms-3 text_dark">Choose your preferred, secured platform hosting provider</span>
                    </div>

                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer_overlay_2 m-auto text-center py-5 lg:mt-28 mt-10">
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
          <div className="lg:pt-20 pt-10 testimonials_section">
            <div className="container lg:w-[1100px] m-auto">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8 justify-center">
                <div className="">
                  <img src="/ProfileHugo2.png" className="m-auto" />
                </div>
                <div className=" lg:col-span-2">
                  <p className="text-[24px] text-white text-center">“We were excited to be discovered by a AAA developer in XDS Spark, and are now discussing new project opportunities!”</p>
                  <p className="text-[17px] mt-9 text-center text-white font-bold">Hugo Gutiérrez Mares, Founder & Director, Boson VFX</p>
                </div>
                <div className="">
                  <img src="/PprofileHugo2.png" className="m-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
};

export default Benifits;
