import { useSetAtom } from "jotai";

import { Stock } from "@/generated/stock/Api";
import { inspectingProductAtom } from "@atoms/product";
import { ContextualOrder, ContextualProductPurchase } from "@utils/stockTypes";
import { useCallback, useMemo } from "react";

interface ProductTitleProps {
	currentOrder: ContextualOrder;
	product: ContextualProductPurchase;
	quantityHere: Stock | undefined;
	totalStock: number;
}

export function ProductTitle({
	currentOrder,
	product,
	quantityHere,
	totalStock,
}: ProductTitleProps) {
	const setInspectingProduct = useSetAtom(inspectingProductAtom);

	const focusProduct = useCallback(() => {
		setInspectingProduct((currentProduct) => ({
			...currentProduct,
			activeProduct: product.product,
			activeProductVariant: product.variant_information,
			activeProductPromotions: product.active_promotions,
		}));
	}, [product, setInspectingProduct]);

	const outOfStock = useMemo(() => {
		const quantityConsumed =
			currentOrder.products.reduce(
				(t, i) =>
					i.variant_information.barcode === product.variant_information.barcode
						? i.quantity
						: 0,
				0,
			) ?? 1;

		return quantityConsumed > (quantityHere?.quantity.quantity_sellable ?? 0);
	}, [
		currentOrder.products,
		product,
		quantityHere?.quantity.quantity_sellable,
	]);

	return (
		<div className="flex-1 cursor-pointer" onClick={focusProduct}>
			<p className="font-semibold">
				{product.product.company} {product.product.name}
			</p>
			<p className="text-sm text-gray-400">
				{product.variant_information.name}
			</p>

			{Boolean(
				currentOrder.order_type === "direct" &&
					product.transaction_type === "Out" &&
					outOfStock,
			) && (
				<p className="text-xs text-red-400">
					Out of stock - {quantityHere?.quantity.quantity_sellable ?? 0} here ,{" "}
					{totalStock - (quantityHere?.quantity.quantity_sellable ?? 0) ?? 0} in
					other stores
				</p>
			)}
		</div>
	);
}
