import { useSetAtom } from "jotai"

import { inspectingProductAtom } from "@atoms/product"
import { Order, ProductPurchase, StockInfo } from "@utils/stockTypes"

interface ProductTitleProps {
    currentOrder: Order,
    product: ProductPurchase,
    quantityHere: StockInfo | undefined,
    totalStock: number
}

export function ProductTitle({ currentOrder, product, quantityHere, totalStock }: ProductTitleProps) {
    const setInspectingProduct = useSetAtom(inspectingProductAtom)

    return (
        <div className="flex-1 cursor-pointer"
            onClick={() => {
                setInspectingProduct((currentProduct) => ({
                    ...currentProduct,
                    activeProduct: product.product,
                    activeProductVariant: product.variant_information,
                    activeProductPromotions: product.active_promotions

                }))
            }} >
            <p className="font-semibold">{product.product.company} {product.product.name}</p>
            <p className="text-sm text-gray-400">{product.variant_information.name}</p>
            
            {
                currentOrder.order_type == "direct" ?
                    (currentOrder.products.reduce((t, i) => t += (i.variant_information.barcode == product.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                    > 
                    (quantityHere?.quantity.quantity_sellable ?? 0)
                    ?
                        <p className="text-sm text-red-400">Out of stock - {(quantityHere?.quantity.quantity_sellable ?? 0)} here, {(totalStock - (quantityHere?.quantity.quantity_sellable ?? 0)) ?? 0} in other stores</p>
                    :
                        <></>
                :
                    <></>
            }
        </div>
    )
}