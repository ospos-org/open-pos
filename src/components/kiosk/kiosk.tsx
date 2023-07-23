import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useState } from "react";
import { v4 } from "uuid"

import { Product, ProductPurchase, StrictVariantCategory, VariantInformation } from "@utils/stockTypes";
import { activeDiscountAtom, kioskPanelLogAtom } from "@atoms/kiosk";
import { searchResultsAtom, searchTermAtom } from "@atoms/search";
import { inspectingProductAtom } from "@atoms/product";
import { fromDbDiscount } from "@utils/discountHelpers";
import { OPEN_STOCK_URL } from "@utils/environment";
import { useWindowSize } from "@hooks/useWindowSize";
import { ordersAtom } from "@atoms/transaction";

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
import { sortOrders } from "@/src/utils/utils";


export default function Kiosk({ lowModeCartOn }: { lowModeCartOn: boolean }) {
    const kioskPanel = useAtomValue(kioskPanelLogAtom) 
    const inspectingProduct = useAtomValue(inspectingProductAtom)

    const window_size = useWindowSize();

    const addToCart = useCallback((orderProducts: ProductPurchase[]) => {
        const { activeProduct: product, activeProductPromotions: promotions, activeProductVariant: variant } = inspectingProduct
    
        const existing_product = orderProducts.find(k => k.product_code == variant?.barcode ); // && isEqual(k.variant, variant?.variant_code)
        let new_order_products_state: ProductPurchase[] = [];

        if(existing_product && variant && product) {
            const matching_product = orderProducts.find(e => e.product_code == variant?.barcode); // && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
            
            if(matching_product) {
                const total_stock = matching_product.variant_information.stock.reduce((p, c) => p += (c.quantity.quantity_sellable), 0);
                // If a matching product exists; apply emendation
                new_order_products_state = orderProducts.map(e => {
                    if(total_stock <= e.quantity) return e;

                    return e.product_code == variant.barcode ? { ...e, quantity: e.quantity+1 } : e  //  && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
                });
            }else {
                const po: ProductPurchase = {
                    id: v4(),
                    product_code: variant.barcode ?? product.sku ?? "",
                    discount: [{
                        source: "loyalty",
                        value: fromDbDiscount(variant.loyalty_discount),
                        applicable_quantity: -1
                    }],
                    product_cost: variant?.retail_price ?? 0,
                    product_name: product.company + " " + product.name,
                    product_variant_name: variant.name,
                    product_sku: product.sku,
                    quantity: 1,
                    transaction_type: "Out",

                    product: product,
                    variant_information: variant ?? product.variants[0],
                    active_promotions: promotions,

                    tags: product.tags 
                };
    
                new_order_products_state = [ ...orderProducts, po ]
            }
        }else if(product && variant){
            // Creating a new product in the order.
            const po: ProductPurchase = {
                id: v4(),
                product_code: variant.barcode ?? product.sku ?? "",
                discount: [{
                    source: "loyalty",
                    value: fromDbDiscount(variant.loyalty_discount),
                    applicable_quantity: -1
                }],
                product_cost: variant?.retail_price ?? 0,
                product_name: product.company + " " + product.name,
                product_variant_name: variant.name,
                product_sku: product.sku,
                quantity: 1,
                transaction_type: "Out",

                product: product,
                variant_information: variant ?? product.variants[0],
                active_promotions: promotions,

                tags: product.tags
            };

            new_order_products_state = [ ...orderProducts, po ]
        }

        return new_order_products_state
    }, [inspectingProduct])

    return (
        <>
            <ReactBarcodeReader
                onScan={(e: any) => {
                    // debouncedResults(e, "product");
                }}
            />

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) < 640 && kioskPanel !== "cart") ?
                    <></>
                    :
                    <KioskMenu
                        addToCart={addToCart}
                    />
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