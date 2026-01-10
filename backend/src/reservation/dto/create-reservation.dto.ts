import { IsNotEmpty, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ReservationItemDto {
    @IsNotEmpty()
    @IsNumber()
    productId: number;

    @IsNotEmpty()
    @IsNumber()
    @Min(1) // Số lượng mua tối thiểu là 1
    quantity: number;
}

export class CreateReservationDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ReservationItemDto)
    items: ReservationItemDto[];

    @IsNotEmpty()
    idempotencyKey?: string; // Client tự sinh UUID
}