import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { serviceColoring } from "@/constants/serviceColors";
import { fetcher } from "@/hooks/fetcher";
import { ServiceCapabilities } from "@/types/companies.type";
import {
  regionsresponse,
  companysizeresponse,
  SelectedPlatformsType,
  MobileViewServiceProviderSideBarProps,
} from "@/types/serviceprovidersidebar.type";
import { Accordion, Button, Modal } from "flowbite-react";
import { useEffect, useState } from "react";

interface SelectedEvent {
  id: number;
  name: string;
}


const MobileViewServiceProviderSideBar: React.FC<
  MobileViewServiceProviderSideBarProps
> = ({
  openServiceModal,
  setOpenServiceModal,
  onSearchChange,
  onCapabilityChange,
  onRegionChange,
  onCompanysizeChange,
  handlePlatformChange,
  removedsearchvalues,
  removedregionsearchvalues,
  removedcompanysizesearchvalues,
  removedEventsValues,
  handleCapabilityChangeValues,
  removedPlatformValues,
  setCurrentSelectedEvents,
}) => {
    const [services, setServices] = useState<ServiceCapabilities[]>([]);
    const [regions, setRegions] = useState<regionsresponse[]>([]);
    const [companysizes, setCompanysizes] = useState([]);
    const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
    const [selectedCompanySizes, setSelectedCompanySizes] = useState<string[]>(
      [],
    );
    const [mobileSelectedServices, setMobileSelectedServices] = useState<
      string[]
    >([]);
    //mobile code
    const [isMobile, setIsMobile] = useState(false);
    //
    const [selectedServiceCapabilities, setSelectedServiceCapabilities] = useState<{ [serviceName: string]: string[] }>({});
    //
    const [selectedIdServiceCapabilities, setSelectedIdServiceCapabilities] = useState<{ [serviceName: string]: string[] }>({});
    const [sortedServices, setSortedServices] = useState<ServiceCapabilities[]>([]);
    const [unsortedServices, setUnSortedServices] = useState<ServiceCapabilities[]>([]);
    //
    const [eventsList, setEventsList] = useState<{ eventName: string, id: number }[]>([]);
    const [selectedEvents, setSelectedEvents] = useState<SelectedEvent[]>([]);
    const [isAtoZClicked, setIsAtoZClicked] = useState<boolean>(false);
    //platforms
    const [selectedPlatforms, SetSelectedPlatforms] = useState<SelectedPlatformsType[]>([])
    const [platforms, SetPlatforms] = useState<SelectedPlatformsType[]>([])
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      handleResize();

      window.addEventListener("resize", handleResize);
      if (window.innerWidth < 768) {
        function setPreviousValues() {
          const previousServiceSearch = localStorage.getItem("previousServiceSearches");
          let updatedServices: any[] = [];
          if (previousServiceSearch) {
            updatedServices = JSON.parse(previousServiceSearch);
          }
          setMobileSelectedServices(updatedServices);
          // onSearchChange(updatedServices)

          //
          const oldCompanySizes = localStorage.getItem("oldCompanySizes");
          if (oldCompanySizes) {
            setSelectedCompanySizes(JSON.parse(oldCompanySizes));
          }
          //
          const oldPlatforms = localStorage.getItem("oldPlatforms");
          if (oldPlatforms) {
            SetSelectedPlatforms(JSON.parse(oldPlatforms));
            handlePlatformChange(JSON.parse(oldPlatforms));
          }
          const oldEvents = localStorage.getItem("StoredEvents");
          if (oldEvents) {
            setSelectedEvents(JSON.parse(oldEvents));
            setCurrentSelectedEvents(JSON.parse(oldEvents))
          }
        }
        setTimeout(() => {
          setPreviousValues()
        }, 1000);
      }
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);
    useEffect(() => {
      // async function getservices() {
      //   try {
      //     const serviceslist = await fetcher(
      //       getEndpointUrl(ENDPOINTS.getserviceslist),
      //     );
      //     if (serviceslist.success) {
      //       setServices(serviceslist.list);
      //     } else {
      //       console.log(
      //         `Api Responded with statuscode ${serviceslist.statuscode}`,
      //       );
      //     }
      //   } catch (error) {
      //     console.log(`Api Responded Error: ${error}`);
      //   }
      // }

      async function getservices() {
        try {
          const serviceslistResp = await fetcher(
            getEndpointUrl(ENDPOINTS.getServiceAndCapabilities),
          );
          if (serviceslistResp.success) {
            const servicesList = serviceslistResp.data;
            const updatedServiceAndCapabilities: ServiceCapabilities[] =
              servicesList.map((service: ServiceCapabilities) => ({
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

            servicesList.sort((a: any, b: any) => {
              if (a.serviceName < b.serviceName) {
                return -1;
              }
              if (a.serviceName > b.serviceName) {
                return 1;
              }
              return 0;
            });
            setSortedServices(servicesList);

          } else {
            console.log(
              `Api Responded with statuscode ${serviceslistResp.statuscode}`,
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

      getservices();
      getregions();
      getcompanysizes();
      getPlatForms();
      getEvents();
    }, []);

    const handleServicesCheckboxChange = (
      serviceNames: string[],
      removeType: string,
    ) => {
      if (isMobile) {
        handleMobileServicesChange(serviceNames, removeType);
      }
    };

    const handleMobileServicesChange = (
      serviceNames: string[],
      removeType: string,
    ) => {
      // let updatedServices: string[] = [...mobileSelectedServices];
      // let capabilitiesNotRemoved: string[] = [];

      // if (updatedServices.length <= 0) {
      //   let previousServiceSearch = "";
      //   const localPrevServiceSearch = localStorage.getItem("previousServiceSearches")
      //   if (localPrevServiceSearch) {
      //     previousServiceSearch = JSON.parse(localPrevServiceSearch);
      //     updatedServices = [...previousServiceSearch]
      //   }
      // }


      // serviceNames.forEach((serviceName) => {
      //   if (
      //     capabilitiesNotRemoved.length <= 0 ||
      //     capabilitiesNotRemoved.includes(serviceName)
      //   ) {
      //     const isSelected = updatedServices.includes(serviceName);

      //     if (isSelected) {
      //       const service = services.find(
      //         (service) => service.serviceName === serviceName,
      //       );

      //       if (service) {
      //         service.capabilities.forEach((capability) => {
      //           updatedServices = updatedServices.filter(
      //             (service) => service !== capability.capabilityName,
      //           );
      //         });
      //       }

      //       updatedServices = updatedServices.filter(
      //         (service) => service !== serviceName,
      //       );
      //       capabilitiesNotRemoved = [...updatedServices];
      //     } else if (removeType !== "removevaluefrommobile") {
      //       updatedServices.push(serviceName);
      //     }
      //   }
      // });

      // if (removeType === "removevaluefrommobile") {
      //   updateSelectedServices(updatedServices);
      // }
      // localStorage.setItem("previousServiceSearches", JSON.stringify(updatedServices));
      // setMobileSelectedServices(updatedServices);

    };

    const updateSelectedServices = (updatedServices: string[]) => {
      //  onSearchChange(updatedServices);
    };
    const handleCountryCheckboxChange = (
      regionName: string,
      countryId: number,
    ) => {
      let updatedCountries = [...selectedCountries];
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
      // onRegionChange(updatedCountries);
      setRegions(updatedRegions);
    };
    //handler methods
    const handleRegionCheck = async (regionName: string) => {
      let updatedCountries = [...selectedCountries];
      const updatedRegions: regionsresponse[] = await Promise.all(
        regions.map((region) => {
          if (region.name === regionName) {
            const allChecked = !region.checked;
            if (!allChecked) {
              region.Country.forEach((country) => {
                updatedCountries = updatedCountries.filter(
                  (countries) => countries !== country.name,
                );
              });
            } else {
              let updatedCountries = [];
              region.Country.forEach((country) => {
                updatedCountries.push((country.checked = false));
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
      setRegions(updatedRegions);
      // onRegionChange(updatedCountries);
    };

    const handleCompanySizeCheckboxChange = (
      companysizes: string[],
      companySizeType: string = "",
    ) => {
      let updatedCompanySizes = [...selectedCompanySizes];

      if (updatedCompanySizes.length <= 0) {
        let LocalPrevCountrySizeSearch = localStorage.getItem("oldCompanySizes");
        if (LocalPrevCountrySizeSearch) {
          updatedCompanySizes = JSON.parse(LocalPrevCountrySizeSearch);
        }
      }
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
      setSelectedCompanySizes(updatedCompanySizes);
      if (companySizeType === "removedfromsearch") {
        onCompanysizeChange(updatedCompanySizes);
      }
      localStorage.setItem("oldCompanySizes", JSON.stringify(updatedCompanySizes));
    };
    useEffect(() => {
      handleFilterData(true);
    }, [
      removedcompanysizesearchvalues,
      removedregionsearchvalues,
    ]);
    const handleFilterData = (isclreadAll: boolean = false) => {

      if (selectedCompanySizes.length <= 0) {
        let PreviousCompanySizes = [];
        const LocalPreviousCompanySizes = localStorage.getItem("oldCompanySizes");
        if (LocalPreviousCompanySizes) {
          PreviousCompanySizes = JSON.parse(LocalPreviousCompanySizes);
        }
        onCompanysizeChange(PreviousCompanySizes);
        localStorage.setItem("oldCompanySizes", JSON.stringify(PreviousCompanySizes));
      } else {
        onCompanysizeChange(selectedCompanySizes);
        localStorage.setItem("oldCompanySizes", JSON.stringify(selectedCompanySizes));
      }


      if (selectedCountries.length <= 0) {
        let PreviousCountriesSearch = [];
        const LocalPrevCountrySearch = localStorage.getItem("previouscountrysearch");
        if (LocalPrevCountrySearch) {
          PreviousCountriesSearch = JSON.parse(LocalPrevCountrySearch);
        }
        localStorage.setItem("previouscountrysearch", JSON.stringify(PreviousCountriesSearch));
        onRegionChange(PreviousCountriesSearch);

        let PreviousRegionSearch = [];
        const LocalPrevRegionSearch = localStorage.getItem("previouscountrysearch");
        if (LocalPrevRegionSearch) {
          PreviousRegionSearch = JSON.parse(LocalPrevRegionSearch);
        }
        localStorage.setItem("regionCheckboxFilter", JSON.stringify(PreviousRegionSearch));
      } else {
        onRegionChange(selectedCountries);
        localStorage.setItem("previouscountrysearch", JSON.stringify(selectedCountries));
        if (regions.length <= 0) {
          localStorage.setItem("regionCheckboxFilter", JSON.stringify(regions));
        }

      }

      // if (mobileSelectedServices.length <= 0) {
      //   let previousServiceSearch: string[] = [];
      //  const localPrevServiceSearch = localStorage.getItem("previousServiceSearches")
      //  if (localPrevServiceSearch) {
      //    previousServiceSearch = JSON.parse(localPrevServiceSearch);
      //  }
      //  onSearchChange(selectedServiceCapabilities);
      //  localStorage.setItem("previousServiceSearches", JSON.stringify(previousServiceSearch));
      // } else {
      //  onSearchChange(selectedServiceCapabilities);
      //  localStorage.setItem("previousServiceSearches", JSON.stringify(mobileSelectedServices));
      // }


      if (Object.keys(selectedServiceCapabilities).length > 0 && !isclreadAll) {
        localStorage.setItem("selectedServiceCapabilities", JSON.stringify(selectedServiceCapabilities));
        const newObj: {} = { ...selectedServiceCapabilities }
        onCapabilityChange(newObj);
        onSearchChange(newObj)
      } else {
        localStorage.setItem("selectedServiceCapabilities", JSON.stringify({}));
        onCapabilityChange({});
        onSearchChange({})
      }
      if (Object.keys(selectedIdServiceCapabilities).length > 0 && !isclreadAll) {
        //  onCapabilityChange(selectedIdServiceCapabilities);
        localStorage.setItem("selectedIdServiceCapabilities", JSON.stringify(selectedIdServiceCapabilities));
      } else {
        localStorage.setItem("selectedIdServiceCapabilities", JSON.stringify({}));
      }

      // Events
      if (selectedEvents && selectedEvents.length > 0) {
        localStorage.setItem("StoredEvents", JSON.stringify(selectedEvents));
        const newEvents = [...selectedEvents]
        setCurrentSelectedEvents(newEvents);
      }

      //Platforms
      if (selectedPlatforms && selectedPlatforms.length > 0) {
        localStorage.setItem("oldPlatforms", JSON.stringify(selectedPlatforms));
        handlePlatformChange(selectedPlatforms);
      }


    };

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

          const allChecked = updatedCountry.every((country) => country.checked);

          return {
            ...region,
            checked: allChecked,
            Country: updatedCountry,
          };
        });
        setSelectedCountries(updatedCountries);
        onRegionChange(updatedCountries);
        setRegions(updatedRegions);
        localStorage.setItem("previouscountrysearch", JSON.stringify(updatedCountries));
        localStorage.setItem("regionCheckboxFilter", JSON.stringify(updatedRegions));
      }
    useEffect(() => {
      handleCompanySizeCheckboxChange(
        removedcompanysizesearchvalues || [],
        "removedfromsearch",
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removedcompanysizesearchvalues]);

    useEffect(() => {
      handleRemoveCountryCheckboxChange(removedregionsearchvalues || []);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removedregionsearchvalues]);

    useEffect(() => {
      // handleServicesCheckboxChange(
      //   removedsearchvalues || [],
      //   "removevaluefrommobile",
      // );
      if (removedsearchvalues) {
        const Categories = Object.keys(removedsearchvalues)
        Categories?.forEach((removedCatValue) => {
          if (removedsearchvalues[removedCatValue] && removedsearchvalues[removedCatValue][0] == "" && removedsearchvalues[removedCatValue].length > 0 && removedCatValue in selectedServiceCapabilities) {
            let { serviceId, capabilityId } = getIndexValuesOfRemoved(removedCatValue, "");
            handleCapabilityChange(removedCatValue, "", false, serviceId, Number(capabilityId), true);
          } else {
            removedsearchvalues[removedCatValue].forEach((removedCapability) => {
              let { serviceId, capabilityId } = getIndexValuesOfRemoved(removedCatValue, removedCapability);
              handleCapabilityChange(removedCatValue, removedCapability, false, serviceId, Number(capabilityId), true);
            })

          }
        })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [removedsearchvalues]);

    const handleCapabilityChange = (serviceName: any, capability: string, isChecked: boolean, serviceId: string | number, capabilityId: number, isSetLocalStaorage: boolean = false,) => {
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
                // delete newCapabilities[serviceName];
              }
            }
          }

        }
        if (isSetLocalStaorage) {
          onSearchChange(newCapabilities)
          onCapabilityChange(newCapabilities);
          localStorage.setItem("selectedServiceCapabilities", JSON.stringify(newCapabilities));
        }

        return newCapabilities;
      });

      if (serviceId) {
        setSelectedIdServiceCapabilities(prev => {
          let newCapabilities: { [serviceId: string]: string[] } = {};
          if (Object.keys(prev).length <= 0) {
            if (localStorage.getItem("selectedIdServiceCapabilities")) {
              const LocalStorageValue = localStorage.getItem("selectedIdServiceCapabilities")
              const localExistingValue = LocalStorageValue ? JSON.parse(LocalStorageValue) : {};
              newCapabilities = { ...localExistingValue }
            }
          } else {
            newCapabilities = { ...prev };
          }
          if (isChecked) {
            if (serviceId && newCapabilities && newCapabilities[serviceId] && newCapabilities[serviceId.toString()]) {
              if (capabilityId) {
                newCapabilities[serviceId.toString()] = [...newCapabilities[serviceId.toString()], capabilityId.toString()];
              } else {
                newCapabilities[serviceId.toString()] = [...newCapabilities[serviceId.toString()], ''];
              }

            } else {
              if (serviceId)
                newCapabilities[serviceId.toString()] = [capability];
            }
          } else {
            if (serviceId && newCapabilities[serviceId.toString()]) {
              if (!capabilityId) {
                delete newCapabilities[serviceId.toString()]
              } else {
                newCapabilities[serviceId.toString()] = newCapabilities[serviceId.toString()].filter(cap => cap !== capabilityId.toString());
                if (newCapabilities[serviceId.toString()].length === 0) {
                  delete newCapabilities[serviceId.toString()];
                }
              }
            }

          }

          if (isSetLocalStaorage) {
            onCapabilityChange(newCapabilities);
            localStorage.setItem("selectedIdServiceCapabilities", JSON.stringify(newCapabilities));
          }
          return newCapabilities;
        });
      }
    }

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

    //
    const handleEventsCheck = (eventName: string, eventId: number, isChecked: boolean) => {
      setSelectedEvents((prev) => {
        let updatedEvents;

        if (isChecked) {
          updatedEvents = [...prev, { id: eventId, name: eventName }];
        } else {
          updatedEvents = prev.filter(event => event.id !== eventId);
        }
        return updatedEvents;
      });
    };

    const removeMultipleEvents = (eventIds: number[]) => {
      setSelectedEvents((prev) => {
        let updatedEvents = [...prev];
        eventIds.forEach(eventId => {
          updatedEvents = updatedEvents.filter(event => event.id !== eventId);
        });
        localStorage.setItem("StoredEvents", JSON.stringify(updatedEvents));
        return updatedEvents;
      });
    };

    //Events
    useEffect(() => {
      if (removedEventsValues) {
        removeMultipleEvents(removedEventsValues);
      }
    }, [removedEventsValues]);
    //
    useEffect(() => {
      if (handleCapabilityChangeValues?.serviceName) {
        handleCapabilityChange(handleCapabilityChangeValues?.serviceName, handleCapabilityChangeValues?.capability, true, handleCapabilityChangeValues?.serviceId, handleCapabilityChangeValues?.capabilityId)
        // handleServicesCheckboxChange([handleCapabilityChangeValues?.serviceName], 1, true);
      }
    }, [handleCapabilityChangeValues])

    //Platforms
    const handlePlatformCheckboxChange =
      (selectedChekboxed: SelectedPlatformsType[], ismultipleRemove?:boolean) => {
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
        if(ismultipleRemove){
          handlePlatformChange(updatedPlatforms);
        }
      }
      //Platform
  useEffect(() => {
    if (removedPlatformValues) {
        handlePlatformCheckboxChange(removedPlatformValues, true)
    }
  }, [removedPlatformValues]);
    return (
      <Modal show={openServiceModal} onClose={() => setOpenServiceModal(false)}>
        <Modal.Header className="modal_header">
          <b>Filters</b>
        </Modal.Header>
        <Modal.Body className="px-0  py-4">
          <div className="space-y-6">
            <Accordion collapseAll className="borde">
              {eventsList &&
                <Accordion.Panel>
                  <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                    Events
                  </Accordion.Title>
                  <Accordion.Content>
                    <ul className="p-0 pt-0 space-y-3 mt-0 text-sm text-gray-700 relative ul_before_border service_line_bg">
                      {eventsList.map((events, index) => (
                        <li key={`regions_service${index}`}>
                          <div key={events.eventName} className="flex items-center">
                            <input
                              id={`checkbox-item-region-${events.eventName + index}`}
                              type="checkbox"
                              onChange={(e) => {
                                handleEventsCheck(events.eventName, events.id, e.target.checked);
                              }}
                              checked={selectedEvents.some((event) => event.id == events.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
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
                  </Accordion.Content>
                </Accordion.Panel>}
              <Accordion.Panel>
                <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                  Services
                </Accordion.Title>
                <Accordion.Content>
                  <ul
                    className="space_y_3 text-sm"
                    style={{ height: "200px", overflow: "auto" }}
                  >
                    <div className="flex list_group_13 font-semibold pt-3 justify-around">
                      <span className="opacity-80">List:</span>

                      <span onClick={() => { setIsAtoZClicked(false), setServices(unsortedServices) }} className={`cursor-pointer ${!isAtoZClicked && 'link_color underline'}`}>Categories</span>
                      <span className={`cursor-pointer  ${isAtoZClicked && 'link_color underline'}`} onClick={() => { setIsAtoZClicked(true), setServices(sortedServices) }}>A-Z</span>
                    </div>
                    {services.map((service: ServiceCapabilities, sIndex) => (
                      <>
                        {!isAtoZClicked && (sIndex === 0 || service.categoryId !== services[sIndex - 1].categoryId) ? (
                          <li className={`pl-3 relative ul_before_border ${service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg')))}`}><div className={`service_label text-sm bg_${serviceColoring[service.categoryId]}`}>
                            {service.serviceCategories.name}
                          </div></li>
                        ) : null}
                        <li key={`main_services_` + sIndex} className={`pl-3 relative ul_before_border ${!isAtoZClicked && (service.groupId == 1 ? 'yellow_line_bg' : (service.groupId == 2 ? 'pink_line_bg' : (service.groupId == 3 ? 'blue_line_bg' : (service.groupId == 4 ? 'red_line_bg' : 'green_line_bg'))))}`}>
                          <div className="flex items-center">
                            <input
                              id={`checkbox-service-${service.id}`}
                              type="checkbox"
                              value={service.id}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                              // {...register(`service`)}
                              name={service.serviceName}
                              //  checked={service.isChecked}
                              onChange={(e) => {
                                handleCapabilityChange(service.serviceName, "", e.target.checked, service.id, 0, false),
                                  handleServicesCheckboxChange(
                                    [service.serviceName],
                                    "addservicefrommobile",
                                  )
                              }
                              }
                              checked={Object.keys(selectedServiceCapabilities).includes(
                                service.serviceName,
                              )}
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
                              {Object.keys(selectedIdServiceCapabilities).includes(service.id + 'a')
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
                                      key={`notmobileservices${service.serviceName + cIndex
                                        }`}
                                    >
                                      <li key={cIndex}>
                                        <div className="flex items-center">
                                          <input
                                            id={`checkbox-capability-${capability.id}`}
                                            type="checkbox"
                                            value={capability.id}
                                            name={capability.capabilityName}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                            // {...register("capability")}
                                            checked={selectedServiceCapabilities[service.serviceName].includes(
                                              capability.capabilityName,
                                            )}
                                            onChange={(e) => {
                                              handleCapabilityChange(service.serviceName, capability.capabilityName, e.target.checked, service.id, capability.id), handleServicesCheckboxChange(
                                                [capability.capabilityName],
                                                "addservicefrommobile",
                                              )
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
                </Accordion.Content>
              </Accordion.Panel>
              <Accordion.Panel>
                <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                  Platforms
                </Accordion.Title>
                <Accordion.Content>
                  <ul
                    className="space-y-3 text-sm relative"
                    style={{ height: "150px", overflow: "auto" }}
                  >
                    {platforms.map(
                      (platform: SelectedPlatformsType, index) => (
                        <li key={`company_list_platforms_${platform.id + index}`}>
                          <div
                            key={`company_div_${platform.id + index}`}
                            className="flex items-center"
                          >
                            <input
                              id={`mobile_platforms_${platform.id + index}`}
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
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                            />
                            <label
                              htmlFor={`mobile_platforms_${platform.id + index
                                }`}
                              className="ms-2 text-sm font-medium default_text_color "
                            >
                              {platform.name}
                            </label>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                </Accordion.Content>
              </Accordion.Panel>
              <Accordion.Panel>
                <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                  Regions & Countries
                </Accordion.Title>
                <Accordion.Content>
                  <ul
                    className="space-y-3 text-sm  relative"
                    style={{ height: "200px", overflow: "auto" }}
                  >
                    {regions.map((regions: regionsresponse, index) => (
                      <li key={`regions_service${index}`}>
                        <div key={regions.name} className="flex items-center">
                          <input
                            id={`mobile_checkbox-item-region-${regions.name + index
                              }`}
                            type="checkbox"
                            onChange={() => handleRegionCheck(regions.name)}
                            checked={regions.checked}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                          />
                          <label
                            htmlFor={`mobile_checkbox-item-region-${regions.name + index
                              }`}
                            className="ms-2 text-sm  default_text_color "
                          >
                            {regions.name}
                          </label>
                        </div>
                        {regions.checked &&
                        <ul className="ps-4 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                            {regions.Country.map((countries, index) => (
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
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                                  />
                                  <label
                                    htmlFor={`checkbox-item-county-${countries.id}`}
                                    className="ms-2 text-sm  default_text_color "
                                  >
                                    {countries.name}
                                  </label>
                                </div>
                              </li>
                            ))}
                        </ul>}
                      </li>
                    ))}
                    {/* <li>
                      <div className="flex items-center">
                        <input id="checkbox-item-11" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                        <label htmlFor="checkbox-item-11" className="ms-2 text-sm  default_text_color ">Asia</label>
                      </div>
                      <ul className="ps-4 pt-3 space-y-3 text-sm text-gray-700 dark:text-gray-200">
                        <li>
                          <div className="flex items-center">
                            <input id="checkbox-item-22" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                            <label htmlFor="checkbox-item-22" className="ms-2 text-sm  default_text_color ">China</label>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center">
                            <input id="checkbox-item-33" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                            <label htmlFor="checkbox-item-33" className="ms-2 text-sm  default_text_color ">India</label>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center">
                            <input id="checkbox-item-44" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                            <label htmlFor="checkbox-item-44" className="ms-2 text-sm  default_text_color ">Philippines</label>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center">
                            <input id="checkbox-item-55" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                            <label htmlFor="checkbox-item-55" className="ms-2 text-sm  default_text_color ">Singapore</label>
                          </div>
                        </li>
                        <li>
                          <div className="flex items-center">
                            <input id="checkbox-item-66" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                            <label htmlFor="checkbox-item-66" className="ms-2 text-sm  default_text_color ">Thailand</label>
                          </div>
                        </li>
                      </ul>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <input id="checkbox-item-77" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                        <label htmlFor="checkbox-item-77" className="ms-2 text-sm  default_text_color ">Americas</label>
                      </div>
                    </li>
                    <li>
                      <div className="flex items-center">
                        <input id="checkbox-item-88" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-0 " type="checkbox" value="" />
                        <label htmlFor="checkbox-item-88" className="ms-2 text-sm  default_text_color ">Europe &amp; Middle East</label>
                      </div>
                    </li> */}
                  </ul>
                </Accordion.Content>
              </Accordion.Panel>
              <Accordion.Panel>
                <Accordion.Title className="py-2 rounded-none focus:ring-0 font-bold default_text_color text-sm">
                  Company Size
                </Accordion.Title>
                <Accordion.Content>
                  <ul
                    className="space-y-3 text-sm relative"
                    style={{ height: "150px", overflow: "auto" }}
                  >
                    {companysizes.map(
                      (companysize: companysizeresponse, index) => (
                        <li key={`company_list_${companysize.id + index}`}>
                          <div
                            key={`company_div_${companysize.id + index}`}
                            className="flex items-center"
                          >
                            <input
                              id={`mobile_companysize_${companysize.id + index}`}
                              key={companysize.id + index}
                              type="checkbox"
                              checked={selectedCompanySizes.includes(
                                companysize.size,
                              )}
                              value={companysize.id}
                              onClick={() =>
                                handleCompanySizeCheckboxChange(
                                  [companysize.size],
                                  "removedfrompopup",
                                )
                              }
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                            />
                            <label
                              htmlFor={`mobile_companysize_${companysize.id + index
                                }`}
                              className="ms-2 text-sm font-medium default_text_color "
                            >
                              {companysize.size}
                            </label>
                          </div>
                        </li>
                      ),
                    )}
                  </ul>
                </Accordion.Content>
              </Accordion.Panel>

            </Accordion>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="px-4"
            color="gray"
            onClick={() => setOpenServiceModal(false)}
          >
            {" "}
            Cancel
          </Button>
          <Button
            className="px-4"
            onClick={() => {
              setOpenServiceModal(false), handleFilterData();
            }}
          >
            Apply
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

export default MobileViewServiceProviderSideBar;
