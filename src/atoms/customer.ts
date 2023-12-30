import { atomWithReset } from "jotai/utils";
import { atom } from "jotai";
import {Customer} from "@/generated/stock/Api";
import {nanoid} from "nanoid";

/// The customer assigned to the active order
const customerAtom = atomWithReset<Customer | null>(null)
const aCustomerActiveAtom = atom(
    (get) => get(customerAtom) !== null
)

const initialCustomer: Customer = {
    id: nanoid(),
    name: "",
    customer_notes: [],
    contact: {
        name: "",
        mobile: {
            number: "",
            valid: false
        },
        email: {
            root: "",
            domain: "",
            full: ""
        },
        landline: "",
        address: {
            street: "",
            street2: "",
            city: "",
            country: "",
            po_code: "",
            lat: 0,
            lon: 0
        }
    },
    balance: 0,
    special_pricing: "",
    accepts_marketing: false,
    created_at: "",
    updated_at: ""
}

const createCustomer = () => {
    return atom<Customer>(initialCustomer)
}

const inspectingCustomerAtom = createCustomer()


export { customerAtom, aCustomerActiveAtom, inspectingCustomerAtom, createCustomer, initialCustomer }