import { DataSource } from "typeorm";
import { User, UserRole } from "../../entities/user.entity";
import * as bcrypt from 'bcrypt';

export class UserSeeder {
    constructor(private dataSource: DataSource) { }

    async run() {
        const userRepository = this.dataSource.getRepository(User);
        const password = await bcrypt.hash("password123", 10);

        const users = [
            {
                email: "admin@example.com",
                name: "Admin User",
                password: password,
                role: UserRole.ADMIN,
            },
            {
                email: "user@example.com",
                name: "Test User",
                password: password,
                role: UserRole.USER,
            }
        ];

        for (const userData of users) {
            const existingUser = await userRepository.findOne({ where: { email: userData.email } });
            if (!existingUser) {
                await userRepository.save(userRepository.create(userData));
            } else {
                // Update name nếu chưa có
                if (!existingUser.name) {
                    existingUser.name = userData.name;
                    await userRepository.save(existingUser);
                }
            }
        }
    }
}
