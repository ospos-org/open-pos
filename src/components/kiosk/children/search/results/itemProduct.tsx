import { inspectingCustomerAtom } from "@/src/atoms/customer";
import { masterStateAtom } from "@/src/atoms/openpos";
import { inspectingProductAtom } from "@/src/atoms/product";
import { searchFocusedAtom, searchResultsAtomic } from "@/src/atoms/search";
import { useWindowSize } from "@/src/hooks/useWindowSize";
import { useAtomValue, useSetAtom } from "jotai";
import Image from "next/image";
import {Product, ProductWPromotion, Promotion} from "@/generated/stock/Api";
import {StrictVariantCategory} from "@utils/stockTypes";

interface ItemProductProps {
    value: ProductWPromotion
    index: number
}

export function ItemProduct({ value: { product, promotions }, index }: ItemProductProps) {
    const searchResults = useAtomValue(searchResultsAtomic)
    const currentStore = useAtomValue(masterStateAtom)
    
    const setInspectingCustomer = useSetAtom(inspectingCustomerAtom) 
    const setInspectingProduct = useSetAtom(inspectingProductAtom)
    const setSearchFocused = useSetAtom(searchFocusedAtom)

    const windowSize = useWindowSize();

    return (
        <div className="flex flex-col overflow-hidden h-fit" onClick={() => {
            setInspectingCustomer(null);
            setSearchFocused(false);

            let vmap_list = [];

            for(let i = 0; i < product.variants.length; i++) {
                const var_map = product.variants[i].variant_code.map(k => {
                    // Replace the variant code with the variant itself.
                    return product.variant_groups.map(c => {
                        let nc = c.variants.map(l =>
                            k == l.variant_code ?
                                { category: c.category, variant: l }
                                : undefined
                        )

                        return nc.filter(l => l !== undefined) as StrictVariantCategory[];
                    });
                }).flat();

                // Flat map of the first variant pair.
                let vlist: StrictVariantCategory[] = var_map
                    .map(e => e.length > 0 ? e[0] : undefined)
                    .filter(e => e !== undefined) as StrictVariantCategory[];

                vmap_list.push(vlist);
            }

            setInspectingProduct({
                activeProduct: product,
                activeProductPromotions: promotions,
                activeVariantPossibilities: vmap_list,
                activeVariant: vmap_list[0],
                activeProductVariant: product.variants[0]
            })
        }}>
            <div className="grid items-center gap-4 p-4 hover:bg-gray-400 hover:bg-opacity-10 cursor-pointer" style={{ gridTemplateColumns: (windowSize?.width ?? 0) < 1536 ? (windowSize?.width ?? 0) < 640 ? "50px 1fr 0px 75px" : "50px minmax(180px, 1fr) 225px 100px" : "50px minmax(200px, 1fr) minmax(300px, 2fr) 250px 125px" }}>
                <Image height={50} width={50} alt="" src={product.images[0]} className="rounded-sm"></Image>

                <div className="flex flex-col gap-0 max-w-[26rem] w-full flex-1">
                    <p>{product.name}</p>
                    <p className="text-sm text-gray-400">{product.company}</p>
                </div>

                <div className="hidden 2xl:flex flex-row items-center gap-2 flex-1 flex-wrap ">
                    {
                        product.variant_groups.map((variantGroup) => {
                            return (
                                <div key={variantGroup.category} className="bg-gray-600 flex flex-row items-center py-1 px-2 rounded-md gap-2 max-h-fit">
                                    <p>{variantGroup.category}s </p>

                                    <div className="text-gray-300">
                                        {
                                            variantGroup.variants.map((k, i) => {
                                                return (i == variantGroup.variants.length-1) ? k.name : (k.name+", ")
                                            })
                                        }
                                    </div>
                                </div>
                            )
                        })
                    }
                </div>

                <div className="flex-1">
                    {
                        (() => {
                            const total_stock = product.variants.map(k => {
                                return k.stock.map(b => {
                                    return (b.quantity.quantity_sellable);
                                }).reduce(function (prev, curr) {
                                    return prev + curr
                                }, 0);
                            }).reduce(function (prev, curr) {
                                return prev + curr
                            }, 0);

                            const total_stock_in_store = product.variants.map(k => {
                                return k.stock.map(b => {
                                    let total = 0;

                                    if(b.store.store_id == currentStore.store_id) {
                                        total += (b.quantity.quantity_sellable);
                                    }

                                    return total;
                                }).reduce(function (prev, curr) {
                                    return prev + curr
                                }, 0);
                            }).reduce(function (prev, curr) {
                                return prev + curr
                            }, 0);

                            return (
                                <div className="hidden md:flex flex-row items-center gap-2">
                                    {
                                    total_stock_in_store <= 0 ? 
                                    <p className="text-red-300 font-semibold">Out of stock</p>
                                    :
                                    <p>{total_stock_in_store} instore,</p>
                                }

                                    <p className="text-gray-400">{total_stock - total_stock_in_store} in other stores</p>
                                </div>
                            )
                        })()
                    }
                </div>

                <div className="flex flex-row items-center px-2 font-medium">
                    {
                        (() => {
                            const flat_map = product.variants.map(k => 
                                k.retail_price
                            );

                            const min_total = Math.min(...flat_map);
                            const max_total = Math.max(...flat_map);

                            if(max_total == min_total) {
                                return (
                                    <p>${(max_total * 1.15).toFixed(2)}</p>
                                )
                            }else {
                                return (
                                    <p>${(min_total * 1.15).toFixed(2)}-{(max_total * 1.15).toFixed(2)}</p>
                                )
                            }
                        })()
                    }
                    </div>
                </div>

                {
                    (index == searchResults.length-1) ? <></> : <hr className="border-gray-500" />
                }
        </div>
    )
}