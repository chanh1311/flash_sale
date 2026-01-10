import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Reservation } from '../entities/reservation.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, Reservation, AuditLog]),
    ],
    providers: [AdminService],
    controllers: [AdminController],
})
export class AdminModule { }
