/**
 * linuxdeploy 1-alpha asks plugins for both their API version and type. Older
 * Tauri downloads only understand the first probe. Keep this narrowly scoped
 * compatibility patch idempotent so a clean cache and a partially patched
 * cache behave identically.
 */
export function patchGtkPlugin(source) {
  if (source.includes("--plugin-type)")) return source;

  const apiCase = /(--plugin-api-version\)\s*\n\s*echo\s+"0"\s*\n)(?:\s*exit 0\s*\n)?(\s*;;)/;
  if (!apiCase.test(source)) return source;

  return source.replace(apiCase, (_, probe, terminator) => `${probe}            exit 0\n${terminator}
        --plugin-type)
            echo "input"
            exit 0
            ;;`);
}
