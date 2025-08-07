"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
// import { useAuthentication } from "@/services/authUtils";
import { sanitizeData } from "@/services/sanitizedata";
import { redirect, usePathname } from "next/navigation";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import React from "react";
import { useState, useEffect } from "react";
import { set } from "date-fns";
import { Button } from "flowbite-react";
import ButtonSpinner from "@/components/ui/buttonspinner";
import Link from "next/link";
import TestimonialWidget from "@/components/testimonial-widget";


type ContactFormDto = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  nature?: string;
  message: string;
  userId: number;
}

const BusinessSolutions = () => {

  const { user } = useUserContext();
  const [showPopup, setShowPopup] = useState(false);
  const [thnksPopup, setThanksPopup] = useState(false);
  const [loader, setLoader] = useState<boolean>(false);
  const [popuploader, setPopupLoader] = useState<boolean>(false);

  // Add smooth scrolling effect
  useEffect(() => {
    // Add smooth scrolling behavior to the document
    document.documentElement.style.scrollBehavior = 'smooth';

    // Cleanup function to remove the style when component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

    const currentUrl = usePathname();
  useEffect(() => {
    if (currentUrl.includes('/business-solutions')) {
      document.title = "XDS Spark - Business Solutions";
      return;
    }
  }, [currentUrl]);

  // Function to handle smooth scroll to Carla's section
  const scrollToCarla = (e: React.MouseEvent) => {
    e.preventDefault();
    const carlaSection = document.getElementById('carlarylance');
    if (carlaSection) {
      const yOffset = -80; // negative offset to prevent header overlap
      const y = carlaSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  // if (!user) {
  //   redirect('/login');
  // }
  // useAuthentication({ user, isBuyerRestricted: false, isPaidUserPage: false });
  const {
    register: registerPrimary,
    reset: resetPrimary,
    handleSubmit: handleSubmitPrimary,
    formState: { errors: errorsPrimary },
  } = useForm<ContactFormDto>({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      nature: '',
      message: '',
      userId: 0,
    },
  });
  const {
    register: registerSecondary,
    reset: resetSecondary,
    handleSubmit: handleSubmitSecondary,
    formState: { errors: errorsSecondary },
  } = useForm<ContactFormDto>({
    defaultValues: {
      firstName: '',
      lastName: '',
      company: '',
      email: '',
      nature: '',
      message: '',
      userId: 0,
    },
  });

  const { submitForm } = useCommonPostData<ContactFormDto>({
    url: getEndpointUrl(ENDPOINTS.consultationMail),
  });

  const onSubmit = (async (data: ContactFormDto) => {
    setLoader(true);
    data.userId = user?.id ? user?.id : 1;
    const sanitizedData: ContactFormDto = sanitizeData(data) as ContactFormDto;

    submitForm(sanitizedData).then((response) => {
      setLoader(false);
      if (response.data && response.data.success !== true) {
        toast.error('An Error occurred, Try Again Later');
      } else {
        setThanksPopup(true);
        resetPrimary();
        // toast.success('Message Successfully sent 👍');
      }
    }).catch((err) => {
      setLoader(false);
      console.log(err);
      toast.error('An Error occurred, Try Again Later');
    });
  }) as SubmitHandler<FieldValues>;

  const onSubmitSecondary = (async (data: ContactFormDto) => {
    setPopupLoader(true);
    data.userId = user?.id ? user?.id : 1;
    console.log('Secondary Form Data:', data);
    const sanitizedData: ContactFormDto = sanitizeData(data) as ContactFormDto;

    // You can use another endpoint or different processing logic here
    submitForm(sanitizedData).then((response) => {
      setPopupLoader(false);
      if (response.data && response.data.success !== true) {
        toast.error('Secondary Form: An error occurred');
      } else {
        resetSecondary();
        setShowPopup(false); // Close the popup after successful submission
        setThanksPopup(true);
        // toast.success('Message Successfully sent 👍');
      }
    }).catch((err) => {
      setPopupLoader(false);
      console.error('Secondary Form Error:', err);
      toast.error('Secondary Form: Error occurred');
    });
  }) as SubmitHandler<FieldValues>;

  // const BusinessSolutions = () => {

  // const { user } = useUserContext();
  // if(!user){
  //   redirect('/login');
  // }
  return (
    <>
      <section
        className="w-full min-h-[500px] md:h-[798px] flex items-center"
        style={{
          background:
            "linear-gradient(9deg, rgb(76, 37, 148) 2.84%, rgb(84, 30, 194) 25.01%, rgb(91, 24, 234) 44.01%, rgb(140, 56, 238) 64.19%, rgb(191, 90, 243) 85.17%)",
        }}
      >
        <div className="flex flex-col md:flex-row h-full justify-center items-center md:items-stretch w-full max-w-[1440px] mx-auto px-4 md:px-0 mt-14">
          <div className="flex flex-col pt-10 md:pt-[121px] px-4 md:pl-[81px] md:pr-[81px] w-full md:w-[648px]">
            <p className="text-[16px] md:text-[20px] font-extrabold leading-[22px] md:leading-[25px] tracking-[2px] md:tracking-[3px] text-left uppercase text-[#e5caf3] mb-6 md:mb-[57px]">
              Strategize. Elevate. Succeed.
            </p>
            <h1 className="text-[28px] md:text-[38px] font-inter font-extrabold leading-[36px] md:leading-[55px] text-left text-white mb-6 md:mb-[56px]">
              Advance your Strategies with XDS Spark Business Solutions
            </h1>
            <p className="text-[16px] md:text-[19px] font-inter font-semibold leading-[26px] md:leading-[35px] text-left text-white mb-8 md:mb-[65px]">
              Flexible, high-value support and expertise for developers and service providers ready to scale, solve challenges, and improve efficiency in external development.
            </p>
            <button
              type="button"
              className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px] w-full md:w-[330px] flex items-center justify-center cursor-pointer  transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
              aria-label="Book a free consultation"
              onClick={() => setShowPopup(true)}
            >
              <span className="text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                BOOK A FREE CONSULTATION
              </span>
            </button>

            {showPopup && (
              <div className="fixed inset-0 z-50  bg-black/40 overflow-y-auto">
                <div className="">
                  <div className="bg-white rounded-2xl shadow-xl w-full  md:max-w-[600px] p-4 md:p-8 relative mx-auto">
                    <button
                      className="absolute top-3 right-3 md:top-4 md:right-4 text-gray-400 hover:text-gray-700 text-2xl"
                      onClick={() => setShowPopup(false)}
                      aria-label="Close"
                    >
                      &times;
                    </button>
                    <h2 className="text-[20px] md:text-[26px] font-extrabold text-[#bf5af3] mb-2">
                      Let’s Talk Strategy.
                    </h2>
                    <p className="mb-6 text-gray-700 text-sm md:text-base">
                      Share a few details and we’ll follow up with package info and a free 30-minute consultation to help you take the next step with confidence.
                    </p>
                    <form onSubmit={handleSubmitSecondary(onSubmitSecondary)} className="space-y-4 md:space-y-5">
                      <div className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block font-bold text-[#4c2594] mb-1 text-sm">First Name <span style={{ color: 'red' }}>*</span></label>
                          <input
                            autoComplete="off"
                            type="text"
                            id="FirstName"
                            {...registerSecondary("firstName", {
                              required: {
                                value: true,
                                message: "First Name required",
                              },
                            })}
                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                          />
                          <p className="text-red-600 text-xs pt-1">
                            {typeof errorsSecondary?.firstName?.message === "string" &&
                              errorsSecondary?.firstName?.message}
                          </p>
                        </div>
                        <div className="flex-1 mt-3 md:mt-0">
                          <label className="block font-bold text-[#4c2594] mb-1 text-sm">Last Name <span style={{ color: 'red' }}>*</span></label>
                          <input
                            type="text"
                            id="LastName"
                            {...registerSecondary("lastName", {
                              required: 'Last Name required'
                            })}
                            autoComplete="off"
                            className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                          />
                          <p className="text-red-600 text-xs pt-1">
                            {typeof errorsSecondary?.lastName?.message === "string" &&
                              errorsSecondary?.lastName?.message}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-[#4c2594] mb-1 text-sm">Email Address <span style={{ color: 'red' }}>*</span></label>
                        <input
                          type="email"
                          autoComplete="off"
                          id="Email"
                          {...registerSecondary("email", {
                            required: 'Email required'
                          })}
                          className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                        />
                        <p className="text-red-600 text-xs pt-1">
                          {typeof errorsSecondary?.email?.message === "string" &&
                            errorsSecondary?.email?.message}
                        </p>
                      </div>
                      <div>
                        <label className="block font-bold text-[#4c2594] mb-1 text-sm">Company <span style={{ color: 'red' }}>*</span></label>
                        <input
                          type="text"
                          autoComplete="off"
                          id="Company"
                          {...registerSecondary("company", {
                            required: 'Company required'
                          })}
                          className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                        />
                        <p className="text-red-600 text-xs pt-1">
                          {typeof errorsSecondary?.company?.message === "string" &&
                            errorsSecondary?.company?.message}
                        </p>
                      </div>
                      <div>
                        <label className="block font-bold text-[#4c2594] text-sm mb-2">I would like more information on <span style={{ color: 'red' }}>*</span>:</label>
                        <div className="flex flex-wrap mt-2 labele_check">
                          <div className="flex w-full md:w-1/2">
                            <label className="flex items-center gap-2 w-full hover:cursor-pointer">
                              <input
                                type="radio"
                                value="External Dev Coaching"
                                {...registerSecondary("nature", { required: "Nature required" })}
                                className="accent-[#bf5af3] border border-[#D8D8D8] focus:outline-none focus:ring-2 focus:ring-[#1C64F2]"
                              />
                              <span className="text-sm">External Dev Coaching</span>
                            </label>
                          </div>
                          <div className="flex w-full md:w-1/2">
                            <label className="flex items-center gap-2 w-full hover:cursor-pointer">
                              <input
                                type="radio"
                                value="Competitive Reporting"
                                {...registerSecondary("nature", { required: "Nature required" })}
                                className="accent-[#bf5af3] border border-[#D8D8D8] focus:outline-none focus:ring-2 focus:ring-[#1C64F2]"
                              />
                              <span className="text-sm">Competitive Reporting</span>
                            </label>
                          </div>
                          <div className="flex w-full md:w-1/2 pt-4">
                            <label className="flex items-center gap-2 w-full hover:cursor-pointer">
                              <input
                                type="radio"
                                value="Rate My Pitch"
                                {...registerSecondary("nature", { required: "Nature required" })}
                                className="accent-[#bf5af3] border border-[#D8D8D8] focus:outline-none focus:ring-2 focus:ring-[#1C64F2]"
                              />
                              <span className="text-sm">Rate My Pitch</span>
                            </label>
                          </div>
                          <div className="flex w-full md:w-1/2 pt-4">
                            <label className="flex items-center gap-2 w-full hover:cursor-pointer">
                              <input
                                type="radio"
                                value="Other"
                                {...registerSecondary("nature", { required: "Nature required" })}
                                className="accent-[#bf5af3] border border-[#D8D8D8] focus:outline-none focus:ring-2 focus:ring-[#1C64F2]"
                              />
                              <span className="text-sm">Other</span>
                            </label>
                          </div>
                          <div className="w-full">
                            <p className="text-red-600 text-xs pt-1">
                              {errorsSecondary?.nature?.message as string}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block font-bold text-[#4c2594] mb-1 text-sm">Tell us about your challenge <span style={{ color: 'red' }}>*</span></label>
                        <textarea
                          id="message"
                          autoComplete="off"
                          className="mt-2 w-full rounded-lg border-gray-200 align-top shadow-sm sm:text-sm placeholder-[#AAABAD]"
                          rows={4}
                          placeholder="What specific business challenge would you like help with?"
                          {...registerSecondary("message", {
                            required: 'Message required'
                          })}
                        ></textarea>
                        <p className="text-red-600 text-xs pt-1">
                          {typeof errorsSecondary?.message?.message === "string" &&
                            errorsSecondary?.message?.message}
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="bg-[#bf5af3] text-white font-extrabold rounded-full px-8 py-3 mt-4 text-base w-full md:w-[300px] mx-auto block"
                      >
                        {popuploader ? <div role="status">
                          <svg aria-hidden="true" className="inline w-6 h-6 text-gray-100 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                          </svg>
                          <span className="sr-only">Loading...</span>
                        </div> : 'SUBMIT'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative md:mb-0 mb-8 mt-8 md:mt-[88px] w-full max-w-[400px] md:max-w-[593px] h-full md:h-[622px] ml-0 md:ml-[37px] flex-shrink-0">
            <img
              src="/Carla-on-stage.jpg"
              alt="Carla on stage presenting"
              className="w-full h-full rounded-[15px] object-cover"
            />
          </div>
        </div>
      </section>

      <section
        className="mx-4 md:mx-[77px] my-[40px] md:my-[70px] rounded-[13px] p-4 md:p-[63px]"
        style={{
          background: "linear-gradient(172deg, #4c2594 0%, #5b18ea 50%, #bf5af3 100%)",
        }}
      >
        <div className="flex flex-col items-center">
          <h2 className="text-[28px] md:text-[38px] font-inter font-extrabold leading-[36px] md:leading-[46px] text-center text-white mb-[20px] md:mb-[29px]">
            Data-Driven Strategies. Real Results.
          </h2>
          <h3 className="text-[20px] md:text-[26px] font-inter font-extrabold leading-[26px] md:leading-[32px] text-center text-[#ce79fa] mb-[20px] md:mb-[29px]">
            Gain a competitive edge with sharper strategies.
          </h3>
          <p className="text-[15px] md:text-[16px] font-inter font-normal leading-[22px] md:leading-[24px] text-center text-white mb-[40px] md:mb-[71px] max-w-full md:max-w-[743px]">
            We don't just consult—we analyze, assess, and help you act. With exclusive access to proprietary data from XDS Spark, the XDS conference, and our Business Solutions practice, we uncover where you stand—and where you can lead.
          </p>

          <div className="flex flex-col md:flex-row gap-[32px] md:gap-[107px] mb-[32px] md:mb-[51px] w-full items-center justify-center">
            {/* What We Deliver Card */}
            <div className="bg-white rounded-[10px] w-full max-w-[473px] h-auto md:h-[317px] p-6 md:p-[38px]  flex flex-col justify-between mb-4 md:mb-0 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
              <div>
                <h4 className="text-[17px] md:text-[19px] font-inter font-extrabold leading-[21px] md:leading-[23px] text-left text-[#2b1983] mb-[18px] md:mb-[24px]">
                  What We Deliver
                </h4>
                <div className="text-[14px] md:text-[15px] font-inter font-medium leading-[28px] md:leading-[35px] text-left text-[#2b1983] mb-[18px] md:mb-[25px] space-y-1">
                  <p className="hover:text-[#bf5af3] transition-all duration-200 hover:translate-x-2 flex"><span className="font-bold text-[#bf5af3] shrink-0 mr-2">⟶</span> Competitive Analysis</p>
                  <p className="hover:text-[#bf5af3] transition-all duration-200 hover:translate-x-2 flex"><span className="font-bold text-[#bf5af3] shrink-0 mr-2">⟶</span> Strengths and Gap Assessment</p>
                  <p className="hover:text-[#bf5af3] transition-all duration-200 hover:translate-x-2 flex"><span className="font-bold text-[#bf5af3] shrink-0 mr-2">⟶</span> USP and Market Opportunity Identification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(true)}
                className="bg-[#bf5af3] rounded-[25px] h-[48px] md:h-[50px] w-full md:w-[274px] flex items-center justify-center cursor-pointer mt-4 md:mt-0 mx-auto transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
              >
                <span className="text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-white">
                  GET MY STRATEGY <span className="font-black">⟶</span>
                </span>
              </button>
            </div>

            {/* See Data In Action Card */}
            <div className="bg-white rounded-[10px] w-full max-w-[473px] h-auto md:h-[317px] p-6 md:p-[38px] flex flex-col justify-between transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] hover:-translate-y-2">
              <div>
                <h4 className="text-[17px] md:text-[19px] font-inter font-extrabold leading-[21px] md:leading-[23px] text-left text-[#2b1983] mb-[18px] md:mb-[24px]">
                  See Data In Action
                </h4>
                <p className="text-[14px] md:text-[15px] font-inter leading-[22px] md:leading-[24px] text-left text-[#2b1983] mb-[18px] md:mb-[25px]">
                  The <span className="font-semibold italic font-bold">2025 XDS Industry Insight Report</span>, co-authored by Spark's <Link href="#carlarylance" onClick={scrollToCarla}> <span className="font-semibold text-[#bf5af3]">Carla Rylance</span> </Link>, showcases the proprietary research that powers every engagement—and helps our clients move with clarity and confidence.
                </p>
              </div>

              <a
                href="https://mailchi.mp/xds-spark.com/insightsreport25"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#bf5af3] rounded-[25px] h-[48px] md:h-[50px] w-full md:w-[274px] flex items-center justify-center cursor-pointer mt-4 md:mt-0 mx-auto transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
                aria-label="Download full report"
              >
                <span className="text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-white">
                  DOWNLOAD FULL REPORT <span className="font-black">⟶</span>
                </span>
              </a>
            </div>
          </div>

          <p className="text-[16px] md:text-[18px] font-inter font-bold leading-[20px] md:leading-[22px] text-center text-white">
            Providing you with high-impact strategy tools to help you make smarter decisions, faster.
          </p>
        </div>
      </section>
      <section className="mx-4 md:mx-[77px] bg-[#f1f0ff] rounded-[15px] py-[40px] md:py-[52px] px-4 md:px-[60px] my-[40px] md:my-[70px]">
        <div className="text-center mb-[40px] md:mb-[70px]">
          <h2 className="text-[28px] md:text-[38px] font-inter font-extrabold leading-[36px] md:leading-[46px] text-[#2b1983] mb-[18px] md:mb-[24px]">
            How We Can Help
          </h2>
          <p className="text-[16px] md:text-[18px] font-inter font-medium leading-[24px] md:leading-[28px] text-[#2b1983] w-full md:w-[736px] m-auto">
            Whether you're scaling, solving a challenge, or optimizing your approach, our services are built for the real-world demands of external development.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-[24px] md:gap-[32px] justify-center items-stretch">
          {/* Strategic Support Card */}
          <div className="bg-[#4c2594] rounded-[10px] w-full md:w-[302px] pb-8 md:pb-0 md:h-[302] p-[24px] md:p-[32px] flex flex-col items-start shadow-[0_4px_12px_rgba(43,25,131,0.10)] mb-2 md:mb-0 transition-all duration-200 hover:shadow-[0_4px_8px_rgba(100,21,255,0.27)] hover:-translate-y-2">
            <div className="bg-[#36dedb] rounded-[7px] w-[45px] h-[45px] flex items-center justify-center mb-[20px] md:mb-[28px]">
              {/* SVG */}
              {/* ...SVG code unchanged... */}
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="27" viewBox="0 0 30 27" fill="none">
                <g clip-path="url(#clip0_4076_52)">
                  <path d="M29.943 9.98337C29.7531 9.74368 29.4668 9.60661 29.1582 9.60661C29.1559 9.60661 29.1544 9.60661 29.1521 9.60661H15.049C14.7129 9.60799 14.4097 9.74437 14.2597 9.96409C14.1311 10.1514 14.1272 10.3732 14.2474 10.5895C14.249 10.5929 14.4465 10.9346 14.7083 10.9346H24.1106L24.0632 13.638H12.178V11.0964C12.1964 11.0627 12.2262 11.0131 12.2431 10.9904C12.3112 10.9353 12.4973 10.9366 12.6611 10.9373C12.9566 10.9394 13.5683 10.9435 13.6127 10.3408C13.6311 10.0881 13.5163 9.87661 13.2889 9.74437C12.7974 9.45921 11.9001 9.62934 11.5357 9.80498C11.1437 9.9937 10.7058 10.5427 10.7058 10.9952V13.6387H8.51921C8.21374 13.6387 7.65409 14.023 7.53695 14.1512C7.43819 14.2586 7.15262 14.7077 7.15262 14.9219V17.6687H4.90865C4.40718 17.6687 3.59947 18.4285 3.59947 18.9003V21.6471H1.52776C0.805038 21.6471 0.142795 22.3193 0.0547511 22.8972C-0.0317616 23.4655 0.00422156 24.1108 0.0379079 24.7349C0.0677663 25.2742 0.0983902 25.8321 0.0470951 26.3142L0.0455639 26.339C0.0432671 26.6517 0.272181 26.8157 0.423004 26.9245L0.531719 27.003H30.0012V10.0571L29.9445 9.98544L29.943 9.98337ZM8.6731 22.964C9.04135 22.9172 9.27869 22.641 9.25189 22.2918C9.2228 21.9233 8.93264 21.6457 8.57587 21.6457H5.07096V19.078C5.09239 19.0525 5.12072 19.0215 5.14675 18.9939H16.9515V21.6457H10.4669C10.104 21.6457 9.80542 22.0411 9.78934 22.2973C9.77633 22.5039 9.96543 22.7547 10.0588 22.8435C10.1484 22.9289 10.2472 22.9716 10.3521 22.9716H13.3984V25.6751H1.51781V23.0501C1.56528 23.0178 1.64796 22.9785 1.6916 22.9702L8.63023 22.9668L8.6731 22.964ZM20.7213 16.265C20.8507 16.3966 21.0299 16.4668 21.2381 16.4675C21.4609 16.4675 21.6423 16.4083 21.7717 16.2884C22.0014 16.0763 21.9892 15.7553 21.9784 15.4715C21.9723 15.2973 21.9639 15.0865 22.0267 14.9997L25.148 14.9116L25.2468 14.8303C25.3632 14.7352 25.4948 14.6278 25.5293 14.3915C25.6043 13.8839 25.5645 13.2936 25.5255 12.7233C25.4864 12.1509 25.4466 11.56 25.5278 11.0944C25.5392 11.0496 25.6235 10.9594 25.674 10.9346H28.5266V25.6744H14.8691V23.0494C14.9189 23.0171 15.0046 22.9785 15.0429 22.9709C15.4287 22.9179 15.9134 22.9441 16.3827 22.9702C16.8604 22.9964 17.355 23.0233 17.7876 22.9716C18.1175 22.9317 18.3794 22.6968 18.423 22.3992C18.5019 21.8675 18.4666 21.2572 18.4322 20.6677C18.4031 20.158 18.3725 19.6317 18.4184 19.1799C18.4307 19.0621 18.4559 19.0201 18.4651 19.0077C18.6703 18.9574 19.5354 18.9781 20.0583 18.9912C20.5322 19.0029 20.9418 19.0125 21.1554 18.9946C21.3974 18.9746 21.9011 18.9319 21.9746 18.3637C21.9761 18.3548 22.0887 17.4421 21.7763 17.1542C21.5329 16.9304 21.2044 16.8904 20.9181 17.0488C20.6792 17.1818 20.5215 17.4187 20.484 17.6674H8.6241V15.0624C8.64248 15.0335 8.67846 14.9915 8.70832 14.9639H20.5292C20.4748 15.3951 20.4182 15.9564 20.7213 16.2643V16.265Z" fill="#2B1A84" />
                  <path d="M15.2932 5.47783C15.5397 5.66724 15.7748 5.8477 15.9172 5.99717C15.9287 6.24375 15.8498 6.56403 15.7679 6.90153C15.5834 7.65436 15.3545 8.59041 16.1706 9.1001C17.0418 9.64423 17.9039 9.14694 18.5968 8.74745C18.8601 8.59592 19.109 8.45265 19.3333 8.37344C19.4565 8.33005 19.553 8.36862 19.7781 8.48089C19.8271 8.50569 19.8769 8.53048 19.9281 8.55321C20.0728 8.61934 20.2306 8.70681 20.3975 8.7998C20.8346 9.04293 21.3774 9.34462 21.9378 9.34462C22.2257 9.34462 22.5174 9.26472 22.8014 9.05602C23.5525 8.50362 23.319 7.59444 23.1314 6.86365C23.0549 6.56472 22.9814 6.28026 22.9737 6.04538C23.1314 5.86148 23.3779 5.66587 23.6375 5.45992C24.3847 4.86758 25.4075 4.0562 24.4888 3.02166C24.0991 2.58222 23.3328 2.50852 22.5924 2.43758C22.2387 2.40383 21.8743 2.3687 21.6331 2.29293C21.4509 2.07115 21.32 1.79219 21.1814 1.49878C20.9112 0.925714 20.6057 0.276888 19.8294 0.0172194L19.7781 0H19.1212L19.0477 0.0406378C18.9911 0.0716326 18.9275 0.0991837 18.8594 0.128112C18.6963 0.198367 18.5118 0.277577 18.3564 0.436684C18.0999 0.699107 17.9085 1.10411 17.724 1.49533C17.5824 1.79564 17.4354 2.10559 17.2753 2.3136C17.1268 2.3687 16.6491 2.41691 16.3268 2.44929C15.7595 2.50645 15.1722 2.56569 14.853 2.71515C14.2757 2.98584 13.9748 3.60023 14.1203 4.2098C14.2275 4.6575 14.7695 5.07421 15.294 5.47645L15.2932 5.47783ZM22.4852 4.62031C22.1828 4.86551 21.9218 5.07765 21.7993 5.22161C21.3223 5.78158 21.5313 6.57298 21.7151 7.2714C21.7832 7.53038 21.8483 7.77628 21.8697 7.98015C21.8666 7.9898 21.8636 7.99737 21.8613 8.00357C21.8483 8.00219 21.8299 7.99875 21.8054 7.99324C21.5887 7.94089 21.2664 7.75217 20.9548 7.56895C20.6233 7.37403 20.2803 7.17291 19.9756 7.0813C19.6456 6.98212 19.282 6.98212 18.9528 7.0813C18.6236 7.18048 18.276 7.38436 17.9391 7.58204C17.6436 7.75561 17.3381 7.93469 17.113 7.99668C17.0855 8.00426 17.064 8.00839 17.048 8.01115C17.0464 7.99737 17.0457 7.97946 17.0464 7.95673C17.0526 7.7198 17.1299 7.42913 17.211 7.12194C17.3404 6.63497 17.4744 6.13217 17.3726 5.68309C17.2746 5.25054 16.6943 4.80421 16.1331 4.37235C15.9095 4.20084 15.6982 4.0376 15.5734 3.915C15.5681 3.90467 15.5642 3.89571 15.5612 3.88814C15.5811 3.88125 15.6102 3.8723 15.6515 3.86334C15.8567 3.81926 16.1369 3.79309 16.434 3.76554C17.0717 3.70561 17.7301 3.64431 18.1389 3.38602C18.5577 3.12153 18.792 2.61321 19.0186 2.12143C19.148 1.8411 19.2697 1.57592 19.4075 1.40028C19.4259 1.37617 19.442 1.35758 19.455 1.34242C19.5469 1.44092 19.713 1.77222 19.8363 2.0188C20.1211 2.58911 20.4166 3.17801 20.8139 3.41977C21.1585 3.62916 21.8222 3.69666 22.4646 3.76209C22.744 3.79033 23.1444 3.83097 23.3266 3.87849C23.1781 4.0562 22.7356 4.41574 22.4837 4.62031H22.4852Z" fill="#2B1A84" />
                  <path d="M10.3555 5.74972C10.5109 5.78071 10.9549 5.7938 11.3944 5.7938C11.8338 5.7938 12.2626 5.7814 12.4034 5.76074C12.7709 5.70839 13.0358 5.44528 13.0473 5.12086C13.0588 4.80196 12.8215 4.52989 12.4708 4.45826C12.2052 4.40454 10.6234 4.40454 10.3555 4.45826C10.0186 4.52576 9.79199 4.78543 9.79199 5.10364C9.79199 5.42186 10.0186 5.68084 10.3555 5.74903V5.74972Z" fill="#2B1A84" />
                  <path d="M26.4664 4.45022C26.1096 4.50257 25.8615 4.77601 25.8623 5.11558C25.8631 5.44619 26.1127 5.71275 26.4679 5.76303C26.657 5.78989 27.0674 5.80229 27.4754 5.80229C27.8835 5.80229 28.2571 5.79058 28.4439 5.76992C28.5365 5.75959 28.8053 5.69966 28.94 5.54882C29.1062 5.36285 29.1475 5.11627 29.0503 4.88966C28.9507 4.65754 28.7203 4.48948 28.4485 4.45022C28.1109 4.40201 26.7956 4.40201 26.4664 4.45022Z" fill="#2B1A84" />
                  <path d="M25.3102 8.65339C25.5093 8.78288 26.7342 9.30084 26.9593 9.36008C27.0772 9.39107 27.1821 9.40416 27.2748 9.40416C27.4998 9.40416 27.6553 9.32839 27.7556 9.25125C27.9263 9.1197 28.0143 8.94681 28.0028 8.76429C27.9891 8.54044 27.8214 8.3097 27.5557 8.14783C27.3835 8.04245 26.1409 7.49625 25.9334 7.45699C25.5384 7.38123 25.1732 7.53069 25.0254 7.82962C24.883 8.11822 24.9971 8.44952 25.3102 8.65339Z" fill="#2B1A84" />
                  <path d="M25.7025 2.78103C25.7829 2.78103 25.8656 2.7707 25.9498 2.75073L25.9766 2.74384L27.726 1.98825L27.7574 1.96346C27.9335 1.82432 28.0162 1.60529 27.9787 1.37731C27.9412 1.15001 27.7942 0.963354 27.5844 0.877257C27.1694 0.70713 26.5715 0.99366 25.9935 1.27055C25.7554 1.38488 25.5088 1.50267 25.3787 1.53228L25.3021 1.5495L25.244 1.59841C24.963 1.83603 24.8879 2.17973 25.0579 2.45386C25.1881 2.66394 25.4269 2.78103 25.701 2.78103H25.7025Z" fill="#2B1A84" />
                  <path d="M11.281 2.04979C11.4395 2.14278 12.7724 2.71653 13.0021 2.75579C13.0671 2.76681 13.1307 2.77232 13.1927 2.77232C13.5097 2.77232 13.7792 2.63112 13.8917 2.3928C14.0287 2.10421 13.8978 1.77635 13.5571 1.55801C13.3703 1.43816 12.1836 0.91469 11.9494 0.860276C11.8085 0.827215 11.6493 0.802419 11.4425 0.844435C11.3047 0.872674 11.1815 0.938108 11.0957 1.02765L11.0774 1.049C10.9487 1.21431 10.9013 1.40992 10.9418 1.60002C10.9817 1.78461 11.1019 1.94441 11.281 2.0491V2.04979Z" fill="#2B1A84" />
                  <path d="M13.0004 7.4555L12.9391 7.46652L12.887 7.4982C12.7316 7.59394 12.4445 7.69657 12.1666 7.79575C11.7593 7.94109 11.375 8.07746 11.1514 8.26412C10.9187 8.45767 10.859 8.77037 11.0014 9.04244C11.1246 9.27731 11.3704 9.41851 11.6445 9.41851C11.6774 9.41851 11.7103 9.41644 11.744 9.41231L11.7907 9.4068L13.717 8.59267L13.7629 8.53825C13.9757 8.28547 14.0041 7.98035 13.8387 7.74203C13.6718 7.50234 13.3502 7.39213 13.0011 7.45481L13.0004 7.4555Z" fill="#2B1A84" />
                </g>
                <defs>
                  <clipPath id="clip0_4076_52">
                    <rect width="30" height="27" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h3 className="text-[16px] md:text-[18px] font-inter font-extrabold leading-[20px] md:leading-[22px] text-white mb-[12px] md:mb-[18px]">
              Strategic Support
            </h3>
            <div className="text-[14px] md:text-[15px] font-inter font-normal leading-[22px] md:leading-[28px] text-white space-y-1">
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Problem Solving</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Providing Industry Insights</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Strategic Planning</p>
            </div>
          </div>
          {/* Operational Help Card */}
          <div className="bg-[#4c2594] rounded-[10px] w-full md:w-[302px] pb-8 md:pb-0 md:h-[302px] p-[24px] md:p-[32px] flex flex-col items-start shadow-[0_4px_12px_rgba(43,25,131,0.10)] mb-2 md:mb-0 transition-all duration-200 hover:shadow-[0_4px_8px_rgba(100,21,255,0.27)] hover:-translate-y-2">
            <div className="bg-[#36dedb] rounded-[7px] w-[45px] h-[45px] flex items-center justify-center mb-[20px] md:mb-[28px]">
              {/* SVG */}
              {/* ...SVG code unchanged... */}
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="25" viewBox="0 0 28 25" fill="none">
                <g clip-path="url(#clip0_4076_48)">
                  <path d="M28 0.78125C28 0.351563 27.6063 0 27.125 0C23.0169 0 19.1188 1.23828 15.9688 3.51563H12.2807C10.0538 3.51563 7.95816 4.28906 6.38316 5.69922C6.04191 6.00391 6.04191 6.5 6.38316 6.80469L9.26629 9.37891L7.25816 11.1719C6.91691 11.4766 6.91691 11.9727 7.25816 12.2773L8.39129 13.2891L6.87754 14.6406C6.65004 13.7852 6.13816 13.0117 5.39879 12.4258C5.59129 11.9531 5.69629 11.4492 5.69629 10.9414C5.69629 8.57031 3.53504 6.64453 0.883789 6.64453C0.402539 6.64453 0.00878906 6.99609 0.00878906 7.42578V24.2227C0.00878906 24.6523 0.402539 25.0039 0.883789 25.0039H19.6963C20.1775 25.0039 20.5713 24.6523 20.5713 24.2227C20.5713 21.8555 18.41 19.9258 15.7588 19.9258C15.3038 19.9258 14.8575 19.9805 14.4332 20.0938C13.7025 19.4062 12.7357 18.9531 11.69 18.8086L13.1338 17.5195L14.2669 18.5312C14.4375 18.6836 14.6607 18.7617 14.8838 18.7617C15.1069 18.7617 15.33 18.6875 15.5007 18.5312L17.5088 16.7383L20.3919 19.3125C20.5625 19.4648 20.7857 19.543 21.0088 19.543C21.2319 19.543 21.455 19.4688 21.6257 19.3125C23.2007 17.9062 24.0713 16.0352 24.0713 14.043V10.75C26.6219 7.9375 28.0088 4.46094 28.0088 0.789063L28 0.78125ZM8.61879 19.3242C8.31691 19.5938 8.27754 20.0195 8.52691 20.332C8.77629 20.6406 9.23566 20.7461 9.62066 20.582C10.0232 20.4063 10.465 20.3164 10.9332 20.3164C11.9219 20.3164 12.8538 20.7461 13.4269 21.4688C13.6719 21.7734 14.1225 21.8828 14.5032 21.7266C14.8925 21.5703 15.3082 21.4883 15.7457 21.4883C17.1325 21.4883 18.305 22.3125 18.6813 23.4414H1.75004V8.31641C3.01441 8.65234 3.93754 9.69922 3.93754 10.9375C3.93754 11.4063 3.80191 11.8711 3.54379 12.2813C3.31629 12.6445 3.44316 13.1016 3.83691 13.3242C4.72066 13.8281 5.25004 14.6875 5.25004 15.625C5.25004 15.8633 5.21504 16.0977 5.14941 16.3242C5.04879 16.6641 5.21941 17.0234 5.56066 17.1992C5.90191 17.375 6.33504 17.3242 6.61504 17.0742L9.62504 14.3867L11.8869 16.4063L8.61879 19.3242ZM17.5 14.5195L11.7382 9.375L15.7938 5.75391C17.2244 4.47656 18.8782 3.47266 20.6719 2.76953L24.8982 6.54297C24.1063 8.14844 22.9819 9.625 21.5513 10.8984L17.4957 14.5195H17.5ZM25.5675 4.92578L22.4832 2.17188C23.6907 1.84766 24.9419 1.64844 26.2282 1.58594C26.1582 2.73047 25.935 3.85156 25.5719 4.92969L25.5675 4.92578ZM12.2807 5.07813H14.0744L10.5 8.26953L8.27754 6.28516C9.41941 5.5 10.815 5.07813 12.2807 5.07813ZM14.875 16.8633L9.11316 11.7188L10.5 10.4805L16.2619 15.625L14.875 16.8633ZM20.9607 17.6094L18.7382 15.625L22.3125 12.4336V14.0352C22.3125 15.3438 21.8357 16.5898 20.9607 17.6094Z" fill="#2B1A84" />
                  <path d="M18.8125 5.85938C17.3644 5.85938 16.1875 6.91016 16.1875 8.20312C16.1875 9.49609 17.3644 10.5469 18.8125 10.5469C20.2606 10.5469 21.4375 9.49609 21.4375 8.20312C21.4375 6.91016 20.2606 5.85938 18.8125 5.85938ZM18.8125 8.98438C18.3312 8.98438 17.9375 8.63281 17.9375 8.20312C17.9375 7.77344 18.3312 7.42188 18.8125 7.42188C19.2938 7.42188 19.6875 7.77344 19.6875 8.20312C19.6875 8.63281 19.2938 8.98438 18.8125 8.98438Z" fill="#2B1A84" />
                </g>
                <defs>
                  <clipPath id="clip0_4076_48">
                    <rect width="28" height="25" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h3 className="text-[16px] md:text-[18px] font-inter font-extrabold leading-[20px] md:leading-[22px] text-white mb-[12px] md:mb-[18px]">
              Operational Help
            </h3>
            <div className="text-[14px] md:text-[15px] font-inter font-normal leading-[22px] md:leading-[28px] text-white space-y-1">
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Documentation</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Service Provider Shortlisting</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Service Provider Analysis</p>
            </div>
          </div>
          {/* People and Process Card */}
          <div className="bg-[#4c2594] rounded-[10px] w-full md:w-[302px] pb-8 md:pb-0 md:h-[302px] p-[24px] md:p-[32px] flex flex-col items-start shadow-[0_4px_12px_rgba(43,25,131,0.10)] transition-all duration-200 hover:shadow-[0_4px_8px_rgba(100,21,255,0.27)] hover:-translate-y-2">
            <div className="bg-[#36dedb] rounded-[7px] w-[45px] h-[45px] flex items-center justify-center mb-[20px] md:mb-[28px]">
              {/* SVG */}
              {/* ...SVG code unchanged... */}
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                <g clip-path="url(#clip0_4076_42)">
                  <path d="M15.7113 1.95458L13.9983 0L12.2886 1.95122L10.5788 0L8.28809 2.61733L9.45016 3.65013L9.90097 3.13204L10.5788 2.35828L11.2567 3.13204L12.2886 4.31287L13.3237 3.13204L13.9983 2.35828L14.6762 3.13204L15.7113 4.31287L16.7432 3.13204L17.4211 2.35828L18.0989 3.13204L18.5497 3.65013L19.7118 2.61733L17.4211 0L15.7113 1.95458Z" fill="#2B1A84" />
                  <path d="M7.42326 27.9993H20.5767C24.6707 27.9993 28 24.6452 28 20.5207C28 17.2979 25.963 14.5426 23.1213 13.4964V7.9152C23.9695 7.5956 24.5772 6.77474 24.5772 5.80922C24.5772 4.56785 23.5754 3.55859 22.3432 3.55859C21.111 3.55859 20.1126 4.56785 20.1126 5.80922C20.1126 6.77474 20.7203 7.59896 21.5685 7.9152V13.1128C21.2446 13.0691 20.9107 13.0422 20.5734 13.0422H7.42326C7.08599 13.0422 6.7554 13.0657 6.42815 13.1128V7.9152C7.27633 7.5956 7.88408 6.77474 7.88408 5.80922C7.88408 4.56785 6.88229 3.55859 5.65343 3.55859C4.42457 3.55859 3.41944 4.56785 3.41944 5.80922C3.41944 6.77474 4.02719 7.59896 4.87537 7.9152V13.4964C2.03363 14.5426 0 17.2979 0 20.5207C0 24.6452 3.32928 27.9993 7.42326 27.9993ZM22.3466 5.11957C22.7239 5.11957 23.0278 5.42907 23.0278 5.80922C23.0278 6.18938 22.7206 6.49888 22.3466 6.49888C21.9726 6.49888 21.6654 6.18938 21.6654 5.81259C21.6654 5.4358 21.9726 5.12293 22.3466 5.12293V5.11957ZM5.65343 5.11957C6.03077 5.11957 6.33464 5.42907 6.33464 5.80922C6.33464 6.18938 6.02743 6.49888 5.65343 6.49888C5.27943 6.49888 4.96887 6.18938 4.96887 5.81259C4.96887 5.4358 5.27609 5.12293 5.65343 5.12293V5.11957ZM7.42326 15.2289H20.5767C23.4719 15.2289 25.8261 17.6006 25.8261 20.5207C25.8261 23.4408 23.4719 25.8092 20.5767 25.8092H7.42326C4.52809 25.8092 2.17054 23.4375 2.17054 20.5207C2.17054 17.604 4.52475 15.2289 7.42326 15.2289Z" fill="#2B1A84" />
                  <path d="M20.9577 24.0976C21.1447 24.0976 21.3317 24.0842 21.522 24.0505C23.4288 23.7377 24.7311 21.9177 24.4205 19.9967C24.2703 19.0648 23.7694 18.2507 23.008 17.699C22.2466 17.1473 21.3217 16.9286 20.3967 17.08C19.4717 17.2314 18.6636 17.736 18.1159 18.503C17.5683 19.27 17.3512 20.2053 17.5015 21.1338C17.782 22.8663 19.2713 24.0976 20.961 24.0976H20.9577ZM20.6605 18.6981C20.7607 18.6813 20.8642 18.6746 20.9644 18.6746C21.8693 18.6746 22.6674 19.334 22.8177 20.2625C22.9846 21.2919 22.2867 22.2675 21.2649 22.4324C20.2431 22.5972 19.2747 21.8975 19.111 20.868C18.9441 19.8386 19.642 18.8663 20.6638 18.6981H20.6605Z" fill="#2B1A84" />
                  <path d="M4.99193 23.3445C5.59634 23.7818 6.30427 24.0106 7.03224 24.0106C7.22258 24.0106 7.41292 23.9938 7.60326 23.9635C8.52824 23.8121 9.33635 23.3075 9.88399 22.5405C10.4316 21.7734 10.6487 20.8416 10.4984 19.9097C10.1879 17.9854 8.38131 16.6767 6.47457 16.9896C4.56783 17.3024 3.26551 19.1225 3.57606 21.0434C3.72633 21.9753 4.22723 22.7928 4.98859 23.3411L4.99193 23.3445ZM6.73838 18.6111C6.83856 18.5943 6.94207 18.5876 7.04225 18.5876C7.9472 18.5876 8.74529 19.2469 8.89556 20.1755C9.06253 21.2049 8.36461 22.1805 7.34279 22.3453C6.84857 22.4261 6.35102 22.3083 5.94362 22.0123C5.53623 21.7162 5.26909 21.2789 5.18894 20.781C5.02198 19.7516 5.71655 18.7793 6.73838 18.6111Z" fill="#2B1A84" />
                </g>
                <defs>
                  <clipPath id="clip0_4076_42">
                    <rect width="28" height="28" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h3 className="text-[16px] md:text-[18px] font-inter font-extrabold leading-[20px] md:leading-[22px] text-white mb-[12px] md:mb-[18px]">
              People and Process
            </h3>
            <div className="text-[14px] md:text-[15px] font-inter font-normal leading-[22px] md:leading-[28px] text-white space-y-1">
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Coaching & Training</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Conflict Resolution</p>
              <p className="hover:text-[#36dedb] transition-all duration-200 hover:translate-x-2"><span className="font-bold">→</span> Mediation</p>
            </div>
          </div>
        </div>
      </section>
      <section
        className="w-full min-h-[900px] md:h-[798px] py-[40px] md:py-0"
        style={{
          background:
            "linear-gradient(187deg, #4c2594 0%, #5b18ea 50%, #bf5af3 100%)",
        }}
      >
        <div className="pt-[36px] md:pt-[66px] pb-[36px] md:pb-[65px] text-center">
          <h2 className="text-[28px] md:text-[38px] font-inter font-extrabold leading-[38px] md:leading-[55px] text-center text-white mb-[15px] w-full max-w-[630px] mx-auto">
            Hit the Ground Running with Our Most Popular Solutions.
          </h2>
          <div className="flex flex-col md:flex-row flex-wrap gap-[36px] md:gap-[54px] mt-[45px] md:mt-[85px] justify-center items-stretch min-w-0">
            {/* Card 1 */}
            <div className="relative w-full max-w-[615px] md:max-w-[615px] h-auto md:h-[527px] flex items-center justify-center min-w-0 md:px-0 px-4 transition-all duration-200 hover:-translate-y-2">
              <div className="absolute top-[-7px] md:top-[7px] left-1/2 transform -translate-x-1/2">
                <img
                  src="/XDS_30_Consulting.png"
                  alt="External dev coaching"
                  className="w-[100px] h-[85px] md:w-[141px] md:h-[119px]"
                />
              </div>
              <div className="bg-white rounded-[10px] w-full max-w-[607px] h-auto md:h-[465px] mt-[42px] md:mt-[62px] p-[24px] md:p-[60px] flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]">
                <div>
                  <p className="text-[13px] md:text-[15px] font-inter font-bold leading-[19px] text-center text-[#bf5af3] mb-[24px] md:mb-[40px] mt-[20px]">
                    DEVELOPERS + SERVICE PROVIDERS
                  </p>
                  <h3 className="text-[22px] md:text-[35px] font-inter font-extrabold leading-[28px] md:leading-[43px] text-center text-[#2b1983] mb-[10px] md:mb-[14px]">
                    External Dev Coaching
                  </h3>
                  <p className="text-[16px] md:text-[20px] font-inter font-bold leading-[22px] md:leading-[25px] text-center text-[#bf5af3] mb-[12px] md:mb-[17px]">
                    Achieve your external development goals faster.
                  </p>
                  <p className="text-[14px] md:text-[16px] font-inter font-normal leading-[20px] md:leading-[24px] text-center text-[#4d2e8f] mb-[18px] md:mb-[34px]">
                    Receive personalized support that adapts to your schedule and urgent needs. Our coaches help you brainstorm, problem-solve, and move forward with clarity.
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px] w-full md:w-[250px] flex items-center justify-center cursor-pointer mx-auto hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)] transition-all duration-200 "
                  aria-label="Explore external dev coaching"
                  onClick={() => setShowPopup(true)}
                >
                  <span className="text-[13px] md:text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                    EXPLORE MORE ⟶
                  </span>
                </button>
              </div>
            </div>
            {/* Card 2 */}
            <div className="relative w-full max-w-[615px] md:max-w-[607px] h-auto md:h-[527px] flex items-end justify-center min-w-0 md:px-0 px-4 transition-all duration-200 hover:-translate-y-2">
              <div className="absolute top-[-7px] md:top-[6px] left-1/2 transform -translate-x-1/2">
                <img
                  src="/XDS_33_Recruitment.png"
                  alt="Rate my pitch"
                  className="w-[100px] h-[85px] md:w-[141px] md:h-[119px]"
                />
              </div>
              <div className="bg-white rounded-[10px] w-full max-w-[607px] h-auto md:h-[465px] mt-[42px] md:mt-[62px] p-[24px] md:p-[60px] flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]">
                <div>
                  <p className="text-[13px] md:text-[15px] font-inter font-bold leading-[19px] text-center text-[#bf5af3] mb-[24px] md:mb-[40px]  mt-[10px]">
                    SERVICE PROVIDERS
                  </p>
                  <h3 className="text-[22px] md:text-[35px] font-inter font-extrabold leading-[28px] md:leading-[43px] text-center text-[#2b1983] mb-[12px] md:mb-[18px]">
                    Rate My Pitch
                  </h3>
                  <p className="text-[16px] md:text-[20px] font-inter font-bold leading-[22px] md:leading-[25px] text-center text-[#bf5af3] mb-[12px] md:mb-[17px]">
                    Make a lasting impression on potential partners.
                  </p>
                  <p className="text-[14px] md:text-[16px] font-inter font-normal leading-[20px] md:leading-[24px] text-center text-[#4d2e8f] mb-[18px] md:mb-[34px] w-[100%] md:w-[400px] mx-auto">
                    Get constructive feedback, reporting, and actionable insights on your company's pitch to help refine your message and delivery.
                  </p>
                </div>
                <button
                  type="button"
                  className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px] w-full md:w-[250px] flex items-center justify-center cursor-pointer  mx-auto transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
                  aria-label="Improve my pitch"
                  onClick={() => setShowPopup(true)}
                >
                  <span className="text-[13px] md:text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                    IMPROVE MY PITCH ⟶
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bg-[#f1f0ff] min-h-[865px] w-full flex flex-col md:flex-row items-center justify-center py-[40px] px-4 md:px-0">
        {/* Left Content */}
        <div className="md:pt-[40px] md:pt-[60px] px-0 md:pl-[40px] md:pr-[20px] w-full md:w-[500px] max-w-[520px] flex-shrink-0">
          <h2 className="text-[26px] md:text-[32px] font-inter font-extrabold leading-[34px] md:leading-[44px] text-left text-[#2b1983] mb-[18px]">
            Let's Talk About Your Next Steps
          </h2>
          <p className="text-[15px] md:text-[16px] font-inter leading-[24px] md:leading-[26px] text-left text-[#4d2e8f] mb-[32px] md:mb-[40px]">
            <span>Book a</span> <span className="font-bold text-[#2B1A84]">free consultation</span> to discuss your challenges and goals. We'll provide actionable insights and a clear roadmap for success.
          </p>
          <p className="text-[15px] md:text-[16px] font-inter font-semibold leading-[20px] text-left text-[#4d2e8f] mb-[16px] md:mb-[20px]">
            What you can expect from your consultation:
          </p>
          <div className="text-[15px] md:text-[16px] font-inter font-normal leading-[24px] md:leading-[28px] text-left text-[#2b1983] space-y-3 mb-[24px] md:mb-[32px]">
            <p className="flex"><span className="font-semibold mr-2 shrink-0">
              <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#2B1A84" />
              </svg>
            </span> Confidential, focused conversation about your needs</p>
            <hr className="border-t border-[#bf5af3] my-4 md:my-8 ml-0" />
            <p className="flex"><span className="font-semibold mr-2 shrink-0"> <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#2B1A84" />
            </svg></span> Clear, honest insights tailored to your goals</p>
            <hr className="border-t border-[#bf5af3] my-4 md:my-8 ml-0" />
            <p className="flex"><span className="font-semibold mr-2 shrink-0"> <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#2B1A84" />
            </svg></span> Immediate, actionable next steps</p>
            <hr className="bord er-t border-[#bf5af3] my-4 md:my-8 ml-0" />
            <p className="flex"><span className="font-semibold mr-2 shrink-0"> <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#2B1A84" />
            </svg></span> Access to decades of combined industry experience</p>
            <hr className="border-t border-[#bf5af3] my-4 md:my-8 ml-0" />
            <p className="flex"><span className="font-semibold mr-2 shrink-0"> <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#2B1A84" />
            </svg></span> No-pressure, value-first experience</p>
            <hr className="border-t border-[#bf5af3] my-4 md:my-8 ml-0" />
          </div>
        </div>

        {/* Right Form */}
        <div className="bg-white rounded-[16px] w-full max-w-[540px]  flex flex-col justify-center shadow-lg p-[20px] md:p-[32px] mt-8 md:mt-0 md:ml-[40px]">
          <h3 className="text-[18px] md:text-[21px] font-inter font-bold leading-[22px] md:leading-[26px] text-left text-[#9b53d2] mb-[24px] md:mb-[32px]">
            Schedule Your Free Consultation
          </h3>
          <form
            onSubmit={handleSubmitPrimary(onSubmit)}
            className="space-y-4 md:space-y-6"
          >
            {/* Name Fields */}
            <div className="flex flex-col md:flex-row gap-[12px]">
              <div className="flex-1">
                <label className="text-[13px] md:text-[14px] font-inter font-bold leading-[17px] text-left text-[#4c2594] block mb-2">
                  First Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  autoComplete="off"
                  type="text"
                  id="FirstName"
                  {...registerPrimary("firstName", {
                    required: {
                      value: true,
                      message: "First Name required",
                    },
                  })}
                  className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                />
                <p className="text-red-600 text-xs pt-1">
                  {typeof errorsPrimary?.firstName?.message === "string" &&
                    errorsPrimary?.firstName?.message}
                </p>
              </div>
              <div className="flex-1 mt-4 md:mt-0">
                <label className="text-[13px] md:text-[14px] font-inter font-bold leading-[17px] text-left text-[#4c2594] block mb-2">
                  Last Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  id="LastName"
                  {...registerPrimary("lastName", {
                    required: 'Last Name required'
                  })}
                  autoComplete="off"
                  className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
                />
                <p className="text-red-600 text-xs pt-1">
                  {typeof errorsPrimary?.lastName?.message === "string" &&
                    errorsPrimary?.lastName?.message}
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[13px] md:text-[14px] font-inter font-bold leading-[17px] text-left text-[#4c2594] block mb-2">
                Email Address <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                autoComplete="off"
                id="Email"
                {...registerPrimary("email", {
                  required: 'Email required'
                })}
                className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
              />
              <p className="text-red-600 text-xs pt-1">
                {typeof errorsPrimary?.email?.message === "string" &&
                  errorsPrimary?.email?.message}
              </p>
            </div>

            {/* Company */}
            <div>
              <label className="text-[13px] md:text-[14px] font-inter font-bold leading-[17px] text-left text-[#4c2594] block mb-2">
                Company <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                autoComplete="off"
                id="Company"
                {...registerPrimary("company", {
                  required: 'Company required'
                })}
                className="mt-1 w-full rounded-md border-gray-200 bg-white text-sm default_text_color shadow-sm"
              />
              <p className="text-red-600 text-xs pt-1">
                {typeof errorsPrimary?.company?.message === "string" &&
                  errorsPrimary?.company?.message}
              </p>
            </div>

            {/* Challenge */}
            <div>
              <label className="text-[13px] md:text-[14px] font-inter font-bold leading-[17px] text-left text-[#4c2594] block mb-2">
                Tell us about your challenge <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                id="message"
                autoComplete="off"
                className="mt-2 w-full rounded-lg border-gray-200 align-top shadow-sm sm:text-sm placeholder-[#AAABAD]"
                rows={4}
                placeholder="What specific business challenge would you like help with?"
                {...registerPrimary("message", {
                  required: 'Message required'
                })}
              ></textarea>
              <p className="text-red-600 text-xs pt-1">
                {typeof errorsPrimary?.message?.message === "string" &&
                  errorsPrimary?.message?.message}
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex flex-row items-center mt-4 justify-center">
              <button
                type="submit"
                className="bg-[#bf5af3] rounded-[28px] h-[48px] w-full md:w-[302px] flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
                aria-label="Book free consultation"
              >
                <span className="text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                  {loader ? <div role="status">
                    <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                    </svg>
                    <span className="sr-only">Loading...</span>
                  </div> : 'BOOK FREE CONSULTATION'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </section>
      <section className="relative w-full py-[60px] md:py-[80px] bg-gradient-to-b from-[#4c2594] via-[#5b18ea] to-[#bf5af3]" id="carlarylance">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6">
          <div className="text-center mb-[48px] md:mb-[80px]">
            <h2 className="text-[28px] md:text-[38px] font-inter font-bold leading-[34px] md:leading-[46px] text-white mb-[12px] md:mb-[18px]">
              Meet Our Business Solutions Leader
            </h2>
            <span className="block text-[16px] md:text-[19px] font-inter font-bold leading-[28px] md:leading-[35px] text-white">
              Led by Experience. Driven by Insight.
            </span>
          </div>
          {/* Carla Profile */}
          <div className="flex flex-col md:flex-row gap-[36px] md:gap-[75px] items-center md:items-start mb-[60px] md:mb-[100px] justify-center">
            {/* Left Content */}
            <div className="w-full md:w-[55%] max-w-[604px]">
              <div className="mb-[32px] md:mb-[48px]">
                <h3 className="text-[20px] md:text-[28px] font-inter font-bold leading-[28px] md:leading-[34px] text-left text-white mb-[16px] md:mb-[24px]">
                  Carla Rylance, <span className="text-[13px] md:text-[15px] font-normal block">Head of Spark Business Solutions</span>
                </h3>
                <p className="text-[14px] md:text-[15px] font-inter font-normal leading-[20px] md:leading-[21px] text-left text-white">
                  Carla Rylance is a seasoned video games professional with over 20 years of industry experience. Since 2009, she has played a <span className="font-semibold">key role in external development</span> through leadership and management positions at <span className="font-semibold">Xbox, Electronic Arts</span>, and <span className="font-semibold">Behaviour Interactive</span>.<br /><br />
                  Passionate about building strong relationships and streamlining processes, Carla is excited to bring fresh insights and added value to the external development community through her work at XDS Spark.
                </p>
              </div>
              {/* Achievements */}
              <div className="border border-[#f7f7f7] rounded-[10px] p-[16px] md:p-[24px] bg-[#ffffff14]">
                <div className="text-[14px] md:text-[15px] font-inter  leading-[22px] md:leading-[24px] text-left text-white space-y-3">
                  <div><span className="font-bold">CO-AUTHOR:</span> XDS Industry Insight Report (2019 &amp; 2025)</div>
                  <div><span className="font-bold">CHAIR:</span> XDS Advisory Committee, DEI Sub-Committee Lead</div>
                  <div><span className="font-bold">AWARDS:</span> XDS Unsung Hero for co-founding Women@XDS, XDS Top Voted Presentation</div>
                </div>
              </div>
            </div>
            {/* Right Image */}
            <div className="w-full md:w-[45%] max-w-[435px] flex flex-col items-center">
              <img
                src="/xds-at-google-20250317-144 1.png"
                alt="Carla Rylance at XDS Google event"
                className="w-[350px] h-[200px] md:w-[320px] md:h-[272px] lg:w-[435px] lg:h-[369px] rounded-[11px] object-cover mb-[24px] md:mb-[32px]"
              />
              <a
                href="https://www.linkedin.com/in/carlarylance/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px]  md:w-[260px] lg:w-[330px] flex items-center justify-center cursor-pointer px-6 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
                aria-label="Follow Carla on LinkedIn"
              >
                <span className="text-[13px] md:text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                  Follow Carla on LinkedIn ⟶
                </span>
              </a>
            </div>
          </div>
          {/* Testimonial */}
          {/* <div className="flex flex-col md:flex-row md:gap-[120px] items-center md:items-start justify-center">
            <div className="relative w-full md:w-[320px] lg:w-[491px] h-full md:h-[180px] lg:h-[277px] flex-shrink-0 mb-8 md:mb-0">
              <img
                src="/roblox.png"
                alt="Roblox logo"
                className="object-contain rounded-[10px] w-full h-full max-h-[277px] mt-[-20px] md:mt-[-60px]"
              />
            </div>
            <div className="w-full md:w-[60%] lg:w-[477px]">
              <p className="text-[14px] md:text-[15px] font-inter font-normal leading-[20px] md:leading-[21px] text-left text-white">
                "Carla <span className="font-bold">up-leveled the discipline of co-dev</span> at EA with her rare knack for making <span className="font-bold">data backed decisions</span> that originate from <span className="font-bold">excellent intuition</span>.<br /><br />
                Her years of production experience working on <span className="font-bold">diverse projects and genres</span> enables breadth of experience to apply to any challenge faced by a game team and their external partners."<br /><br />
                <span className="font-semibold">Lauren Freeman, Head of Developer Feedback, Roblox</span>
              </p>
            </div>
          </div> */}
          <div className="mx-[1.5rem]">
          <TestimonialWidget page={'business-page'}/>
          </div>
        </div>
      </section>
      <section
        className="w-full py-[60px] md:py-[84px]"
        style={{
          background: "linear-gradient(217deg, #4C2594 8.97%, #541EC2 32.61%, #5B18EA 52.87%, #8C38EE 74.4%, #BF5AF3 96.77%)",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex flex-col items-center">
          <h2 className="text-[28px] md:text-[38px] font-inter font-extrabold leading-[36px] md:leading-[46px] text-center text-white mb-[24px] md:mb-[30px]">
            Why Choose XDS Spark
          </h2>
          <p className="text-[16px] md:text-[18px] font-inter font-normal leading-[24px] md:leading-[28px] text-center text-white mb-[28px] md:mb-[40px] max-w-full md:max-w-[698px]">
            We understand the realities of external development—because we've lived them. Our team brings over 50 years of combined industry experience, with deep expertise in scaling, optimizing, and navigating complex partnerships.
          </p>

          {/* Benefits List */}
          <div className="text-[16px] md:text-[19px] font-inter leading-[26px] md:leading-[30px] text-center text-white mb-[36px] md:mb-[67px]">
            <p className="font-bold mb-[18px] md:mb-[35px]">Trusted. Practical. Ready when you are.</p>
            <p className="text-[15px] md:text-[18px] leading-[28px] md:leading-[35px]">
              <span className="font-black mr-1"><svg width="18" height="14" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#ffffff"></path></svg></span> Real-world knowledge of external development
            </p>
            <p className="text-[15px] md:text-[18px] leading-[28px] md:leading-[35px]">
              <span className="font-black mr-1"><svg width="18" height="14" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#ffffff"></path></svg></span> Flexible support tailored to your challenges
            </p>
            <p className="text-[15px] md:text-[18px] leading-[28px] md:leading-[35px]">
              <span className="font-black mr-1"><svg width="18" height="14" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0.602051 4.9943L1.95432 3.62498L4.71001 6.33521L10.6702 0.397705L12.0339 1.76702L4.71001 9.06248L0.602051 4.9943Z" fill="#ffffff"></path></svg></span> Proven strategies for scaling with confidence.
            </p>
          </div>

          <p className="text-[16px] md:text-[19px] font-inter font-bold leading-[20px] md:leading-[23px] text-center text-white mb-[24px] md:mb-[39px]">
            Let's talk about what's next for you.
          </p>

          <button
            type="button"
            onClick={() => setShowPopup(true)}
            className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px] w-full max-w-[330px] flex items-center justify-center cursor-pointer  mx-auto mb-[36px] md:mb-[108px] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"

            aria-label="Book a free consultation"
          >
            <span className="text-[13px] md:text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
              BOOK A FREE CONSULTATION ⟶
            </span>
          </button>

          {/* CTA Card */}
          <div className="bg-[rgba(91, 24, 234, 0.16)] rounded-[10px] w-full max-w-[539px] h-auto md:h-[233px] mx-auto p-[24px] md:p-[43px]  flex flex-col items-center justify-center border">
            <h3 className="text-[16px] md:text-[19px] font-bold leading-[24px] md:leading-[26px] text-center text-[#fff] mb-[18px] md:mb-[30px]">
              Have questions? <br />  We're here to talk it through.
            </h3>
            <a
              href="mailto:info@xds-spark.com?subject=Business%20Solutions%20Inquiry"
              className="bg-[#bf5af3] rounded-[28px] h-[48px] md:h-[56px] w-full max-w-[225px] flex items-center justify-center cursor-pointer mx-auto transition-all duration-200 hover:shadow-[0_4px_20px_rgba(28,17,83,0.67)]"
              aria-label="Get in touch"
            >
              <span className="text-[13px] md:text-[14px] font-inter font-extrabold leading-[17px] text-center uppercase text-[#f7f7f7]">
                GET IN TOUCH ⟶
              </span>
            </a>
          </div>
        </div>
      </section>
      {thnksPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-[90%] max-w-md rounded-xl bg-white p-10 text-center shadow-lg">
            <button
              className="absolute right-3 top-3 text-gray-400 hover:text-black text-xl"
              onClick={() => setThanksPopup(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-purple-800 mb-6">Thanks for your interest!</h2>
            <p className="text-gray-700 mb-6">
              We’ll review your submission and get back to you within one business day.
            </p>
            <p className="mt-6 text-sm">
              Questions? <br />
              Reach out to:{" "}
              <a href="mailto:carla@xds-spark.com" className="text-purple-600 font-semibold">
                carla@xds-spark.com
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default BusinessSolutions;
