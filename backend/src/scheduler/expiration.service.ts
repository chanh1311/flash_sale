import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { Order, OrderStatus } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class ExpirationService {
    private readonly logger = new Logger(ExpirationService.name);

    constructor(
        private dataSource: DataSource,
        private eventsGateway: EventsGateway,
    ) { }

    /**
     * RESERVATION EXPIRATION - Chạy mỗi phút
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleReservationExpiration() {
        this.logger.debug('Checking for expired reservations...');

        const expiredData: { reservationId: number; products: Product[] }[] = [];

        await this.dataSource.transaction(async (manager) => {
            const expiredReservations = await manager.find(Reservation, {
                where: {
                    status: ReservationStatus.ACTIVE,
                    expiresAt: LessThan(new Date())
                },
                relations: ['items']
            });

            if (expiredReservations.length === 0) {
                return;
            }

            this.logger.log(`Found ${expiredReservations.length} expired reservations`);

            for (const reservation of expiredReservations) {
                const updatedProducts: Product[] = [];

                for (const item of reservation.items) {
                    const product = await manager.findOne(Product, {
                        where: { id: item.productId },
                        lock: { mode: 'pessimistic_write' }
                    });

                    if (product) {
                        product.availableStock += item.quantity;
                        product.reservedStock -= item.quantity;
                        await manager.save(Product, product);
                        updatedProducts.push(product);

                        this.logger.log(
                            `Restored stock for Product #${product.id}: +${item.quantity} available`
                        );
                    }
                }

                reservation.status = ReservationStatus.EXPIRED;
                await manager.save(Reservation, reservation);

                const auditLog = new AuditLog();
                auditLog.action = 'RESERVATION_EXPIRED';
                auditLog.resourceType = 'Reservation';
                auditLog.resourceId = reservation.id.toString();
                auditLog.userId = reservation.userId;
                auditLog.payload = { items: reservation.items.map(i => ({ productId: i.productId, qty: i.quantity })) };
                auditLog.note = 'Hết hạn giữ chỗ sau 10 phút TTL, đã trả lại tồn kho';
                await manager.save(AuditLog, auditLog);

                expiredData.push({ reservationId: reservation.id, products: updatedProducts });
                this.logger.log(`Reservation #${reservation.id} expired`);
            }
        });

        // EMIT REALTIME EVENTS (sau transaction)
        for (const data of expiredData) {
            for (const product of data.products) {
                this.eventsGateway.emitStockUpdate(
                    product.id,
                    product.availableStock,
                    product.reservedStock,
                    product.soldStock
                );
            }
            this.eventsGateway.emitReservationExpired(data.reservationId);
        }
    }

    /**
     * ORDER EXPIRATION - Chạy mỗi phút
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleOrderExpiration() {
        this.logger.debug('Checking for expired orders...');

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const expiredData: { orderId: number; products: Product[] }[] = [];

        await this.dataSource.transaction(async (manager) => {
            const expiredOrders = await manager.find(Order, {
                where: {
                    status: OrderStatus.PENDING_PAYMENT,
                    createdAt: LessThan(fiveMinutesAgo)
                }
            });

            if (expiredOrders.length === 0) {
                return;
            }

            this.logger.log(`Found ${expiredOrders.length} expired orders`);

            for (const order of expiredOrders) {
                const updatedProducts: Product[] = [];

                const reservation = await manager.findOne(Reservation, {
                    where: { id: order.reservationId },
                    relations: ['items']
                });

                if (reservation) {
                    for (const item of reservation.items) {
                        const product = await manager.findOne(Product, {
                            where: { id: item.productId },
                            lock: { mode: 'pessimistic_write' }
                        });

                        if (product) {
                            product.availableStock += item.quantity;
                            product.reservedStock -= item.quantity;
                            await manager.save(Product, product);
                            updatedProducts.push(product);

                            this.logger.log(
                                `Restored stock for Product #${product.id}: +${item.quantity} available`
                            );
                        }
                    }
                }

                order.status = OrderStatus.EXPIRED;
                await manager.save(Order, order);

                const auditLog = new AuditLog();
                auditLog.action = 'ORDER_EXPIRED';
                auditLog.resourceType = 'Order';
                auditLog.resourceId = order.id.toString();
                auditLog.userId = order.userId;
                auditLog.payload = { reservationId: order.reservationId };
                auditLog.note = 'Đơn hàng hết hạn thanh toán sau 5 phút TTL, đã trả lại tồn kho';
                await manager.save(AuditLog, auditLog);

                expiredData.push({ orderId: order.id, products: updatedProducts });
                this.logger.log(`Order #${order.id} expired`);
            }
        });

        // EMIT REALTIME EVENTS (sau transaction)
        for (const data of expiredData) {
            for (const product of data.products) {
                this.eventsGateway.emitStockUpdate(
                    product.id,
                    product.availableStock,
                    product.reservedStock,
                    product.soldStock
                );
            }
            this.eventsGateway.emitOrderExpired(data.orderId);
        }
    }
}

