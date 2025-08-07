import { redirect } from 'next/navigation';
import { PATH } from '@/constants/path';
import { User } from '@/context/store';
import { useEffect } from 'react';

export const useAuthentication = ({ user,isBuyerRestricted,isPaidUserPage = true}: { user: User | null; isBuyerRestricted: boolean, isPaidUserPage: boolean}) => {
//  const router = useRouter();
  useEffect(() => {
    if(!user){
      redirect('/login');
    }
    else if((isPaidUserPage && !user?.isPaidUser && user?.userRoles[0].roleCode === 'service_provider')) {
       redirect(PATH.HOME.path);
      // router.push(PATH.HOME.path);
    }
  
    if (isBuyerRestricted && user?.userRoles[0].roleCode === 'buyer') {
       redirect(PATH.HOME.path);
      // router.push(PATH.HOME.path);
    }
  },[user, isPaidUserPage, isBuyerRestricted,]);

};