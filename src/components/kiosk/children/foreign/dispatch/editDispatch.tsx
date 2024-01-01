import { useAtom } from "jotai/index";
import { add, debounce } from "lodash";
import { createRef, useCallback, useEffect, useMemo, useState } from "react";

import { Address, Customer, HttpResponse } from "@/generated/stock/Api";
import { customerAtom } from "@atoms/customer";
import { openStockClient } from "~/query/client";

import { AddressSuggestions } from "@components/kiosk/children/foreign/common/addressSuggestions";
import { EditContactInfo } from "@components/kiosk/children/foreign/common/editContactInfo";
import SearchLoading from "@components/kiosk/children/foreign/common/searchLoading";
import { ValidAddress } from "@components/kiosk/children/foreign/common/validAddress";

interface EditDispatchProps {
	callback: (data: HttpResponse<Customer, any>) => void;
}

export default function EditDispatch({ callback }: EditDispatchProps) {
	const [customerState, setCustomerState] = useAtom(customerAtom);

	const [searching, setSearching] = useState(false);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<Address[]>([]);

	const input_ref = createRef<HTMLInputElement>();

	const save = useCallback(() => {
		if (!loading) {
			setLoading(true);

			if (customerState?.id && customerState?.contact)
				openStockClient.customer
					.updateContactInfo(customerState.id, customerState.contact)
					.then(callback);
		}
	}, [callback, customerState, loading]);

	const debouncedResults = useMemo(() => {
		return debounce(async (address: string) => {
			setLoading(true);

			const suggestions = await openStockClient.helpers.suggestAddr(address);

			setSuggestions(suggestions.data ?? []);
			setLoading(false);
		}, 250);
	}, []);

	useEffect(() => {
		return () => {
			debouncedResults.cancel();
		};
	});

	const setSearch = useCallback(
		(address: Address) => {
			setSearching(false);

			if (customerState) {
				setCustomerState({
					...customerState,
					contact: {
						...customerState.contact,
						address: address,
					},
				});
			}

			if (input_ref.current) input_ref.current.value = "";
		},
		[customerState, input_ref, setCustomerState],
	);

	const addressSuggestionProps = useMemo(
		() => ({
			type: "raw" as const,
			suggestions: suggestions,
			callback: setSearch,
		}),
		[setSearch, suggestions],
	);

	const searchElement = useMemo(() => {
		if (searching && loading) return <SearchLoading />;
		if (searching) return <AddressSuggestions value={addressSuggestionProps} />;

		return <ValidAddress customerOrStore={customerState} />;
	}, [addressSuggestionProps, customerState, loading, searching]);

	return (
		<div className="flex flex-col gap-8 flex-1 max-h-fit overflow-hidden">
			<EditContactInfo
				customerState={customerState}
				setCustomerState={setCustomerState}
			/>

			<div className="flex flex-col w-full gap-2 rounded-md flex-1">
				<p className="text-white font-semibold">Shipping Details</p>

				<div className="h-full">
					<div className="flex flex-col gap-1">
						<div className="flex flex-row items-center p-4 rounded-t-sm bg-gray-700 gap-4 border-2 border-gray-700">
							<input
								autoComplete="off"
								ref={input_ref}
								placeholder="Address"
								defaultValue={customerState?.contact.address.street}
								className="bg-transparent focus:outline-none text-white flex-1"
								onChange={(e) => debouncedResults(e.target.value)}
								onFocus={() => setSearching(true)}
								tabIndex={0}
							/>
						</div>
					</div>

					<div
						className={`
                            flex flex-col h-full gap-2 p-2 rounded-b-md overflow-auto 
                            ${Boolean(searching) && "bg-gray-800"}
                        `}
					>
						{searchElement}
					</div>
				</div>
			</div>

			<div
				onClick={save}
				className={`${
					!loading
						? "bg-blue-700 cursor-pointer"
						: "bg-blue-700 bg-opacity-10 opacity-20"
				} w-full rounded-md p-4 flex items-center justify-center`}
			>
				<p className="text-white font-semibold">
					{loading && !searching ? "Saving..." : "Save"}
				</p>
			</div>
		</div>
	);
}
