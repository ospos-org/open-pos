import { useAtomValue } from "jotai"

import { searchTypeHandlerAtom } from "@/src/atoms/search"

import { SearchResultsCustomers } from "./groupers/searchResultsCustomers"
import { SearchResultsProducts } from "./groupers/searchResultsProducts"
import { SearchResultsTransaction } from "./groupers/searchResultsTransaction"

export function SearchGroup() {
    const searchType = useAtomValue(searchTypeHandlerAtom)

    return (
        <div className="flex flex-1 flex-col flex-wrap bg-gray-700 rounded-sm text-white overflow-hidden">
            {
                (() => {
                    switch(searchType) {
                        case "products":
                            return <SearchResultsProducts />
                        case "customers":
                            return <SearchResultsCustomers />
                        case "transactions":
                            return <SearchResultsTransaction />
                        default:
                            return (
                                <div>
                                    A problem has occurred.
                                </div>
                            )
                    }
                })()
            }
        </div>
    )
}