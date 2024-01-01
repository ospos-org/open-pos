import { SELF_URL } from "./environment";

const queryKiosk = async (query_url: string, options: RequestInit) =>
	await fetch(`${SELF_URL}/api/${query_url}`, options);

export { queryKiosk };
