import { Order, ProductPurchase } from "@/generated/stock/Api";
import { transactionViewState } from "@atoms/transaction";
import { applyDiscount, fromDbDiscount } from "@utils/discountHelpers";
import { useAtom } from "jotai";
import { useAtomValue } from "jotai/index";
import Image from "next/image";
import { useCallback, useState } from "react";

const FILTER_DESELECTED =
	"invert(95%) sepia(100%) saturate(20%) hue-rotate(289deg) brightness(104%) contrast(106%)";

const FILTER_SELECTED =
	"invert(70%) sepia(11%) saturate(294%) hue-rotate(179deg) brightness(92%) contrast(87%)";

export default function TransactionProductList() {
	const activeTransaction = useAtomValue(
		transactionViewState.activeTransaction,
	);
	const [selectedItems, setSelectedItems] = useAtom(
		transactionViewState.selectedItems,
	);

	const isMatchingItem = useCallback(
		(thisPurchase: ProductPurchase) => {
			return selectedItems.findIndex(
				(elem) => elem.product_id === thisPurchase.id,
			);
		},
		[selectedItems],
	);

	const selectProduct = useCallback(
		(thisPurchase: ProductPurchase) => {
			if (isMatchingItem(thisPurchase) !== -1) {
				setSelectedItems((selectedBefore) =>
					selectedBefore.filter(
						(element) => element.product_id !== thisPurchase.id,
					),
				);
			} else {
				setSelectedItems([
					...selectedItems,
					{
						product_id: thisPurchase.id,
						quantity: thisPurchase.quantity,
					},
				]);
			}
		},
		[isMatchingItem, selectedItems, setSelectedItems],
	);

	const modifyQuantity = useCallback(
		(method: "SUBTRACT" | "ADD", thisPurchase: ProductPurchase) => {
			if (isMatchingItem(thisPurchase) === -1) {
				setSelectedItems([
					...selectedItems,
					{
						product_id: thisPurchase.id,
						quantity: thisPurchase.quantity,
					},
				]);
			}

			const mapValues = selectedItems.map((element) => {
				if (element.product_id === thisPurchase.id)
					return {
						...element,
						quantity:
							method === "SUBTRACT"
								? Math.max(element.quantity - 1, 1)
								: Math.min(element.quantity + 1, thisPurchase.quantity),
					};

				return element;
			});

			setSelectedItems(mapValues);
		},
		[isMatchingItem, selectedItems, setSelectedItems],
	);

	return (
		<div className="flex flex-col gap-2">
			<p className="text-gray-400">PRODUCTS</p>

			{activeTransaction?.products.map((k) => {
				const matchingItem = isMatchingItem(k);

				return (
					<div
						key={`${k.id} ${k.product_code} ${k.quantity} ${k.product_variant_name}`}
						className="gap-8 px-2 items-center"
						style={{ display: "grid", gridTemplateColumns: "65px 1fr 75px" }}
					>
						<div className="flex flex-row items-center gap-2 w-fit">
							<div
								onClick={() => selectProduct(k)}
								className={`flex items-center justify-center h-[20px] w-[20px] cursor-pointer`}
							>
								{matchingItem !== -1 ? (
									<Image
										src="/icons/check-square.svg"
										alt=""
										height={20}
										width={20}
										style={{ filter: FILTER_DESELECTED }}
									/>
								) : (
									<Image
										src="/icons/square.svg"
										alt=""
										height={20}
										width={20}
										style={{ filter: FILTER_SELECTED }}
									/>
								)}
							</div>

							{/* Quantity Selector (+/-) */}
							<div
								className={`
                                    flex flex-row p-0 rounded-sm 
                                    ${
																			matchingItem === -1
																				? "bg-gray-600"
																				: "bg-gray-100"
																		}
                                `}
							>
								<p
									className="px-1 cursor-pointer"
									onClick={() => modifyQuantity("SUBTRACT", k)}
								>
									-
								</p>

								<p className="text-gray-200 px-2 bg-gray-800">
									{matchingItem === -1
										? k.quantity
										: selectedItems[matchingItem].quantity}
								</p>

								<p
									className="px-1 cursor-pointer"
									onClick={() => modifyQuantity("ADD", k)}
								>
									+
								</p>
							</div>
						</div>

						<div className="flex flex-col items-start">
							<p className="text-white font-semibold text-sm">
								{k.product_name}
							</p>
							<p className="text-gray-400 text-sm">{k.product_code}</p>
						</div>

						<div className="flex flex-col items-center justify-center">
							<p className="text-white font-semibold text-sm">
								$
								{applyDiscount(
									k.product_cost,
									fromDbDiscount(k.discount),
								).toFixed(2)}
							</p>
							<p className="text-gray-500 text-sm">(${k.product_cost})</p>
						</div>
					</div>
				);
			})}

			<hr className=" border-gray-600" />

			<div
				className="gap-8 px-2 items-center"
				style={{ display: "grid", gridTemplateColumns: "65px 1fr 75px" }}
			>
				<p className="text-gray-400" />
				<p className="text-white font-semibold">Total</p>
				<p className="text-white font-semibold">
					$
					{activeTransaction?.products
						.reduce(
							(prev, k) =>
								prev +
								applyDiscount(
									k.product_cost * k.quantity,
									fromDbDiscount(k.discount),
								),
							0,
						)
						.toFixed(2)}
				</p>
			</div>
		</div>
	);
}
