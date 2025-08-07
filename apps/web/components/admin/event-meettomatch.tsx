"use client";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { authFetcher, authPutWithData } from "@/hooks/fetcher";
import { sanitizeData } from "@/services/sanitizedata";
import { faqQuestions } from "@/types/event.types";
import { Button, Label, Modal, TextInput } from "flowbite-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import "../../public/css/detatable.css";
import Spinner from "../spinner";

const EventMeetToMatch = (params: { companyId: number }) => {

const [eventList, setEventList] = useState<faqQuestions[]>([]);
const [comanyName, setCompanyName] = useState<string>("");
const [meetLink, setMeetLink] = useState<string>("");
const [eventAttandeId, setEventAttandeId] = useState<number>(0);
const [loader, setLoader] = useState<boolean>(false);

const [openUpdateModel, setOpenUpdateModal] = useState<boolean>(false);

const columns = [
    {
      name: "Event",
      cell: (row: faqQuestions) => row.eventName,
      sortable: true,
      sortFunction: (a: faqQuestions, b: faqQuestions) => a.eventName.localeCompare(b.eventName),
    },
    {
      name: "Meet To Match",
      cell: (row: faqQuestions) => (
        <>
          {row.EventAttendees && (row.EventAttendees[0].meetToMatchLink != null && row.EventAttendees[0].meetToMatchLink != "") ? 
                  <div className="edit_event_meet">
                  <Link
                    prefetch={false}
                    href={row.EventAttendees[0]?.meetToMatchLink}
                    target="_blank"
                    className="text-blue-300"
                  >
                    {row.EventAttendees[0].meetToMatchLink}
                  </Link>
                  <div style={{ marginLeft: 'auto' }}>
                    <Button type="button" color="#fff"
                      fullSized={true}
                      onClick={()=>updateMeetToLink(row)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                      <path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" fill="#0071C2" />
                  </svg></Button>
                  </div>
                </div>
          :
            <div className="edit_event_meet">
              <div style={{ margin: 0 }}>-</div>
              <div style={{ marginLeft: 'auto' }}>
                  <Button type="button" color="#fff"
                  fullSized={true}
                  onClick={()=>updateMeetToLink(row)}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 32 32" fill="none">
                  <path d="M28.4138 9.17125L22.8288 3.585C22.643 3.39924 22.4225 3.25188 22.1799 3.15134C21.9372 3.0508 21.6771 2.99905 21.4144 2.99905C21.1517 2.99905 20.8916 3.0508 20.6489 3.15134C20.4062 3.25188 20.1857 3.39924 20 3.585L4.58626 19C4.39973 19.185 4.25185 19.4053 4.15121 19.648C4.05057 19.8907 3.99917 20.151 4.00001 20.4138V26C4.00001 26.5304 4.21072 27.0391 4.5858 27.4142C4.96087 27.7893 5.46958 28 6.00001 28H11.5863C11.849 28.0008 12.1093 27.9494 12.352 27.8488C12.5947 27.7482 12.815 27.6003 13 27.4138L28.4138 12C28.5995 11.8143 28.7469 11.5938 28.8474 11.3511C28.948 11.1084 28.9997 10.8483 28.9997 10.5856C28.9997 10.3229 28.948 10.0628 28.8474 9.82015C28.7469 9.57747 28.5995 9.35698 28.4138 9.17125ZM6.41376 20L17 9.41375L19.0863 11.5L8.50001 22.085L6.41376 20ZM6.00001 22.4138L9.58626 26H6.00001V22.4138ZM12 25.5863L9.91376 23.5L20.5 12.9138L22.5863 15L12 25.5863ZM24 13.5863L18.4138 8L21.4138 5L27 10.585L24 13.5863Z" fill="#0071C2" />
              </svg></Button>
              </div>
            </div>
            }
        </>
      ),
      sortable: false,
      // sortFunction: (a: faqQuestions, b: faqQuestions) => a.meetToMatchLink.localeCompare(b.meetToMatchLink),
    },
  ];

useEffect(() => {
    getAllEvents();
}, []);
const getAllEvents = async () => {
  setLoader(true);
  const allEvents = await authFetcher(
      getEndpointUrl(ENDPOINTS.getallActiveEvents(params.companyId)),
  );

  if (allEvents && allEvents.success == true) {
      if (allEvents.data) {
          setEventList(allEvents.data);
          setLoader(false);
      }
  }
};

const updatingCompanyMeetLink= async() => {
  let updateNote = {
    meetLink: meetLink,
  }
  updateNote = sanitizeData(updateNote);
    await authPutWithData(`${getEndpointUrl(ENDPOINTS.updatingEventMeet(eventAttandeId))}`, updateNote)
      .then((result) => {
        console.log(result);
        if (result) {
          getAllEvents();
          setOpenUpdateModal(false);
        }
      }).catch((err) => {
        console.log(err);
        setOpenUpdateModal(false);
      });
}

const updateMeetToLink =(eventId: faqQuestions) => {
  console.log(eventId);
  setMeetLink(eventId.EventAttendees[0].meetToMatchLink);
  setEventAttandeId(eventId.EventAttendees[0].id);
  setCompanyName(eventId.eventName);
  setOpenUpdateModal(true);
}

return(
  <>{!loader ? 
        <div className="py-6 datatable_style">
            {eventList.length > 0 ? (
              <DataTable
                columns={columns}
                data={eventList}
                highlightOnHover={true}
                pagination={false}
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20]}
                paginationComponentOptions={{
                  rowsPerPageText: "Records per page:",
                  rangeSeparatorText: "out of",
                }}
              />
            ) : (
              <div style={{ textAlign: 'start', padding: '20px' }}>
                <p>No Events Available</p>
              </div>
            )}
        </div>
      :
          <div className="flex justify-center items-center pt-40">
              <Spinner />
            </div>
      }
      

    <Modal show={openUpdateModel} onClose={() => { setOpenUpdateModal(false);}} size="lg" className="text_box_readuce add_advertisement">
    <Modal.Header className="modal_header">Meet To Match</Modal.Header>
    <form className="overflow-auto flex flex-col gap-2">
        <Modal.Body>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="url" value={comanyName} className="font-bold text-xs" />
                <span className="text-xs ml-0.5" style={{ color: 'red' }}> </span>
              </div>
              <TextInput  onChange={(e) => { setMeetLink(e.target.value); }} name="noteTitle" value={meetLink} type="text" placeholder="" required shadow sizing="sm" />
            </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
            <Button color="gray" onClick={() => { setOpenUpdateModal(false); }}> Cancel</Button>
            <Button type="button" onClick={updatingCompanyMeetLink}> Update </Button>
        </Modal.Footer>
    </form>
    </Modal>
</>
)

}

export default EventMeetToMatch;