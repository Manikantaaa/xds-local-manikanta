"use client";

import useFormRegister from "@/hooks/useFormRegister";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { RegisterFormData } from "@/types/register-form.type";
import React, { useEffect, useState } from "react";
import { sanitizeData } from "@/services/sanitizedata";
import { Tooltip } from "flowbite-react";
import { fetcher } from "@/hooks/fetcher";
import { USER_TYPE } from "@/types/user.type";
import { createAuthenticationJwtToken } from "@/constants/serviceColors";
import { decodeMailcheckResponse } from "@/services/common-methods";
import HeaderStatic from "./header-static";

const RegistrationForm = (props: { type: USER_TYPE }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm();
  const [mailError, setMailError] = useState<string>("");
  const [firstNameError, setFirstNameError] = useState<string>("");
  const [lastNameError, setLastNameError] = useState<string>("");
  const [jwtToken, setjwtToken] = useState<string>("");
  const watchFirstname = watch("firstName", "");
  const watchLastname = watch("lastName", "");
  const { isLoading, error, success, submitForm } =
    useFormRegister<RegisterFormData>({
      url: getEndpointUrl(ENDPOINTS.register),
    });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const checkMail = async (e: any) => {
    setMailError("");
    const email = e.target.value.toLowerCase();
    const pattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    const mailFormatCheck = pattern.test(email);
    if (mailFormatCheck) {
      const data = await fetcher(
        getEndpointUrl(ENDPOINTS.checkExistedMails(email)),
      );
      const isMail = decodeMailcheckResponse(data);
      if (isMail) {
        setMailError(
          "The email address cannot be used at this time. Please check the address and try again.",
        );
      } else {
        setMailError("");
      }
      console.log(data);
    }
  };

  // useEffect(() => {
  //   if(isValid) {
  //     setjwtToken(createAuthenticationJwtToken());
  //   }
  // }, [isValid]);

  const onSubmit = ((data: RegisterFormData) => {
    data.email = data.email.trim().toLowerCase();
    data.userType = props.type;
    // data.token = jwtToken;
    data = sanitizeData(data);
    submitForm(data);
  }) as SubmitHandler<FieldValues>;

  useEffect(() => {
    document.title = "XDS Spark - Signup Options";
    if (success) {
      scrollToTop();
      setShowSuccessModal(true);
      reset();
    }
  }, [success]);

  async function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling behavior
    });
  }

  const validateFName = (fName: string) => {
    setFirstNameError("");
    const regex =
      /^(?!.*(?:https?|ftp):\/\/)(?!.*www\.)(?!.*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!.*\.)[\s\S]*$/;
    if (regex.test(fName)) {
      return regex.test(fName);
    } else {
      setFirstNameError("First Name cannot contain special characters");
      return "First Name cannot contain special characters";
    }
  };
  const validateLName = (lName: string) => {
    setLastNameError("");
    const regex =
      /^(?!.*(?:https?|ftp):\/\/)(?!.*www\.)(?!.*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?!.*\.)[\s\S]*$/;
    if (regex.test(lName)) {
      return regex.test(lName);
    } else {
      setLastNameError("Last Name cannot contain special characters");
      return "Last Name cannot contain special characters";
    }
  };
  useEffect(() => {
    validateFName(watchFirstname);
  }, [watchFirstname]);

  useEffect(() => {
    validateLName(watchLastname);
  }, [watchLastname]);

  return (
    <>
      <style jsx global>{`
        .min-h-screen {
          min-height: auto;
        }
      `}</style>
      <HeaderStatic />
      <div
        className="pt-24 pb-20"
        style={{
          background:
            props.type === "free"
              ? "radial-gradient(136.3% 233.3% at 7.34% 149.25%, #391281 0%, #4E249D 5.98%, #4F22A6 11.95%, #541EC2 18.27%, #571BD4 24.07%, #BF2584 92.79%"
              : "linear-gradient(to bottom right, #391281 0%, #4E249D 5.98%, #4F22A6 11.95%, #541EC2 18.27%, #571BD4 24.07%, #BF2584 92.79%)",
        }}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 gap-8 lg:gap-16 items-start lg:max-w-7xl mx-auto">
            <div className="left-content_div bg-[#F8F7FF] rounded-lg py-6 px-10">
              {/* {
                !success && */}
              <div className="premium_member">
                <h1
                  className={`mb-4 xds_welcome_reg_text ${
                    props.type === "free" ? "text-[#4E249D]" : "text-[#218DAB]"
                  }`}
                >
                  Welcome to Spark{" "}
                  <span>
                    {props.type === "free" ? (
                      <>
                        Foundational{" "}
                        <small className="font-semibold">
                          {" "}
                          <span className="px-3 text-[#9B53D2] text-[22px]">
                            •
                          </span>{" "}
                          No cost to join
                        </small>
                      </>
                    ) : (
                      "Premium"
                    )}
                  </span>
                </h1>

                {/* <p className="registration_text">REGISTRATION</p> */}
                <div className="inline-block tool_tip_inline text-sm please_fill_top mb-4">
                  {props.type === "free" ? (
                    <>
                      {" "}
                      Every company and individual on XDS Spark is verified—so
                      you can connect with confidence.
                    </>
                  ) : (
                    <>
                      {" "}
                      Every company and individual on XDS Spark is verified—so
                      you can connect with confidence and get the most out of
                      the platform.
                    </>
                  )}
                  {/* <Tooltip className="tier_tooltip_2 inline-block" content="Why do we do this? To ensure that every company and individual using XDS Spark is legitimate and has been validated, in order to provide the best experience possible to our community!" trigger="hover">
                      <svg className="w-[16px] h-[16px] text-gray-700 ms-1 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                      </svg>
                    </Tooltip> */}
                </div>
              </div>

              {/* <h4 className="font-bold text-center text-[22px]">
                {success
                  ? "Thanks for registering with XDS Spark!"
                  // : "Register for XDS Spark"}
                  : ""}
              </h4>
              <p className="text-sm">
                {success
                  ? "We will review your registration information and send you an email once approved."
                  :
                  ""
                    }
              </p>
                  */}
              {/* <div className="inline-block tool_tip_inline">Please fill in the form below and we will review it and get right back to you (all fields are required).
                    <Tooltip className="tier_tooltip_2 inline-block" content="Why do we do this? To ensure that every company and individual using XDS Spark is legitimate and has been validated, in order to provide the best experience possible to our community!" trigger="hover">
                     <svg className="w-[16px] h-[16px] text-gray-700 ms-1 mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                         <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                     </svg>
                    </Tooltip>
                   </div>
                 */}

              {/* {!success && ( */}
              <form
                className="w-full space-y-6 my-5"
                onSubmit={handleSubmit(onSubmit)}
              >
                {error && (
                  <p className="font-medium text-[#C453FF] text-xs mt-1">
                    Error: {error}
                  </p>
                )}
                <div className="grid lg:grid-cols-2 gap-8 items-start">
                  <div>
                    <Input
                      type="text"
                      id="firstName"
                      maxLength={25}
                      {...register("firstName", {
                        required: "This field is required.",
                        validate: validateFName,
                      })}
                      label="First Name *"
                      // aria-invalid={errors.firstName ? "true" : "false"}
                    />
                    <p className="font-medium text-[#C453FF] text-xs mt-1">
                      {errors.firstName?.message as string}
                    </p>
                    <p className="font-medium text-[#C453FF] text-xs mt-1">
                      {firstNameError && firstNameError != "" && firstNameError}
                    </p>
                  </div>

                  <div>
                    <Input
                      type="text"
                      id="lastName"
                      maxLength={25}
                      {...register("lastName", {
                        required: "This field is required.",
                        validate: validateLName,
                      })}
                      label="Last Name *"
                    />
                    <p className="font-medium text-[#C453FF] text-xs mt-1">
                      {errors.lastName?.message as string}
                    </p>
                    <p className="font-medium text-[#C453FF] text-xs mt-1">
                      {lastNameError && lastNameError != "" && lastNameError}
                    </p>
                  </div>
                </div>
                <div>
                  <Input
                    type="email"
                    id="email"
                    onKeyUp={checkMail}
                    {...register("email", {
                      required: "This field is required.",
                    })}
                    label="Email Address *"
                  />
                  {mailError && mailError != "" && (
                    <p className="font-medium text-[#C453FF] text-xs mt-1">
                      {mailError as string}
                    </p>
                  )}

                  <p className="font-medium text-[#C453FF] text-xs mt-1">
                    {errors.email?.message as string}
                  </p>
                </div>
                <div>
                  <Input
                    type="text"
                    id="linkedInUrl"
                    {...register("linkedInUrl", {
                      required: "This field is required.",
                    })}
                    label="LinkedIn Profile *"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <p className="font-medium text-[#C453FF] text-xs mt-1">
                    {errors.linkedInUrl?.message as string}
                  </p>
                </div>
                <div>
                  <Input
                    type="text"
                    id="companyName"
                    maxLength={25}
                    {...register("companyName", {
                      required: "This field is required.",
                    })}
                    label="Company *"
                  />
                  <p className="font-medium text-[#C453FF] text-xs mt-1">
                    {errors.companyName?.message as string}
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    id="companyWebUrl"
                    {...register("companyWebUrl", {
                      required: "This field is required.",
                    })}
                    label="Company Website *"
                    placeholder="https://yourcompany.com"
                  />
                  <p className="font-medium text-[#C453FF] text-xs mt-1">
                    {errors.companyWebUrl?.message as string}
                  </p>
                </div>

                <div>
                  <p className="text-xs">
                    <strong> Industry Type </strong>{" "}
                    <span className="italic">
                      If you are a Buyer and Service Provider, please
                      select Service Provider.
                    </span>
                  </p>
                  {/* <p className="text-xs italic">
                    ** For companies that are both industry types, but want to promote
                    services, please select Service Provider. As a Service Provider,
                    you can promote your company, and also buy services.
                  </p> */}
                </div>
                <div className="flex gap-8 items-start">
                  <div className="flex items-center space-x-2 labele_check">
                    <input
                      type="radio"
                      {...register("role", { required: true })}
                      value="buyer"
                      id="buyer"
                      className=" aspect-square h-5 w-5 rounded-full border border-gray-300"
                    />
                    <Label htmlFor="buyer" className="text-sm font-semibold">
                      Buyer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 labele_check">
                    <input
                      type="radio"
                      {...register("role", { required: true })}
                      value="service_provider"
                      id="service_provider"
                      className="h-5 w-5 accent-[#bf5af3] border border-[#D8D8D8] rounded-full"
                    />
                    <Label
                      htmlFor="service_provider"
                      className="text-sm font-semibold"
                    >
                      Service Provider
                    </Label>
                  </div>
                </div>
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="100%"
                    height="2"
                    viewBox="0 0 510 2"
                    fill="none"
                  >
                    <path d="M0.414062 1H509.38" stroke="black" />
                  </svg>
                </div>
                <div className="flex items-center labele_check">
                  <input
                    type="radio"
                    {...register("checkedTerms", { required: true })}
                    id="checkedTerms"
                    className="peer h-5 w-5 shrink-0 rounded-full border border-gray-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gray-400 data-[state=checked]:text-primary-foreground"
                  />
                  <label
                    htmlFor={"checkedTerms"}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pl-2"
                  >
                    I agree to the&nbsp;
                    <a
                      href="/XDS Spark Terms and Conditions of Use.pdf"
                      target="_blank"
                      className="underline text-[#BF5AF3] font-semibold"
                    >
                      {/* TODO: Update link to Terms & Conditions later */}
                      XDS Spark Terms & Conditions
                    </a>
                  </label>
                </div>
                <div className="text-center mt-10">
                  <Button
                    type="submit"
                    className="p-6 rounded-full bg-[#BF5AF3] w-[246px] hover:bg-[#BF5AF3]"
                    disabled={!isValid || isLoading}
                  >
                    {isLoading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
                {/* <Button
                        type="button"
                        className="w-full"
                        // disabled={!isValid || isLoading}
                        onClick={() => {checkErrors()}}
                    >
                        {isLoading ? "Submitting..." : "Check Errors"}
                    </Button> */}
              </form>
              {/* )} */}
            </div>
            {showSuccessModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="relative w-[90%] max-w-md rounded-xl bg-white p-2 text-center shadow-lg">
                  <button
                    className="absolute right-3 top-3 text-gray-400 hover:text-black text-xl z-[20]"
                    onClick={() => setShowSuccessModal(false)}
                  >
                    ×
                  </button>
                  <div className="">
                    <div className="rounded-[9px] w-full h-[323px] relative shadow-sm">
                      {/* Main heading */}
                      <div className="absolute left-1/2 top-[43px] -translate-x-1/2 w-[422px] text-center">
                        <h1 className="text-[33.477px] font-extrabold leading-[40px] text-[#4d2e8f] tracking-[0.3348px] ">
                          Thank you for
                          <br />
                          joining Spark!
                        </h1>
                      </div>

                      {/* Body text */}
                      <div className="absolute left-1/2 top-[161px] -translate-x-1/2 w-[484px] text-center">
                        <div className="text-[15.477px] leading-[25px] tracking-[0.1548px] text-[#4d2e8f] ">
                          <p className="font-normal mb-0">
                            You will receive a confirmation shortly!
                            <br />
                            Thank you for your patience as we review your
                            profile.
                          </p>
                          <br />
                          <p className="font-normal mb-0">
                            If you have any questions,
                            <br />
                            please contact{" "}
                            <a
                              href="mailto:info@xds-spark.com"
                              className="font-bold text-[#4d2e8f] hover:text-[#ed217b] transition-colors"
                            >
                              info@xds-spark.com
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {props.type === "free" ? (
              <div className="right-content_div">
                <div className="w-full">
                  <div className="relative min-h-[600px] lg:min-h-[800px] rounded-lg overflow-hidden">
                    {/* Content Container */}
                    <div className="relative z-10 p-8 lg:p-12 h-full flex flex-col ">
                      {/* Hero Text */}
                      <div className="mb-8 lg:mt-10">
                        <h2 className="text-white text-2xl lg:text-3xl font-bold leading-tight">
                          <div>Discover.</div>
                          <div>Connect.</div>
                          <div>Create.</div>
                        </h2>
                      </div>

                      {/* Character Image */}
                      <div className="flex justify-center mb-8 lg:mb-12 mt-[-150px]">
                        <div
                          className="w-64 h-48 lg:w-80 lg:h-60 bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url('XDS_Spark_character_Visibility_Final_smart.png')`,
                          }}
                        />
                      </div>

                      {/* Testimonial */}
                      <div className="mb-8 lg:mb-20">
                        <blockquote className="text-white text-lg lg:text-xl leading-relaxed mb-4">
                          "XDS Spark has streamlined how I find and engage with
                          partners—it's fast, reliable, and impactful.
                          <br />
                          <div className="mt-3 d-block">
                            It's become a key part of my development pipeline."{" "}
                          </div>
                        </blockquote>

                        <div className="text-white font-bold text-[15px]">
                          Paul Goad, Head of Art, Offworld Industries
                        </div>
                      </div>

                      {/* Bottom Content */}
                      <div className="mt-auto">
                        <div className="mb-10">
                          <h3 className="text-white font-semibold mb-2">
                            Take the next step toward building better external
                            partnerships.
                          </h3>
                          <p className="text-white text-base leading-relaxed font-[300]">
                            Start at no cost — and upgrade to Spark Premium for
                            expanded access and added benefits.
                          </p>
                        </div>

                        {/* CTA Button */}
                        <a
                          href="/"
                          className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-bold text-sm tracking-wide rounded-full hover:bg-white hover:text-[#9b53d2] transition-colors duration-200"
                        >
                          See what Spark offers →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="right-content_div">
                <div className="w-full h-screen items-center">
                  <div className="relative min-h-[600px] lg:min-h-[800px] rounded-lg overflow-hidden">
                    {/* Content Container */}
                    <div className="relative z-10 p-8 lg:p-12 h-full flex flex-col">
                      {/* Hero Text */}
                      <div className="mb-16 lg:mt-10">
                        <h2 className="text-white text-2xl lg:text-3xl font-bold leading-tight">
                          <div>Get ready for a faster, </div>
                          <div>smarter way to connect</div>
                        </h2>
                      </div>

                      {/* Testimonial */}
                      <div className="mb-8 lg:mb-12">
                        <blockquote className="text-white text-lg lg:text-xl leading-relaxed mb-4 lg:w-[400px]">
                          “XDS Spark is the most effective online platform for
                          showcasing our studio's work to AAA game developers.
                          It offers real visibility and opportunities for
                          studios and external partners alike.”
                        </blockquote>

                        <div className="text-white font-bold text-[15px]">
                          Richard Ludlow, Founder, Hexany Audio
                        </div>
                      </div>

                      {/* Bottom Content */}
                      <div className="mt-auto">
                        {/* CTA Button */}
                        <a
                          href="mailto:info@xds-spark.com"
                          className="inline-flex items-center px-8 py-3 border-2 border-white text-white font-bold text-sm tracking-wide rounded-full hover:bg-white hover:text-[#9b53d2] transition-colors duration-200"
                        >
                          Questions? Contact us →
                        </a>
                      </div>
                      <div className="flex justify-center mb-8 lg:mb-12 mt-[60px]">
                        <div
                          className="w-64 h-48 lg:w-80 lg:h-60 bg-cover bg-center bg-no-repeat"
                          style={{
                            backgroundImage: `url('XDS_Spark_Playful_Final_smart flipped.png')`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegistrationForm;
