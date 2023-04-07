import { DiscountValue, Order, Product, ProductPurchase, Promotion, StrictVariantCategory } from "./stock-types";

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
        let discount_absolute = parseInt(d[1]);
        return `$${discount_absolute}`;
    }else if (d[0] == "p" || d[0] == "P") {
        // Percentage value
        let discount_percentage = parseInt(d[1]);
        return `${discount_percentage}%`
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

export function findMaxDiscount(discountValues: DiscountValue[], productValue: number, loyalty: boolean) {
    let max_discount = {
        value: "a|0",
        source: "user"
    } as DiscountValue;

    for(let i = 0; i < discountValues.length; i++) {
        if(discountValues[i].source == "loyalty" && !loyalty) { continue; }

        if(isGreaterDiscount(max_discount.value, discountValues[i].value, productValue)) {
            max_discount = discountValues[i]
        }
    }

    return max_discount
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

export function applyPromotion(promo: Promotion, pdt: ProductPurchase, pdt_map: Map<string, ProductPurchase>): number {
    // console.log(`TRYING "${promo.name}" ON ${pdt.product.name}:: ${JSON.stringify(promo.get)} & ${JSON.stringify(promo.buy)}.. ${pdt.product.sku} ${promo.get.Specific?.[0] ?? ""}`)

    // If the product does not match the BUY criterion
    if(promo.get.Specific && pdt.product.sku != promo.get.Specific?.[0]) return 0;
    if(promo.get.Category && !pdt.product.tags.includes(promo.get.Category?.[0])) return 0;

    // If promotion is a SoloThis or This type and the bought product is not <pdt>
    else if((promo.get.SoloThis || promo.get.This) && promo.buy.Specific && pdt.id != promo.buy.Specific[0]) return 0;

    // Product is the one in the GET condition...
    // Note: Any will only match the current product, and will not incur a search for another matching product as the function is called in a search-pattern.
    
    // Determine if product in the BUY condition is in the cart, if instead fits <promo.buy.Any>, no condition is necessary as the product is within categoric bounds.
    if(promo.buy.Specific && !pdt_map.get(promo.buy.Specific[0])) return 0

    // Check matches quantity condition for buy
    if(promo.buy.Any && promo.buy.Any > pdt.quantity) return 0;
    else if(promo.buy.Specific && promo.buy.Specific[1] > (pdt_map.get(promo.buy.Specific[0])?.quantity ?? 0)) return 0;

    const discount = discountFromPromotion(promo);
    
    const normal_price = (pdt.variant_information.retail_price * 1.15);
    const discounted_price = applyDiscount(normal_price, fromDbDiscount(discount));

    // console.log(`${pdt.product.name} W/ NP: ${normal_price} DOWN TO ${discounted_price} WITH PROMO ${promo.name}`)
 
    return normal_price - discounted_price;
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

export const isEquivalentDiscount = (a: DiscountValue, b: DiscountValue, product_cost: number) => {
    if(a.value == b.value && applyDiscount(product_cost, a.value) == applyDiscount(product_cost, b.value)) {
        return true;
    }
    
    return false;
}