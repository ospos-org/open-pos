import { Order } from "@utils/stockTypes"

import { ProductElement } from "./productElement"

interface ChildPerProductProps {
    currentOrder: Order 
}

export function ChildPerProduct({ currentOrder }: ChildPerProductProps) {
    return (
        <>
            {
                currentOrder.products.map((product) => {
                    return (
                        <ProductElement key={product.id} product={product} currentOrder={currentOrder} />
                    )
                })
            }
        </>
    )
}
