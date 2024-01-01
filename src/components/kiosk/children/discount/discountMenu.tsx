import { useAtom } from "jotai";
import Image from "next/image";
import { FC, createRef, useMemo } from "react";

import { totalProductQuantityAtom } from "@atoms/cart";
import { activeDiscountAtom } from "@atoms/kiosk";
import { applyDiscount } from "@utils/discountHelpers";
import { useAtomValue } from "jotai/index";

const WHITE_FILTER =
	"invert(100%) sepia(0%) saturate(0%) hue-rotate(107deg) brightness(109%) contrast(101%)";
const GRAY_FILTER =
	"invert(78%) sepia(15%) saturate(224%) hue-rotate(179deg) brightness(82%) contrast(84%)";

const DiscountMenu: FC<{ callback: Function }> = ({ callback }) => {
	const productQuantity = useAtomValue(totalProductQuantityAtom);

	const [discount, setDiscount] = useAtom(activeDiscountAtom);
	const click_ref = createRef<HTMLDivElement>();

	const multiple = useMemo(() => productQuantity > 0, [productQuantity]);

	const retailPrice = useMemo(
		() => (discount?.product?.retail_price ?? 1) * 1.15,
		[discount?.product?.retail_price],
	);

	const marginalPrice = useMemo(
		() => discount?.product?.marginal_price ?? 1,
		[discount?.product?.marginal_price],
	);

	const discountedPrice = useMemo(
		() =>
			applyDiscount(
				retailPrice,
				`${discount?.type == "absolute" ? "a" : "p"}|${discount?.value}`,
			),
		[discount, retailPrice],
	);

	const grossProfit = useMemo(
		() => discountedPrice - marginalPrice,
		[discountedPrice, marginalPrice],
	);
	const grossProfitPercentage = useMemo(
		() => (grossProfit / retailPrice) * 100,
		[grossProfit, retailPrice],
	);

	if (!discount) return <></>;

	return (
		<>
			<div className="flex flex-col h-full gap-12 justify-center">
				<div className="self-center flex flex-col items-center justify-center">
					<p className="text-gray-400 text-sm">DISCOUNT VALUE</p>

					<div className="flex flex-row items-center text-white">
						<p className="text-2xl font-semibold">
							-{discount.type == "absolute" ? "$" : ""}
						</p>

						<input
							style={{
								width: (discount.value.toFixed(2).length ?? 1) + "ch",
							}}
							autoFocus
							className="bg-transparent text-center outline-none font-semibold text-3xl"
							defaultValue={
								discount.value !== 0 ? discount.value.toFixed(2) : ""
							}
							placeholder={discount.value.toFixed(2)}
							onChange={(e) => {
								e.target.style.width = (e.target.value.length ?? 1) + "ch";

								setDiscount({
									...discount,
									value: parseFloat(e.currentTarget.value) ?? 0,
								});
							}}
							onBlur={(e) => {
								const possible = parseFloat(e.currentTarget.value);

								if (isNaN(possible)) {
									e.currentTarget.value = (0).toFixed(2);
									e.target.style.width = (4 - 0.5 ?? 1) + "ch";
								} else {
									e.currentTarget.value = possible.toFixed(2);
									e.target.style.width =
										(possible.toFixed(2).length - 0.5 ?? 1) + "ch";
								}
							}}
							onKeyDown={(e) => {
								if (e.key == "Enter") {
									click_ref.current?.click();
								} else if (e.key == "p" || e.key == "P") {
									setDiscount({
										...discount,
										type: "percentage",
									});
									e.preventDefault();
									e.stopPropagation();
								} else if (e.key == "a" || e.key == "A") {
									setDiscount({
										...discount,
										type: "absolute",
									});
									e.preventDefault();
									e.stopPropagation();
								} else if (
									e.key == "Backspace" ||
									e.key == "ArrowRight" ||
									e.key == "ArrowLeft"
								) {
								} else if (!Number.isInteger(parseInt(e.key))) {
									e.preventDefault();
									e.stopPropagation();
								}
							}}
						></input>
						<p className="text-2xl font-semibold">
							{discount.type == "percentage" ? "%" : ""}
						</p>
					</div>
				</div>

				<div className="flex flex-row items-center gap-4 self-center">
					<div
						onClick={() => setDiscount({ ...discount, type: "absolute" })}
						className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
					>
						<Image
							src="/icons/minus-circle.svg"
							height={20}
							width={20}
							alt=""
							className="text-white"
							style={{
								filter:
									discount.type == "absolute" ? WHITE_FILTER : GRAY_FILTER,
							}}
						/>
						<p
							className={
								discount.type == "absolute" ? "text-white" : "text-gray-400"
							}
						>
							Absolute
						</p>
					</div>

					<div
						onClick={() => setDiscount({ ...discount, type: "percentage" })}
						className="self-center flex flex-row items-center gap-2 cursor-pointer p-2"
					>
						<Image
							src="/icons/percent-03.svg"
							height={20}
							width={20}
							alt=""
							className="text-white"
							style={{
								filter:
									discount.type == "percentage" ? WHITE_FILTER : GRAY_FILTER,
							}}
						/>
						<p
							className={
								discount.type == "percentage" ? "text-white" : "text-gray-400"
							}
						>
							Percentage
						</p>
					</div>
				</div>

				<div className="self-center flex-col items-center justify-center">
					<div className="flex flex-row items-center gap-4">
						<div className="flex flex-col items-center justify-center">
							<p className="text-gray-400 text-sm">Original Price</p>
							<p className="text-white">${retailPrice.toFixed(2)}</p>
						</div>

						<Image
							src="/icons/arrow-narrow-right.svg"
							alt="right arrow"
							width={20}
							height={20}
							style={{
								filter: GRAY_FILTER,
							}}
						/>

						<div className="flex flex-col items-center justify-center">
							<p className="text-gray-400 text-sm">New Price</p>

							<p
								className={`${
									discountedPrice < 0 ? "text-red-400" : "text-white"
								} font-bold`}
							>
								${discountedPrice.toFixed(2)}
							</p>
						</div>

						<Image
							src="/icons/arrow-narrow-right.svg"
							alt="right arrow"
							width={20}
							height={20}
							style={{
								filter: GRAY_FILTER,
							}}
						/>

						<div>
							<p className="text-gray-400 text-sm">Discount</p>
							<p
								className={`${
									discountedPrice < 0 ? "text-red-400" : "text-white"
								}`}
							>
								${Math.abs(discountedPrice - retailPrice).toFixed(2)}
							</p>
						</div>
					</div>

					<br />
					<hr className="bg-gray-600 border-gray-600" />
					<br />

					<div className="flex flex-row items-center gap-6 justify-center">
						<div className="flex flex-col items-center justify-center">
							<p className="text-gray-400 text-sm">GP</p>
							<p
								className={
									grossProfit < 10
										? grossProfit < 0
											? "text-red-400"
											: "text-red-200"
										: "text-white"
								}
							>
								${grossProfit.toFixed(2)}
							</p>
						</div>

						<div className="flex flex-col items-center justify-center">
							<p className="text-gray-400 text-sm">GP%</p>
							<p
								className={
									grossProfitPercentage < 10
										? grossProfitPercentage < 0
											? "text-red-400"
											: "text-red-200"
										: "text-white"
								}
							>
								{grossProfitPercentage.toFixed(2)}%
							</p>
						</div>

						<div className="flex flex-col items-center justify-center">
							<p className="text-gray-400 text-sm">MP/CP</p>
							<p className="text-white">${marginalPrice.toFixed(2)}</p>
						</div>
					</div>
				</div>

				<div
					onClick={() =>
						setDiscount({ ...discount, exclusive: !discount.exclusive })
					}
					className="flex cursor-pointer select-none w-full items-center justify-center gap-2"
				>
					<p className="text-gray-400">Apply to only one</p>

					{!discount.exclusive ? (
						<Image
							src="/icons/square.svg"
							alt="selected"
							width={20}
							height={20}
							style={{ filter: GRAY_FILTER }}
						/>
					) : (
						<Image
							src="/icons/check-square.svg"
							alt="selected"
							width={20}
							height={20}
							style={{ filter: GRAY_FILTER }}
						/>
					)}
				</div>
			</div>

			<div className="flex flex-row items-center gap-4">
				<div
					onClick={() => {
						setDiscount({
							...discount,
							source: "user",
							value: 0.0,
						});

						callback({
							...discount,
							source: "user",
							value: 0.0,
						});
					}}
					className={`
                        bg-gray-300 w-full rounded-md p-4 flex items-center justify-center cursor-pointer 
                        ${discount.value > 0 ? "" : "bg-opacity-10 opacity-20"}
                    `}
				>
					<p className="text-blue-500 font-semibold">Remove</p>
				</div>

				<div
					ref={click_ref}
					onClick={() => {
						callback(discount);
					}}
					className={`
                        ${
													multiple
														? "bg-blue-700 cursor-pointer"
														: "bg-blue-700 bg-opacity-10 opacity-20"
												} 
                        w-full rounded-md p-4 flex items-center justify-center
                    `}
				>
					<p className="text-white font-semibold">Apply Discount</p>
				</div>
			</div>
		</>
	);
};

export default DiscountMenu;
