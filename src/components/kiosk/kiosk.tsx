import { useAtomValue } from "jotai";

import { kioskPanelLogAtom } from "@atoms/kiosk";
import { useWindowSize } from "@hooks/useWindowSize";

import { ReactBarcodeReader } from "@components/common/scanner";

import PaymentMethod from "./children/payment/paymentMethodMenu";
import RelatedOrders from "./children/order/relatedMenu";
import CustomerMenu from "./children/customer/customerMenu";
import DispatchMenu from "./children/foreign/dispatchMenu";
import PickupMenu from "./children/foreign/pickupMenu";
import KioskMenu from "./kioskMenu";
import CartMenu from "./children/order/cartMenu";

import { CompletedOrderMenu } from "./children/order/completed/completedOrderMenu";
import { TransactionScreen } from "./children/order/transactionScreen";
import { DispatchHandler } from "./children/foreign/dispatchHandler";
import { TerminalPayment } from "./children/payment/terminalPayment";
import { DiscountScreen } from "./children/discount/discountScreen";
import { CashPayment } from "./children/payment/cashPayment";
import { NotesScreen } from "./children/notesScreen";

export default function Kiosk({ lowModeCartOn }: { lowModeCartOn: boolean }) {
    const kioskPanel = useAtomValue(kioskPanelLogAtom) 

    const window_size = useWindowSize();

    return (
        <>
            <ReactBarcodeReader
                onScan={(e: any) => {
                    // debouncedResults(e, "product");
                }}
            />

            {
                (
                        (window_size.width ?? 0) < 640 
                    && 
                        lowModeCartOn
                ) 
                ||  (
                        (window_size.width ?? 0) < 640 
                    && 
                        kioskPanel !== "cart"
                    )
                ?
                    <></>
                :
                    <KioskMenu />
            }

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) >= 640) || (kioskPanel !== "cart") ?
                    (() => {
                        switch(kioskPanel) {
                            case "cart":
                                return <CartMenu />
                            case "customer":
                                return <CustomerMenu />
                            case "customer-create":
                                return <CustomerMenu />
                            case "related-orders":
                                return <RelatedOrders />
                            case "select-payment-method":
                                return <PaymentMethod />
                            case "inv-transaction":
                                return <TransactionScreen />
                            case "await-debit":
                                return <TerminalPayment />
                            case "completed":
                                return <CompletedOrderMenu />
                            case "discount":
                                return <DiscountScreen />
                            case "await-cash":
                                return <CashPayment />
                            case "note":
                                return <NotesScreen />
                            case "pickup-from-store":
                                return  (
                                    <DispatchHandler title="Pickup from Store">
                                        <PickupMenu />
                                    </DispatchHandler>
                                )
                            case "ship-to-customer":
                                return (
                                    <DispatchHandler title="Ship order to customer">
                                        <DispatchMenu />
                                    </DispatchHandler>
                                )
                        }
                    })()
                :
                    <></>
            }
        </>
    )
}