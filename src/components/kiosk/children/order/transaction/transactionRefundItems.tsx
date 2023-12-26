import {Order, ProductPurchase} from "@/generated/stock/Api";
import {RESET} from "jotai/utils";
import {openStockClient} from "~/query/client";
import {fromDbDiscount} from "@utils/discountHelpers";
import {ContextualOrder, ContextualProductPurchase} from "@utils/stockTypes";
import {customAlphabet} from "nanoid";
import {useAtom, useSetAtom} from "jotai/index";
import {defaultKioskAtom, kioskPanelLogAtom, perfAtom} from "@atoms/kiosk";
import {customerAtom} from "@atoms/customer";
import {ordersAtom, transactionViewState} from "@atoms/transaction";
import {useAtomValue} from "jotai";

export default function TransactionRefundItems() {
    const activeTransaction = useAtomValue(transactionViewState.activeTransaction)

    const selectedItems= useAtomValue(transactionViewState.selectedItems);
    const customer= useAtomValue(transactionViewState.attachedCustomer);

    const setPerfState = useSetAtom(perfAtom)
    const setKioskState = useSetAtom(defaultKioskAtom)
    const setOrderState = useSetAtom(ordersAtom)
    const setKioskPanel = useSetAtom(kioskPanelLogAtom)
    const setCustomerState = useSetAtom(customerAtom)

    return (
        <div className="flex flex-row items-center gap-2">
            <div
                className={`text-white px-4 py-2 rounded-md ${selectedItems.length > 0 ? "bg-gray-600" : "bg-gray-800"} cursor-pointer hover:bg-gray-700`}
                onClick={() => {
                    if (!activeTransaction) return;
                    // We will have to change the current order to reflect the active transaction.
                    // Where the products being refunded with have a `TransactionType::In` status.
                    // --
                    //
                    // Products list: activeTransaction?.products

                    const products_being_returned = selectedItems.map((elem) => {
                        const reference = activeTransaction?.products.find(element => element.id === elem.product_id)
                        if (!reference) return undefined;

                        reference.quantity = elem.quantity;

                        reference.instances = reference?.instances.filter((_, index) => index < elem.quantity)
                        return reference
                    }).filter((elem) => (elem !== undefined)) as ProductPurchase[]

                    // We must restore the kiosk state to its default, upon which - we set the customer
                    // to the customer of this transaction. Following which, we set the transaction information
                    // to the active transaction, retaining the ID of the transaction, we will perform
                    // an UPDATE, instead of a POST.
                    setKioskState(RESET)
                    setPerfState({type: "continuative" as "continuative", transaction_id: activeTransaction.id})

                    const conv_to_product_purchase = products_being_returned.map(async (product) => {
                        const response = await openStockClient.product
                            .getWithAssociatedPromotions(parseInt(product.product_sku))

                        if (!response.ok) return;

                        const variant_info = response.data.product.variants
                            .find((element) => element.barcode === product.product_code)

                        if (!variant_info) return undefined;

                        return {
                            ...product,
                            product: response.data.product,
                            transaction_type: "In",
                            variant_information: variant_info,
                            active_promotions: response.data.promotions,
                            discount: [{
                                source: "user",
                                value: fromDbDiscount(product.discount),
                                applicable_quantity: -1
                            }]
                        } as ContextualProductPurchase
                    });

                    Promise.all(conv_to_product_purchase).then(fulfilled => {
                        const products = fulfilled
                            .filter(e => e !== undefined) as ContextualProductPurchase[]

                        const newOrder: ContextualOrder = {
                            ...activeTransaction,
                            products: products,
                            discount: "a|0",
                            reference: `CT${customAlphabet(`1234567890abcdef`, 10)(8)}`,

                        }

                        setOrderState([newOrder])
                        console.log([newOrder])

                        if (customer && "balance" in customer) setCustomerState(customer)
                        setKioskPanel("cart")
                    })

                }}>Refund Selected Items
            </div>

            <div
                className={`text-white px-4 py-2 rounded-md ${selectedItems.length > 0 ? "bg-gray-600" : "bg-gray-800"} cursor-pointer hover:bg-gray-700`}
                onClick={() => {
                    // ...
                }}>Print Order
            </div>
        </div>
    )
}