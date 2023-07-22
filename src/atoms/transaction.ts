import { atom } from "jotai";
import { splitAtom } from "jotai/utils";
import { Order } from "../utils/stock_types";

const ordersAtom = atom<Order[]>([])
const ordersAtomsAtom = splitAtom(ordersAtom)

export { ordersAtomsAtom }