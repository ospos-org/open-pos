import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import {
	activeEmployeeAtom,
	loginAuthAtom,
	masterStateAtom,
	refreshTokenAtom,
	storeLookupTableAtom,
} from "@atoms/openpos";
import { toast } from "sonner";
import { openStockClient } from "~/query/client";

const cookieAtom = atom(
	(get) => get(refreshTokenAtom),
	async (get, set) => {
		const loginAuthInformation = get(loginAuthAtom);
		if (loginAuthInformation === undefined) return;

		const masterState = get(masterStateAtom);
		const [rid, pass] = loginAuthInformation;

		const hydrateState = async (
			refreshToken: string,
			rid: string,
			pass: string,
		) => {
			set(refreshTokenAtom, refreshToken);
			set(loginAuthAtom, [rid, pass]);

			const employee = await openStockClient.employee.getByRid(rid);
			const storeLookupTable = await openStockClient.store.getAll();

			if (employee.ok) set(activeEmployeeAtom, employee.data[0]);
			if (storeLookupTable.ok) set(storeLookupTableAtom, storeLookupTable.data);
		};

		if (masterState.kiosk_id)
			openStockClient.employee
				.authRid(rid, {
					pass: pass,
					kiosk_id: masterState.kiosk_id,
					tenant_id: "DEFAULT_TENANT",
				})
				.then(async (token) => {
					if (token.ok) {
						await hydrateState(token.data, rid, pass);
					} else {
						toast.error(`Failed to login, invalid credentials`);
					}
				});
	},
);

export { cookieAtom };
