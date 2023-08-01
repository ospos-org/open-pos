import Stripe from "stripe"
import { queryKiosk } from "../utils/query-os"
import { Config } from "./config"

const FALSE = false as false
const TRUE = true as true

const stripe: Config = {
    name: "Stripe",
    get_terminals: async () => {
        return queryKiosk('readers', {
            method: "GET"
        }).then(async data => {
            return {
                value: await data.json() as Stripe.Terminal.Reader[],
                error: FALSE
            }
        }).catch(error => {
            return {
                message: error,
                error: TRUE,
            }
        })
    }
}

export default stripe
