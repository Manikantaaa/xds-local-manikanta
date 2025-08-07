import { useState, useEffect } from 'react';
import { fetcher } from './fetcher';
import { ENDPOINTS, getEndpointUrl } from '@/constants/endpoints';

export function useSearchCompanies() {
    const [searchValue, setSearchValue] = useState<string>("");
    const [companyOptions, setCompanyOptions] = useState<string[]>([]);

    useEffect(() => {
        const fetchCompanies = async (searchValue: string) => {
            try {
                if (searchValue.length > 2) {
                    const response = await fetcher(
                        getEndpointUrl(ENDPOINTS.searchcompanies(searchValue)),
                    );
                    if (response.success) {
                        setCompanyOptions(response.data);
                    }
                } else {
                    setCompanyOptions([]);
                }
            } catch (error) {
                console.error("Error fetching companies:", error);
            }
        }

        fetchCompanies(searchValue);
    }, [searchValue]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
    }

    return {
        handleSearch,
        companyOptions,
    };
}
