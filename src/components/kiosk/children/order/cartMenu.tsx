import { OrdersPriceSummary } from "./ordersPriceSummary";
import { CartActionFooter } from "./cartActionFooter";
import { CartActionHeader } from "./cartActionHeader";
import { CartProductsList } from "./cartProductsList";

export default function CartMenu() {
    return (
        <div
            className="bg-gray-900 p-6 flex flex-col h-full overflow-y-auto overflow-x-hidden"
            style={{ maxWidth: "min(550px, 100vw)", minWidth: "min(100vw, 550px)" }}
        >
            <div className="flex flex-col gap-4 flex-1 max-h-full">
                {/* Order Information */}
                <CartActionHeader />  

                <hr className="border-gray-400 opacity-25"/>

                {/* List of Products */}
                <CartProductsList />

                <hr className="border-gray-400 opacity-25"/>
                
                {/* Price Summary (Total, Subtotal and Tax) */}
                <OrdersPriceSummary />

                {/* Continue / Park Sale */}
                <CartActionFooter />
            </div>
        </div>
    )
}