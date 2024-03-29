import moment from "moment";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Customer, Order, PickStatus } from "@/generated/stock/Api";
import { masterStateAtom } from "@/src/atoms/openpos";
import NotesMenu from "@components/common/notesMenu";
import { applyDiscount, findMaxDiscount } from "@utils/discountHelpers";
import { ContextualOrder } from "@utils/stockTypes";
import { getDate } from "@utils/utils";
import { PrimitiveAtom, useAtom, useAtomValue } from "jotai";
import { openStockClient } from "~/query/client";

export default function OrderView({
	orderAtom,
}: { orderAtom: PrimitiveAtom<ContextualOrder | null> }) {
	const masterState = useAtomValue(masterStateAtom);

	const [activeOrder, setActiveOrder] = useAtom(orderAtom);
	const [customerInfo, setCustomerInfo] = useState<Customer | null>(null);

	useEffect(() => {
		if (activeOrder?.reference)
			openStockClient.transaction
				.getByName(activeOrder?.reference)
				.then((data) => {
					if (data.ok)
						openStockClient.customer
							.get(data.data[0].customer.customer_id)
							.then((customerData) => {
								if (customerData.ok) setCustomerInfo(customerData.data);
							});
				});
	}, [activeOrder]);

	const [completedPercentage, setCompletedPercentage] = useState(0);

	useEffect(() => {
		let total_products = 0;
		let completed = 0;

		activeOrder?.products.map((v) => {
			total_products += v.quantity;

			v?.instances?.map((k) => {
				if (k.fulfillment_status?.pick_status === "Picked") {
					completed += 1;
				}
			});
		});

		setCompletedPercentage((completed / total_products) * 100);
	}, [activeOrder?.products]);

	return (
		<div className="flex flex-col gap-8">
			<div className="flex flex-row items-center justify-between gap-4">
				<div className="flex flex-row items-center justify-between w-full">
					<div className="flex flex-col">
						<p className="text-gray-300 font-semibold">{customerInfo?.name}</p>
						<p className="text-lg font-semibold text-white">
							{activeOrder?.reference} - {activeOrder?.order_type}
						</p>
					</div>
				</div>

				<div className="bg-gray-800 rounded-md p-1">
					{activeOrder?.order_type === "pickup" ? (
						<Image
							className=""
							height={40}
							width={40}
							src="/icons/building-02.svg"
							alt=""
							style={{
								filter:
									"brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)",
							}}
						/>
					) : (
						<Image
							className=""
							height={40}
							width={40}
							src="/icons/globe-05.svg"
							alt=""
							style={{
								filter:
									"brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)",
							}}
						/>
					)}
				</div>

				<div className="flex flex-col items-center justify-center text-white">
					<p className="font-bold">{completedPercentage.toFixed(2)}%</p>
					<p className="text-sm opacity-50 uppercase font-bold">Fulfilled</p>
				</div>
			</div>

			<div className="flex flex-row items-center text-white justify-between bg-gray-800 p-2 rounded-lg">
				{/* Fulfill / Partially / Greyed Out Button */}

				{
					//@ts-expect-error Using to check status of in-object defined state
					completedPercentage === 0 ||
					activeOrder.status.status.InStore ||
					activeOrder.status.status.Fulfilled ? (
						<div className="bg-green-600 cursor-not-allowed opacity-25 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 select-none">
							<p>
								{activeOrder?.order_type === "pickup"
									? "Mark Ready for Pickup"
									: "Send to Packing"}
							</p>
							<Image
								className=""
								height={15}
								width={15}
								src="/icons/check-square.svg"
								alt=""
								style={{
									filter:
										"brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)",
								}}
							/>
						</div>
					) : completedPercentage === 100 ? (
						<div
							onClick={async () => {
								if (
									activeOrder?.order_type !== "shipment" ||
									(activeOrder.destination?.store_id !==
										activeOrder?.origin?.store_id &&
										activeOrder.destination?.store_id !== masterState?.store_id)
								) {
									if (activeOrder?.reference) {
										const data =
											await openStockClient.transaction.updateOrderStatus(
												activeOrder.reference,
												{
													type: "instore",
													value: getDate(),
												},
											);

										if (data.ok) {
											const foundValue = data.data.products.find(
												(order) => order.reference === activeOrder.reference,
											);

											// TODO: fix this type fulfillment
											// @ts-expect-error
											if (foundValue) setActiveOrder(foundValue);
										}
									}
								} else {
									console.log("CHANGE TO SCREEN TO SHOW PACKING");
								}
							}}
							className="bg-green-600 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer"
						>
							<p>
								{activeOrder?.order_type !== "shipment" ||
								(activeOrder.destination?.store_id !==
									activeOrder?.origin?.store_id &&
									activeOrder.destination?.store_id !== masterState?.store_id)
									? "Mark Ready for Pickup"
									: "Send to Packing"}
							</p>
							<Image
								className=""
								height={15}
								width={15}
								src="/icons/check-square.svg"
								alt=""
								style={{
									filter:
										"brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)",
								}}
							/>
						</div>
					) : (
						<div className="bg-green-600 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer">
							<p>
								{activeOrder?.order_type === "pickup"
									? "Mark Partial as Ready for Pickup"
									: "Continue as Partially Complete"}
							</p>
							<Image
								className=""
								height={15}
								width={15}
								src="/icons/check-square.svg"
								alt=""
								style={{
									filter:
										"brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(36deg) brightness(106%) contrast(102%)",
								}}
							/>
						</div>
					)
				}

				{/* Cancel Order */}
				<div
					onClick={() => {}}
					className="bg-red-600 opacity-60 hover:opacity-100 transition-all rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer"
				>
					<p>Cancel Order</p>
				</div>
			</div>

			<div className="flex flex-col">
				{activeOrder?.status_history.map((k, indx) => {
					const type = k.item.status.type;

					return (
						<div key={`${k.timestamp} ${k.item} ${k.reason}`}>
							{indx === 0 ? (
								<div className="h-4 w-[3px] rounded-sm rounded-b-none bg-gray-400 ml-5" />
							) : (
								<div className="h-4 w-[3px] bg-gray-400 ml-5" />
							)}

							<div className="flex flex-row items-center gap-4">
								<div
									className={`${
										type === "queued"
											? "bg-gray-600"
											: type === "processing"
											  ? "bg-yellow-600"
											  : type === "transit" || type === "instore"
												  ? "bg-blue-600"
												  : type === "failed"
													  ? "bg-red-600"
													  : "bg-green-600"
									} h-11 w-11 flex items-center justify-center rounded-full`}
								>
									{(() => {
										switch (type) {
											case "queued":
												return (
													<div>
														<Image
															src="/icons/clock.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											case "transit":
												return (
													<div>
														<Image
															src="/icons/truck-01.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											case "processing":
												return (
													<div>
														<Image
															src="/icons/loading-01.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											case "fulfilled":
												return (
													<div>
														<Image
															src="/icons/check-verified-02.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											case "instore":
												return (
													<div>
														<Image
															src="/icons/building-02.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											case "failed":
												return (
													<div>
														<Image
															src="/icons/x-circle.svg"
															alt=""
															height={22}
															width={22}
															style={{
																filter:
																	"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
															}}
														/>
													</div>
												);
											default:
												return <div />;
										}
									})()}
								</div>

								<div className="flex flex-row items-center justify-between flex-1">
									<div className="flex flex-col">
										<div className="flex flex-row items-center gap-2">
											<p className="text-white font-semibold">{type}</p>
											<p className="text-gray-400 text-sm">
												{moment(k.timestamp).format("DD/MM/YY LT")}
											</p>
										</div>
										<p className="text-gray-400 font-semibold text-sm">
											{k.reason}
										</p>
									</div>

									{type === "transit" ? (
										<Link
											target="_blank"
											rel="noopener noreferrer"
											className="bg-gray-800 rounded-md px-2 py-[0.125rem] flex flex-row items-center gap-2 cursor-pointer"
											href={
												k.item.status.value?.query_url +
												k.item.status.value?.tracking_code
											}
										>
											<p className="text-white">Track</p>
											<Image
												src="/icons/arrow-narrow-right.svg"
												alt="Redirect arrow"
												width={15}
												height={15}
												style={{
													filter:
														"invert(99%) sepia(100%) saturate(0%) hue-rotate(124deg) brightness(104%) contrast(101%)",
												}}
											/>
										</Link>
									) : (
										<></>
									)}
								</div>
							</div>

							{indx !== activeOrder?.status_history.length - 1 ? (
								<div className="h-4 w-[3px] bg-gray-400 ml-5" />
							) : (
								<></>
							)}
						</div>
					);
				})}
			</div>

			<div>
				<p className="text-gray-400">DESTINATION</p>
				<p className="text-white font-bold">
					{activeOrder?.destination?.contact.name}
				</p>
				<p className="text-white">
					{activeOrder?.destination?.contact.address.street}
				</p>
				<p className="text-gray-400">
					{activeOrder?.destination?.contact.address.street2}{" "}
					{activeOrder?.destination?.contact.address.city}{" "}
					{activeOrder?.destination?.contact.address.po_code}
				</p>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-gray-400">PRODUCTS</p>

				{activeOrder?.products.map((k) => {
					return (
						<div
							key={`${k.id} ${k.product_code} ${k.quantity} ${k.product_variant_name}`}
							className="gap-8 px-8 items-center"
							style={{ display: "grid", gridTemplateColumns: "25px 1fr 75px" }}
						>
							<p className="text-gray-400">{k.quantity}</p>

							<div className="flex flex-col items-start">
								<p className="text-white font-semibold">{k.product_name}</p>
								<p className="text-gray-400">{k.product_code}</p>
							</div>

							{/* {JSON.stringify(k.discount)} */}
							<p className="text-white font-semibold">
								$
								{applyDiscount(
									k.product_cost,
									findMaxDiscount(k.discount, k.product_cost, false)[0].value,
								).toFixed(2)}
							</p>
						</div>
					);
				})}

				<hr className=" border-gray-600" />

				<div
					className="gap-8 px-8 items-center"
					style={{ display: "grid", gridTemplateColumns: "25px 1fr 75px" }}
				>
					<p className="text-gray-400" />
					<p className="text-white font-semibold">Total</p>
					{/* {JSON.stringify(k.discount)} */}
					<p className="text-white font-semibold">
						$
						{activeOrder?.products
							.reduce(
								(prev, k) =>
									prev +
									applyDiscount(
										k.product_cost * k.quantity,
										findMaxDiscount(k.discount, k.product_cost, false)[0].value,
									),
								0,
							)
							.toFixed(2)}
					</p>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-gray-400">NOTES</p>

				<NotesMenu
					autoFocus={false}
					callback={() => {
						// TODO: Handle adding notes to an order.
					}}
				/>
			</div>
		</div>
	);
}
