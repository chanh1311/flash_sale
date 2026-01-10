import { DataSource } from "typeorm";
import { ProductSeeder } from "./ProductSeeder";
import { UserSeeder } from "./UserSeeder";

export class MainSeeder {
    constructor(private dataSource: DataSource) { }

    async run() {
        await new UserSeeder(this.dataSource).run();
        console.log("User seeded!");

        await new ProductSeeder(this.dataSource).run();
        console.log("Product seeded!");
    }
}