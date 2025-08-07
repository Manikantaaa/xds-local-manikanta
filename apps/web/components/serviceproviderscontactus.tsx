
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher } from "@/hooks/fetcher";
import { companyContactTypes } from "@/types/serviceProviderDetails.type";
import Link from "next/link";
import Image from "next/image";
import profilePlaceHolder from "@/public/profile-user.png"
const ServiceproviderContactUs = ({
  loggedCompanyId,
  providerCompanyId,
  CompanyContacts,
  isPaidProfile,
}: {
  loggedCompanyId: number,
  providerCompanyId: number,
  CompanyContacts: companyContactTypes[];
  isPaidProfile: boolean
}) => {
  const subject = "Enquiry from XDS Spark";
  const body = "“This email was originally generated from XDS Spark”";

  function updateConacted(type : string) {
    authFetcher(`${getEndpointUrl(ENDPOINTS.buyerContacted(loggedCompanyId, providerCompanyId, type))}`);
  }

  return (
    <>
      <div className="contactus pb-12">
        <div className="sm:flex sm:items-center sm:justify-between py-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              Contacts
            </h1>
          </div>
        </div>
        {(CompanyContacts.length > 0 && isPaidProfile) ? (
          CompanyContacts.map((contact, index) => (

            <div key={`serviceProvider` + index} className="sm:text-left pb-6">

              <div className="flex items-center gap-4 mb-4">
                <Image
                  src={contact.profilePic || profilePlaceHolder}
                  alt=""
                  className="rounded-full object-cover"
                  width={110}
                  height={110}
                />

                <div className="space-y-0.5">
                  <h1
                    key={`serviceProvidertitle` + index}
                    className="font-bold default_text_color heading-sub-font"
                  >
                    {contact.title}
                  </h1>
                  <p
                    key={`serviceProvideremail` + index}
                    className="text-blue-300 text-sm"
                  >
                    <Link prefetch={false} href={`mailto:${contact.email}?subject=${subject}&body=${body}`} target="_blank" onClick={() => updateConacted('contactLink')}>{contact.email}</Link>
                  </p>
                  <p
                    key={`serviceProvidercontact` + index}
                    className="default_text_color text-sm"
                  >
                    {contact.name}
                  </p>

                  {contact.linkedInUrl && (
                    <p
                      key={`serviceProviderlinkedIn` + index}
                      className="text-blue-300 text-sm"
                    >
                      <svg height="18" viewBox="0 0 176 176" width="18" xmlns="http://www.w3.org/2000/svg" id="fi_3536505"><g id="Layer_2" data-name="Layer 2"><g id="linkedin"><rect id="background" fill="#0077b5" height="176" rx="24" width="176"></rect><g id="icon" fill="#fff"><path d="m63.4 48a15 15 0 1 1 -15-15 15 15 0 0 1 15 15z"></path><path d="m60 73v66.27a3.71 3.71 0 0 1 -3.71 3.73h-15.81a3.71 3.71 0 0 1 -3.72-3.72v-66.28a3.72 3.72 0 0 1 3.72-3.72h15.81a3.72 3.72 0 0 1 3.71 3.72z"></path><path d="m142.64 107.5v32.08a3.41 3.41 0 0 1 -3.42 3.42h-17a3.41 3.41 0 0 1 -3.42-3.42v-31.09c0-4.64 1.36-20.32-12.13-20.32-10.45 0-12.58 10.73-13 15.55v35.86a3.42 3.42 0 0 1 -3.37 3.42h-16.42a3.41 3.41 0 0 1 -3.41-3.42v-66.87a3.41 3.41 0 0 1 3.41-3.42h16.42a3.42 3.42 0 0 1 3.42 3.42v5.78c3.88-5.82 9.63-10.31 21.9-10.31 27.18 0 27.02 25.38 27.02 39.32z"></path></g></g></g></svg><Link className="pl-1" prefetch={false} href={`${contact.linkedInUrl}`} target="_blank">View LinkedIn profile</Link>
                    </p>
                  )}
                   {contact.calendarLink && (
                    <p
                      key={`serviceProviderlinkedIn` + index}
                      className="text-blue-300 text-sm"
                    >
                      {/* <svg id="fi_2886665" fill="#0077b5" enable-background="new 0 0 34 34" height="18" viewBox="0 0 34 34" width="18" xmlns="http://www.w3.org/2000/svg"><g><path d="m29.6 2h-3v3c0 .6-.5 1-1 1s-1-.4-1-1v-3h-16v3c0 .6-.5 1-1 1s-1-.4-1-1v-3h-3c-1.5 0-2.6 1.3-2.6 3v3.6h32v-3.6c0-1.7-1.8-3-3.4-3zm-28.6 8.7v18.3c0 1.8 1.1 3 2.7 3h26c1.6 0 3.4-1.3 3.4-3v-18.3zm8.9 16.8h-2.4c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c-.1.5-.4.8-.9.8zm0-9h-2.4c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c-.1.5-.4.8-.9.8zm8 9h-2.5c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c0 .5-.3.8-.8.8zm0-9h-2.5c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c0 .5-.3.8-.8.8zm8 9h-2.5c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c0 .5-.3.8-.8.8zm0-9h-2.5c-.4 0-.8-.3-.8-.8v-2.5c0-.4.3-.8.8-.8h2.5c.4 0 .8.3.8.8v2.5c0 .5-.3.8-.8.8z"></path></g></svg> */}
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#0077b5" viewBox="0 0 512 512">
                        <path d="M452,40h-24V0h-40v40H124V0H84v40H60C26.916,40,0,66.916,0,100v352c0,33.084,26.916,60,60,60h392c33.084,0,60-26.916,60-60V100C512,66.916,485.084,40,452,40z M472,452c0,11.028-8.972,20-20,20H60c-11.028,0-20-8.972-20-20V188h432V452z M472,148H40v-48c0-11.028,8.972-20,20-20h24v40h40V80h264v40h40V80h24c11.028,0,20,8.972,20,20V148z"></path>
                        <rect x="76" y="230" width="40" height="40"></rect>
                        <rect x="156" y="230" width="40" height="40"></rect>
                        <rect x="236" y="230" width="40" height="40"></rect>
                        <rect x="316" y="230" width="40" height="40"></rect>
                        <rect x="396" y="230" width="40" height="40"></rect>
                        <rect x="76" y="310" width="40" height="40"></rect>
                        <rect x="156" y="310" width="40" height="40"></rect>
                        <rect x="236" y="310" width="40" height="40"></rect>
                        <rect x="316" y="310" width="40" height="40"></rect>
                        <rect x="396" y="310" width="40" height="40"></rect>
                        <rect x="76" y="390" width="40" height="40"></rect>
                        <rect x="156" y="390" width="40" height="40"></rect>
                        <rect x="236" y="390" width="40" height="40"></rect>
                        <rect x="316" y="390" width="40" height="40"></rect>
                      </svg>
                      <Link className="pl-1" prefetch={false} href={`${contact.calendarLink}`} target="_blank" onClick={() => updateConacted('meetingLink')}>Book a meeting with me!</Link>
                    </p>
                  )}
                </div>
              </div>
            </div>

          ))
        ) : (
          <p className="text-sm">Coming Soon</p>
        )}

        {/* <div className="sm:text-left pb-6">
                  <h1 className="font-bold default_text_color heading-sub-font">
                    Beth Last
                  </h1>
                  <p className="text-blue-300 text-sm">
                    <Link href="#">mark.cruz@email.com</Link>
                  </p>
                  <p className="default_text_color text-sm">VP Sales</p>
                  <p className="default_text_color text-sm">
                    Time zone: Pacific (US/Canada)
                  </p>
                  <p className="text-blue-300 text-sm">
                    <Link href="#">View LinkedIn profile</Link>
                  </p>
                </div> */}
      </div>
    </>
  );
};

export default ServiceproviderContactUs;
