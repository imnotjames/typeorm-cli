import * as process from "process";
import * as yargs from "yargs";
import chalk from "chalk";

import * as TypeORM from "typeorm";
import { importEither } from "../local";

const {createConnection, ConnectionOptionsReader } = importEither("typeorm") as typeof TypeORM;

/**
 * Runs migration command.
 */
export default class MigrationRunCommand implements yargs.CommandModule {

    command = "migration:run";
    describe = "Runs all pending migrations.";
    aliases = "migrations:run";

    builder(args: yargs.Argv) {
        return args
            .option("connection", {
                alias: "c",
                default: "default",
                describe: "Name of the connection on which run a query."
            })
            .option("transaction", {
                alias: "t",
                default: "default",
                describe: "Indicates if transaction should be used or not for migration run. Enabled by default."
            })
            .option("config", {
                alias: "f",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {
        if (args._[0] === "migrations:run") {
            console.log("'migrations:run' is deprecated, please use 'migration:run' instead");
        }

        let connection: TypeORM.Connection|undefined = undefined;
        try {
            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
            Object.assign(connectionOptions, {
                subscribers: [],
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: ["query", "error", "schema"]
            });
            connection = await createConnection(connectionOptions);

            const options = {
                transaction: "all" as "all" | "none" | "each",
            };

            switch (args.t) {
                case "all":
                    options.transaction = "all";
                    break;
                case "none":
                case "false":
                    options.transaction = "none";
                    break;
                case "each":
                    options.transaction = "each";
                    break;
                default:
                    // noop
            }

            await connection.runMigrations(options);
            await connection.close();
            // exit process if no errors
            process.exit(0);

        } catch (err) {
            if (connection) await connection.close();

            console.log(chalk.black.bgRed("Error during migration run:"));
            console.error(err);
            process.exit(1);
        }
    }

}
