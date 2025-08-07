import { useEffect, useState } from 'react';
import { useUserContext } from '../context/store';
import { userPermissionsType } from '@/types/user.type';

const usePagePermissions = (pageId: number) => {
    const [permissions, setPermissions] = useState<userPermissionsType>({
        isCompanyUser: false,
        canRead: false,
        canWrite: false,
        canDelete: false,
    });
    const {user} = useUserContext()

    useEffect(() => {
        if (user && Array.isArray(user.pagePermissions)) {
            const userPermissions = user.pagePermissions.find(
                (permission) => permission.pageId === pageId
            );

            if (userPermissions) {
                setPermissions({
                    isCompanyUser: (user?.isCompanyUser) ? true : false,
                    canRead: userPermissions.canRead,
                    canWrite: userPermissions.canWrite,
                    canDelete: userPermissions.canDelete,
                });
            }
        }
    }, [user, pageId]);

    return permissions;
};

export default usePagePermissions;
