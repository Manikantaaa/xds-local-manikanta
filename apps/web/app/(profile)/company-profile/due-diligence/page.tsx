"use client";

import Breadcrumbs from "@/components/breadcrumb";
import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import { useUserContext } from "@/context/store";
import { redirect } from "next/navigation";
import {
  Button,
  Label,
  Modal,
  Radio,
  Checkbox,
  Select,
  TextInput,
  Textarea,
} from "flowbite-react";
import { FiAlertTriangle } from "react-icons/fi";
import { authFetcher, fetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { Control, useFieldArray, useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import MobileSideMenus from "@/components/mobileSideMenus";
import { isValidJSON } from "@/constants/serviceColors";
import Spinner from "@/components/spinner";
import { sanitizeData } from "@/services/sanitizedata";
import ButtonSpinner from "@/components/ui/buttonspinner";
import usePreventBackNavigation from "@/hooks/usePreventBackNavigation";
import { useProfileStatusContext } from "@/context/profilePercentage";

interface DiligenceAndCertificate {
  id?: number | null;
  companyId: number;
  foundedYear: Date;
  founderName: string;
  foundingStoryDescription: string;
  workModel: string;
  platform: string[];
  gameEngineArray: string[];
  certifications: string;
  security: string;
  tools: string;
  locations: Location[];
}

interface Location {
  location_name: string;
  address1: string;
  address2: string;
  state: string;
  city: string;
  countryId: string;
  zipcode: string;
}

const CertificationsAndDiligence = () => {
  const { user } = useUserContext();

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
  }

  const { setProfilepercentage } = useProfileStatusContext();
  const { profilepercentage } = useProfileStatusContext();

  const [openModal, setOpenModal] = useState(false);
  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [startYear, setStartYear] = useState(new Date());
  const [id, setId] = useState<number | null>();
  const [canRender, setCanRender] = useState(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [inputs, setInputs] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<{id: number, name: string}[]>([]);
  const [newGameEngine, setNewGameEngine] = useState<{ name: string, isChecked: boolean }[]>([]);
  const [editGameEngines, setEditGameEngines] = useState<{ name: string, isChecked: boolean }[]>([]);
  const [inputData, setInputData] = useState<string>("");
  const [hideAdd, setHideAdd] = useState<boolean>(false);
  const [editEnabled, setEditEnabled] = useState<boolean>(false);
  const [disablePlatForms, setDisablePlatForms] = useState<boolean>(false);
  const [disableGameEngines, setDisableGameEngines] = useState<boolean>(false);


  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isDirty },
    reset,
    watch,
    getValues,
  } = useForm<DiligenceAndCertificate>({
    defaultValues: {
      companyId: user.companyId,
      foundedYear: new Date(),
      foundingStoryDescription: "",
      workModel: "onSite",
      platform: [],
      gameEngineArray: [],
      certifications: "",
      security: "",
      tools: "",
      locations: [
        {
          location_name: "",
          address1: "",
          address2: "",
          state: "",
          city: "",
          countryId: "",
          zipcode: "",
        },
      ],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: control as Control<DiligenceAndCertificate>,
    name: "locations",
  });
  useEffect(() => {
    const gameEngineData: { name: string, isChecked: boolean }[] = [];
    ['Unity', 'Unreal', 'Not Applicable'].map((names: string) => {
      gameEngineData.push({ name: names, isChecked: false })
    })
    setNewGameEngine(gameEngineData);
  }, []);

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
      label: PATH.DUE_DILIGENCE.name,
      path: PATH.DUE_DILIGENCE.path,
    },
  ];

  const { success, submitForm } = useCommonPostData<DiligenceAndCertificate>({
    url: getEndpointUrl(ENDPOINTS.saveCertificateAndDiligence),
  });

  useEffect(() => {
    register("foundedYear", { required: true });
    setValue("foundedYear", startYear);
    const getPlatforms = async() => {
      const platformsList = await fetcher(
        getEndpointUrl(ENDPOINTS.getPlatforms),
      );
      if(platformsList.length) {
        const gameEngines = [...platformsList];
        gameEngines.splice(platformsList.length-1, 1);
        setPlatforms(gameEngines);
      }
    }
    getPlatforms();
    fetchInformations();
  }, [success]);

  const onSubmit = async (data: DiligenceAndCertificate) => {
    setButtonLoader(true);
    const postData = {
      id: id && id != 0 ? id : null,
      companyId: user.companyId,
      foundedYear: data.foundedYear,
      founderName: data.founderName,
      foundingStoryDescription: JSON.stringify(data.foundingStoryDescription),
      workModel: data.workModel,
      platform: data.platform,
      gameEngine: data.gameEngineArray,
      certifications: JSON.stringify(data.certifications),
      security: JSON.stringify(data.security),
      tools: JSON.stringify(data.tools),
      locations: [] as Location[],
      gameEngines: newGameEngine,
    };
    if (data.locations.length > 0) {
      for (const location of data.locations) {
        const locArr = {
          location_name: location.location_name,
          address1: location.address1,
          address2: location.address2,
          state: location.state,
          city: location.city,
          zipcode: location.zipcode,
          countryId: location.countryId,
        };
        postData.locations.push(sanitizeData(locArr));
      }
    }
    const sanitizedData: DiligenceAndCertificate = await sanitizeData(postData) as DiligenceAndCertificate;
    submitForm(sanitizedData).then((response) => {
      if (response.data && response.data.success !== true) {
        toast.error('An Error occurred, Try Again Later');
      } else {
        toast.success('Due Diligence updated successfully 👍');
        if (profilepercentage) {
          setProfilepercentage({
            generalInfoProfilePerc: profilepercentage.generalInfoProfilePerc,
            aboutProfilePerc: profilepercentage.aboutProfilePerc,
            ourWorkAlbumsProfilePerc: profilepercentage.ourWorkAlbumsProfilePerc,
            ourWorkProjectProfilePerc: profilepercentage.ourWorkProjectProfilePerc,
            servicesProfilePerc: profilepercentage.servicesProfilePerc,
            certificationsProfilePerc: 16,
            contactsProfilePerc: profilepercentage.contactsProfilePerc,
            profileCompleted: profilepercentage.profileCompleted,
            bannerAssetId: profilepercentage.bannerAssetId,
          });
        };
      }
      reset(getValues());
      setButtonLoader(false);
    }).catch((err) => {
      console.log(err);
      setButtonLoader(false);
      reset(getValues());
      toast.error('An Error occurred, Try Again Later')
    });
  };

  async function fetchInformations() {
    await authFetcher(`${getEndpointUrl(ENDPOINTS.getCountries)}`)
      .then((countries) => {
        setCountries(countries);
      })
      .catch((err) => {
        console.log(err);
      });
    if (user) {
      await authFetcher(
        `${getEndpointUrl(
          ENDPOINTS.getCompanyDiligenceAndSecurity(user.companyId),
        )}`,
      )
        .then((result) => {
          if (result.success) {
            const diligenceAndCertificate: DiligenceAndCertificate = {
              companyId: 0,
              foundedYear: new Date(),
              founderName: "",
              foundingStoryDescription: "",
              workModel: "",
              platform: [],
              gameEngineArray: [],
              certifications: "",
              security: "",
              tools: "",
              locations: [],
            };
            if (result.data.id) {
              setId(result.data.id);
            }
            // setId(result.data.id);
            if (result.data.Security) {
              diligenceAndCertificate.security = isValidJSON(result.data.Security) ? JSON.parse(result.data.Security) : result.data.Security;
            }
            if (result.data.tools) {
              diligenceAndCertificate.tools = isValidJSON(result.data.tools) ? JSON.parse(result.data.tools) : result.data.tools;
            }
            if (result.data.foundingDescription) {
              diligenceAndCertificate.foundingStoryDescription = isValidJSON(result.data.foundingDescription) ?
                JSON.parse(result.data.foundingDescription) : result.data.foundingDescription;
            }
            if (result.data.foundingYear) {
              diligenceAndCertificate.foundedYear = new Date(result.data.foundingYear);
              setStartYear(new Date(result.data.foundingYear));
            }
            if (result.data.founderName) {
              setValue("founderName", result.data.founderName);
              diligenceAndCertificate.founderName = result.data.founderName;
            }
            if (result.data.workModel) {
              diligenceAndCertificate.workModel = result.data.workModel;
            }
            if (result.data.certifications) {
              diligenceAndCertificate.certifications = isValidJSON(result.data.certifications) ?
                JSON.parse(result.data.certifications) : result.data.certifications;
            }
            if (result.data.company && result.data.company.CompanyAddress) {
              if (result.data.company.CompanyAddress.length > 0) {
                for (const location of result.data.company.CompanyAddress) {
                  const theLocation: Location = {
                    location_name: location.location_name,
                    address1: location.address1,
                    address2: location.address2,
                    state: location.state,
                    city: location.city,
                    countryId: location.Country.id,
                    zipcode: location.zipcode,
                  };
                  diligenceAndCertificate.locations.push(theLocation);
                }
              }
            }
            let platforms: string[] = [];
            if (result.data.company.CompanyPlatformExperience.length > 0) {
              for (const platform of result.data.company.CompanyPlatformExperience) {
                if(platform.platformId == 8) {
                  setDisablePlatForms(true);
                }
                const platformid = (platform.platformId).toString();
                platforms.push(platformid);
                diligenceAndCertificate.platform.push(platformid);
              }
            }
            if (result.data.company.CompanyGameEngines.length > 0) {
              const gameEngineData: { name: string, isChecked: boolean }[] = [];
              result.data.company.CompanyGameEngines.map((gameEngs: { gameEngineName: string, isChecked: boolean }) => {
                gameEngineData.push({ name: gameEngs.gameEngineName, isChecked: gameEngs.isChecked });
                if(gameEngs.gameEngineName == "Not Applicable" && gameEngs.isChecked) {
                  setDisableGameEngines(true);
                }
              })
              setNewGameEngine(gameEngineData);
            }
            reset(diligenceAndCertificate);
          }
          setCanRender(true);
        })
        .catch((err) => {
          setCanRender(true);
          console.log(err);
        });
    } else {
      setCanRender(true);
    }
  }

  const handleRemove = (index: number) => {
    remove(index);
  };

  const addLocation = () => {
    const locationDetails = watch("locations");
    if (locationDetails.length >= 5) {
      alert("Already selected five locations");
      return;
    }
    append({
      location_name: "",
      address1: "",
      address2: "",
      state: "",
      city: "",
      countryId: "",
      zipcode: "",
    });
  };

  const handleDateChange = (date: Date) => {
    setValue("foundedYear", date); // Set the value of the field,( for validate, use like this)   setValue("foundedYear", date, { shouldValidate: true });
    setStartYear(date);
  };
  usePreventBackNavigation(isDirty);

  // Function to handle adding a new input
  const addNewInput = () => {
    setHideAdd(true);
    setInputs(['']);
  };
  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
    setInputData(value);
  };

  // Function to remove an input
  const saveInput = (value: string) => {
    setInputs([]);
    setHideAdd(false);
    setInputData("");
    if (value === "") {
      return;
    } else {
      const newArray = [...(newGameEngine ?? [])];
      newArray.splice(newArray.length - 1, 0, { name: value, isChecked: disableGameEngines ? false : true });
      setNewGameEngine(newArray);
      const gameEngines: string[] = [];
      newArray.map((gameEngine: { name: string, isChecked: boolean })=>{
        if(gameEngine.isChecked) {
          gameEngines.push(gameEngine.name);
        }
      })
      setValue("gameEngineArray", gameEngines, { shouldDirty: true });
    }
  };
  const removeInput = () => {
    setInputs([]);
    setHideAdd(false);
  };

  const isChecked = (index: number) => {
    if(newGameEngine.length - 1 == index) {
      const newInputs = newGameEngine.map((item, idx) => ({
        ...item,
        isChecked: idx === index ? !item.isChecked : false
      }));
      setNewGameEngine(newInputs);
      setDisableGameEngines(!disableGameEngines);
    } else {
      setDisableGameEngines(false);
      const newInputs = [...newGameEngine];
      newInputs[index].isChecked = !newInputs[index].isChecked;
      setNewGameEngine(newInputs);
    }
    const gameEngines: string[] = [];
    newGameEngine.map((gameEngine: { name: string, isChecked: boolean })=>{
      gameEngines.push(gameEngine.name);
    })
    setValue("gameEngineArray", gameEngines, { shouldDirty: true });
  }

  const deleteGameEngine = (index: number) => {
    const gameEngines = [...editGameEngines];
    gameEngines.splice(index, 1);
    setEditGameEngines(gameEngines);
  }

  const handleEditInputChange = (index: number, event: {target: {value: string}}) => {
    const { value } = event.target;
    const gameEngines = [...editGameEngines];
    gameEngines[index].name = value;
    setEditGameEngines(gameEngines);
  };

  const disablePlatforms = (platFormId: string) => {
    if(disablePlatForms) {
      setValue("platform", []);
      setDisablePlatForms(false);
    } else {
      setValue("platform", [platFormId]);
      setDisablePlatForms(true);
    }
  }

  const updateEditGameEngine = () => {
    setEditEnabled(false);
    setNewGameEngine(editGameEngines);
    const engines: string[] = [];
    newGameEngine.map((gameEngine: { name: string, isChecked: boolean })=>{
      if(gameEngine.isChecked) {
        engines.push(gameEngine.name);
      }
    })
    setValue("gameEngineArray", engines, { shouldDirty: true });
  }
  return (
    <>
      {
        canRender ?
          <div>
            <Modal size="sm" show={openModal} onClose={() => setOpenModal(false)}>
              <Modal.Header className="modal_header">
                <b>Video Embed Code</b>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-2.5">
                  <p className="text-sm leading-relaxed default_text_color">
                    Paste the embed code (e.g. YouTube, Vimeo) for your video.
                  </p>
                  <form>
                    <div className="flowbite_input_radius_6 FiAlertTriangle">
                      <TextInput
                        autoComplete="off"
                        id="embed"
                        type="text"
                        placeholder="Paste embed code here"
                        rightIcon={FiAlertTriangle}
                        color="failure"
                        helperText={
                          <>
                            <span className="text-xs">
                              Sorry, that’s an invalid embed code. Please try again.
                            </span>
                          </>
                        }
                      />
                    </div>
                  </form>
                </div>
              </Modal.Body>
              <Modal.Footer className="modal_footer">
                <Button
                  color="gray"
                  onClick={() => setOpenModal(false)}
                  className="h-[40px]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setOpenModal(false)}
                  className="h-[40px] button_blue"
                >
                  Add Video
                </Button>
              </Modal.Footer>
            </Modal>
            <div className="pb-6 pt-6 breadcrumbs_s">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left flex align-middle items-cente">
                <MobileSideMenus></MobileSideMenus>
                <h1 className="font-bold  header-font">
                  Due Diligence
                </h1>
              </div>
            </div>
            <>
              <div className="sm:text-left py-6">
                <h1 className="font-bold default_text_color heading-sub-font">
                  History
                </h1>
              </div>
              <div>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex max-w-md flex-col gap-6"
                >
                  <div className="firstname">
                    <div className="mb-2 block">
                      <Label
                        htmlFor="year-founded"
                        value="Year Founded "
                        className="font-bold text-xs"
                      /><span className="text-red-600 font-bold text-xs">*</span>
                    </div>
                    <DatePicker
                      autoComplete="off"
                      selected={startYear}
                      showYearPicker
                      dateFormat="yyyy"
                      {...register("foundedYear", {
                        required: true,
                      })}
                      onChange={handleDateChange}
                      className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                    />
                    {errors && errors.foundedYear ? (
                      <p className="text-red-600 text-xs">Please Select Year</p>
                    ) : (
                      ""
                    )}
                  </div>

                  <div className="lasttname">
                    <div className="mb-2 block">
                      <Label
                        htmlFor="founder-name"
                        value="Founder Names "
                        className="font-bold text-xs"
                      />
                      <span className="text-red-600 font-bold text-xs">*</span>
                    </div>
                    <TextInput
                      autoComplete="off"
                      id="founderName"
                      className="focus:border-blue-300"
                      type="text"
                      sizing="md"
                      {...register("founderName", {
                        required: true,
                      })}
                    />
                    {errors && errors.founderName ? (
                      <p className="text-red-600 text-xs">Founder Name is Required</p>
                    ) : (
                      ""
                    )}
                  </div>

                  <div className="linkedInprofile">
                    <div className="mb-2 block">
                      <Label
                        htmlFor="base"
                        value="Briefly describe your founding story "
                        className="font-bold text-xs"
                      />
                      <span className="text-red-600 font-bold text-xs">*</span>
                    </div>
                    <Textarea
                      id="comment"
                      placeholder=""
                      rows={8}
                      {...register("foundingStoryDescription", {
                        required: true,
                      })}
                    />
                    {errors && errors.foundingStoryDescription ? (
                      <p className="text-red-600 text-xs">Description is required</p>
                    ) : (
                      ""
                    )}
                  </div>
                  <div className="lg:w-[450px]">
                    <h1 className="font-bold default_text_color heading-sub-font">
                      Work Model & Locations <span className="text-red-600 font-bold text-sm">*</span>
                    </h1>
                  </div>
                  <div className="linkedInprofile">
                    <div className="mb-2 block">
                      <Label
                        htmlFor="work-model"
                        value="Work Model - please select the option that best describes your company's work mode"
                        className="font-bold text-xs"
                      />
                    </div>
                    <fieldset className="flex max-w-md flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Radio
                          id="onSite"
                          value="onSite"
                          {...register("workModel", {
                            required: true,
                          })}
                        />
                        <Label htmlFor="onSite">On-Site - dedicated in office</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio
                          id="remote"
                          {...register("workModel", {
                            required: true,
                          })}
                          value="remote"
                        />
                        <Label htmlFor="remote">
                          Remote - all employees are remote
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio
                          id="hybrid"
                          {...register("workModel", {
                            required: true,
                          })}
                          value="hybrid"
                        />
                        <Label htmlFor="hybrid">
                          Hybrid - mix of on-site and remote
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Radio
                          id="network"
                          value="network"
                          {...register("workModel", {
                            required: true,
                          })}
                        />
                        <Label htmlFor="network">
                          Network - remote contractor/supplier network
                        </Label>
                      </div>
                      {errors && errors.workModel ? (
                        <p className="text-red-600 text-xs">Please select any one</p>
                      ) : (
                        ""
                      )}
                    </fieldset>
                  </div>
                  <div className="lg:w-[450px]">
                    <h1 className="font-bold default_text_color text-sm">
                      Platform Experience <span className="text-red-600 font-bold text-xs">*</span>
                    </h1>
                  </div>
                  <fieldset className="flex max-w-md flex-col gap-3">
                    {platforms.length > 0 && platforms.map((platform: {id: number, name: string})=>(
                      <div className="flex items-center gap-2">
                      <Checkbox
                        {...register("platform",
                          { required: true }
                        )}
                        id={`platform${platform.id}`}
                        value={platform.id}
                        disabled={disablePlatForms}
                        className={`${disablePlatForms? "bg-gray-100" : "bg-white-100"}`}
                      />
                      <Label
                        htmlFor={`platform${platform.id}`}
                        disabled={disablePlatForms}
                      > {platform.name} </Label>
                    </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        {...register("platform",
                          { required: true }
                        )}
                        id={`platform8`}
                        value='8'
                        className="bg-white-100"
                        onClick={() => disablePlatforms('8')}
                      />
                      <Label
                        htmlFor={`platform8`}
                      > Not Applicable </Label>
                    </div>
                    {errors && errors.platform ? (
                      <p className="text-red-600 text-xs">Platform Experience is required</p>
                    ) : (
                      ""
                    )}
                  </fieldset>

                  <div className="lg:w-[450px]">
                    <h1 className="font-bold default_text_color text-sm">
                      Game Engines Expertise <span className="text-red-600 font-bold text-xs">*</span>
                    </h1>
                  </div>
                  <fieldset className="flex max-w-md flex-col gap-3 relative">
                    {!editEnabled ? 
                    <>
                      {newGameEngine && newGameEngine.length > 0 && newGameEngine.map((gameEngine: { name: string, isChecked: boolean }, index: number) => (
                        <>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              {...register("gameEngineArray",
                                 { required: true }
                              )}
                              id={`gameEngine${index}`}
                              value={gameEngine.name}
                              checked={gameEngine.isChecked}
                              disabled={newGameEngine.length-1 == index ? false : disableGameEngines }
                              onChange={() => isChecked(index)}
                              className={`${disableGameEngines ? 'bg-gray-100' : 'bg-white-100'}`}
                            />
                            <Label
                              htmlFor={`gameEngine${index}`}
                              disabled={newGameEngine.length-1 == index ? false : disableGameEngines }
                            > {gameEngine.name} </Label>
                          </div>
                        </>
                      ))}
                      {errors && errors.gameEngineArray ? (
                      <p className="text-red-600 text-xs">Game Engines Expertise is required</p>
                      ) : (
                        ""
                      )}
                    </>
                    :
                    <>
                     <div className="gameexpertise_popmodal">
                      <p className="font-bold popmodal_title">Edit</p>
                        <hr />
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {editGameEngines.map((gameEngines: { name: string, isChecked: boolean }, index: number) => (
                        <>
                        <li>
                          <div className="flex items-center space-x-4 rtl:space-x-reverse">
                            <div className="flex-1 min-w-0">
                              <TextInput 
                              type="text" 
                              sizing="sm" 
                              value={gameEngines.name}
                              disabled={editGameEngines.length-1 == index ? true: false}
                              onChange={(event) => handleEditInputChange(index, event)}
                              required />
                            </div>
                            <div className={`inline-flex items-center`} onClick={()=> editGameEngines.length-1 == index ? '' : deleteGameEngine(index)}>
                              <svg className={`w-[20px] h-[20px] ${editGameEngines.length-1 == index ? 'text-gray-500' : 'text-red-600'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                              </svg>
                            </div>
                          </div>
                          </li>
                          </>
                      ))}
                        <li className="flex items-center justify-end space-x-2">
                          <Button type="button" className="bg-white button_cancel hover:border-gray-100  h-[34px]" onClick={()=>setEditEnabled(false)}> Cancel </Button>
                          <Button type="button" className="bg-white button_blue hover:bg-white h-[34px]" onClick={updateEditGameEngine}> Update </Button>
                        </li>
                      </ul>
                      </div>
                    </>
                    }
                    <div className="flex items-center gap-1">
                      {!editEnabled && newGameEngine && newGameEngine.length < 9 ?
                        <div>{hideAdd ?
                          <>
                            {inputs.map((input, index) => (
                              <div key={index} style={{ marginBottom: '10px' }}>
                                <TextInput
                                  type="text"
                                  value={input}
                                  className="focus:border-blue-300"
                                  onChange={(e) => handleInputChange(index, e.target.value)}
                                />
                                <button type="button" className="link_color pl-24" onClick={() => removeInput()}>
                                  Cancel
                                </button>
                                <button type="button" className="link_color pl-4" onClick={() => saveInput(inputData)}>
                                  Save
                                </button>
                              </div>
                            ))}
                          </>
                          :
                          <>
                            <button type="button" className="link_color pt-2 " onClick={addNewInput}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g id="PlusCircle">
                                  <path id="Vector" d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7468 9.41513 20.7185 6.93705 18.8907 5.10927C17.063 3.28149 14.5849 2.25323 12 2.25ZM15.75 12.75H12.75V15.75C12.75 15.9489 12.671 16.1397 12.5303 16.2803C12.3897 16.421 12.1989 16.5 12 16.5C11.8011 16.5 11.6103 16.421 11.4697 16.2803C11.329 16.1397 11.25 15.9489 11.25 15.75V12.75H8.25C8.05109 12.75 7.86033 12.671 7.71967 12.5303C7.57902 12.3897 7.5 12.1989 7.5 12C7.5 11.8011 7.57902 11.6103 7.71967 11.4697C7.86033 11.329 8.05109 11.25 8.25 11.25H11.25V8.25C11.25 8.05109 11.329 7.86032 11.4697 7.71967C11.6103 7.57902 11.8011 7.5 12 7.5C12.1989 7.5 12.3897 7.57902 12.5303 7.71967C12.671 7.86032 12.75 8.05109 12.75 8.25V11.25H15.75C15.9489 11.25 16.1397 11.329 16.2803 11.4697C16.421 11.6103 16.5 11.8011 16.5 12C16.5 12.1989 16.421 12.3897 16.2803 12.5303C16.1397 12.671 15.9489 12.75 15.75 12.75Z" fill="#0071C2" />
                                </g>
                              </svg>
                              <span className="pl-1">Add</span>
                            </button>
                            <button type="button" className="link_color pt-2 ml-5" onClick={()=>{setEditGameEngines(newGameEngine); setEditEnabled(true)}}>
                              <svg className="w-[20px] h-[20px]"  aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                              </svg>
                              <span className="pl-1">Edit</span>
                            </button>
                          </>
                        }
                        </div>
                        :
                        <>
                         <button type="button" className="link_color pt-2" onClick={()=>{setEditGameEngines(newGameEngine); setEditEnabled(true)}}>
                              <svg className="w-[20px] h-[20px]"  aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z" />
                              </svg>
                              <span className="pl-1">Edit</span>
                            </button>
                        </>
                      }
                    </div>
                  </fieldset>

                  <div className="lg:w-[450px]">
                    <h1 className="font-bold default_text_color text-sm">
                      Locations (5 max)
                    </h1>
                  </div>

                  <div className="">
                    <p className="text-sm">
                      Locations should be where you are incorporated and have physical
                      offices
                    </p>
                  </div>

                  {fields.map((item, index) => (
                    <div key={index} className="p-3 uploading_images_bg space-y-1">
                      <div className="firstname pt-0">
                        <p className="text-sm pb-3">Location {index + 1}:</p>
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            className="font-bold text-xs"
                          >
                            Location Name <span style={{ color: 'red' }}>*</span>
                          </Label>
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.location_name`, {
                            required: true,
                          })}
                        />
                        {errors &&
                          errors.locations &&
                          errors.locations[index]?.location_name ? (
                          <p className="text-red-600 text-xs">
                            Location Name Required
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            value="Address 1"
                            className="font-bold text-xs"
                          />
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.address1`)}
                        />
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            value="Address 2"
                            className="font-bold text-xs"
                          />
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.address2`)}
                        />
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"

                            className="font-bold text-xs"
                          >
                            Country <span style={{ color: 'red' }}>*</span>
                          </Label>
                        </div>
                        <Select
                          id="countries"
                          {...register(`locations.${index}.countryId`, {
                            required: true,
                          })}
                        >
                          <option value="">Select Country</option>
                          {countries.map((country, index) => (
                            <option key={index} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </Select>
                        {errors &&
                          errors.locations &&
                          errors.locations[index]?.countryId ? (
                          <p className="text-red-600 text-xs">
                            Please select a country
                          </p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            value="State/Province"
                            className="font-bold text-xs"
                          />
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.state`)}
                        />
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            className="font-bold text-xs"
                          >
                            City <span style={{ color: 'red' }}>*</span>
                          </Label>
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.city`, {
                            required: true,
                          })}
                        />
                        {errors &&
                          errors.locations &&
                          errors.locations[index]?.city ? (
                          <p className="text-red-600 text-xs">City is required</p>
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="firstname">
                        <div className="mb-1 block">
                          <Label
                            htmlFor="base"
                            value="Postal/Zip Code"
                            className="font-bold text-xs"
                          />
                        </div>
                        <TextInput
                          autoComplete="off"
                          id="base"
                          className="focus:border-blue-300"
                          type="text"
                          sizing="md"
                          {...register(`locations.${index}.zipcode`)}
                        />
                      </div>
                      {index != 0 ? (
                        <div className="link_color text-right pt-2">
                          <p className="text-sm">
                            {/* <Link href="#"> */}
                            <button type="button" onClick={() => handleRemove(index)}>
                              <svg
                                className="me-1 w-3. h-3 blue_c dark:text-white"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 18 20"
                              >
                                <path
                                  stroke="currentColor"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                                ></path>
                              </svg>{" "}
                              Remove this location{" "}
                            </button>
                            {/* </Link> */}
                          </p>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  ))}

                  {
                    watch("locations").length < 5 ?
                      <div className="another_location">
                        <button
                          type="button"
                          className="searc_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
                          onClick={() => addLocation()}
                        >
                          Add Another Location
                        </button>
                      </div>
                      :
                      ""
                  }

                  <div>
                    <h1 className="font-bold default_text_color heading-sub-font">
                      Certifications
                    </h1>
                  </div>
                  <div className="text-sm">
                    <p>
                      List and describe your certifications here.
                    </p>
                  </div>
                  <div className="linkedInprofile">
                    <div className="mb-2 block"></div>
                    <Textarea
                      id="certifications"
                      {...register("certifications")}
                      placeholder={`ISO compliance\nCybersecurity certification\n3rd party certification (Eg. Unity, Unreal, Lucas, etc.)\nOther`}
                      rows={8}
                    />
                  </div>
                  <div>
                    <h1 className="font-bold default_text_color heading-sub-font">
                      Security
                    </h1>
                  </div>
                  <div className="text-sm">
                    <p>
                      Describe your security setup here.
                    </p>
                  </div>
                  <div className="linkedInprofile">
                    <div className="mb-2 block"></div>
                    <Textarea
                      id="security"
                      {...register("security")}
                      placeholder={`Data encryption\nSecure network architecture\nAccess control\nSecurity audits and assessments\nEmployee training awareness\nCompliance with industry standards (Eg. GDPR, etc.)\nPhysical security (Eg. CCT, server security, etc.)\nOther`}
                      rows={8}
                    />
                  </div>
                  <div>
                    <h1 className="font-bold default_text_color heading-sub-font">
                      Tools & Software
                    </h1>
                  </div>
                  <div className="text-sm">
                    <p>
                      Please list tools and software that your company is most proficient in.
                    </p>
                  </div>
                  <div className="linkedInprofile">
                    <div className="mb-2 block"></div>
                    <Textarea
                      id="tools"
                      {...register("tools")}
                      placeholder={`Engines\nArt and code review\nEngineering\nProject management\nCommunication\nArtificial intelligence\nOther`}
                      rows={8}
                    />
                  </div>
                  <div className="flex flex-wrap justify-end pb-6">
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
            </>
          </div>
          :
          <div className="min-h-screen flex justify-center items-center">
            <Spinner />
          </div>
      }
    </>
  );
};

export default CertificationsAndDiligence;