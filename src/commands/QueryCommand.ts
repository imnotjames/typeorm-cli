import * as yargs from "yargs";
import chalk from "chalk";
import {highlight, Theme} from "cli-highlight";

import * as TypeORM from "typeorm";
import { importEither } from "../local";

const {createConnection, ConnectionOptionsReader } = importEither("typeorm") as typeof TypeORM;


/**
 * Highlights sql string to be print in the console.
 */
function highlightSql(sql: string) {
    const theme: Theme = {
        "keyword": chalk.blueBright,
        "literal": chalk.blueBright,
        "string": chalk.white,
        "type": chalk.magentaBright,
        "built_in": chalk.magentaBright,
        "comment": chalk.gray,
    };
    return highlight(sql, { theme: theme, language: "sql" });
}

/**
 * Highlights json string to be print in the console.
 */
function highlightJson(json: string) {
    return highlight(json, { language: "json" });
}
/**
 * Executes an sql query on the given connection.
 */
export default class QueryCommand implements yargs.CommandModule {
    command = "query";
    describe = "Executes given SQL query on a default connection. Specify connection name to run query on a specific connection.";

    builder(args: yargs.Argv) {
        return args
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {

        let connection: TypeORM.Connection|undefined = undefined;
        let queryRunner: TypeORM.QueryRunner|undefined = undefined;
        try {

            // create a connection
            const connectionOptionsReader = new ConnectionOptionsReader({
                root: process.cwd(),
                configName: args.config as any
            });
            const connectionOptions = await connectionOptionsReader.get(args.connection as any);
            Object.assign(connectionOptions, {
                synchronize: false,
                migrationsRun: false,
                dropSchema: false,
                logging: false
            });
            connection = await createConnection(connectionOptions);

            // create a query runner and execute query using it
            queryRunner = connection.createQueryRunner();
            console.log(chalk.green("Running query: ") + highlightSql(args._[1]));
            const queryResult = await queryRunner.query(args._[1]);
            console.log(chalk.green("Query has been executed. Result: "));
            console.log(highlightJson(JSON.stringify(queryResult, undefined, 2)));

            await queryRunner.release();
            await connection.close();

        } catch (err) {
            if (queryRunner) await queryRunner.release();
            if (connection) await connection.close();

            console.log(chalk.black.bgRed("Error during query execution:"));
            console.error(err);
            process.exit(1);
        }
    }
}
