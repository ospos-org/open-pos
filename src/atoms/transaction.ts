import { splitAtom } from "jotai/utils";
import { atom } from "jotai";

import { Order, Transaction } from "@utils/stockTypes";

const ordersAtom = atom<Order[]>([])
const ordersAtomsAtom = splitAtom(ordersAtom)

const inspectingTransactionAtom = atom<{
    item: Transaction,
    identifier: string
} | null>(null)

export { ordersAtom, ordersAtomsAtom, inspectingTransactionAtom }