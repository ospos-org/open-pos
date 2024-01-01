import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";

import { customerAtom } from "@atoms/customer";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";
import { ordersAtom } from "@atoms/transaction";

import { generateOrders, generateProductMap } from "@utils/dispatchAlgorithm";
import { ContextualProductPurchase } from "@utils/stockTypes";

import { Customer, HttpResponse, Stock } from "@/generated/stock/Api";
import { openStockClient } from "~/query/client";

import DispatchProductSelector from "@components/kiosk/children/foreign/dispatch/dispatchProductSelector";
import { DispatchShippingRate } from "@components/kiosk/children/foreign/dispatch/dispatchShippingRate";
import EditDispatch from "@components/kiosk/children/foreign/dispatch/editDispatch";
import { GeneratedOrder } from "./common/generated";

type DispatchPage = "origin" | "rate" | "edit";

const generatedOrderAtom = atom<GeneratedOrder[]>([]);

export function DispatchMenu() {
	const [orderState, setOrderState] = useAtom(ordersAtom);
	const [customerState, setCustomerState] = useAtom(customerAtom);

	const [pageState, setPageState] = useState<DispatchPage>("origin");
	const [generatedOrder, setGeneratedOrder] = useAtom(generatedOrderAtom);

	const currentStore = useAtomValue(masterStateAtom);
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	const fetchDistanceData = useCallback(async () => {
		if (customerState?.id)
			return (await openStockClient.helpers.distanceToStores(customerState?.id))
				.data;
	}, [customerState?.id]);

	const onEditComplete = useCallback(
		(data: HttpResponse<Customer, any>) => {
			if (data.ok) {
				setCustomerState(data.data);

				fetchDistanceData().then((data) => {
					if (data) {
						const ord = generateOrders(
							generateProductMap(orderState),
							data,
							currentStore.store_id ?? "",
						);

						setGeneratedOrder(ord.assignment_sheet);
					}
				});

				setPageState("origin");
			}
		},
		[
			currentStore.store_id,
			fetchDistanceData,
			orderState,
			setCustomerState,
			setGeneratedOrder,
		],
	);

	const dispatchPage = useMemo(() => {
		if (pageState === "origin")
			return (
				<DispatchProductSelector
					generatedOrderAtom={generatedOrderAtom}
					setPageState={setPageState}
				/>
			);
		if (pageState === "rate")
			return <DispatchShippingRate generatedOrder={generatedOrder} />;

		return <EditDispatch callback={onEditComplete} />;
	}, [generatedOrder, onEditComplete, pageState]);

	return (
		<div
			className={
				"bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto p-6 " +
				"flex flex-col h-full justify-between flex-1 gap-8"
			}
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => {
						if (pageState !== "origin") setPageState("origin");
						else setKioskPanel("cart");
					}}
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
				<p className="text-gray-400">Ship Order to Customer</p>
			</div>

			<div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
				{dispatchPage}
			</div>
		</div>
	);
}

export default DispatchMenu;
export type { GeneratedOrder };
