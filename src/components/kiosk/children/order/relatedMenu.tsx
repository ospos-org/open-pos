import { useAtomValue, useSetAtom } from "jotai";
import moment from "moment";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Order, Transaction } from "@/generated/stock/Api";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { inspectingProductAtom } from "@atoms/product";
import { inspectingTransactionAtom } from "@atoms/transaction";
import { openStockClient } from "~/query/client";

function orderType(order: Order, transaction: Transaction) {
	switch (order.order_type) {
		case "direct":
			return `${order.origin.contact.name} (${order.origin.store_code})`;
		case "pickup":
			return `${order.origin.contact.name} (${order.origin.store_code})`;
		case "quote":
			return `By ${transaction.salesperson} at ${order.origin.contact.name} (${order.origin.store_code})`;
		case "shipment": {
			const origin = `${order.origin.contact.name} (${order.origin.store_code})`;
			const destination = `${
				order.destination?.store_code !== "000"
					? order.destination?.store_code
					: order.destination?.contact.address.street
			} ${
				order.destination?.store_code !== "000"
					? order.destination?.contact.name
					: order.destination?.contact.address.street2
			}`;

			return `${origin} -> ${destination}`;
		}
		default:
			return "";
	}
}

export function RelatedOrders() {
	const setInspectingTransaction = useSetAtom(inspectingTransactionAtom);
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	const inspectingProduct = useAtomValue(inspectingProductAtom);

	const [suggestions, setSuggestions] = useState<Transaction[]>([]);

	useEffect(() => {
		if (inspectingProduct.activeProductVariant?.barcode)
			openStockClient.transaction
				.getByProductSku(inspectingProduct.activeProductVariant?.barcode)
				.then((data) => data.ok && setSuggestions(data.data));
	}, [inspectingProduct.activeProductVariant]);

	const sortedSuggestions = useMemo(
		() =>
			suggestions?.sort(
				(a, b) =>
					new Date(a.order_date).getTime() - new Date(b.order_date).getTime(),
			),
		[suggestions],
	);

	return (
		<div
			className={
				"bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto " +
				"p-6 flex flex-col h-full justify-between flex-1 gap-8"
			}
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => {
						setKioskPanel("cart");
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
				<p className="text-gray-400">Related Orders</p>
			</div>

			<div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
				{suggestions.length === 0 ? (
					<div className="flex flex-col flex-1 items-center justify-center">
						<p className="text-gray-400">
							No transactions containing this product variant
						</p>
					</div>
				) : (
					<div className="flex flex-col gap-2 text-white">
						{sortedSuggestions.map((b) => (
							<div
								key={b.id}
								className="bg-gray-700 px-4 py-4 pt-2 rounded-md gap-2 flex flex-col"
							>
								<div className="flex flex-row items-center gap-4">
									<p className="font-semibold">
										{moment(b.order_date).format("DD/MM/YY hh:ss")}
									</p>
									<p className="font-semibold">${b.order_total}</p>
									<p
										onClick={() => {
											setKioskPanel("inv-transaction");
											setInspectingTransaction({
												item: b,
												identifier: b.products[0].id,
											});
										}}
										className="bg-gray-600 px-2 rounded-md cursor-pointer"
									>
										View Details
									</p>
								</div>

								{b.products.map((k) => {
									return (
										<div
											key={k.id}
											className="bg-gray-900 px-4 py-2 rounded-md"
										>
											<div className="flex flex-row items-center gap-4 ">
												<p className="font-bold">{k.reference}</p>
												<p className="bg-gray-800 text-white text-semibold px-2 rounded-full">
													{k.order_type}
												</p>

												<p className="text-gray-400">{orderType(k, b)}</p>
											</div>

											<div>
												{k.products.map((n) => (
													<div
														key={n.id}
														className="flex flex-row items-center gap-2"
													>
														<p className="text-gray-400">{n.quantity}x</p>

														<p>{n.product_name}</p>
														<p>${n.product_cost}</p>
													</div>
												))}
											</div>
										</div>
									);
								})}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default RelatedOrders;
