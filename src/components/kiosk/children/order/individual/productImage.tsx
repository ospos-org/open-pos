import { Order, ProductPurchase, StockInfo } from "@/src/utils/stockTypes";
import Image from "next/image";

interface ProductImageProps {
    currentOrder: Order,
    quantityHere: StockInfo | undefined,
    product: ProductPurchase
}

export function ProductImage({ currentOrder, quantityHere, product }: ProductImageProps) {
    return (
        <div className="relative">
            <Image height={60} width={60} quality={100} alt="" className="rounded-sm" src={product.variant_information.images[0]}></Image>

            {
                currentOrder.order_type == "direct" ?
                    (currentOrder.products.reduce((t, i) => t += (i.variant_information.barcode == product.variant_information.barcode ? i.quantity : 0), 0) ?? 1) 
                    >
                    (quantityHere?.quantity.quantity_sellable ?? 0) && product.transaction_type == "Out"
                    ?
                    <div className="bg-red-500 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                    :
                    // e.variant_information.stock.map(e => (e.store.code == master_state.store_id) ? 0 : e.quantity.quantity_on_hand).reduce(function (prev, curr) { return prev + curr }, 0)
                    // Determine the accurate representation of a non-diminishing item.
                    product.variant_information.stock_information.non_diminishing ?
                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                    :
                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
                :
                    <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">{product.quantity}</div>
            }
        </div>
    )
}