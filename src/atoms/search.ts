import { atomWithReset } from "jotai/utils";
import { atom } from "jotai";

import { Customer, Product, Promotion, Transaction } from "@utils/stockTypes";

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

const searchFocusedAtom = atom<boolean>(false)
const searchTermAtom = atom<string>("")

export { searchResultsAtom, searchResultsAtomic, searchTermAtom, searchTypeAtom, searchFocusedAtom }