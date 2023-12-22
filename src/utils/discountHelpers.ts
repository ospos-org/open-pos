import { Product } from "@/generated/stock/Api";
import {
    ContextualDiscountValue,
    ContextualProductPurchase,
    Promotion,
    StrictVariantCategory
} from "./stockTypes";

export function isValidVariant(activeProduct: Product, activeVariant: StrictVariantCategory[]) {
    return activeProduct.variants.find(e => {
        let comparative_map = e.variant_code.map(b => {
            return activeVariant?.find(c => c.variant.variant_code == b)
        });
    
        let filtered = comparative_map.filter(s => !s);
        let active = filtered.length <= 0;

        return active;
    })
}

export function applyDiscountsConsiderateOfQuantity(
    currentQuantity: number, 
    discounts: ContextualDiscountValue[],
    price: number, 
    customerActive: boolean
) {
    // Here we have the following:
    // --- 
    // Each discount has its own "applicable quantity". When this is 0,
    // the discount can **no longer be applied**, as its usable quantity
    // has been exhausted.
    //
    // We can then iterate over each discount given to the product, reducing
    // and removing each discount when it has been "exhausted".

    let savings = 0;
    let exhaustiblePromotions: ContextualDiscountValue[] = JSON.parse(JSON.stringify(discounts.filter(b => b.source == "promotion" || b.source == "user")));

    // While we have quantity to serve, and promotions to apply...
    while(currentQuantity > 0 && exhaustiblePromotions.length > 0)
    {
        const maximumDiscountFound = findMaxDiscount(exhaustiblePromotions, price, customerActive);

        // While we can apply the promotion
        while(currentQuantity > 0 && maximumDiscountFound[0].applicable_quantity > 0 || maximumDiscountFound[0].applicable_quantity === -1) {
            // Reduce both applicable and current quantities
            maximumDiscountFound[0].applicable_quantity -= 1;
            currentQuantity -= 1;
            
            const discount = maximumDiscountFound[0].value;
            savings += (price - applyDiscount(price, discount));
        }

        // Remove the promotion, it has been exhausted.
        exhaustiblePromotions = exhaustiblePromotions.filter((b, i) => i !== maximumDiscountFound[1]);
    }

    if (savings === 0) {
        // We have no savings, lets try default to non-"promotion" sources.
        let otherPromotions = discounts.filter(b => b.source == "loyalty")

        // Only applies ONE, loop this if needed.
        const maximumDiscountFound = findMaxDiscount(otherPromotions, price, customerActive);
        savings += (price - applyDiscount(price, maximumDiscountFound[0].value));
    }

    return savings
}

export function applyDiscount(price: number, discount: string) {
    if(discount == "") discount = "a|0";
    
    let d = discount.split("|");

    if(d[0] == "a" || d[0] == "A") {
        // Absolute value
        let discount_absolute = parseInt(d[1]);
        return price - discount_absolute;
    }else if (d[0] == "p" || d[0] == "P") {
        // Percentage value
        let discount_percentage = parseInt(d[1]);
        return (price) - (price * (discount_percentage / 100))
    }

    return 1
}

export function isGreaterDiscount(predicate: string, discount: string, price: number) {
    let predicatedDiscount = applyDiscount(price, predicate);
    let discountedDiscount = applyDiscount(price, discount);

    return discountedDiscount < predicatedDiscount 
}

export function parseDiscount(discount: string) {
    let d = discount.split("|");

    if(d[0] == "a" || d[0] == "A") {
        // Absolute value
        let discount_absolute = parseFloat(d[1]);
        return `$${discount_absolute.toFixed(2)}`;
    }else if (d[0] == "p" || d[0] == "P") {
        // Percentage value
        let discount_percentage = parseFloat(d[1]);
        return `${discount_percentage.toFixed(2)}%`
    }
}

export function fromDbDiscount(dbDiscount: { Absolute?: number, Percentage?: number }) {
    if(dbDiscount.Absolute) {
        return `a|${dbDiscount.Absolute ?? 0}`
    }else {
        return `p|${dbDiscount.Percentage ?? 0}`
    }
}

export function toDbDiscount(discount: string): { Absolute?: number, Percentage?: number } {
    let d = discount.split("|");

    if(d[0] == "a" || d[0] == "A") {
        return {
            Absolute: parseFloat(d[1] ?? "0")
        }
    }else if (d[0] == "p" || d[0] == "P") {
        return {
            Percentage: parseFloat(d[1] ?? "0")
        }
    }

    return {
        Absolute: parseFloat(d[1] ?? "0")
    }
}

export function findMaxDiscount(
    discountValues: ContextualDiscountValue[],
    productValue: number,
    loyalty: boolean
): [ContextualDiscountValue, number] {
    let max_discount = {
        value: "a|0",
        source: "user",
        applicable_quantity: -1,
    } as ContextualDiscountValue;

    let index = 0;

    for(let i = 0; i < discountValues.length; i++) {
        if(discountValues[i].source == "loyalty" && !loyalty) { continue; }

        if(isGreaterDiscount(max_discount.value, discountValues[i].value, productValue)) {
            max_discount = discountValues[i]
            index = i;
        }
    }

    return [max_discount, index]
}

export function findMaxDiscountDb(discountValues: { Absolute?: number, Percentage?: number }[], productValue: number, loyalty: boolean) {
    let max_discount = {
        Absolute: 0,
    } as { Absolute?: number, Percentage?: number };

    for(let i = 0; i < discountValues.length; i++) {
        // if(discountValues[i].source == "loyalty" && !loyalty) { continue; }

        if(isGreaterDiscount(fromDbDiscount(max_discount), fromDbDiscount(discountValues[i]), productValue)) {
            max_discount = discountValues[i]
        }
    }

    return max_discount
}

export function stringValueToObj(discount: string): { value: number, type: "absolute" | "percentage" } {
    let d = discount.split("|");

    if(d[0] == "a" || d[0] == "A") {
        return {
            value: parseFloat(d[1]),
            type: "absolute"
        }
    }else {
        return {
            value: parseFloat(d[1]),
            type: "percentage"
        }
    }
}

export function toAbsoluteDiscount(discount: string, price: number) {
    let d = discount.split("|");

    if(d[0] == "a" || d[0] == "A") {
        return `a|${parseFloat(d[1])}`
    }else {
        return `a|${(parseFloat(d[1]) / 100) * price}`
    }
}

export function applyPromotion(promo: Promotion, pdt: ContextualProductPurchase, pdt_map: Map<string, ContextualProductPurchase>): number {
    let total_quantity = 0;
    pdt_map.forEach(b => total_quantity += b.quantity);

    // If the product does not match the BUY criterion
    if(promo.get.Specific && !pdt_map.get(promo.get.Specific[0])) return 0;
    if(promo.get.Category && !pdt.product.tags.includes(promo.get.Category?.[0])) return 0;

    // If promotion is a SoloThis or This type and the bought product is not <pdt>
    else if((promo.get.SoloThis || promo.get.This) && promo.buy.Specific && pdt.id != promo.buy.Specific[0]) return 0;

    // Product is the one in the GET condition...
    // Note: Any will only match the current product, and will not incur a search for another matching product as the function is called in a search-pattern.
    
    // Determine if product in the BUY condition is in the cart, if instead fits <promo.buy.Any>, no condition is necessary as the product is within categoric bounds.
    if(promo.buy.Specific && !pdt_map.get(promo.buy.Specific[0])) return 0

    // Check matches quantity condition for buy
    if(promo.buy.Any && promo.buy.Any > pdt.quantity && promo.buy.Any > total_quantity) return 0;
    else if(promo.buy.Specific && promo.buy.Specific[1] > (pdt_map.get(promo.buy.Specific[0])?.quantity ?? 0)) return 0;

    const discount = discountFromPromotion(promo);

    // Is promotion for THIS or for ANOTHER?
    if(promo.get.Specific && pdt.product.sku == promo.get.Specific?.[0]) {
        // is for THIS
        const normal_price = (pdt.variant_information.retail_price * 1.15);
        const discounted_price = applyDiscount(normal_price, fromDbDiscount(discount));
        return normal_price - discounted_price;

    }else if(promo.get.Specific && pdt_map.get(promo.get.Specific[0])) {
        // is for ANOTHER
        const prd_pur = pdt_map.get(promo.get.Specific[0]);
        const normal_price = (prd_pur!.variant_information.retail_price * 1.15);
        const discounted_price = applyDiscount(normal_price, fromDbDiscount(discount));
        return normal_price - discounted_price;
    }else {
        // impl! Handle category case?
        const normal_price = (pdt.variant_information.retail_price * 1.15);
        const discounted_price = applyDiscount(normal_price, fromDbDiscount(discount));
        return normal_price - discounted_price;
    }
}

export function discountFromPromotion(promo: Promotion): { Absolute?: number | undefined, Percentage?: number | undefined } {
    const discount: { Absolute?: number | undefined, Percentage?: number | undefined } 
        = promo.get.Any 
          ? promo.get.Any[1] : 
          promo.get.SoloThis 
          ? promo.get.SoloThis : 
          promo.get.Specific 
          ? promo.get.Specific[1][1] : 
          promo.get.This 
          ? promo.get.This[1] : 
          promo.get.Category 
          ? promo.get.Category[1][1] :
          { Absolute: 0 };

    return discount;
}

export const isEquivalentDiscount = (a: ContextualDiscountValue, b: ContextualDiscountValue, product_cost: number) => {
    if(a.value == b.value && applyDiscount(product_cost, a.value) == applyDiscount(product_cost, b.value)) {
        return true;
    }
    
    return false;
}