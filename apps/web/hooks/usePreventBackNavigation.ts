import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const usePreventBackNavigation = (isDirty:boolean) => {
  const router = useRouter();
  const [isMenuclicked, setIsMenuclicked] = useState(false);
  /* Page Leaving code starts here keep this awalys last*/

  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLAnchorElement;

    if (isDirty) {
      event.preventDefault();
      const isla = confirm("Your changes will not be saved. Select Cancel, then select Save before progressing.");
      if (isla) {
        //confirmationFn.current = () => {
        router.push(target.href);
        isDirty = false;
        //};

      }
    }
  };
  /* ********************************************************************* */

  /**
   * Used to prevent navigation when use `back` browser buttons.
   */
  // const handlePopState = () => {
  //   if (isDirty) {
  //     const isgoingback = confirm("Unsaved changes. Do you want to leave this page?");
  //     if (isgoingback) {
  //       window.history.pushState(null, document.title, window.location.href);
  //       router.push("/");
  //     }
  //   } else {
  //     window.history.back();
  //   }
  // };
  
  
  /* ********************************************************************* */

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = true;
    }
  };

  const createAnchorListeners = () => {
    document.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', handleClick);
    });
  }
  const removeAnchorListeners = () => {
    document.querySelectorAll('a').forEach((link) => {
      link.removeEventListener('click', handleClick);
    });
 //   window.removeEventListener('popstate', handlePopState);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    removeDocumentEventListener();
  }

  const addDocumentEventListener = (event:any) => {
    if (event.target instanceof HTMLElement) {
      // Use querySelector to get elements inside "newMenus" id
      const newMenus = event.target.querySelector('#newMenus');
      if (newMenus && !isMenuclicked) {
        setIsMenuclicked(true);
      } else {
        setIsMenuclicked(false);
      }
    }
  }
  const removeDocumentEventListener = () => {
     document.removeEventListener('click', addDocumentEventListener);
  }
  useEffect(() => {

 //   if (isDirty || isMenuclicked) { 

   //   window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);
      createAnchorListeners();
      if (isMenuclicked) {
        setIsMenuclicked(!isMenuclicked)
      }
      /* ************** Return from useEffect closing listeners ************** */
      // return () => {
      //   removeAnchorListeners()
      // };
  //  } else {
      return () => { 
        document.querySelectorAll('a').forEach((link) => {
          link.removeEventListener('click', handleClick);
        });
    //    window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
  //  }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, isMenuclicked]);
  document.addEventListener('click', (event) => {
    addDocumentEventListener(event);
  });

  useEffect(() => {
    let count = 0
    history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', function (event) {       
      if(count == 0){
        if(isDirty){       
          event.preventDefault();
          const isConfirmed = confirm("Your changes will not be saved. Select Cancel, then select Save before progressing.");
          if(isConfirmed){
            isDirty = false;
            router.back();
          }
        }else{
          router.back();
        }
        count += 1;
      }
    });
}, [isDirty]);

/* Page Leaving code ends here keep this awalys last*/
};

export default usePreventBackNavigation;
