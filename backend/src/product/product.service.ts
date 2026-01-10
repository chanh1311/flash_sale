import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
    ) { }

    /**
     * Lấy danh sách tất cả sản phẩm
     */
    async findAll(): Promise<Product[]> {
        return this.productRepository.find({
            order: { id: 'ASC' }
        });
    }

    /**
     * Lấy chi tiết sản phẩm theo ID
     */
    async findOne(id: number): Promise<Product> {
        const product = await this.productRepository.findOne({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product #${id} not found`);
        }
        return product;
    }
}
