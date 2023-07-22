import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { Customer, Product, Promotion, Transaction } from "../utils/stock_types";

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

export { searchResultsAtom, searchResultsAtomic, searchTypeAtom, searchFocusedAtom }