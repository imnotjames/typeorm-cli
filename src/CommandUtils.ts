import * as fs from "fs";
import * as path from "path";
import mkdirp from "mkdirp";

/**
 * Command line utils functions.
 */
export class CommandUtils {
    /**
     * Converts string into camelCase.
     *
     * @see http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
     */
    static camelCase(str: string, firstCapital: boolean = false): string {
        return str.replace(/^([A-Z])|[\s-_](\w)/g, function(match, p1, p2, offset) {
            if (firstCapital === true && offset === 0) return p1;
            if (p2) return p2.toUpperCase();
            return p1.toLowerCase();
        });
    }

    /**
     * Creates directories recursively.
     */
    static createDirectories(directory: string) {
        return mkdirp(directory);
    }

    /**
     * Creates a file with the given content in the given path.
     */
    static async createFile(filePath: string, content: string, override: boolean = true): Promise<void> {
        await CommandUtils.createDirectories(path.dirname(filePath));
        return new Promise<void>((ok, fail) => {
            if (override === false && fs.existsSync(filePath))
                return ok();

            fs.writeFile(filePath, content, err => err ? fail(err) : ok());
        });
    }

    /**
     * Reads everything from a given file and returns its content as a string.
     */
    static async readFile(filePath: string): Promise<string> {
        return new Promise<string>((ok, fail) => {
            fs.readFile(filePath, (err, data) => err ? fail(err) : ok(data.toString()));
        });
    }


    static async fileExists(filePath: string) {
        return fs.existsSync(filePath);
    }
}
