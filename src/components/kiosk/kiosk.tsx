import Image from "next/image";
import { createRef, useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";
import { ReactBarcodeReader } from "../common/scanner";
import { v4 } from "uuid"
import { DbOrder, MasterState, Order, Product, ProductPurchase, Promotion, StrictVariantCategory, VariantInformation } from "../../utils/stock_types";
import { fromDbDiscount } from "../../utils/discount_helpers";
import PaymentMethod from "./children/payment/paymentMethodMenu";
import DispatchMenu from "./children/foreign/dispatchMenu";
import PickupMenu from "./children/foreign/pickupMenu";
import CartMenu from "./children/order/cartMenu";
import KioskMenu from "./kioskMenu";
import moment from "moment"
import {OPEN_STOCK_URL, useWindowSize} from "../../utils/helpers";
import CustomerMenu from "./children/customer/customerMenu";
import RelatedOrders from "./children/order/relatedMenu";
import { PAD_MODES } from "../../utils/kiosk_types";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ordersAtom } from "@/src/atoms/transaction";
import { CompletedOrderMenu } from "./children/order/completed/completedOrderMenu";
import { DiscountScreen } from "./children/discount/discountScreen";
import { NotesScreen } from "./children/notesScreen";
import { DispatchHandler } from "./children/foreign/dispatchHandler";
import { CashPayment } from "./children/payment/cashPayment";
import { TransactionScreen } from "./children/order/transactionScreen";
import { TerminalPayment } from "./children/payment/terminalPayment";
import { searchResultsAtom, searchResultsAtomic } from "@/src/atoms/search";
import { activeDiscountAtom, kioskPanelAtom } from "@/src/atoms/kiosk";

export default function Kiosk({ master_state, setLowModeCartOn, lowModeCartOn }: { master_state: MasterState, setLowModeCartOn: Function, lowModeCartOn: boolean }) {
    const [ orderState, setOrderState ] = useAtom(ordersAtom)
    const [ kioskPanel, setKioskPanel ] = useAtom(kioskPanelAtom) 

    const discount = useAtomValue(activeDiscountAtom)
    const setSearchResults = useSetAtom(searchResultsAtomic)

    /// --- REPLACE THESE ---
    const [ activeProduct, setActiveProduct ] = useState<Product | null>(null);
    const [ activeVariant, setActiveVariant ] = useState<StrictVariantCategory[] | null>(null);
    const [ activeProductVariant, setActiveProductVariant ] = useState<VariantInformation | null>(null);
    const [ activeVariantPossibilities, setActiveVariantPossibilities ] = useState<(StrictVariantCategory[] | null)[] | null>(null);
    /// --- REPLACE THESE ---

    const [ searchTermState, setSearchTermState ] = useState("");
    const [ activeProductPromotions, setActiveProductPromotions ] = useState<Promotion[]>();

    const addToCart = (product: Product, promotions: Promotion[], variant: VariantInformation, orderProducts: ProductPurchase[]) => {
        const existing_product = orderProducts.find(k => k.product_code == variant.barcode ); // && isEqual(k.variant, variant?.variant_code)
        let new_order_products_state = [];

        if(existing_product) {
            const matching_product = orderProducts.find(e => e.product_code == variant.barcode); // && (applyDiscount(1, findMaxDiscount(e.discount, e.variant_information.retail_price, false).value) == 1)
            
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
        }else {
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

        // if(kioskPanel == "cart" && discount.product?.barcode == "CART") {
        //     setKioskPanel("cart")
        //     // setDiscount({
        //     //     type: "absolute",
        //     //     for: "cart",
        //     //     product: {
        //     //         name: "",
        //     //         stock: [],
        //     //         images: [],
        //     //         /// The group codes for all sub-variants; i.e. is White, Short Sleeve and Small.
        //     //         variant_code: [],
        //     //         order_history: [],
        //     //         /// impl! Implement this type!
        //     //         stock_information: {
        //     //             stock_group: "string",
        //     //             sales_group: 'string',
        //     //             value_stream: 'string',
        //     //             brand: 'string',
        //     //             unit: 'string',
        //     //             tax_code: 'string',
        //     //             weight: 'string',
        //     //             volume: 'string',
        //     //             max_volume: 'string',
        //     //             back_order: false,
        //     //             discontinued: false,
        //     //             non_diminishing: false,
        //     //             shippable: true
        //     //         },
        //     //         loyalty_discount: {
        //     //             Absolute: 0
        //     //         },
        //     //         id: "",
        //     //         barcode: "CART",
        //     //         marginal_price: new_order_products_state?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.marginal_price), 0),
        //     //         retail_price: new_order_products_state?.reduce((prev, curr) => prev += (curr.quantity * curr.variant_information.retail_price), 0)
        //     //     },
        //     //     value: 0,
        //     //     exclusive: false,
        //     //     orderId: ""
        //     // })
        // }

        return new_order_products_state;
    }

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

                let vmap_list = [];
                let active_variant = null;
                let active_product_variant = null;

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

                    const new_pdt_list = addToCart(e, data[0].promotions, active_product_variant, cOs.products);
                    const new_order_state = orderState.map(e => e.id == cOs?.id ? { ...cOs, products: new_pdt_list } : e);

                    setOrderState(sortOrders(new_order_state))
                }else {
                    setActiveProduct(e);
                    setActiveVariantPossibilities(vmap_list);
                    setActiveVariant(active_variant ?? vmap_list[0]);
                    setActiveProductVariant(active_product_variant ?? e.variants[0]);
                }
            }
    
            setSearchResults(data);
        }, 50);
    }, [orderState, discount]);

    const input_ref = createRef<HTMLInputElement>();
    const window_size = useWindowSize();


    const [ triggerRefresh, setTriggerRefresh ] = useState(["a"]);

    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            <ReactBarcodeReader
                inputRef={input_ref}
                onScan={(e: any) => {
                    debouncedResults(e, "product");
                }}
            />

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) < 640 && kioskPanel !== "cart") ?
                    <></>
                    :
                    <KioskMenu
                        setActiveProduct={setActiveProduct} activeProduct={activeProduct}
                        setTriggerRefresh={setTriggerRefresh} triggerRefresh={triggerRefresh}
                        setActiveProductPromotions={setActiveProductPromotions} activeProductPromotions={activeProductPromotions ?? []}
                        setSearchTermState={setSearchTermState} searchTermState={searchTermState}
                        setActiveVariantPossibilities={setActiveVariantPossibilities} activeVariantPossibilities={activeVariantPossibilities}
                        setActiveVariant={setActiveVariant} activeVariant={activeVariant}
                        setActiveProductVariant={setActiveProductVariant} activeProductVariant={activeProductVariant}
                        input_ref={input_ref}
                        addToCart={addToCart}
                        debouncedResults={debouncedResults}
                    />
            }

            {
                ((window_size.width ?? 0) < 640 && lowModeCartOn) || ((window_size.width ?? 0) >= 640) || (kioskPanel !== "cart") ?
                    (() => {
                        switch(kioskPanel) {
                            case "cart":
                                return (
                                    <CartMenu
                                        setActiveProductPromotions={setActiveProductPromotions}
                                        setActiveProduct={setActiveProduct} 
                                        setActiveProductVariant={setActiveProductVariant}
                                        input_ref={input_ref}
                                    />
                                )
                            case "customer":
                                return (
                                    <CustomerMenu />
                                )
                            case "customer-create":
                                return (
                                    <CustomerMenu />
                                )
                            case "related-orders":
                                return (
                                    <RelatedOrders
                                        activeProductVariant={activeProductVariant}
                                        />
                                )
                            case "select-payment-method":
                                return (
                                    <PaymentMethod />
                                )
                            case "inv-transaction":
                                return (
                                    <TransactionScreen />
                                )
                            case "await-debit":
                                // On completion of this page, ensure all payment segments are made, i.e. if a split payment is forged, return to the payment select screen with the new amount to complete the payment. 
                                return (
                                    <TerminalPayment />
                                )
                            case "completed":
                                return (
                                    <CompletedOrderMenu />
                                )
                            case "discount":
                                return (
                                    <DiscountScreen />
                                )
                            case "await-cash":
                                // On completion of this page, ensure all payment segments are made, i.e. if a split payment is forged, return to the payment select screen with the new amount to complete the payment. 
                                return (
                                    <CashPayment />
                                )
                            case "note":
                                return (
                                    <NotesScreen />
                                )
                            case "pickup-from-store":
                                return (
                                    <DispatchHandler inputRef={input_ref} title="Pickup from Store">
                                        <PickupMenu />
                                    </DispatchHandler>
                                )
                            case "ship-to-customer":
                                return (
                                    <DispatchHandler inputRef={input_ref} title="Ship order to customer">
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

export function sortOrders(orders: Order[]) {
    return orders.sort((a, b) => a.order_type == "direct" ? -1 : 0)
}

export function sortDbOrders(orders: DbOrder[]) {
    return orders.sort((a, b) => a.order_type == "direct" ? -1 : 0)
}

export function getDate(): string {
    return ""
    // return new Date().toString()
    // return moment(new Date(), 'DD/MM/YYYY', true).format()
}

function unite(...data: any[]) {
    return [].concat.apply([], data).reduce((result, current) => {
      return ~result.indexOf(current)
      ? result
      : result.concat(current)
    }, []);
}