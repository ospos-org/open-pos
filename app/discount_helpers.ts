import { DiscountValue, Product, StrictVariantCategory } from "./stock-types";

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

export function fromDbDiscount(dbDiscount: { Absolute?: string, Percentage?: string }) {
    if(dbDiscount.Absolute) {
        return `a|${dbDiscount.Absolute}`
    }else {
        return `p|${dbDiscount.Percentage}`
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