import { Store } from "@/generated/stock/Api";
import { customerAtom } from "@atoms/customer";
import { masterStateAtom } from "@atoms/openpos";
import { AddressSuggestions } from "@components/kiosk/children/foreign/common/addressSuggestions";
import { EditContactInfo } from "@components/kiosk/children/foreign/common/editContactInfo";
import SearchLoading from "@components/kiosk/children/foreign/common/searchLoading";
import { ValidAddress } from "@components/kiosk/children/foreign/common/validAddress";
import { SetStateAction } from "jotai";
import { useAtom, useAtomValue } from "jotai/index";
import { debounce } from "lodash";
import {
	Dispatch,
	createRef,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";

interface EditPickupProps {
	pickupStore: Store | null;
	setPickupStore: (value: Store | null) => void;
	setPageState: Dispatch<SetStateAction<"origin" | "edit">>;
}

export default function EditPickup({
	pickupStore,
	setPickupStore,
	setPageState,
}: EditPickupProps) {
	const currentStore = useAtomValue(masterStateAtom);
	const [customerState, setCustomerState] = useAtom(customerAtom);

	const [searching, setSearching] = useState(false);
	const [loading, setLoading] = useState(false);
	const [suggestions, setSuggestions] = useState<Store[]>([]);

	const debouncedResults = useMemo(() => {
		return debounce(async (address: string) => {
			setLoading(true);

			const matches: Store[] = currentStore.store_lut
				? currentStore.store_lut.filter((k) =>
						JSON.stringify(k).toLowerCase().includes(address.toLowerCase()),
				  )
				: [];

			setSuggestions(matches);
			setLoading(false);
		}, 25);
	}, [currentStore.store_lut]);

	useEffect(() => {
		return () => {
			debouncedResults.cancel();
		};
	});

	const input_ref = createRef<HTMLInputElement>();

	const setSearch = useCallback(
		(store: Store) => {
			setSearching(false);
			setPickupStore(store);

			if (input_ref.current) input_ref.current.value = "";
		},
		[input_ref, setPickupStore],
	);

	const addressSuggestionProps = useMemo(
		() => ({
			type: "store" as const,
			suggestions: suggestions,
			callback: setSearch,
		}),
		[setSearch, suggestions],
	);

	const searchElement = useMemo(() => {
		if (searching && loading) return <SearchLoading />;
		if (searching) return <AddressSuggestions value={addressSuggestionProps} />;

		return <ValidAddress customerOrStore={pickupStore} />;
	}, [addressSuggestionProps, loading, pickupStore, searching]);

	return (
		<div className="flex flex-col gap-8 flex-1 overflow-auto">
			<EditContactInfo
				customerState={customerState}
				setCustomerState={setCustomerState}
			/>

			<div className="flex flex-col flex-1 gap-2 rounded-md">
				<p className="text-white font-semibold">Pickup Details</p>

				<div className="flex-1 h-full">
					<div className="flex flex-col gap-1">
						<div
							className={
								"flex flex-row items-center p-4 rounded-sm" +
								" bg-gray-700 gap-4 border-2 border-gray-700"
							}
						>
							<input
								autoComplete="off"
								ref={input_ref}
								placeholder="Address"
								defaultValue={""}
								className="bg-transparent focus:outline-none text-white flex-1"
								onChange={(e) => debouncedResults(e.target.value)}
								onFocus={() => setSearching(true)}
								tabIndex={0}
							/>
						</div>
					</div>

					<div
						className={`flex flex-col gap-2 flex-1 px-2 py-2 ${
							Boolean(searching) && "bg-gray-800"
						}`}
					>
						{searchElement}
					</div>
				</div>
			</div>

			<div
				onClick={() => setPageState("origin")}
				className={`${
					!loading
						? "bg-blue-700 cursor-pointer"
						: "bg-blue-700 bg-opacity-10 opacity-20"
				} 
                    w-full rounded-md p-4 flex items-center justify-center`}
			>
				<p className="text-white font-semibold">
					{loading ? "Saving..." : "Save"}
				</p>
			</div>
		</div>
	);
}
