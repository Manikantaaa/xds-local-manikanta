"use client"
import Joyride, { ACTIONS, CallBackProps, EVENTS } from 'react-joyride';
import { redirect, useRouter } from 'next/navigation';
import { useMultiTourContext } from '@/context/multiTourContext';
import { Toursteps } from '@/services/tour';
import { ENDPOINTS, getEndpointUrl } from '@/constants/endpoints';
import { User, useUserContext } from '@/context/store';
import { patch } from '@/hooks/fetcher';

export default function MultiRouteWrapper() {
  const { setUser, user } = useUserContext();
  const {
    setTourState,
    tourState: { run, stepIndex, steps },
  } = useMultiTourContext();
  const router = useRouter();

  //   useEffect(() => {
  //     setTourState({
  //       steps: [
  //         {
  //           target: '.homesearch',
  //           content: `This is the home page`,
  //           disableBeacon: true,
  //         },
  //         {
  //           target: '.serviceprovider_list',
  //           content: 'This is Route A',
  //           disableBeacon: true,
  //         },

  //       ],
  //     });
  //   },[]);

  const updateTourStatus = async () => {
    const data = await patch(getEndpointUrl(ENDPOINTS.updateTourStatus(user ? user.companyId : 0)));
  }
  const handleCallback = (data: CallBackProps) => {
    const { action, index, lifecycle, type } = data;
    if (([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND] as string[]).includes(type) && index < 8 && action != 'close') {
      if (action !== ACTIONS.PREV) {
        if (index == 0) {
          setTourState({ run: false, tourActive: true });
          router.push('/serviceproviders');
        } else if (index == 3) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-lists');
        } else if (index == 4) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-projects');
        }
        else if (index == 5) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-opportunities');
        }
        else if (index == 6) {
          setTourState({ run: false, tourActive: true });
          router.push('/opportunities');
        } else {
          const nextStepIndex = index + 1;
          setTourState({ run: true, stepIndex: nextStepIndex, steps: Toursteps,tourActive:true });
        }
      }
      else if ((action === ACTIONS.PREV) && [1, 4, 6, 5, 7].includes(index)) {
        if (index == 1) {
          setTourState({ run: false, tourActive: true });
          router.push('/home');
        } else if (index == 4) {
          setTourState({ run: false, tourActive: true });
          router.push('/serviceproviders');
        } else if (index == 5) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-lists');
        } else if (index == 6) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-projects');
        } else if (index == 7) {
          setTourState({ run: false, tourActive: true });
          router.push('/my-opportunities');
        } else {
          const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
          setTourState({ run: true, stepIndex: nextStepIndex, steps: Toursteps });
        }
      }
       else {
        const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
        setTourState({ run: true, stepIndex: nextStepIndex, steps: Toursteps });
      }

    }

    else if (
      type === 'step:after' &&
      (index === 0)
    ) {
      setTourState({ run: false, tourActive: true });
      router.push('/serviceproviders');
    } else if (type === 'step:after' && index === 1) {
      if (action === 'next') {
        setTourState({ run: false, tourActive: true });
        // router.push('/multi-route/b');
      } else {
        router.push('/home');
        setTourState({ run: true, stepIndex: 0 });
      }
    } else if (action === 'reset' || lifecycle === 'complete' || action === 'close' || action === 'skip') {
      updateTourStatus();
      setTourState({ run: false, stepIndex: 0, tourActive: false, steps: [] });
      if(user){
        const updatedUser: User = { ...user };
        if (updatedUser && updatedUser.companies && updatedUser.companies.length > 0) {
          updatedUser.companies[0].isTourCompleted = !updatedUser.companies[0].isTourCompleted;
        }
        setUser(updatedUser);
      }
      router.push('/home');
    }
  };


  return (
    <>
      {(user && !user?.companies[0].isTourCompleted) &&
        <Joyride
          callback={handleCallback}
          continuous
          run={run}
          stepIndex={stepIndex}
          steps={steps}
          locale={{ last: 'Finish' }}
          showSkipButton={true}
          showProgress={true}
          disableScrolling={true}
          disableScrollParentFix={true}
          disableOverlayClose={true}
          hideBackButton={true}
        />
      }
    </>
  );
}
