import { useAtom, useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";

import NotesMenu from "@components/common/notesMenu";

import { Note } from "@/generated/stock/Api";
import { kioskPanelLogAtom } from "@atoms/kiosk";
import { masterStateAtom } from "@atoms/openpos";
import { ordersAtom } from "@atoms/transaction";
import { getDate } from "@utils/utils";

export function NotesScreen() {
	const setKioskPanel = useSetAtom(kioskPanelLogAtom);
	const masterState = useAtomValue(masterStateAtom);

	const [orderState, setOrderState] = useAtom(ordersAtom);

	return (
		<div
			className="bg-gray-900 max-h-[calc(100vh - 18px)] p-6 flex flex-col h-full justify-between flex-1 gap-8"
			style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
		>
			<div className="flex flex-row justify-between cursor-pointer">
				<div
					onClick={() => {
						setKioskPanel("cart");
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
				<p className="text-gray-400">Add Note</p>
			</div>

			<NotesMenu
				callback={(activeOrder: string, note: string) => {
					if (masterState?.employee) {
						const note_obj: Note = {
							message: note,
							timestamp: getDate(),
							author: masterState?.employee.id ?? "",
						};

						const new_order_state = orderState.map((e) =>
							e.id === activeOrder
								? { ...e, order_notes: [...e.order_notes, note_obj] }
								: e,
						);
						setOrderState(new_order_state);
					}
				}}
			/>
		</div>
	);
}
