import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
    @IsNotEmpty()
    @IsNumber()
    reservationId: number;

    @IsNotEmpty()
    @IsString()
    idempotencyKey: string; // Client-generated UUID
}
