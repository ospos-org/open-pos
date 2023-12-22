import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";

import { activeEmployeeAtom, masterStateAtom, storeLookupTableAtom } from "@atoms/openpos";
import {openStockClient} from "~/query/client";

const useFetchCookie = () => {
    const masterState = useAtomValue(masterStateAtom)

    const setStoreLut = useSetAtom(storeLookupTableAtom)
    const setUser = useSetAtom(activeEmployeeAtom)

    const query = useCallback(async (rid: string, pass: string, callback: (password: string) => void) => {
        if (masterState.kiosk_id)
            openStockClient.employee.authRid(rid, {
                pass: pass,
                kiosk_id: masterState.kiosk_id,
                tenant_id: "DEFAULT_TENANT",
            })
                .then(async _ => {
                    const employee = await openStockClient.employee.getByRid(rid)
                    const storeLookupTable = await openStockClient.store.getAll()

                    if (employee.ok) setUser(employee.data[0])
                    if (storeLookupTable.ok) setStoreLut(storeLookupTable.data)

                    callback(pass)
                })
    }, [masterState.kiosk_id, setStoreLut, setUser])
    
    return { query }
}

export default useFetchCookie