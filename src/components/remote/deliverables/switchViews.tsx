import { useAtom, useSetAtom } from "jotai";
import { useCallback, useState } from "react";

import {
	deliverablesActiveOrderAtom,
	deliverablesMenuStateAtom,
	deliverablesStateChangeAtom,
} from "@atoms/deliverables";
import { mobileLowModeAtom } from "@atoms/openpos";
import { useWindowSize } from "@hooks/useWindowSize";

import { Order } from "@/generated/stock/Api";
import { BatchGroupView } from "./batchGroupView";
import { OrderGroupView } from "./orderGroupView";

export function SwitchViews() {
	const setActiveOrder = useSetAtom(deliverablesActiveOrderAtom);

	const [menuState, setMenuState] = useAtom(deliverablesMenuStateAtom);
	const [stateChange, setStateChange] = useAtom(deliverablesStateChangeAtom);
	const [viewingMode, setViewingMode] = useState(0);
	const [lowModeCartOn, setLowModeCartOn] = useAtom(mobileLowModeAtom);

	const orderGroupViewCallback = useCallback(
		(order: Order) => {
			setActiveOrder(order);
			setLowModeCartOn(!lowModeCartOn);
			setStateChange(null);
			setMenuState(null);
		},
		[
			lowModeCartOn,
			setActiveOrder,
			setLowModeCartOn,
			setMenuState,
			setStateChange,
		],
	);

	const windowSize = useWindowSize();

	return !lowModeCartOn || (windowSize.width ?? 0) > 640 ? (
		<div className="flex flex-col md:p-4 p-6 w-full">
			<div className="flex w-full max-w-full flex-row items-center gap-2 bg-gray-400 bg-opacity-10 p-2 rounded-md">
				<div
					className={`text-white ${
						viewingMode === 0 ? "bg-gray-500" : " bg-transparent"
					} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`}
					onClick={() => setViewingMode(0)}
				>
					Order
				</div>
				<div
					className={`text-white ${
						viewingMode === 1 ? "bg-gray-500" : " bg-transparent"
					} p-2 rounded-md px-4 w-full flex flex-1 text-center justify-center cursor-pointer`}
					onClick={() => setViewingMode(1)}
				>
					Batch
				</div>
			</div>

			{(() => {
				switch (viewingMode) {
					case 0:
						return (
							<OrderGroupView setActiveCallback={orderGroupViewCallback} />
						);
					case 1:
						return <BatchGroupView />;
				}
			})()}

			{(menuState != null || stateChange != null) &&
			(windowSize.width ?? 0) <= 640 ? (
				<div
					onClick={() => {
						if (stateChange != null) setStateChange(null);
						else setMenuState(null);
					}}
					className="bg-black h-[100vh] sm:w-[calc(100dw-62px)] sm:left-[62px] w-[100dw] min-h-[100vh] min-w-[100vw] top-0 left-0 fixed z-5 opacity-40"
				/>
			) : (
				<></>
			)}
		</div>
	) : (
		<></>
	);
}
