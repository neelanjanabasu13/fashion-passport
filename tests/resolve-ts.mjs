/**
 * Minimal resolver so Node's built-in test runner can load the app's
 * extensionless TypeScript imports. Deliberately ~10 lines instead of adding a
 * test framework or a bundler as a dependency.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      /* fall through to the default resolution below */
    }
  }
  return nextResolve(specifier, context);
}
