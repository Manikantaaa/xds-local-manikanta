// ProjectBlock.js
"use client";
import {
  Button,
  Label,
  Modal,
  Select,
  TextInput,
  Textarea,
} from "flowbite-react";
import React, { useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const NewProject = ({ project, setProjects }: any) => {
  const [openModal, setOpenModal] = useState(false);
  const [startDate, setStartDate] = useState(new Date());

  const handleCompletionDateSelect = (date: any) => {
    setStartDate(date);
    setProjects((prevProjects: any) =>
      prevProjects.map((p: any) =>
        p.id === project.id ? { ...p, projectCompletionDate: date } : p,
      ),
    );
  };

  const handleFileUpload = (id: number) => {
    console.log(id);
    const fileUrls = ["safsdfd", "dafdsafds", "dsafdsaf", "dasdffadsf"];
    setProjects((prevProjects: any) =>
      prevProjects.map((p: any) =>
        p.id === project.id ? { ...p, projectUrls: [...fileUrls] } : p,
      ),
    );
  };

  const handlePlatformSelect = (id: number) => {
    console.log(id);
    const platformsSelected = [1, 2, 3];
    setProjects((prevProjects: any) =>
      prevProjects.map((p: any) =>
        p.id === project.id
          ? { ...p, projectPlatforms: [...platformsSelected] }
          : p,
      ),
    );
  };

  return (
    <div className="py-4 px-4 bg-gray-100 lg:w-[600px]">
      <p className="text-sm pb-2">{project.name}</p>
      <p className="text-sm pb-2">
        NOTE: Please ensure you have the rights and permissions to post this
        project for all XDS Spark users to view.
      </p>
      <div className="flex max-w-md flex-col gap-6">
        <div className="firstname">
          <div className="mb-2 block">
            <Label
              htmlFor={"name" + project.id}
              value="Project Name"
              className="font-bold text-xs"
            />
          </div>
          <TextInput
          autoComplete="off"
            id={"name" + project.id}
            className="focus:border-blue-300"
            type="text"
            sizing="md"
            onChange={(e) => {
              setProjects((prevProjects: any) =>
                prevProjects.map((p: any) =>
                  p.id === project.id
                    ? { ...p, projectName: e.target.value }
                    : p,
                ),
              );
            }}
          />
          {/* {
            errors.map((err: any) => (
              err.id == project.id ? (err.name && err.name != "") ? "" : "" : ""
            ))
          } */}
        </div>
        <div className="lasttname">
          <div className="mb-2 block">
            <Label
              htmlFor={"cDate" + project.id}
              value="Project Completion Date"
              className="font-bold text-xs"
            />
          </div>
          <DatePicker
          autoComplete="off"
            id={"cDate" + project.id}
            className="focus:border-blue-300"
            selected={startDate}
            // onChange={(date: any) => setStartDate(date)}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            onChange={(date: any) => {
              handleCompletionDateSelect(date);
            }}
          />
        </div>
        <div className="email">
          <div className="mb-2 block">
            <Label
              htmlFor={"countries" + project.id}
              value="Platforms"
              className="font-bold text-xs"
            />
          </div>
          <Select
            id={"countries" + project.id}
            required
            onChange={() => handlePlatformSelect(project.id)}
            // onChange={(e) => {
            //   setProjects((prevProjects: any) =>
            //     prevProjects.map((p: any) =>
            //       p.id === project.id ? { ...p, projectPlatforms: e.target.value } : p
            //     )
            //   );
            // }}
          >
            <option>Select</option>
            <option>2D</option>
            <option>3D</option>
            <option>2D Art</option>
          </Select>
          <p className="text-xs pt-2 text-gray-500">
            This should be the date the project went live
          </p>
        </div>
        <div className="linkedInprofile">
          <div className="mb-2 block">
            <Label
              htmlFor={"description" + project.id}
              value="Description"
              className="font-bold text-xs"
            />
          </div>
          <Textarea
            id={"description" + project.id}
            placeholder=""
            required
            rows={8}
            onChange={(e) => {
              setProjects((prevProjects: any) =>
                prevProjects.map((p: any) =>
                  p.id === project.id
                    ? { ...p, projectDescription: e.target.value }
                    : p,
                ),
              );
            }}
          />
        </div>

        <div className="lg:w-[450px] w-full">
          <h1 className="font-bold default_text_color heading-sub-font pb-2">
            Project Images and Videos (upto 5)
          </h1>
          <p className="default_text_color text-sm">
            Upload video or image files. Follow these guidelines for best
            results:
          </p>
          <ul className="text-sm pt-2 list-disc space-y-1 list-inside">
            <li>use a 16:9 ratio</li>
            <li>keep files under XXX MB each</li>
          </ul>
        </div>
      </div>
      <div className="logo_image pt-3 space-y-2">
        <label
          htmlFor={"file-upload" + project.id}
          className="custom-file-upload inline-flex items-center justify-center  px-6 py-2 text-sm reset_btn h-[40px] font-medium"
        >
          Browse images ...
        </label>
        <input
          id={"file-upload" + project.id}
          type="file"
          multiple
          onChange={() => handleFileUpload(project.id)}
        />
        <button
          onClick={() => setOpenModal(true)}
          type="button"
          className="reset_btn focus:outline-none font-medium text-sm px-4 py-2 ms-2 h-[40px]"
        >
          Add embedded video{" "}
          <span className="xs_mobile_hide">(e.g. YouTube, Vimeo, etc) ...</span>
        </button>
      </div>
      <Modal size="sm" show={openModal} onClose={() => setOpenModal(false)}>
        <Modal.Header className="modal_header">
          <b>Video Embed Code</b>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-2.5">
            <p className="text-sm leading-relaxed default_text_color">
              Paste the embed code (e.g. YouTube, Vimeo) for your video.
            </p>
            <form>
              <div className="flowbite_input_radius_6 FiAlertTriangle">
                <TextInput
                autoComplete="off"
                  id="embed"
                  type="text"
                  placeholder="Paste embed code here"
                  required
                  rightIcon={FiAlertTriangle}
                  color="failure"
                  helperText={
                    <>
                      <span className="text-xs">
                        Sorry, that’s an invalid embed code. Please try again.
                      </span>
                    </>
                  }
                />
              </div>
            </form>
          </div>
        </Modal.Body>
        <Modal.Footer className="modal_footer">
          <Button
            color="gray"
            onClick={() => setOpenModal(false)}
            className="h-[40px]"
          >
            Cancel
          </Button>
          <Button
            onClick={() => setOpenModal(false)}
            className="h-[40px] button_blue"
          >
            Add Video
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewProject;
