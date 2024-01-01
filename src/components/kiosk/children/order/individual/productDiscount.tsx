import { activeDiscountAtom, kioskPanelLogAtom } from "@/src/atoms/kiosk";
import { findMaxDiscount, stringValueToObj } from "@/src/utils/discountHelpers";
import { ContextualProductPurchase } from "@utils/stockTypes";
import { useSetAtom } from "jotai";
import Image from "next/image";
import { useCallback } from "react";

interface ProductDiscountProps {
	product: ContextualProductPurchase;
}

const GRAY_FILTER =
	"invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
const WHITE_FILTER =
	"invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";

export function ProductDiscount({ product }: ProductDiscountProps) {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const setDiscount = useSetAtom(activeDiscountAtom);

	const discountClicked = useCallback(() => {
		setKioskPanel("discount");
		setDiscount({
			...stringValueToObj(
				findMaxDiscount(product.discount, product.product_cost, false)[0].value,
			),
			product: product.variant_information,
			for: "product",
			exclusive: false,
			orderId: "",
			source: "user",
		});
	}, []);

	return (
		<div className="flex flex-row items-center gap-2">
			<Image
				className="select-none rounded-sm hover:cursor-pointer"
				style={{ filter: GRAY_FILTER }}
				onClick={discountClicked}
				height={20}
				width={20}
				alt="Discount"
				src="/icons/sale-03.svg"
				onMouseOver={(e) => {
					e.currentTarget.style.filter = WHITE_FILTER;
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.filter = GRAY_FILTER;
				}}
			/>
		</div>
	);
}
