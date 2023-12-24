import { atom } from "jotai"
import {Order, Product, ProductInstance} from "@/generated/stock/Api";
import {ContextualOrder, ProductCategory} from "@utils/stockTypes";


const deliverablesAtom = atom<Order[]>([])
const productCategoriesAtom = atom<ProductCategory[]>([])

const deliverablesMenuStateAtom = atom<{
    product: string,
    barcode: string,
    instances: {
        product_purchase_id: string,
        transaction_id: string,
        state: ProductInstance
    }[]
} | null>(null)

const deliverablesStateChangeAtom = atom<{
    product_purchase_id: string,
    transaction_id: string,
    state: ProductInstance
} | null>(null)

const deliverablesActiveOrderAtom = atom<Order | null>(null)

const deliverablesProductInformationAtom = atom<Product | null>(null)

export { productCategoriesAtom, deliverablesProductInformationAtom, deliverablesActiveOrderAtom, deliverablesStateChangeAtom, deliverablesMenuStateAtom, deliverablesAtom }