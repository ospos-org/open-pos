import { atom } from "jotai";
import { atomWithReset } from "jotai/utils";
import { Customer } from "../utils/stock_types";

const customerAtom = atomWithReset<Customer | null>(null)
const aCustomerActiveAtom = atom(
    (get) => get(customerAtom) !== null
)

export { customerAtom, aCustomerActiveAtom }