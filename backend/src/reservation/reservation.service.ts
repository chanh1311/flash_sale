import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Product } from '../entities/product.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { ReservationItem } from '../entities/reservation-item.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { EventsGateway } from '../gateway/events.gateway';

@Injectable()
export class ReservationService {
    constructor(
        private dataSource: DataSource,
        private eventsGateway: EventsGateway,
    ) { }

    async createReservation(userId: number, dto: CreateReservationDto) {
        // 1. BẮT ĐẦU TRANSACTION (ACID)
        const result = await this.dataSource.transaction(async (manager) => {
            const { items, idempotencyKey } = dto;

            // 0. CHECK IDEMPOTENCY (Nếu có key)
            if (idempotencyKey) {
                const existing = await manager.findOne(Reservation, { where: { idempotencyKey } });
                if (existing) {
                    return { reservation: existing, isExisting: true, updatedProducts: [] }; // Trả về kết quả cũ
                }
            }

            const reservationItems: ReservationItem[] = [];
            const updatedProducts: Product[] = [];

            // 2. DUYỆT QUA TỪNG MÓN HÀNG
            for (const itemDto of items) {

                // PESSIMISTIC LOCKING (FOR UPDATE)
                const product = await manager.findOne(Product, {
                    where: { id: itemDto.productId },
                    lock: { mode: 'pessimistic_write' },
                });

                if (!product) {
                    throw new NotFoundException(`Product #${itemDto.productId} not found`);
                }

                // 3. KIỂM TRA TỒN KHO (Check Oversell)
                if (product.availableStock < itemDto.quantity) {
                    throw new BadRequestException(
                        `Oversell blocked! Product '${product.name}' only has ${product.availableStock}, requested ${itemDto.quantity}`
                    );
                }

                // 4. CẬP NHẬT TỒN KHO
                product.availableStock -= itemDto.quantity;
                product.reservedStock += itemDto.quantity;

                await manager.save(product);
                updatedProducts.push(product);

                // Chuẩn bị data items
                const resItem = new ReservationItem();
                resItem.productId = product.id;
                resItem.quantity = itemDto.quantity;
                reservationItems.push(resItem);
            }

            // 5. TẠO RESERVATION
            const reservation = new Reservation();
            reservation.userId = userId;
            reservation.status = ReservationStatus.ACTIVE;
            reservation.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            reservation.items = reservationItems;
            reservation.idempotencyKey = idempotencyKey;

            const savedReservation = await manager.save(Reservation, reservation);

            // 6. GHI AUDIT LOG 
            const auditLog = new AuditLog();
            auditLog.action = 'CREATE_RESERVATION';
            auditLog.resourceType = 'Reservation';
            auditLog.resourceId = savedReservation.id.toString();
            auditLog.userId = userId;
            auditLog.payload = { items: dto.items, idempotencyKey };
            auditLog.note = 'Stock locked via Pessimistic Lock';

            await manager.save(AuditLog, auditLog);

            return { reservation: savedReservation, isExisting: false, updatedProducts };
        });

        // 7. EMIT REALTIME EVENTS (sau transaction thành công)
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

            // Emit reservation created
            this.eventsGateway.emitReservationCreated(
                result.reservation.id,
                userId,
                dto.items
            );
        }

        return result.reservation;
    }
}

