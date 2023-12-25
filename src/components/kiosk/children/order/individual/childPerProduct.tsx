import { ContextualOrder } from "@utils/stockTypes"

import { ProductElement } from "./productElement"

interface ChildPerProductProps {
    currentOrder: ContextualOrder
}

export function ChildPerProduct({ currentOrder }: ChildPerProductProps) {
    return (
        <>
            {currentOrder.products.map((product) =>
                <ProductElement key={product.id} product={product} currentOrder={currentOrder} />
            )}
        </>
    )
}
