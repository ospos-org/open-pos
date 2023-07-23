import { useAtomValue, useSetAtom } from "jotai"
import { useResetAtom } from "jotai/utils"
import Image from "next/image"

import { kioskPanelLogAtom, searchInputRefAtom } from "@atoms/kiosk"
import { searchResultsAtom, searchTypeAtom } from "@atoms/search"
import { aCustomerActiveAtom } from "@atoms/customer"

interface DispatchProps {
    children: any,
    title: string
}

export function DispatchHandler({ children, title }: DispatchProps) {
    const aCustomer = useAtomValue(aCustomerActiveAtom)
    const inputRef = useAtomValue(searchInputRefAtom)

    const setKioskPanel = useSetAtom(kioskPanelLogAtom)

    const clearSearchResults = useResetAtom(searchResultsAtom)
    const setSearchType = useSetAtom(searchTypeAtom)

    if (aCustomer) {
        return <>{children}</>
    }
    
    return (
        <div className="bg-gray-900 max-h-[calc(100vh - 18px)] p-6 flex flex-col h-full justify-between flex-1 gap-8" style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}>
            <div className="flex flex-row justify-between cursor-pointer">
                <div 
                    onClick={() => {
                        setKioskPanel("cart")
                    }}
                    className="flex flex-row items-center gap-2"
                >
                    <Image src="/icons/arrow-narrow-left.svg" height={20} width={20} alt="" />
                    <p className="text-gray-400">Back</p>
                </div>
                <p className="text-gray-400">{title}</p>
            </div>
            
            <div className="flex items-center justify-center flex-1 gap-8 flex-col">
                <p className="text-gray-400">Must have an assigned customer to send products.</p>

                <div 
                    onClick={() => {
                        clearSearchResults()
                        setSearchType("customers");    

                        inputRef.current?.value ? inputRef.current.value = "" : {};
                        inputRef.current?.focus()
                    }}
                    className="bg-gray-800 text-white rounded-md px-2 py-[0.1rem] flex flex-row items-center gap-2 cursor-pointer">
                    <p>Select Customer</p>
                    <Image 
                        className=""
                        height={15} width={15} src="/icons/arrow-narrow-right.svg" alt="" style={{ filter: "invert(100%) sepia(5%) saturate(7417%) hue-rotate(235deg) brightness(118%) contrast(101%)" }}></Image>
                </div>
            </div>
        </div>
    )
}