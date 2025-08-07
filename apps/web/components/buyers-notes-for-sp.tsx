import { useEffect, useState } from "react";
import DataTable from "react-data-table-component";
import { Button, Modal, Label, TextInput, Textarea, Tooltip } from "flowbite-react";
import { authFetcher, authPostdata, authPutWithData, deleteItem } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import "/public/css/detatable.css";
import { formatDate } from "@/services/common-methods";
import { useUserContext } from "@/context/store";
import { isValidJSON } from "@/constants/serviceColors";
import { sanitizeData } from "@/services/sanitizedata";
import { userPermissionsType } from "@/types/user.type";

export interface BuyerNote {
  id: number;
  buyerId: number;
  title: string;
  note: string;
  updatedAt: Date;
}

export interface BuyerNoteDto {
  buyerId: number;
  companyId: number;
  title: string;
  note: string;
}

const BuyersNotesForSPs = (props: { companyId: number, setLastUpdatedDate: (setLastUpdatedDate: string) => void, userPermissions: userPermissionsType }) => {

  const [openModal, setOpenModal] = useState(false);
  const [allNotes, setAllNotes] = useState<BuyerNote[]>([]);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteId, setNodeId] = useState<number>(0);
  const [noteDescription, setNoteDescription] = useState("");
  const [openDeleteNoteModal, setOpenDeleteNoteModal] = useState(false);
  const [isUpdateNote, setIsUpdateNote] = useState(false);
  const [isValidNotesFormData, setIsValidNotesFormData] = useState(true);
  const [noteComment, setNoteComment] = useState<string>("");
  const [openNoteCommentModal, setOpenNoteCommentModal] = useState(false);
  const [addHoverEffectToRow, setAddHoverEffectToRow] = useState(true);

  const { user } = useUserContext();

  useEffect(() => {
    getAllBuyersNotes();
  }, []);

  const tableHeaderstyle = {
    headCells: {
      style: {
        fontWeight: "bold",
        fontSize: "14px",
        backgroundColor: "#F1F4FA",
      },
    },
  };

  async function getAllBuyersNotes() {
    const notesResponse = await authFetcher(`${getEndpointUrl(ENDPOINTS.getAllNotesFromBuyer(props.companyId))}`).catch((err) => {
      console.log(err);
    })
    if (notesResponse && notesResponse.buyerNotes) {
      setAllNotes(notesResponse.buyerNotes);
    }
  }

  const columns = [
    {
      id: "title",
      name: "Title",
      cell: (row: BuyerNote) => row.title,
      sortable: true,
      sortFunction: (a: BuyerNote, b: BuyerNote) => a.title.localeCompare(b.title),
    },
    {
      id: "notePreview",
      name: "Note Preview",
      cell: (row: BuyerNote) => (
        <div className="leading-5 truncate">
          {isValidJSON(row.note) ? JSON.parse(row.note) : row.note}
          {row.note && row.note != '' &&
            <div className="fullview_desc">
              <abbr className="view_note_btn" onClick={() => { setNoteComment(row.note); setAddHoverEffectToRow(false); setOpenNoteCommentModal(true); }}>
                <svg className="w-[20px] h-[20px] text-gray-800 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
                  <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                View
              </abbr>
            </div>
          }
        </div>
      ),
      sortable: true,
      sortFunction: (a: BuyerNote, b: BuyerNote) => a.note.localeCompare(b.note),
    },
    {
      id: "updatedAt",
      name: "Last Revised",
      cell: (row: BuyerNote) => formatDate(row.updatedAt),
      sortable: true,
      sortFunction: (a: BuyerNote, b: BuyerNote) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      name: "Actions",
      omit: ((props.userPermissions.isCompanyUser && (!props.userPermissions.canWrite && !props.userPermissions.canDelete))),
      cell: (row: BuyerNote) => (
        <div className="space-x-4">
          {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) &&
            <button className="text-blue-300" onClick={(e) => { e.preventDefault(); setIsUpdateNote(true); openNoteUpdateModal(row); }}>
              <svg className="w-3.5 h-3.5 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="m13.835 7.578-.005.007-7.137 7.137 2.139 2.138 7.143-7.142-2.14-2.14Zm-10.696 3.59 2.139 2.14 7.138-7.137.007-.005-2.141-2.141-7.143 7.143Zm1.433 4.261L2 12.852.051 18.684a1 1 0 0 0 1.265 1.264L7.147 18l-2.575-2.571Zm14.249-14.25a4.03 4.03 0 0 0-5.693 0L11.7 2.611 17.389 8.3l1.432-1.432a4.029 4.029 0 0 0 0-5.689Z"></path></svg> Edit
            </button>
          }

          {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canDelete)) &&
            <button className="text-blue-300" onClick={(e) => { e.preventDefault(); setNoteTitle(row.title); openNoteDeleteModal(row.id); }}>
              <svg
                className="me-0.5 w-4 h-4 blue_c  dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 18 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 5h16M7 8v8m4-8v8M7 1h4a1 1 0 0 1 1 1v3H6V2a1 1 0 0 1 1-1ZM3 5h12v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5Z"
                />
              </svg> Delete
            </button>
          }
        </div>
      ),
    },
  ];

  async function openAddNewNoteModal() {
    setIsValidNotesFormData(true);
    setNoteTitle("");
    setNoteDescription("");
    setOpenModal(true);
  }

  async function addNewNote() {
    const isValidForm = checkValidityOfNotesForm();
    if (!isValidForm) {
      setOpenModal(false);
      return;
    }
    let addedNewNote = {
      buyerId: (user && user.companyId) ? user.companyId : 0,
      note: noteDescription != '' ? JSON.stringify(noteDescription) : noteDescription,
      title: noteTitle,
      companyId: props.companyId,
    }
    addedNewNote = sanitizeData(addedNewNote);
    await authPostdata<BuyerNoteDto>(`${getEndpointUrl(ENDPOINTS.addNewNote)}`, addedNewNote).catch((err) => {
      console.log(err);
    });
    setOpenModal(false);
    getAllBuyersNotes();
    props.setLastUpdatedDate(formatDate(new Date()));
  }

  async function openNoteUpdateModal(note: BuyerNote) {
    setIsValidNotesFormData(true);
    setNodeId(note.id);
    setNoteTitle(note.title);
    setNoteDescription(isValidJSON(note.note) ? JSON.parse(note.note) : note.note);
    setOpenModal(true);
  }

  async function updateNote() {
    const isValidForm = checkValidityOfNotesForm();
    if (!isValidForm) {
      return;
    }
    let updateNote = {
      buyerId: (user && user.companyId) ? user.companyId : 0,
      note: noteDescription != '' ? JSON.stringify(noteDescription) : noteDescription,
      title: noteTitle,
      companyId: props.companyId,
    }
    updateNote = sanitizeData(updateNote);
    await authPutWithData<BuyerNoteDto>(`${getEndpointUrl(ENDPOINTS.updateNote(noteId))}`, updateNote).catch((err) => {
      console.log(err);
    });
    setOpenModal(false);
    getAllBuyersNotes();
    props.setLastUpdatedDate(formatDate(new Date()));
  }

  async function openNoteDeleteModal(noteId: number) {
    setNodeId(noteId);
    setOpenDeleteNoteModal(true);
  }

  async function deleteNote() {
    const deleteNote = await deleteItem(`${getEndpointUrl(ENDPOINTS.deleteNote(noteId))}`).catch((err) => {
      console.log(err);
    })
    if (deleteNote) {
      setOpenDeleteNoteModal(false);
      getAllBuyersNotes();
      props.setLastUpdatedDate(formatDate(new Date()));
    }
    setOpenDeleteNoteModal(false);
  }

  function checkValidityOfNotesForm(): boolean {
    if (!noteTitle && noteTitle == "" && !noteDescription && noteDescription == "") {
      setIsValidNotesFormData(false);
      return false;
    } else {
      setIsValidNotesFormData(true);
      return true;
    }
  }

  return (
    <>
      <div className="flex items-center justify-between py-6">
        <div className="text-left">
          <h1 className="font-bold default_text_color header-font">
            Notes
          </h1>
        </div>
        {(!props.userPermissions.isCompanyUser || (props.userPermissions.isCompanyUser && props.userPermissions.canWrite)) &&
          <div className="link_color text-sm cursor-pointer" onClick={() => { setIsUpdateNote(false); openAddNewNoteModal(); }}>
            <svg className="w-3.5 h-3.5 me-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M9.546.5a9.5 9.5 0 1 0 9.5 9.5 9.51 9.51 0 0 0-9.5-9.5ZM13.788 11h-3.242v3.242a1 1 0 1 1-2 0V11H5.304a1 1 0 0 1 0-2h3.242V5.758a1 1 0 0 1 2 0V9h3.242a1 1 0 1 1 0 2Z"></path></svg>
            Add Note
          </div>
        }
      </div>
      <div className="py-0 myspark_note_table">
        {allNotes && allNotes.length > 0 ?
          <DataTable
            customStyles={tableHeaderstyle}
            columns={columns}
            data={allNotes}
            highlightOnHover={true}
            pagination={true}
            paginationPerPage={5}
            paginationRowsPerPageOptions={[5, 10]}
            paginationComponentOptions={{
              rowsPerPageText: "Records per page:",
              rangeSeparatorText: "out of",
            }}
          // conditionalRowStyles={conditionalRowStyles}
          />
          :
          <p className="text-sm font-normal  italic">
            You have not yet added any notes.
          </p>
        }

      </div>

      <Modal show={openModal} onClose={() => setOpenModal(false)} size="lg" className="text_box_readuce">
        <Modal.Header className="modal_header">{isUpdateNote ? "Update Note" : "Add Note"}</Modal.Header>
        <Modal.Body>
          <form className="flex flex-col gap-4">
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="title" value="Title" className="font-bold text-xs" />
              </div>
              <TextInput id="title" onChange={(e) => setNoteTitle(e.target.value)} name="noteTitle" value={noteTitle} type="text" placeholder="" required shadow sizing="sm" />
            </div>
            <div>
              <div className="mb-2 inline-flex items-center">
                <Label htmlFor="comment" value="Notes" className="font-bold text-xs" />
                <Tooltip className="tier_tooltip_2 " content="Create notes that apply to this Service Provider. These could be meeting notes, or any other valuable information you would like to maintain." trigger="hover">
                  <svg className="w-[16px] h-[16px] text-gray-700 ms-1 -mt-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm9.408-5.5a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM10 10a1 1 0 1 0 0 2h1v3h-1a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2h-1v-4a1 1 0 0 0-1-1h-2Z" clip-rule="evenodd" />
                  </svg>
                </Tooltip>
              </div>
              <Textarea id="comment" onChange={(e) => setNoteDescription(e.target.value)} value={noteDescription} name="noteDescription" placeholder="" required rows={6} />
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button color="gray" onClick={() => setOpenModal(false)}> Cancel</Button>
          <Button onClick={(e) => { e.preventDefault(); isUpdateNote ? updateNote() : addNewNote() }}> {isUpdateNote ? "Update Note" : "Add Note"}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openDeleteNoteModal} onClose={() => setOpenDeleteNoteModal(false)} size="lg" className="text_box_readuce">
        <Modal.Header className="modal_header"><b>Are You Sure ?</b></Modal.Header>
        <Modal.Body>
          <div>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              You are about to delete {noteTitle} ?
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button color="gray" onClick={() => setOpenDeleteNoteModal(false)}> Cancel</Button>
          <Button onClick={(e) => { e.preventDefault(); deleteNote(); }}>Ok</Button>
        </Modal.Footer>
      </Modal>

      <Modal id="details-popup" show={openNoteCommentModal} onClose={() => { setOpenNoteCommentModal(false); setAddHoverEffectToRow(true); }}>
        <Modal.Header className="modal_header">
          <b>Note</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="text-sm whitespace-break-spaces">{isValidJSON(noteComment) ? JSON.parse(noteComment) : noteComment}</div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenNoteCommentModal(false);
              setAddHoverEffectToRow(true);
            }}
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>

    </>
  );
}
export default BuyersNotesForSPs;