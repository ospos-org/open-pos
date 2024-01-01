import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { isEqual } from "lodash";
import { customAlphabet } from "nanoid";
import Image from "next/image";
import { v4 } from "uuid";

import { ordersAtom } from "@/src/atoms/transaction";
import { addToCartAtom, kioskPanelLogAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";
import { inspectingProductAtom } from "@atoms/product";
import { BLOCK_SIZE } from "@components/kiosk/kioskMenu";
import { useWindowSize } from "@hooks/useWindowSize";
import {
	applyDiscount,
	fromDbDiscount,
	isValidVariant,
} from "@utils/discountHelpers";
import { StrictVariantCategory } from "@utils/stockTypes";
import { getDate, sortOrders } from "@utils/utils";

import { OrderType } from "@/generated/stock/Api";
import PromotionList from "../../promotion/promotionList";

export function ExpandedProduct() {
	const currentStore = useAtomValue(masterStateAtom);

	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const addToCart = useSetAtom(addToCartAtom);

	const [inspectingProduct, setInspectingProduct] = useAtom(
		inspectingProductAtom,
	);
	const [orderState, setOrderState] = useAtom(ordersAtom);

	const windowSize = useWindowSize();

	if (!inspectingProduct) return <></>;

	return (
		<div className="p-4 text-white flex flex-col gap-8 bg-opacity-50 rounded-sm">
			<div className="flex flex-row items-start gap-4">
				<div className="flex flex-col md:flex-row items-start h-full flex-1 gap-2">
					<div className="pr-4">
						<Image
							src={
								inspectingProduct.activeProductVariant?.images?.[0] &&
								inspectingProduct.activeProductVariant?.images?.[0] !== ""
									? inspectingProduct.activeProductVariant?.images?.[0]
									: inspectingProduct.activeProduct?.images?.[0] ?? ""
							}
							className="rounded-md"
							height={150}
							width={150}
							alt={inspectingProduct.activeProduct?.name ?? ""}
						/>
					</div>

					<div className="flex flex-col flex-1">
						<h2 className="text-xl font-medium">
							{inspectingProduct.activeProduct?.name}
						</h2>
						<p className="text-gray-400">
							{inspectingProduct.activeProduct?.company}
						</p>
						<br />

						<div className="flex 2xl:flex-col md:flex-row flex-col justify-between gap-4 w-full flex-1">
							<div className="flex flex-col 2xl:flex-row 2xl:gap-4 2xl:items-center">
								<div className="flex flex-row items-center gap-4">
									<p className="text-gray-400">SKU:</p>
									<p>{inspectingProduct.activeProduct?.sku}</p>
								</div>
								<div className="flex flex-row items-center gap-4">
									<p className="text-gray-400">BAR:</p>
									<p>{inspectingProduct.activeProductVariant?.barcode}</p>
								</div>
								<div className="flex flex-row items-center gap-4">
									<p className="text-gray-400">LOP:</p>
									<p>
										$
										{(inspectingProduct.activeProductVariant
											? applyDiscount(
													inspectingProduct.activeProductVariant?.retail_price *
														1.15 ?? 0,
													fromDbDiscount(
														inspectingProduct.activeProductVariant
															?.loyalty_discount,
													),
											  )
											: 0.0
										).toFixed(2)}
									</p>
								</div>
							</div>

							<div>
								<div className="flex flex-col items-start md:items-end 2xl:flex-row 2xl:items-center gap-2">
									{(inspectingProduct.activeProductVariant?.stock.find(
										(e) => e.store.store_id === currentStore.store_id,
									)?.quantity?.quantity_sellable ?? 0) <= 0 ? (
										<p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											Out of stock
										</p>
									) : (
										<p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											In stock
										</p>
									)}

									{(inspectingProduct.activeProductVariant?.stock.reduce(
										(p, c) =>
											p + c.store.store_id !== currentStore.store_id
												? c.quantity.quantity_sellable
												: 0,
										0,
									) ?? 0) <= 0 ? (
										<p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											Cannot ship
										</p>
									) : (
										<p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											Available to ship
										</p>
									)}

									{inspectingProduct.activeProductVariant?.stock_information
										.discontinued ? (
										<p className="text-red-200 bg-red-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											Discontinued
										</p>
									) : (
										<></>
									)}

									{inspectingProduct.activeProductVariant?.stock_information
										.back_order ? (
										<p className="text-green-200 bg-green-800 bg-opacity-40 px-4 w-fit h-fit rounded-full">
											Back Order
										</p>
									) : (
										<></>
									)}
								</div>
							</div>
						</div>

						{/* <p className="text-sm text-gray-300 truncate max-w-4">{activeProduct.description.substring(0, 150)+"..."}</p> */}
					</div>

					<div className="hidden 2xl:flex self-center flex-row items-center gap-4">
						<div
							className={`select-none cursor-pointer flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
							onClick={() => {
								if (inspectingProduct.activeProductVariant) {
									let cOs = orderState.find((e) => e.order_type === "direct");

									if (!cOs?.products) {
										const new_pdt_list = addToCart([]);

										cOs = {
											id: v4(),
											destination: null,
											origin: {
												store_code: currentStore.store_code,
												store_id: currentStore.store_id ?? "",
												contact: currentStore.store_contact,
											},
											products: new_pdt_list,
											status: {
												status: {
													type: "queued",
													value: getDate(),
												},
												assigned_products: [],
												timestamp: getDate(),
											},
											previous_failed_fulfillment_attempts: [],
											status_history: [],
											order_history: [],
											order_notes: orderState.flatMap((b) => b.order_notes),
											reference: `RF${customAlphabet(
												"1234567890abcdef",
												10,
											)(8)}`,
											creation_date: getDate(),
											discount: "a|0",
											order_type: OrderType.Direct,
										};

										setOrderState([...sortOrders([...orderState, cOs])]);
									} else {
										const new_pdt_list = addToCart(cOs.products);
										const new_order_state = orderState.map((e) =>
											e.id === cOs?.id ? { ...cOs, products: new_pdt_list } : e,
										);

										setOrderState(sortOrders(new_order_state));
									}
								}
							}}
						>
							<Image
								width="25"
								height="25"
								src="/icons/plus-lge.svg"
								style={{
									filter:
										"invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)",
								}}
								alt={""}
							/>
							<p className="font-medium">Add to cart</p>
						</div>

						<div
							className={`select-none flex flex-col cursor-pointer justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
						>
							<Image
								width="25"
								height="25"
								src="/icons/search-sm.svg"
								style={{
									filter:
										"invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)",
								}}
								alt={""}
							/>
							<p className="font-medium">Related Orders</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex 2xl:flex-row flex-col-reverse items-start gap-8">
				<div className="flex flex-col gap-8 xl:max-w-[550px] w-full">
					<PromotionList
						promotions={inspectingProduct.activeProductPromotions}
					/>

					<div className="flex flex-col gap-4 flex-wrap">
						{inspectingProduct?.activeProduct?.variant_groups.map((e) => {
							return (
								<div className="flex flex-col gap-2" key={e.category}>
									<p className="text-sm text-gray-400">
										{e.category.toLocaleUpperCase()}
									</p>
									<div className="flex flex-row items-center gap-2 select-none flex-wrap">
										{e.variants.map((k) => {
											const match = inspectingProduct.activeVariant?.find(
												(o) => o.variant.variant_code === k.variant_code,
											);

											const new_vlist: StrictVariantCategory[] = [];

											inspectingProduct.activeVariant?.map((j) => {
												if (j.category === e.category) {
													new_vlist.push({
														category: j.category,
														variant: k,
													});
												} else {
													new_vlist.push(j);
												}
											});

											const variant =
												inspectingProduct.activeProduct?.variants?.find((b) =>
													isEqual(
														b.variant_code,
														new_vlist?.map((e) => e.variant.variant_code),
													),
												);

											if (!variant) {
												return (
													<p
														className="bg-gray-700 whitespace-nowrap cursor-pointer text-gray-600 py-1 px-4 w-fit rounded-md"
														key={k.variant_code}
														onClick={() => {
															let valid_variant:
																| null
																| StrictVariantCategory[] = null;

															for (
																let i = 0;
																i <
																(inspectingProduct.activeVariantPossibilities
																	?.length ?? 0);
																i++
															) {
																const new_vlist: StrictVariantCategory[] = [];

																inspectingProduct.activeVariantPossibilities?.[
																	i
																]?.map((j) => {
																	if (j.category === e.category) {
																		new_vlist.push({
																			category: j.category,
																			variant: k,
																		});
																	} else {
																		// If valid pair, choose.
																		new_vlist.push(j);
																	}
																});

																if (
																	inspectingProduct.activeProduct &&
																	isValidVariant(
																		inspectingProduct.activeProduct,
																		new_vlist,
																	)
																) {
																	valid_variant = new_vlist;
																	break;
																}
															}

															setInspectingProduct((currentProduct) => ({
																...currentProduct,
																activeVariant: valid_variant,
															}));
														}}
													>
														{k.name}
													</p>
												);
											}

											if (match) {
												return (
													<p
														className="bg-gray-600 whitespace-nowrap cursor-pointer text-white py-1 px-4 w-fit rounded-md"
														key={k.variant_code}
													>
														{k.name}
													</p>
												);
											}
											return (
												<p
													onClick={() => {
														const new_vlist: StrictVariantCategory[] = [];

														inspectingProduct.activeVariant?.map((j) => {
															if (j.category === e.category) {
																new_vlist.push({
																	category: j.category,
																	variant: k,
																});
															} else {
																new_vlist.push(j);
															}
														});

														setInspectingProduct((currentProduct) => ({
															...currentProduct,
															activeVariant: new_vlist,
														}));
													}}
													className="bg-gray-600 whitespace-nowrap hover:cursor-pointer text-gray-500 hover:text-gray-400 py-1 px-4 w-fit rounded-md"
													key={k.variant_code}
												>
													{k.name}
												</p>
											);
										})}
									</div>
								</div>
							);
						})}
					</div>

					<div className="flex flex-col items-start gap-2 w-fit">
						<p className="text-sm text-gray-400">COST</p>
						{/* As the price of a product is generated by the marginal increase from every variant, we must sum each variants prices to obtain the cost of the product with all variant codes applied. */}
						{(() => {
							const variant = inspectingProduct?.activeProduct?.variants?.find(
								(b) =>
									isEqual(
										b.variant_code,
										inspectingProduct.activeVariant?.map(
											(e) => e.variant.variant_code,
										),
									),
							);

							return (
								<div>
									<p className="text-2xl font-semibold">
										${((variant?.retail_price ?? 1) * 1.15).toFixed(2)}
									</p>
									<p className="text-gray-400">
										pre-tax: ${((variant?.retail_price ?? 1) * 1).toFixed(2)}
									</p>
								</div>
							);
						})()}
					</div>

					<div className="flex flex-col gap-2">
						<p className="text-sm text-gray-400">INVENTORY</p>
						<div className="flex flex-col gap-2 w-full bg-gray-700 p-[0.7rem] px-4 rounded-md">
							{inspectingProduct.activeProductVariant?.stock.map((e) => {
								return (
									<div
										key={`STOCK-FOR-${e.store.store_id}`}
										className="flex flex-row items-center justify-between gap-2"
									>
										<p>
											{
												currentStore.store_lut.find(
													(element) => element.code === e.store.store_code,
												)?.contact.name
											}
										</p>
										<div className="flex-1 h-[2px] rounded-full bg-gray-400 w-full" />
										<p>{e.quantity.quantity_sellable}</p>
										<p className="text-gray-400">
											({e.quantity.quantity_unsellable} Unsellable)
										</p>
										<p>(+{e.quantity.quantity_on_order} on order)</p>
										{/* <p>{e.quantity.quantity_on_floor}</p> */}
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className="w-full flex flex-col gap-8 2xl:gap-2">
					<div className="flex 2xl:hidden items-center justify-center">
						{/* Buttons go here for smaller displays !skipto */}
						<div className="self-center flex flex-row items-center gap-4">
							<div
								className={`select-none cursor-pointer flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
								onClick={() => {
									if (inspectingProduct.activeProductVariant) {
										let cOs = orderState.find((e) => e.order_type === "direct");

										if (!cOs?.products) {
											const new_pdt_list = addToCart([]);

											cOs = {
												id: v4(),
												destination: null,
												origin: {
													store_code: currentStore.store_code,
													store_id: currentStore.store_id ?? "",
													contact: currentStore.store_contact,
												},
												products: new_pdt_list,
												status: {
													status: {
														type: "queued",
														value: getDate(),
													},
													assigned_products: [],
													timestamp: getDate(),
												},
												previous_failed_fulfillment_attempts: [],
												status_history: [],
												order_history: [],
												order_notes: [],
												reference: `RF${customAlphabet(
													"1234567890abcdef",
													10,
												)(8)}`,
												creation_date: getDate(),
												discount: "a|0",
												order_type: OrderType.Direct,
											};

											setOrderState([...sortOrders([...orderState, cOs])]);
										} else {
											const new_pdt_list = addToCart(cOs.products);
											const new_order_state = orderState.map((e) =>
												e.id === cOs?.id
													? { ...cOs, products: new_pdt_list }
													: e,
											);

											setOrderState(sortOrders(new_order_state));
										}
									}
								}}
							>
								<Image
									width="25"
									height="25"
									src="/icons/plus-lge.svg"
									style={{
										filter:
											"invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)",
									}}
									alt={""}
								/>
								<p className="font-medium">Add to cart</p>
							</div>

							<div
								onClick={() => {
									setKioskPanel("related-orders");
								}}
								className={`select-none flex flex-col cursor-pointer justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 ${BLOCK_SIZE} rounded-md text-white max-w-fit`}
							>
								<Image
									width="25"
									height="25"
									src="/icons/search-sm.svg"
									style={{
										filter:
											"invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)",
									}}
									alt={""}
								/>
								<p className="font-medium">Related Orders</p>
							</div>
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<p className="text-sm text-gray-400">ALL VARIANTS</p>

						<div className="p-[0.7rem] w-full bg-gray-700 rounded-md gap-2 flex flex-col">
							{inspectingProduct?.activeProduct?.variants.map((e, indx) => {
								const active =
									inspectingProduct.activeProductVariant?.barcode === e.barcode;
								const qua = e.stock.find(
									(e) => e.store.store_id === currentStore.store_id,
								);

								return (
									<div key={`PRODUCT_VARIANT_BARCODE:${e.barcode.toString()}`}>
										<div
											onClick={() => {
												const variant =
													inspectingProduct.activeVariantPossibilities?.find(
														(b) =>
															isEqual(
																b?.map((k) => k.variant.variant_code),
																e.variant_code,
															),
													) as StrictVariantCategory[];

												setInspectingProduct((currentProduct) => ({
													...currentProduct,
													activeVariant: variant,
													activeProductVariant: e,
												}));
											}}
											className={`grid w-full px-[0.7rem] py-2 rounded-sm cursor-pointer items-center ${
												active ? "bg-gray-600" : ""
											}`}
											style={{
												gridTemplateColumns:
													(windowSize.width ?? 0) < 640
														? "1fr 1fr 75px"
														: "1fr 250px 75px",
											}}
										>
											<p className="flex-1 w-full">{e.name}</p>

											<div className="flex flex-col md:flex-row md:gap-4">
												<p className="text-gray-300">
													{qua?.quantity.quantity_sellable ?? 0 ?? 0} Here
												</p>
												<p className="text-gray-300">
													{e.stock
														.map((e) =>
															e.store.store_id === currentStore.store_id
																? 0
																: e.quantity.quantity_sellable,
														)
														.reduce((prev, curr) => prev + curr, 0)}{" "}
													In other stores
												</p>
											</div>

											<p>${(e.retail_price * 1.15).toFixed(2)}</p>
										</div>

										{indx ===
										(inspectingProduct.activeProduct?.variants.length ?? 0) -
											1 ? (
											<></>
										) : (
											<hr className="mt-2 border-gray-500" />
										)}
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
