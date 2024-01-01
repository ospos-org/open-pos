import { type PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { useState } from "react";

import { Customer, CustomerInput } from "@/generated/stock/Api";
import { createCustomer, customerAtom } from "@/src/atoms/customer";
import { kioskPanelLogAtom } from "@/src/atoms/kiosk";

import CustomerLocation from "@components/kiosk/children/customer/customerLocation";
import SaveCustomer from "@components/kiosk/children/customer/saveCustomer";

interface CustomerMenuMode {
	mode: "CREATE" | "EDIT";
	pullAtom?: PrimitiveAtom<Customer>;
}

function CustomerMenu({ mode, pullAtom = createCustomer() }: CustomerMenuMode) {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const inspectingCustomer = useAtomValue(pullAtom);

	const [customerState, setCustomerState] = useAtom(customerAtom);
	const [customerStateInternal, setCustomerStateInternal] =
		useState<CustomerInput | null>(inspectingCustomer);

	return (
		<div
			className={
				"max-h-[calc(100vh - 18px)] h-full p-6 overflow-auto " +
				"bg-gray-900 flex flex-col flex-1 justify-between gap-8"
			}
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => setKioskPanel("cart")}
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
				<p className="text-gray-400">
					{customerState === null ? "Create" : "Edit"} Customer
				</p>
			</div>

			<div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
				<div className="flex flex-col gap-8 flex-1 overflow-auto">
					<div className="flex flex-col gap-2">
						<p className="text-white font-semibold">Contact Information</p>

						<div className="flex flex-col gap-1">
							<p className="text-gray-400 pb-0 mb-0">Customer Name</p>
							<div
								className={
									"flex flex-row items-center p-4 rounded-sm " +
									"bg-gray-700 gap-4 border-2 border-gray-700"
								}
							>
								<input
									placeholder="Customer Name"
									defaultValue={customerStateInternal?.contact.name}
									className="bg-transparent focus:outline-none text-white flex-1"
									onChange={(e) => {
										if (customerStateInternal)
											setCustomerStateInternal({
												...customerStateInternal,
												contact: {
													...customerStateInternal.contact,
													name: e.target.value,
												},
											});
									}}
									tabIndex={0}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<p className="text-gray-400">Phone Number</p>
							<div
								className={`
                                flex flex-row items-center p-4 rounded-sm 
                                bg-gray-700 gap-4 border-2 border-gray-700
                            `}
							>
								<input
									placeholder="Phone Number"
									defaultValue={customerStateInternal?.contact.mobile.number}
									className="bg-transparent focus:outline-none text-white flex-1"
									onChange={(e) => {
										if (customerStateInternal)
											setCustomerStateInternal({
												...customerStateInternal,
												contact: {
													...customerStateInternal.contact,
													mobile: {
														valid: true,
														number: e.target.value,
													},
												},
											});
									}}
									tabIndex={0}
								/>
							</div>
						</div>

						<div className="flex flex-col gap-1">
							<p className="text-gray-400">Email Address</p>
							<div
								className={`
                                flex flex-row items-center p-4 rounded-sm 
                                bg-gray-700 gap-4 "border-2 border-gray-700
                            `}
							>
								<input
									placeholder="Email Address"
									defaultValue={customerStateInternal?.contact.email.full}
									className="bg-transparent focus:outline-none text-white flex-1"
									onChange={(e) => {
										if (customerStateInternal)
											setCustomerStateInternal({
												...customerStateInternal,
												contact: {
													...customerStateInternal.contact,
													email: {
														root: e.target.value.split("@")[0],
														domain: e.target.value.split("@")[1],
														full: e.target.value,
													},
												},
											});
									}}
									tabIndex={0}
								/>
							</div>
						</div>
					</div>

					<div className="flex flex-col flex-1 gap-2 rounded-md">
						<p className="text-white font-semibold">Shipping Details</p>

						<CustomerLocation
							workingCustomer={inspectingCustomer}
							updateCustomer={setCustomerStateInternal}
						/>
					</div>

					<SaveCustomer workingCustomer={inspectingCustomer} />
				</div>
			</div>
		</div>
	);
}

export default CustomerMenu;
