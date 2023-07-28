import { atom } from "jotai"

import { Order, Product, ProductCategory, ProductInstance } from "@utils/stockTypes"

const receivablesAtom = atom<Order[]>([])

const receivablesMenuStateAtom = atom<{
    product: string,
    barcode: string,
    instances: {
        product_purchase_id: string,
        transaction_id: string,
        state: ProductInstance
    }[]
} | null>(null)

const receivablesStateChangeAtom = atom<{
    product_purchase_id: string,
    transaction_id: string,
    state: ProductInstance
} | null>(null)

const receivablesActiveOrderAtom = atom<Order | null>(null)

const receivablesProductInformationAtom = atom<Product | null>(null)

export { receivablesAtom, receivablesMenuStateAtom, receivablesStateChangeAtom, receivablesActiveOrderAtom, receivablesProductInformationAtom }