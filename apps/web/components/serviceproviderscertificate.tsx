
import { isValidJSON } from "@/constants/serviceColors";
import { CompanyAddressType, cdDataType, CompanyPlatformExperience, CompanyGameEngines } from "@/types/serviceProviderDetails.type";

const ServiceproviderCertificateAndDiligence = ({
  cdData,
  platforms,
  gameEngines,
  address,
  isPaidProfile,
}: {
  cdData: cdDataType | undefined;
  platforms: CompanyPlatformExperience[] | undefined;
  gameEngines: CompanyGameEngines[]| undefined;
  address: CompanyAddressType[] | undefined;
  isPaidProfile: boolean
}) => {
  const workModel:any = {
    onSite: "On-Site - dedicated in office",
    remote: "Remote - all employees are remote",
    hybrid: "Hybrid - mix of on-site and remote",
    network: "Network - remote contractor/supplier network",
  }
  const workmodelstring = cdData?.workModel;
  return (
    <>
      <div className="certificationsdiligence pb-12">
        <div className="sm:flex sm:items-center sm:justify-between py-6">
          <div className="sm:text-left">
            <h1 className="font-bold default_text_color header-font">
              <span className="certi_mobile_show">
                Due Diligence
              </span>{" "}
            </h1>
          </div>
        </div>
        {cdData && isPaidProfile ? (
          <div className="grid grid-cols-1 gap_20 lg:grid-cols-2 ">
            <div className="first_grid_2 relative">
              <div className="content_view text-sm">
                <div className="sm:text-left pb-6">
                  <h1 className="font-bold default_text_color heading-sub-font_18">
                    Platform Experience
                  </h1>
                </div>
                { platforms && platforms.length > 0  && platforms.map((platforms :{ platforms:{ name: string,}})=>(
                  <>
                  <p className="">
                    {platforms.platforms.name}
                    </p>
                  </>
                  )) 
                }
                <div className="location pt-6">
                  <div className="sm:text-left pb-6">
                    <h1 className="font-bold default_text_color heading-sub-font_18">
                      Game Engines Expertise
                    </h1>
                  </div>
                  { gameEngines && gameEngines.length > 0  && gameEngines.map((gameEngine :{ gameEngineName:string})=>(
                    <>
                      <p className="">
                        {gameEngine.gameEngineName}
                      </p>
                    </>
                    )) 
                  }
                </div>
                <div className="location pt-6">
                  <div className="sm:text-left pb-6">
                    <h1 className="font-bold default_text_color heading-sub-font_18">
                      Certifications
                    </h1>
                  </div>
                  <p className="whitespace-break-spaces">
                  {isValidJSON(cdData?.certifications) ? JSON.parse(cdData?.certifications) : cdData?.certifications}
                  </p>
                </div>
                <div className="location pt-6">
                  <div className="sm:text-left pb-6">
                    <h1 className="font-bold default_text_color heading-sub-font_18">
                      Security
                    </h1>
                  </div>
                  <p className="text-sm whitespace-break-spaces">
                    {isValidJSON(cdData?.Security) ?  JSON.parse(cdData?.Security) : cdData?.Security}
                  </p>
                </div>
                <div className="location pt-6">
                  <div className="sm:text-left pb-6">
                    <h1 className="font-bold default_text_color heading-sub-font_18">
                      Tools & Software
                    </h1>
                  </div>
                  <p className="text-sm whitespace-break-spaces">
                    {isValidJSON(cdData?.tools) ?  JSON.parse(cdData?.tools) : cdData?.tools}
                  </p>
                </div>
              </div>
            </div>

            <div className="second_grid_2 relative">
              <div className="sm:text-left pb-6">
                <h1 className="font-bold default_text_color heading-sub-font_18">
                  History
                </h1>
              </div>
              <div className="content_view">
                <p className="text-sm">Founded: {new Date(cdData?.foundingYear).toLocaleDateString("en-US",
                  {
                    year: "numeric",
                  })}
                </p>
                <p className="text-sm">Founders: {cdData?.founderName}</p>
                <p className="py-6 text-sm whitespace-break-spaces">{isValidJSON(cdData?.foundingDescription) ? JSON.parse(cdData?.foundingDescription) : cdData?.foundingDescription}</p>
                <p className="text-sm">
                  <span className="font-bold">Work Model: </span>
                  {workmodelstring && workModel[workmodelstring]}
                </p>
                <div className="location">
                  {address?.map((add: CompanyAddressType, index) => (
                    <div className="text-sm pt-4" key={index}>
                      <h1 className="font-bold default_text_color heading-sub-font py-2">
                      Location {index+1}
                    </h1>
                      <p>{add.location_name}</p>
                      <p>{add.address1}</p>
                      <p>{add.address2}</p>
                      <p>
                        {" "}
                        {add.city && <>{add.city},</>} {add.zipcode && <>{add.zipcode},</>} {add.Country.name}
                      </p>
                    </div>
                  ))}

                  {/* <p className="pt-6 text-sm">
                  Satellite Office
                  <br />
                  54321 Main Street
                  <br />
                  Dublin, Ireland
                </p> */}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm">Coming Soon</p>
        )}
      </div>
    </>
  );
};

export default ServiceproviderCertificateAndDiligence;