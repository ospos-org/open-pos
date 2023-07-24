import { useAtomValue } from "jotai"

import { searchFocusedAtom, searchTermAtom } from "@atoms/search"
import { inspectingCustomerAtom } from "@atoms/customer"
import { inspectingProductAtom } from "@atoms/product"

import { ExpandedCustomer } from "./expanded/expandedCustomer"
import { ExpandedProduct } from "./expanded/expandedProduct"
import { KioskBlocks } from "../kioskBlocks"
import { SearchGroup } from "./searchGroup"

export function SearchMenu() {
    const inspectingCustomer = useAtomValue(inspectingCustomerAtom) 
    const inspectingProduct = useAtomValue(inspectingProductAtom)
    const searchTermState = useAtomValue(searchTermAtom)
    const searchFocused = useAtomValue(searchFocusedAtom)

    return (
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
    )
}