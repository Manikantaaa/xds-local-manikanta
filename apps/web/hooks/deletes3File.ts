import { useState, useEffect } from 'react';
import { DeleteFiles, fetcher } from './fetcher';
import { ENDPOINTS, getEndpointUrl } from '@/constants/endpoints';

export const  deletes3FileHook = () => {
    const [filepath, setFilepath] = useState<string>("");
    const [response,setResponse] = useState<{}>({});
    useEffect(() => {
        const delteS3Files = async (filePath: string) => {
            try {
                if (filePath.length > 2) {
                    const url = getEndpointUrl(ENDPOINTS.removePortfoliofiles);
                    const response = await DeleteFiles(filePath,url);
                    if (response.success) {
                        setResponse(response);
                    }
                } else {
                    setResponse(response);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        }

        delteS3Files(filepath);
    }, [filepath]);
    const handleDelete = (value: string) => {
        setFilepath(value);
    }

    return {
        handleDelete,
        response,
    };
}

