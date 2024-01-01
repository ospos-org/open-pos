import { useAtom, useAtomValue } from "jotai";
import Image from "next/image";

import { activeEmployeeAtom, masterStateAtom, pageAtom } from "@atoms/openpos";
import { ICON_SIZE } from "@utils/utils";
import { useCallback, useEffect, useState } from "react";

import { TrackType } from "@/generated/stock/Api";
import { toast } from "sonner";
import { openStockClient } from "~/query/client";
import { Skeleton } from "./skeleton";
import OTooltip from "./tooltip";

export function DesktopNavigationElement() {
	// 0: Not set, 1: Out, 2: In, 3: Pending
	const [clockedOut, setClockedOut] = useState<0 | 1 | 2 | 3>(0);

	const employee = useAtomValue(activeEmployeeAtom);
	const kiosk = useAtomValue(masterStateAtom);
	const [page, setPage] = useAtom(pageAtom);

	const getEmployeeStatus = useCallback(async () => {
		if (employee?.id) {
			const status = await openStockClient.employee.getStatus(employee.id);

			if (status.ok) {
				if (status.data.item.track_type === TrackType.In) {
					setClockedOut(2);
				} else {
					setClockedOut(1);
				}
			}
		}
	}, [employee]);

	useEffect(() => {
		void getEmployeeStatus();
	}, [employee, getEmployeeStatus]);

	const toggleClockStatus = useCallback(async () => {
		if (!employee?.id || !kiosk.kiosk_id) return;

		const changeRequest = {
			kiosk: kiosk.kiosk_id,
			reason: "User-Requested Change",
			in_or_out: clockedOut === 1 ? "in" : "out",
		};

		toast.promise(openStockClient.employee.log(employee.id, changeRequest), {
			loading: `Clocking ${clockedOut === 1 ? "in" : "out"}...`,
			error: `Failed to clock ${clockedOut === 1 ? "in" : "out"}.`,
			success: (data) => {
				setClockedOut(clockedOut === 1 ? 2 : 1);
				return `Clocked ${clockedOut === 1 ? "in" : "out"} successfully.`;
			},
		});
	}, [clockedOut, employee?.id, kiosk.kiosk_id]);

	return (
		<div className="hidden md:flex bg-gray-900 flex-col p-4 h-full justify-between items-center flex-shrink-0">
			<div className="flex flex-col h-full gap-12 items-center">
				{/* Kiosk */}
				<OTooltip name={`Kiosk`}>
					<div>
						{page == 0 ? (
							<Image
								className="select-none svg cursor-pointer"
								width={`${ICON_SIZE}`}
								height={`${ICON_SIZE}`}
								src="/icons/shopping-bag-01-filled.svg"
								alt=""
								style={{
									filter:
										"invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)",
								}}
								onClick={() => setPage(0)}
							></Image>
						) : (
							<Image
								className="select-none cursor-pointer"
								width={`${ICON_SIZE}`}
								height={`${ICON_SIZE}`}
								src="/icons/shopping-bag-01.svg"
								style={{
									filter:
										"invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)",
								}}
								alt={""}
								onClick={() => setPage(0)}
							></Image>
						)}
					</div>
				</OTooltip>

				<div className="flex flex-col gap-4">
					{/* Inventory / Order Search */}
					{/* {
                        page == 1 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-01-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }}  alt={''} onClick={() => setPage(1)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/cube-outline.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(1)}></Image>
                    } */}

					{/* Job Calendar - Place to-do-jobs */}
					{/* {
                        page == 2 ?
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar-filled.svg" style={{ filter: "invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)" }} alt={''} onClick={() => setPage(2)}></Image>
                        :	
                        <Image className="select-none cursor-pointer" width={`${ICON_SIZE}`} height={`${ICON_SIZE}`} src="/icons/calendar.svg" style={{ filter: "invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)" }} alt={''} onClick={() => setPage(2)}></Image>
                    } */}
				</div>

				<div className="flex flex-col gap-4">
					{/* Deliverables - Deliveries and Outgoing Orders */}
					<OTooltip name={`Deliverables`}>
						<div>
							{page == 3 ? (
								<Image
									className="select-none cursor-pointer"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/arrow-square-up-right-filled.svg"
									alt={""}
									onClick={() => setPage(3)}
								></Image>
							) : (
								<Image
									className="select-none cursor-pointer"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/arrow-square-up-right.svg"
									alt={""}
									onClick={() => setPage(3)}
								></Image>
							)}
						</div>
					</OTooltip>

					{/* Receivables - Incoming Orders */}
					<OTooltip name={`Receivables`}>
						<div>
							{page == 4 ? (
								<Image
									className="select-none cursor-pointer"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/arrow-square-down-right-filled.svg"
									alt={""}
									onClick={() => setPage(4)}
								></Image>
							) : (
								<Image
									className="select-none cursor-pointer"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/arrow-square-down-right.svg"
									alt={""}
									onClick={() => setPage(4)}
								></Image>
							)}
						</div>
					</OTooltip>
				</div>
			</div>

			<div className="flex flex-col gap-4">
				<OTooltip name={`Clock ${clockedOut === 1 ? "in" : "out"}`}>
					<div className="flex items-center justify-center">
						{clockedOut > 0 ? (
							clockedOut === 2 ? (
								<Image
									className="select-none cursor-pointer text-black"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/alarm-clock-minus.svg"
									alt={""}
									onClick={toggleClockStatus}
								></Image>
							) : (
								<Image
									className="select-none cursor-pointer"
									width={`${ICON_SIZE}`}
									height={`${ICON_SIZE}`}
									src="/icons/alarm-clock-plus.svg"
									alt={""}
									onClick={toggleClockStatus}
								></Image>
							)
						) : (
							<Skeleton className="h-6 w-6 opacity-20"></Skeleton>
						)}
					</div>
				</OTooltip>

				<OTooltip name="Settings">
					<div>
						{page == 5 ? (
							<Image
								className="select-none cursor-pointer"
								width={`${ICON_SIZE}`}
								height={`${ICON_SIZE}`}
								src="/icons/settings-04-filled.svg"
								alt={""}
								onClick={() => setPage(5)}
							></Image>
						) : (
							<Image
								className="select-none cursor-pointer"
								width={`${ICON_SIZE}`}
								height={`${ICON_SIZE}`}
								src="/icons/settings-04.svg"
								alt={""}
								onClick={() => setPage(5)}
							></Image>
						)}
					</div>
				</OTooltip>
			</div>
		</div>
	);
}
