import { atomWithReset } from "jotai/utils";
import { atom } from "jotai";
import {Customer} from "@/generated/stock/Api";

/// The customer assigned to the active order
const customerAtom = atomWithReset<Customer | null>(null)
const aCustomerActiveAtom = atom(
    (get) => get(customerAtom) !== null
)

const inspectingCustomerAtom = atom<Customer| null>(null)

export { customerAtom, aCustomerActiveAtom, inspectingCustomerAtom }