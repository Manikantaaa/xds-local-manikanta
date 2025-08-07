"use client";
import Breadcrumbs from "@/components/breadcrumb";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { authFetcher, authPut, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { Button, Label, Modal, Select, TextInput, Textarea } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Draggable } from "react-drag-reorder";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useForm } from "react-hook-form";
import useCommonPostData from "@/hooks/commonPostData";
import { toast } from "react-toastify";
import { formatDateToYYYYMMDD } from "@/services/common-methods";
import { useUserContext } from "@/context/store";
import useFormUpdate from "@/hooks/useFormUpdate";
import { sanitizeData } from "@/services/sanitizedata";
import Spinner from "@/components/spinner";
interface getdataType {
    ArticleCategory: {
        categoryName: string,
    },
    EndDate: string,
    StartDate: string,
    description: string,
    id: number,
    isActive: boolean,
    logoPath: string,
    signedUrl: string,
    title: string,
    webUrl: string,
    displayOrder: number,
    isArchieve: boolean,
    postName: string,
}

const ArchivedArticles = () => {

    const [allArticles, setAllArticles] = useState<getdataType[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [articleId, setArticleId] = useState<number>(0);
    const [load, setLoad] = useState<boolean>(false);
    const [deleteModel, setDeleteModel] = useState<boolean>(false);
    const [archiveModel, setArchiveModel] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [hideAndShow, setHideAndShow] = useState(true);
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
    const { user } = useUserContext();
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
            label: 'Articles',
            path: 'Articles',
        },
    ];
    useEffect(() => {
        setIsLoading(true);
        const getAllServices = async () => {
            const articleCategories = await authFetcher(`${getEndpointUrl(ENDPOINTS.getArchivedArticles)}`).catch((error) => {
                console.log(error);
            });
            if (articleCategories.length > 0) {
                // console.log(articleCategories);
                let articles: getdataType[] = [];
                articleCategories.map((archivedAtricles: getdataType) => {
                    if (archivedAtricles.isArchieve) {
                        articles.push(archivedAtricles);
                        setAllArticles(articles);
                    }
                })
            } else {
                setAllArticles([]);
            }
            setIsLoading(false);
        }
        getAllServices();
    }, [load]);
    const deleteArticle = async () => {
        setIsProcessing(true);
        await deleteItem(`${getEndpointUrl(ENDPOINTS.deleteArticle(articleId))}`)
            .then((result) => {
                if (result) {
                    toast.success("Successfully Deleted")
                    setLoad(true);
                    setDeleteModel(false);
                    setIsProcessing(false);
                }
            }).catch((err) => {
                toast.success("Something went wrong try again later")
                console.log(err);
                setIsProcessing(false);
            });
    }
    const archiveArticle = async () => {
        setIsProcessing(true);
        await authPut(`${getEndpointUrl(ENDPOINTS.archiveArticle(articleId))}`)
            .then((result) => {
                if (result) {
                    setLoad((prev) => !prev);
                    setIsProcessing(false);
                    toast.success("Successfully UnArchived");
                }
            }).catch((err) => {
                console.error(err);
                setIsProcessing(false);
                if(err.message){
                    toast.error(err.message);
                } else{
                    toast.error("Failed to updated, try again later");
                }
               
            }).finally(() => {
                setArchiveModel(false);
            });
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
                        <li><Link href="/admin/services" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Service Categories</Link></li>
                        <li><Link href="/admin/articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0">Articles</Link></li>
                        <li><Link href="/admin/articles/archived-articles" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color pl-4 text-xs font-low anchor_active">Archived Articles</Link></li>
                        <li><Link href="/admin/notifications" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Notifications</Link></li>
                        <li><Link href="/admin/platinum-partners" className="relative inline-flex items-center w-full focus:z-10 focus:ring-0 link_color">Platinum Partners</Link></li>
                    </ul>
                        : ''}
                </div>
                <div className="faq_content col-span-4">
                    <div className="sm:flex sm:items-center sm:justify-between">
                        <div className="sm:text-left">
                            <h1 className="font-bold text-gray-900 header-font">Archived Articles </h1>
                        </div>
                    </div>
                    <div className="text-end my-6">
                        {/* <button type="button" className="py-2.5 px-5 me-2 text-sm font-medium  focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-blue-300 hover:text-white focus:z-10 focus:ring-4 focus:ring-gray-100 button_bg_2" onClick={() => {setOpenAdsModal(true); resetFormValues();}}>Add Article</button> */}
                    </div>
                    {!isLoading ?
                        <div className="space-y-4 pb-6">
                            {allArticles && allArticles.length > 0 ?
                                <>
                                    {allArticles.map((article: getdataType, index: number) => {
                                        return (
                                            <div className="space-y-6">
                                                <div className="text-base border_list font-medium lg:flex lg:items-center">
                                                    <div className="flex items-center">
                                                        <svg className="me-2 cursor-move" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                            <g id="DotsSixVertical">
                                                                <path id="Vector" d="M13 7.5C13 7.79667 12.912 8.08668 12.7472 8.33336C12.5824 8.58003 12.3481 8.77229 12.074 8.88582C11.7999 8.99935 11.4983 9.02906 11.2074 8.97118C10.9164 8.9133 10.6491 8.77044 10.4393 8.56066C10.2296 8.35088 10.0867 8.08361 10.0288 7.79264C9.97094 7.50166 10.0006 7.20006 10.1142 6.92598C10.2277 6.65189 10.42 6.41762 10.6666 6.2528C10.9133 6.08797 11.2033 6 11.5 6C11.8978 6 12.2794 6.15804 12.5607 6.43934C12.842 6.72065 13 7.10218 13 7.5ZM20.5 9C20.7967 9 21.0867 8.91203 21.3334 8.74721C21.58 8.58238 21.7723 8.34811 21.8858 8.07403C21.9994 7.79994 22.0291 7.49834 21.9712 7.20737C21.9133 6.91639 21.7704 6.64912 21.5607 6.43934C21.3509 6.22956 21.0836 6.0867 20.7926 6.02882C20.5017 5.97094 20.2001 6.00065 19.926 6.11418C19.6519 6.22771 19.4176 6.41997 19.2528 6.66665C19.088 6.91332 19 7.20333 19 7.5C19 7.89783 19.158 8.27936 19.4393 8.56066C19.7206 8.84197 20.1022 9 20.5 9ZM11.5 14.5C11.2033 14.5 10.9133 14.588 10.6666 14.7528C10.42 14.9176 10.2277 15.1519 10.1142 15.426C10.0006 15.7001 9.97094 16.0017 10.0288 16.2926C10.0867 16.5836 10.2296 16.8509 10.4393 17.0607C10.6491 17.2704 10.9164 17.4133 11.2074 17.4712C11.4983 17.5291 11.7999 17.4994 12.074 17.3858C12.3481 17.2723 12.5824 17.08 12.7472 16.8334C12.912 16.5867 13 16.2967 13 16C13 15.6022 12.842 15.2206 12.5607 14.9393C12.2794 14.658 11.8978 14.5 11.5 14.5ZM20.5 14.5C20.2033 14.5 19.9133 14.588 19.6666 14.7528C19.42 14.9176 19.2277 15.1519 19.1142 15.426C19.0007 15.7001 18.9709 16.0017 19.0288 16.2926C19.0867 16.5836 19.2296 16.8509 19.4393 17.0607C19.6491 17.2704 19.9164 17.4133 20.2074 17.4712C20.4983 17.5291 20.7999 17.4994 21.074 17.3858C21.3481 17.2723 21.5824 17.08 21.7472 16.8334C21.912 16.5867 22 16.2967 22 16C22 15.6022 21.842 15.2206 21.5607 14.9393C21.2794 14.658 20.8978 14.5 20.5 14.5ZM11.5 23C11.2033 23 10.9133 23.088 10.6666 23.2528C10.42 23.4176 10.2277 23.6519 10.1142 23.926C10.0006 24.2001 9.97094 24.5017 10.0288 24.7926C10.0867 25.0836 10.2296 25.3509 10.4393 25.5607C10.6491 25.7704 10.9164 25.9133 11.2074 25.9712C11.4983 26.0291 11.7999 25.9993 12.074 25.8858C12.3481 25.7723 12.5824 25.58 12.7472 25.3334C12.912 25.0867 13 24.7967 13 24.5C13 24.1022 12.842 23.7206 12.5607 23.4393C12.2794 23.158 11.8978 23 11.5 23ZM20.5 23C20.2033 23 19.9133 23.088 19.6666 23.2528C19.42 23.4176 19.2277 23.6519 19.1142 23.926C19.0007 24.2001 18.9709 24.5017 19.0288 24.7926C19.0867 25.0836 19.2296 25.3509 19.4393 25.5607C19.6491 25.7704 19.9164 25.9133 20.2074 25.9712C20.4983 26.0291 20.7999 25.9993 21.074 25.8858C21.3481 25.7723 21.5824 25.58 21.7472 25.3334C21.912 25.0867 22 24.7967 22 24.5C22 24.1022 21.842 23.7206 21.5607 23.4393C21.2794 23.158 20.8978 23 20.5 23Z" fill="#0071C2" />
                                                            </g>
                                                        </svg>
                                                        <div className="line-clamp-1">{article.ArticleCategory.categoryName} - {article?.title || article?.postName}</div>
                                                    </div>
                                                    <div className="ms-auto text-end lg:mt-0 mt-3">
                                                        <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { !article.isActive ? setArchiveModel(true) : ''; setArticleId(article.id); }}>
                                                            {!article.isActive ?
                                                                <svg
                                                                    className="w-4 h-4 me-1 link_color"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 18 18"
                                                                >
                                                                    <path
                                                                        stroke="currentColor"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M1 5v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H1Zm0 0V2a1 1 0 0 1 1-1h5.443a1 1 0 0 1 .8.4l2.7 3.6H1Z"
                                                                    />
                                                                </svg>
                                                                :
                                                                <svg
                                                                    className="w-4 h-4 me-1 text-gray-400"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 18 18"
                                                                >
                                                                    <path
                                                                        stroke="currentColor"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M1 5v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1H1Zm0 0V2a1 1 0 0 1 1-1h5.443a1 1 0 0 1 .8.4l2.7 3.6H1Z"
                                                                    />
                                                                </svg>
                                                            }
                                                        </button>
                                                        <button type="button" className="py-1.5 px-1.5 me-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg  hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100" onClick={() => { setDeleteModel(true); setArticleId(article.id); }}>
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                                                                <path d="M27 6H22V5C22 4.20435 21.6839 3.44129 21.1213 2.87868C20.5587 2.31607 19.7956 2 19 2H13C12.2044 2 11.4413 2.31607 10.8787 2.87868C10.3161 3.44129 10 4.20435 10 5V6H5C4.73478 6 4.48043 6.10536 4.29289 6.29289C4.10536 6.48043 4 6.73478 4 7C4 7.26522 4.10536 7.51957 4.29289 7.70711C4.48043 7.89464 4.73478 8 5 8H6V26C6 26.5304 6.21071 27.0391 6.58579 27.4142C6.96086 27.7893 7.46957 28 8 28H24C24.5304 28 25.0391 27.7893 25.4142 27.4142C25.7893 27.0391 26 26.5304 26 26V8H27C27.2652 8 27.5196 7.89464 27.7071 7.70711C27.8946 7.51957 28 7.26522 28 7C28 6.73478 27.8946 6.48043 27.7071 6.29289C27.5196 6.10536 27.2652 6 27 6ZM12 5C12 4.73478 12.1054 4.48043 12.2929 4.29289C12.4804 4.10536 12.7348 4 13 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V6H12V5ZM24 26H8V8H24V26ZM14 13V21C14 21.2652 13.8946 21.5196 13.7071 21.7071C13.5196 21.8946 13.2652 22 13 22C12.7348 22 12.4804 21.8946 12.2929 21.7071C12.1054 21.5196 12 21.2652 12 21V13C12 12.7348 12.1054 12.4804 12.2929 12.2929C12.4804 12.1054 12.7348 12 13 12C13.2652 12 13.5196 12.1054 13.7071 12.2929C13.8946 12.4804 14 12.7348 14 13ZM20 13V21C20 21.2652 19.8946 21.5196 19.7071 21.7071C19.5196 21.8946 19.2652 22 19 22C18.7348 22 18.4804 21.8946 18.2929 21.7071C18.1054 21.5196 18 21.2652 18 21V13C18 12.7348 18.1054 12.4804 18.2929 12.2929C18.4804 12.1054 18.7348 12 19 12C19.2652 12 19.5196 12.1054 19.7071 12.2929C19.8946 12.4804 20 12.7348 20 13Z" fill="#E10E0E" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                                :
                                <><hr /><div className="text-sm text-center">No archived articles</div><hr /></>
                            }
                        </div>
                        :
                        <div className="flex justify-center items-center">
                            <Spinner />
                        </div>

                    }
                </div>
            </div>
            {/***********************Model starts**********************/}
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
                        onClick={deleteArticle}
                        isProcessing={isProcessing}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal
                show={archiveModel}
                onClose={() => { setArchiveModel(false); }}
                size="sm"
            >
                <Modal.Header className="modal_header">
                    <b>Are you sure?</b>
                </Modal.Header>
                <Modal.Body>
                    <div className="space-y-6">
                        <div className="">
                            <p className="text-sm default_text_color font-normal leading-6">
                                You are about to un-archive this article
                            </p>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="modal_footer">
                    <Button
                        color="gray"
                        className="h-[40px] button_cancel"
                        onClick={() => {
                            setArchiveModel(false);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-[40px] button_blue"
                        onClick={archiveArticle}
                        isProcessing={isProcessing}
                    >
                        Yes
                    </Button>
                </Modal.Footer>
            </Modal>

        </div >

    );
};

export default ArchivedArticles;