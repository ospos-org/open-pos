import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { Customer } from "../utils/stockTypes";

/// The customer assigned to the active order
const customerAtom = atomWithReset<Customer | null>(null)
const aCustomerActiveAtom = atom(
    (get) => get(customerAtom) !== null
)

const inspectingCustomerAtom = atom<Customer| null>(null)

export { customerAtom, aCustomerActiveAtom, inspectingCustomerAtom }