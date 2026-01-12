import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';
import { Reservation, ReservationStatus } from '../entities/reservation.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Reservation)
        private reservationRepository: Repository<Reservation>,
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) { }

    /**
     * Lấy danh sách Orders (filter theo status nếu có)
     */
    async getOrders(status?: OrderStatus): Promise<Order[]> {
        const where = status ? { status } : {};
        return this.orderRepository.find({
            where,
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Lấy danh sách Reservations (filter theo status nếu có)
     */
    async getReservations(status?: ReservationStatus): Promise<Reservation[]> {
        const where = status ? { status } : {};
        return this.reservationRepository.find({
            where,
            relations: ['items', 'items.product'],
            order: { createdAt: 'DESC' }
        });
    }

    /**
     * Lấy top 50 Audit Logs gần nhất
     */
    async getAuditLogs(limit: number = 50): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            relations: ['user'],
            order: { createdAt: 'DESC' },
            take: limit
        });
    }
}
