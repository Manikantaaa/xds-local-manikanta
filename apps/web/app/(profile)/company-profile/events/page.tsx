"use client";

import Breadcrumbs from "@/components/breadcrumb";
import MobileSideMenus from "@/components/mobileSideMenus";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { PATH } from "@/constants/path";
import { useUserContext } from "@/context/store";
import { authFetcher, authPut, deleteItem } from "@/hooks/fetcher";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Spinner from "@/components/spinner";
import { formatDate } from "@/services/common-methods";
import { eventTypes } from "@/types/event.types";
import ButtonSpinner from "@/components/ui/buttonspinner";
import { Button, Label, Modal, TextInput } from "flowbite-react";


const Events = () => {
  const { user } = useUserContext();
  const route = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [eventList, setEventList] = useState<eventTypes[]>([]);
  const [load, setLoad] = useState<boolean>(false);
  const [buttonloader, setButtonLoader] = useState<boolean>(false);
  const [openUpdateModel, setOpenUpdateModal] = useState<boolean>(false);
  const [meetToMatch, setMeetToMatch] = useState<{eventName: string, meetToMatch: string}[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<{ [key: number]: boolean }>({})
  const breadcrumbItems = [
    {
      label: PATH.HOME.name,
      path: PATH.HOME.path,
    },
    {
      label: PATH.COMPANY_PROFILE.name,
      path: PATH.COMPANY_PROFILE.path,
    },
    {
      label: PATH.EVENTS.name,
      path: PATH.EVENTS.path,
    },
  ];

  if (!user || user.userRoles[0].roleCode == 'buyer') {
    redirect(PATH.HOME.path);
  }

  if (!user.isPaidUser) {
    redirect("/company-profile/about");
  }

  //initial load Data
  useEffect(() => {
    const getAllFaqs = async () => {
      setIsLoading(true);
      setEventList([]);
      const allFaqQuestions = await authFetcher(
        getEndpointUrl(ENDPOINTS.getallActiveEvents(0)),
      );

      if (allFaqQuestions && allFaqQuestions.success == true) {
        if (allFaqQuestions.data) {
          if (!allFaqQuestions.data.length) {
            route.push(PATH.ABOUT.path);
            return;
          } else {
            setIsLoading(false);
            if(allFaqQuestions.data.length > 0 ){
              let eventMeet: { eventName: string; meetToMatch: string }[] = [];
              allFaqQuestions.data.map((eventAttande: {eventName:string, EventAttendees: {meetToMatchLink: string}[]})=>{
                if(eventAttande.EventAttendees.length > 0){
                  eventMeet.push({eventName: eventAttande.eventName, meetToMatch: eventAttande.EventAttendees[0].meetToMatchLink})
                }
              })
              const eventMeetTo = eventMeet.filter((meetmatch) => meetmatch.meetToMatch != null && meetmatch.meetToMatch !== "");
              setMeetToMatch(eventMeetTo);
            }
            setEventList(allFaqQuestions.data);
          }

        }
      } else {
        setIsLoading(false);
      }

      setButtonLoader(false);
    };
    getAllFaqs();
    setLoad(false);
  }, [load]);

  const addAttendee = async (eventId: number) => {
    setButtonLoader(true);
    setLoadingEvents((prevEvnts) => ({
      ...prevEvnts, [eventId]: true
    }))
    await authPut(`${getEndpointUrl(ENDPOINTS.addAttendee(eventId))}`).then(() => {
      // setLoad(true);
      let newMeetToLinkValue:{eventName: string, meetToMatch: string};
      setEventList((prevEventList: any) => {
        return prevEventList.map((event: eventTypes) => {
          if (event.id === eventId) {
            const newAttendee = {
              companyId: user?.companyId,
            };
            newMeetToLinkValue = {
              eventName: event.eventName,
              meetToMatch: "",
            };
            return {
              ...event,
              EventAttendees: [...(event.EventAttendees || []), newAttendee],
            };
          }
          return event;
        });
      });
      // setMeetToMatch((prevState) => [...prevState, newMeetToLinkValue]);
      setLoadingEvents((prevEvnts) => ({
        ...prevEvnts, [eventId]: false
      }))
    })
  }
  const removeAttendee = async (eventId: number) => {
    setButtonLoader(true);
    setLoadingEvents((prevEvnts) => ({
      ...prevEvnts, [eventId]: true
    }))
    await deleteItem(`${getEndpointUrl(ENDPOINTS.removeAttendee(eventId))}`).then(() => {
      // setLoad(true);
      let newMeetToLinkValue:{eventName: string, meetToMatch: string};
      setEventList((prevEventList: any) => {
        return prevEventList.map((event: eventTypes) => {
          if (event.id === eventId && event.EventAttendees) {
            newMeetToLinkValue = {
              eventName: event.eventName,
              meetToMatch: "",
            };
            const newEventAttendees = [...event.EventAttendees];
            newEventAttendees.splice(0, 10);
            return {
              ...event,
              EventAttendees: newEventAttendees,
            };
          }
          return event;
        });
      });
      setMeetToMatch((prevState) =>
        prevState.filter((item) => item.eventName !== newMeetToLinkValue.eventName)
      );
      setLoadingEvents((prevEvnts) => ({
        ...prevEvnts, [eventId]: false
      }))
    })
  }
  return (
    <>
      {!isLoading ?
        <>
          <div className="pb-6 pt-6 breadcrumbs_s">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
          <div className="sm:flex sm:items-center sm:justify-between">
            <div className="sm:text-left flex align-middle items-center">
              <MobileSideMenus></MobileSideMenus>
              <h1 className="font-bold  header-font">Events</h1>
            </div>
            {meetToMatch.length > 0 &&
            <div><Button type="button" color="#fff"
            className="event_button"
            onClick={()=>setOpenUpdateModal(true)}>Meet To Match</Button></div>}
          </div>
          <div className="py-6">
            <hr />
          </div>
          <div>
            {eventList && eventList.map((items: eventTypes) => (
              <div className="space-y-4 mb-4">
                <article
                  className="border border-gray-200 rounded-[6px] relative">
                  <div className="flex items-start gap-4 p-4">
                    <img
                      src={items.signedUrl}
                      alt=""
                      className="size-20 rounded-lg object-cover w-32"
                    />
                    <div className="bg-white">
                      <time className="block text-xs text-gray-500"> {formatDate(new Date(items.eventStartDate))} - {formatDate(new Date(items.eventEndDate))}</time>
                      <div className="lg:w-[550px]">
                        <h3 className="mt-0.5 text-lg font-medium text-gray-900"> {items.eventName} </h3>
                        <p className="text-sm py-1">{items.eventDescription}</p>
                        <div className="lg:space-x-4 lg:py-2">
                          <span className="text-sm ">
                            <svg className="w-[20px] h-[20px] text-gray-700 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                              <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd" />
                            </svg>
                            {items.eventLocation}</span>
                          <a href={items.eventUrl ? (items.eventUrl.startsWith('http://') || items.eventUrl.startsWith('https://') ? items.eventUrl : `https://${items.eventUrl}`) : '#'} target="_blank" className="link_color text-sm block lg:inline-block lg:mt-0 mt-2"> <svg className="w-5 h-5 link_color mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                          </svg>
                            {items.eventUrl}</a>
                        </div>
                      </div>
                    </div>
                  </div>
                  {
                    items.EventAttendees && items.EventAttendees.find((attendee: any) => attendee.companyId === user.companyId) ?
                      <div className="iam_interst absolute right-5">
                      
                          <Button type="button" disabled = {loadingEvents[items.id]}  isProcessing = {loadingEvents[items.id]}   className="text-white bg-green-600 font-medium rounded-lg text-sm px-1  me-2 mb-2" onClick={() => removeAttendee(items.id)}>Added <svg className="w-5 h-5 ml-2 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 1 1 0-18c1.052 0 2.062.18 3 .512M7 9.577l3.923 3.923 8.5-8.5M17 14v6m-3-3h6" />
                          </svg>
                          </Button>
                        
                      </div>
                      :
                      <div className="iam_interst absolute right-5">
                        <Button type="button" disabled = {loadingEvents[items.id]}  isProcessing = {loadingEvents[items.id]} className="text-white bg-blue-700 hover:bg-blue-800   font-medium rounded-lg text-sm px-0.5 py-0 me-2 mb-2" onClick={() => addAttendee(items.id)}> Add to My Events</Button>
                        
                      </div>
                  }
                </article>
              </div>
            ))}
          </div>
        </>
        :
        <div className="flex justify-center items-center pt-60">
          <Spinner />
        </div>
      }
          <Modal show={openUpdateModel} onClose={() => { setOpenUpdateModal(false);}} size="lg" className="text_box_readuce add_advertisement">
          <Modal.Header className="modal_header">Meet To Match</Modal.Header>
          <form className="overflow-auto flex flex-col gap-2">
              <Modal.Body>
              {meetToMatch && meetToMatch.map((eventData: { eventName: string; meetToMatch: string }, index: number) => {
              if (!eventData.meetToMatch?.trim()) return null;
                 return (
                    <div className="pb-2">
                      <div className="mb-2 inline-flex items-center">
                        <Label htmlFor="url" value={eventData.eventName} className="font-bold text-xs" />
                        <span className="text-xs ml-0.5" style={{ color: 'red' }}> </span>
                      </div>
                      <TextInput readOnly={true} name="noteTitle" value={eventData.meetToMatch} type="text" placeholder="" required shadow sizing="sm" />
                    </div>
                  )
                })}
              </Modal.Body>
          </form>
          <Modal.Footer className="modal_footer">
            <Button color="gray" onClick={() => { setOpenUpdateModal(false); }}> Close</Button>
        </Modal.Footer>
          </Modal>
    </>


  );
};

export default Events;
