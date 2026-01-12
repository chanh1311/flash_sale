import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Product } from '../entities/product.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { ReservationItem } from '../entities/reservation-item.entity';
import { Order } from '../entities/order.entity';
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
            auditLog.note = 'Khóa tồn kho bằng Pessimistic Lock';

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

    /**
     * Lấy chi tiết reservation với items, products, và order nếu có
     */
    async getReservationDetail(userId: number, reservationId: number) {
        const reservation = await this.dataSource.getRepository(Reservation).findOne({
            where: { id: reservationId },
            relations: ['items', 'items.product'],
        });

        if (!reservation) {
            throw new NotFoundException(`Reservation #${reservationId} not found`);
        }

        // Validate ownership
        if (reservation.userId !== userId) {
            throw new ForbiddenException('You do not own this reservation');
        }

        // Check if order exists for this reservation
        const order = await this.dataSource.getRepository(Order).findOne({
            where: { reservationId: reservationId },
        });

        return {
            ...reservation,
            order: order || null,
        };
    }

    /**
     * Lấy danh sách reservation của user
     */
    async getUserReservations(userId: number) {
        // Lấy tất cả reservation của user
        const reservations = await this.dataSource.getRepository(Reservation).find({
            where: { userId },
            relations: ['items', 'items.product'],
            order: { createdAt: 'DESC' },
        });

        // Lấy tất cả orders của user để map vào reservation
        const orders = await this.dataSource.getRepository(Order).find({
            where: { userId },
        });

        // Map order vào reservation tương ứng
        return reservations.map(res => {
            const order = orders.find(o => o.reservationId === res.id);
            // Nếu đã có order, status của reservation coi như đã complete (dù DB có thể chưa update kịp)
            // Hoặc đơn giản là trả về kèm order info để frontend xử lý
            return {
                ...res,
                order: order || null
            };
        });
    }
}

