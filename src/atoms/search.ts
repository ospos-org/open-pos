import { createRef, RefObject } from "react";
import { atomWithReset } from "jotai/utils";
import { atom } from "jotai";
import {
    CustomerWithTransactionsOut,
    ProductWPromotion,
    Transaction
} from "@/generated/stock/Api";
import {openStockClient} from "~/query/client";

interface SearchResults {
    products: ProductWPromotion[],
    customers: CustomerWithTransactionsOut[],
    transactions: Transaction[]
}

const searchResultsAtom = atomWithReset<SearchResults>({
    products: [],
    customers: [],
    transactions: []
})

const searchTypeAtom = atom<keyof SearchResults>("products")
const searchResultsAtomic = atom(
    (get) => get(searchResultsAtom)[get(searchTypeAtom)],
    (get, set, value: any) => {
        set(searchResultsAtom, {
            ...get(searchResultsAtom),
            [get(searchTypeAtom)]: value
        })
    }
)

const searchInputRefAtom = atom<RefObject<HTMLInputElement>>(createRef<HTMLInputElement>())

const searchTypeHandlerAtom = atom(
    (get) => get(searchTypeAtom),
    (get, set, value: keyof SearchResults) => {
        set(searchTermAtom, "")
        set(searchTypeAtom, value)

        // Make input value blank.
        // @ts-expect-error Assigning to override `inputRef`
        if (get(searchInputRefAtom).current?.value) get(searchInputRefAtom).current.value = ""

        get(searchInputRefAtom).current?.focus()
    }
)

const searchFocusedAtom = atom<boolean>(false)
const searchTermAtom = atom<string>("")

const querySearchTerm = atom(undefined,
    async (get, set) => {
        if(get(searchTermAtom) == "") {
            return;
        }

        var myHeaders = new Headers();
        myHeaders.append("Cookie", `${document.cookie}`);

        const searchType = get(searchTypeAtom)
        const searchTerm = get(searchTermAtom)

        const performQuery = async () => {
            switch (searchType) {
                case "customers":
                    return await openStockClient.customer.searchQuery(searchTerm)
                case "products":
                    return await openStockClient.product.searchWithAssociatedPromotions(searchTerm)
                case "transactions":
                    return await openStockClient.transaction.getByName(searchTerm)
            }
        }

        const queryResponse = await performQuery()
        if (queryResponse.ok) set(searchResultsAtomic, queryResponse.data)
    })

export { 
    searchResultsAtom, 
    searchTypeHandlerAtom,
    searchTypeAtom, 
    querySearchTerm,
    searchInputRefAtom, 
    searchResultsAtomic, 
    searchTermAtom, 
    searchFocusedAtom 
}