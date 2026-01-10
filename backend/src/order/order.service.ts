import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { PayOrderDto } from './dto/pay-order.dto';
import { Order, OrderStatus } from '../entities/order.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { ReservationItem } from '../entities/reservation-item.entity';
import { Product } from '../entities/product.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class OrderService {
    constructor(
        private dataSource: DataSource,
        private eventsGateway: EventsGateway,
    ) { }

    /**
     * createOrder - Tạo Order từ Reservation (IDEMPOTENT)
     */
    async createOrder(userId: number, dto: CreateOrderDto): Promise<Order> {
        const result = await this.dataSource.transaction(async (manager) => {
            const { reservationId, idempotencyKey } = dto;

            // 1. CHECK IDEMPOTENCY
            const existingOrder = await manager.findOne(Order, { where: { idempotencyKey } });
            if (existingOrder) {
                return { order: existingOrder, isExisting: true };
            }

            // 2. LOCK RESERVATION TRƯỚC 
            const reservation = await manager.findOne(Reservation, {
                where: { id: reservationId },
                lock: { mode: 'pessimistic_write' }
            });

            if (!reservation) {
                throw new NotFoundException(`Reservation #${reservationId} not found`);
            }

            // 3. LOAD ITEMS SAU KHI ĐÃ LOCK RESERVATION
            const items = await manager.find(ReservationItem, {
                where: { reservation: { id: reservationId } }
            });
            reservation.items = items;

            // 3. VALIDATE OWNERSHIP
            if (reservation.userId !== userId) {
                throw new ForbiddenException('You do not own this reservation');
            }

            // 4. VALIDATE STATUS
            if (reservation.status !== ReservationStatus.ACTIVE) {
                throw new BadRequestException(`Reservation is ${reservation.status}, cannot create order`);
            }

            // 5. TÍNH TOTAL AMOUNT
            let totalAmount = 0;
            for (const item of reservation.items) {
                const product = await manager.findOne(Product, { where: { id: item.productId } });
                if (product) {
                    totalAmount += Number(product.price) * item.quantity;
                }
            }

            // 6. TẠO ORDER
            const order = new Order();
            order.reservationId = reservationId;
            order.userId = userId;
            order.totalAmount = totalAmount;
            order.status = OrderStatus.PENDING_PAYMENT;
            order.idempotencyKey = idempotencyKey;

            const savedOrder = await manager.save(Order, order);

            // 7. CHUYỂN RESERVATION SANG COMPLETED
            reservation.status = ReservationStatus.COMPLETED;
            await manager.save(Reservation, reservation);

            // 8. GHI AUDIT LOG
            const auditLog = new AuditLog();
            auditLog.action = 'CREATE_ORDER';
            auditLog.resourceType = 'Order';
            auditLog.resourceId = savedOrder.id.toString();
            auditLog.userId = userId;
            auditLog.payload = { reservationId, totalAmount, idempotencyKey };
            auditLog.note = 'Order created from reservation (idempotent)';

            await manager.save(AuditLog, auditLog);

            return { order: savedOrder, isExisting: false, totalAmount };
        });

        // EMIT REALTIME EVENTS
        if (!result.isExisting && result.totalAmount !== undefined) {
            this.eventsGateway.emitOrderCreated(result.order.id, userId, result.totalAmount);
            this.eventsGateway.emitReservationReleased(dto.reservationId, 'converted_to_order');
        }

        return result.order;
    }

    /**
     * payOrder - Thanh toán Order (IDEMPOTENT)
     */
    async payOrder(userId: number, orderId: number, dto: PayOrderDto): Promise<Order> {
        const result = await this.dataSource.transaction(async (manager) => {
            const { paymentIdempotencyKey } = dto;

            // 1. CHECK IDEMPOTENCY bằng paymentId
            const existingOrder = await manager.findOne(Order, { where: { paymentId: paymentIdempotencyKey } });
            if (existingOrder) {
                return { order: existingOrder, isExisting: true, updatedProducts: [] };
            }

            // 2. LẤY ORDER
            const order = await manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' }
            });

            if (!order) {
                throw new NotFoundException(`Order #${orderId} not found`);
            }

            // 3. VALIDATE OWNERSHIP
            if (order.userId !== userId) {
                throw new ForbiddenException('You do not own this order');
            }

            // 4. VALIDATE STATUS
            if (order.status !== OrderStatus.PENDING_PAYMENT) {
                throw new BadRequestException(`Order is ${order.status}, cannot pay`);
            }

            // 5. LẤY RESERVATION ĐỂ UPDATE STOCK
            const reservation = await manager.findOne(Reservation, {
                where: { id: order.reservationId }
            });

            if (!reservation) {
                throw new NotFoundException(`Reservation #${order.reservationId} not found`);
            }

            // 6. LOAD ITEMS RIÊNG BIỆT
            const reservationItems = await manager.find(ReservationItem, {
                where: { reservation: { id: order.reservationId } }
            });
            reservation.items = reservationItems;

            // 6. CẬP NHẬT STOCK: reservedStock → soldStock
            const updatedProducts: Product[] = [];
            for (const item of reservation.items) {
                const product = await manager.findOne(Product, {
                    where: { id: item.productId },
                    lock: { mode: 'pessimistic_write' }
                });

                if (product) {
                    product.reservedStock -= item.quantity;
                    product.soldStock += item.quantity;
                    await manager.save(Product, product);
                    updatedProducts.push(product);
                }
            }

            // 7. CHUYỂN ORDER SANG PAID
            order.status = OrderStatus.PAID;
            order.paymentId = paymentIdempotencyKey;
            const savedOrder = await manager.save(Order, order);

            // 8. GHI AUDIT LOG
            const auditLog = new AuditLog();
            auditLog.action = 'PAY_ORDER';
            auditLog.resourceType = 'Order';
            auditLog.resourceId = savedOrder.id.toString();
            auditLog.userId = userId;
            auditLog.payload = { paymentIdempotencyKey, reservationId: order.reservationId };
            auditLog.note = 'Order paid, stock moved from reserved to sold (idempotent)';

            await manager.save(AuditLog, auditLog);

            return { order: savedOrder, isExisting: false, updatedProducts };
        });

        // EMIT REALTIME EVENTS
        if (!result.isExisting) {
            // Emit stock updates
            for (const product of result.updatedProducts) {
                this.eventsGateway.emitStockUpdate(
                    product.id,
                    product.availableStock,
                    product.reservedStock,
                    product.soldStock
                );
            }
            // Emit order paid
            this.eventsGateway.emitOrderPaid(result.order.id);
        }

        return result.order;
    }
}

