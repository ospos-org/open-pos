import { customAlphabet } from "nanoid";
import { applyPromotion } from "./discountHelpers";
import { ProductAnalysis } from "./kioskTypes";
import { ProductPurchase, Promotion } from "./stockTypes";

export const determineOptimalPromotionPathway = (products: ProductPurchase[]) => {
    const analysis_list: ProductAnalysis[] = [];
    const product_map = new Map<string, ProductPurchase>();

    products.map(k => {
        const pdt = product_map.get(k.product.sku);

        if(pdt) {
            product_map.set(k.product.sku, {
                ...k,
                quantity: pdt.quantity+k.quantity
            })
        }else {
            product_map.set(k.product.sku, k)
        }
    })

    products.map(b => {
        // Run promotion simulation
        const mapped: [Promotion, number][] = b.active_promotions.map(d => {
            return [d, applyPromotion(d, b, product_map)] as [Promotion, number]
        }).sort((a: [Promotion, number], b: [Promotion, number]) =>  b[1] - a[1])

        // Put all (for quantity) in list to analyze.
        for(let i = 0; i < b.quantity; i++){
            analysis_list.push({
                id: customAlphabet(`1234567890abcdef`, 10)(35),
                reference_field: {
                    barcode: b.variant_information.barcode
                },
                tags: b.product.tags,
                chosen_promotion: null,
                promotion_list: b.active_promotions,
                promotion_sim: mapped,
                utilized: null,
                is_joined: false
            })
        }
    });

    const product_queue = [...analysis_list.map(b => b.id)];

    while(product_queue.length > 0) {
        const elem = product_queue.pop();
        const indx_of = analysis_list.findIndex(k => k.id == elem);

        let point = analysis_list[indx_of];

        if (!point) continue;

        let promotional_index = 0;
        let optimal_promotion: [Promotion, number] | null = point.promotion_sim[0];
        let external_source_id: string | null = null;

        //console.log("--- WITH: ", products.find(b =>
            // b.variant_information.barcode == point.reference_field.barcode
        // ), point)

        while (true) {
            if (optimal_promotion == null) break;
            if (optimal_promotion[0].get.Category || optimal_promotion[0].get.Any || optimal_promotion[0].get.Specific) {
                // Is impacting an external source...
    
                // Find an appropriate external source by checking those remaining in the queue
                product_queue.map(ref => {
                    const indx_of_other = analysis_list.findIndex(k => 
                        k.id !== point.id   && 
                        k.id == ref         &&
                        k.utilized == null  && 
                        !k.is_joined        
                    );

                    if(indx_of_other == -1) return;

                    const val = analysis_list[indx_of_other];
    
                    if(val) {
                        // If function exists and meets criterion:

                        // If is the product bought
                        if(
                            optimal_promotion 
                            && 
                            (
                                optimal_promotion[0].buy.Any 
                                || 
                                (
                                    optimal_promotion[0].buy.Category 
                                    && 
                                    point.tags.includes(optimal_promotion[0].buy.Category?.[0])
                                )
                                || 
                                (
                                    optimal_promotion[0].buy.Specific 
                                    && 
                                    products.find(b =>
                                        b.variant_information.barcode == point.reference_field.barcode
                                    )?.product_sku 
                                    == 
                                    optimal_promotion[0].buy.Specific[0]
                                )
                            )
                        )
                            if(optimal_promotion && optimal_promotion[0].get.Category) {
                                //console.log("Matching Category?", optimal_promotion[0].get);

                                if(val.tags.includes(optimal_promotion[0].get.Category?.[0] ?? "")) {
                                    external_source_id = val.id;
                                }
                            }else if(optimal_promotion && optimal_promotion[0].get.Any) {
                                //console.log("Matching Any?", products.find(b => b.variant_information.barcode == val.reference_field.barcode)?.product.name, optimal_promotion[0].get);

                                external_source_id = val.id;
                            }else if(optimal_promotion && optimal_promotion[0].get.Specific ) {
                                const product_ref = products.findIndex(b => b.variant_information.barcode == val.reference_field.barcode);
        
                                if(product_ref !== -1) {
                                    //console.log("Matching Specific?", products[product_ref], optimal_promotion[0].get);

                                    if(products[product_ref].product_sku == optimal_promotion[0].get.Specific[0]) {
                                        // Has the *specific* product in cart
                                        external_source_id = val.id;
                                    }
                                }
                            }   
                    }
                })
    
                if(external_source_id == null) {
                    // No suitable product could be determined. Promotion will not be applied, skipping to next best.
                    promotional_index += 1;
                    if(promotional_index >= point.promotion_sim.length-1) optimal_promotion = null;
                    else optimal_promotion = point.promotion_sim[promotional_index];
                }else {
                    break;
                }
            } else {
                break;
            }
        }
        
        let should_apply = true;

        if (optimal_promotion != null && (point.utilized != null || point.is_joined)) { // && !point.is_joined
            const external_indx = analysis_list.findIndex(k => k.id == point.utilized?.utilizer);
            if(external_indx == -1) break;

            const external_ref = analysis_list[external_indx];
            
            // If the current promotion provides a greater saving than the external, replace.
            if (optimal_promotion[1] > (external_ref.chosen_promotion?.saving ?? 0)) {
                should_apply = true;

                // Recursively delete and push
                const delete_and_push = (id: string) => {
                    //console.log("DELETE EXTERN: ", id);
                    const ext = analysis_list.findIndex(k => k.id == id);
                    if(ext == -1) return;

                    // Delete Fields...
                    analysis_list[ext].utilized = null;
                    analysis_list[ext].chosen_promotion = null;

                    // Push into queue
                    product_queue.push(id);
                    
                    if(analysis_list[ext].utilized != null && analysis_list[ext]!.utilized!.utilizer !== null) 
                        delete_and_push(analysis_list[ext]!.utilized!.utilizer)
                }

                delete_and_push(external_ref.id);
            } else {
                should_apply = false;
            }
        }

        if (optimal_promotion && should_apply) {
            if (external_source_id != null) {
                const external_indx = analysis_list.findIndex(k => k.id == external_source_id);
                analysis_list[indx_of].is_joined = true;
                
                analysis_list[external_indx].utilized = {
                    utilizer: point.id,
                    saving: optimal_promotion[1],
                    promotion: optimal_promotion[0]
                };

                analysis_list[external_indx].chosen_promotion = {
                    external: true,
                    promotion: null,
                    saving: optimal_promotion[1]
                };

                analysis_list[external_indx].is_joined = false;
            } else {
                point.is_joined = false;
            }

            // --- Correctly Apply New Promotion --- // 
            point.chosen_promotion = {
                promotion: optimal_promotion[0],
                saving: optimal_promotion[1],
                external: false // Is the external unit.
            };
            point.utilized = null;
        }
        
        analysis_list[indx_of] = point;
        //console.log("EOL:", JSON.parse(JSON.stringify( analysis_list )));
    }

    //console.log("Analysis", [...analysis_list.map(k => k.chosen_promotion)]);
    return analysis_list;
}