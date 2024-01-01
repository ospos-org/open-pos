import { useAtomValue } from "jotai";

import { pageAtom } from "@atoms/openpos";
import Inventory from "@components/inventory/inventory";
import Job from "@components/job/job";
import Kiosk from "@components/kiosk/kiosk";
import Deliverables from "@components/remote/deliverables";
import Receivables from "@components/remote/receivables";

export function ContentSwitcher() {
	const page = useAtomValue(pageAtom);

	return (
		<div className="bg-gray-800 flex flex-1 overflow-hidden">
			{(() => {
				switch (page) {
					case 0:
						return <Kiosk />;
					case 1:
						return <Inventory />;
					case 2:
						return <Job />;
					case 3:
						return <Deliverables />;
					case 4:
						return <Receivables />;
					case 5:
						return <></>;
					default:
						return <Kiosk />;
				}
			})()}
		</div>
	);
}
