"use client";
import { Dropdown } from "flowbite-react";
import Link from "next/link"
import { useState } from "react";
import { Draggable } from "react-drag-reorder";

interface ColumnsFilterProps {
    setColumnNamesOrder: React.Dispatch<React.SetStateAction<{ id: string; visible: boolean }[]>>;
    columnNamesOrder: { id: string, visible: boolean }[];
}

const ColumnsFilter = ({ setColumnNamesOrder, columnNamesOrder }: ColumnsFilterProps) => {

    const [isStateUpdating, setisStateUpdating] = useState<boolean>(false)
    //
    const excludeReOrder = ["checkboxsp", "name"];
    const handlePosition = (currentPos: number, newPos: number) => {
        setisStateUpdating(true)
        const newColumnNamesOrder = [...columnNamesOrder];
        const [removedElement] = newColumnNamesOrder.splice(currentPos, 1);
        newColumnNamesOrder.splice(newPos, 0, removedElement);
        setColumnNamesOrder(newColumnNamesOrder);
        setisStateUpdating(false)
    }

    const updateVisibility = (isChecked: boolean, columnId: string) => {
        setisStateUpdating(true)
        setColumnNamesOrder((prevColumnNamesOrder: { id: string, visible: boolean }[]) => {

            return prevColumnNamesOrder.map(column => column.id === columnId ? { ...column, visible: isChecked } : column
            );
        });
        setTimeout(() => {
            setisStateUpdating(false)
        });

    }

    const handleAllVisiblity = (isVisible: boolean) => {
        setisStateUpdating(true)
        setColumnNamesOrder(prevColumnNamesOrder =>
            prevColumnNamesOrder.map(column => ({ ...column, visible: isVisible }))
        );
        setTimeout(() => {
            setisStateUpdating(false)
        });
    }

    const formatColumnName = (id: string) => {
        return id.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    };
    return (
        <div className="table_sort block w-full mt-6 z-10">
            <Dropdown placement="bottom" dismissOnClick={false} label="" renderTrigger={() =>
                <span className="font-medium text-sm  cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12" fill="none">
                    <path d="M8.25 8.25H6.75V9H8.25V10.5H9V9H10.5V8.25H9V6.75H8.25V8.25ZM5.81845 6.75C6.42395 5.84555 7.45502 5.25 8.625 5.25C10.4887 5.25 12 6.76125 12 8.625C12 10.4887 10.4887 12 8.625 12C7.1557 12 5.90548 11.0608 5.4421 9.75H4.5V9H5.27061C5.25699 8.87687 5.25 8.75175 5.25 8.625C5.25 8.23055 5.31769 7.85189 5.4421 7.5H4.5V6.75H5.81845ZM1.5 3V2.25H3V3H1.5ZM4.5 3V2.25H10.5V3H4.5ZM4.5 5.25V4.5H10.5V5.25H4.5ZM1.5 5.25V4.5H3V5.25H1.5ZM1.5 7.5V6.75H3V7.5H1.5ZM1.5 9.75V9H3V9.75H1.5Z" fill="#343741" />
                </svg> Columns</span>}>
                <div>
                    <div className={``}>
                        <div className="absolute top-[-17px] lg:left-0 right-0 m-auto w-full lg:text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="12" viewBox="0 0 24 12" fill="#fff" className="svg_filter_shadow">
                                <path d="M12 0.00100708L24 12.001H0L12 0.00100708Z" />
                            </svg>
                        </div>
                    </div>
                    <div className="pop_tooltip_height overflow-auto">
                        {columnNamesOrder && columnNamesOrder.length > 0 &&
                            !isStateUpdating ? <Draggable onPosChange={handlePosition}>
                            {columnNamesOrder && columnNamesOrder.map((names, index) => (
                                columnNamesOrder && !excludeReOrder.includes(names.id) &&
                                < div className="flex items-center justify-between px-5 py-2" key={index + '_' + names}>
                                    <label className="inline-flex items-center cursor-pointer">

                                        <input type="checkbox" value="" className="sr-only peer" checked={names.visible} onChange={(e) => updateVisibility(e.target.checked, names.id)} />
                                        <div className="relative w-9 h-5 bg-gray-400 rounded-full peer peer-focus:ring-0    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ms-3 text-xs font-medium text-gray-900">{formatColumnName(names.id)}</span>
                                    </label>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1247 5.00101C10.332 5.00101 10.5 5.17496 10.5 5.37601C10.5 5.58311 10.3282 5.75101 10.1247 5.75101H1.87526C1.66801 5.75101 1.5 5.57706 1.5 5.37601C1.5 5.1689 1.67175 5.00101 1.87526 5.00101H10.1247ZM10.1247 7.25101C10.332 7.25101 10.5 7.42496 10.5 7.62601C10.5 7.83311 10.3282 8.00101 10.1247 8.00101H1.87526C1.66801 8.00101 1.5 7.82706 1.5 7.62601C1.5 7.4189 1.67175 7.25101 1.87526 7.25101H10.1247Z" fill="#69707D" />
                                    </svg>
                                </div>
                            ))
                            }

                        </Draggable>

                            :
                            columnNamesOrder && columnNamesOrder.map((names, index) => (
                                columnNamesOrder && !excludeReOrder.includes(names.id) &&
                                < div className="flex items-center justify-between px-5 py-2" key={index + '_' + names}>
                                    <label className="inline-flex items-center cursor-pointer">

                                        <input type="checkbox" value="" className="sr-only peer" checked={names.visible} onChange={(e) => updateVisibility(e.target.checked, names.id)} />
                                        <div className="relative w-9 h-5 bg-gray-400 rounded-full peer peer-focus:ring-0    peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ms-3 text-xs font-medium text-gray-900">{names.id}</span>
                                    </label>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none">
                                        <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1247 5.00101C10.332 5.00101 10.5 5.17496 10.5 5.37601C10.5 5.58311 10.3282 5.75101 10.1247 5.75101H1.87526C1.66801 5.75101 1.5 5.57706 1.5 5.37601C1.5 5.1689 1.67175 5.00101 1.87526 5.00101H10.1247ZM10.1247 7.25101C10.332 7.25101 10.5 7.42496 10.5 7.62601C10.5 7.83311 10.3282 8.00101 10.1247 8.00101H1.87526C1.66801 8.00101 1.5 7.82706 1.5 7.62601C1.5 7.4189 1.67175 7.25101 1.87526 7.25101H10.1247Z" fill="#69707D" />
                                    </svg>
                                </div>
                            ))
                        }
                    </div>
                    <div className="px-5"><div className="-mr-5 -ml-5"><hr /></div></div>
                    <div className="flex items-center justify-between px-5 py-2">
                        <span className="font-medium text-xs link_color cursor-pointer" onClick={() => handleAllVisiblity(true)}>Show all</span>
                        {/* <span className="font-medium text-xs link_color cursor-pointer" onClick={() => handleAllVisiblity(false)}>Hide all</span> */}
                    </div>
                </div>
            </Dropdown>

        </div>
    )
}

export default ColumnsFilter;