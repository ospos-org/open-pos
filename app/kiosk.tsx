import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { debounce } from "lodash";

type KioskState = {
    customer: string | null,
    transaction_type: string | null,
    products: Order[] | null,
    order_total: number | null,
    payment: {
        payment_method: "cash" | "card" | string | null,
        fulfillment_date: string | null
    },
    order_date: string | null,
    order_notes: string[] | null,
    order_history: string[] | null,
    salesperson: string | null,
    till: string | null
};

type Order = {
    id: string,
    destination: string,
    origin: string,
    products: ProductPurchase[],
    status: OrderStatus[],
    status_history: (OrderStatus[])[],
    order_history: string[],
    order_notes: string[],
    reference: string,
    creation_date: string,
    discount: string
}

type ProductPurchase = {
    product_code: string,
    variant: string,
    discount: string,

    product_cost: number,
    quantity: number,
}

type OrderStatus = {
    status: "queued" | "transit" | "processing" | "in-store" | "fulfilled" | "failed" | string,
    assigned_products: string[]
}

type Product = {
    name: string,
    company: string,
    variants: VariantCategory[],
    sku: string,
    loyalty_discount: string,
    images: string[],
    tags: string[],
    description: string,
    specifications: (string[])[]
}

type VariantCategory = {
    category: string,
    variants: Variant[]
}

type Variant = {
    name: string,
    stock: StockInfo[],
    images: string[],
    marginal_price: number,
    variant_code: string,
    order_history: string[],
    // impl! Flesh this type out correctly.
    stock_information: string
}

type StockInfo = {
    store: string,
    quantity: Quantity
}

type Quantity = {
    quantity_on_hand: number,
    quantity_on_order: number,
    quantity_on_floor: number
}

export default function Kiosk() {
    const [ kioskState, setKioskState ] = useState<KioskState>({
        customer: null,
        transaction_type: "OUT",
        products: [],
        order_total: null,
        payment: {
            payment_method: null,
            fulfillment_date: null
        },
        order_date: null,
        order_notes: null,
        order_history: null,
        salesperson: null,
        till: null
    });


    async function fetchData(searchTerm: string) {
        var myHeaders = new Headers();
        myHeaders.append("Cookie", `${document.cookie}`);

        const fetchResult = await fetch(`http://127.0.0.1:8000/product/name/${searchTerm}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow",
            credentials: "include"
        });

        console.log(fetchResult);

        const data = await fetchResult.json();

        setResult(data);
    }

    const [ searchTerm, setSearchTerm ] = useState("");
    const [ result, setResult ] = useState([]);
    const [ searchFocused, setSearchFocused ] = useState(false); 

    const debouncedResults = useMemo(() => {
        return debounce(fetchData, 50);
    }, []);
    
    useEffect(() => {
        return () => {
            debouncedResults.cancel();
        };
    });

    return (
        <>
            <div className="flex flex-col justify-between h-screen min-h-screen flex-1">
                <div className="flex flex-col p-4 gap-4">
                    <div className={`flex flex-row items-center p-4 rounded-sm bg-gray-700 gap-4 ${searchFocused ? "border-2 border-blue-500" : "border-2 border-gray-700"}`}>
                        <Image width="20" height="20" src="/icons/search-sm.svg" alt={''}></Image>
                        <input placeholder="Search" className="bg-transparent focus:outline-none text-white flex-1" 
                            onChange={(e) => debouncedResults(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            tabIndex={0}
                            // onBlur={() => setSearchFocused(false)}
                            onKeyDown={(e) => {
                                if(e.key == "Escape") {
                                    setSearchFocused(false)
                                    e.currentTarget.blur()
                                }
                            }}
                            />

                        {
                            searchFocused ? 
                            <Image width="20" height="20" src="/icons/x.svg" alt={''}></Image>
                            :
                            <Image width="20" height="20" src="/icons/scan.svg" alt={''}></Image>
                        }
                    </div>
                    
                    {
                        searchFocused ?
                        <div className="flex flex-1 flex-col flex-wrap gap-4 bg-gray-700 p-4 rounded-sm text-white">
                            {
                                result.map((e: Product, indx) => {
                                    return (
                                        <div key={e.sku}>
                                            {
                                                (indx == e.variants.length-1) ? <></> : <hr className="mb-4 border-gray-500" />
                                            }

                                            <div className="flex flex-row items-center gap-4">
                                                <Image height={50} width={50} alt="" src={e.images[0]} className="rounded-sm"></Image>
                                                
                                                <div className="flex flex-row items-center gap-2 max-w-md w-full flex-1">
                                                    <p>{e.company}</p>
                                                    <p>{e.name}</p>
                                                </div>

                                                <div>
                                                    {
                                                        e.variants.map(e => {
                                                            return (
                                                                <div key={e.category} className="bg-gray-600 flex flex-row items-center py-1 px-2 rounded-md gap-2">
                                                                    <p>{e.category}(s) </p>

                                                                    <div className="text-gray-300">
                                                                        {
                                                                            e.variants.map((k, i) => {
                                                                                return (i == e.variants.length-1) ? k.name : (k.name+", ")
                                                                            })
                                                                        }
                                                                    </div>
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </div>

                                                <div>
                                                    {
                                                        (() => {
                                                            const total_stock = e.variants.map(k => {
                                                                return k.variants.map(b => {
                                                                    let total = 0;

                                                                    for(let i = 0; i < b.stock.length; i++) {
                                                                        total += b.stock[i].quantity.quantity_on_hand;
                                                                    }

                                                                    return total;
                                                                }).reduce(function (accumVariable, curValue) {
                                                                    return accumVariable + curValue
                                                                }, 0);
                                                            })

                                                            return (
                                                                e.variants.map(k => {
                                                                    return k.variants.map(b => {
                                                                        return (
                                                                            <p key={`${e.sku}-${b.variant_code}`}>{total_stock} in stores</p>
                                                                        ) 
                                                                    })
                                                                })
                                                            )
                                                        })()
                                                    }
                                                </div>

                                                <div>
                                                    {
                                                        (() => {
                                                            let flat_map = e.variants.map(k => k.variants.flatMap(b => b.marginal_price));

                                                            let flat = [];

                                                            for (var i = 0; i < flat_map.length; ++i) {
                                                                for (var j = 0; j < flat_map[i].length; ++j)
                                                                    flat.push(flat_map[i][j]);
                                                            }

                                                            let min = Math.min.apply(null, flat),
                                                                max = Math.max.apply(null, flat);

                                                            if(min == max) {
                                                                return (
                                                                    <p>${max.toFixed(2)}</p>
                                                                )
                                                            }else {
                                                                return (
                                                                    <p>${min.toFixed(2)}-{max.toFixed(2)}</p>
                                                                )
                                                            }
                                                        })()
                                                    }
                                                </div>
                                            </div>

                                            
                                        </div>
                                        
                                    )
                                })
                            }
                        </div>
                        :
                        <div className="flex flex-1 flex-row flex-wrap gap-4 ">
                            {/* Tiles */}
                            {
                                kioskState.customer ? 
                                <div className="flex flex-col justify-between gap-8 bg-[#4c2f2d] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit"
                                    onClick={() => setKioskState({
                                        ...kioskState,
                                        customer: null
                                    })}
                                >
                                    <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(86%) sepia(34%) saturate(4038%) hue-rotate(295deg) brightness(88%) contrast(86%)" }} alt={''}></Image>
                                    <p className="font-medium select-none">Remove Customer</p>
                                </div>
                                :
                                <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit" 
                                    onClick={() => setKioskState({
                                        ...kioskState,
                                        customer: "a"
                                    })}
                                >
                                    <Image width="25" height="25" src="/icons/user-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                    <p className="font-medium select-none">Select Customer</p>
                                </div>
                            }
                            
                            <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                <Image width="25" height="25" src="/icons/sale-03.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                <p className="font-medium">Add Cart Discount</p>
                            </div>
    
                            <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                <Image width="25" height="25" src="/icons/globe-05.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                <p className="font-medium">Ship to Customer</p>
                            </div>
    
                            <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                <Image width="25" height="25" src="/icons/file-plus-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                <p className="font-medium">Add Note</p>
                            </div>
    
                            <div className="flex flex-col justify-between gap-8 bg-[#243a4e] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                <Image width="25" height="25" src="/icons/building-02.svg" style={{ filter: "invert(70%) sepia(24%) saturate(4431%) hue-rotate(178deg) brightness(86%) contrast(78%)" }} alt={''}></Image>
                                <p className="font-medium">Pickup from Store</p>
                            </div>
    
                            <div className="flex flex-col justify-between gap-8 bg-[#2f4038] backdrop-blur-sm p-4 min-w-[250px] rounded-md text-white max-w-fit">
                                <Image width="25" height="25" src="/icons/save-01.svg" style={{ filter: "invert(67%) sepia(16%) saturate(975%) hue-rotate(95deg) brightness(93%) contrast(92%)" }} alt={''}></Image>
                                <p className="font-medium">Save Cart</p>
                            </div>
                        </div>
                    }
                </div>
                
                <div className="flex flex-row items-center border-t-2 border-gray-600">
                    {/* Active Orders */}
                    <div className="flex flex-row items-center gap-4 p-4 text-white border-r-2 border-gray-600">
                        <div className="bg-fuchsia-100 text-black p-2 px-[0.7rem] rounded-md font-bold">LK</div>
                        <div className="flex flex-col">
                            <h3>Leslie K.</h3>
                            <div className="flex flex-row items-center gap-[0.2rem]">
                                <p className="text-sm">6 items</p>
                                <p className="text-gray-400 text-sm">&#8226; Kiosk 5</p>
                            </div>
                        </div>
                        <br />
                        <Image width="25" height="25" src="/icons/expand-04.svg" alt={''}></Image>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 min-w-[550px] max-w-[550px] p-6">
                <div className="flex flex-col gap-4">
                    {/* Order Information */}
                    <div className="flex flex-row items-center justify-between">
                        <div className="text-white">
                            <h2 className="font-semibold text-lg">Carl Sagan</h2>
                            <p className="text-sm text-gray-400">3 items</p>
                        </div>

                        <div className="flex flex-row items-center gap-[0.75rem] bg-gray-700 p-2 px-4 rounded-md">
                            <p className="text-white">Clear Cart</p>
                            {/* <Image style={{ filter: "invert(100%) sepia(12%) saturate(7454%) hue-rotate(282deg) brightness(112%) contrast(114%)" }} width="25" height="25" src="/icons/x-square.svg" alt={''}></Image> */}
                        </div>
                    </div>
                    

                    <hr className="border-gray-400 opacity-25"/>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/F1S8DN512XX_zoom---2017-surfboard-6ft-6in-fish---white.jpg?v=81b1f5068df74b648797"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">2</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torq Surfboard</p>
                                <p className="text-sm text-gray-400">White, 6{'\"'}6{'\''}</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1539.98</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/3YBMHN2ABEL_zoom---2022-marlin-5-mtb-lithium-grey.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Trek 2023 Marlin 5 Gen 2 MTB</p>
                                <p className="text-sm text-gray-400">Lithium Grey, Small</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$999.00</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/T7RTF20E2C4_zoom---discovery-12-person-tent-ink-grey.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torpedo7 Discovery</p>
                                <p className="text-sm text-gray-400">Ink/Grey, 12 Person</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1,119.99</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-white">
                        <div className="flex flex-row items-center gap-4">
                            <div className="relative">
                                <Image height={60} width={60} quality={100} alt="Torq Surfboard" className="rounded-sm" src="https://www.torpedo7.co.nz/images/products/T7TEO23YDHS_zoom---men-s-ecopulse-short-sleeve-explore-graphic-t-shirts-hot-sauce.jpg?v=845eb9a5288642009c05"></Image>

                                <div className="bg-gray-600 rounded-full flex items-center justify-center h-[30px] w-[30px] min-h-[30px] min-w-[30px] absolute -top-3 -right-3 border-gray-900 border-4">1</div>
                            </div>
                            
                            <div className="flex-1">
                                <p className="font-semibold">Torpedo7 Men{'\''}s Ecopulse</p>
                                <p className="text-sm text-gray-400">Short Sleeve, Explore Graphic, Small, Hot Sauce</p>
                            </div>

                            <div>
                                <Image style={{ filter: "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)" }} height={20} width={20} alt="Discount" className="rounded-sm hover:cursor-pointer" src="/icons/sale-03.svg" 
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.filter = "invert(94%) sepia(0%) saturate(24%) hue-rotate(45deg) brightness(105%) contrast(105%)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.filter = "invert(59%) sepia(9%) saturate(495%) hue-rotate(175deg) brightness(93%) contrast(95%)";
                                    }}
                                ></Image>
                            </div>

                            <div className="min-w-[75px]">
                                <p className="">$1,119.99</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}