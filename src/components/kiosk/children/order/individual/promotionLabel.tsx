import { parseDiscount } from "@/src/utils/discountHelpers";
import { ContextualOrder } from "@utils/stockTypes";

interface PromotionLabelProps {
	currentOrder: ContextualOrder;
}

export function PromotionLabel({ currentOrder }: PromotionLabelProps) {
	if (currentOrder.discount.endsWith("|0")) return <></>;

	return (
		<div className="flex flex-row items-center gap-1">
			<div className="bg-blue-600 h-5 w-5 rounded-full flex items-center justify-center text-xs text-white">
				$
			</div>

			<div />

			<p className="text-white font-bold">
				{parseDiscount(currentOrder.discount)}
			</p>
			<p className="text-white">off this cart</p>
		</div>
	);
}
