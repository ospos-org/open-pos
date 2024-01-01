"use client";

import { Api as OpenStockHTTPClient } from "../../generated/stock/Api";

import { loginAuthAtom } from "@atoms/openpos";
import { cookieAtom } from "@utils/fetchCookie";
import { getDefaultStore } from "jotai";
import { env } from "~/env.mjs";

export const openStockClient = new OpenStockHTTPClient({
	baseUrl: env.NEXT_PUBLIC_API_URL,
	customFetch: fetchInterceptor,
});

async function useLogin() {
	const loginAuth = getDefaultStore().get(loginAuthAtom);
	if (loginAuth) await getDefaultStore().set(cookieAtom);
	else window.location.href = "/login";
}

async function fetchInterceptor(
	input: RequestInfo | URL,
	init?: RequestInit | undefined,
): Promise<Response> {
	return credentialFetch(input, init)
		.then(async (response) => {
			if (!response.ok) {
				// If the response indicates an authentication failure (e.g., 401 Unauthorized),
				// you can handle it here by checking the status code or any other relevant data
				if (response.status === 401) {
					// Call the login function when authentication fails
					await useLogin();
					// Retry the failed query after the login process
					return fetchInterceptor(input, init);
				}
				// For other errors, simply pass the response to the next chain
				return Promise.reject(response);
			}
			// If the response is successful, return the response object
			return response;
		})
		.catch((error) => {
			// Handle any other errors that might occur during the fetch
			console.error("Fetch error:", error);
			return Promise.reject(error);
		});
}

function credentialFetch(
	input: RequestInfo | URL,
	init?: RequestInit | undefined,
) {
	return fetch(input, {
		...init,
		// Force include credentials for CORS
		credentials: "include",
		redirect: "follow",
	});
}
