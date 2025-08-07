"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher, fetcher } from "@/hooks/fetcher";
import { ServiceCapabilities } from "@/types/companies.type";
import {
  regionsresponse,
  companysizeresponse,
  UpdatedServicessidenavbarProps,
  SelectedEvent,
  SelectedPlatformsType,
} from "@/types/serviceprovidersidebar.type";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { serviceColoring } from "@/constants/serviceColors";
import Spinner from "./spinner";


const Servicessidenavbar: React.FC<UpdatedServicessidenavbarProps> = ({
  onSearchChange,
  onCapabilityChange,
  onRegionChange,
  onCompanysizeChange,
  handlePlatformChange,
  removedsearchvalues,
  removedregionsearchvalues,
  removedcompanysizesearchvalues,
  removedEventsValues,
  removedPlatformValues,
  handleCapabilityChangeValues,
  setCurrentSelectedEvents,
  SelectedEvents,
}) => {

  const { user } = useUserContext();
  if (!user) {
    redirect(PATH.HOME.path);
  }

  const [services, setServices] = useState<ServiceCapabilities[]>([]);
  const [sortedServices, setSortedServices] = useState<ServiceCapabilities[]>([]);
  const [unsortedServices, setUnSortedServices] = useState<ServiceCapabilities[]>([]);
  const [regions, setRegions] = useState<regionsresponse[]>([]);
  const [eventsList, setEventsList] = useState<{ eventName: string, id: number }[]>([]);
  const [companysizes, setCompanysizes] = useState([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedServiceCapabilities, setSelectedServiceCapabilities] = useState<{ [serviceName: string]: string[] }>({});
  const [selectedIdServiceCapabilities, setSelectedIdServiceCapabilities] = useState<{ [serviceName: string]: string[] }>({});
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(
    [],
  );
  // const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([]);
  const [isAtoZClicked, setIsAtoZClicked] = useState<boolean>(false);
  // 
  const [loader, setLoader] = useState<boolean>(false);
  //platforms
  const [selectedPlatforms, SetSelectedPlatforms] = useState<SelectedPlatformsType[]>([])
  const [platforms, SetPlatforms] = useState<SelectedPlatformsType[]>([])

  useEffect(() => {
    async function getservices() {
      try {
        const serviceslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getServiceAndCapabilities),
        );
        if (serviceslist.success) {
          const servicesListonly = serviceslist.data;
          const updatedServiceAndCapabilities: ServiceCapabilities[] =
            servicesListonly.map((service: ServiceCapabilities) => ({
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
          setServices(updatedServiceAndCapabilities);
          setUnSortedServices(updatedServiceAndCapabilities);
          if (servicesListonly) {
            await servicesListonly.sort((a: any, b: any) => {
              if (a.serviceName < b.serviceName) {
                return -1;
              }
              if (a.serviceName > b.serviceName) {
                return 1;
              }
              return 0;
            });
            setSortedServices(servicesListonly);
          }

        } else {
          console.log(
            `Api Responded with statuscode ${serviceslist.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }
    async function getregions() {
      try {
        const regionslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getregionslist),
        );
        if (regionslist.success) {
          setRegions(regionslist.list);
          setTimeout(() => {
            setPreviousValues();
          }, 1000);
        } else {
          console.log(
            `Api Responded with statuscode ${regionslist.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }
    async function getcompanysizes() {
      try {
        const companysizeslist = await fetcher(
          getEndpointUrl(ENDPOINTS.getcompanysizeslist),
        );
        if (companysizeslist.success) {
          setCompanysizes(companysizeslist.list);
        } else {
          console.log(
            `Api Responded with statuscode ${companysizeslist.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }

    async function setPreviousValues() {
      const regionFilter = localStorage.getItem("regionCheckboxFilter");
      if (regionFilter) {
        setRegions(JSON.parse(regionFilter));
      }
    }

    async function getPlatForms() {
      try {
        const PlatformResponse = await fetcher(
          getEndpointUrl(ENDPOINTS.getPlatforms),
        );
        if (PlatformResponse) {
          SetPlatforms(PlatformResponse);
        } else {
          console.log(
            `Api Responded with statuscode ${PlatformResponse.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }
    async function getEvents() {
      try {
        const EventslistResponse = await fetcher(
          getEndpointUrl(ENDPOINTS.getEventlist),
        );
        if (EventslistResponse.success) {
          setEventsList(EventslistResponse.list);
        } else {
          console.log(
            `Api Responded with statuscode ${EventslistResponse.statuscode}`,
          );
        }
      } catch (error) {
        console.log(`Api Responded Error: ${error}`);
      }
    }

    Promise.all([
      getEvents(),
      getservices(),
      getregions(),
      getcompanysizes(),
      getPlatForms(),
    ]).finally(() => {
      setLoader(true);
    });
  }, [])

  //handler methods
  const handleRegionCheck = async (regionName: string) => {
    let updatedCountries = [...selectedCountries];
    if (updatedCountries.length <= 0) {
      let previouscountrysearch = "";
      const LocalPrevCountrySearch = localStorage.getItem("previouscountrysearch");
      if (LocalPrevCountrySearch) {
        previouscountrysearch = JSON.parse(LocalPrevCountrySearch);
        updatedCountries = [...previouscountrysearch];
      }
    }
    const updatedRegions: regionsresponse[] = await Promise.all(
      regions.map((region) => {
        if (region.name === regionName) {
          const allChecked = !region.checked;
          if (!allChecked) {
            region.Country.forEach((country) => {
              country.checked = false;
              updatedCountries = updatedCountries.filter(
                (countries) => countries !== country.name,
              );
            });
          } else {
            region.Country.forEach((country) => {
              country.checked = true;
              updatedCountries.push(country.name);
            });
          }

          return {
            ...region,
            checked: allChecked,
          };
        } else {
          return region;
        }
      }),
    );
    setSelectedCountries(updatedCountries);
    onRegionChange(updatedCountries);
    // localStorage.setItem("regionCheckboxFilter", JSON.stringify(updatedCountries));
    localStorage.setItem("previouscountrysearch", JSON.stringify(updatedCountries));
    localStorage.setItem("regionCheckboxFilter", JSON.stringify(updatedRegions));
    setRegions(updatedRegions);
  };

  //
  const [eventToggle, setEventsToggle] = useState<boolean>(true)
  const handleEventsCheck = (eventName: string, eventId: number, isChecked: boolean) => {
    const currentSelectedEvents = [...SelectedEvents];
    let updatedEvents: SelectedEvent[];
    if (isChecked) {
      updatedEvents = [...currentSelectedEvents, { id: eventId, name: eventName }];
    } else {
      updatedEvents = currentSelectedEvents.filter(event => event.id !== eventId);
    }
    // Update localStorage
    localStorage.setItem("StoredEvents", JSON.stringify(updatedEvents));
    setCurrentSelectedEvents(updatedEvents);
  };

  const handleCountryCheckboxChange = (
    regionName: string,
    countryId: number,
  ) => {
    let updatedCountries = [...selectedCountries];
    if (updatedCountries.length <= 0) {
      let previouscountrysearch = "";
      const LocalPrevCountrySearch = localStorage.getItem("previouscountrysearch");
      if (LocalPrevCountrySearch) {
        previouscountrysearch = JSON.parse(LocalPrevCountrySearch);
        updatedCountries = [...previouscountrysearch];
      }
    }
    const updatedRegions: regionsresponse[] = regions.map((region) => {
      if (region.name === regionName) {
        const updatedCountry = region.Country.map((country) => {
          if (country.id === countryId) {
            const isSelected = selectedCountries.includes(country.name);
            if (isSelected) {
              updatedCountries = selectedCountries.filter(
                (countries) => countries !== country.name,
              );
            } else {
              updatedCountries.push(country.name);
            }
            return {
              ...country,
              checked: !country.checked,
            };
          } else {
            return country;
          }
        });

        // const allChecked = updatedCountry.every((country) => country.checked);

        return {
          ...region,
          // checked: allChecked,
          Country: updatedCountry,
        };
      } else {
        return region;
      }
    });

    setSelectedCountries(updatedCountries);
    onRegionChange(updatedCountries);
    setRegions(updatedRegions);
    localStorage.setItem("previouscountrysearch", JSON.stringify(updatedCountries));
    localStorage.setItem("regionCheckboxFilter", JSON.stringify(updatedRegions));
  };

  // const handleServicesCheckboxChange = (serviceNames: string[], type: number = 0, isChecked: boolean = true) => {
  //   if ((type == 1 || type == 2) && isChecked) {
  //     let checkedService: string = "";
  //     let checkedCapability: string = "";
  //     if (type == 1) {
  //       checkedService = serviceNames[0];
  //     } else {
  //       checkedCapability = serviceNames[0];
  //     }
  //     authFetcher(`${getEndpointUrl(ENDPOINTS.addTheSearchedServiceInStats(user.id, checkedService, checkedCapability, false))}`);
  //   }
  //   let updatedServices = [...selectedServices];
  //   if (updatedServices.length <= 0) {
  //     let previousServiceSearch = "";
  //     const localPrevServiceSearch = localStorage.getItem("previousServiceSearches")
  //     if (localPrevServiceSearch) {
  //       previousServiceSearch = JSON.parse(localPrevServiceSearch);
  //       updatedServices = [...previousServiceSearch]
  //     }
  //   }
  //   let removedServices: string[] = [];

  //   serviceNames.forEach((serviceName) => {
  //     if (!removedServices.includes(serviceName)) {
  //       const isSelected = updatedServices.includes(serviceName);

  //       if (isSelected) {
  //         for (let i = 0; i < services.length; i++) {
  //           if (services[i].serviceName == serviceName) {
  //             const serviceIndex = i;

  //             services[serviceIndex].capabilities.forEach((capabilityName) => {
  //               updatedServices = updatedServices.filter(
  //                 (serviceName) =>
  //                   serviceName !== capabilityName.capabilityName,
  //               );
  //               removedServices.push(capabilityName.capabilityName);
  //             });

  //             break;
  //           }
  //         }

  //         updatedServices = updatedServices.filter(
  //           (service) => service !== serviceName,
  //         );
  //         removedServices.push(serviceName); // Add removed service
  //       } else {
  //         updatedServices.push(serviceName);
  //       }
  //     }
  //   });
  //   localStorage.setItem("previousServiceSearches", JSON.stringify(updatedServices));
  //   setSelectedServices(updatedServices);

  // };

  const handleRemoveCountryCheckboxChange =
    (countrynames: string[]) => {
      let updatedCountries = [...selectedCountries];
      if (updatedCountries.length <= 0) {
        let previouscountrysearch = "";
        const LocalPrevCountrySearch = localStorage.getItem("previouscountrysearch");
        if (LocalPrevCountrySearch) {
          previouscountrysearch = JSON.parse(LocalPrevCountrySearch);
          updatedCountries = [...previouscountrysearch];
        }
      }
      const updatedRegions: regionsresponse[] = regions.map((region) => {
        const updatedCountry = region.Country.map((country) => {
          if (countrynames.includes(country.name)) {
            updatedCountries = updatedCountries.filter(
              (countries) => countries !== country.name,
            );
            return {
              ...country,
              checked: !country.checked,
            };
          } else {
            return country;
          }
        });

        //  const allChecked = updatedCountry.every((country) => country.checked);

        return {
          ...region,
          // checked: allChecked,
          Country: updatedCountry,
        };
      });
      setSelectedCountries(updatedCountries);
      onRegionChange(updatedCountries);
      for(const region of updatedRegions) {
        const isCheckedCountry = region.Country.find((item) => item.checked);
        if(isCheckedCountry) {
          region.checked = true
        } else {
          region.checked = false;
        }
      }
      setRegions(updatedRegions);
    }

  const handleCompanySizeCheckboxChange =
    (companysizes: string[]) => {
      let updatedCompanySizes = [...selectedCompanySizes];
      companysizes.forEach((comp_size) => {
        const isSelected = updatedCompanySizes.includes(comp_size);
        if (isSelected) {
          updatedCompanySizes = updatedCompanySizes.filter(
            (filtercomp_sizes) => filtercomp_sizes !== comp_size,
          );
        } else {
          updatedCompanySizes.push(comp_size);
        }
      });
      localStorage.setItem("oldCompanySizes", JSON.stringify(updatedCompanySizes))
      setSelectedCompanySizes(updatedCompanySizes);
      onCompanysizeChange(updatedCompanySizes);
    }

  const handlePlatformCheckboxChange =
    (selectedChekboxed: SelectedPlatformsType[]) => {
      let updatedPlatforms = [...selectedPlatforms];
      selectedChekboxed.forEach((platform) => {
        const isSelected = updatedPlatforms.some(
          (selected) => selected.id === platform.id && selected.name === platform.name
        );
        if (isSelected) {
          updatedPlatforms = updatedPlatforms.filter(
            (removedPlatform) => removedPlatform.id !== platform.id,
          );
        } else {
          updatedPlatforms.push(platform);
        }
      });
      SetSelectedPlatforms(updatedPlatforms);
      localStorage.setItem("oldPlatforms", JSON.stringify(updatedPlatforms))
      handlePlatformChange(updatedPlatforms);
    }

  useEffect(() => {
    // handleServicesCheckboxChange(removedsearchvalues || []);
    if (removedsearchvalues) {
      const Categories = Object.keys(removedsearchvalues)
      Categories?.forEach((removedCatValue) => {
        if (removedsearchvalues[removedCatValue] && removedsearchvalues[removedCatValue][0] == "" && removedsearchvalues[removedCatValue].length > 0 && removedCatValue in selectedServiceCapabilities) {
          let { serviceId, capabilityId } = getIndexValuesOfRemoved(removedCatValue, "");
          handleCapabilityChange(removedCatValue, "", false, serviceId, Number(capabilityId));

        } else {
          removedsearchvalues[removedCatValue].forEach((removedCapability) => {
            let { serviceId, capabilityId } = getIndexValuesOfRemoved(removedCatValue, removedCapability);
            handleCapabilityChange(removedCatValue, removedCapability, false, serviceId, Number(capabilityId));
          })
        }
        //
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedsearchvalues]);

  //
  useEffect(() => {
    if (handleCapabilityChangeValues?.serviceName) {
      handleCapabilityChange(handleCapabilityChangeValues?.serviceName, handleCapabilityChangeValues?.capability, true, handleCapabilityChangeValues?.serviceId, handleCapabilityChangeValues?.capabilityId)
      // handleServicesCheckboxChange([handleCapabilityChangeValues?.serviceName], 1, true);
    }
  }, [handleCapabilityChangeValues])

  // Function to remove either a category or subcategory based on its name
  const getIndexValuesOfRemoved = (removedServiceName: string, removedCapability: string) => {
    const categories = Object.keys(selectedServiceCapabilities);
    const categoriyIds = Object.keys(selectedIdServiceCapabilities);
    if ((!removedCapability || removedCapability == "") && categories.includes(removedServiceName)) {
      const categoryIndex = categories.indexOf(removedServiceName);
      return { serviceId: categoriyIds[categoryIndex], capabilityId: 0 }
    } else {
      const mappedData = categories.filter((cats) => cats != "").map((serviceName, index) => {
        if (serviceName == removedServiceName) {
          const capabilityIndex = selectedServiceCapabilities[serviceName].filter((capability) => capability != "").findIndex(capability => capability === removedCapability);

          // Check if capabilityIndex is valid (-1 means not found)
          const capabilityId = capabilityIndex !== -1 ? selectedIdServiceCapabilities[categoriyIds[index]].filter((empty) => empty != "")[Number(capabilityIndex)] : -1;
          if (capabilityId && Number(capabilityId) != -1) {
            return { serviceId: categoriyIds[index], capabilityId };
          }
        }
      });
      if (mappedData) {
        const newmappedData = mappedData.filter((removeEmpty) => removeEmpty?.capabilityId);
        if (newmappedData && newmappedData[0]) {
          return { serviceId: newmappedData[0].serviceId, capabilityId: newmappedData[0].capabilityId }
        } else {
          return { serviceId: 0, capabilityId: 0 }
        }

      } else {
        return { serviceId: 0, capabilityId: 0 }
      }

    }

  }


  useEffect(() => {
    handleRemoveCountryCheckboxChange(removedregionsearchvalues || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedregionsearchvalues]);

  useEffect(() => {
    if (removedcompanysizesearchvalues != undefined) {
      handleCompanySizeCheckboxChange(removedcompanysizesearchvalues || []);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedcompanysizesearchvalues]);

  const [isServiceVisible, setIsServiceVisible] = useState(true);
  const serviceToggle = () => {
    setIsServiceVisible(!isServiceVisible);
  };
  const [isCountryVisible, setIsCountryVisible] = useState(false);
  const countryToggle = () => {
    setIsCountryVisible(!isCountryVisible);
  };
  const [isCompanyVisible, setIsCompanyVisible] = useState(false);
  const [isPlatformVisible, setIsPlatformVisible] = useState(false);
  const companyToggle = () => {
    setIsCompanyVisible(!isCompanyVisible);
  };

  useEffect(() => {
    const oldCompanySizes = localStorage.getItem("oldCompanySizes");
    if (oldCompanySizes) {
      handleCompanySizeCheckboxChange(JSON.parse(oldCompanySizes));
    }

    const StoredServicesId = localStorage.getItem("selectedIdServiceCapabilities")
    if (StoredServicesId) {
      setSelectedIdServiceCapabilities(JSON.parse(StoredServicesId));
      onCapabilityChange(JSON.parse(StoredServicesId));
    }

    const storedServicesNames = localStorage.getItem("selectedServiceCapabilities");
    if (storedServicesNames) {
      setSelectedServiceCapabilities(JSON.parse(storedServicesNames));
      onSearchChange(JSON.parse(storedServicesNames));
    }
    const LocalPlatformValues = localStorage.getItem("oldPlatforms");
    if (LocalPlatformValues) {
      SetSelectedPlatforms(JSON.parse(LocalPlatformValues));
      handlePlatformChange(JSON.parse(LocalPlatformValues));
    }
  }, [])
  const handleCapabilityChange = (serviceName: any, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number) => {
    if (typeof (serviceId) == 'string' && !serviceId?.includes('a')) {
      serviceId = serviceId + 'a';
    } else if (typeof (serviceId) == 'number') {
      serviceId = serviceId + 'a';
    }
    setSelectedServiceCapabilities(prev => {
      let newCapabilities: { [serviceName: string]: string[] } = {};
      if (Object.keys(prev).length <= 0) {
        if (localStorage.getItem("selectedServiceCapabilities")) {
          const LocalStorageValue = localStorage.getItem("selectedServiceCapabilities")
          const localExistingValue = LocalStorageValue ? JSON.parse(LocalStorageValue) : {};
          newCapabilities = { ...localExistingValue }
        }
      } else {
        newCapabilities = { ...prev };
      }
      if (isChecked) {
        if (newCapabilities[serviceName]) {
          if (capability) {
            newCapabilities[serviceName] = [...newCapabilities[serviceName], capability];
          } else {
            newCapabilities[serviceName] = [...newCapabilities[serviceName], ''];
          }

        } else {
          newCapabilities[serviceName] = [capability];
        }
      } else {
        if (newCapabilities[serviceName]) {
          if (!capability) {
            delete newCapabilities[serviceName]
          } else {
            newCapabilities[serviceName] = newCapabilities[serviceName].filter(cap => cap !== capability);
            if (newCapabilities[serviceName].length === 0) {
              delete newCapabilities[serviceName];
            }
          }
        }

      }
      onCapabilityChange(newCapabilities);
      localStorage.setItem("selectedServiceCapabilities", JSON.stringify(newCapabilities));
      onSearchChange(newCapabilities);
      return newCapabilities;
    });
    if (serviceId) {
      setSelectedIdServiceCapabilities(prev => {
        let newCapabilitiesId: { [serviceId: string]: string[] } = {};
        if (Object.keys(prev).length <= 0) {
          if (localStorage.getItem("selectedIdServiceCapabilities")) {
            const LocalStorageValue = localStorage.getItem("selectedIdServiceCapabilities")
            const localExistingValue = LocalStorageValue ? JSON.parse(LocalStorageValue) : {};
            newCapabilitiesId = { ...localExistingValue }
          }
        } else {
          newCapabilitiesId = { ...prev };
        }
        if (isChecked) {
          if (newCapabilitiesId[serviceId.toString()]) {
            if (capabilityId) {
              newCapabilitiesId[serviceId.toString()] = [...newCapabilitiesId[serviceId.toString()], capabilityId.toString()];
            } else {
              newCapabilitiesId[serviceId.toString()] = [...newCapabilitiesId[serviceId.toString()], ''];
            }

          } else {
            newCapabilitiesId[serviceId.toString()] = [capability];
          }
        } else {
          if (newCapabilitiesId[serviceId.toString()]) {
            if (!capabilityId) {
              delete newCapabilitiesId[serviceId.toString()]
            } else {
              newCapabilitiesId[serviceId.toString()] = newCapabilitiesId[serviceId.toString()].filter(cap => cap !== capabilityId.toString());
              if (newCapabilitiesId[serviceId.toString()].length === 0) {
                delete newCapabilitiesId[serviceId.toString()];
              }
            }
          }
        }
        onCapabilityChange(newCapabilitiesId);
        localStorage.setItem("selectedIdServiceCapabilities", JSON.stringify(newCapabilitiesId));
        return newCapabilitiesId;
      });
    }
  }

  //Events
  useEffect(() => {
    if (removedEventsValues) {
    //  removedEventsValues.forEach((EventId) => {
    //    handleEventsCheck("", EventId, false)
    //  })
    }
  }, [removedEventsValues]);
  //Platform
  useEffect(() => {
    if (removedPlatformValues) {
      handlePlatformCheckboxChange(removedPlatformValues)
    }
  }, [removedPlatformValues]);
  return (
    <>
      <aside
        id="sidebar-multi-level-sidebar"
        className="relative  w-60 box_shadow transition-transform -translate-x-full sm:translate-x-0 lg:flex sm:hidden xs_mobile_hide"
        aria-label="Sidebar"
      >
        {!loader ? <div className="top-0 w-full items-center flex justify-center h-[25%] bg-gray-transparent-100"><Spinner></Spinner></div> :
          <div className="w-60">
            <div className="h-ful w-full">
              <div className="pt-6 pb-6">
                {eventsList.length > 0 &&
                  <div className="">
                    <button
                      onClick={() => setEventsToggle((prev) => !prev)}
                      data-dropdown-toggle="dropdownDefaultCheckbox"
                      className="text-gray font-bold rounded-lg text-sm px-5 py-0 text-center inline-flex items-center w-full relative"
                      type="button"
                    >
                      Events
                      {eventToggle ? (
                        <svg
                          className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 10 6"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 4 4 4-4"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 10 6"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="m1 1 4 4 4-4"
                          />
                        </svg>
                      )}
                    </button>
                    {eventToggle && (
                      <div
                        id="dropdownDefaultCheckboxregions"
                        className="z-10  bg-white divide-y divide-gray-100 rounded-lg px-2.5"
                      >
                        <ul className="p-3 pt-0 pb-0 space-y-3 mt-3 text-sm text-gray-700 relative ul_before_border service_line_bg">
                          {eventsList.map((events, index) => (
                            <li key={`regions_service${index}`}>
                              <div key={events.eventName} className="flex items-center">
                                <input
                                  id={`checkbox-item-region-${events.eventName + index}`}
                                  type="checkbox"
                                  onChange={(e) => {
                                    handleEventsCheck(events.eventName, events.id, e.target.checked);
                                  }}
                                  disabled={SelectedEvents && SelectedEvents.some((event) => event.id != events.id)}
                                  checked={SelectedEvents.some((event) => event.id == events.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                />
                                <label
                                  htmlFor={`checkbox-item-region-${events.eventName + index
                                    }`}
                                  className="ms-2 text-sm  default_text_color "
                                >
                                  {events.eventName}
                                </label>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                }
                <div className="services pt-2">
                  <button
                    onClick={serviceToggle}
                    data-dropdown-toggle="dropdownDefaultCheckbox"
                    className="text-gray font-bold rounded-lg text-sm px-5 py-0 text-center inline-flex items-center w-full relative"
                    type="button"
                  >
                    Services
                    {isServiceVisible ? (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    )}
                  </button>
                  {isServiceVisible && (
                    <div
                      id="dropdownDefaultCheckboxservices"
                      className={`z-10  bg-white  divide-gray-100 rounded-lg px-2.5`}
                    >
                      <div className="flex list_group_13 font-semibold pt-3 justify-around">
                        <span className="opacity-80">List:</span>

                        <span onClick={() => { setIsAtoZClicked(false), setServices(unsortedServices) }} className={`cursor-pointer ${!isAtoZClicked && 'link_color underline'}`}>Categories</span>
                        <span className={`cursor-pointer  ${isAtoZClicked && 'link_color underline'}`} onClick={() => { setIsAtoZClicked(true), setServices(sortedServices) }}>A-Z</span>
                      </div>
                      <ul className="pt-0 space_y_3 mt-3 text-sm text-gray-700" key={`service_ul`}>

                        {services.map((service: ServiceCapabilities, sIndex) => (
                          <>
                            {!isAtoZClicked && (sIndex === 0 || service.categoryId !== services[sIndex - 1].categoryId) ? (
                              <li key={`servicesname_${sIndex}`} className={`pl-3 relative ul_before_border ${!isAtoZClicked && (service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg'))))}`}><div className={`service_label text-sm bg_${serviceColoring[service.categoryId]}`}>
                                {service.serviceCategories.name}
                              </div></li>
                            ) : null}
                            <li key={`main_services_` + sIndex} className={`pl-3 relative ul_before_border ${!isAtoZClicked && (service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg'))))}`}>
                              <div className="flex items-center">
                                <input
                                  id={`checkbox-service-${service.id}`}
                                  type="checkbox"
                                  value={service.id}
                                  className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                  // {...register(`service`)}
                                  name={service.serviceName}
                                  //  checked={service.isChecked}
                                  onChange={(e) => {
                                    handleCapabilityChange(service.serviceName, "", e.target.checked, service.id, 0)
                                    // handleServicesCheckboxChange([
                                    //   service.serviceName,
                                    // ], 1, e.target.checked)
                                  }
                                  }
                                  checked={Object.keys(selectedIdServiceCapabilities).includes((service.id + 'a'))}
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
                                  {Object.keys(selectedIdServiceCapabilities).includes((service.id + 'a').toString())
                                    ? service.capabilities.map(
                                      (
                                        capability: {
                                          id: number;
                                          capabilityName: string;
                                          isChecked: boolean;
                                        },
                                        cIndex,
                                      ) => (
                                        <ul
                                          className="ps-8 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200"
                                          key={`mobileservices${service.serviceName + cIndex
                                            }`}
                                        >
                                          <li key={cIndex}>
                                            <div className="flex items-center">

                                              <input
                                                id={`checkbox-capability-${capability.id}`}
                                                type="checkbox"
                                                value={capability.id}
                                                name={capability.capabilityName}
                                                className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                                // {...register("capability")}
                                                checked={selectedIdServiceCapabilities[service.id + 'a'] &&
                                                  selectedIdServiceCapabilities[service.id + 'a'].includes((capability.id).toString())
                                                }
                                                onChange={(e) => {
                                                  handleCapabilityChange(service.serviceName, capability.capabilityName, e.target.checked, service.id, capability.id)
                                                  // handleServicesCheckboxChange([
                                                  //   capability.capabilityName,
                                                  // ], 2, e.target.checked)
                                                }
                                                }
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
                          </>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="platforms pt-2">
                  <button
                    onClick={() => setIsPlatformVisible((prev) => !prev)}
                    data-dropdown-toggle="dropdownDefaultCheckbox"
                    className="text-gray font-bold rounded-lg text-sm px-5 py-0 text-center inline-flex items-center w-full relative"
                    type="button"
                  >
                    Platforms
                    {isPlatformVisible ? (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    )}
                  </button>
                  {isPlatformVisible && (
                    <div
                      id="dropdownDefaultCheckboxcompanysize"
                      className="z-10  bg-white divide-y divide-gray-100 rounded-lg px-2.5"
                    >
                      <ul className="p-3 space-y-3 text-sm text-gray-700 relative ul_before_border">
                        {platforms.map(
                          (platform: SelectedPlatformsType, index) => (
                            platform.name != "Not Applicable" && 
                            <li key={`company_platforms_${platform.id + index}`}>
                              <div
                                key={`platform_div_${platform.id + index}`}
                                className="flex items-center"
                              >
                                <input
                                  id={`companypaltform_${platform.id + index}`}
                                  key={platform.id + index}
                                  type="checkbox"
                                  checked={selectedPlatforms.some(
                                    (selected) => selected.id === platform.id && selected.name === platform.name
                                  )}
                                  value={platform.id}
                                  onClick={() =>
                                    handlePlatformCheckboxChange(
                                      [{ id: platform.id, name: platform.name }]
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                />
                                <label
                                  htmlFor={`companypaltform_${platform.id + index}`}
                                  className="ms-2 text-sm font-medium default_text_color "
                                >
                                  {platform.name}
                                </label>
                              </div>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="region_country pt-2">
                  <button
                    onClick={countryToggle}
                    data-dropdown-toggle="dropdownDefaultCheckbox"
                    className="text-gray font-bold rounded-lg text-sm px-5 py-0 text-center inline-flex items-center w-full relative"
                    type="button"
                  >
                    Regions & Countries
                    {isCountryVisible ? (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    )}
                  </button>
                  {isCountryVisible && (
                    <div
                      id="dropdownDefaultCheckboxregions"
                      className="z-10  bg-white divide-y divide-gray-100 rounded-lg px-2.5"
                    >
                      <ul className="p-3 pt-0 space-y-3 mt-3 text-sm text-gray-700 relative ul_before_border service_line_bg">
                        {regions.map((regions: regionsresponse, index) => (
                          <li key={`regions_service${index}`}>
                            <div key={regions.name} className="flex items-center">
                              <input
                                id={`checkbox-item-region-${regions.name + index}`}
                                type="checkbox"
                                onChange={() => {
                                  handleRegionCheck(regions.name);
                                }}
                                checked={regions.checked}
                                className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                              />
                              <label
                                htmlFor={`checkbox-item-region-${regions.name + index
                                  }`}
                                className="ms-2 text-sm  default_text_color "
                              >
                                {regions.name}
                              </label>
                            </div>
                            {regions.checked
                              ? regions.Country.map(
                                (
                                  countries: {
                                    id: number;
                                    name: string;
                                    checked: boolean;
                                  },
                                  index,
                                ) => (
                                  <ul className="ps-4 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                                    <li key={`country_services_list_${index}`}>
                                      <div
                                        key={`country_services_div_${countries.id}`}
                                        className="flex items-center"
                                      >
                                        <input
                                          id={`checkbox-item-county-${countries.id}`}
                                          type="checkbox"
                                          checked={countries.checked}
                                          onChange={() =>
                                            handleCountryCheckboxChange(
                                              regions.name,
                                              countries.id,
                                            )
                                          }
                                          className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                        />
                                        <label
                                          htmlFor={`checkbox-item-county-${countries.id}`}
                                          className="ms-2 text-sm  default_text_color "
                                        >
                                          {countries.name}
                                        </label>
                                      </div>
                                    </li>
                                  </ul>
                                ),
                              )
                              : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="compant_sizes pt-2">
                  <button
                    onClick={companyToggle}
                    data-dropdown-toggle="dropdownDefaultCheckbox"
                    className="text-gray font-bold rounded-lg text-sm px-5 py-0 text-center inline-flex items-center w-full relative"
                    type="button"
                  >
                    Company Size
                    {isCompanyVisible ? (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_180"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-2.5 h-2.5 me-6 mt-1.5 absolute right-0 rotation_icon_0"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="m1 1 4 4 4-4"
                        />
                      </svg>
                    )}
                  </button>
                  {isCompanyVisible && (
                    <div
                      id="dropdownDefaultCheckboxcompanysize"
                      className="z-10  bg-white divide-y divide-gray-100 rounded-lg px-2.5"
                    >
                      <ul className="p-3 space-y-3 text-sm text-gray-700 relative ul_before_border">
                        {companysizes.map(
                          (companysize: companysizeresponse, index) => (
                            <li key={`company_list_${companysize.id + index}`}>
                              <div
                                key={`company_div_${companysize.id + index}`}
                                className="flex items-center"
                              >
                                <input
                                  id={`companysize_${companysize.id + index}`}
                                  key={companysize.id + index}
                                  type="checkbox"
                                  checked={selectedCompanySizes.includes(
                                    companysize.size,
                                  )}
                                  value={companysize.id}
                                  onClick={() =>
                                    handleCompanySizeCheckboxChange([
                                      companysize.size,
                                    ])
                                  }
                                  className="w-4 h-4 text-blue-600   border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                />
                                <label
                                  htmlFor={`companysize_${companysize.id + index}`}
                                  className="ms-2 text-sm font-medium default_text_color "
                                >
                                  {companysize.size}
                                </label>
                              </div>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        }
      </aside>
    </>
  );
};
export default Servicessidenavbar;
