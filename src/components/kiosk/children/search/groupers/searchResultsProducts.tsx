import { useAtomValue } from "jotai";

import { searchResultsAtomic } from "@atoms/search";
import { Product, Promotion } from "@utils/stockTypes";
import { ItemProduct } from "../results/itemProduct";

export function SearchResultsProducts() {
    const searchResults = useAtomValue(searchResultsAtomic)

    if (searchResults.length == 0) {
        return <p className="self-center text-gray-400 py-6">No products with this name</p>
    }

    return (
        <>
            {
                (searchResults as { product: Product, promotions: Promotion[]}[])
                    .map((result, index) => {
                    return result.product ? (
                        <ItemProduct 
                            key={`SEARCH_RESULT_PRODUCT_${result.product.sku}`} 
                            promotions={result.promotions} 
                            product={result.product} 
                            index={index} 
                        />
                    ) : (<></>)
                })
            }
        </>
    )
}