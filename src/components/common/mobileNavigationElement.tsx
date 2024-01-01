import { useAtom, useSetAtom } from "jotai";
import Image from "next/image";

import { ICON_SIZE } from "@/src/utils/utils";
import {
	mobileLowModeAtom,
	mobileMenuOpenAtom,
	pageAtom,
} from "@atoms/openpos";

export function MobileNavigationElement() {
	const setLowModeCartOn = useSetAtom(mobileLowModeAtom);
	const setMenuOpen = useSetAtom(mobileMenuOpenAtom);

	const [page, setPage] = useAtom(pageAtom);

	return (
		<div className="absolute z-50 bottom-0 mb-[40px] h-[440px] w-screen bg-black text-white h-80px rounded-t-md">
			<div className="flex flex-col p-8 h-full flex-shrink-0 gap-6">
				{/* Kiosk */}

				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(0);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 0 ? (
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
						/>
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
						/>
					)}

					<p className={`font-bold ${page === 0 ? "" : "text-gray-300"}`}>
						Cart
					</p>
				</div>

				{/* Inventory / Order Search */}
				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(1);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 1 ? (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/cube-01-filled.svg"
							style={{
								filter:
									"invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)",
							}}
							alt={""}
						/>
					) : (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/cube-outline.svg"
							style={{
								filter:
									"invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)",
							}}
							alt={""}
						/>
					)}

					<p className={`font-bold ${page === 1 ? "" : "text-gray-300"}`}>
						Inventory
					</p>
				</div>

				{/* Job Calendar - Place to-do-jobs */}
				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(2);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 2 ? (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/calendar-filled.svg"
							style={{
								filter:
									"invert(100%) sepia(0%) saturate(7484%) hue-rotate(116deg) brightness(96%) contrast(101%)",
							}}
							alt={""}
						/>
					) : (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/calendar.svg"
							style={{
								filter:
									"invert(61%) sepia(16%) saturate(286%) hue-rotate(175deg) brightness(90%) contrast(90%)",
							}}
							alt={""}
						/>
					)}

					<p className={`font-bold ${page === 2 ? "" : "text-gray-300"}`}>
						Calendar
					</p>
				</div>

				{/* Deliverables - Deliveries and Outgoing Orders */}
				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(3);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 3 ? (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/arrow-square-up-right-filled.svg"
							alt={""}
						/>
					) : (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/arrow-square-up-right.svg"
							alt={""}
						/>
					)}

					<p className={`font-bold ${page === 3 ? "" : "text-gray-300"}`}>
						Deliverables
					</p>
				</div>

				{/* Incomings - Incoming Orders */}
				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(4);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 4 ? (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/arrow-square-down-right-filled.svg"
							alt={""}
						/>
					) : (
						<Image
							className="select-none cursor-pointer"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/arrow-square-down-right.svg"
							alt={""}
						/>
					)}

					<p className={`font-bold ${page === 4 ? "" : "text-gray-300"}`}>
						Incomings
					</p>
				</div>

				<div
					className="flex flex-row gap-4 items-center"
					onClick={() => {
						setPage(5);
						setMenuOpen(false);
						setLowModeCartOn(false);
					}}
				>
					{page === 5 ? (
						<Image
							className="select-none"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/settings-04-filled.svg"
							alt={""}
						/>
					) : (
						<Image
							className="select-none"
							width={`${ICON_SIZE}`}
							height={`${ICON_SIZE}`}
							src="/icons/settings-04.svg"
							alt={""}
						/>
					)}

					<p className={`font-bold ${page === 5 ? "" : "text-gray-300"}`}>
						Settings
					</p>
				</div>
			</div>
		</div>
	);
}
