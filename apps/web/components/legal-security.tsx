import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "/public/css/detatable.css";
import { Label, Select, Tooltip } from "flowbite-react"
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import { async } from "@firebase/util";
import { useUserContext } from "@/context/store";
import { formatDate } from "@/services/common-methods";
import { sanitizeData } from "@/services/sanitizedata";
import usePagePermissions from "@/hooks/usePagePermissions"
import { userPermissionsType } from "@/types/user.type";
interface LegalSecurityTypes {
    buyerId: number;
    companyId: number;
    prefferedPartner: string;
    performanceRating: number;
    nonDiscloser: string;
    masterService: string;
    securityStatus: string;

}
const LegalSecurity = (props: { companyId: number, setLastUpdatedDate: (setLastUpdatedDate: string) => void, userPermissions: userPermissionsType}) => {

    const [disclosureValue, setDisclosureValue] = useState<string>("Select");
    const [masterServiceValue, setMasterServiceValue] = useState<string>("Select");
    const [securityStatus, setSecurityStatus] = useState<string>("Select");
    const [sowStatus, setSowStatus] = useState<string>("");
    const [isUpdated, setIsUpdated] = useState<boolean>(false);
    const { user } = useUserContext();
    const getOverAllRatesdata = async () => {
        if (user?.companyId != props.companyId) {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getOverallRatings(props.companyId))}`)
                .then((result) => {
                    if (result.data && result.success == true) {
                      setDisclosureValue(result.data.nonDiscloser);
                      setMasterServiceValue(result.data.masterService);
                      setSecurityStatus(result.data.securityStatus);
                      if(result.data.sowStatus) {
                        setSowStatus(result.data.sowStatus);
                      }
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    useEffect(() => {
        if (isUpdated == true) {
            const updateData = async () => {

                let updatedData = {
                    buyerId: (user && user.companyId) ? user.companyId : 0,
                    nonDiscloser: disclosureValue,
                    masterService: masterServiceValue,
                    securityStatus: securityStatus,
                    sowStatus: sowStatus,
                    companyId: props.companyId
                }
                updatedData = sanitizeData(updatedData);
                await authPutWithData(`${getEndpointUrl(ENDPOINTS.setAlloverratings)}`, updatedData)
                    .then((result) => {
                        props.setLastUpdatedDate(formatDate(new Date()));
                        //   getOverAllRatesdata();
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                setIsUpdated(false);
            }
            updateData();
        }
    }, [isUpdated]);

    useEffect(() => {
        getOverAllRatesdata();
        // if (userPermissions) {
        //     if (user && userPermissions) {
        //         setPermissions((prev) => {
        //             if (userPermissions) { return { canDelete: userPermissions.canDelete, canRead: userPermissions.canRead, canWrite: userPermissions.canWrite } }
        //             return prev
        //         })
        //     }
        // }
    }, []);
 
    return (
        <>
                <div className="contactus">
                    <div className="sm:flex sm:items-center sm:justify-between py-6">
                        <div className="sm:text-left">
                            <h1 className="font-bold default_text_color header-font certi_mobile_show">
                                Legal & Security
                            </h1>
                        </div>
                    </div>
                    <ul className="max-w-md space-y-6">
                        <li>
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">Non Disclosure Agreement</p>
                                </div>
                                <div className="inline-flex items-center">
                                    <div className="text_box_readuce flex items-center">
                                        <Select disabled={props.userPermissions.isCompanyUser && !props.userPermissions.canWrite} id="disclosure" value={disclosureValue} onChange={(e) => { setDisclosureValue(e.target.value); setIsUpdated(true); }} sizing="sm">
                                            <option value="Select">Select</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                            <option value="inprogress">In Progress</option>
                                            <option value="na">NA</option>
                                        </Select>
                                        <div className="ml-6 w-10">
                                            <div className="inline-flex text_box_readuce items-center">
                                                {disclosureValue && disclosureValue == "yes" &&
                                                    <Tooltip content="NDA complete" trigger="hover">
                                                        <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
                                                        </svg>
                                                    </Tooltip>
                                                }

                                                {disclosureValue && disclosureValue == "no" &&
                                                    <Tooltip content="No NDA available" trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#d22824" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip>
                                                }

                                                {disclosureValue && disclosureValue == "inprogress" &&
                                                    <Tooltip content="In progress" trigger="hover"> <svg className="w-[32px] h-[32px] inprogress_2" fill="#f5700c" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
                                                        <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" /></svg></Tooltip>
                                                }

                                                {disclosureValue && disclosureValue == "na" &&
                                                    <Tooltip content="Not applicable" trigger="hover"> <div className="not_app" style={{ background: '#4074FF' }}>NA</div></Tooltip>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate font-semibold">Master Service Agreement</p>
                                </div>
                                <div className="inline-flex items-center">
                                    <div className="text_box_readuce flex items-center">
                                        <Select disabled={props.userPermissions.isCompanyUser && !props.userPermissions.canWrite} id="masterService" value={masterServiceValue} onChange={(e) => { setMasterServiceValue(e.target.value); setIsUpdated(true); }} sizing="sm">
                                            <option value="Select">Select</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                            <option value="inprogress">In Progress</option>
                                            <option value="na">NA</option>
                                        </Select>
                                        <div className="ml-6 w-10">
                                            <div className="inline-flex text_box_readuce items-center">
                                                {masterServiceValue && masterServiceValue == "yes" &&
                                                    <Tooltip content="MSA complete" trigger="hover">
                                                        <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
                                                        </svg>
                                                    </Tooltip>
                                                }

                                                {masterServiceValue && masterServiceValue == "no" &&
                                                    <Tooltip content="No MSA available" trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#d22824" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip>
                                                }

                                                {masterServiceValue && masterServiceValue == "inprogress" &&
                                                    <Tooltip content="In progress" trigger="hover"> <svg className="w-[32px] h-[32px] inprogress_2" fill="#f5700c" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
                                                        <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" /></svg></Tooltip>
                                                }

                                                {masterServiceValue && masterServiceValue == "na" &&
                                                    <Tooltip content="Not applicable" trigger="hover"> <div className="not_app" style={{ background: '#4074FF' }}>NA</div></Tooltip>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold inline-flex">Security Status <Tooltip className="tier_tooltip_partner_status" content="If you have an internal security process, this indicates at what stage the service provider is within that process." trigger="hover">
                                        <svg className="w-[16px] h-[16px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                        </svg>
                                    </Tooltip></p>
                                </div>
                                <div className="inline-flex items-center">
                                    <div className="text_box_readuce flex items-center">
                                        <Select disabled={props.userPermissions.isCompanyUser && !props.userPermissions.canWrite} id="securityStatus" value={securityStatus} onChange={(e) => { setSecurityStatus(e.target.value); setIsUpdated(true); }} sizing="sm">
                                            <option value="Select">Select</option>
                                            <option value="approved">Approved</option>
                                            <option value="denied">Denied</option>
                                            <option value="inprogress">In Progress</option>
                                            <option value="na">NA</option>
                                        </Select>
                                        <div className="ml-6 w-10">
                                            <div className="inline-flex text_box_readuce items-center">
                                                {securityStatus && securityStatus == "approved" &&
                                                    <Tooltip content="Security complete" trigger="hover">
                                                        <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                            <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
                                                        </svg>
                                                    </Tooltip>
                                                }

                                                {securityStatus && securityStatus == "denied" &&
                                                    <Tooltip content="No Security available" trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#d22824" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip>
                                                }

                                                {securityStatus && securityStatus == "inprogress" &&
                                                    <Tooltip content="In progress" trigger="hover"> <svg className="w-[32px] h-[32px] inprogress_2" fill="#f5700c" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
                                                        <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" /></svg></Tooltip>
                                                }

                                                {securityStatus && securityStatus == "na" &&
                                                    <Tooltip content="Not applicable" trigger="hover"> <div className="not_app" style={{ background: '#4074FF' }}>NA</div></Tooltip>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                          <div className="flex items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold inline-flex">Statement of Work Status 
                                <Tooltip className="tier_tooltip_partner_status" content="Indicates the status of SOWs with the service provider." trigger="hover">
                                  <svg className="w-[16px] h-[16px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                  </svg>
                                </Tooltip>
                              </p>
                            </div>
                            <div className="inline-flex items-center">
                              <div className="text_box_readuce flex items-center">
                                <Select disabled={props.userPermissions.isCompanyUser && !props.userPermissions.canWrite} id="securityStatus" value={ sowStatus } onChange={(e) => { setSowStatus(e.target.value); setIsUpdated(true); }} sizing="sm">
                                  <option value="">Select</option>
                                  <option value="none">None</option>
                                  <option value="inprogress">In Progress</option>
                                  <option value="active">Active</option>
                                </Select>
                                <div className="ml-6 w-10">
                                  <div className="inline-flex text_box_readuce items-center">
                                    {
                                      sowStatus && sowStatus == "none" &&
                                      <Tooltip content="Not applicable" trigger="hover"> <div className="not_app" style={{ background: '#4074FF' }}>NO</div></Tooltip>
                                      // <Tooltip content="No Statement of Work Status available" trigger="hover"><svg className="w-[24px] h-[24px] ml-1" fill="#d22824" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g id="Layer_2" data-name="Layer 2"><g id="minus_"><path d="m256 0c-141.38 0-256 114.62-256 256s114.62 256 256 256 256-114.62 256-256-114.62-256-256-256zm131.5 256a37.69 37.69 0 0 1 -37.69 37.69h-187.62a37.69 37.69 0 0 1 -37.69-37.69 37.69 37.69 0 0 1 37.69-37.69h187.62a37.69 37.69 0 0 1 37.69 37.69z" /></g></g></svg></Tooltip>
                                    }
                                    {
                                      sowStatus && sowStatus == "inprogress" &&
                                      <Tooltip content="In progress" trigger="hover">
                                        <svg className="w-[32px] h-[32px] inprogress_2" fill="#f5700c" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 125" x="0px" y="0px">
                                          <path d="M50,3.44A46.56,46.56,0,1,0,96.56,50,46.55,46.55,0,0,0,50,3.44Zm6.61,51.37A22.08,22.08,0,0,1,71.82,72.59,2.86,2.86,0,0,1,69,75.87H31a2.86,2.86,0,0,1-2.84-3.28A22.09,22.09,0,0,1,43.39,54.81,4,4,0,0,0,46.21,51v-1.9a4,4,0,0,0-2.82-3.86A22.09,22.09,0,0,1,28.18,27.41,2.86,2.86,0,0,1,31,24.13H69a2.86,2.86,0,0,1,2.84,3.28A22.08,22.08,0,0,1,56.61,45.19a4.05,4.05,0,0,0-2.82,3.87v1.88A4.05,4.05,0,0,0,56.61,54.81Z" />
                                        </svg>
                                      </Tooltip>
                                    }
                                    {
                                      sowStatus && sowStatus == "active" &&
                                      <Tooltip content="Active" trigger="hover">
                                        <svg className="w-[28px] h-[28px] text-green-500 m-[1.5px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                          <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm13.707-1.293a1 1 0 0 0-1.414-1.414L11 12.586l-1.793-1.793a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.414 0l4-4Z" clip-rule="evenodd" />
                                        </svg>
                                      </Tooltip>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                    </ul>

                </div>
        </>
    );
}
export default LegalSecurity;