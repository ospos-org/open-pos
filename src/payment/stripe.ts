import { Config } from "./config"

const stripe: Config = {
    name: "Stripe",
    get_terminals: () => {
        return [""]
    }
}

export default stripe
