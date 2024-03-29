import { PrimitiveAtom, useAtomValue } from "jotai";

import { ContextualOrder } from "@utils/stockTypes";

import { ChildPerProduct } from "./childPerProduct";
import { OrderTitle } from "./orderTitle";
import { PromotionLabel } from "./promotionLabel";

interface OrderElementProps {
	orderAtom: PrimitiveAtom<ContextualOrder>;
	index: number;
}

export function OrderElement({ orderAtom, index }: OrderElementProps) {
	const currentOrder = useAtomValue(orderAtom);

	return (
		<div key={currentOrder.id} className="flex flex-col gap-4">
			<OrderTitle currentOrder={currentOrder} index={index} />
			<PromotionLabel currentOrder={currentOrder} />
			<ChildPerProduct currentOrder={currentOrder} />
		</div>
	);
}
