import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { v4 } from "uuid";

import { aCustomerActiveAtom } from "@atoms/customer";
import { ActiveDiscountApplication, kioskPanelLogAtom } from "@atoms/kiosk";
import { ordersAtom } from "@atoms/transaction";
import { findMaxDiscount, isEquivalentDiscount } from "@utils/discountHelpers";

import { totalProductQuantityAtom } from "@atoms/cart";
import { useDiscountHandler } from "@components/kiosk/children/discount/discount";
import {
	ContextualDiscountValue,
	ContextualProductPurchase,
} from "@utils/stockTypes";
import { useCallback } from "react";
import DiscountMenu from "./discountMenu";

export function DiscountScreen() {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	const discountHandler = useDiscountHandler();

	const applyUpdate = useCallback(
		(dcnt: ActiveDiscountApplication) => {
			setKioskPanel("cart");
			discountHandler.applyOrderUpdate(dcnt);
		},
		[discountHandler, setKioskPanel],
	);

	return (
		<div
			className="bg-gray-900 p-6 flex flex-col h-full justify-between flex-1"
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => setKioskPanel("cart")}
					className="flex flex-row items-center gap-2"
				>
					<Image
						src="/icons/arrow-narrow-left.svg"
						height={20}
						width={20}
						alt=""
					/>
					<p className="text-gray-400">Back</p>
				</div>
				<p className="text-gray-400">Select Discount</p>
			</div>

			<DiscountMenu callback={applyUpdate} />
		</div>
	);
}
