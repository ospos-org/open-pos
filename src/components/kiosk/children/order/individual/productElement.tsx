import { useAtomValue } from "jotai";
import { useMemo } from "react";

import { masterStateAtom } from "@atoms/openpos";
import { ContextualOrder, ContextualProductPurchase } from "@utils/stockTypes";

import { ProductDiscount } from "./productDiscount";
import { ProductImage } from "./productImage";
import { ProductPrice } from "./productPrice";
import { ProductQuantity } from "./productQuantity";
import { ProductTitle } from "./productTitle";

interface ProductElementProps {
	product: ContextualProductPurchase;
	currentOrder: ContextualOrder;
}

export function ProductElement({ product, currentOrder }: ProductElementProps) {
	const currentStore = useAtomValue(masterStateAtom);

	// Find the variant of the product for name and other information...
	const totalStock = useMemo(() => {
		return product.variant_information.stock.reduce(
			(prev, curr) => prev + curr.quantity.quantity_sellable,
			0,
		);
	}, [product.variant_information.stock]);

	const quantityHere = useMemo(() => {
		return product.variant_information.stock.find(
			(e) => e.store.store_id === currentStore.store_id,
		);
	}, [currentStore.store_id, product.variant_information.stock]);

	return (
		<div className="text-white">
			<div className="flex flex-row items-center gap-4">
				<div className="flex flex-col md:flex-row items-center md:gap-4 gap-2">
					<ProductImage
						currentOrder={currentOrder}
						product={product}
						quantityHere={quantityHere}
					/>
					<ProductQuantity
						currentOrder={currentOrder}
						product={product}
						totalStock={totalStock}
					/>
				</div>

				<ProductTitle
					currentOrder={currentOrder}
					product={product}
					quantityHere={quantityHere}
					totalStock={totalStock}
				/>

				<div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
					<ProductDiscount product={product} />
					<ProductPrice product={product} />
				</div>
			</div>
		</div>
	);
}
