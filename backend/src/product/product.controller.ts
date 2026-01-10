import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    /**
     * GET /products
     * Danh sách sản phẩm (Public)
     */
    @Get()
    async findAll() {
        return this.productService.findAll();
    }

    /**
     * GET /products/:id
     * Chi tiết sản phẩm (Public)
     */
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }
}
