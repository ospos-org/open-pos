import Stripe from "stripe";
import stripe from "./stripe";

interface QueryError {
	message: string;
	error: true;
}

interface Data<T> {
	value: T;
	error: false;
}

interface Config {
	name: string;

	// Functionality
	get_terminals: () => Promise<Data<Stripe.Terminal.Reader[]> | QueryError>;
}

const configurations: Config[] = [stripe];

export default configurations[0];
export type { Config };
