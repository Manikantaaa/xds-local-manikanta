"use client";
import Breadcrumbs from "@/components/breadcrumb";
import Spinner from "@/components/spinner";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { authFetcher, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { Button, Label, Modal, Select, TextInput, Textarea, Tooltip } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Draggable } from "react-drag-reorder";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Multiselect from "multiselect-react-dropdown";
import { useForm } from "react-hook-form";
import { useSearchCompanies } from "@/hooks/useSearchcompanies";
import { formatDateToYYYYMMDD } from "@/services/common-methods";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import { ServiceCapabilities } from "@/types/companies.type";
import useFormUpdate from "@/hooks/useFormUpdate";
interface servicesdataType {
    defafultImg: string,
    id: string,
    serviceTitle: string,
    Services: {
        id: number,
        serviceName: string,
    }
}

const Services = () => {

    const [openAdsModal, setOpenAdsModal] = useState<boolean>(false);
    //Dates
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();
    const [sponseredServices, setSponseredServices] = useState<servicesdataType[]>([])

    //company searches
    const { handleSearch, companyOptions } = useSearchCompanies();
    const [selectedCompanies, setSelectedCompanies] = useState<{ id: number, name: string }[]>([])

    //
    const [validateDefaultDimension, setValidateDefaultDimension] = useState<string>('');
    const [validateSponseredDimension, setValidateSponseredDimension] = useState<string>('');
    const [imageValidating, setImageValidating] = useState<string>('');
    const [sponseredImageValidating, setSponseredImageValidating] = useState<string>('');
    const [uploaddefaultSpinner, setUploadDefaultSpinner] = useState<boolean>(false);
    const [uploadSponserSpinner, setUploadSponserSpinner] = useState<boolean>(false);
    const [defaultImagePath, setDefaultImagePath] = useState<string>('');
    const [sponseredImagePath, setSponseredImagePath] = useState<string>('');
    const [defaultImageSignedPath, setDefaultImageSignedPath] = useState<string>('');
    const [sponseredImageSignedPath, setSponseredImageSignedPath] = useState<string>('');
    const [uploadSponserLogoSpinner, setUploadSponserLogoSpinner] = useState<boolean>(false);
    const [sponseredLogoImagePath, setSponseredLogoImagePath] = useState<string>('');
    const [sponseredLogoImageSignedPath, setSponseredLogoImageSignedPath] = useState<string>('');
    const [sponseredLogoImageValidating, setSponseredLogoImageValidating] = useState<string>('');
    const [validateSponseredLogoDimension, setValidateSponseredLogoDimension] = useState<string>('');

    const [isEditClicked, setIsEditClicked] = useState<boolean>(false);
    const [editedServiceId, setEditSerivceId] = useState<number>(0);
    const [services, setServices] = useState<ServiceCapabilities[]>([]);
    const [serviceExistError, setServiceExistError] = useState<string>("");
    //
    const [load, setLoad] = useState<boolean>(false);
    //
    const [popupLoader, setPopupLoader] = useState<boolean>(false);
    const [hideAndShow, setHideAndShow] = useState(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    useEffect(() => {
        const handleResize = () => {
            setHideAndShow(window.innerWidth > 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const breadcrumbItems = [
        {
            label: PATH.HOME.name,
            path: PATH.HOME.path,
        },
        {
            label: PATH.CONTENT.name,
            path: PATH.CONTENT.path,
        },
        {
            label: 'Services',
            path: 'Services',
        },
    ];
    const {
        register,
        setValue,
        formState: { errors },
        getValues,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            defaultServiceImage: "",
            sponseredCompany: "",
            sponseredServiceImage: "",
            companyName: "",
            endDate: "",
            startDate: "",
            service: "",
            companies: [],
        },
    });
    const handleDateChange = (date: Date, inputfrom: string) => {
        if (inputfrom == 'start') {
            const dateString = date.toLocaleDateString('en-US');
            setValue("startDate", dateString, { shouldValidate: true });
            setStartDate(date);
        } else if (inputfrom == 'endDate') {
            const dateString = date ? date.toLocaleDateString('en-US') : "";
            setValue("endDate", dateString, { shouldValidate: true });
            setEndDate(date);
        }
    };

    //Add Event Form submit
    const { submitForm: submitEventForm } = useCommonPostData<FormData>({
        url: getEndpointUrl(ENDPOINTS.saveSponseredService),
    });

    const { submitForm: submitUpdateEventForm } = useFormUpdate<FormData>({
        url: getEndpointUrl(ENDPOINTS.updateSpService(editedServiceId)),
    });
    const onSubmit = (formData: any) => {

        if (!defaultImagePath) {
            setImageValidating("Default image required")
            return
        // } else if (getValues("companies").length > 0 && !sponseredLogoImagePath) {
        } else if (getValues("companies").length < 0) {
            setSponseredLogoImageValidating("Sponsered company logo image required")
            return
        }
        if (serviceExistError) {
            return;
        }
        //  formData.eventLogo = adImagePath;
        formData.startDate = formData.startDate && formatDateToYYYYMMDD(new Date(formData.startDate));
        formData.endDate = formData.endDate && formatDateToYYYYMMDD(new Date(formData.endDate));
        formData.defaultServiceImage = defaultImagePath;
        if (sponseredImagePath) {
            formData.sponseredServiceImage = sponseredImagePath;
        }
        if (sponseredLogoImagePath) {
            formData.sponseredServiceLogoImage = sponseredLogoImagePath;
        }
        if (!isEditClicked) {
            submitEventForm(formData).then(() => {
                toast.success("Your changes have been saved 👍");
                setLoad((prev) => !prev);

            }).catch((e) => {
                console.error(e);
                toast.success("Something went wrong please try again later");
            }).finally(() => {
                setOpenAdsModal(false);
                reset();
                resetFormValues();
            });
        } else {
            submitUpdateEventForm(formData).then(() => {
                toast.success("Your changes have been updated 👍");
                setLoad((prev) => !prev);
            }).catch((e) => {
                console.error(e);
                toast.success("Something went wrong please try again later");
            }).finally(() => {
                setOpenAdsModal(false);
                reset();
                resetFormValues();

            });

        }
    }

    //file validations
    const { submitForm: submitImageForm } = useCommonPostData<FormData>({
        url: getEndpointUrl(ENDPOINTS.uploadimageCommonMethod),
    });
    const filehandle = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: "sponseredImage" | "sponseredLogoImage" | "defaultImage" = "defaultImage",
    ) => {
        setImageValidating('');
        setValidateSponseredDimension('');
        setValidateDefaultDimension('');
        setSponseredImageValidating('');
        setSponseredLogoImageValidating('');
        setValidateSponseredLogoDimension('');
        const file: any = e.target.files;
        if (file && file.length > 0) {
            if (type === "sponseredImage") {
                setUploadSponserSpinner(true);
            } else if(type === "sponseredLogoImage"){
                setUploadSponserLogoSpinner(true);
            } else {
                setUploadDefaultSpinner(true);
            }

            const fileNameParts = file[0].name.split(".");
            const fileExtension =
                fileNameParts[fileNameParts.length - 1].toLowerCase();
            if (fileNameParts.length > 2) {
                const error = "Images with multiple extensions (or periods) in the file name are not allowed";
                if (type == "sponseredImage") {
                    setValidateSponseredDimension(error)
                    setUploadSponserSpinner(false)
                } else if(type == "sponseredLogoImage") {
                    setValidateSponseredLogoDimension(error)
                    setUploadSponserLogoSpinner(false)
                } else {
                    setValidateDefaultDimension(error)
                    setUploadDefaultSpinner(false);
                }
                return;
            }
            if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg")) {
                const error = "Only PNG, JPG and JPEG foramt images are allowed";
                if (type == "sponseredImage") {
                    setValidateSponseredDimension(error);
                    setUploadSponserSpinner(false)
                } else if(type == "sponseredLogoImage") {
                    setValidateSponseredLogoDimension(error);
                    setUploadSponserLogoSpinner(false);
                } else {
                    setValidateDefaultDimension(error)
                    setUploadDefaultSpinner(false);
                }
                return;
            }
            if (file[0].size > 5 * 1024 * 1024) {
                const fileerror = `File size should not exceed 5MB`;
                if (type == "sponseredImage") {
                    setValidateSponseredDimension(fileerror);
                    setUploadSponserSpinner(false)
                } else if(type == "sponseredLogoImage") {
                    setValidateSponseredLogoDimension(fileerror);
                    setUploadSponserLogoSpinner(false);
                } else {
                    setValidateDefaultDimension(fileerror);
                    setUploadDefaultSpinner(false);
                }
                return;
            }
            const img = new window.Image();
            img.src = URL.createObjectURL(file[0]);
            img.onload = async () => {
                URL.revokeObjectURL(img.src);
                const width = img.width;
                const height = img.height;
                if ((width != 50 || height != 50) && type == "sponseredLogoImage") {
                    setValidateSponseredLogoDimension("Please use an image that is in the ratio - 50px wide by 50px tall");
                    setUploadSponserLogoSpinner(false);
                    return;
                } else if ((width != 800 || height != 450) && type != "sponseredLogoImage") {
                    const sizeError = 'Please use an image that is in the ratio - 800px wide by 450px tall';
                    if (type == "sponseredImage") {
                        setValidateSponseredDimension(sizeError);
                        setUploadSponserSpinner(false);
                    } else {
                        setValidateDefaultDimension(sizeError);
                        setUploadDefaultSpinner(false);
                    }
                    return;
                } else {
                    const logoFormData = new FormData();
                    if (file && file[0]) {
                        logoFormData.append('sourceImage', file[0]);

                        if (type == "sponseredImage") {
                            logoFormData.append('destImagepath', 'sponseredimages');
                        } else if(type == "sponseredLogoImage"){
                            logoFormData.append('destImagepath', 'sponseredLogoImage');
                        } else {
                            logoFormData.append('destImagepath', "defaultimages");
                        }

                        const resLogo = await submitImageForm(logoFormData);
                        if (resLogo && resLogo.status === 201) {

                            if (type == "sponseredImage") {
                                setSponseredImageSignedPath(resLogo.data.fullpath);
                                setSponseredImagePath(resLogo.data.fileUrl)
                            } else if (type == "sponseredLogoImage") {
                                setSponseredLogoImageSignedPath(resLogo.data.fullpath);
                                setSponseredLogoImagePath(resLogo.data.fileUrl)
                            } else {
                                setDefaultImageSignedPath(resLogo.data.fullpath);
                                setDefaultImagePath(resLogo.data.fileUrl);
                            }
                            setUploadSponserSpinner(false)
                            setUploadDefaultSpinner(false);
                            setUploadSponserLogoSpinner(false);
                        } else {
                            setUploadSponserSpinner(false);
                            setUploadDefaultSpinner(false);
                            setUploadSponserLogoSpinner(false);
                        }
                    } else {
                        setUploadSponserSpinner(false)
                        setUploadDefaultSpinner(false);
                        setUploadSponserLogoSpinner(false);
                    }
                }
            }
        }
    }
    function onAddOrRemovePlatforms(
        theSelectedPlatforms: { id: number; name: string }[],
    ) {
        setStartDate(undefined);
        setEndDate(undefined);
        setSponseredImagePath("");
        setSponseredImageSignedPath("");
        setSponseredLogoImagePath("");
        setSponseredLogoImageSignedPath("");
        setValue('companyName', "");
        const companies: number[] = [];
        for (const item of theSelectedPlatforms) {
            companies.push(item.id);
        }
        setSelectedCompanies(theSelectedPlatforms);
        setValue(`companies`, companies as never[]);
    }

    function resetFormValues() {
        setDefaultImagePath("");
        setSponseredImagePath("");
        setDefaultImageSignedPath("");
        setValidateDefaultDimension('');
        setSponseredImageSignedPath("");
        setSponseredLogoImagePath("");
        setSponseredLogoImageSignedPath("");
        setServiceExistError("");
        setSelectedCompanies([]);
        setStartDate(undefined);
        setEndDate(undefined);
        setValue("companyName", "");
    }

    useEffect(() => {
        const getAllServices = async () => {
            const sponseredServices = await authFetcher(`${getEndpointUrl(ENDPOINTS.getserviceslist)}`).catch((error) => {
                console.log(error);
            });
            if (sponseredServices) {
                if (sponseredServices.list) {
                    await sponseredServices.list.sort((a: any, b: any) => {
                        if (a.serviceName < b.serviceName) {
                            return -1;
                        }
                        if (a.serviceName > b.serviceName) {
                            return 1;
                        }
                        return 0;
                    });
                    setServices(sponseredServices.list);
                }
            }
        }
        getAllServices();
    }, [])
    useEffect(() => {
        const getActiveSponserServices = async () => {
            setIsLoading(true);
            const services = await authFetcher(`${getEndpointUrl(ENDPOINTS.getsponseredserviceslist)}`).catch((error) => {
                console.log(error);
            });
            if (services) {
                if (services.list) {
                    setSponseredServices(services.list);
                }
            }
            setIsLoading(false);
        }
        
        getActiveSponserServices();
    }, [load])

    useEffect(() => {
        reset()
        resetFormValues();
        if (!openAdsModal) {
            setIsEditClicked(false);
            setEditSerivceId(0);
        }
    }, [openAdsModal]);

    useEffect(() => {

        async function getSPservice() {
            setPopupLoader(true)
            const Spservice = await authFetcher(
                getEndpointUrl(ENDPOINTS.getSPserviceById(editedServiceId)),
            );
            const spServiceDatas = Spservice.list;
            setValue("companyName", spServiceDatas.serviceTitle);
            setValue("defaultServiceImage", spServiceDatas.defafultImg);
            setValue("service", spServiceDatas.Services.id);
            setValue("companyName", spServiceDatas.serviceTitle);
            if(new Date(spServiceDatas.endDate).getTime() > new Date().getTime()){
              setValue("endDate", spServiceDatas.endDate);
              setEndDate(spServiceDatas.endDate);
            } else {
              setValue("endDate", "");
              setEndDate(undefined);
            }
            
            setValue("startDate", spServiceDatas.startDate);
            setStartDate(spServiceDatas.startDate);
            if (spServiceDatas && spServiceDatas.sponseredImg) {
                setValue("sponseredCompany", spServiceDatas.sponseredImg);
            }
            if (spServiceDatas.Companies && spServiceDatas.Companies.id != 0 && spServiceDatas.Companies.name != "") {
                const SponseredCompanies = [{ id: spServiceDatas.Companies.id, name: spServiceDatas.Companies.name }];

                const companyIds: any = SponseredCompanies.map((company: { id: number }) => company.id != 0 && company.id);
                setValue("companies", companyIds);
                setSelectedCompanies(SponseredCompanies);
            }
            if (spServiceDatas.defafultImg) {
                setDefaultImagePath(spServiceDatas.defafultImg);
                setDefaultImageSignedPath(spServiceDatas.defaultSignedUrl)
            }
            if (spServiceDatas.sponseredImg) {
                setSponseredImagePath(spServiceDatas.sponseredImg);
                setSponseredImageSignedPath(spServiceDatas.sponseredSignedUrl)
            }
            if (spServiceDatas.sponseredLogoImg) {
                setSponseredLogoImagePath(spServiceDatas.sponseredLogoImg);
                setSponseredLogoImageSignedPath(spServiceDatas.sponseredLogoSignedUrl)
            }

            setPopupLoader(false);
        }
        if (isEditClicked) {
            getSPservice();
        }

    }, [isEditClicked]);

    const handleServiceCheck = (serviceId: string) => {
        setServiceExistError("")
        if (serviceId) {

            const isExist = sponseredServices.find((service) => Number(service.Services.id) === Number(serviceId));
            if (isExist && Number(isExist.id) != editedServiceId) {
                setServiceExistError("Service already exist");
                return true;
            }
            return false;
        } else {
            return false;
        }
    }
    return (
        <div className="w-full px-5 pos_r">
            <div className="pb-6 pt-6 breadcrumbs_s">
                <Breadcrumbs items={breadcrumbItems} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-8">
                <div className="faq_list">
                    <h1 className="font-bold text-gray-900 header-font text_font_size"> <button onClick={() => setHideAndShow(!hideAndShow)} type="button" id="radix-:r1m:" aria-haspopup="menu" aria-expanded="false" data-state="closed" className="md:hidden inline-block focus-visible:outline-none  button_blue px-1 rounded-sm text-white me-2"><svg className="w-[26px] h-[26px] text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M9 8h10M9 12h10M9 16h10M5 8h0m0 4h0m0 4h0"></path></svg></button>Content </h1>
                    {hideAndShow ? <ul className="mt-4 sidebar_list_gap mobile_hide_menu">
                        <li><Link href="/admin/faq" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">FAQs</Link></li>
                        <li><Link href="/admin/advertisements" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Advertisements</Link></li>
                        <li><Link href="/admin/events" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Events</Link></li>
                        <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0  anchor_active">Service Categories</Link></li>
                        <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Articles</Link></li>
                        <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
                        <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Platinum Partners</Link></li>
                    </ul>
                        : ''}
                </div>
                <div className="faq_content col-span-4">
                  <>
                    {
                      isLoading ?
                      <div className="flex justify-center items-center">
                        <Spinner />
                      </div>
                      :
                      <>
                        <div className="sm:flex sm:items-center sm:justify-between">
                            <div className="sm:text-left">
                                <h1 className="font-bold text-gray-900 header-font"> Service Categories </h1>
                            </div>
                        </div>
                        <div className="text-end my-6">
                            <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2" onClick={() => { setOpenAdsModal(true); }}>Add Sevices</button>
                        </div>
                        {sponseredServices.length > 0 ?
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-5 sm:grid-cols-3 py-6">
                                {sponseredServices.map((services) => (
                                    <div className="grid_categories">
                                        <article className="overflow-hidden rounded-lg card_shadow_2">
                                            <div className="bg-white p-2.5 relative">
                                                <Link href="#" className="link_color text-base mb-2.5 block font-medium">{services.Services?.serviceName}</Link>
                                                <img
                                                    alt=""
                                                    src={services.defafultImg}
                                                    className="h-46 w-full object-cover rounded-[6px]"
                                                />
                                                {services.serviceTitle &&
                                                    <div className="absolute  w-full  z-0  left-0 right-0  bottom-5">
                                                        <button type="button" className="text-gray-900 bg_yellow focus:outline-none font-medium rounded-sm text-xs px-2 py-1 cursor-default ml-4"> {services.serviceTitle} </button>
                                                    </div>
                                                }
                                                <div className="absolute right-2 bottom-5">
                                                    <div className="ms-auto"><button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-[20px] " onClick={() => { setEditSerivceId(Number(services.id)); setOpenAdsModal(true); setIsEditClicked(true) }}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" fill="#0071C2"></path></svg></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>

                                    </div>
                                ))}
                            </div>
                        </div>
                        :
                            <p className="flex flex-col-reverse text-sm font-normal items-center italic">
                                No Service Categories added.
                            </p>
                        }
                      </>
                    }
                  </>
                </div>
            </div>
            {/***********************Model starts**********************/}
            <Modal show={openAdsModal} onClose={() => { setOpenAdsModal(false); }} size="lg" className="text_box_readuce add_advertisement">
                <Modal.Header className="modal_header"> {editedServiceId != 0 && isEditClicked && "Update" || "Add"} </Modal.Header>
                <form className="overflow-auto flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>

                    <Modal.Body className="m-auto">
                        {popupLoader ? <div className="top-3 left-36 height-100"> <Spinner /></div> :
                            <>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Service" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <Select
                                        {...register("service", {
                                            required: {
                                                value: true,
                                                message: "Status is required",
                                            }
                                        })}

                                        onChange={(e) => handleServiceCheck(e.target.value)}
                                    >
                                        <option value={""}>Select</option>
                                        {services.map((service) => {
                                            return <option value={service.id}>{service.serviceName}</option>
                                        })}

                                    </Select>
                                    <p className="text-red-600 text-xs">
                                        {errors?.service?.message}
                                    </p>
                                    <p className="text-red-600 text-xs">
                                        {serviceExistError}
                                    </p>
                                </div >
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="banner" value="Default Service Image" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <p className="text-xs"> For best results, We recommend 800px by 450px. Please keep the file size under 5MB.</p>
                                    <div className="relative mt-2">
                                        <label htmlFor="default-file-upload"
                                            className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                                            <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Default Service Image
                                        </label>
                                        <input id="default-file-upload" type="file"
                                            onChange={(e) => filehandle(e, "defaultImage")}
                                            accept="image/*"
                                        />
                                        <p className="text-red-600 text-xs">
                                            {imageValidating}
                                        </p>
                                        <p className="text-red-600 text-xs">
                                            {validateDefaultDimension}
                                        </p>
                                        {uploaddefaultSpinner &&
                                            <div className="top-3 absolute left-36"> <Spinner /></div>
                                        }
                                        {!uploaddefaultSpinner &&
                                            <img
                                                className="mt-2"
                                                src={defaultImageSignedPath}
                                                width={160}
                                            />
                                        }
                                    </div>
                                </div >


                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Sponsored Company" className="font-bold text-xs" />
                                    </div>
                                    <Multiselect
                                        emptyRecordMsg="-"
                                        className="block w-full"
                                        options={companyOptions}
                                        selectedValues={selectedCompanies}
                                        selectionLimit={1}
                                        displayValue="name"
                                        onSelect={onAddOrRemovePlatforms}
                                        onRemove={onAddOrRemovePlatforms}
                                        placeholder="Search by Service Provider Name"
                                        onSearch={handleSearch}
                                        {...register("companies")}
                                    />
                                </div>
                                {selectedCompanies.length > 0 &&
                                    <>
                                        {/* <div>
                                            <div className="mb-2 inline-flex items-center">
                                                <Label htmlFor="banner" value="Sponsored Service Image" className="font-bold text-xs" />
                                                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                            </div>
                                            <p className="text-xs"> For best results, We recommend 800px by 450px. Please keep the file size under 5MB.</p>
                                            <div className="relative mt-2">
                                                <label htmlFor="file-upload"
                                                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                                                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Sponsored Service Image
                                                </label>
                                                <input id="file-upload" type="file" accept="image/*"
                                                    onChange={(e) => filehandle(e, "sponseredImage")}
                                                />

                                                {uploadSponserSpinner &&
                                                    <div className="top-3 absolute left-36"> <Spinner /></div>
                                                }
                                                {!uploadSponserSpinner &&
                                                    <img
                                                        className="mt-2"
                                                        src={sponseredImageSignedPath}
                                                        width={160}
                                                    />
                                                }

                                                <p className="text-red-600 text-xs">
                                                    {sponseredImageValidating}
                                                </p>
                                                <p className="text-red-600 text-xs">
                                                    {validateSponseredDimension}
                                                </p>
                                            </div>
                                        </div> */}
                                        {/* <div>
                                            <div className="mb-2 pt-4 inline-flex items-center">
                                                <Label htmlFor="banner" value="Sponsored Company Logo" className="font-bold text-xs" />
                                                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                            </div>
                                            <p className="text-xs"> For best results, We recommend 50px by 50px. Please keep the file size under 5MB.</p>
                                            <div className="relative mt-2">
                                                <label htmlFor="logo-file-upload"
                                                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                                                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Sponsored Company Logo Image
                                                </label>
                                                <input id="logo-file-upload" type="file" accept="image/*"
                                                    onChange={(e) => filehandle(e, "sponseredLogoImage")}
                                                />

                                                {uploadSponserLogoSpinner &&
                                                    <div className="top-3 absolute left-36"> <Spinner /></div>
                                                }
                                                {!uploadSponserLogoSpinner &&
                                                    <img
                                                        className="mt-2"
                                                        src={sponseredLogoImageSignedPath}
                                                        width={160}
                                                    />
                                                }

                                                <p className="text-red-600 text-xs">
                                                    {sponseredLogoImageValidating}
                                                </p>
                                                <p className="text-red-600 text-xs">
                                                    {validateSponseredLogoDimension}
                                                </p>
                                            </div>
                                        </div> */}
                                        <div>
                                            <div className="mb-2 inline-flex items-center">
                                                <Label htmlFor="company" value="Company Name" className="font-bold text-xs" />
                                                <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                            </div>
                                            <TextInput   {...register("companyName", ({
                                                required: {
                                                    value: true,
                                                    message: "companyName required"
                                                }
                                            }))} type="text" placeholder="" shadow sizing="sm" />
                                            <p className="text-red-600 text-xs">
                                                {errors?.companyName?.message}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 mt-2">
                                            <div>
                                                <div className="mb-2 inline-flex items-center">
                                                    <Label htmlFor="startDate" value="Start Date" className="font-bold text-xs" />
                                                    <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                                </div>
                                                <DatePicker
                                                    autoComplete="off"
                                                    minDate={new Date()}
                                                    className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                                                    {...register("startDate", {
                                                        required: {
                                                            value: true,
                                                            message: 'StartDate required'
                                                        }
                                                    })}
                                                    selected={startDate}
                                                    onChange={(date: Date) => {
                                                        handleDateChange(date, 'start');
                                                    }}
                                                />
                                                <p className="text-red-600 text-xs">
                                                    {errors?.startDate?.message}
                                                </p>
                                            </div>
                                            <div>
                                                <div className="mb-2 inline-flex items-center">
                                                    <Label htmlFor="endDate" value="End Date" className="font-bold text-xs" />
                                                    {/* <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span> */}
                                                </div>
                                                <DatePicker
                                                    autoComplete="off"
                                                    className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                                                    minDate={startDate}
                                                    selected={endDate}
                                                    {...register("endDate")}
                                                    onChange={(date: Date) => {
                                                      handleDateChange(date, 'endDate');
                                                    }}

                                                />
                                                {/* <p className="text-red-600 text-xs">
                                                    {errors?.endDate?.message}
                                                </p> */}
                                            </div>
                                        </div>
                                    </>
                                }


                            </>
                        }
                    </Modal.Body >

                    <Modal.Footer className="modal_footer">

                        <Button color="gray" onClick={() => { setOpenAdsModal(false); console.log(errors) }}> Cancel</Button>
                        <Button type="submit"> {editedServiceId != 0 && isEditClicked && "Update" || "Add"} </Button>
                    </Modal.Footer>
                </form >
            </Modal >
            { /* **********************Model end********************* */}
        </div >

    );
};

export default Services;
