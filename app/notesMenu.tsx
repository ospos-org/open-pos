import Image from "next/image";
import { FC, createRef, useState } from "react";
import { Note, Order } from "./stock-types";

const NotesMenu: FC<{ notes: Order[], callback: Function }> = ({ notes, callback }) => {
    const input_ref = createRef<HTMLInputElement>();
    const [ activeOrder, setActiveOrder ] = useState<Order>(notes[0]);
    const [ selectorOpen, setSelectorOpen ] = useState(false);

    return (
        <div className="flex flex-1 flex-col gap-8  overflow-y-hidden">
            <div className="relative inline-block w-fit">
                <div className={`bg-gray-800 select-none text-white flex flex-row px-4 py-2 w-fit gap-4 cursor-pointer ${selectorOpen ? "rounded-t-md rounded-b-none" : "rounded-md"}`} onClick={() => {
                    setSelectorOpen(!selectorOpen)
                }}>
                    <p className="font-semibold">{activeOrder.order_type.toUpperCase()} - {activeOrder.origin.code}</p>
                    <Image src={!selectorOpen ? "/icons/chevron-down.svg" : "/icons/chevron-up.svg"} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} alt="" height={18} width={18}></Image>
                </div>

                <div className={`${selectorOpen ? "absolute flex flex-col items-center w-full text-white justify-center bg-gray-600 overflow-hidden z-50 rounded-t-none rounded-b-md" : "hidden absolute"}`}>
                    {
                        notes.map(k => {
                            return (
                                <div key={k.id}>
                                    {k.origin.code}
                                </div>
                            )
                        })
                    }
                </div>
            </div>

            <div 
                className="flex flex-col flex-1 items-center overflow-y-scroll max-h-full gap-4">
                {
                    notes.length == 0 ? 
                    <p className="text-gray-600">No notes yet</p>
                    :
                    activeOrder.order_notes.map(e => {
                        return (
                            <div className="flex flex-row items-center w-full justify-between gap-4" key={`${e.timestamp}-${e.message}`}>
                                <div className="flex flex-col">
                                    <p className="text-gray-400 font-bold">{e.author.name.first} {e.author.name.last}</p>       
                                    <p className="text-gray-600 text-sm">{new Date(e.timestamp).toLocaleDateString("en-US", { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric' }).split(",").join(" ")}</p>                                
                                </div>
                                <p className="text-white w-full flex-1">{e.message}</p>
                            </div>
                        )
                    })
                }
            </div>

            <hr className="border-gray-400 opacity-25"/>
            
            <div className="flex flex-col justify-center gap-4 bg-gray-700 rounded-sm">
                <div className="flex flex-1 flex-row items-center justify-between gap-4 px-2 pr-4">
                    <input 
                        ref={input_ref}
                        onKeyDown={(e) => {
                            if(e.key == "Enter") {
                                callback(activeOrder.id, input_ref.current?.value ?? "")
                            }
                        }}
                        placeholder={"Order Note"}
                        autoFocus className="flex-1 text-white py-4 px-2 rounded-md bg-transparent outline-none" type="text" />
                    
                    <Image
                        onClick={() => {
                            callback(activeOrder.id, input_ref.current?.value ?? "")
                        }} 
                        width="22" height="22" src="/icons/arrow-square-right.svg" style={{ filter: "invert(58%) sepia(32%) saturate(152%) hue-rotate(176deg) brightness(91%) contrast(87%)" }} className="select-none" alt={''} draggable={false}></Image>
                </div>
            </div>
        </div>
    )
}

export default NotesMenu;