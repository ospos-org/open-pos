import { clsx, type ClassValue } from "clsx"
import moment from "moment"
import { twMerge } from "tailwind-merge"
import {ContextualOrder} from "@utils/stockTypes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sortOrders(orders: ContextualOrder[]) {
  return orders.sort((a, b) => a.order_type == "direct" ? -1 : 0)
}

export function sortDbOrders(orders: ContextualOrder[]) {
  return orders.sort((a, b) => a.order_type == "direct" ? -1 : 0)
}

export function getDate(): string {
  return moment(new Date(), 'DD/MM/YYYY', true).format()
}

export const ICON_SIZE = 30