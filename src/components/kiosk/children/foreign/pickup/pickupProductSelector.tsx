import { SetStateAction, atom, useAtomValue, useSetAtom } from "jotai/index";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { Dispatch, useCallback, useEffect } from "react";
import { v4 } from "uuid";

import { Store } from "@/generated/stock/Api";
import { GeneratedOrder } from "@components/kiosk/children/foreign/dispatchMenu";
import { ContextualOrder, ContextualProductPurchase } from "@utils/stockTypes";
import { getDate } from "@utils/utils";

import { openStockClient } from "~/query/client";

import { customerAtom } from "@atoms/customer";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";
import { ordersAtom } from "@atoms/transaction";
import { SelectedItem } from "@components/kiosk/children/foreign/common/generated";
import { ProductPullStore } from "@components/kiosk/children/foreign/common/productPullStore";
import { generateOrders, generateProductMap } from "@utils/dispatchAlgorithm";
import { PrimitiveAtom, useAtom } from "jotai";

interface PickupProductSelectorProps {
	generatedOrderAtom: PrimitiveAtom<GeneratedOrder[]>;
	setPageState: Dispatch<SetStateAction<"origin" | "edit">>;
	pickupStore: Store | null;
}

const selectedItemsAtom = atom<SelectedItem[]>([]);

export default function PickupProductSelector({
	generatedOrderAtom,
	setPageState,
	pickupStore,
}: PickupProductSelectorProps) {
	const [generatedOrder, setGeneratedOrder] = useAtom(generatedOrderAtom);

	const currentStore = useAtomValue(masterStateAtom);
	const customerState = useAtomValue(customerAtom);
	const orderState = useAtomValue(ordersAtom);

	const setOrderState = useSetAtom(ordersAtom);
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const setSelectedItems = useSetAtom(selectedItemsAtom);

	const fetchDistanceData = useCallback(async () => {
		if (currentStore.store_id)
			return (
				await openStockClient.helpers.distanceToStoresFromStore(
					currentStore.store_id,
				)
			).data;
	}, [currentStore]);

	useEffect(() => {
		fetchDistanceData().then((data) => {
			if (!data) return;

			const ord = generateOrders(
				generateProductMap(orderState),
				data,
				currentStore.store_id ?? "",
			);

			setGeneratedOrder(ord.assignment_sheet);
			setSelectedItems(
				ord.assignment_sheet.map((e) => {
					return {
						item_id: e.item?.id ?? "",
						store_id: e.store ?? "",
						selected: false,
					};
				}),
			);
		});
	}, [
		orderState,
		fetchDistanceData,
		currentStore,
		setGeneratedOrder,
		setSelectedItems,
	]);

	// TODO: Clean up this function, add comments.
	const continueClick = useCallback(async () => {
		if (generatedOrder.length < 1) return;

		let inverse_order: {
			store: string;
			store_code: string;
			items: ContextualProductPurchase[];
			type: "direct" | "shipment" | "pickup";
		}[] = [];

		generatedOrder.map((k) => {
			const found = inverse_order.find(
				(e) =>
					e.store === k.store &&
					e.type ===
						(k.ship
							? "pickup"
							: k.ship && k.store !== currentStore.store_id
							  ? "shipment"
							  : "direct"),
			);

			if (found && k.item) {
				inverse_order = inverse_order.map((e) =>
					e.store === k.store &&
					e.type ===
						(k.ship
							? "pickup"
							: k.ship && k.store !== currentStore.store_id
							  ? "shipment"
							  : "direct")
						? {
								...e,
								items: [...e.items, { ...k.item!, quantity: k.quantity }],
						  }
						: e,
				);
			} else if (k.item) {
				inverse_order.push({
					store: k.store,
					store_code:
						currentStore.store_lut?.length > 0
							? currentStore.store_lut?.find((b: Store) => k.store === b.id)
									?.code ?? k.store
							: k.store,
					items: [
						{
							...k.item,
							quantity: k.quantity,
						},
					],
					type: k.ship
						? "pickup"
						: k.ship && k.store !== currentStore.store_id
						  ? "shipment"
						  : "direct",
				});
			}
		});

		Promise.all(
			inverse_order.map(async (k) => {
				const data = await openStockClient.store.get(k.store);

				if (data.ok)
					return {
						id: v4(),
						destination:
							k.type === "pickup"
								? {
										store_code: pickupStore?.code,
										store_id: pickupStore?.id,
										contact: pickupStore?.contact!,
								  }
								: { code: "000", contact: customerState?.contact },
						origin: {
							store_code: k.store_code,
							store_id: k.store,
							contact: data.data.contact,
						},
						products: k.items,
						status: {
							status: {
								type: "queued",
								value: getDate(),
							},
							assigned_products: k.items.map((b) => b.id),
							timestamp: getDate(),
						},
						previous_failed_fulfillment_attempts: [],
						status_history: [],
						order_history: [],
						order_notes: orderState.flatMap((b) => b.order_notes),
						reference: `PU${customAlphabet("1234567890abcdef", 10)(8)}`,
						creation_date: getDate(),
						discount: "a|0",
						order_type: k.type,
					} as ContextualOrder;
			}),
		).then((k) => {
			const job = orderState.filter((k) => k.order_type !== "direct");
			k.map((b) => job.push(b as ContextualOrder));

			setOrderState(job);
			setKioskPanel("cart");
		});
	}, [
		currentStore,
		customerState?.contact,
		generatedOrder,
		orderState,
		pickupStore,
		setKioskPanel,
		setOrderState,
	]);

	return (
		<>
			<div className="flex-col flex gap-8 flex-1 overflow-y-scroll max-h-full pr-2">
				<div className="flex flex-1 flex-col gap-4">
					<div className="flex flex-row items-center gap-2 text-gray-400">
						<p>PRODUCTS</p>
						<hr className="border-gray-400 opacity-25 w-full flex-1" />
					</div>

					{Boolean(generatedOrder.length >= 1) && (
						<div
							className="grid items-center justify-center text-gray-300 gap-4"
							style={{ gridTemplateColumns: "25px 1fr 75px 80px" }}
						>
							<p className="font-semibold flex-1" />
							<p className="font-semibold flex-1">Product</p>
							<p className="font-semibold content-center self-center flex">
								Quantity
							</p>
							<p
								className={
									"font-semibold content-center self-center " +
									"flex text-center justify-self-center"
								}
							>
								Source
							</p>
						</div>
					)}

					{generatedOrder.length < 1 ? (
						<div className="flex items-center justify-center">
							<p className="text-gray-400 py-4">No products</p>
						</div>
					) : (
						generatedOrder.map((k) => {
							return (
								<div
									key={`PPURCH-SHIP-${k.item?.id}-${k.store}`}
									className="text-white grid items-center justify-center gap-4"
									style={{
										gridTemplateColumns: "25px 1fr 75px 80px",
									}}
								>
									<div
										onClick={() => {
											setGeneratedOrder(
												generatedOrder.map((b) =>
													b?.item?.id === k?.item?.id && b.store === k.store
														? { ...b, ship: !k.ship }
														: b,
												),
											);
										}}
										className="cursor-pointer select-none"
									>
										{k.ship ? (
											<Image
												src="/icons/check-square.svg"
												alt=""
												height={20}
												width={20}
												style={{
													filter:
														"invert(95%) sepia(100%) saturate(20%) hue-rotate(289deg) brightness(104%) contrast(106%)",
												}}
											/>
										) : (
											<Image
												src="/icons/square.svg"
												alt=""
												height={20}
												width={20}
												style={{
													filter:
														"invert(70%) sepia(11%) saturate(294%) hue-rotate(179deg) brightness(92%) contrast(87%)",
												}}
											/>
										)}
									</div>

									<div className="flex-1">
										<p className="font-semibold">
											{k.item?.product.company} {k.item?.product.name}
										</p>
										<p className="text-sm text-gray-400">
											{k.item?.variant_information.name}
										</p>
									</div>

									<div className="self-center content-center items-center justify-center flex">
										<p className="font-semibold text-white" />
										{k.quantity}
										<p className="font-semibold text-gray-400">
											/{k.item?.quantity}
										</p>
									</div>

									<ProductPullStore
										generatedOrderAtom={generatedOrderAtom}
										selectedItemsAtom={selectedItemsAtom}
										order={k}
									/>
								</div>
							);
						})
					)}
				</div>

				<div className="flex flex-1 flex-col gap-4">
					<div className="flex flex-row items-center gap-2 text-gray-400">
						<p>PICKUP DETAILS</p>
						<Image
							onClick={() => setPageState("edit")}
							src="/icons/edit-03.svg"
							alt=""
							width="16"
							height="16"
							style={{
								filter:
									"invert(65%) sepia(9%) saturate(354%) hue-rotate(179deg) brightness(99%) contrast(92%)",
							}}
						/>

						<hr className="border-gray-400 opacity-25 w-full flex-1" />
					</div>

					<div className="text-white">
						<p className="font-semibold">{customerState?.contact.name}</p>
						<p className="">{customerState?.contact.email.full}</p>
						<p className="">{customerState?.contact.mobile.number}</p>

						<br />

						<p className="text-gray-400">Pickup from:</p>
						<p className="font-semibold">
							{pickupStore?.name} ({pickupStore?.code})
						</p>
						<p className="font-semibold">
							{pickupStore?.contact.address.street}
						</p>
						<p>{pickupStore?.contact.address.street2}</p>
						<p className="text-gray-400">
							{pickupStore?.contact.address.city}{" "}
							{pickupStore?.contact.address.po_code}
						</p>
						<p className="text-gray-400">
							{pickupStore?.contact.address.country}
						</p>
					</div>
				</div>

				<div
					onClick={continueClick}
					className={`${
						generatedOrder.length >= 1
							? "bg-blue-700 cursor-pointer"
							: "bg-blue-700 cursor-not-allowed bg-opacity-10 opacity-20"
					} w-full rounded-md p-4 flex items-center justify-center`}
				>
					<p className="text-white font-semibold">Continue</p>
				</div>
			</div>
		</>
	);
}
