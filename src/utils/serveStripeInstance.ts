import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
	apiVersion: "2022-11-15",
	appInfo: {
		name: "open-pos",
		version: "0.0.1",
		url: "https://github.com/bennjii/open-pos",
	},
});

export default stripe;
