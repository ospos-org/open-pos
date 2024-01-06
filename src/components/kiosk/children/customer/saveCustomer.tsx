import { useSetAtom } from "jotai/index";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { openStockClient } from "~/query/client";

import { Customer } from "@/generated/stock/Api";
import { customerAtom } from "@atoms/customer";
import { kioskPanelLogAtom } from "@atoms/kiosk";

interface SaveCustomerProps {
	workingCustomer: Customer | null;
}

export default function SaveCustomer({ workingCustomer }: SaveCustomerProps) {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const setCustomerState = useSetAtom(customerAtom);

	const [loading, setLoading] = useState(false);

	const saveCustomer = useCallback(() => {
		if (!loading) {
			if (!workingCustomer?.contact || !workingCustomer?.name) return;
			setLoading(true);

			const customerObject = {
				...workingCustomer,
				contact: workingCustomer.contact,
				name: workingCustomer.contact.name,
			};

			if (customerObject?.id)
				toast.promise(
					openStockClient.customer.update(customerObject.id, customerObject),
					{
						loading: "Saving customer details...",
						error: (data) => {
							setLoading(false);
							return `Failed. ${
								data.error?.message ?? "Server error, please contact support."
							}`;
						},
						success: (data) => {
							setLoading(false);

							setCustomerState(data.data);
							setKioskPanel("cart");

							return "Saved customer.";
						},
					},
				);
			else {
				toast.message("No Identifier Provided, State has de-synced.");
				setLoading(false);
			}
		}
	}, [loading, workingCustomer, setCustomerState, setKioskPanel]);

	return (
		<div
			onClick={saveCustomer}
			className={`
                ${
									!loading
										? "bg-blue-700 cursor-pointer"
										: "bg-blue-700 bg-opacity-10 opacity-20"
								} 
                w-full rounded-md p-4 flex items-center justify-center
            `}
		>
			<p className="text-white font-semibold">
				{loading ? "Saving..." : "Save"}
			</p>
		</div>
	);
}
