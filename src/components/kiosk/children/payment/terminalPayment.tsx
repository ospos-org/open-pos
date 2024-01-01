import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { v4 } from "uuid";

import { Payment, PaymentAction } from "@/generated/stock/Api";
import {
	defaultKioskAtom,
	generateTransactionAtom,
	kioskPanelLogAtom,
} from "@atoms/kiosk";
import {
	generateIntentAtom,
	paymentIntentsAtom,
	probingPricePayableAtom,
} from "@atoms/payment";
import { getDate } from "@utils/utils";
import { useCallback } from "react";
import { toast } from "sonner";
import { openStockClient } from "~/query/client";

export function TerminalPayment() {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	const computeTransaction = useAtomValue(generateTransactionAtom);
	const kioskState = useAtomValue(defaultKioskAtom);

	const generateIntent = useSetAtom(generateIntentAtom);

	const [probingPrice, setProbingPrice] = useAtom(probingPricePayableAtom);

	const processPayment = useCallback(() => {
		const payment_intents = generateIntent();

		// Determine how much has been paid.
		const quantityPaid = payment_intents.reduce(
			(prev, curr) => prev + (curr.amount.quantity ?? 0),
			0,
		);

		// If the current payment is still suboptimal, return otherwise continue.
		// Unless the transaction is a quote, then proceed as normal regardless.
		if (
			quantityPaid < (kioskState.order_total ?? 0) &&
			kioskState.transaction_type != "Quote"
		) {
			setProbingPrice((kioskState.order_total ?? 0) - quantityPaid);
			setKioskPanel("select-payment-method");

			return null;
		}

		openStockClient.transaction
			.create({
				...computeTransaction,
				payment: payment_intents,
			})
			.then((data) => {
				if (data.ok) setKioskPanel("completed");
				else
					toast.message("Failed to save transaction", {
						description: `Server gave ${data.error.message}`,
					});
			});
	}, [
		computeTransaction,
		kioskState,
		generateIntent,
		setKioskPanel,
		setProbingPrice,
	]);

	return (
		<div
			className="bg-blue-500 p-6 flex flex-col h-full items-center"
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer w-full">
				<div
					onClick={() => setKioskPanel("select-payment-method")}
					className="flex flex-row items-center gap-2"
				>
					<Image
						src="/icons/arrow-narrow-left-1.svg"
						height={20}
						width={20}
						alt=""
						style={{
							filter:
								"invert(100%) sepia(99%) saturate(0%) hue-rotate(119deg) brightness(110%) contrast(101%)",
						}}
					/>
					<p className="text-white">Cancel</p>
				</div>
				<p className="text-white">Awaiting Customer Payment</p>
			</div>

			<div className="flex-1 flex flex-col items-center justify-center">
				<p className="text-white text-3xl font-bold">
					${probingPrice?.toFixed(2)}
				</p>
				<p className="text-gray-200">Tap, Insert or Swipe</p>
			</div>

			<p onClick={processPayment}>Skip to Completion</p>
		</div>
	);
}
