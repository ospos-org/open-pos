import { PrimitiveAtom, useAtomValue } from "jotai";

import { generateProductInfo } from "@utils/discountHelpers";
import { ContextualOrder } from "@utils/stockTypes";

export function IndividualProduct({
	productAtom,
	customerActive,
}: { productAtom: PrimitiveAtom<ContextualOrder>; customerActive: boolean }) {
	const order = useAtomValue(productAtom);

	return (
		<div>
			{order.products?.map((e) => {
				const { discountedPrice } = generateProductInfo(e, customerActive);

				return (
					<div
						key={`PRD${e.product_code}-${e.id}`}
						className="flex flex-row items-center gap-8"
					>
						<p className="text-white font-bold">{e.quantity}</p>

						<div className="flex flex-col gap-0 flex-1">
							<p className="text-white">{e.product.name}</p>
							<p className="text-gray-600">{e.variant_information.name}</p>
						</div>

						<p className="text-white font-bold">
							${discountedPrice.toFixed(2)}
						</p>
					</div>
				);
			})}
		</div>
	);
}
