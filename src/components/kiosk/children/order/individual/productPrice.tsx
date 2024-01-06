import { aCustomerActiveAtom } from "@/src/atoms/customer";
import { generateProductInfo } from "@/src/utils/discountHelpers";
import { ContextualProductPurchase } from "@utils/stockTypes";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

interface ProductPriceProps {
	product: ContextualProductPurchase;
}

export function ProductPrice({ product }: ProductPriceProps) {
	const aCustomerActive = useAtomValue(aCustomerActiveAtom);

	const {
		maxDiscount,
		priceAlreadyDiscounted,
		parsedDiscount,
		quantityConsiderateTotalWithTax,
		quantityConsiderateDiscountedTotalWTax,
	} = generateProductInfo(product, aCustomerActive);

	const elementContent = useMemo(() => {
		if (priceAlreadyDiscounted) {
			return (
				<p>
					$
					{(
						product.variant_information.retail_price *
						product.quantity *
						1.15
					).toFixed(2)}
				</p>
			);
		}

		return (
			<>
				<div
					className={`
                    text-gray-500 text-sm ${
											maxDiscount.source === "loyalty"
												? "text-gray-500"
												: maxDiscount.source === "promotion"
												  ? "text-blue-500 opacity-75"
												  : "text-red-500"
										} flex flex-row items-center gap-2`}
				>
					<p className="line-through">
						{product.transaction_type === "In" ? "-" : ""}$
						{quantityConsiderateTotalWithTax.toFixed(2)}
					</p>

					{parsedDiscount}
				</div>

				<p className={maxDiscount.source === "loyalty" ? "text-gray-300" : ""}>
					{product.transaction_type === "In" ? "-" : ""}$
					{(
						quantityConsiderateTotalWithTax -
						quantityConsiderateDiscountedTotalWTax
					).toFixed(2)}
				</p>
			</>
		);
	}, [
		maxDiscount.source,
		parsedDiscount,
		priceAlreadyDiscounted,
		product,
		quantityConsiderateDiscountedTotalWTax,
		quantityConsiderateTotalWithTax,
	]);

	return (
		<div className="min-w-[75px] flex flex-col items-center">
			{elementContent}
		</div>
	);
}
