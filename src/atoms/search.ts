import { atomWithReset, RESET } from "jotai/utils";
import { atom } from "jotai";

import { Customer, Product, Promotion, StrictVariantCategory, Transaction, VariantInformation } from "@utils/stockTypes";
import { createRef, RefObject } from "react";
import { OPEN_STOCK_URL } from "../utils/environment";
import { ordersAtom } from "./transaction";
import atomWithDebounce from "../utils/atomWithDebounce";

interface SearchResults {
    products: {
        product: Product,
        promotions: Promotion[]
    }[],
    customers: Customer[],
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

        console.log("OKAY QUERYING!")

        var myHeaders = new Headers();
        myHeaders.append("Cookie", `${document.cookie}`);

        const searchType = get(searchTypeAtom)
        const searchTerm = get(searchTermAtom)

        const fetchResult = await fetch(`${OPEN_STOCK_URL}/${searchType.substring(0, searchType.length-1)}/${searchType == "transactions" ? "ref" : searchType == "products" ? "search/with_promotions" : "search"}/${searchTerm.trim()}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
            credentials: "include"
        });

        const data = await fetchResult.json();

        set(searchResultsAtomic, data)
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