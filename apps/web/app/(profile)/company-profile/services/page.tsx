"use client";

import { PATH } from "@/constants/path";
import Breadcrumbs from "@/components/breadcrumb";
import { useEffect, useState } from "react";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { ServiceCapabilities } from "@/types/companies.type";
import { Button } from "flowbite-react";
import { useUserContext } from "@/context/store";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import { redirect } from "next/navigation";
import MobileSideMenus from "@/components/mobileSideMenus";
import Spinner from "@/components/spinner";
import ButtonSpinner from "@/components/ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { useProfileStatusContext } from "@/context/profilePercentage";

const Selectservices = () => {
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY_PROFILE.name,
      path: PATH.COMPANY_PROFILE.path,
    },
    {
      label: PATH.SERVICES.name,
      path: PATH.SERVICES.path,
    },
  ];
  const { user } = useUserContext();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [serviceAndCapabilities, setServiceAndCapabilities] = useState<
    ServiceCapabilities[]
  >([]);

  const { submitForm: saveServicesAndCapabilities } = useCommonPostData<{
    companyId: number;
    capabilities: number[];
  }>({
    url: getEndpointUrl(ENDPOINTS.saveServiceAndCapabilities),
  });

  const [postServiceAndCapabilities, setPostServiceAndCapabilities] = useState<{
    companyId: number;
    services: number[];
    capabilities: number[];
  }>({ companyId: 0, services: [], capabilities: [] });
  const [canRender, setCanRender] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  useEffect(() => {
    async function fetchInformations() {
      try {
        const result1 = await authFetcher(
          `${getEndpointUrl(ENDPOINTS.getServiceAndCapabilities)}`,
        );
        const masterServiceAndCapabilities = result1.data;
        const updatedServiceAndCapabilities: ServiceCapabilities[] =
          masterServiceAndCapabilities.map((service: ServiceCapabilities) => ({
            ...service,
            isChecked: false,
            showCapabilities: false,
            capabilities: service.capabilities.map(
              (capability: {
                id: number;
                capabilityName: string;
                isChecked: boolean;
              }) => ({
                ...capability,
                isChecked: false,
              }),
            ),
          }));
        setServiceAndCapabilities(updatedServiceAndCapabilities);

        if (user) {
          const result2 = await authFetcher(
            `${getEndpointUrl(
              ENDPOINTS.getServicesAndCapabilities(user.companyId),
            )}`,
          );
          const fetchedCapabilities = result2.data.capabilities;
          const fetchedServices = result2.data.services;
          const localServiceCapabilities = [...updatedServiceAndCapabilities];
          const localPostServiceCapabilities = postServiceAndCapabilities;
          for (const theService of fetchedServices) {
            for (const item of localServiceCapabilities) {
              if (theService.serviceId && theService.serviceId == item.id) {
                item.isChecked = true;
                item.showCapabilities = true;
                if (
                  !localPostServiceCapabilities.services.includes(
                    theService.serviceId,
                  )
                ) {
                  localPostServiceCapabilities?.services.push(
                    theService.serviceId,
                  );
                }
                localPostServiceCapabilities.services.push;
              }
            }
          }
          for (const theCapability of fetchedCapabilities) {
            if (theCapability.capabilityId) {
              for (const service of localServiceCapabilities) {
                for (const capability of service.capabilities) {
                  if (theCapability.capabilityId == capability.id) {
                    capability.isChecked = true;
                    if (
                      !localPostServiceCapabilities.capabilities.includes(
                        theCapability.capabilityId,
                      )
                    ) {
                      localPostServiceCapabilities?.capabilities.push(
                        theCapability.capabilityId,
                      );
                    }
                  }
                }
              }
            }
          }
          setServiceAndCapabilities(localServiceCapabilities);
          setPostServiceAndCapabilities(localPostServiceCapabilities);
        }
        setCanRender(true);
      } catch (error) {
        console.log(error);
      }
    }

    fetchInformations();
  }, [user, postServiceAndCapabilities]);

  function onSelectService(isChecked: boolean, serviceIndex: number) {
    const services = postServiceAndCapabilities.services;
    const capabilities = postServiceAndCapabilities.capabilities;
    const localServiceCapablities = [...serviceAndCapabilities];
    let localPostServiceCapabilities = postServiceAndCapabilities;
    setIsDirty(true);
    if (isChecked) {
      if (services && services.length >= 3) {
        alert("Maximum of 3 services can be selected");
        return;
      } else {
        localPostServiceCapabilities?.services.push(
          localServiceCapablities[serviceIndex].id,
        );
      }
    } else {
      const index = services.indexOf(localServiceCapablities[serviceIndex].id);
      if (index !== -1) {
        services.splice(index, 1);
      }
      localPostServiceCapabilities.services = services;
      localServiceCapablities[serviceIndex].capabilities.forEach(
        (capability) => {
          capability.isChecked = false;
        },
      );
      // localServiceCapablities[localServiceCapablities[serviceIndex].id].capabilities.map(() => {
      const removedServiceCapabilities = localServiceCapablities[serviceIndex].capabilities.map((caps) => caps.id)
      const updatedCapabilities = localPostServiceCapabilities.capabilities.filter((postcapabilities) => {
        return !removedServiceCapabilities.includes(postcapabilities);
      })
      // }) 
      localPostServiceCapabilities.capabilities = updatedCapabilities;
    }

    localServiceCapablities[serviceIndex].isChecked = isChecked;
    localServiceCapablities[serviceIndex].showCapabilities = isChecked;
    console.log(localPostServiceCapabilities);
    setServiceAndCapabilities(localServiceCapablities);
    setPostServiceAndCapabilities(localPostServiceCapabilities);
  }

  function onSelectCapability(
    isChecked: boolean,
    serviceIndex: number,
    capabilityIndex: number,
  ) {
    setIsDirty(true);
    const localServiceCapablities = [...serviceAndCapabilities];
    const localPostServiceCapabilities = postServiceAndCapabilities;
    if (isChecked) {
      localPostServiceCapabilities.capabilities.push(
        localServiceCapablities[serviceIndex].capabilities[capabilityIndex].id,
      );
    } else {
      const capabilities = localPostServiceCapabilities.capabilities;
      const index = capabilities.indexOf(
        localServiceCapablities[serviceIndex].capabilities[capabilityIndex].id,
      );
      if (index !== -1) {
        capabilities.splice(index, 1);
      }
      localPostServiceCapabilities.capabilities = capabilities;
    }
    localServiceCapablities[serviceIndex].capabilities[
      capabilityIndex
    ].isChecked = isChecked;
    setServiceAndCapabilities(localServiceCapablities);
    setPostServiceAndCapabilities(localPostServiceCapabilities);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setButtonLoader(true);
    if (user) {
      const postData: {
        companyId: number;
        services: number[];
        capabilities: number[];
      } = postServiceAndCapabilities;
      postData.companyId = user.companyId;
      saveServicesAndCapabilities(postData)
        .then((result) => {
          setButtonLoader(false);
          if (result && result.data && result.data.success) {
            toast.success("Your changes have been saved 👍");
            if (profilepercentage && !profilepercentage.profileCompleted) {
              setProfilepercentage({
                generalInfoProfilePerc: profilepercentage ? profilepercentage.generalInfoProfilePerc : 0,
                aboutProfilePerc: profilepercentage ? profilepercentage.aboutProfilePerc : 0,
                ourWorkAlbumsProfilePerc: profilepercentage ? profilepercentage.ourWorkAlbumsProfilePerc : 0,
                ourWorkProjectProfilePerc: profilepercentage ? profilepercentage.ourWorkProjectProfilePerc : 0,
                servicesProfilePerc: 16,
                certificationsProfilePerc: profilepercentage ? profilepercentage.certificationsProfilePerc : 0,
                contactsProfilePerc: profilepercentage ? profilepercentage.contactsProfilePerc : 0,
                profileCompleted: profilepercentage ? profilepercentage.profileCompleted : false,
                bannerAssetId: profilepercentage.bannerAssetId,
              });
            };
          }
        })
        .catch((err) => {
          setButtonLoader(false);
          console.log(err);
        }).then(() => {
          setIsDirty(false);
        });
    }
  }

  function onClickArrow(e: any, serviceIndex: number) {
    e.preventDefault();
    console.log(serviceIndex);
  }

  usePreventBackNavigation(isDirty);
  return (
    <>
      {
        canRender ?
          <div>
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left flex align-middle items-cente">
                <MobileSideMenus></MobileSideMenus>
                <h1 className="font-bold  header-font">Services</h1>
              </div>
            </div>
            <div className="sm:text-left py-6">
              <h2 className="font-bold  heading-sub-font">
                Select 3 Core Services and Unlimited Sub-services
              </h2>
            </div>
            <div className="py-6 pt-0">
              <div className="h-full  dark:bg-gray-800">
                <div className="">
                  {/* <form onSubmit={handleSubmit(onSubmitServices)}> */}
                  <form onSubmit={(e) => handleSubmit(e)}>
                    <div className="services">
                      <div
                        id="dropdownDefaultCheckbox"
                        className="z-10  bg-white  divide-gray-100 rounded-lg dark:bg-gray-700 dark:divide-gray-600"
                      >
                        {
                          <ul className="pt-0 space_y_3 text-sm text-gray-700">
                            {serviceAndCapabilities.map(
                              (service: ServiceCapabilities, sIndex) => (
                                <li key={sIndex} className={`pl-3 relative ul_before_border ${service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg')))}`}>
                                  <div className="flex items-center">
                                    <label
                                      className="inline-block cursor-pointer"
                                      htmlFor={`checkbox-service-${service.id}`}
                                    >
                                      <svg
                                        className="w-2.5 h-2.5 me-2  mt-1"
                                        aria-hidden="true"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 10 6"
                                        onClick={(e) => onClickArrow(e, sIndex)}
                                      >
                                        <path
                                          stroke="currentColor"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="m1 1 4 4 4-4"
                                        ></path>
                                      </svg>
                                      <span className="absolute left-2 z-10 opacity-0">
                                        sss
                                      </span>
                                    </label>
                                    <input
                                      id={`checkbox-service-${service.id}`}
                                      type="checkbox"
                                      value={service.id}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                      // {...register(`service`)}
                                      name={service.serviceName}
                                      checked={service.isChecked}
                                      onChange={(e) => {
                                        onSelectService(e.target.checked, sIndex);
                                      }}
                                    />
                                    <label
                                      htmlFor={`checkbox-service-${service.id}`}
                                      className="ms-2 text-sm  default_text_color cursor-pointer"
                                    >
                                      {service.serviceName}
                                    </label>
                                  </div>
                                  {
                                    <>
                                      {service.showCapabilities
                                        ? service.capabilities.map(
                                          (
                                            capability: {
                                              id: number;
                                              capabilityName: string;
                                              isChecked: boolean;
                                            },
                                            cIndex,
                                          ) => (
                                            <ul className="ps-8 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                                              <li key={cIndex}>
                                                <div className="flex items-center">
                                                  <input
                                                    id={`checkbox-capability-${capability.id}`}
                                                    type="checkbox"
                                                    value={capability.id}
                                                    name={capability.capabilityName}
                                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                                    // {...register("capability")}
                                                    checked={capability.isChecked}
                                                    onChange={(e) => {
                                                      onSelectCapability(
                                                        e.target.checked,
                                                        sIndex,
                                                        cIndex,
                                                      );
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={`checkbox-capability-${capability.id}`}
                                                    className="ms-2 text-sm  default_text_color cursor-pointer"
                                                  >
                                                    {capability.capabilityName}
                                                  </label>
                                                </div>
                                              </li>
                                            </ul>
                                          ),
                                        )
                                        : ""}
                                    </>
                                  }
                                </li>
                              ),
                            )}
                          </ul>
                        }
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end pb-6 pt-6">
                      <div className="left_btn inline-flex">
                        {/* <Button
                  type="button"
                  className="button_cancel hover:border-gray-100 h-[40px] px-4 mr-2"
                >
                  Cancel
                </Button> */}
                        <Button
                          type="submit"
                          className="bg-white button_blue hover:bg-white h-[40px] px-4"
                          disabled={buttonLoader}
                        >{buttonLoader ? <ButtonSpinner></ButtonSpinner> : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }

    </>
  );
};
export default Selectservices;
