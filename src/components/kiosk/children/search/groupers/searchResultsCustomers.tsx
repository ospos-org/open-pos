import { useAtomValue, useSetAtom } from "jotai";

import { searchResultsAtomic } from "@atoms/search";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { ItemCustomer } from "../results/itemCustomer";
import { Customer } from "@utils/stockTypes";

export function SearchResultsCustomers() {
    const searchResults = useAtomValue(searchResultsAtomic)

    const setKioskPanel = useSetAtom(kioskPanelLogAtom)

    if (!searchResults || searchResults.length == 0) {
        return (
            <>
                <p className="self-center text-gray-400 pt-6">No customers with this name</p>
                <p 
                    onClick={() => {
                        setKioskPanel("customer-create")
                    }}
                    className="self-center text-white pb-6 cursor-pointer">Create customer</p>
            </>
        )
    }

    return (
        <>
            {
                (searchResults as Customer[])
                    .map((result, index) => {
                    return (
                        <ItemCustomer key={`SEARCH_RESULT_CUSTOMER_${result.id}`} customer={result} index={index} />
                    )
                })
            }
        </>
    )
}