import { ContextualOrder } from "@utils/stockTypes";
import Image from "next/image";
import { useMemo } from "react";

const FILTER_ORDER =
	"invert(100%) sepia(100%) saturate(0%) hue-rotate(299deg) brightness(102%) contrast(102%)";

interface OrderIconProps {
	source: string;
}

interface OrderTypeIconProps {
	currentOrder: ContextualOrder;
}

function OrderIcon({ source }: OrderIconProps) {
	return (
		<Image
			src={source}
			alt=""
			height={20}
			width={20}
			style={{ filter: FILTER_ORDER }}
		/>
	);
}

export default function OrderTypeIcon({ currentOrder }: OrderTypeIconProps) {
	const orderSource = useMemo(() => {
		if (currentOrder.order_type === "shipment") return "/icons/globe-05.svg";
		if (currentOrder.order_type === "pickup") return "/icons/building-02.svg";
		if (currentOrder.order_type === "quote") return "/icons/globe-05.svg";
		return "/icons/shopping-bag-01-filled.svg";
	}, [currentOrder.order_type]);

	return <OrderIcon source={orderSource} />;
}
