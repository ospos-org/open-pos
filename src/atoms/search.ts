import { atom } from "jotai";
import { Customer, Product, Promotion, Transaction } from "../utils/stock_types";

interface SearchResults {
    products: {
        product: Product,
        promotions: Promotion[]
    }[],
    customers: Customer[],
    transactions: Transaction[]
}

const searchResultsAtom = atom<SearchResults>({
    products: [],
    customers: [],
    transactions: []
})

export { searchResultsAtom }