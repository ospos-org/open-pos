import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

import {
	deliverablesActiveOrderAtom,
	deliverablesAtom,
	deliverablesMenuStateAtom,
	deliverablesProductInformationAtom,
	deliverablesStateChangeAtom,
	productCategoriesAtom,
} from "@atoms/deliverables";
import { masterStateAtom } from "@atoms/openpos";

import { openStockClient } from "~/query/client";
import { ExpandedOrder } from "./deliverables/expandedOrder";
import { OrderSummary, parseDeliverables } from "./deliverables/orderSummary";
import { SwitchViews } from "./deliverables/switchViews";

export default function Deliverables() {
	const menuState = useAtomValue(deliverablesMenuStateAtom);
	const masterState = useAtomValue(masterStateAtom);
	const stateChange = useAtomValue(deliverablesStateChangeAtom);
	const activeOrder = useAtomValue(deliverablesActiveOrderAtom);

	const setDeliverables = useSetAtom(deliverablesAtom);
	const setMenuInformation = useSetAtom(deliverablesProductInformationAtom);
	const setProductCategories = useSetAtom(productCategoriesAtom);

	useEffect(() => {
		if (menuState != null && menuState?.product)
			openStockClient.product.get(parseInt(menuState.product)).then((data) => {
				if (data.data) setMenuInformation(data.data);
			});
	}, [menuState, setMenuInformation]);

	useEffect(() => {
		setDeliverables((deliverables) => [
			...deliverables.map((order) =>
				order.reference === activeOrder?.reference ? activeOrder : order,
			),
		]);
	}, [activeOrder, setDeliverables]);

	useEffect(() => {
		if (masterState.store_id)
			openStockClient.transaction
				.deliverablesSearch(masterState.store_id)
				.then((data) => {
					if (data.ok) {
						setDeliverables(data.data);
						setProductCategories(parseDeliverables(data.data));
					}
				});
	}, [masterState.store_id, setDeliverables, setProductCategories]);

	return (
		<>
			<SwitchViews />

			{(stateChange != null || menuState != null) && <OrderSummary />}

			<ExpandedOrder />
		</>
	);
}
