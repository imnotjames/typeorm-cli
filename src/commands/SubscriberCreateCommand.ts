import {CommandUtils} from "../CommandUtils";
import * as yargs from "yargs";
import chalk from "chalk";

import * as TypeORM from "typeorm";
import { importEither } from "../local";

const { ConnectionOptionsReader } = importEither("typeorm") as typeof TypeORM;

/**
 * Generates a new subscriber.
 */
export default class SubscriberCreateCommand implements yargs.CommandModule {
    command = "subscriber:create";
    describe = "Generates a new subscriber.";

    builder(args: yargs.Argv) {
        return args
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the subscriber class.",
                demand: true
            })
            .option("d", {
                alias: "dir",
                describe: "Directory where subscriber should be created."
            })
            .option("f", {
                alias: "config",
                default: "ormconfig",
                describe: "Name of the file with connection configuration."
            });
    }

    async handler(args: yargs.Arguments) {

        try {
            const fileContent = SubscriberCreateCommand.getTemplate(args.name as any);
            const filename = args.name + ".ts";
            let directory = args.dir as string | undefined;

            // if directory is not set then try to open tsconfig and find default path there
            if (!directory) {
                try {
                    const connectionOptionsReader = new ConnectionOptionsReader({
                        root: process.cwd(),
                        configName: args.config as any
                    });
                    const connectionOptions = await connectionOptionsReader.get(args.connection as any);
                    directory = connectionOptions.cli ? (connectionOptions.cli.subscribersDir || "") : "";
                } catch (err) { }
            }

            if (directory && !directory.startsWith("/")) {
                directory = process.cwd() + "/" + directory;
            }
            const path = (directory ? (directory + "/") : "") + filename;
            await CommandUtils.createFile(path, fileContent);
            console.log(chalk.green(`Subscriber ${chalk.blue(path)} has been created successfully.`));

        } catch (err) {
            console.log(chalk.black.bgRed("Error during subscriber creation:"));
            console.error(err);
            process.exit(1);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the entity file.
     */
    protected static getTemplate(name: string): string {
        return `import {EventSubscriber, EntitySubscriberInterface} from "typeorm";

@EventSubscriber()
export class ${name} implements EntitySubscriberInterface<any> {

}
`;
    }

}
