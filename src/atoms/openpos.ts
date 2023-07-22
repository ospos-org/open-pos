import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { MasterState } from "../utils/stock_types";

const masterStateAtom = atomWithStorage<MasterState>("openstock-master-state", {
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
    kiosk_id: null, // "adbd48ab-f4ca-4204-9c88-3516f3133621",
    kiosk: "NEW"
})

export { masterStateAtom }