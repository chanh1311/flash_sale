import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { Product } from '../entities/product.entity';
import { Reservation } from '../entities/reservation.entity';
import { ReservationItem } from '../entities/reservation-item.entity';
import { Order } from '../entities/order.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';

config(); // Load .env

// Cấu hình chung - dùng cho cả NestJS app và TypeORM CLI
export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [Product, Reservation, ReservationItem, Order, User, AuditLog],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    migrationsTableName: 'history_migrations',
    synchronize: false, // Tắt sync
};


export default new DataSource(dataSourceOptions);