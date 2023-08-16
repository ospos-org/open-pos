import { atomWithStorage } from "jotai/utils"

import { Employee, MasterState, Store } from "@utils/stockTypes"
import { atom } from "jotai"
import Stripe from "stripe"

const pageAtom = atom<number>(0)
const mobileMenuOpenAtom = atom<boolean>(false)
const mobileLowModeAtom = atom<boolean>(false)
const activeEmployeeAtom = atom<Employee | null>(null);
const storeLookupTableAtom = atom<Store[]>([])
const activeTerminalAtom = atom<Stripe.Terminal.Reader | null>(null)
const availableTerminalsAtom = atom<Stripe.Terminal.Reader[]>([])

const passwordInputAtom = atom<string[]>(["","","","", "", "", "", ""]);

const rawMasterStateAtom = atomWithStorage<MasterState>("openstock-master-state", {
    store_lut: [],
    store_id: "628f74d7-de00-4956-a5b6-2031e0c72128", // "c4a1d88b-e8a0-4dcd-ade2-1eea82254816", //
    store_code: "001",
    store_contact: {
        name: "Torpedo7",
        mobile: {
            number: "+6421212120",
            valid: true
        },
        email: {
            root: "order",
            domain: "torpedo7.com",
            full: "order@torpedo7.com"
        },
        landline: "",
        address: {
            street: "9 Carbine Road",
            street2: "",
            city: "Auckland",
            country: "New Zealand",
            po_code: "100",
            lat: 100,
            lon: 100
        },
    },
    employee: null,
    kiosk_id: "adbd48ab-f4ca-4204-9c88-3516f3133621",
    kiosk: "NEW",
    availableTerminals: [],
    activeTerminal: null
})

const masterStateAtom = atom(
    (get) => ({
        ...get(rawMasterStateAtom),
        employee: get(activeEmployeeAtom),
        store_lut: get(storeLookupTableAtom),
        availableTerminals: get(availableTerminalsAtom),
        activeTerminal: get(activeTerminalAtom)
    }), 
    (_, set, value: MasterState) => {
        set(rawMasterStateAtom, value)
    }
)

export { 
    availableTerminalsAtom, 
    storeLookupTableAtom, 
    activeTerminalAtom, 
    mobileMenuOpenAtom, 
    activeEmployeeAtom, 
    mobileLowModeAtom, 
    passwordInputAtom,
    masterStateAtom, 
    pageAtom,
}