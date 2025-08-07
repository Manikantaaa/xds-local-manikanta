export type sponcersLogotypes = {
    type?: string;
    thumnnail?: string;
    signedUrl: string,
    filename: string,
    indexId: string,
    selectedFile: boolean,
    companyWebsiteUrl?: string | undefined,
}

export type responseDataType = {
    data: { companyWebsiteUrl?: string; type: string, signedUrl: string, selectedIndex: boolean, fileUrl: string, fileName: string, id: string, thumbnail: string }[],
}

export type PropsTypes = {
    albumId?: string,
    uniqueFormId: string;
    setIsDirty?: (dirty: boolean) => void;
    setDeletedFilePaths: (deletedpaths: string[]) => void;
    deletedFilePaths: string[];
    setportfolioVideoUrls?: (updateVideos: portfolioAlbumVideoType[]) => void;
    portfolioVideoUrls?: portfolioAlbumVideoType;
    indexValues: sponcersLogotypes[];
    setIndexValues: (indexvalues: sponcersLogotypes[]) => void;
    responseData: responseDataType | undefined;
    uploadtext?: string;
    isSelectRequired?: boolean;
    component: string;
    albumName?: string | null;
    setImageUploadInprogress: (deletedpaths: boolean) => void;
    imageUploadInprogress: boolean;
}

export type portfolioAlbumVideoType = { type: string; fileUrl: string; thumnnail: string, active?: boolean, signedUrl: string }

export type Fileresponse = { id: string; isSelected: boolean, fileIndex: string, fileName: string, fileUrl: string, thumbnail: string, type: string, signedfileUrl: string };

export type draggableComponentResponseType = {
    type: string,
    signedUrl: string;
    selectedIndex: boolean;
    fileUrl: string;
    fileName: string;
    id: string;
    thumbnail: string,
}[]