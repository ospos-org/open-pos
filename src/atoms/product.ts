import { atomWithReset } from "jotai/utils";
import {Product, Promotion, VariantInformation} from "@/generated/stock/Api";
import {StrictVariantCategory} from "@utils/stockTypes";

interface ProductInspection {
    activeProduct: Product | null,
    activeVariant: StrictVariantCategory[] | null,
    activeProductVariant: VariantInformation | null,
    activeVariantPossibilities: (StrictVariantCategory[] | null)[] | null,
    activeProductPromotions: Promotion[]
}

const inspectingProductAtom = atomWithReset<ProductInspection>({
    activeProduct: null,
    activeVariant: null,
    activeProductVariant: null,
    activeVariantPossibilities: null,
    activeProductPromotions: []
})

export { inspectingProductAtom }