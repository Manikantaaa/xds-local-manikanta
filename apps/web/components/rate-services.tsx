import { useState, useEffect } from "react";
import DataTable from "react-data-table-component";
import "/public/css/detatable.css";
import Link from "next/link";
import { Label, Tooltip, Button, Modal, TextInput, Textarea, Select } from "flowbite-react";
import { useUserContext } from "@/context/store";
import { authFetcher, authPostdata, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { encryptString, extractNumber, formatDate, formatNumberIndianWithRegex } from "@/services/common-methods";
import useFormUpdate from "@/hooks/useFormUpdate";
import Spinner from "./spinner";
import { isValidJSON } from "@/constants/serviceColors";
import { sanitizeData } from "@/services/sanitizedata";
import usePagePermissions from "@/hooks/usePagePermissions";
import { userPermissionsType } from "@/types/user.type";

interface serviceRateTypes {
    buyerId: number,
    companyId: number,
    service: string,
    dayRate: string,
    montlyRate: string,
    discountRate: string,
    notes: string,
}
interface serviceRateUpdatesTypes {
    id: number,
    buyerId: number,
    companyId: number,
    service: string,
    dayRate: string,
    montlyRate: string,
    discountRate: string,
    notes: string,
}
const RateServices = (props: { companyId: number, setLastUpdatedDate: (setLastUpdatedDate: string) => void, userPermissions: userPermissionsType }) => {
    const [openModal, setOpenModal] = useState(false);

    const [serviceRates, setServiceRates] = useState<serviceRateUpdatesTypes[]>([]);
    const [serviceName, setServiceName] = useState<string>("");
    const [dayRate, setDayRate] = useState<string>("");
    const [montlyRate, setMontlyRate] = useState<string>("");
    const [discountRate, setDiscountRate] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [updateServiceRates, setUpdateServiceRates] = useState<boolean>(false);
    const [serviceId, setServiceId] = useState<number>(0);
    const [isValidNotesFormData, setIsValidNotesFormData] = useState(true);
    const [openDeleteNoteModal, setOpenDeleteNoteModal] = useState(false);
    const [deleteRateCardModel, setdeleteRateCardModel] = useState(false);
    const [fileName, setFileName] = useState<string>('');
    const [fileDate, setFileDate] = useState<string>('');
    const [filePath, setFilePath] = useState<string>('');
    const [validateRatecard, setValidateRatecard] = useState<string>('');
    const [openNotes, setOpenNotes] = useState<boolean>(false);
    const [loader, setLoader] = useState<boolean>(false);
    const [isVisible, setIsVisible] = useState(false);
    const [rateServiceId, setRateServiceId] = useState<string>("");
    const [rateType, setRateType] = useState<string>("");
    const [duration, setDuration] = useState<string>("");
    const [rateTotalvalue, setRateTotalvalue] = useState<number>(0);
    const [rateTypeError, setRateTypeError] = useState<string>("");
    const [discountTypeError, setDiscountTypeError] = useState<string>("");

    const { user } = useUserContext();
    // const userPagePermissions = usePagePermissions(13);
    useEffect(() => {
        getOverAllRatesdata();
        getServiceratesdata();
    }, []);

    const getServiceratesdata = async () => {
        if (user?.companyId != props.companyId) {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getAllServiceRates(props.companyId))}`)
                .then((result) => {
                    if (result.data && result.success == true) {
                        setServiceRates(result.data);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }
    const columns = [
        {
            name: "Service",
            cell: (row: serviceRateUpdatesTypes) => row.service,
            sortable: true,
            sortFunction: (a: serviceRateUpdatesTypes, b: serviceRateUpdatesTypes) => a.service.localeCompare(b.service),
        },
        {
            name: "Day Rate",
            cell: (row: serviceRateUpdatesTypes) => row.dayRate,
            sortable: true,
            sortFunction: (a: serviceRateUpdatesTypes, b: serviceRateUpdatesTypes) => a.dayRate.localeCompare(b.dayRate),
        },
        {
            name: "Monthly Rate",
            cell: (row: serviceRateUpdatesTypes) => row.montlyRate,
            sortable: true,
            sortFunction: (a: serviceRateUpdatesTypes, b: serviceRateUpdatesTypes) => a.montlyRate.localeCompare(b.montlyRate),
        },
        {
            name: "Discounted Rate",
            cell: (row: serviceRateUpdatesTypes) => row.discountRate,
            sortable: true,
            sortFunction: (a: serviceRateUpdatesTypes, b: serviceRateUpdatesTypes) => a.discountRate.localeCompare(b.discountRate),
        },
        {
            name: "Comments",
            cell: (row: serviceRateUpdatesTypes) => (
                <div className="leading-5 w-[350px] truncate" >
                    {isValidJSON(row.notes) ? JSON.parse(row.notes) : row.notes}
                    {row.notes && row.notes != '' &&
                        <div className="fullview_desc " ><abbr className="view_note_btn" onClick={() => { setOpenNotes(true), setNotes(isValidJSON(row.notes) ? JSON.parse(row.notes) : row.notes) }}> <svg className="w-[20px] h-[20px] text-gray-800 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                            <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg> View</abbr>
                        </div>
                    }
                    {/* <div className="fullview_desc" ><abbr className="view_note_btn" onClick={() =>{setOpenNotes(true), setNotes(row.notes)}}> <svg className="w-[20px] h-[20px] text-gray-800 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                            <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg> View</abbr></div> */}
                </div>
            ),
            sortable: true,
            sortFunction: (a: serviceRateUpdatesTypes, b: serviceRateUpdatesTypes) => a.notes.localeCompare(b.notes),
        },
        {
            name: "Actions",
            omit: ((props.userPermissions.isCompanyUser && (!props.userPermissions.canWrite && !props.userPermissions.canDelete))),
            cell: (row: serviceRateUpdatesTypes) => (
                <div className="space-x-4">
                    {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) ?
                        <button className="text-blue-300" onClick={(e) => { e.preventDefault(); setDiscountTypeError(""); setUpdateServiceRates(true); openNoteUpdateModal(row); setIsVisible(false) }}>
                            <svg className="w-3.5 h-3.5 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z"></path></svg> Edit
                        </button>
                        :
                        ""
                    }
                    {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canDelete)) ? <button className="text-blue-300" onClick={() => { setServiceId(row.id); setOpenDeleteNoteModal(true); setServiceName(row.service); setIsVisible(false) }}>
                        <svg
                            className="me-0.5 w-4 h-4 blue_c  dark:text-white"
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
                            />
                        </svg> Delete
                    </button>
                    :
                    ""
                    }
                </div>
            ),
            // <button className='btn btn-success' onClick={() => handleButtonClick(row)}>Click Me</button>,
        },
    ];
    const tableHeaderstyle = {
        headCells: {
            style: {
                fontWeight: "bold",
                fontSize: "14px",
                backgroundColor: "#F1F4FA",
            },
        },
    };

    async function openAddNewNoteModal() {
        setIsValidNotesFormData(true);
        setUpdateServiceRates(false);
        setServiceName("");
        setDayRate("");
        setMontlyRate("");
        setDiscountRate("");
        setNotes("");
        setOpenModal(true);
    }

    const openNoteUpdateModal = (servcie: serviceRateUpdatesTypes) => {
        setIsValidNotesFormData(true);
        setServiceName(servcie.service);
        setServiceId(servcie.id);
        setDayRate(servcie.dayRate);
        setMontlyRate(servcie.montlyRate);
        setDiscountRate(servcie.discountRate);
        setNotes(isValidJSON(servcie.notes) ? JSON.parse(servcie.notes) : servcie.notes);
        setOpenModal(true);
    };

    function checkValidityOfNotesForm(): boolean {
        if (!serviceName && serviceName == "" && !dayRate && dayRate == "" && montlyRate == "" && discountRate == "" && notes == "") {
            setIsValidNotesFormData(false);
            return false;
        } else {
            setIsValidNotesFormData(true);
            return true;
        }
    }

    async function addNewNote() {
        const isValidForm = checkValidityOfNotesForm();
        if (!isValidForm) {
            setOpenModal(false);
            return;
        }
        let addNoteData = {
            buyerId: (user && user.companyId) ? user.companyId : 0,
            service: serviceName,
            dayRate: dayRate,
            montlyRate: montlyRate,
            discountRate: discountRate,
            notes: notes != '' ? JSON.stringify(notes) : notes,
            companyId: props.companyId,
        }
        addNoteData = sanitizeData(addNoteData);
        const addedNewNote = await authPostdata<serviceRateTypes>(`${getEndpointUrl(ENDPOINTS.addServiceRates)}`, addNoteData).catch((err) => {
            console.log(err);
        });
        setOpenModal(false);
        getServiceratesdata();
        props.setLastUpdatedDate(formatDate(new Date()));
    }

    async function updateNote() {
        const isValidForm = checkValidityOfNotesForm();
        if (!isValidForm) {
            setOpenModal(false);
            return;
        }
        let updateNoteData = {
            buyerId: (user && user.companyId) ? user.companyId : 0,
            service: serviceName,
            dayRate: dayRate,
            montlyRate: montlyRate,
            discountRate: discountRate,
            notes: notes != '' ? JSON.stringify(notes) : notes,
            companyId: props.companyId,
        }
        updateNoteData = sanitizeData(updateNoteData);
        const updateNote = await authPutWithData<serviceRateTypes>(`${getEndpointUrl(ENDPOINTS.updateServiceRates(serviceId))}`, updateNoteData).catch((err) => {
            console.log(err);
        });
        setOpenModal(false);
        getServiceratesdata();
    }

    async function deleteNote() {
        const deleteNote = await deleteItem(`${getEndpointUrl(ENDPOINTS.deleteServiceRate(serviceId))}`).catch((err) => {
            console.log(err);
        })
        if (deleteNote) {
            setOpenDeleteNoteModal(false);
            getServiceratesdata();
        }
        setOpenDeleteNoteModal(false);
    }

    const { submitForm: submitUploadRateCard } = useFormUpdate({
        url: getEndpointUrl(ENDPOINTS.uploadRateCard),
    });
    const { submitForm: submitDeleteRateCard } = useFormUpdate({
        url: getEndpointUrl(ENDPOINTS.deleteRateCard),
    });

    const filehandle = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        setValidateRatecard('');
        const file: any = e.target.files;
        if (file && file.length > 0) {
            const fileNameParts = file[0].name.split(".");
            const fileExtension =
                fileNameParts[fileNameParts.length - 1].toLowerCase();
            if (fileNameParts.length > 2) {
                setValidateRatecard("Files with multiple extensions (or periods) in the file name are not allowed");
                return;
            }
            if ((fileExtension !== "pdf")) {
                setValidateRatecard("Only a PDF file can be uploaded.");
                return;
            }
            if (file[0].size > 10 * 1024 * 1024) {
                setValidateRatecard("Keep pdf file under 10 MB");
                return;
            }

            const uploadRateCard = new FormData();
            uploadRateCard.append("companyId", (props.companyId).toString());
            uploadRateCard.append("userId", ((user && user.companyId) ? user.companyId : 0).toString());
            uploadRateCard.append("file", file[0]);
            uploadRateCard.append("filaName", file[0].name + '---' + formatDate(new Date()).toString());
            uploadRateCard.append("pdfType", "rateCardPdf");
            uploadRateCard.append("token", encryptString(formatDate(new Date()).toString(), process.env.NEXT_PUBLIC_XDS_EMAIL_SECRET_KEY));
            if (validateRatecard == '') {
                setLoader(true);
                const res = await submitUploadRateCard(uploadRateCard);
                if (res && res.data) {
                    const fileName = res.data.data.fileName.split("---"); res.data.data;
                    // const pstDateString = fileName[fileName.length - 1];
                    // const localDateString = convertPstToLocalTime(pstDateString);
                    setFileName(fileName[0]);
                    setFileDate(fileName[fileName.length - 1]);
                    setFilePath(res.data.data.rateCardUrl);
                    setLoader(false);
                }
                else {
                    console.log(res);
                }
                setLoader(false);
            }
        }
    }

    const deleteFile = async () => {
        setValidateRatecard('');
        setLoader(true);
        const deleteRateCard = new FormData();
        deleteRateCard.append("companyId", (props.companyId).toString());
        deleteRateCard.append("userId", ((user && user.companyId) ? user.companyId : 0).toString());
        const res = await submitDeleteRateCard(deleteRateCard);
        if (res.data && res.data) {
            setFileName('');
            setFileDate('');
            setLoader(false);
        }
        setdeleteRateCardModel(false);
    }

    const getOverAllRatesdata = async () => {
        if (user?.companyId != props.companyId) {
            await authFetcher(`${getEndpointUrl(ENDPOINTS.getOverallRatings(props.companyId))}`)
                .then((result) => {
                    if (result.data && result.success == true) {
                        const fileName = result.data.fileName.split("---");
                        // const pstDateString = fileName[fileName.length - 1];
                        // const localDateString = convertPstToLocalTime(pstDateString);
                        setFileName(fileName[0]);
                        setFileDate(fileName[fileName.length - 1]);
                        setFilePath(result.data.rateCardUrl);
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    }

    const toggleVisibility = () => {
        setRateServiceId("");
        setRateTotalvalue(0);
        setRateType("");
        setDuration("");
        setRateTypeError("");
        setIsVisible(!isVisible);
    };

    useEffect(() => {
        setRateTypeError("");
        if (rateServiceId != "" && rateType != "" && duration != "") {
            serviceRates.map((services: { id: number, service: string, dayRate: string, montlyRate: string, discountRate: string }) => {
                if (rateServiceId == services.id.toString()) {
                    if (services.dayRate != null && services.dayRate !== "" && services.montlyRate != null && services.montlyRate !== "") {
                        const dayOnly = Number(extractNumber(services.dayRate));
                        const monthOnly = Number(extractNumber(services.montlyRate));
                        let discountOnly = 0;
                        if (services.discountRate != null && services.discountRate !== "") {
                            discountOnly = Number(extractNumber(services.discountRate));
                        }
                        if (rateType == '0') {
                            const discount = dayOnly * Number(duration) * discountOnly / 100;
                            const rate = dayOnly * Number(duration) - discount;
                            setRateTotalvalue(rate);
                        } else {
                            const discount = monthOnly * Number(duration) * discountOnly / 100;
                            const rate = monthOnly * Number(duration) - discount;
                            setRateTotalvalue(rate);
                        }
                    } else {
                        setRateTypeError("Please update rates for selected service");
                    }
                }
            })
        } else {
            setRateTotalvalue(0);
        }

    }, [rateServiceId, rateType, duration]);

    const validateDiscount = (value: string) => {
        // if (value.includes('.')) {
        //     setDiscountTypeError("Decimal values not allowed.");
        //     return;
        //   }
        const discount = Number(extractNumber(value));
        if (discount > 100 || discount < 0) {
            setDiscountTypeError("Please give discounted rate between 0 and 100.");
        } else {
            setDiscountRate(value);
            setDiscountTypeError("");
        }
    }

    return (

        <>
            {!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canRead) ?
                <>
                    <div className="contactus">
                        <div className="flex items-center justify-between py-6">
                            <div className="text-left">
                                <h1 className="font-bold default_text_color header-font">
                                    Rates by Service
                                </h1>
                            </div>
                            {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) &&
                                <div className="link_color text-sm cursor-pointer" onClick={() => { setOpenModal(true); setDiscountTypeError(""); openAddNewNoteModal(); setIsVisible(false) }}>
                                    <svg className="w-3.5 h-3.5 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z"></path></svg> Add New</div>}
                        </div>
                        <div className="py-0 myspark_rateservices_table">
                            {serviceRates && serviceRates.length > 0 ?
                                <DataTable
                                    customStyles={tableHeaderstyle}
                                    columns={columns}
                                    data={serviceRates}
                                    highlightOnHover={true}
                                    pagination={true}
                                    paginationPerPage={5}
                                    paginationRowsPerPageOptions={[5, 10]}
                                    paginationComponentOptions={{
                                        rowsPerPageText: "Records per page:",
                                        rangeSeparatorText: "out of",
                                    }}
                                />

                                :
                                <p className="text-sm font-normal  italic">
                                    You have not yet entered any rates by service.
                                </p>
                            }

                        </div>
                    </div>
                    {serviceRates && serviceRates.length > 0 &&
                        <div className="text-left pt-3">
                            <div className="rete_calculator p-4">
                                <h2 className="font-semibold default_text_color text-[18px]" onClick={toggleVisibility}>
                                    Rate Calculator
                                    {!isVisible ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-2.5 cursor-pointer">
                                        <path d="M8.20414 3.70215L15.7041 11.2021C15.8086 11.3067 15.892 11.4309 15.9487 11.5676C16.0055 11.7043 16.0347 11.851 16.0347 11.999C16.0347 12.1471 16.0055 12.2937 15.9487 12.4304C15.892 12.5672 15.8086 12.6914 15.7041 12.7959L8.20414 20.2959C7.99279 20.5072 7.70614 20.6259 7.40726 20.6259C7.10837 20.6259 6.82173 20.5072 6.61039 20.2959C6.39904 20.0845 6.28031 19.7979 6.28031 19.499C6.28031 19.2001 6.39904 18.9134 6.61039 18.7021L13.3146 12L6.60971 5.2959C6.39836 5.08455 6.27963 4.79791 6.27963 4.49902C6.27963 4.20014 6.39836 3.91349 6.60971 3.70215C6.82105 3.4908 7.1077 3.37207 7.40659 3.37207C7.70547 3.37207 7.99212 3.4908 8.20346 3.70215L8.20414 3.70215Z" fill="#0071C2" />
                                    </svg>
                                        : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="ml-2.5 cursor-pointer">
                                            <path d="M20.2959 9.79586L12.7959 17.2959C12.6914 17.4007 12.5672 17.484 12.4304 17.5407C12.2937 17.5975 12.1471 17.6267 11.999 17.6267C11.851 17.6267 11.7043 17.5975 11.5676 17.5407C11.4309 17.484 11.3067 17.4007 11.2021 17.2959L3.70215 9.79586C3.4908 9.58451 3.37207 9.29787 3.37207 8.99898C3.37207 8.7001 3.4908 8.41345 3.70215 8.20211C3.91349 7.99076 4.20014 7.87203 4.49902 7.87203C4.79791 7.87203 5.08455 7.99076 5.2959 8.20211L12 14.9062L18.704 8.20117C18.9154 7.98983 19.202 7.87109 19.5009 7.87109C19.7998 7.87109 20.0864 7.98983 20.2978 8.20117C20.5091 8.41252 20.6278 8.69916 20.6278 8.99805C20.6278 9.29693 20.5091 9.58358 20.2978 9.79492L20.2959 9.79586Z" fill="#0071C2" />
                                        </svg>}
                                </h2>
                                {isVisible && (
                                    <div className="mt-3 space-y-4">
                                        <div className="service">
                                            <div className="mb-2 block">
                                                <Label
                                                    htmlFor="service-name"
                                                    value="Service Type"
                                                    className="font-normal text-sm"
                                                />
                                            </div>
                                            <div className="text_box_readuce flex items-center">
                                                <Select sizing="sm" className="w-[240px]" onChange={(e) => setRateServiceId(e.target.value)}>
                                                    <option value="Select">Select</option>
                                                    {serviceRates && serviceRates.length > 0 && serviceRates.map((services: { id: number, service: string }) => (
                                                        <option value={services.id} >{services.service}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 block">
                                                <Label
                                                    htmlFor="service-name"
                                                    value="Day or Month"
                                                    className="font-bold text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="radio"
                                                    value="0"
                                                    name="radio"
                                                    id="day"
                                                    onChange={(e) => setRateType(e.target.value)}
                                                    className="aspect-square h-4 w-4 rounded-full border border-gray-300"
                                                />
                                                <Label htmlFor="day" className="font-normal text-sm">
                                                    Day Rate
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2 pt-1">
                                                <input
                                                    type="radio"
                                                    name="radio"
                                                    value="1"
                                                    id="month"
                                                    onChange={(e) => setRateType(e.target.value)}
                                                    className="aspect-square h-4 w-4 rounded-full border border-gray-300"
                                                />
                                                <Label htmlFor="month" className="font-normal text-sm">
                                                    Monthly Rate
                                                </Label>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="mb-2 block">
                                                <Label
                                                    htmlFor="founder-name"
                                                    value="Duration"
                                                    className="font-bold text-sm"
                                                />
                                            </div>
                                            <TextInput
                                                autoComplete="off"
                                                id="duration"
                                                className="focus:border-blue-300 w-[240px]"
                                                type="number"
                                                placeholder={`${rateType == "" ? "How many months/days?" : (rateType == "0" ? "How many days?" : "How many months?")}`}
                                                min="1"
                                                onChange={(e) => setDuration(e.target.value)}
                                            />
                                        </div>
                                        <div className="w-[240px]"> <hr /> </div>
                                        <div className="text-sm font-bold flex flex-inline">Total: $ {formatNumberIndianWithRegex(rateTotalvalue)}<Tooltip className="tier_tooltip_partner_status" content="If a discount % is applied to a service above, it will be calculated as part of this total." trigger="hover">
                                            <svg className="w-[14px] h-[14px] text-gray-700 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                            </svg>
                                        </Tooltip></div>
                                        <div className="w-[240px]"> <hr /> </div>
                                        {rateTypeError != "" &&
                                            <div className="text-sm text-red-500">{rateTypeError}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    }
                    <div className="reatepdf pt-8">

                        <div className="grid lg:grid-flow-col lg:auto-cols-max items-center">

                            {/* {!fileName ?  */}
                            <div className="">
                                <label htmlFor="file-upload"
                                    className='text-sm font-medium custom-file-upload inline-flex items-center justify-center gap-1.5 uploadratecard'>
                                    <svg className="w-3.5 h-3.5 text-blue-300" fill="#fff" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 475.078 475.077"><g><g><path d="M467.081,327.767c-5.321-5.331-11.797-7.994-19.411-7.994h-121.91c-3.994,10.657-10.705,19.411-20.126,26.262   c-9.425,6.852-19.938,10.28-31.546,10.28h-73.096c-11.609,0-22.126-3.429-31.545-10.28c-9.423-6.851-16.13-15.604-20.127-26.262   H27.408c-7.612,0-14.083,2.663-19.414,7.994C2.664,333.092,0,339.563,0,347.178v91.361c0,7.61,2.664,14.089,7.994,19.41   c5.33,5.329,11.801,7.991,19.414,7.991h420.266c7.61,0,14.086-2.662,19.41-7.991c5.332-5.328,7.994-11.8,7.994-19.41v-91.361   C475.078,339.563,472.416,333.099,467.081,327.767z M360.025,423.978c-3.621,3.617-7.905,5.428-12.854,5.428   s-9.227-1.811-12.847-5.428c-3.614-3.613-5.421-7.898-5.421-12.847s1.807-9.236,5.421-12.847c3.62-3.613,7.898-5.428,12.847-5.428   s9.232,1.814,12.854,5.428c3.613,3.61,5.421,7.898,5.421,12.847S363.638,420.364,360.025,423.978z M433.109,423.978   c-3.614,3.617-7.898,5.428-12.848,5.428c-4.948,0-9.229-1.811-12.847-5.428c-3.613-3.613-5.42-7.898-5.42-12.847   s1.807-9.236,5.42-12.847c3.617-3.613,7.898-5.428,12.847-5.428c4.949,0,9.233,1.814,12.848,5.428   c3.617,3.61,5.427,7.898,5.427,12.847S436.729,420.364,433.109,423.978z"></path><path d="M109.632,173.59h73.089v127.909c0,4.948,1.809,9.232,5.424,12.847c3.617,3.613,7.9,5.427,12.847,5.427h73.096   c4.948,0,9.227-1.813,12.847-5.427c3.614-3.614,5.421-7.898,5.421-12.847V173.59h73.091c7.997,0,13.613-3.809,16.844-11.42   c3.237-7.422,1.902-13.99-3.997-19.701L250.385,14.562c-3.429-3.617-7.706-5.426-12.847-5.426c-5.136,0-9.419,1.809-12.847,5.426   L96.786,142.469c-5.902,5.711-7.233,12.275-3.999,19.701C96.026,169.785,101.64,173.59,109.632,173.59z"></path></g></g></svg>Upload PDF Rate Card
                                </label>
                                <input id="file-upload" accept=".pdf" type="file" onChange={filehandle} />
                            </div>
                            {loader &&
                                <>
                                    <div className="flex justify-center items-center">
                                        <Spinner />
                                    </div></>
                            }
                            {/* :  */}
                            {fileName && fileName != "" &&
                                <div className="w-full text-end lg:pl-4 mt-4 lg:mt-0">
                                    <div id="alert-1" className="flex items-center p-1.5  text-gray-800 rounded-lg bg-blue-50 justify-around" role="alert">
                                        <div className="inline-flex">
                                            <svg className="w-6 h-6 text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                <path fill-rule="evenodd" d="M9 2.221V7H4.221a2 2 0 0 1 .365-.5L8.5 2.586A2 2 0 0 1 9 2.22ZM11 2v5a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2 2 2 0 0 0 2 2h12a2 2 0 0 0 2-2 2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2h-7Zm-6 9a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h.5a2.5 2.5 0 0 0 0-5H5Zm1.5 3H6v-1h.5a.5.5 0 0 1 0 1Zm4.5-3a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1.376A2.626 2.626 0 0 0 15 15.375v-1.75A2.626 2.626 0 0 0 12.375 11H11Zm1 5v-3h.375a.626.626 0 0 1 .625.626v1.748a.625.625 0 0 1-.626.626H12Zm5-5a1 1 0 0 0-1 1v5a1 1 0 1 0 2 0v-1h1a1 1 0 1 0 0-2h-1v-1h1a1 1 0 1 0 0-2h-2Z" clip-rule="evenodd" />
                                            </svg>
                                            {/* <div className="ms-3 text-sm font-medium">
                                    RatesbyService.pdf - <span className="text-gray-500">April 2, 2024</span>
                                    </div> */}

                                            <div className="ms-3 text-sm font-medium">
                                                <abbr className="w-[150px] truncate lg:inline-flex block">{fileName && fileName} </abbr>
                                                <span className="text-gray-500 lg:inline-flex block pl-2"> - {fileDate}</span>
                                            </div>

                                        </div>
                                        <div className=" ms-16">
                                            <button type="button" className="ms-auto  bg-blue-200 text-blue-400 rounded-lg  p-1.5 hover:bg-blue-100 inline-flex items-center justify-center h-8 w-8" data-dismiss-target="#alert-1" aria-label="Close">
                                                <Link prefetch={false} href={filePath} target="__blank" className="items-center justify-center">

                                                    <svg className="w-[24px] h-[24px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                        <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                                                        <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                    </svg>
                                                </Link>

                                            </button>
                                            <button type="button" onClick={() => setdeleteRateCardModel(true)} className="ms-2  bg-blue-200 text-gray-500 rounded-lg  p-1.5  hover:bg-blue-100 inline-flex items-center justify-center h-8 w-8" data-dismiss-target="#alert-1" aria-label="Close">
                                                <Link href={""}>

                                                    <svg className="w-[24px] h-[24px] text-blue-300" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                                                    </svg>
                                                </Link>
                                            </button>
                                        </div>
                                    </div>
                                </div>}
                            {/* } */}
                        </div>
                        {validateRatecard && validateRatecard != '' &&
                            <p className="text-red-600 text-sm pt-2">{validateRatecard}</p>
                        }


                    </div>

                    <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg" className="text_box_readuce">
                        <Modal.Header className="modal_header">Rates by Services</Modal.Header>
                        <Modal.Body>
                            <form className="flex flex-col gap-2">
                                <div>
                                    <div className="mb-2 inline-flex items-center">
                                        <Label htmlFor="services" value="Service" className="font-bold text-xs" />
                                        <Tooltip className="tier_tooltip_2 inline-flex" content="Enter a service. Eg. Art, Animation, Engineering, etc." trigger="hover">
                                            <svg className="w-[16px] h-[16px] text-gray-700 ms-2 -mt-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                                <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                            </svg>
                                        </Tooltip>
                                    </div>

                                    <TextInput id="services" onChange={(e) => setServiceName(e.target.value)} type="text" placeholder="" required shadow sizing="sm" value={serviceName} />
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="dayrate" value="Day Rate" className="font-bold text-xs" />
                                    </div>
                                    <TextInput id="dayrate" type="text" placeholder="" onChange={(e) => setDayRate(e.target.value)} required shadow sizing="sm" value={dayRate} />
                                </div>
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="monthrate" value="Monthly Rate" className="font-bold text-xs" />
                                    </div>
                                    <TextInput id="monthrate" type="text" placeholder="" onChange={(e) => setMontlyRate(e.target.value)} required shadow sizing="sm" value={montlyRate} />
                                </div>
                                <div>
                                    <div className="mb-2  inline-flex items-center">
                                        <Label htmlFor="discountrate" value="Discounted Rate" className="font-bold text-xs" /> <Tooltip className="tier_tooltip_2 inline-flex" content="This could indicate any type of discount you have negotiated. Details can be added here to notes." trigger="hover">
                                            <svg className="w-[16px] h-[16px] text-gray-700 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                                <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                                            </svg>
                                        </Tooltip>
                                    </div>
                                    <TextInput id="discountrate" type="text" placeholder="" onChange={(e) => validateDiscount(e.target.value)} required shadow sizing="sm" value={discountRate} />
                                </div>
                                {discountTypeError != "" &&
                                    <div className="text-xs text-red-500">{discountTypeError}
                                    </div>}
                                <div>
                                    <div className="mb-2 block">
                                        <Label htmlFor="note" value="Notes " className="font-bold text-xs" />
                                    </div>
                                    <Textarea id="note" placeholder="" onChange={(e) => setNotes(e.target.value)} required rows={4} value={notes} />
                                </div>
                            </form>
                        </Modal.Body>
                        <Modal.Footer className="modal_footer">
                            <Button color="gray" onClick={() => setOpenModal(false)}> Cancel</Button>
                            <Button onClick={(e) => { e.preventDefault(); updateServiceRates ? updateNote() : addNewNote() }}> {updateServiceRates ? "Update Rate" : "Add Rate"}</Button>

                        </Modal.Footer>
                    </Modal>
                    <Modal show={openDeleteNoteModal} onClose={() => setOpenDeleteNoteModal(false)} size="lg" className="text_box_readuce">
                        <Modal.Header className="modal_header"><b>Are You Sure ?</b></Modal.Header>
                        <Modal.Body>
                            <div>
                                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    You are about to delete {serviceName} ?
                                </p>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="modal_footer">
                            <Button color="gray" onClick={() => setOpenDeleteNoteModal(false)}> Cancel</Button>
                            <Button onClick={(e) => { e.preventDefault(); deleteNote(); }}>Ok</Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={deleteRateCardModel} onClose={() => setdeleteRateCardModel(false)} size="lg" className="text_box_readuce">
                        <Modal.Header className="modal_header"><b>Are You Sure ?</b></Modal.Header>
                        <Modal.Body>
                            <div>
                                <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                    You are about to delete the Ratecard ?
                                </p>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="modal_footer">
                            <Button color="gray" onClick={() => setdeleteRateCardModel(false)}> Cancel</Button>
                            <Button onClick={deleteFile}>Ok</Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={openNotes} onClose={() => setOpenNotes(false)}>
                        <Modal.Header className="modal_header">
                            <b>Comment</b>
                        </Modal.Header>
                        <Modal.Body>
                            <div className="space-y-6">
                                <div className="text-sm whitespace-break-spaces">{notes}</div>
                            </div>
                        </Modal.Body>
                        <Modal.Footer className="modal_footer">
                            <Button
                                className="h-[40px] button_blue"
                                onClick={() => {
                                    setOpenNotes(false);
                                }}
                            >
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
                :
                ""
            }
        </>
    );
}

export default RateServices;