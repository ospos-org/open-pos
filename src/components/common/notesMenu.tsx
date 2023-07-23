import Image from "next/image";
import { FC, createRef, useState, useEffect } from "react";
import { NoteElement } from "./noteElement";
import { Note, Order } from "../../utils/stockTypes";
import { useAtom, useAtomValue } from "jotai";
import { ordersAtomsAtom } from "@/src/atoms/transaction";
import { NoteOrderItem } from "./noteOrderItem";
import { nanoid } from "nanoid";

const NotesMenu: FC<{ callback: (activeOrder: string, noteContent: string) => void, autoFocus?: boolean }> = ({ callback, autoFocus }) => {
    const input_ref = createRef<HTMLInputElement>();

    const orderState = useAtomValue(ordersAtomsAtom)

    const [ activeOrderAtom, setActiveOrderAtom ] = useState(orderState[0])
    const [ activeOrder ] = useAtom(activeOrderAtom);

    const [ selectorOpen, setSelectorOpen ] = useState(false);

    useEffect(() => {
        setActiveOrderAtom(orderState.find(k => k.debugLabel == activeOrder.id) ?? orderState[0])
    }, [orderState, activeOrder.id])

    return (
        <div className="flex flex-1 flex-col gap-8  overflow-y-hidden">
            <div className="relative inline-block w-fit">
                {
                    orderState.length != 1 ?
                    <div className={`bg-gray-800 select-none text-white flex flex-row w-fit gap-4 cursor-pointer px-4 py-2 ${selectorOpen ? "rounded-t-md rounded-b-none" : "rounded-md"}`} onClick={() => {
                        setSelectorOpen(!selectorOpen)
                    }}>
                        <p className="font-semibold">{activeOrder.order_type.toUpperCase()} - {activeOrder?.origin?.store_code}</p>
                        <Image src={!selectorOpen ? "/icons/chevron-down.svg" : "/icons/chevron-up.svg"} style={{ filter: "invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)" }} alt="" height={18} width={18}></Image>
                    </div>
                    :
                    <></>
                }

                <div className={`${selectorOpen ? "absolute flex flex-col items-center w-full text-white justify-center bg-gray-700 overflow-hidden z-50 rounded-t-none rounded-b-md" : "hidden absolute"}`}>
                    {
                        orderState.map((orderAtom) => 
                            <NoteOrderItem key={nanoid()} activeAtom={orderAtom} callback={(orderAtom) => {
                                setActiveOrderAtom(orderAtom)
                                setSelectorOpen(false)
                            }} />
                        )
                    }
                </div>
            </div>

            <div 
                className="flex flex-col flex-1 items-center overflow-y-scroll max-h-full gap-4">
                {
                    activeOrder.order_notes.length == 0 ? 
                    <p className="text-gray-400">No notes yet</p>
                    :
                    activeOrder.order_notes.map(e => {
                        return (
                            <NoteElement note={e} key={`${e.author} ${e.message} - ${e.timestamp}`}/>
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
                                if(input_ref.current) input_ref.current.value = "";
                            }
                        }}
                        placeholder={"Order Note"}
                        autoFocus={autoFocus ?? true} className="flex-1 text-white py-4 px-2 rounded-md bg-transparent outline-none" type="text" />
                    
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