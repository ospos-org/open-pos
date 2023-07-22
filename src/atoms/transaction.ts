import { atom } from "jotai";
import { splitAtom } from "jotai/utils";
import { Order, Transaction } from "../utils/stock_types";

const ordersAtom = atom<Order[]>([])
const ordersAtomsAtom = splitAtom(ordersAtom)

const inspectingTransactionAtom = atom<{
    item: Transaction,
    identifier: string
} | null>(null)

export { ordersAtom, ordersAtomsAtom, inspectingTransactionAtom }