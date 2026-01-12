import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Reservation } from './reservation.entity';
import { Product } from './product.entity';

@Entity()
export class ReservationItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    productId: number;

    @Column()
    quantity: number;

    @ManyToOne(() => Reservation, (reservation) => reservation.items)
    reservation: Reservation;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'productId' })
    product: Product;
}