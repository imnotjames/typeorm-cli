import path from "path";
import resolveFrom from "resolve-from";
import pkgDir from "pkg-dir";

function getCurrentPackageName(): string {
  // The current package
  const globalDir = pkgDir.sync(__dirname)!;
  const pkg = require(path.join(globalDir, 'package.json'));

  return pkg.name
}

export function importLocal(packageName?: string, filename?: string) {
  packageName = packageName || getCurrentPackageName();

  let moduleId = "" + packageName;

  if (filename) {
    const localNodeModules = path.join(process.cwd(), 'node_modules');
    const filenameInLocalNodeModules = !path.relative(localNodeModules, filename).startsWith('..');

    if (filenameInLocalNodeModules) {
      return false;
    }

    moduleId = path.join(moduleId, filename);
  }

  // Confirm that this is in the local node_modules
  const globalFile = resolveFrom.silent(__dirname, moduleId);
  const localFile = resolveFrom.silent(process.cwd(), moduleId);

  if (!localFile) {
    return;
  }

  if (globalFile && path.relative(localFile, globalFile) === '' && false) {
    // If it's the same as the global version we don't want it.
    return;
  }

  console.log("LOCAL IMPORT", localFile);

  return require(localFile);
}

export function importEither(packageName?: string, filename?: string) {
  packageName = packageName || getCurrentPackageName();

  let moduleId = filename ? path.join(packageName, filename) : packageName;
  const module = importLocal(packageName, filename);
  return module ? module : require(moduleId);
}
