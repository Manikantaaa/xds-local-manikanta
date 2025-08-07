import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { useUserContext } from "@/context/store";
import axios from "axios";
import { Button, FileInput, Label, Modal } from "flowbite-react";
import Spinner from "./spinner";
import { useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { Draggable } from "react-drag-reorder";
import { PropsTypes, sponcersLogotypes } from "@/types/draggableImages.type";

export const DraggableImageUploads = ({ setImageUploadInprogress, imageUploadInprogress, albumId, uniqueFormId, setDeletedFilePaths, deletedFilePaths, setportfolioVideoUrls, portfolioVideoUrls, indexValues, setIndexValues, responseData, uploadtext, isSelectRequired, component, albumName, setIsDirty }: PropsTypes) => {

    const inputRef = useRef<any>(null);
    const [files, setFiles] = useState<string[]>([]);
    const [previewImage, setPreviewImage] = useState<{ type: string, imgUrl: string, selectedFile: boolean }[]>([]);
    const [deleting, setDeleting] = useState<boolean>(false);
    const [removeModel, setRemoveModel] = useState<boolean>(false);
    const [imgId, setimgId] = useState<number>();
    const [fileValidation, setFileValidation] = useState<string>("");
    // const [imageUploadInprogress, setImageUploadInprogress] = useState<boolean>(false);
    //context
    const { user } = useUserContext();

    useEffect(() => {
        const previewImageUrls: { type: string, imgUrl: string, selectedFile: boolean }[] = [];
        const fileUrls: string[] = [];
        const sponcersLogos: sponcersLogotypes[] = [];
        const portfolioFiles = responseData?.data;
        if (portfolioFiles && portfolioFiles.length > 0) {
            portfolioFiles.forEach((item: { thumbnail: string, type: string, signedUrl: string, selectedIndex: boolean, fileUrl: string, fileName: string, id: string, companyWebsiteUrl?: string | undefined }) => {
                const newSignedfileUrl = item.signedUrl ? item.signedUrl : item.signedUrl;
                previewImageUrls.push({ type: item.type, imgUrl: newSignedfileUrl, selectedFile: item.selectedIndex });
                fileUrls.push(newSignedfileUrl);
                sponcersLogos.push({ thumnnail: item.thumbnail, signedUrl: item.fileUrl, filename: item.fileName, indexId: item.id ? item.id : '', selectedFile: item.selectedIndex, companyWebsiteUrl: item.companyWebsiteUrl ?? "" })
            });
        }
        setPreviewImage(previewImageUrls);
        setIndexValues(sponcersLogos);
        setFiles(fileUrls);
    }, [responseData]);
    const handleDrop = (e: any) => {

        setFileValidation('');
        e.preventDefault();
        e.stopPropagation();
        const multipleFiles = e.dataTransfer.files;
        if (multipleFiles.length > 0) {
            setDeleting(true);
            setImageUploadInprogress(true);
            uploadingImage(multipleFiles);
        }
    };

    useEffect(() => {
        if (portfolioVideoUrls) {
            if (files.length > 99) {
                if ((100 - files.length) <= 0) {
                    setFileValidation(`The limit of 100 items has been reached for this album.`);
                } else {
                    setFileValidation(`The limit of 100 items has been reached for this album. Only ${100 - files.length} more items can be uploaded.`);
                }

                return;
            }
            setDeleting(true);
            setFileValidation("");
            const previewImageUrls: { type: string, imgUrl: string, selectedFile: boolean }[] = [...previewImage];
            const fileUrls: string[] = [...files];
            const newuploadedFiles: sponcersLogotypes[] = [];
            const source = portfolioVideoUrls;
            if (source && source.type != undefined && source.type && source.type === 'video') {
                previewImageUrls.push({ type: source.type, imgUrl: source.signedUrl, selectedFile: false });
                fileUrls.push(source.thumnnail);
                const newImage: sponcersLogotypes = {
                    signedUrl: source.fileUrl,
                    thumnnail: source.thumnnail,
                    filename: "",
                    indexId: '',
                    selectedFile: true,
                    companyWebsiteUrl: component,
                };
                newuploadedFiles.push(newImage);
                if (newuploadedFiles) {
                    const olddata: sponcersLogotypes[] = indexValues;
                    const newData: sponcersLogotypes[] = [...olddata, ...newuploadedFiles];
                    setIndexValues(newData);
                    newuploadedFiles.splice(0, newuploadedFiles.length);
                }
                setPreviewImage(previewImageUrls);
                setFiles(fileUrls);
            }


            setTimeout(() => {
                setDeleting(false);
            }, 100);

        }
    }, [portfolioVideoUrls])
    const uploadingImage = async (filesToUpload: any) => {
        setFileValidation("");
        let filesHaveInvalidExtension = false;
        const totalFilesSelected = filesToUpload.length;
        // if (totalFilesSelected > 30) {
        //     setFileValidation("You may only upload 30 items at a time.");
        //     filesHaveInvalidExtension = true;
        //     setDeleting(false);
        //     setImageUploadInprogress(false);
        //     return;
        // }

        if (component == "album") {
            let IsValid = true;
            if ((files.length <= 0) && totalFilesSelected > 100) {
                IsValid = false;
                setFileValidation(`You have reached the maximum of 100 items for this album.`);
            }
            else if (totalFilesSelected + files.length > 100 && files.length < 100) {
                IsValid = false;
                setFileValidation(`The limit of 100 items has been reached for this album. Only ${100 - files.length} more items can be uploaded.`);
            } else if (files.length >= 100) {
                IsValid = false;
                setFileValidation(`The limit of 100 items has been reached for this album.`);
            }
            if (!IsValid) {
                filesHaveInvalidExtension = true;
                setDeleting(false);
                setImageUploadInprogress(false);
                return;
            }
            if (!albumName) {
                setFileValidation("Please first add an Album Name");
                filesHaveInvalidExtension = true;
                setDeleting(false);
                setImageUploadInprogress(false);
                return;
            }
        }
        let website = undefined;
        if (component == "platinumpartners") {
            if (totalFilesSelected > 1) {
                setFileValidation(`You can upload only one image at a time.`);
                setDeleting(false);
                setImageUploadInprogress(false);
                return;
            }
            website = prompt("Enter Partner Website URL")?.toString();

            // Simple URL validation regex
            const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
            if (website && !/^https?:\/\//i.test(website)) {
                website = 'https://' + website;
            }
            if (!website || !urlPattern.test(website)) {
                setFileValidation('Please enter a valid Partner Website URL.');
                setDeleting(false);
                setImageUploadInprogress(false);
                return;
            }

        }
        if (setIsDirty) {
            setIsDirty(true);
        }
        setDeleting(true);
        setImageUploadInprogress(true);
        if (isSelectRequired) {
            for (const file of filesToUpload) {
                const dimension = await validateDimensions(file);
                if (!dimension) {
                    filesHaveInvalidExtension = true;
                }
            }
        }


        Array.from(filesToUpload).forEach((file: any) => {
            const fileNameParts = file.name.split(".");
            const fileExtension =
                fileNameParts[fileNameParts.length - 1].toLowerCase();
            if (fileNameParts.length > 2) {
                setFileValidation("Images with multiple extensions (or periods) in the file name are not allowed");
                filesHaveInvalidExtension = true;
            }
            if ((fileExtension !== "png" && fileExtension !== "jpg" && fileExtension !== "gif")) {
                setDeleting(false);
                setImageUploadInprogress(false);
                setFileValidation("Only PNG, JPG and Gif foramt images are allowed");
                filesHaveInvalidExtension = true;
            }
            if (file.size > 7 * 1024 * 1024) {
                setDeleting(false);
                setImageUploadInprogress(false);
                setFileValidation("Keep files under 7 MB each");
                filesHaveInvalidExtension = true;
            }
        })
        if (filesHaveInvalidExtension) {
            // setFiles([]);
            setDeleting(false);
            setImageUploadInprogress(false);
            return;
        }
        else {
            setFiles((prevfiles) => [
                ...(filesToUpload ?? []),
                ...prevfiles,
            ]);
        }

        let countFiles = 0;

        const companyId = user?.companyId.toString();
        const token = Cookies.get("token");
        const newuploadedFiles: sponcersLogotypes[] = [];
        // Array.from(filesToUpload).forEach(async (file: any) => {
        //     const formData = new FormData();
        //     formData.append("files", file);
        //     if (companyId) {
        //         formData.append("companyId", companyId);
        //     }
        //     else {
        //         formData.append("companyId", "0");
        //     }

        //     if (component === 'album') {
        //         formData.append('formtype', 'album');
        //     } else {
        //         formData.append('formtype', 'sponsers');
        //     }
        //     formData.append("uniqueFormId", uniqueFormId);
        //     try {
        //         const response = await axios.post(
        //             `${getEndpointUrl(ENDPOINTS.uploadSponcersLogoimages)}`,
        //             formData,
        //             {
        //                 headers: {
        //                     Authorization: `Bearer ${token}`,
        //                 },
        //             }
        //         );

        //         if (response && response.data.statusCode === 200) {
        //             setPreviewImage((prevImages) => [
        //                 ...prevImages,
        //                 {
        //                     type: 'image',
        //                     imgUrl: response.data.data?.signedurls[0],
        //                     selectedFile: true,
        //                 },
        //             ]);

        //             const newImage: sponcersLogotypes = {
        //                 signedUrl: response.data.data?.fileUrls ? response.data.data?.fileUrls[0] : '',
        //                 filename: file.name,
        //                 indexId: '',
        //                 thumnnail: response.data.data?.signedurls[0],
        //                 selectedFile: true,
        //             };
        //             newuploadedFiles.push(newImage);

        //             countFiles++;
        //             if (countFiles == totalFilesSelected) {
        //                 setDeleting(false);
        //                 setImageUploadInprogress(false);
        //                 if (newuploadedFiles) {
        //                     const olddata: sponcersLogotypes[] = indexValues;
        //                     const newData: sponcersLogotypes[] = [...olddata, ...newuploadedFiles];
        //                     setIndexValues(newData);
        //                     newuploadedFiles.splice(0, newuploadedFiles.length);
        //                 }
        //             }

        //             // setLoadingStates([]);
        //         }
        //         // await setIsLoading(false);
        //     } catch (error) {
        //         console.error("Error uploading file:", error);
        //     }
        // });
        for (const file of filesToUpload) {
            const formData = new FormData();
            formData.append("files", file);
            formData.append("companyId", companyId || "0");
            formData.append("formtype", component === 'album' ? 'album' : component === 'sponsers' ? 'sponsers' : 'platinumpartners');
            formData.append("uniqueFormId", uniqueFormId);
            formData.append("albumId", (albumId) ? albumId : '0');
            // formData.append("albumName", (albumName && albumName.length > 0) ? albumName : "");

            try {
                const response = await axios.post(
                    `${getEndpointUrl(ENDPOINTS.uploadSponcersLogoimages)}`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response && response.data.statusCode === 200) {
                    setPreviewImage((prevImages) => [
                        ...prevImages,
                        {
                            type: 'image',
                            imgUrl: response.data.data?.signedurls[0],
                            selectedFile: true,
                        },
                    ]);

                    const newImage: sponcersLogotypes = {
                        signedUrl: response.data.data?.fileUrls ? response.data.data?.fileUrls[0] : '',
                        filename: file.name,
                        indexId: '',
                        thumnnail: response.data.data?.thumbnails[0],
                        selectedFile: true,
                        companyWebsiteUrl: website,
                    };
                    newuploadedFiles.push(newImage);
                    countFiles++;
                    if (countFiles === totalFilesSelected) {
                        setDeleting(false);
                        setImageUploadInprogress(false);
                        if (newuploadedFiles.length > 0) {
                            const olddata = indexValues;
                            const newData = [...olddata, ...newuploadedFiles];
                            setIndexValues(newData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error uploading file:", error);
            }
        }
    };
    const handleDragLeave = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragOver = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const validateDimensions = (file: File) => {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                const width = img.width;
                const aspectRatio = img.width / img.height;
                const isSixteenNine = Math.abs(aspectRatio - (16 / 9)) < 0.01;
                const isWidthValid = width >= 320;
                if ((component != "platinumpartners") && (!isSixteenNine || !isWidthValid)) {
                    setFileValidation("Use 320 x 180 dimension only");
                    resolve(false);
                } if ((component == "platinumpartners") && (width != 320 || img.height != 200)) {
                    setFileValidation("Use 320 x 200 dimension only");
                    resolve(false);
                }

                else {
                    resolve(true);
                }
            };
            img.onerror = () => {
                resolve(false);
            };
        });
    };
    const handleChange = async (e: any) => {

        e.preventDefault();
        setFileValidation('');
        if (e.target.files && e.target.files[0]) {
            setDeleting(true);
            setImageUploadInprogress(true);
            await uploadingImage(e.target.files);
            setTimeout(() => {
                e.target.value = null;
            }, 100);

        }
    };
    const onSelecteImage = (index: number) => {
        // console.log(previewImage);
        setDeleting(true);
        const updatedPreviewImage = previewImage.map((image, i) => {
            if (i === index) {
                return {
                    ...image,
                    selectedFile: !image.selectedFile
                };
            }
            return image;
        });

        const updatedIndexValues: sponcersLogotypes[] = indexValues.map((image, i) => {
            if (i === index) {
                return {
                    ...image,
                    selectedFile: !image.selectedFile
                };
            }
            return image;
        });
        setTimeout(() => {
            setDeleting(false);
            setImageUploadInprogress(false);
        }, 100);
        setPreviewImage(updatedPreviewImage);
        setIndexValues(updatedIndexValues);
    };

    const handlePosChange = (currentPos: any, newPos: any) => {
        setDeleting(true);
        const updatedIndexValues: sponcersLogotypes[] = [...indexValues];
        const movedIndexValue = updatedIndexValues.splice(currentPos, 1)[0];
        updatedIndexValues.splice(newPos, 0, movedIndexValue);
        setIndexValues(updatedIndexValues);
        const updatedImages = [...previewImage];
        const movedImages = updatedImages.splice(currentPos, 1)[0];
        updatedImages.splice(newPos, 0, movedImages);
        setPreviewImage(updatedImages)

        const updatedFiles = [...files];
        const movedFiles = updatedFiles.splice(currentPos, 1)[0];
        updatedFiles.splice(newPos, 0, movedFiles);
        setFiles(updatedFiles);
        setTimeout(() => {
            setDeleting(false);
            setImageUploadInprogress(false);
        }, 100)

    };
    const removeImg = (index: any) => {
        setDeleting(true);
        setFileValidation('');
        if (setIsDirty) {
            setIsDirty(true);
        }
        setTimeout(() => {
            const updatedIndexValues: sponcersLogotypes[] = [...indexValues];
            const deletedType = updatedIndexValues.splice(index, 1);
            if (!deletedType[0].signedUrl.startsWith('https')) {
                const newFilePath = [...deletedFilePaths, deletedType[0].signedUrl];
                setDeletedFilePaths(newFilePath);
            }

            setPreviewImage(prevState => {
                const newArr = [...prevState];
                newArr.splice(index, 1);
                return newArr;
            });

            setFiles(prevFiles => {
                const fileArr = [...prevFiles];
                fileArr.splice(index, 1);
                return fileArr;
            })
            if (setportfolioVideoUrls) {
                console.log(deletedType);
                // setportfolioVideoUrls([]);
            }

            setIndexValues(updatedIndexValues);
            setDeleting(false);
            // setRemoveModel(false);
            setRemoveModel((prevModelState) => {
                return !prevModelState;
            })
            setimgId(undefined);
        }, 100);
    };
    return (
        <div>
            <div className="flex w-full items-center justify-center">

                <Label
                    htmlFor="small-file-upload"
                    className="dark:hover:bg-bray-800 flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-solid border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                    onDragEnter={handleDragEnter}
                    onSubmit={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                >
                    <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        {!imageUploadInprogress ?
                            <> <svg
                                className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                                aria-hidden="true"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 20 16"
                            >
                                <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                                />
                            </svg>
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">Click or Drag & Drop to Upload Images</span>
                                </p>

                                <p className="text-xs text-gray-500  px-2 text-center"> {uploadtext || 'JPG or PNG image formats only (MAX. 5 MB each), 320 x 180 dimensions.'}</p>
                            </>
                            :
                            <p style={{ fontSize: '18px', fontWeight: "500" }}>Please wait upload inprogress...</p>
                        }
                    </div>
                    {!imageUploadInprogress &&
                        <FileInput
                            id="small-file-upload"
                            className="hidden"
                            ref={inputRef}
                            multiple={true}
                            onChange={handleChange}
                        />
                    }
                </Label>
            </div>
            {
                fileValidation &&
                <span className="font-medium text-sm text-red-500"> {fileValidation} </span>
            }
            {
                files && files.length > 0 && (
                    <div className="uploading_images_bg p-2.5 rounded-sm" id="browseImages" >
                        <div className="grid grid-cols-5 gap-4 p-0">
                            {deleting ?
                                <>
                                    {files.map((image, index) => {
                                        return (
                                            <div key={index} className="relative border-dashed rounded-sm border-2 border-gray-400">
                                                <div className="img_view_portfolio_thumb border_none active flex">

                                                    {previewImage && previewImage[index] ?
                                                        (<><img src={previewImage[index]?.imgUrl} width="131" height="74" />
                                                            {previewImage[index].type == "video" &&
                                                                <div className="absolute inset-0 flex justify-center items-center">
                                                                    <img
                                                                        src="/play-icon.png"
                                                                        alt="Play icon"
                                                                        width={35}
                                                                        height={35}
                                                                    />
                                                                </div>
                                                            }
                                                        </>
                                                        )
                                                        :
                                                        <div className="flex justify-center m-auto items-center">
                                                            <Spinner />
                                                        </div>

                                                    }
                                                    <div className="close_icon absolute link_color  flex items-center gap-2">
                                                        {isSelectRequired && <div onClick={() => { onSelecteImage(index) }}>

                                                            {previewImage[index]?.selectedFile ? (
                                                                <svg
                                                                    className="w-[18px] h-[18px] green_c dark:text-white"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-[18px] h-[18px] text-blue-300 dark:text-white"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        stroke="currentColor"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="m7 10 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </div>}
                                                        <button
                                                            type="button"
                                                            onClick={() => { setimgId(index); setRemoveModel(true); }}
                                                        >
                                                            <svg className="w-[18px] h-[18px] red_c dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m13 7-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                                :
                                <Draggable onPosChange={handlePosChange}>
                                    {files.map((image, index) => {
                                        return (
                                            <div key={index} className="relative border-dashed rounded-sm border-2 border-gray-400 " >
                                                <div className="img_view_portfolio_thumb border_none active flex" >

                                                    {previewImage && <> <img src={previewImage[index]?.imgUrl} width="131" height="74" />
                                                        {previewImage[index].type == "video" &&
                                                            <div className="absolute inset-0 flex justify-center items-center">
                                                                <img
                                                                    src="/play-icon.png"
                                                                    alt="Play icon"
                                                                    width={35}
                                                                    height={35}
                                                                />
                                                            </div>
                                                        }</>}
                                                    <div className="close_icon absolute link_color flex items-center gap-2">
                                                        {isSelectRequired && <button type="button" onClick={() => { onSelecteImage(index) }}>
                                                            {previewImage[index]?.selectedFile ? (
                                                                <svg
                                                                    className="w-[18px] h-[18px] green_c dark:text-white"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    className="w-[18px] h-[18px] text-blue-300 dark:text-white"
                                                                    aria-hidden="true"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        stroke="currentColor"
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="m7 10 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                                    />
                                                                </svg>
                                                            )}
                                                        </button>}
                                                        <button
                                                            type="button"
                                                            onClick={() => { setimgId(index); setRemoveModel(true); }}
                                                        >
                                                            <svg className="w-[18px] h-[18px] red_c dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m13 7-6 6m0-6 6 6m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </Draggable>
                            }
                        </div>
                    </div>
                )
            }

            <Modal
                show={removeModel}
                onClose={() => { setRemoveModel(false); setimgId(-1) }}
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
                            setRemoveModel(false);
                            setimgId(-1)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="h-[40px] button_blue"
                        onClick={() => {
                            if (imgId != null) {
                                removeImg(imgId);
                            } else {
                                console.error("CompanyList Id is null.");
                            }
                        }}
                    >
                        Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )

}

