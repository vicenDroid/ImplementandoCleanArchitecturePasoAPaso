// src/application/dto/AddItemToOrderDto.ts
// Data Transfer Object (DTO) for adding an item to an order. This DTO encapsulates the 
// necessary information required to perform the action of adding an item to an order, 
// allowing for a clear contract between the client and the application layer.
export interface AddItemToOrderDto {
    orderSku: string;
    productSku: string;
    quantity: number;
}