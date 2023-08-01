import { OPEN_STOCK_URL } from "./environment"

const queryOs = async (query_url: string, options: RequestInit) => {
    const data = await fetch(`${OPEN_STOCK_URL}/${query_url}`, options)

    return data
}

const queryKiosk = async (query_url: string, options: RequestInit) => {
    const data = await fetch(`./api/${query_url}`, options)

    return data
}

export default queryOs
export { queryKiosk }