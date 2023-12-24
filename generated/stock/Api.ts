/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface Store {
  id: string;
  name: string;
  contact: ContactInformation;
  code: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface ContactInformation {
  name: string;
  mobile: MobileNumber;
  email: Email;
  landline: string;
  address: Address;
}

export interface MobileNumber {
  number: string;
  valid: boolean;
}

export interface Email {
  root: string;
  domain: string;
  full: string;
}

export interface Address {
  street: string;
  street2: string;
  city: string;
  country: string;
  po_code: string;
  /** @format double */
  lat: number;
  /** @format double */
  lon: number;
}

export interface Kiosk {
  /** Standard Unique Identification */
  id: string;
  /** A user-set custom identifier (Should not be used for unique identification) */
  name: string;
  /** The long-form identification of the store to which the kiosk resides. */
  store_id: string;
  /** Kiosk Preferences, i.e. Preferred printer [`KioskPreferences`] */
  preferences: KioskPreferences;
  /** Lock-down, i.e. Externally disable a Kiosk for any reason */
  disabled: boolean;
  /** @format date-time */
  last_online: string;
}

export interface KioskPreferences {
  printer_id: string;
}

export interface KioskInit {
  name: string;
  store_id: string;
  preferences: KioskPreferences;
  disabled: boolean;
  /** @format date-time */
  last_online: string;
}

export interface AuthenticationLog {
  employee_id: string;
  successful: boolean;
}

/** A product, containing a list of `Vec<Variant>`, an identifiable `sku` along with identifying information such as `tags`, `description` and `specifications`. > Stock-relevant information about a product is kept under each variant, thus allowing for modularity of different variants and a fine-grained control over your inventory. */
export interface Product {
  name: string;
  name_long: string;
  company: string;
  variant_groups: VariantCategory[];
  /** Lists all the **possible** combinations of a product in terms of its variants. */
  variants: VariantInformation[];
  sku: string;
  identification: ProductIdentification;
  images: string[];
  tags: string[];
  description: string;
  description_long: string;
  specifications: [string, string][];
  visible: ProductVisibility;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface VariantCategory {
  category: string;
  variants: Variant[];
}

/** Represents all sub-variant types; i.e. All 'White' variants, whether small, long-sleeve, ... it represents the sub-group of all which are 'White'. */
export interface Variant {
  name: string;
  images: string[];
  /** @format float */
  marginal_price: number;
  variant_code: string;
  order_history: HistoryForProductExchange[];
}

export interface HistoryForProductExchange {
  item: ProductExchange;
  reason: string;
  /** @format date-time */
  timestamp: string;
}

export interface ProductExchange {
  method_type: TransactionType;
  product_code: string;
  variant: string[];
  /** @format float */
  quantity: number;
}

export enum TransactionType {
  In = "In",
  Out = "Out",
  PendingIn = "PendingIn",
  PendingOut = "PendingOut",
  Saved = "Saved",
  Quote = "Quote",
}

/**
 * Information for a Variant.
 * This includes its name, identification, stock information and quantities, prices, etc.
 */
export interface VariantInformation {
  id: string;
  /** The variant name */
  name: string;
  /** The variants stock locations and quantities */
  stock: Stock[];
  /** The variants stock information, such as group, volume, sales stream, etc. */
  stock_information: StockInformation;
  /** Images specific to the variant, should take priority over product images. */
  images: string[];
  /**
   * Price for the good to be sold at
   * @format float
   */
  retail_price: number;
  /**
   * Imported/Cost price of the good to compare with
   * @format float
   */
  marginal_price: number;
  /**
   * Minimum quantity purchasable
   * @format double
   */
  buy_min: number;
  /**
   * Maximum quantity purchasable
   * @format double
   */
  buy_max: number;
  /** The discount given if in a loyalty program */
  loyalty_discount: DiscountValue;
  /** The group codes for all sub-variants; i.e. is White, Short Sleeve and Small. */
  variant_code: string[];
  /** <deprecated> Variant-associated order history */
  order_history: HistoryForProductExchange[];
  /** Barcode for product / primary identification method */
  barcode: string;
  /** Further identification methods, such as isbn, sku, ... */
  identification: ProductIdentification;
  /** If `stock_tracking` is false, the product will never be considered 'out of stock'. */
  stock_tracking: boolean;
}

export interface Stock {
  store: Location;
  quantity: Quantity;
}

export interface Location {
  store_code: string;
  store_id: string;
  contact: ContactInformation;
}

export interface Quantity {
  /** @format float */
  quantity_sellable: number;
  /** @format float */
  quantity_unsellable: number;
  /** @format float */
  quantity_on_order: number;
  /** @format float */
  quantity_allocated: number;
}

export interface StockInformation {
  stock_group: string;
  sales_group: string;
  value_stream: string;
  /**
   * At this stock level (or below), it should be indicated that the stock level is 'low'.
   * @format double
   */
  min_stock_before_alert: number;
  /**
   * Will treat product when at this quantity as 'out of stock'
   * @format double
   */
  min_stock_level: number;
  /** The publisher/author/creator/manufacturer of the good or service */
  brand: string;
  /** Individual shipment packing unit - used to show identification of multi-part shipments */
  colli: string;
  /** @format double */
  size_x: number;
  /** @format double */
  size_y: number;
  /** @format double */
  size_z: number;
  size_x_unit: string;
  size_y_unit: string;
  size_z_unit: string;
  size_override_unit: string;
  /** Non-required field which outlines the tax code of the product if necessary. */
  tax_code: string;
  /** The variant's weight in kilograms. */
  weight: string;
  /** The volume of the product in meters cubed, kept specific to each variant. */
  volume: string;
  /** A quantity considered to be the *maximum*. If the quantity dips below such value, it is suggested a restock should take place. */
  max_volume: string;
  /**
   * If the product's supply cannot be fulfilled at the current time, due to a lack of availability.
   *
   * By setting `back_order` to `true`, it allows for the purchase of the product on the promise it will be delivered to the customer or collected from the store at a later date. **This must be made clear and known to the customer.**
   */
  back_order: boolean;
  /** A product which is no longer source-able. Once the product's inventory is consumed it is indicated to never be replenished. */
  discontinued: boolean;
  /** A `non_diminishing` product is often a service rather than a product, i.e. freight. It is **not removed** from inventory upon consumption, rather attached. */
  non_diminishing: boolean;
  /** A non-shippable good is one which cannot be dispatched between stores or sent to a customers home, this might be a fragile product, service, oversized good or edge case. */
  shippable: boolean;
}

export type DiscountValue =
  | {
      /**
       * @format uint32
       * @min 0
       */
      Percentage: number;
    }
  | {
      /**
       * @format uint32
       * @min 0
       */
      Absolute: number;
    };

export interface ProductIdentification {
  sku: string;
  ean: string;
  hs_code: string;
  article_code: string;
  isbn: string;
}

export enum ProductVisibility {
  AlwaysShown = "AlwaysShown",
  AlwaysHidden = "AlwaysHidden",
  ShowWhenInStock = "ShowWhenInStock",
}

export interface ProductWPromotion {
  /** A product, containing a list of `Vec<Variant>`, an identifiable `sku` along with identifying information such as `tags`, `description` and `specifications`. > Stock-relevant information about a product is kept under each variant, thus allowing for modularity of different variants and a fine-grained control over your inventory. */
  product: Product;
  promotions: Promotion[];
}

export interface Promotion {
  id: string;
  name: string;
  buy: PromotionBuy;
  /** `SoloThis(discount)` <br /> *Represents the individual product.* <br /> <br /> Is used in cases where the product is the recipient of the promotion in inclusive quantity, i.e. 50% off t-shirts (applies to self) */
  get: PromotionGet;
  /** @format date-time */
  valid_till: string;
  /** @format date-time */
  timestamp: string;
}

export type PromotionBuy =
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      Specific: [string, number];
    }
  | {
      /** @format float */
      Any: number;
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      Category: [string, number];
    };

/** `SoloThis(discount)` <br /> *Represents the individual product.* <br /> <br /> Is used in cases where the product is the recipient of the promotion in inclusive quantity, i.e. 50% off t-shirts (applies to self) */
export type PromotionGet =
  | {
      SoloThis: DiscountValue;
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      This: [number, DiscountValue];
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      Specific: [string, [number, DiscountValue]];
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      Any: [number, DiscountValue];
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      AnyOther: [number, DiscountValue];
    }
  | {
      /**
       * @maxItems 2
       * @minItems 2
       */
      Category: [string, [number, DiscountValue]];
    };

export interface PromotionInput {
  name: string;
  buy: PromotionBuy;
  /** `SoloThis(discount)` <br /> *Represents the individual product.* <br /> <br /> Is used in cases where the product is the recipient of the promotion in inclusive quantity, i.e. 50% off t-shirts (applies to self) */
  get: PromotionGet;
  /** @format date-time */
  valid_till: string;
  /** @format date-time */
  timestamp: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: ContactInformation;
  customer_notes: Note[];
  /** @format int64 */
  balance: number;
  special_pricing: string;
  accepts_marketing: boolean;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface Note {
  message: string;
  author: string;
  /** @format date-time */
  timestamp: string;
}

export interface CustomerInput {
  name: string;
  contact: ContactInformation;
  customer_notes: Note[];
  special_pricing: string;
  /** @format int64 */
  balance: number;
  accepts_marketing: boolean;
}

export interface CustomerWithTransactionsOut {
  id: string;
  name: string;
  contact: ContactInformation;
  customer_notes: Note[];
  /**
   * @format uint32
   * @min 0
   */
  balance: number;
  special_pricing: string;
  transactions?: string | null;
  accepts_marketing: boolean;
}

/**
 * **Transaction** <br /> An order group is parented by a transaction, this can include 1 or more orders. It is attached to a customer, and represents the transaction for the purchase or sale of goods. <br />
 *
 * The products attribute: An order list which is often comprised of 1 order. -   Why would there be more than 1 order in a transaction? - If a consumer purchases multiple goods which need to be dealt with separately, the transaction will do so, An example might be: A surfboard which is shipped to the consumer whilst 3 accessories are taken from the shop directly, thus two orders (1 shipment and 1 direct), whereby the 2nd order will contain multiple (3) products and the 1st only one.
 *
 * `IN:`     As a purchase order it's transaction type takes the form of "In", the customer object will be treated as the company bought from and the payment as an outward payment in exchange for the goods. <br /> `OUT:`    A sale - It can occur in-store or online and is comprised of the sale of goods outlined in the order list.
 */
export interface Transaction {
  id: string;
  customer: TransactionCustomer;
  transaction_type: TransactionType;
  products: Order[];
  /** @format int64 */
  order_total: number;
  payment: Payment[];
  /** @format date-time */
  order_date: string;
  order_notes: Note[];
  salesperson: string;
  kiosk: string;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface TransactionCustomer {
  customer_type: CustomerType;
  customer_id: string;
}

export enum CustomerType {
  Store = "Store",
  Individual = "Individual",
  Commercial = "Commercial",
}

export interface Order {
  id: string;
  destination: Location;
  origin: Location;
  products: ProductPurchase[];
  status: OrderStatusAssignment;
  status_history: HistoryForOrderStatusAssignment[];
  order_history: HistoryForProductExchange[];
  previous_failed_fulfillment_attempts: HistoryForStore[];
  order_notes: Note[];
  reference: string;
  /** @format date-time */
  creation_date: string;
  discount: DiscountValue;
  order_type: OrderType;
}

export interface ProductPurchase {
  id: string;
  product_code: string;
  product_sku: string;
  discount: DiscountValue;
  product_name: string;
  product_variant_name: string;
  /** @format float */
  product_cost: number;
  /** @format float */
  quantity: number;
  tags: string[];
  transaction_type: TransactionType;
  instances: ProductInstance[];
}

export interface ProductInstance {
  id: string;
  /** @default {"last_updated":"2023-12-22T11:13:52.240496293Z","notes":[],"pick_history":[],"pick_status":"Pending"} */
  fulfillment_status?: FulfillmentStatus;
}

export interface FulfillmentStatus {
  pick_status: PickStatus;
  pick_history: HistoryForPickStatus[];
  /** @format date-time */
  last_updated: string;
  notes: Note[];
}

export type PickStatus =
  | "Pending"
  | "Picked"
  | "Failed"
  | "Uncertain"
  | "Processing"
  | {
      Other: string;
    };

export interface HistoryForPickStatus {
  item: PickStatus;
  reason: string;
  /** @format date-time */
  timestamp: string;
}

export interface OrderStatusAssignment {
  /** Open Cart, Till Cart or Being Processed, the date represents the time it was placed. */
  status: OrderStatus;
  assigned_products: string[];
  /** @format date-time */
  timestamp: string;
}

/** Open Cart, Till Cart or Being Processed, the date represents the time it was placed. */
export type OrderStatus =
  | {
      type: "queued";
      /** @format date-time */
      value: string;
    }
  | {
      type: "transit";
      value: TransitInformation;
    }
  | {
      type: "processing";
      /** @format date-time */
      value: string;
    }
  | {
      type: "instore";
      /** @format date-time */
      value: string;
    }
  | {
      type: "fulfilled";
      /** @format date-time */
      value: string;
    }
  | {
      type: "failed";
      value: string;
    };

export interface TransitInformation {
  shipping_company: ContactInformation;
  query_url: string;
  tracking_code: string;
  assigned_products: string[];
}

export interface HistoryForOrderStatusAssignment {
  item: OrderStatusAssignment;
  reason: string;
  /** @format date-time */
  timestamp: string;
}

export interface HistoryForStore {
  item: Store;
  reason: string;
  /** @format date-time */
  timestamp: string;
}

export enum OrderType {
  Direct = "direct",
  Shipment = "shipment",
  Pickup = "pickup",
  Quote = "quote",
}

export interface Payment {
  id: string;
  payment_method: PaymentMethod;
  /** @format date-time */
  fulfillment_date: string;
  amount: Price;
  processing_fee: Price;
  status: PaymentStatus;
  processor: PaymentProcessor;
  order_ids: string[];
  delay_action: PaymentAction;
  /** Duration in the RFC3339 format */
  delay_duration: string;
}

export type PaymentMethod =
  | "Card"
  | "Cash"
  | "Transfer"
  | {
      Other: string;
    };

export interface Price {
  /** @format float */
  quantity: number;
  currency: string;
}

export type PaymentStatus =
  | {
      Unfulfilled: string;
    }
  | {
      Pending: string;
    }
  | {
      Processing: string;
    }
  | {
      /** CardDetails() (CardTransaction) */
      Failed: Processable;
    }
  | {
      /** CardDetails() (CardTransaction) */
      Complete: Processable;
    };

/** CardDetails() (CardTransaction) */
export type Processable =
  | {
      CardDetails: CardDetails;
    }
  | {
      Anonymous: string;
    };

export interface CardDetails {
  card_brand: string;
  last_4: string;
  exp_month: string;
  exp_year: string;
  fingerprint: string;
  card_type: string;
  prepaid_type: string;
  bin: string;
  entry_method: string;
  cvv_accepted: string;
  avs_accepted: string;
  auth_result_code: string;
  statement_description: string;
  card_payment_timeline: PaymentTimeline;
}

export interface PaymentTimeline {
  authorized_at: string;
  captured_at: string;
}

export interface PaymentProcessor {
  location: string;
  employee: string;
  software_version: string;
  token: string;
}

export enum PaymentAction {
  Cancel = "Cancel",
  Complete = "Complete",
  RequireFurtherAction = "RequireFurtherAction",
}

export interface Employee {
  id: string;
  rid: string;
  name: Name;
  /** Stores a password hash, signed as a key using the users login ID. Upon logging in using a client portal, the pre-sign object is signed using the provided ID - if the hash matches that which is given, authentication can be approved. */
  auth: EmployeeAuth;
  contact: ContactInformation;
  clock_history: HistoryForAttendance[];
  level: AccessForAction[];
  account_type: AccountType;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface Name {
  first: string;
  middle: string;
  last: string;
}

/** Stores a password hash, signed as a key using the users login ID. Upon logging in using a client portal, the pre-sign object is signed using the provided ID - if the hash matches that which is given, authentication can be approved. */
export interface EmployeeAuth {
  hash: string;
}

export interface HistoryForAttendance {
  item: Attendance;
  reason: string;
  /** @format date-time */
  timestamp: string;
}

export interface Attendance {
  track_type: TrackType;
  kiosk: string;
}

export enum TrackType {
  In = "In",
  Out = "Out",
}

export interface AccessForAction {
  action: Action;
  /** @format int32 */
  authority: number;
}

export enum Action {
  CreateCustomer = "CreateCustomer",
  DeleteCustomer = "DeleteCustomer",
  ModifyCustomer = "ModifyCustomer",
  FetchCustomer = "FetchCustomer",
  CreateEmployee = "CreateEmployee",
  DeleteEmployee = "DeleteEmployee",
  ModifyEmployee = "ModifyEmployee",
  FetchEmployee = "FetchEmployee",
  CreateTransaction = "CreateTransaction",
  DeleteTransaction = "DeleteTransaction",
  ModifyTransaction = "ModifyTransaction",
  FetchTransaction = "FetchTransaction",
  CreateProduct = "CreateProduct",
  DeleteProduct = "DeleteProduct",
  ModifyProduct = "ModifyProduct",
  CreateStockAdjustmentIntent = "CreateStockAdjustmentIntent",
  ClearStockAdjustmentIntent = "ClearStockAdjustmentIntent",
  FetchProduct = "FetchProduct",
  CreateStore = "CreateStore",
  DeleteStore = "DeleteStore",
  ModifyStore = "ModifyStore",
  FetchStore = "FetchStore",
  CreateSupplier = "CreateSupplier",
  DeleteSupplier = "DeleteSupplier",
  ModifySupplier = "ModifySupplier",
  FetchSupplier = "FetchSupplier",
  CreateKiosk = "CreateKiosk",
  DeleteKiosk = "DeleteKiosk",
  ModifyKiosk = "ModifyKiosk",
  ModifyKioskPreferences = "ModifyKioskPreferences",
  FetchKiosk = "FetchKiosk",
  AccessAdminPanel = "AccessAdminPanel",
  SuperUserDo = "SuperUserDo",
  GenerateTemplateContent = "GenerateTemplateContent",
  FetchGeoLocation = "FetchGeoLocation",
}

export enum AccountType {
  FrontLine = "FrontLine",
  Managerial = "Managerial",
}

export interface Auth {
  pass: string;
  kiosk_id: string;
  tenant_id: string;
}

export interface EmployeeInput {
  name: Name;
  /** @format int32 */
  rid: number;
  contact: ContactInformation;
  password: string;
  clock_history: HistoryForAttendance[];
  level: AccessForAction[];
  account_type: AccountType;
}

export interface LogRequest {
  kiosk: string;
  reason: string;
  in_or_out: string;
}

export interface Supplier {
  id: string;
  name: Name;
  contact: ContactInformation;
  transaction_history: Transaction[];
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export interface SupplierInput {
  name: Name;
  contact: ContactInformation;
  transaction_history: Transaction[];
}

export interface All {
  employee: Employee;
  stores: Store[];
  tenants: Tenant[];
  products: Product[];
  customer: Customer;
  /**
   * **Transaction** <br /> An order group is parented by a transaction, this can include 1 or more orders. It is attached to a customer, and represents the transaction for the purchase or sale of goods. <br />
   *
   * The products attribute: An order list which is often comprised of 1 order. -   Why would there be more than 1 order in a transaction? - If a consumer purchases multiple goods which need to be dealt with separately, the transaction will do so, An example might be: A surfboard which is shipped to the consumer whilst 3 accessories are taken from the shop directly, thus two orders (1 shipment and 1 direct), whereby the 2nd order will contain multiple (3) products and the 1st only one.
   *
   * `IN:`     As a purchase order it's transaction type takes the form of "In", the customer object will be treated as the company bought from and the payment as an outward payment in exchange for the goods. <br /> `OUT:`    A sale - It can occur in-store or online and is comprised of the sale of goods outlined in the order list.
   */
  transaction: Transaction;
  promotions: Promotion[];
  kiosk: Kiosk;
}

export interface Tenant {
  tenant_id: string;
  /** @format date-time */
  registration_date: string;
  settings: TenantSettings;
  /** @format date-time */
  created_at: string;
  /** @format date-time */
  updated_at: string;
}

export type TenantSettings = object;

export interface Distance {
  store_id: string;
  store_code: string;
  /** @format double */
  distance: number;
}

export interface NewTenantResponse {
  tenant_id: string;
  api_key: string;
  employee_id: string;
}

export interface NewTenantInput {
  name: string;
  email: string;
  address: string;
  password: string;
}

export interface TransactionInit {
  customer: TransactionCustomer;
  transaction_type: TransactionType;
  products: Order[];
  /** @format int64 */
  order_total: number;
  payment: Payment[];
  /** @format date-time */
  order_date: string;
  order_notes: Note[];
  kiosk: string;
}

export interface TransactionInput {
  customer: TransactionCustomer;
  transaction_type: TransactionType;
  products: Order[];
  /** @format int64 */
  order_total: number;
  payment: Payment[];
  /** @format date-time */
  order_date: string;
  order_notes: Note[];
  salesperson: string;
  kiosk: string;
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, "body" | "bodyUsed">;

export interface FullRequestParams extends Omit<RequestInit, "body"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<FullRequestParams, "body" | "method" | "query" | "path">;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, "baseUrl" | "cancelToken" | "signal">;
  securityWorker?: (securityData: SecurityDataType | null) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown> extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = "/api";
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) => fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: "same-origin",
    headers: {},
    redirect: "follow",
    referrerPolicy: "no-referrer",
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === "number" ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join("&");
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter((key) => "undefined" !== typeof query[key]);
    return keys
      .map((key) => (Array.isArray(query[key]) ? this.addArrayQueryParam(query, key) : this.addQueryParam(query, key)))
      .join("&");
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : "";
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === "object" || typeof input === "string") ? JSON.stringify(input) : input,
    [ContentType.Text]: (input: any) => (input !== null && typeof input !== "string" ? JSON.stringify(input) : input),
    [ContentType.FormData]: (input: any) =>
      Object.keys(input || {}).reduce((formData, key) => {
        const property = input[key];
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === "object" && property !== null
            ? JSON.stringify(property)
            : `${property}`,
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(params1: RequestParams, params2?: RequestParams): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (cancelToken: CancelToken): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(`${baseUrl || this.baseUrl || ""}${path}${queryString ? `?${queryString}` : ""}`, {
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type && type !== ContentType.FormData ? { "Content-Type": type } : {}),
      },
      signal: (cancelToken ? this.createAbortSignal(cancelToken) : requestParams.signal) || null,
      body: typeof body === "undefined" || body === null ? null : payloadFormatter(body),
    }).then(async (response) => {
      const r = response as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title open-stock
 * @version 0.1.19
 * @baseUrl /api
 *
 * An Inventory Management Database Interface Layer for MySQL
 */
export class Api<SecurityDataType extends unknown> extends HttpClient<SecurityDataType> {
  store = {
    /**
     * No description
     *
     * @tags Store
     * @name Get
     * @request GET:/store/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Store, any>({
        path: `/store/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Store
     * @name Update
     * @request POST:/store/{id}
     */
    update: (id: string, data: Store, params: RequestParams = {}) =>
      this.request<Store, any>({
        path: `/store/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Store
     * @name GetAll
     * @request GET:/store/
     */
    getAll: (params: RequestParams = {}) =>
      this.request<Store[], any>({
        path: `/store/`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Store
     * @name GetByCode
     * @request GET:/store/code/{code}
     */
    getByCode: (code: string, params: RequestParams = {}) =>
      this.request<Store, any>({
        path: `/store/code/${code}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Store
     * @name Generate
     * @request POST:/store/generate
     */
    generate: (params: RequestParams = {}) =>
      this.request<Store[], any>({
        path: `/store/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  kiosk = {
    /**
     * No description
     *
     * @tags Kiosk
     * @name Get
     * @request GET:/kiosk/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Kiosk, any>({
        path: `/kiosk/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name Update
     * @request POST:/kiosk/{id}
     */
    update: (id: string, data: KioskInit, params: RequestParams = {}) =>
      this.request<Kiosk, any>({
        path: `/kiosk/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name Initialize
     * @request POST:/kiosk/
     */
    initialize: (data: KioskInit, params: RequestParams = {}) =>
      this.request<Kiosk, any>({
        path: `/kiosk/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name UpdatePreferences
     * @request POST:/kiosk/preferences/{id}
     */
    updatePreferences: (id: string, data: KioskPreferences, params: RequestParams = {}) =>
      this.request<Kiosk, any>({
        path: `/kiosk/preferences/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name UpdateOnlineStatus
     * @request POST:/kiosk/online/{id}
     */
    updateOnlineStatus: (id: string, params: RequestParams = {}) =>
      this.request<Kiosk, any>({
        path: `/kiosk/online/${id}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name Delete
     * @request POST:/kiosk/delete/{id}
     */
    delete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/kiosk/delete/${id}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Kiosk
     * @name AuthLog
     * @request POST:/kiosk/log/{id}
     */
    authLog: (id: string, data: AuthenticationLog, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/kiosk/log/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),
  };
  ingress = {
    /**
     * @description Usage is as follows curl -X POST -H "Content-Type: text/plain" -d "@/to/file/location/" http://127.0.0.1:8000/api/ingress/upload
     *
     * @tags Ingress
     * @name Upload
     * @request POST:/ingress/upload
     */
    upload: (data: number[], params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/ingress/upload`,
        method: "POST",
        body: data,
        ...params,
      }),
  };
  product = {
    /**
     * No description
     *
     * @tags Product
     * @name Get
     * @request GET:/product/{id}
     */
    get: (id: number, params: RequestParams = {}) =>
      this.request<Product, any>({
        path: `/product/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name Update
     * @request POST:/product/{id}
     */
    update: (id: string, data: Product, params: RequestParams = {}) =>
      this.request<Product, any>({
        path: `/product/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GetWithAssociatedPromotions
     * @request GET:/product/with_promotions/{id}
     */
    getWithAssociatedPromotions: (id: number, params: RequestParams = {}) =>
      this.request<ProductWPromotion, any>({
        path: `/product/with_promotions/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GetByName
     * @request GET:/product/name/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Product[], any>({
        path: `/product/name/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * @description References exact name
     *
     * @tags Product
     * @name GetByNameExact
     * @request GET:/product/!name/{name}
     */
    getByNameExact: (name: string, params: RequestParams = {}) =>
      this.request<Product[], any>({
        path: `/product/!name/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name Create
     * @request POST:/product/
     */
    create: (data: Product, params: RequestParams = {}) =>
      this.request<Product, any>({
        path: `/product/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name Generate
     * @request POST:/product/generate
     */
    generate: (params: RequestParams = {}) =>
      this.request<Product[], any>({
        path: `/product/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Will search by both name, phone and email.
     *
     * @tags Product
     * @name SearchQuery
     * @request GET:/product/search/{query}
     */
    searchQuery: (query: string, params: RequestParams = {}) =>
      this.request<Product[], any>({
        path: `/product/search/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GetPromotion
     * @request GET:/product/promotion/{id}
     */
    getPromotion: (id: number, params: RequestParams = {}) =>
      this.request<Promotion, any>({
        path: `/product/promotion/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name UpdatePromotion
     * @request POST:/product/promotion/{id}
     */
    updatePromotion: (id: string, data: PromotionInput, params: RequestParams = {}) =>
      this.request<Promotion, any>({
        path: `/product/promotion/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GetPromotionByQuery
     * @request GET:/product/promotion/search/{query}
     */
    getPromotionByQuery: (query: string, params: RequestParams = {}) =>
      this.request<Promotion[], any>({
        path: `/product/promotion/search/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name CreatePromotion
     * @request POST:/product/promotion
     */
    createPromotion: (data: PromotionInput, params: RequestParams = {}) =>
      this.request<Promotion, any>({
        path: `/product/promotion`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name GeneratePromotion
     * @request POST:/product/generate/promotion
     */
    generatePromotion: (params: RequestParams = {}) =>
      this.request<Promotion[], any>({
        path: `/product/generate/promotion`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name SearchWithAssociatedPromotions
     * @request GET:/product/search/with_promotions/{query}
     */
    searchWithAssociatedPromotions: (query: string, params: RequestParams = {}) =>
      this.request<ProductWPromotion[], any>({
        path: `/product/search/with_promotions/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  customer = {
    /**
     * No description
     *
     * @tags Customer
     * @name Get
     * @request GET:/customer/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Customer, any>({
        path: `/customer/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name Update
     * @request POST:/customer/{id}
     */
    update: (id: string, data: Customer, params: RequestParams = {}) =>
      this.request<Customer, any>({
        path: `/customer/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name GetByName
     * @request GET:/customer/name/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Customer[], any>({
        path: `/customer/name/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name GetByPhone
     * @request GET:/customer/phone/{phone}
     */
    getByPhone: (phone: string, params: RequestParams = {}) =>
      this.request<Customer[], any>({
        path: `/customer/phone/${phone}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name GetByAddr
     * @request GET:/customer/addr/{addr}
     */
    getByAddr: (addr: string, params: RequestParams = {}) =>
      this.request<Customer[], any>({
        path: `/customer/addr/${addr}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name GetRecent
     * @request GET:/customer/recent
     */
    getRecent: (params: RequestParams = {}) =>
      this.request<Customer[], any>({
        path: `/customer/recent`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name Create
     * @request POST:/customer/
     */
    create: (data: CustomerInput, params: RequestParams = {}) =>
      this.request<Customer, any>({
        path: `/customer/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name Generate
     * @request POST:/customer/generate
     */
    generate: (params: RequestParams = {}) =>
      this.request<Customer, any>({
        path: `/customer/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * @description Will search by both name, phone and email.
     *
     * @tags Customer
     * @name SearchQuery
     * @request GET:/customer/search/{query}
     */
    searchQuery: (query: string, params: RequestParams = {}) =>
      this.request<CustomerWithTransactionsOut[], any>({
        path: `/customer/search/${query}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name UpdateContactInfo
     * @request POST:/customer/contact/{id}
     */
    updateContactInfo: (id: string, data: ContactInformation, params: RequestParams = {}) =>
      this.request<Customer, any>({
        path: `/customer/contact/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Customer
     * @name FindRelatedTransactions
     * @request GET:/customer/transactions/{id}
     */
    findRelatedTransactions: (id: string, params: RequestParams = {}) =>
      this.request<Transaction[], any>({
        path: `/customer/transactions/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  employee = {
    /**
     * No description
     *
     * @tags Employee
     * @name Get
     * @request GET:/employee/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Update
     * @request POST:/employee/{id}
     */
    update: (id: string, data: Employee, params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Whoami
     * @request GET:/employee/
     */
    whoami: (params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Create
     * @request POST:/employee/
     */
    create: (data: EmployeeInput, params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name GetByName
     * @request GET:/employee/name/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Employee[], any>({
        path: `/employee/name/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name GetByRid
     * @request GET:/employee/rid/{rid}
     */
    getByRid: (rid: string, params: RequestParams = {}) =>
      this.request<Employee[], any>({
        path: `/employee/rid/${rid}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name AuthRid
     * @request POST:/employee/auth/rid/{rid}
     */
    authRid: (rid: string, data: Auth, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/employee/auth/rid/${rid}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name GetByNameExact
     * @request GET:/employee/!name
     */
    getByNameExact: (data: Name, params: RequestParams = {}) =>
      this.request<Employee[], any>({
        path: `/employee/!name`,
        method: "GET",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name GetByLevel
     * @request GET:/employee/level/{level}
     */
    getByLevel: (level: number, params: RequestParams = {}) =>
      this.request<Employee[], any>({
        path: `/employee/level/${level}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name GetStatus
     * @request GET:/employee/log/{id}
     */
    getStatus: (id: string, params: RequestParams = {}) =>
      this.request<HistoryForAttendance, any>({
        path: `/employee/log/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Log
     * @request POST:/employee/log/{id}
     */
    log: (id: string, data: LogRequest, params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/log/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Generate
     * @request POST:/employee/generate
     */
    generate: (params: RequestParams = {}) =>
      this.request<Employee, any>({
        path: `/employee/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Employee
     * @name Auth
     * @request POST:/employee/auth/{id}
     */
    auth: (id: string, data: Auth, params: RequestParams = {}) =>
      this.request<string, any>({
        path: `/employee/auth/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
  supplier = {
    /**
     * No description
     *
     * @tags Supplier
     * @name Get
     * @request GET:/supplier/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Supplier, any>({
        path: `/supplier/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name Update
     * @request POST:/supplier/{id}
     */
    update: (id: string, data: SupplierInput, params: RequestParams = {}) =>
      this.request<Supplier, any>({
        path: `/supplier/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name GetByName
     * @request GET:/supplier/name/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Supplier[], any>({
        path: `/supplier/name/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name GetByPhone
     * @request GET:/supplier/phone/{phone}
     */
    getByPhone: (phone: string, params: RequestParams = {}) =>
      this.request<Supplier[], any>({
        path: `/supplier/phone/${phone}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name GetByAddr
     * @request GET:/supplier/addr/{addr}
     */
    getByAddr: (addr: string, params: RequestParams = {}) =>
      this.request<Supplier[], any>({
        path: `/supplier/addr/${addr}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name Create
     * @request POST:/supplier/
     */
    create: (data: SupplierInput, params: RequestParams = {}) =>
      this.request<Supplier, any>({
        path: `/supplier/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Supplier
     * @name Generate
     * @request POST:/supplier/generate
     */
    generate: (params: RequestParams = {}) =>
      this.request<Supplier, any>({
        path: `/supplier/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),
  };
  helpers = {
    /**
     * @description This route does not require authentication, but is not enabled in release mode.
     *
     * @tags Helpers
     * @name GenerateTemplate
     * @request POST:/helpers/generate
     */
    generateTemplate: (params: RequestParams = {}) =>
      this.request<All, any>({
        path: `/helpers/generate`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Helpers
     * @name AddressToGeolocation
     * @request POST:/helpers/address
     */
    addressToGeolocation: (data: string, params: RequestParams = {}) =>
      this.request<Address, any>({
        path: `/helpers/address`,
        method: "POST",
        body: data,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Helpers
     * @name DistanceToStores
     * @request GET:/helpers/distance/{id}
     */
    distanceToStores: (id: string, params: RequestParams = {}) =>
      this.request<Distance[], any>({
        path: `/helpers/distance/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Helpers
     * @name SuggestAddr
     * @request POST:/helpers/suggest
     */
    suggestAddr: (data: string, params: RequestParams = {}) =>
      this.request<Address[], any>({
        path: `/helpers/suggest`,
        method: "POST",
        body: data,
        format: "json",
        ...params,
      }),

    /**
     * @description Unprotected route, does not require a cookie
     *
     * @tags Helpers
     * @name NewTenant
     * @request POST:/helpers/new
     */
    newTenant: (data: NewTenantInput, params: RequestParams = {}) =>
      this.request<NewTenantResponse, any>({
        path: `/helpers/new`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Helpers
     * @name DistanceToStoresFromStore
     * @request GET:/helpers/distance/store/{store_id}
     */
    distanceToStoresFromStore: (storeId: string, params: RequestParams = {}) =>
      this.request<Distance[], any>({
        path: `/helpers/distance/store/${storeId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Helpers
     * @name AssignSessionCookie
     * @request GET:/helpers/session/{key}
     */
    assignSessionCookie: (key: string, params: RequestParams = {}) =>
      this.request<null, any>({
        path: `/helpers/session/${key}`,
        method: "GET",
        format: "json",
        ...params,
      }),
  };
  transaction = {
    /**
     * No description
     *
     * @tags Transaction
     * @name Get
     * @request GET:/transaction/{id}
     */
    get: (id: string, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/${id}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name Update
     * @request POST:/transaction/{id}
     */
    update: (id: string, data: TransactionInput, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/${id}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name GetByName
     * @request GET:/transaction/ref/{name}
     */
    getByName: (name: string, params: RequestParams = {}) =>
      this.request<Transaction[], any>({
        path: `/transaction/ref/${name}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name GetAllSaved
     * @request GET:/transaction/saved
     */
    getAllSaved: (params: RequestParams = {}) =>
      this.request<Transaction[], any>({
        path: `/transaction/saved`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name GetByProductSku
     * @request GET:/transaction/product/{sku}
     */
    getByProductSku: (sku: string, params: RequestParams = {}) =>
      this.request<Transaction[], any>({
        path: `/transaction/product/${sku}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name Create
     * @request POST:/transaction/
     */
    create: (data: TransactionInit, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name Generate
     * @request POST:/transaction/generate/{customer_id}
     */
    generate: (customerId: string, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/generate/${customerId}`,
        method: "POST",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name Delete
     * @request POST:/transaction/delete/{id}
     */
    delete: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/transaction/delete/${id}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name DeliverablesSearch
     * @request GET:/transaction/deliverables/{store_id}
     */
    deliverablesSearch: (storeId: string, params: RequestParams = {}) =>
      this.request<Order[], any>({
        path: `/transaction/deliverables/${storeId}`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name UpdateProductStatus
     * @request POST:/transaction/status/product/{refer}/{pid}/{iid}
     */
    updateProductStatus: (refer: string, pid: string, iid: string, data: string, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/status/product/${refer}/${pid}/${iid}`,
        method: "POST",
        body: data,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Transaction
     * @name UpdateOrderStatus
     * @request POST:/transaction/status/order/{refer}
     */
    updateOrderStatus: (refer: string, data: OrderStatus, params: RequestParams = {}) =>
      this.request<Transaction, any>({
        path: `/transaction/status/order/${refer}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),
  };
}
