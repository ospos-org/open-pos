import { Stock } from "@/generated/stock/Api";
import {
	ContextualOrder,
	ContextualProductPurchase,
} from "@/src/utils/stockTypes";
import { totalNetQuantityOfProductTransactedOutFromCartAtom } from "@atoms/cart";
import { useSetAtom } from "jotai";
import Image from "next/image";
import { useMemo } from "react";

interface ProductImageProps {
	currentOrder: ContextualOrder;
	quantityHere: Stock | undefined;
	product: ContextualProductPurchase;
}

export function ProductImage({
	currentOrder,
	quantityHere,
	product,
}: ProductImageProps) {
	const totalProductQuantitySelected = useSetAtom(
		totalNetQuantityOfProductTransactedOutFromCartAtom,
	);

	const productQuantityStyle = useMemo(() => {
		// If it's a direct order (must be in-stock), and has a quantity above that which is sellable
		// by the current store - warn the operator using a red colouring.
		if (
			currentOrder.order_type === "direct" &&
			totalProductQuantitySelected(product) >
				(quantityHere?.quantity.quantity_sellable ?? 0) &&
			product.transaction_type === "Out"
		)
			return "bg-red-500";

		return "bg-gray-600";
	}, [currentOrder, product, quantityHere, totalProductQuantitySelected]);

	return (
		<div className="relative">
			<Image
				height={60}
				width={60}
				quality={100}
				alt=""
				className="rounded-sm"
				src={product.variant_information.images[0]}
			/>

			<div
				className={`${productQuantityStyle} rounded-full flex items-center justify-center h-[30px] 
                w-[minmax(30px, 100%)] px-1 min-h-[30px] min-w-[30px] absolute -top-3 -right-3 
                border-gray-900 border-4`}
			>
				{product.quantity}
			</div>
		</div>
	);
}
