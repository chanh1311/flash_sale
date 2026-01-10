import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from '../entities/reservation.entity';
import { ReservationItem } from '../entities/reservation-item.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { ExpirationService } from './expiration.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Reservation,
            ReservationItem,
            Order,
            Product,
            AuditLog,
        ]),
    ],
    providers: [ExpirationService],
    exports: [ExpirationService],
})
export class SchedulerModule { }
