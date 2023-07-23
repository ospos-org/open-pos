import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { debounce } from "lodash";
import { v4 } from "uuid"

import { Product, ProductPurchase, StrictVariantCategory, VariantInformation } from "@utils/stockTypes";
import { activeDiscountAtom, kioskPanelLogAtom } from "@atoms/kiosk";
import { searchResultsAtomic, searchTermAtom } from "@atoms/search";
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
    const discount = useAtomValue(activeDiscountAtom)
    
    const setSearchResults = useSetAtom(searchResultsAtomic)
    const setSearchTermState = useSetAtom(searchTermAtom)

    const [ orderState, setOrderState ] = useAtom(ordersAtom)
    const [ inspectingProduct, setInspectingProduct ] = useAtom(inspectingProductAtom)


    const [ triggerRefresh, setTriggerRefresh ] = useState(["a"]);
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

    const debouncedResults = useMemo(() => {
        return debounce(async (searchTerm: string, searchType: string) => {
            if(searchTerm == "") {
                setSearchTermState(searchTerm);
                return;
            }
    
            var myHeaders = new Headers();
            myHeaders.append("Cookie", `${document.cookie}`);
    
            setSearchTermState(searchTerm);
    
            const fetchResult = await fetch(`${OPEN_STOCK_URL}/${searchType.substring(0, searchType.length-1)}/${searchType == "transactions" ? "ref" : searchType == "products" ? "search/with_promotions" : "search"}/${searchTerm.trim()}`, {
                method: "GET",
                headers: myHeaders,
                redirect: "follow",
                credentials: "include"
            });
    
            const data: { product: any, promotions: any[] }[] = await fetchResult.json();

            console.log(data);

            if(data.length == 1 && searchType == "product") {
                const e: Product = data[0].product;

                let vmap_list: (StrictVariantCategory[] | null)[] = [];
                let active_variant: StrictVariantCategory[] | null = null;
                let active_product_variant: VariantInformation | null = null;

                for(let i = 0; i < e.variants.length; i++) {
                    const var_map = e.variants[i].variant_code.map(k => {
                        // Replace the variant code with the variant itself.
                        return e.variant_groups.map(c => {
                            let nc = c.variants.map(l => k == l.variant_code ? { category: c.category, variant: l } : false)

                            return nc.filter(l => l)
                        });
                    }).flat();

                    // Flat map of the first variant pair. 
                    const vlist: StrictVariantCategory[] = var_map.map(e => e.length > 0 ? e[0] : false).filter(e => e) as StrictVariantCategory[];

                    if(e.variants[i].barcode == searchTerm) {
                        active_variant = vlist;
                        active_product_variant = e.variants[i];
                    }
                    
                    vmap_list.push(vlist);
                }

                if(active_product_variant) {
                    let cOs = orderState.find(e => e.order_type == "direct");

                    if(!cOs?.products) {
                        if(orderState[0].products) {
                            cOs = orderState[0];
                        }else {
                            return;
                        }
                    }

                    const new_pdt_list = addToCart(cOs.products);
                    const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                    setOrderState(sortOrders(new_order_state))
                }else {
                    setInspectingProduct((currentProduct) => ({
                        ...currentProduct,
                        activeProduct: e,
                        activeVariantPossibilities: vmap_list,
                        activeVariant: active_variant ?? vmap_list[0],
                        activeProductVariant: active_product_variant ?? e.variants[0]
                    }))
                }
            }
    
            setSearchResults(data);
        }, 50);
    }, [orderState, discount, addToCart, setInspectingProduct, setOrderState, setSearchResults]);

    
    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            <ReactBarcodeReader
                onScan={(e: any) => {
                    debouncedResults(e, "product");
                }}
            />

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) < 640 && kioskPanel !== "cart") ?
                    <></>
                    :
                    <KioskMenu
                        setTriggerRefresh={setTriggerRefresh} triggerRefresh={triggerRefresh}
                        debouncedResults={debouncedResults}
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