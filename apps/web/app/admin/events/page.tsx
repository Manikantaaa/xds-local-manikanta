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
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import { formatDateToYYYYMMDD } from "@/services/common-methods";
import useFormUpdate from "@/hooks/useFormUpdate";
import { faqQuestions } from "@/types/event.types";
interface postdataType {
    type: string,
    qsnData: {
        id: number,
        orderId: number,
    }
}

const Faqs = () => {
    const [eventList, setEventList] = useState<faqQuestions[]>([]);
    const [updateEventOrder, setUpdateEventOrder] = useState<postdataType[]>([]);
    const [displayModel, setDisplayModel] = useState<boolean>(false);
    const [deleteModel, setDeleteModel] = useState<boolean>(false);
    const [faqId, setFaqId] = useState<number>(0);
    const [load, setLoad] = useState<boolean>(false);
    const [isHide, setIsHide] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [csvLoader, setCsvLoader] = useState<boolean>(false);
    const [isEditClicked, setIsEditClicked] = useState<boolean>(false);
    const [selectedCompanies, setSelectedCompanies] = useState<{ id: number, name: string }[]>([])
    //add form popup
    const [openAdsModal, setOpenAdsModal] = useState<boolean>(false);
    const [popupLoader, setPopupLoader] = useState<boolean>(false);
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
            label: 'Events',
            path: 'Events',
        },
    ];

    //company searches
    const { handleSearch, companyOptions } = useSearchCompanies();

    //Dates
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    //
    const [validateWebDimension, setValidateWebDimension] = useState<string>('');
    const [imageValidating, setImageValidating] = useState<string>('');
    const [uploadSpinner, setUploadSpinner] = useState<boolean>(false);
    const [adImagePath, setAdImagePath] = useState<string>('');
    const [adSigndeUrl, setAdSigndeUrl] = useState<string>('');
    // const [isExpanded, setIsExpanded] = useState(false);
    const [successCsv, setSuccessCsv] = useState(false);
    const [errorCsv, setErrorCsv] = useState(false);
    const { submitForm: submitImageForm } = useCommonPostData<FormData>({
        url: getEndpointUrl(ENDPOINTS.uploadimageCommonMethod),
    });

    const { submitForm: submitEventForm } = useCommonPostData<FormData>({
        url: getEndpointUrl(ENDPOINTS.addEvent),
    });
    const { submitForm: submitUpdateEventForm } = useFormUpdate<FormData>({
        url: getEndpointUrl(ENDPOINTS.updateEvent(faqId)),
    });
    const [hideAndShow, setHideAndShow] = useState(true);
    //initialize form
    const {
        register,
        setValue,
        formState: { errors },
        getValues,
        handleSubmit,
        reset,
    } = useForm({
        defaultValues: {
            eventname: "",
            eventdescription: "",
            eventURL: "",
            eventLocation: "",
            eventLogo: "",
            endDate: "",
            startDate: "",
            companies: [],
        },
    });

    //initial load Data
    useEffect(() => {
        const getAllEvents = async () => {
            setIsLoading(true);
            setEventList([]);
            const allEvents = await authFetcher(
                getEndpointUrl(ENDPOINTS.getallEvents),
            );

            if (allEvents && allEvents.success == true) {
                if (allEvents.data) {
                    setEventList(allEvents.data);
                }
            }
            setIsLoading(false);
        };
        getAllEvents();
        setLoad(false);
    }, [load]);
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
    //hide 
    const faqHide = async () => {
        let postData = [];
        postData.push({ type: 'hide', });
        await authPutWithData<{ type: string }[]>(`${getEndpointUrl(ENDPOINTS.toggleEventShow(faqId))}`, postData)
            .then((result) => {
                if (result) {
                    toast.success("Successfully Updated")
                }
            }).catch((err) => {
                console.error(err);
                toast.success("Failed to updated, try again later")
            }).finally(() => {
                setLoad(true);
                setDisplayModel(false);
            });
    }

    //delete
    const deleteFaqs = async () => {
        await deleteItem(`${getEndpointUrl(ENDPOINTS.deleteEvent(faqId))}`)
            .then((result) => {
                if (result) {
                    toast.success("Successfully Deleted")
                    setLoad(true);
                    setDeleteModel(false);
                }
            }).catch((err) => {
                toast.success("Something went wrong try again later")
                console.log(err);
            });
    }

    //position change
    const handlePosChange = (currentPos: any, newPos: any) => {
        setUpdateEventOrder([]);
        const updatedIndexValues: faqQuestions[] = [...eventList];
        const movedIndexValue = updatedIndexValues.splice(currentPos, 1)[0];
        updatedIndexValues.splice(newPos, 0, movedIndexValue);
        updatedIndexValues.forEach((faq, index) => {
            faq.orderById = index + 1;
        });
        setEventList(updatedIndexValues);
        updatedIndexValues.map((faq) => {
            setUpdateEventOrder((prevImages) => [
                ...prevImages,
                {
                    type: 'update',
                    qsnData: {
                        id: faq.id,
                        orderId: faq.orderById
                    }
                },
            ]);
        })
    }

    //update
    useEffect(() => {
        const addFaqContent = async () => {
            const postData: postdataType[] = updateEventOrder;
            await authPutWithData<postdataType[]>(`${getEndpointUrl(ENDPOINTS.saveEventsOrder(1))}`, postData)
                .catch((err) => {
                    console.log(err);
                });
        }
        if (updateEventOrder.length > 0) {
            addFaqContent();
        }
    }, [updateEventOrder]);
    function onAddOrRemovePlatforms(
        theSelectedPlatforms: { id: number; name: string }[],
    ) {
        const companies: number[] = [];
        for (const item of theSelectedPlatforms) {
            companies.push(item.id);
        }
        setSelectedCompanies(theSelectedPlatforms);
        setValue(`companies`, companies as never[]);
    }

    //Date field change
    const handleDateChange = (date: Date, inputfrom: string) => {
        if (inputfrom == 'start') {
            const dateString = date.toLocaleDateString('en-US');
            setValue("startDate", dateString);
            setStartDate(date);
        } else if (inputfrom == 'endDate') {
            const dateString = date.toLocaleDateString('en-US');
            setValue("endDate", dateString);
            setEndDate(date);
        }
    };

    //Add Event Form submit
    const onSubmit = (formData: any) => {

        if (!adImagePath) {
            setImageValidating("Event Logo required")
            return
        }
        formData.eventLogo = adImagePath;
        formData.startDate = formData.startDate && formatDateToYYYYMMDD(new Date(formData.startDate));
        formData.endDate = formData.endDate && formatDateToYYYYMMDD(new Date(formData.endDate));
        if (!isEditClicked) {
            submitEventForm(formData).then(() => {
                toast.success("Your changes have been saved 👍");
                setLoad(true);
                reset();
                setAdImagePath("");
                setAdSigndeUrl("");
                setValidateWebDimension('');
            }).catch((e) => {
                console.error(e);
                toast.success("Something went wrong please try again later");
            }).finally(() => {
                setOpenAdsModal(false);
            });
        } else {
            submitUpdateEventForm(formData).then(() => {
                toast.success("Your changes have been updated 👍");
                setLoad(true);
                reset();
                setAdImagePath("");
                setAdSigndeUrl("");
                setValidateWebDimension('');
            }).catch((e) => {
                console.error(e);
                toast.success("Something went wrong please try again later");
            }).finally(() => {
                setOpenAdsModal(false);
                setFaqId(0);
                setIsEditClicked(false);
            });

        }
    }

    //file validations
    const filehandle = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: string,
    ) => {
        setImageValidating('');
        setValidateWebDimension('');
        const file: any = e.target.files;
        if (file && file.length > 0) {
            if (type === "web") {
                setUploadSpinner(true);
            }

            const fileNameParts = file[0].name.split(".");
            const fileExtension =
                fileNameParts[fileNameParts.length - 1].toLowerCase();
            if (fileNameParts.length > 2 && type == "web") {
                setValidateWebDimension("Images with multiple extensions (or periods) in the file name are not allowed");
                setUploadSpinner(false);
                return;
            }
            if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "jpeg" && type == "web")) {
                setValidateWebDimension("Only PNG, JPG and JPEG foramt images are allowed");
                setUploadSpinner(false);
                return;
            }
            if (file.size > 5 * 1024 * 1024 && type == "web") {
                setValidateWebDimension(`File size should not exceed 5MB`);
                setUploadSpinner(false);
                return;
            }
            const img = new window.Image();
            img.src = URL.createObjectURL(file[0]);
            img.onload = async () => {
                URL.revokeObjectURL(img.src);
                const width = img.width;
                const height = img.height;
                // const isSixteenNine = Math.abs(aspectRatio - (64 / 5)) < 0.01;
                if (type === "web" && (width !== 800 || height !== 800)) {
                    setValidateWebDimension('Please use an image that is in the ratio - 800px wide by 800px tall');
                    setUploadSpinner(false);
                    return;
                } else {
                    const logoFormData = new FormData();
                    if (file && file[0]) {
                        logoFormData.append('sourceImage', file[0]);
                        logoFormData.append('destImagepath', 'contactprofileimages');
                        const resLogo = await submitImageForm(logoFormData);
                        if (resLogo && resLogo.status === 201) {
                            setAdImagePath(resLogo.data.fileUrl);
                            setAdSigndeUrl(resLogo.data.fullpath);
                            setUploadSpinner(false);
                        } else {
                            setUploadSpinner(false);
                        }
                    }
                }
            }
        }
    }

    useEffect(() => {

        async function getEventById() {
            setPopupLoader(true);
            setOpenAdsModal(true);
            const allFaqQuestions = await authFetcher(
                getEndpointUrl(ENDPOINTS.getEventById(faqId)),
            );
            const eventDatas: faqQuestions = allFaqQuestions.data;
            setValue("eventname", eventDatas.eventName)
            setValue("eventdescription", eventDatas.eventDescription)
            setValue("eventURL", eventDatas.eventUrl)
            setValue("eventLocation", eventDatas.eventLocation)
            setValue("eventLogo", eventDatas.eventLogo);
            setValue("startDate", eventDatas.eventStartDate);
            setValue("endDate", eventDatas.eventEndDate);
            setAdImagePath(eventDatas.eventLogo);
            setAdSigndeUrl(eventDatas.signedUrl);
            setStartDate(new Date(eventDatas.eventStartDate));
            setEndDate(new Date(eventDatas.eventEndDate));
            if (eventDatas.EventAttendees) {
                const EventCompanies = eventDatas.EventAttendees.map((company) => ({
                    id: company.Companies.id,
                    name: company.Companies.name,
                }));
                setSelectedCompanies(prevSelectedCompanies => [
                    ...prevSelectedCompanies,
                    ...EventCompanies,
                ]);
                const companyIds: any = EventCompanies.map((company: { id: number }) => company.id);
                setValue("companies", companyIds)
            }
            setPopupLoader(false);
        }
        if (isEditClicked) {
            getEventById();
        }

    }, [isEditClicked]);
    useEffect(() => {
        reset();
        setAdImagePath('');
        setAdSigndeUrl('');
        setEndDate(undefined);
        setStartDate(undefined);
        setSelectedCompanies([]);
        if (!openAdsModal) {
            setIsEditClicked(false);
        }
    }, [openAdsModal]);

    const {
        submitForm: saveExcelData,
        success: successSavedExcelData,
        error: excelError,
    } = useCommonPostData<FormData>({
        url: getEndpointUrl(ENDPOINTS.uploadCompaniesCsv),
    });

    async function onSelectFile(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files) {
            setCsvLoader(true);
            setErrorCsv(false);
            if (event.target.files.length > 0) {
                const excelFile: File = event.target.files[0];
                // setFile(excelFile);

                const excelFormData = new FormData();
                excelFormData.append("file", excelFile);

                await saveExcelData(excelFormData)
                    .then((result) => {
                        if (result && result.data && result.data.success === true) {
                            const selectCompany = result.data.data;
                            console.log(selectCompany);
                            setSuccessCsv(true);
                            setTimeout(() => {
                                setSuccessCsv(false);
                            }, 5000);
                            setSelectedCompanies(prevSelectedCompanies => {
                                const existingIds = new Set(prevSelectedCompanies.map(company => company.id));
                                const uniqueNewCompanies: { id: number, name: string }[] = selectCompany.filter((company: { id: number; }) => !existingIds.has(company.id));
                                const combinedcompanies = [...prevSelectedCompanies, ...uniqueNewCompanies]
                                const companyIds: any = combinedcompanies.map((company: { id: number }) => +company.id);
                                setValue("companies", companyIds)
                                return combinedcompanies;
                            });
                            setCsvLoader(false);
                            const fileInput = document.getElementById(
                                "csv-upload",
                            ) as HTMLInputElement | null;
                            if (fileInput) {
                                fileInput.value = "";
                            }
                            return false;
                        } else {
                            setCsvLoader(false);
                            setErrorCsv(true);
                            setTimeout(() => {
                                setErrorCsv(false);
                            }, 5000);
                            return false;
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        setCsvLoader(false);
                        setErrorCsv(true);
                        setTimeout(() => {
                            setErrorCsv(false);
                        }, 3000);
                        return false;
                    }).finally(() => {
                        setCsvLoader(false);
                    })
                // router.push("/admin/company/create-companies");
            }
        }
    }

    async function downloadCsvTamplate() {
        const csvCompaniesTemplateUrl = "../Events_csv_template.csv";

        try {
            const response = await fetch(csvCompaniesTemplateUrl);

            const blob = await response.blob();

            const link = document.createElement("a");
            link.href = window.URL.createObjectURL(blob);
            link.download = "XDS-Spark_Events_csv_template.csv";
            link.click();

        } catch (error) {
            console.error("Error downloading CSV file:", error);
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
                        <li><Link href="/admin/events" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color anchor_active">Events</Link></li>
                        <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Service Categories</Link></li>
                        <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Articles</Link></li>
                        <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
                        <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Platinum Partners</Link></li>
                    </ul>
                        : ''}
                </div>
                <div className="faq_content col-span-4">
                    <div className="flex items-center justify-between">
                        <div className="sm:text-left">
                            <h1 className="font-bold text-gray-900 header-font"> Events </h1>
                        </div>
                        <button
                            className="text-sm font-medium inline-flex items-center justify-center border-gray-200 px-2 py-2 text-blue-300 transition hover:bg-gray-50 hover:text-blue-400 focus:outline-none"
                            type="button"
                            onClick={() => downloadCsvTamplate()}
                        >
                            {" "}
                            <svg
                                className="w-3.5 h-3.5 text-blue-300  me-1"
                                version="1.1"
                                fill="#0071C2"
                                id="fi_25407"
                                xmlns="http://www.w3.org/2000/svg"
                                x="0px"
                                y="0px"
                                viewBox="0 0 475.078 475.077"
                            >
                                <g>
                                    <g>
                                        <path
                                            d="M467.083,318.627c-5.324-5.328-11.8-7.994-19.41-7.994H315.195l-38.828,38.827c-11.04,10.657-23.982,15.988-38.828,15.988
                    c-14.843,0-27.789-5.324-38.828-15.988l-38.543-38.827H27.408c-7.612,0-14.083,2.669-19.414,7.994
                    C2.664,323.955,0,330.427,0,338.044v91.358c0,7.614,2.664,14.085,7.994,19.414c5.33,5.328,11.801,7.99,19.414,7.99h420.266
                    c7.61,0,14.086-2.662,19.41-7.99c5.332-5.329,7.994-11.8,7.994-19.414v-91.358C475.078,330.427,472.416,323.955,467.083,318.627z
                      M360.025,414.841c-3.621,3.617-7.905,5.424-12.854,5.424s-9.227-1.807-12.847-5.424c-3.614-3.617-5.421-7.898-5.421-12.844
                    c0-4.948,1.807-9.236,5.421-12.847c3.62-3.62,7.898-5.431,12.847-5.431s9.232,1.811,12.854,5.431
                    c3.613,3.61,5.421,7.898,5.421,12.847C365.446,406.942,363.638,411.224,360.025,414.841z M433.109,414.841
                    c-3.614,3.617-7.898,5.424-12.848,5.424c-4.948,0-9.229-1.807-12.847-5.424c-3.613-3.617-5.42-7.898-5.42-12.844
                    c0-4.948,1.807-9.236,5.42-12.847c3.617-3.62,7.898-5.431,12.847-5.431c4.949,0,9.233,1.811,12.848,5.431
                    c3.617,3.61,5.427,7.898,5.427,12.847C438.536,406.942,436.729,411.224,433.109,414.841z"
                                        ></path>
                                        <path
                                            d="M224.692,323.479c3.428,3.613,7.71,5.421,12.847,5.421c5.141,0,9.418-1.808,12.847-5.421l127.907-127.908
                    c5.899-5.519,7.234-12.182,3.997-19.986c-3.23-7.421-8.847-11.132-16.844-11.136h-73.091V36.543c0-4.948-1.811-9.231-5.421-12.847
                    c-3.62-3.617-7.901-5.426-12.847-5.426h-73.096c-4.946,0-9.229,1.809-12.847,5.426c-3.615,3.616-5.424,7.898-5.424,12.847V164.45
                    h-73.089c-7.998,0-13.61,3.715-16.846,11.136c-3.234,7.801-1.903,14.467,3.999,19.986L224.692,323.479z"
                                        ></path>
                                    </g>
                                </g>
                            </svg>
                            <span className=""> Download CSV Template</span>
                        </button>
                    </div>
                    <div className="text-end my-6">
                        <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2" onClick={() => { setOpenAdsModal(true); setValidateWebDimension('') }}>Add Event</button>
                    </div>
                    {!isLoading ?
                        <div className="space-y-4 pb-6">
                            {eventList && eventList.length > 0 &&
                                <>
                                    <Draggable onPosChange={handlePosChange}>
                                        {eventList.map((faq: faqQuestions, index: number) => {
                                            return (
                                                <div className="space-y-6">
                                                    <div className="text-base border_list font-medium lg:flex lg:items-center">
                                                        <div className="flex items-center">
                                                            <svg className="me-2 cursor-move" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <g id="DotsSixVertical">
                                                                    <path id="Vector" d="M13 7.5C13 7.79667 12.912 8.08668 12.7472 8.33336C12.5824 8.58003 12.3481 8.77229 12.074 8.88582C11.7999 8.99935 11.4983 9.02906 11.2074 8.97118C10.9164 8.9133 10.6491 8.77044 10.4393 8.56066C10.2296 8.35088 10.0867 8.08361 10.0288 7.79264C9.97094 7.50166 10.0006 7.20006 10.1142 6.92598C10.2277 6.65189 10.42 6.41762 10.6666 6.2528C10.9133 6.08797 11.2033 6 11.5 6C11.8978 6 12.2794 6.15804 12.5607 6.43934C12.842 6.72065 13 7.10218 13 7.5ZM20.5 9C20.7967 9 21.0867 8.91203 21.3334 8.74721C21.58 8.58238 21.7723 8.34811 21.8858 8.07403C21.9994 7.79994 22.0291 7.49834 21.9712 7.20737C21.9133 6.91639 21.7704 6.64912 21.5607 6.43934C21.3509 6.22956 21.0836 6.0867 20.7926 6.02882C20.5017 5.97094 20.2001 6.00065 19.926 6.11418C19.6519 6.22771 19.4176 6.41997 19.2528 6.66665C19.088 6.91332 19 7.20333 19 7.5C19 7.89783 19.158 8.27936 19.4393 8.56066C19.7206 8.84197 20.1022 9 20.5 9ZM11.5 14.5C11.2033 14.5 10.9133 14.588 10.6666 14.7528C10.42 14.9176 10.2277 15.1519 10.1142 15.426C10.0006 15.7001 9.97094 16.0017 10.0288 16.2926C10.0867 16.5836 10.2296 16.8509 10.4393 17.0607C10.6491 17.2704 10.9164 17.4133 11.2074 17.4712C11.4983 17.5291 11.7999 17.4994 12.074 17.3858C12.3481 17.2723 12.5824 17.08 12.7472 16.8334C12.912 16.5867 13 16.2967 13 16C13 15.6022 12.842 15.2206 12.5607 14.9393C12.2794 14.658 11.8978 14.5 11.5 14.5ZM20.5 14.5C20.2033 14.5 19.9133 14.588 19.6666 14.7528C19.42 14.9176 19.2277 15.1519 19.1142 15.426C19.0007 15.7001 18.9709 16.0017 19.0288 16.2926C19.0867 16.5836 19.2296 16.8509 19.4393 17.0607C19.6491 17.2704 19.9164 17.4133 20.2074 17.4712C20.4983 17.5291 20.7999 17.4994 21.074 17.3858C21.3481 17.2723 21.5824 17.08 21.7472 16.8334C21.912 16.5867 22 16.2967 22 16C22 15.6022 21.842 15.2206 21.5607 14.9393C21.2794 14.658 20.8978 14.5 20.5 14.5ZM11.5 23C11.2033 23 10.9133 23.088 10.6666 23.2528C10.42 23.4176 10.2277 23.6519 10.1142 23.926C10.0006 24.2001 9.97094 24.5017 10.0288 24.7926C10.0867 25.0836 10.2296 25.3509 10.4393 25.5607C10.6491 25.7704 10.9164 25.9133 11.2074 25.9712C11.4983 26.0291 11.7999 25.9993 12.074 25.8858C12.3481 25.7723 12.5824 25.58 12.7472 25.3334C12.912 25.0867 13 24.7967 13 24.5C13 24.1022 12.842 23.7206 12.5607 23.4393C12.2794 23.158 11.8978 23 11.5 23ZM20.5 23C20.2033 23 19.9133 23.088 19.6666 23.2528C19.42 23.4176 19.2277 23.6519 19.1142 23.926C19.0007 24.2001 18.9709 24.5017 19.0288 24.7926C19.0867 25.0836 19.2296 25.3509 19.4393 25.5607C19.6491 25.7704 19.9164 25.9133 20.2074 25.9712C20.4983 26.0291 20.7999 25.9993 21.074 25.8858C21.3481 25.7723 21.5824 25.58 21.7472 25.3334C21.912 25.0867 22 24.7967 22 24.5C22 24.1022 21.842 23.7206 21.5607 23.4393C21.2794 23.158 20.8978 23 20.5 23Z" fill="#0071C2" />
                                                                </g>
                                                            </svg>
                                                            {faq.eventName}
                                                        </div>
                                                        <div className="ms-auto text-end lg:mt-0 mt-3">

                                                            <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setDisplayModel(true); setFaqId(faq.id); setIsHide(faq.isArchieve) }}>
                                                                {!faq.isArchieve ?
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                                                        <path d="M30.9137 15.595C30.87 15.4963 29.8112 13.1475 27.4575 10.7937C24.3212 7.6575 20.36 6 16 6C11.64 6 7.67874 7.6575 4.54249 10.7937C2.18874 13.1475 1.12499 15.5 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C20.36 26 24.3212 24.3425 27.4575 21.2075C29.8112 18.8538 30.87 16.5062 30.9137 16.4075C30.9706 16.2796 31 16.1412 31 16.0012C31 15.8613 30.9706 15.7229 30.9137 15.595ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86704 18.7084 3.89572 17.4137 3.12499 16C3.89551 14.5862 4.86686 13.2915 6.00874 12.1562C8.79124 9.39875 12.1525 8 16 8C19.8475 8 23.2087 9.39875 25.9912 12.1562C27.1352 13.2912 28.1086 14.5859 28.8812 16C27.98 17.6825 24.0537 24 16 24ZM16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88377 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7573 20.2426C12.5965 21.0818 13.6656 21.6532 14.8294 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3924 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.1159 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0768 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8863 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20Z" fill="#0071C2" />
                                                                    </svg>
                                                                    :
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                                                        <path d="M6.73999 4.3275C6.65217 4.22851 6.54558 4.14793 6.42639 4.09044C6.3072 4.03294 6.17778 3.99968 6.04564 3.99257C5.91351 3.98546 5.78127 4.00465 5.6566 4.04902C5.53193 4.0934 5.41731 4.16207 5.31938 4.25107C5.22144 4.34007 5.14215 4.44762 5.08609 4.56749C5.03003 4.68736 4.99832 4.81717 4.9928 4.94938C4.98727 5.0816 5.00804 5.2136 5.05391 5.33772C5.09978 5.46185 5.16982 5.57564 5.25999 5.6725L7.66499 8.31875C3.12499 11.105 1.17249 15.4 1.08624 15.595C1.02938 15.7229 1 15.8613 1 16.0012C1 16.1412 1.02938 16.2796 1.08624 16.4075C1.12999 16.5062 2.18874 18.8538 4.54249 21.2075C7.67874 24.3425 11.64 26 16 26C18.2408 26.0128 20.4589 25.5514 22.5087 24.6462L25.2587 27.6725C25.3466 27.7715 25.4531 27.8521 25.5723 27.9096C25.6915 27.9671 25.8209 28.0003 25.9531 28.0074C26.0852 28.0145 26.2175 27.9953 26.3421 27.951C26.4668 27.9066 26.5814 27.8379 26.6793 27.7489C26.7773 27.6599 26.8566 27.5524 26.9126 27.4325C26.9687 27.3126 27.0004 27.1828 27.0059 27.0506C27.0115 26.9184 26.9907 26.7864 26.9448 26.6623C26.899 26.5381 26.8289 26.4244 26.7387 26.3275L6.73999 4.3275ZM12.6562 13.8075L17.865 19.5387C17.0806 19.9514 16.1814 20.0919 15.3085 19.938C14.4357 19.7842 13.6386 19.3449 13.0425 18.689C12.4464 18.0331 12.085 17.1978 12.0151 16.3143C11.9452 15.4307 12.1707 14.549 12.6562 13.8075ZM16 24C12.1525 24 8.79124 22.6012 6.00874 19.8438C4.86663 18.7087 3.89526 17.414 3.12499 16C3.71124 14.9012 5.58249 11.8263 9.04374 9.8275L11.2937 12.2963C10.4227 13.4119 9.97403 14.7995 10.0272 16.214C10.0803 17.6284 10.6317 18.9785 11.584 20.0256C12.5363 21.0728 13.8282 21.7496 15.2312 21.9363C16.6343 22.1231 18.0582 21.8078 19.2512 21.0462L21.0925 23.0713C19.4675 23.6947 17.7405 24.0097 16 24ZM16.75 12.0712C16.4894 12.0215 16.2593 11.8703 16.1102 11.6509C15.9611 11.4315 15.9053 11.1618 15.955 10.9012C16.0047 10.6407 16.1559 10.4105 16.3753 10.2614C16.5948 10.1123 16.8644 10.0565 17.125 10.1062C18.3995 10.3533 19.56 11.0058 20.4333 11.9664C21.3067 12.9269 21.8462 14.1441 21.9712 15.4362C21.9959 15.7003 21.9147 15.9634 21.7455 16.1675C21.5762 16.3717 21.3328 16.5003 21.0687 16.525C21.0375 16.5268 21.0062 16.5268 20.975 16.525C20.725 16.5261 20.4838 16.4335 20.2987 16.2655C20.1136 16.0976 19.9981 15.8664 19.975 15.6175C19.8908 14.758 19.5315 13.9486 18.9504 13.3097C18.3694 12.6708 17.5977 12.2364 16.75 12.0712ZM30.91 16.4075C30.8575 16.525 29.5912 19.3287 26.74 21.8825C26.6426 21.9725 26.5282 22.0423 26.4036 22.0877C26.2789 22.1331 26.1465 22.1533 26.014 22.147C25.8814 22.1407 25.7515 22.1081 25.6317 22.0511C25.5119 21.9942 25.4047 21.9139 25.3162 21.8151C25.2277 21.7162 25.1598 21.6008 25.1163 21.4754C25.0729 21.3501 25.0549 21.2173 25.0633 21.0849C25.0716 20.9525 25.1063 20.8231 25.1652 20.7042C25.2241 20.5854 25.306 20.4794 25.4062 20.3925C26.8051 19.1358 27.9801 17.6505 28.8812 16C28.1093 14.5847 27.1358 13.2891 25.9912 12.1538C23.2087 9.39875 19.8475 8 16 8C15.1893 7.99901 14.3799 8.06465 13.58 8.19625C13.4499 8.21925 13.3166 8.21626 13.1876 8.18743C13.0587 8.15861 12.9368 8.10452 12.8289 8.0283C12.721 7.95209 12.6293 7.85525 12.559 7.74338C12.4887 7.63151 12.4413 7.50683 12.4196 7.37654C12.3978 7.24625 12.402 7.11293 12.432 6.98428C12.462 6.85564 12.5172 6.73421 12.5945 6.62703C12.6717 6.51984 12.7694 6.42901 12.8819 6.3598C12.9944 6.29058 13.1195 6.24434 13.25 6.22375C14.1589 6.07367 15.0787 5.99883 16 6C20.36 6 24.3212 7.6575 27.4575 10.7937C29.8112 13.1475 30.87 15.4963 30.9137 15.595C30.9706 15.7229 31 15.8613 31 16.0012C31 16.1412 30.9706 16.2796 30.9137 16.4075H30.91Z" fill="#8899A8" />
                                                                    </svg>

                                                                }

                                                            </button>
                                                            <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setFaqId(faq.id); setIsEditClicked(true) }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                                                    <path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" fill="#0071C2" />
                                                                </svg>

                                                            </button>
                                                            <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setDeleteModel(true); setFaqId(faq.id); }}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                                                    <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#E10E0E" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </Draggable>
                                </>
                            }
                        </div>
                        :
                        <div className="flex justify-center items-center">
                            <Spinner />
                        </div>

                    }


                </div>

            </div>
            <Modal
                show={deleteModel}
                onClose={() => { setDeleteModel(false); }}
                size="sm"
            >
                <Modal.Header className="modal_header">
                    <b>Are you sure?</b>
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div className="">
                            <p className="text-sm default_text_color font-normal leading-6">
                                You are about to delete
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button
                        color="gray"
                        className="h-[40px] button_cancel"
                        onClick={() => {
                            setDeleteModel(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-[40px] button_blue"
                        onClick={deleteFaqs}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* Archive Model  */}
            <Modal
                show={displayModel}
                onClose={() => { setDisplayModel(false); }}
                size="sm"
            >
                <Modal.Header className="modal_header">
                    <b>Are you sure?</b>
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div className="">
                            <p className="text-sm default_text_color font-normal leading-6">
                                {!isHide ? 'You are about to hide the Event' : 'You are about to show the Event'}
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button
                        color="gray"
                        className="h-[40px] button_cancel"
                        onClick={() => {
                            setDisplayModel(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-[40px] button_blue"
                        onClick={faqHide}
                    >
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={openAdsModal} onClose={() => { setOpenAdsModal(false); setValidateWebDimension('') }} size="lg" className="text_box_readuce add_advertisement">
                <Modal.Header className="modal_header"> {isEditClicked ? 'Update' : 'Add'} Event</Modal.Header>
                <form className="overflow-auto flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
                    <Modal.Body>
                        {popupLoader ? <div className="pt-6 pl-44"> <Spinner /></div> :
                            <>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Event Name" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <TextInput {...register("eventname", ({
                                        required: {
                                            value: true,
                                            message: 'Event name required'
                                        },
                                    }))} type="text" placeholder="" shadow sizing="sm" />
                                    <p className="text-red-600 text-xs">
                                        {errors?.eventname?.message}
                                    </p>
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Event Description" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <Textarea  {...register("eventdescription", ({
                                        required: {
                                            value: true,
                                            message: 'Event description required'
                                        }
                                    }))} placeholder="" shadow />
                                    <p className="text-red-600 text-xs">
                                        {errors?.eventdescription?.message}
                                    </p>
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Event URL" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <TextInput {...register("eventURL", ({
                                        required: {
                                            value: true,
                                            message: "Event url required"
                                        }
                                    }))} type="text" placeholder="" shadow sizing="sm" />
                                    <p className="text-red-600 text-xs">
                                        {errors?.eventURL?.message}
                                    </p>
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Event Location" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <TextInput   {...register("eventLocation", ({
                                        required: {
                                            value: true,
                                            message: "Event location required"
                                        }
                                    }))} type="text" placeholder="" shadow sizing="sm" />
                                    <p className="text-red-600 text-xs">
                                        {errors?.eventLocation?.message}
                                    </p>
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="banner" value="Event Logo" className="font-bold text-xs" />
                                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                    </div>
                                    <p className="text-xs"> For best results, We recommend 800px by 800px. Please keep the file size under 5MB.</p>
                                    <div className="relative mt-2">
                                        <label htmlFor="file-upload"
                                            className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                                            <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload Event Logo
                                        </label>
                                        <input id="file-upload" type="file"
                                            onChange={(e) => filehandle(e, "web")}
                                        />
                                        {uploadSpinner &&
                                            <div className="-top-3 absolute left-36"> <Spinner /></div>
                                        }
                                    </div>
                                    {validateWebDimension &&
                                        <span className="text-xs text-red-600">{validateWebDimension}</span>
                                    }


                                    {!uploadSpinner &&
                                        <img
                                            className="mt-2"
                                            src={adSigndeUrl}
                                            width={160}
                                        />
                                    }
                                    <p className="text-red-600 text-xs">
                                        {imageValidating}
                                    </p>

                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
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
                                            <span className="text-xs ml-0.5" style={{ color: 'red' }}> *</span>
                                        </div>
                                        <DatePicker
                                            autoComplete="off"
                                            className="block w-full border disabled:cursor-not-allowed disabled:opacity-50 bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-cyan-500 dark:focus:ring-cyan-500 p-2.5 text-sm rounded-lg"
                                            minDate={startDate}
                                            selected={endDate}
                                            {...register("endDate", ({
                                                required: {
                                                    value: true,
                                                    message: 'Enddate required'
                                                }
                                            }))}
                                            onChange={(date: Date) => {
                                                handleDateChange(date, 'endDate');
                                            }}

                                        />
                                        <p className="text-red-600 text-xs">
                                            {errors?.endDate?.message}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="company" value="Event Attending Companies" className="font-bold text-xs" />

                                    </div>
                                    <Multiselect
                                        emptyRecordMsg="-"
                                        className="block w-full"
                                        options={companyOptions}
                                        selectedValues={selectedCompanies}
                                        displayValue="name"
                                        onSelect={onAddOrRemovePlatforms}
                                        onRemove={onAddOrRemovePlatforms}
                                        placeholder="Search by Service Provider Name"
                                        onSearch={handleSearch}
                                        {...register("companies")}
                                    />
                                    {/* {selectedCompanies.length > 5 && (
                                <button
                                type="button"
                                className="text-blue-500 underline mt-2"
                                onClick={toggleView}
                                >
                                {isExpanded ? "See Less" : "See More"}
                                </button>
                            )} */}
                                </div>
                                <div className="relative">
                                    <div className="pt-4">
                                        {csvLoader ?
                                            <div className="top-1 absolute left-16"> <Spinner /></div>
                                            :
                                            <div>
                                                <label htmlFor="csv-upload"
                                                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard_2'>
                                                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#005ec4" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload companies csv
                                                </label>
                                                <div className="top-6 absolute left-40 ml-2">
                                                    <Tooltip
                                                        content="Uploading csv file column name should be as 'Company Name'."
                                                        className="tier_tooltip"
                                                    >
                                                        <svg
                                                            className="w-4 h-4 text-gray-800 ml-2 cursor-pointer"
                                                            aria-hidden="true"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="currentColor"
                                                            viewBox="0 0 26 26"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Zm9.4-5.5a1 1 0 1 0 0 2 1 1 0 1 0 0-2ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4c0-.6-.4-1-1-1h-2Z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    </Tooltip></div>
                                            </div>
                                        }

                                    </div>
                                    <input
                                        id="csv-upload"
                                        type='file'
                                        onChange={(e) => onSelectFile(e)}
                                    />
                                    {successCsv &&
                                        <p className="text-sm text-green-600">Csv import successfull.</p>
                                    }
                                    {errorCsv &&
                                        <p className="text-sm text-red-600">Csv import failed, try again.</p>
                                    }
                                </div>
                            </>
                        }
                    </Modal.Body>
                    <Modal.Footer className="modal_footer">

                        <Button color="gray" onClick={() => { setOpenAdsModal(false);; setValidateWebDimension('') }}> Cancel</Button>
                        <Button type="submit"> {isEditClicked ? 'Update' : 'Add'} Event</Button>
                    </Modal.Footer>
                </form>
            </Modal>
        </div >

    );
};

export default Faqs;
