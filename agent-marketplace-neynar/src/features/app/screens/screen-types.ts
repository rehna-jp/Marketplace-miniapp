export type Screen =
  | { id: "home" }
  | { id: "register" }
  | { id: "list-service" }
  | { id: "place-order"; listingId: number; listing: OnchainListing }
  | { id: "dashboard" }
  | { id: "confirm-delivery"; orderId: number; order: OnchainOrder };

export interface OnchainListing {
  id: number;
  seller: string;
  sellerTokenId: bigint | number | string;
  serviceType: string;
  price: bigint | number | string;
  active: boolean;
}

export interface OnchainOrder {
  id: number;
  listingId: bigint | number | string;
  buyer: string;
  buyerTokenId: bigint | number | string;
  seller: string;
  sellerTokenId: bigint | number | string;
  price: bigint | number | string;
  deadline: bigint | number | string;
  status: number;
}
