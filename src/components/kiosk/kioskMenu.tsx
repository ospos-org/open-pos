import { useAtom, useAtomValue } from "jotai"
import { useResetAtom } from "jotai/utils"
import { useEffect } from "react"

import { searchFocusedAtom, searchTermAtom } from "@atoms/search"
import { inspectingCustomerAtom } from "@atoms/customer"
import { inspectingProductAtom } from "@atoms/product"
import useParkedTransactions from "@/src/hooks/useParkedTransactions"
import useKeyPress from "@hooks/useKeyPress"

import { SavedTransactionItem } from "./children/order/transaction/savedTransactionItem"
import { ExpandedCustomer } from "./children/search/expanded/expandedCustomer"
import { ExpandedProduct } from "./children/search/expanded/expandedProduct"
import { SearchGroup } from "./children/search/searchGroup"
import { KioskBlocks } from "./children/kioskBlocks"
import { SearchBar } from "./children/search/searchBar"

export const BLOCK_SIZE = "sm:min-w-[250px] min-w-[49%]";

export default function KioskMenu() {
    const resetProductInspection = useResetAtom(inspectingProductAtom)

    const inspectingProduct = useAtomValue(inspectingProductAtom)
    const searchTermState = useAtomValue(searchTermAtom)
    
    const [ inspectingCustomer, setInspectingCustomer ] = useAtom(inspectingCustomerAtom) 
    const [ searchFocused, setSearchFocused ] = useAtom(searchFocusedAtom)

    const { activeTransactions } = useParkedTransactions() 

    const escapePressed = useKeyPress(['Escape'])

    useEffect(() => {
        resetProductInspection()
        setSearchFocused(false)
        setInspectingCustomer(null)
    }, [escapePressed, resetProductInspection, setInspectingCustomer, setSearchFocused]);

    return (
        <div 
            className="flex flex-col justify-between h-[calc(100vh-18px)] max-h-[calc(100vh-18px)] min-h-[calc(100vh-18px)] overflow-hidden flex-1" 
            onKeyDownCapture={(e) => {
                if(e.key == "Escape") setSearchFocused(false)
            }}>

            <SearchBar />

            <div className="flex flex-col p-4 gap-4 h-full max-h-full overflow-auto">
                <div className="w-full max-w-full h-full max-h-full">
                    {
                        searchFocused && (searchTermState !== "") ?
                            <SearchGroup />
                        :
                        inspectingCustomer ? 
                            <ExpandedCustomer />
                        :
                        inspectingProduct.activeProduct ? 
                            <ExpandedProduct />
                        :
                            <KioskBlocks />
                    }
                </div>
            </div>
        
            <div className="flex flex-row items-center border-t-2 border-gray-600 min-h-[84px]">
                {
                    activeTransactions?.map(k => {
                        return (
                            <SavedTransactionItem 
                                transaction={k} 
                                key={k.id} 
                            />
                        )
                    })
                }
            </div>
        </div>
    )
}