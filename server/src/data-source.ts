import { DataSource } from "typeorm"
import { Post } from "./entities/Post"
import { User } from "./entities/User"
import { Updoot } from "./entities/Updoot"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "computer7",
    database: "yarnitdb",
    entities: [Post, User, Updoot],
    migrations: ["src/migrations/*.ts"],
    synchronize: false, // Set this to false when using migrations
    logging: true,
}) 