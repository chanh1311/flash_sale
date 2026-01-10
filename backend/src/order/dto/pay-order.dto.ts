import { IsNotEmpty, IsString } from 'class-validator';

export class PayOrderDto {
    @IsNotEmpty()
    @IsString()
    paymentIdempotencyKey: string; // Client-generated UUID for payment
}
