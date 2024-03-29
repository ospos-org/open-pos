import { useAtom, useSetAtom } from "jotai";
import Image from "next/image";
import { useState } from "react";
import { v4 } from "uuid";

import { defaultKioskAtom, kioskPanelLogAtom } from "@atoms/kiosk";
import { paymentIntentsAtom, probingPricePayableAtom } from "@atoms/payment";
import { getDate } from "@utils/utils";

import { Payment, PaymentAction } from "@/generated/stock/Api";
import CashSelect from "./cashSelect";

export function CashPayment() {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const setPaymentIntents = useSetAtom(paymentIntentsAtom);

	const [kioskState, setKioskState] = useAtom(defaultKioskAtom);
	const [probingPrice, setProbingPrice] = useAtom(probingPricePayableAtom);
	const [cashContinuable, setCashContinuable] = useState(false);

	return (
		<div
			className="bg-blue-500 p-6 flex flex-col h-full items-center"
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer w-full">
				<div
					onClick={() => {
						setKioskPanel("select-payment-method");
					}}
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
					<p className="text-white">Back</p>
				</div>
				<p className="text-white">Awaiting Customer Payment</p>
			</div>

			<CashSelect
				totalCost={probingPrice ?? 0}
				changeCallback={(_val: number, deg: number) => {
					setCashContinuable(deg >= 0);
				}}
			/>

			<div className="flex w-full flex-row items-center gap-4 cursor-pointer">
				<div
					className={`${
						cashContinuable ? "bg-white" : "bg-blue-400"
					} w-full rounded-md p-4 flex items-center justify-center`}
					onClick={() => {
						const new_payment: Payment[] = [
							...kioskState.payment,
							{
								amount: { quantity: probingPrice ?? 0, currency: "NZD" },
								delay_action: PaymentAction.Cancel,
								delay_duration: "PT12H",
								fulfillment_date: getDate(),
								id: v4(),
								order_ids: ["?"],
								payment_method: "Cash",
								processing_fee: { quantity: 0.1, currency: "NZD" },
								processor: {
									location: "001",
									employee: "EMPLOYEE_ID",
									software_version: "k0.5.2",
									token: "dec05e7e-4228-46c2-8f87-8a01ee3ed5a9",
								},
								status: {
									Complete: {
										CardDetails: {
											card_brand: "VISA",
											last_4: "4025",
											exp_month: "03",
											exp_year: "2023",
											fingerprint: "a20@jA928ajsf9a9828",
											card_type: "DEBIT",
											prepaid_type: "NULL",
											bin: "",

											entry_method: "PIN",
											cvv_accepted: "TRUE",
											avs_accepted: "TRUE",
											auth_result_code: "YES",
											statement_description: "DEBIT ACCEPTED",
											card_payment_timeline: {
												authorized_at: "",
												captured_at: "",
											},
										},
									},
								},
							},
						];

						setPaymentIntents(new_payment);

						const quantity = new_payment.reduce(
							(prev, curr) => prev + (curr.amount.quantity ?? 0),
							0,
						);

						if (quantity < (kioskState.order_total ?? 0)) {
							setProbingPrice((kioskState.order_total ?? 0) - quantity);
							setKioskPanel("select-payment-method");
						} else {
							setKioskPanel("completed");
						}
					}}
				>
					<p
						className={`${
							cashContinuable ? "text-blue-600" : "text-blue-500"
						} font-semibold ${""}`}
					>
						Complete
					</p>
				</div>
			</div>
		</div>
	);
}
