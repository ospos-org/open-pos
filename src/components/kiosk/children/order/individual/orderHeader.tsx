import OrderTypeIcon from "@components/kiosk/children/order/individual/orderTypeIcon";
import { ContextualOrder } from "@utils/stockTypes";

interface OrderHeaderProps {
	currentOrder: ContextualOrder;
}

export default function OrderHeader({ currentOrder }: OrderHeaderProps) {
	return (
		<div className="flex flex-row items-center gap-2 select-none">
			<OrderTypeIcon currentOrder={currentOrder} />

			<div className="text-white font-semibold flex flex-row items-center gap-2">
				{currentOrder.order_type == "pickup"
					? currentOrder.destination?.contact?.name
					: currentOrder.order_type == "direct"
					  ? "Instore Purchase"
					  : currentOrder?.origin?.contact?.name}

				{Boolean(
					currentOrder.order_type !== "pickup" &&
						currentOrder.order_type !== "direct" &&
						currentOrder.order_type !== "quote",
				) && (
					<p className="text-gray-400">
						-&gt; {currentOrder.destination?.contact.address.street}
					</p>
				)}
			</div>
		</div>
	);
}
