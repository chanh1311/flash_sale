import { Controller, Post, Body, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    /**
     * POST /orders
     * Tạo Order từ Reservation (Idempotent)
     */
    @Post()
    async create(
        @CurrentUser() user: any,
        @Body() dto: CreateOrderDto
    ) {
        return this.orderService.createOrder(user.userId, dto);
    }

    /**
     * POST /orders/:id/pay
     * Thanh toán Order (Idempotent)
     */
    @Post(':id/pay')
    async pay(
        @CurrentUser() user: any,
        @Param('id', ParseIntPipe) orderId: number,
        @Body() dto: PayOrderDto
    ) {
        return this.orderService.payOrder(user.userId, orderId, dto);
    }
}
