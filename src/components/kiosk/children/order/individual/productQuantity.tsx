import { ordersAtom } from "@/src/atoms/transaction";
import { totalNetQuantityOfProductTransactedOutFromCartAtom } from "@atoms/cart";
import { ContextualOrder, ContextualProductPurchase } from "@utils/stockTypes";
import { useAtom } from "jotai";
import { useSetAtom } from "jotai/index";
import Image from "next/image";
import { createRef, useCallback, useMemo } from "react";

const FILTER_INVALID =
	"invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";

const FILTER_VALID =
	"invert(35%) sepia(47%) saturate(1957%) hue-rotate(331deg) brightness(99%) contrast(93%)";

const FILTER_GRAY =
	"invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";

interface ProductQuantityProps {
	currentOrder: ContextualOrder;
	product: ContextualProductPurchase;
	totalStock: number;
}

export function ProductQuantity({
	currentOrder,
	product,
	totalStock,
}: ProductQuantityProps) {
	const totalProductQuantitySelected = useSetAtom(
		totalNetQuantityOfProductTransactedOutFromCartAtom,
	);

	const [orderState, setOrderState] = useAtom(ordersAtom);

	const increaseQuantityRef = createRef<HTMLImageElement>();
	const decreaseQuantityRef = createRef<HTMLImageElement>();

	const validProductQuantity = useMemo(
		() =>
			!(totalProductQuantitySelected(product) >= totalStock) ||
			product.transaction_type === "In",
		[product, totalProductQuantitySelected, totalStock],
	);

	const mouseOver = useCallback(
		(variant: "INCREASE" | "DECREASE") => {
			if (variant === "INCREASE") {
				if (!increaseQuantityRef.current) return;

				if (validProductQuantity)
					increaseQuantityRef.current.style.filter = FILTER_VALID;
				else increaseQuantityRef.current.style.filter = FILTER_INVALID;
			} else {
				if (!decreaseQuantityRef.current) return;

				if (
					(currentOrder.products.find((k) => k.id === product.id)?.quantity ??
						1) <= 1
				)
					decreaseQuantityRef.current.style.filter =
						"invert(50%) sepia(98%) saturate(3136%) hue-rotate(332deg) brightness(94%) contrast(99%)";
				else decreaseQuantityRef.current.style.filter = FILTER_INVALID;
			}
		},
		[
			currentOrder.products,
			decreaseQuantityRef,
			increaseQuantityRef,
			product.id,
			validProductQuantity,
		],
	);

	const mouseLeave = useCallback(
		(variant: "INCREASE" | "DECREASE") => {
			if (variant === "INCREASE") {
				if (increaseQuantityRef.current)
					increaseQuantityRef.current.style.filter = FILTER_GRAY;
			} else {
				if (decreaseQuantityRef.current)
					decreaseQuantityRef.current.style.filter = FILTER_GRAY;
			}
		},
		[decreaseQuantityRef, increaseQuantityRef],
	);

	const alterProductQuantity = useCallback(
		(variant: "INCREASE" | "DECREASE") => {
			if (validProductQuantity) {
				const productList = currentOrder.products
					.map((productPurchase) => {
						if (productPurchase.id === product.id) {
							if (productPurchase.quantity <= 1) return null;

							return {
								...productPurchase,
								quantity:
									variant === "INCREASE"
										? productPurchase.quantity + 1
										: productPurchase.quantity - 1,
							};
						}
						return productPurchase;
					})
					.filter((k) => k) as ContextualProductPurchase[];

				const newOrderState = orderState
					.map((order) =>
						order.id === currentOrder.id
							? productList.length === 0
								? { ...order, products: productList }
								: null
							: order,
					)
					.filter((b) => b) as any as ContextualOrder[];

				setOrderState(newOrderState);
			}
		},
		[currentOrder, orderState, product.id, setOrderState, validProductQuantity],
	);

	return (
		<div className="flex flex-row sm:flex-col gap-2 items-center justify-center">
			<Image
				ref={increaseQuantityRef}
				onClick={() => alterProductQuantity("INCREASE")}
				onMouseOver={() => mouseOver("INCREASE")}
				onMouseLeave={() => mouseLeave("INCREASE")}
				draggable="false"
				className="select-none"
				src="/icons/arrow-block-up.svg"
				width="15"
				height="15"
				alt="Increase product quantity"
				style={{
					filter:
						totalProductQuantitySelected(product) <= totalStock &&
						product.transaction_type === "Out"
							? FILTER_GRAY
							: product.transaction_type === "Out"
							  ? FILTER_INVALID
							  : FILTER_GRAY,
				}}
			/>

			<Image
				ref={decreaseQuantityRef}
				onClick={() => alterProductQuantity("DECREASE")}
				draggable="false"
				className="select-none"
				onMouseOver={() => mouseOver("DECREASE")}
				onMouseLeave={() => mouseLeave("DECREASE")}
				width="15"
				height="15"
				src={
					totalProductQuantitySelected(product) <= 1
						? "/icons/x-square.svg"
						: "/icons/arrow-block-down.svg"
				}
				alt="Decrease product quantity"
				style={{ filter: FILTER_GRAY }}
			/>
		</div>
	);
}
