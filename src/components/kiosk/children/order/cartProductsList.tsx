import { useAtomValue } from "jotai";

import { ordersAtom } from "@atoms/transaction";

import { useMemo } from "react";
import { ChildPerOrder } from "./childPerOrder";

export function CartProductsList() {
	const orderState = useAtomValue(ordersAtom);

	const productQuantity = useMemo(() => {
		return orderState.reduce(
			(p, c) => p + c.products.reduce((prev, curr) => prev + curr.quantity, 0),
			0,
		);
	}, [orderState]);

	return (
		<div className="flex flex-col flex-1 h-full gap-4 overflow-auto max-h-full py-2">
			{productQuantity <= 0 ? (
				<div className="flex flex-col items-center w-full">
					<p className="text-sm text-gray-400 py-4 select-none">
						No products in cart
					</p>
				</div>
			) : (
				<ChildPerOrder />
			)}
		</div>
	);
}
