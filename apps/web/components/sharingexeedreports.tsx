import { PATH } from "@/constants/path";
import { useEffect, useState } from "react";
import Breadcrumbs from "./breadcrumb";
import DataTable from "react-data-table-component";
import Link from "next/link";
import { authFetcher } from "@/hooks/fetcher";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { ListExcessExportType } from "@/types/user.type";
import { formatDate } from "@/services/common-methods";
import Spinner from "@/components/spinner";
import { Button, Modal } from "flowbite-react";
import { isValidJSON } from "@/constants/serviceColors";

const SharingExceedReport = () => {
  const [Reports, setReports] = useState<[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [openNotes, setOpenNotes] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const columns = [
    {
      name: "Date",
      id: "sharingId",
      cell: (row: ListExcessExportType) => formatDate(new Date(row.createdAt)),
      sortable: true,
      default: "desc",
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => a.createdAt.toString().localeCompare(b.createdAt.toString()),
    },
    {
      name: "User Name",
      cell: (row: ListExcessExportType) => row.Companies.user.firstName + " " + row.Companies.user.lastName,
      sortable: true,
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => (a.Companies.user.firstName).toString().localeCompare((b.Companies.user.firstName + b.Companies.user.lastName).toString()),
    },
    {
      name: "Company",
      cell: (row: ListExcessExportType) => (
        <div className="text-blue-300">
          <Link prefetch={false} href={`/admin/company/${row.Companies.id}`}>
            {row.Companies.name}
          </Link>
        </div>
      ),
      sortable: true,
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => a.Companies.name.localeCompare(b.Companies.name),
    },
    {
      name: "Role",
      cell: (row: ListExcessExportType) => row.Companies.user.userRoles[0].role.name,
      sortable: true,
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => a.Companies.user.userRoles[0].role.name.localeCompare(b.Companies.user.userRoles[0].role.name),
    },
    {
      name: "Type",
      cell: (row: ListExcessExportType) => row.type,
      sortable: true,
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => a.type.localeCompare(b.type),
    },
    {
      name: "Message",
      cell: (row: ListExcessExportType) => (
        <div className="leading-5 w-[405px] truncate" >
          {row.message && row.message != '' &&
            <div className="" ><abbr className="view_note_btn" onClick={() => { setOpenNotes(true), setNotes(isValidJSON(row.message) ? JSON.parse(row.message) : row.message) }}> <svg className="w-[20px] h-[20px] text-gray-800 me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" stroke-width="2" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z" />
              <path stroke="currentColor" stroke-width="2" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg> View</abbr>
            </div>
          } </div>
      ),
      sortable: true,
      sortFunction: (a: ListExcessExportType, b: ListExcessExportType) => a.message.localeCompare(b.message),
    },
  ];
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    authFetcher(`${getEndpointUrl(ENDPOINTS.getShareReport)}`)
      .then((result) => {
        if (result.success) {
          setTotalCount(result.data.count);
          setReports(result.data);
        }
        setCanRender(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      {
        canRender ?
          <>
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:text-left">
                <h1 className="font-bold default_text_color header-font">
                  Companies Share List
                </h1>
              </div>
            </div>
            <div className="py-6 datatable_style">
              <DataTable
                columns={columns}
                data={Reports}
                highlightOnHover={true}
                pagination={true}
                defaultSortFieldId={"sharingId"}
                defaultSortAsc={false}
                paginationPerPage={10}
                paginationRowsPerPageOptions={[10, 20]}
                paginationTotalRows={totalCount}
                paginationComponentOptions={{
                  rowsPerPageText: "Records per page:",
                  rangeSeparatorText: "out of",
                }}
              />
            </div>

          </>

          :
          <div className="lg:col-span-4 border-l ps-8 most_active">
            <div className="min-h-[90vh] flex justify-center items-center">
              <Spinner />
            </div>
          </div>
      }

      <Modal show={openNotes} onClose={() => setOpenNotes(false)}>
        <Modal.Header className="modal_header">
          <b>Comment</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div className="text-sm whitespace-break-spaces">
              {/* {notes} */}
              <p className="pb-3"><b>{notes.split("</n>")[0]}</b></p>
              {notes.split("</n>")[1] && <p>{notes.split("</n>")[1].trim()}</p>}
              {notes.split("</n>")[2] && <p>{notes.split("</n>")[2].trim()}</p>}
              {notes.split("</n>")[3] && <p>{notes.split("</n>")[3].trim()}</p>}

            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            className="h-[40px] button_blue"
            onClick={() => {
              setOpenNotes(false);
            }}
          >
            Ok
          </Button>
        </Modal.Footer>
      </Modal>
    </>

  );
};

export default SharingExceedReport;
