import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { OrderStatus } from '../entities/order.entity';
import { ReservationStatus } from '../entities/reservation.entity';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    /**
     * GET /admin/orders
     * Query: ?status=PAID | PENDING_PAYMENT | EXPIRED | CANCELLED
     */
    @Get('orders')
    async getOrders(@Query('status') status?: OrderStatus) {
        return this.adminService.getOrders(status);
    }

    /**
     * GET /admin/reservations
     * Query: ?status=ACTIVE | COMPLETED | EXPIRED | CANCELLED
     */
    @Get('reservations')
    async getReservations(@Query('status') status?: ReservationStatus) {
        return this.adminService.getReservations(status);
    }

    /**
     * GET /admin/audit-logs
     * Trả về top 50 logs gần nhất
     */
    @Get('audit-logs')
    async getAuditLogs() {
        return this.adminService.getAuditLogs(50);
    }
}
