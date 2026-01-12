import { DataSource } from "typeorm";
import { Product } from "../../entities/product.entity";

export class ProductSeeder {
    constructor(private dataSource: DataSource) { }

    async run() {
        const productRepository = this.dataSource.getRepository(Product);
        const products: Partial<Product>[] = [];

        for (let i = 1; i <= 10; i++) {
            products.push({
                name: `iPhone 16 Pro Max ${i}`,
                price: 1000000 * i,
                totalStock: 100,
                availableStock: 100,
                reservedStock: 0,
                soldStock: 0,
            });
        }

        await productRepository.save(products);
    }
}
