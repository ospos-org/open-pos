import { useAtomValue } from "jotai";

import { searchResultsAtomic } from "@atoms/search";
import { ItemTransaction } from "../results/itemTransaction";
import { Transaction } from "@utils/stockTypes";

export function SearchResultsTransaction() {
    const searchResults = useAtomValue(searchResultsAtomic)

    if (searchResults.length == 0) {
        return <p className="self-center text-gray-400 py-6">No transactions with this reference</p>
    }

    return (
        <>
            {
                (searchResults as Transaction[])
                    .map((result, index) => {
                    return result.id ? (
                        <ItemTransaction 
                            key={`SEARCH_RESULT_PRODUCT_${result.id}`} 
                            notEnd={index == searchResults.length-1 || searchResults.length == 1} 
                            transaction={result} 
                        />
                    ) : (<></>)
                })
            }
        </>
    )
}