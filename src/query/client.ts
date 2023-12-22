import { Api as OpenStockHTTPClient } from "../../generated/stock/Api";

import { env } from "~/env.mjs";

export const openStockClient = new OpenStockHTTPClient({
    baseUrl: env.NEXT_PUBLIC_API_URL,
    customFetch: (...params) => {
        return fetch(params[0], {
            ...params[1],
            // Force include credentials for CORS
            credentials: "include",
            redirect: "follow",
        });
    },
});
