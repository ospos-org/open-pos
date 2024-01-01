import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { Store } from "@/generated/stock/Api";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";

import type { GeneratedOrder } from "@components/kiosk/children/foreign/common/generated";
import EditPickup from "@components/kiosk/children/foreign/pickup/editPickup";
import PickupProductSelector from "@components/kiosk/children/foreign/pickup/pickupProductSelector";

const generatedOrderAtom = atom<GeneratedOrder[]>([]);

export function PickupMenu() {
	const [pageState, setPageState] = useState<"origin" | "edit">("origin");
	const [generatedOrder, setGeneratedOrder] = useAtom(generatedOrderAtom);
	const [pickupStore, setPickupStore] = useState<Store | null>(null);

	const currentStore = useAtomValue(masterStateAtom);
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);

	useEffect(() => {
		const foundStore = currentStore?.store_lut?.find(
			(k) => k.id === currentStore.store_id,
		);
		if (foundStore) setPickupStore(foundStore);
	}, [currentStore]);

	const pickupPage = useMemo(() => {
		if (pageState === "origin")
			return (
				<PickupProductSelector
					setPageState={setPageState}
					pickupStore={pickupStore}
					generatedOrderAtom={generatedOrderAtom}
				/>
			);

		return (
			<EditPickup
				pickupStore={pickupStore}
				setPickupStore={setPickupStore}
				setPageState={setPageState}
			/>
		);
	}, [generatedOrder, pageState, pickupStore]);

	return (
		<div
			className={
				"bg-gray-900 max-h-[calc(100vh - 18px)] overflow-auto " +
				"p-6 flex flex-col h-full justify-between flex-1 gap-8"
			}
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => {
						if (pageState !== "origin") setPageState("origin");
						else setKioskPanel("cart");
					}}
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
				<p className="text-gray-400">Pickup from another store</p>
			</div>

			<div className="flex flex-col flex-1 gap-8 h-full max-h-fit overflow-hidden">
				{pickupPage}
			</div>
		</div>
	);
}

export default PickupMenu;
