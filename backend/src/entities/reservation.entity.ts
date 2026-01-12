import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ReservationItem } from './reservation-item.entity'

export enum ReservationStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED', // Đã chuyển thành Order
    EXPIRED = 'EXPIRED',     // Hết 10 phút không mua
    CANCELLED = 'CANCELLED'
}

@Entity()
export class Reservation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;
    @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.ACTIVE })
    status: ReservationStatus;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @OneToMany(() => ReservationItem, (item) => item.reservation, { cascade: true })
    items: ReservationItem[];

    @Column({ unique: true, nullable: true })
    idempotencyKey?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;
}