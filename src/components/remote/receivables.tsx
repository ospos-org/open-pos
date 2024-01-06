import { useAtom, useAtomValue, useSetAtom } from "jotai";
import moment from "moment";
import { useEffect } from "react";

import {
	receivablesActiveOrderAtom,
	receivablesAtom,
	receivablesMenuStateAtom,
	receivablesProductInformationAtom,
	receivablesStateChangeAtom,
} from "@/src/atoms/receivables";
import { masterStateAtom, mobileLowModeAtom } from "@atoms/openpos";
import { useWindowSize } from "@hooks/useWindowSize";

import { openStockClient } from "~/query/client";
import OrderView from "./orderView";

export default function Receivables() {
	const masterState = useAtomValue(masterStateAtom);
	const setMenuInformation = useSetAtom(receivablesProductInformationAtom);

	const [lowModeCartOn, setLowModeCartOn] = useAtom(mobileLowModeAtom);
	const [stateChange, setStateChange] = useAtom(receivablesStateChangeAtom);
	const [activeOrder, setActiveOrder] = useAtom(receivablesActiveOrderAtom);
	const [receivables, setReceivables] = useAtom(receivablesAtom);
	const [menuState, setMenuState] = useAtom(receivablesMenuStateAtom);

	const windowSize = useWindowSize();

	useEffect(() => {
		if (menuState != null)
			openStockClient.product
				.get(parseInt(menuState?.product))
				.then(async (k) => {
					if (k.ok) setMenuInformation(k.data);
				});
	}, [menuState, setMenuInformation]);

	useEffect(() => {
		// queryOs(`transaction/receivables/${masterState.store_id}`, {
		//     method: "GET",
		//     credentials: "include",
		//     redirect: "follow"
		// })
		// .then(async b => {
		//     const data: Order[] = await b.json();
		//     setReceivables(data);
		// })
	}, [masterState.store_id, setReceivables]);

	return (
		<>
			{!lowModeCartOn || (windowSize.width ?? 0) > 640 ? (
				<div className="flex flex-col gap-4 md:p-4 p-6 w-full">
					<div>
						{receivables.length <= 0 ? (
							<div className="flex items-center justify-center h-full pt-4">
								<p className="text-gray-400">No Incoming</p>
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{receivables.map((b, indx) => {
									return (
										<>
											<div
												onClick={() => {
													if ((windowSize?.width ?? 0) < 640) {
														setActiveOrder(b);
														setLowModeCartOn(!lowModeCartOn);
														setStateChange(null);
														setMenuState(null);
													}
												}}
												className="grid grid-flow-row gap-y-4 gap-x-2 items-center px-2"
												style={{
													gridTemplateColumns:
														(windowSize?.width ?? 0) < 640
															? "1fr 1fr"
															: ".5fr 1fr 250px 117px",
												}}
											>
												<div className="flex flex-col md:flex-row items-end sm:items-start md:gap-4">
													<p className="text-white font-mono font-bold">
														{b.reference}
													</p>
													<p className="text-white text-opacity-50">
														{moment(b.status.timestamp).format("D/MM/yy")}
													</p>
												</div>

												{(windowSize?.width ?? 0) > 640 ? (
													<p
														onClick={() => {
															setActiveOrder(b);
															setLowModeCartOn(!lowModeCartOn);
															setStateChange(null);
															setMenuState(null);
														}}
														className="bg-gray-100 text-sm text-end w-fit rounded-md place-center self-center items-center text-gray-800 font-bold px-4 justify-self-end hover:cursor-pointer"
													>
														<i className="md:visible invisible not-italic text-sm">
															{(windowSize?.width ?? 0) > 640 ? "View " : ""}
														</i>
														-{">"}
													</p>
												) : (
													<></>
												)}
											</div>

											{indx === receivables.length - 1 ? (
												<></>
											) : (
												<hr className="border-gray-700" />
											)}
										</>
									);
								})}
							</div>
						)}
					</div>

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
			)}

			{menuState == null &&
			stateChange == null &&
			(((windowSize.width ?? 0) < 640 && lowModeCartOn) ||
				(windowSize.width ?? 0) >= 640) ? (
				<div
					className="bg-gray-900 p-6 flex flex-col h-full overflow-y-scroll"
					style={{
						maxWidth: "min(550px, 100vw)",
						minWidth: "min(100vw, 550px)",
					}}
				>
					{activeOrder != null ? (
						// TODO: Fix type error
						// @ts-expect-error
						<OrderView orderAtom={receivablesActiveOrderAtom} />
					) : (
						<div className="h-full flex flex-col items-center justify-center flex-1">
							<p className="text-gray-400 text-center self-center">
								Please <strong>view</strong> an order to begin.
							</p>
						</div>
					)}
				</div>
			) : (
				<></>
			)}
		</>
	);
}
