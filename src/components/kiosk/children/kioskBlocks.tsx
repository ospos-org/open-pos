import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";

import { customerAtom } from "@atoms/customer";

import {
	activeDiscountAtom,
	kioskPanelLogAtom,
	parkSaleAtom,
} from "@/src/atoms/kiosk";
import { searchResultsAtom, searchTypeHandlerAtom } from "@/src/atoms/search";
import { ordersAtom } from "@/src/atoms/transaction";
import { useResetAtom } from "jotai/utils";
import { BLOCK_SIZE } from "../kioskMenu";

export function KioskBlocks() {
	const clearSearchResults = useResetAtom(searchResultsAtom);

	const orderState = useAtomValue(ordersAtom);

	const setSearchType = useSetAtom(searchTypeHandlerAtom);
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const setDiscount = useSetAtom(activeDiscountAtom);
	const parkSale = useSetAtom(parkSaleAtom);

	const [customerState, setCustomerState] = useAtom(customerAtom);

	return (
		<div className="flex flex-1 flex-row flex-wrap sm:gap-4 gap-1">
			{/* Tiles */}
			{customerState ? (
				<div
					className={`flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
					onClick={() => {
						setCustomerState(null);
					}}
				>
					<Image
						className="select-none"
						width="25"
						height="25"
						src="/icons/user-01.svg"
						style={{
							filter:
								"invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)",
						}}
						alt={""}
					/>
					<p className="font-medium select-none">Remove Customer</p>
				</div>
			) : (
				<div
					className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
					onClick={() => {
						clearSearchResults();
						setSearchType("customers");
					}}
				>
					<Image
						className="select-none"
						width="25"
						height="25"
						src="/icons/user-01.svg"
						style={{
							filter:
								"invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)",
						}}
						alt={""}
					/>
					<p className="font-medium select-none">Select Customer</p>
				</div>
			)}

			<div
				onClick={() => {
					setKioskPanel("discount");
					setDiscount({
						type: "absolute",
						for: "cart",
						orderId: "",
						source: "user",
						product: {
							barcode: "CART",
							marginal_price: orderState.reduce(
								(p, c) =>
									p +
									c.products?.reduce(
										(prev, curr) =>
											prev +
											curr.quantity * curr.variant_information.marginal_price,
										0,
									),
								0,
							),
							retail_price: orderState.reduce(
								(p, c) =>
									p +
									c.products?.reduce(
										(prev, curr) =>
											prev +
											curr.quantity * curr.variant_information.retail_price,
										0,
									),
								0,
							),
						},
						value: 0,
						exclusive: false,
					});
				}}
				className={`flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
			>
				<Image
					className="select-none"
					width="25"
					height="25"
					src="/icons/sale-03.svg"
					style={{
						filter:
							"invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)",
					}}
					alt={""}
				/>
				<p className="font-medium select-none">Add Cart Discount</p>
			</div>

			<div
				onClick={() => {
					setKioskPanel("ship-to-customer");
				}}
				className={`flex flex-col justify-between gap-8  ${
					customerState ? "bg-[#243a4e]" : "bg-[#101921]"
				} backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
			>
				<Image
					className="select-none"
					width="25"
					height="25"
					src="/icons/globe-05.svg"
					style={{
						filter: customerState
							? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)"
							: "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)",
					}}
					alt={""}
				/>
				<p
					className={`select-none ${
						customerState ? "text-white" : "text-gray-500"
					} font-medium`}
				>
					Ship to Customer
				</p>
			</div>

			<div
				onClick={() => setKioskPanel("note")}
				className={`flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
			>
				<Image
					className="select-none"
					width="25"
					height="25"
					src="/icons/file-plus-02.svg"
					style={{
						filter:
							"invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)",
					}}
					alt={""}
				/>
				<p className="font-medium select-none">Add Note</p>
			</div>

			<div
				onClick={() => {
					setKioskPanel("pickup-from-store");
				}}
				className={`flex flex-col justify-between gap-8 ${
					customerState ? "bg-[#243a4e]" : "bg-[#101921]"
				}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit cursor-pointer`}
			>
				<Image
					className="select-none"
					width="25"
					height="25"
					src="/icons/building-02.svg"
					style={{
						filter: customerState
							? "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)"
							: "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)",
					}}
					alt={""}
				/>
				<p
					className={`select-none ${
						customerState ? "text-white" : "text-gray-500"
					} font-medium`}
				>
					Pickup from Store
				</p>
			</div>

			<div
				onClick={() => {
					parkSale();
				}}
				className={`flex flex-col justify-between gap-8 ${
					(orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1
						? "bg-[#2f4038] text-white"
						: "bg-[#101921] text-gray-500"
				}  backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md  max-w-fit cursor-pointer`}
			>
				<Image
					className="select-none"
					width="25"
					height="25"
					src="/icons/save-01.svg"
					style={{
						filter:
							(orderState?.reduce((p, c) => p + c.products.length, 0) ?? 0) >= 1
								? "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)"
								: "invert(46%) sepia(7%) saturate(675%) hue-rotate(182deg) brightness(94%) contrast(93%)",
					}}
					alt={""}
				/>
				<p className="font-medium select-none">Save Cart</p>
			</div>
		</div>
	);
}
