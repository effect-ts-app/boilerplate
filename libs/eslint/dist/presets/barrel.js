"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.barrel = void 0;
const generator_1 = __importDefault(require("@babel/generator"));
const parser_1 = require("@babel/parser");
const glob = __importStar(require("glob"));
const io_ts_extra_1 = require("io-ts-extra");
const lodash = __importStar(require("lodash"));
const path = __importStar(require("path"));
/**
 * Bundle several modules into a single convenient one.
 *
 * @example
 * // codegen:start {preset: barrel, include: some/path/*.ts, exclude: some/path/*util.ts}
 * export * from './some/path/module-a'
 * export * from './some/path/module-b'
 * export * from './some/path/module-c'
 * // codegen:end
 *
 * @param include
 * [optional] If specified, the barrel will only include file paths that match this glob pattern
 * @param exclude
 * [optional] If specified, the barrel will exclude file paths that match these glob patterns
 * @param import
 * [optional] If specified, matching files will be imported and re-exported rather than directly exported
 * with `export * from './xyz'`. Use `import: star` for `import * as xyz from './xyz'` style imports.
 * Use `import: default` for `import xyz from './xyz'` style imports.
 * @param export
 * [optional] Only valid if the import style has been specified (either `import: star` or `import: default`).
 * If specified, matching modules will be bundled into a const or default export based on this name. If set
 * to `{name: someName, keys: path}` the relative file paths will be used as keys. Otherwise the file paths
 * will be camel-cased to make them valid js identifiers.
 */
const barrel = ({ meta, options: opts }) => {
    var _a;
    const cwd = path.dirname(meta.filename);
    const nodir = (_a = opts.nodir) !== null && _a !== void 0 ? _a : true;
    const ext = meta.filename.split('.').slice(-1)[0];
    const pattern = opts.include || `*.${ext}`;
    const relativeFiles = glob
        .sync(pattern, { cwd, ignore: opts.exclude, nodir })
        .filter((f) => path.resolve(cwd, f) !== path.resolve(meta.filename))
        .map((f) => `./${f}`.replace(/(\.\/)+\./g, '.'))
        .filter((file) => nodir
        ? ['.js', '.mjs', '.ts', '.tsx'].includes(path.extname(file))
        : true)
        .map((f) => f.replace(/\.\w+$/, '').replace(/\/$/, ''));
    const expectedContent = (0, io_ts_extra_1.match)(opts.import)
        .case(undefined, () => (0, io_ts_extra_1.match)(opts.export)
        .case({ as: 'PascalCase' }, () => lodash
        .chain(relativeFiles)
        .map((f) => `export * as ${lodash
        .startCase(lodash.camelCase(f))
        .replace(/ /g, "") // why?
        .replace(/\//, '')} from '${f}.js'`)
        .value()
        .join('\n'))
        .default(() => {
        return relativeFiles.map((f) => `export * from '${f}.js'`).join('\n');
    })
        .get())
        .case(String, (s) => {
        const importPrefix = s === 'default' ? '' : '* as ';
        const withIdentifiers = lodash
            .chain(relativeFiles)
            .map((f) => ({
            file: f,
            identifier: lodash
                .camelCase(f)
                .replace(/^([^a-z])/, '_$1')
                .replace(/Index$/, ''),
        }))
            .groupBy((info) => info.identifier)
            .values()
            .flatMap((group) => group.length === 1
            ? group
            : group.map((info, i) => ({
                ...info,
                identifier: `${info.identifier}_${i + 1}`,
            })))
            .value();
        const imports = withIdentifiers
            .map((i) => `import ${importPrefix}${i.identifier} from '${i.file}'`)
            .join('\n');
        const exportProps = (0, io_ts_extra_1.match)(opts.export)
            .case({ name: String, keys: 'path' }, () => withIdentifiers.map((i) => `${JSON.stringify(i.file)}: ${i.identifier}`))
            .default(() => withIdentifiers.map((i) => i.identifier))
            .get();
        const exportPrefix = (0, io_ts_extra_1.match)(opts.export)
            .case(undefined, () => 'export')
            .case('default', () => 'export default')
            .case({ name: 'default' }, () => 'export default')
            .case(String, (name) => `export const ${name} =`)
            .case({ name: String }, ({ name }) => `export const ${name} =`)
            .default(() => '')
            .get();
        const exports = exportProps.join(',\n ');
        return `${imports}\n\n${exportPrefix} {\n ${exports}\n}\n`;
    })
        .get();
    // ignore stylistic differences. babel generate deals with most
    const normalise = (str) => (0, generator_1.default)((0, parser_1.parse)(str, { sourceType: 'module', plugins: ['typescript'] }))
        .code.replace(/'/g, `"`)
        .replace(/\/index/g, '');
    try {
        if (normalise(expectedContent) === normalise(meta.existingContent)) {
            return meta.existingContent;
        }
    }
    catch (_b) { }
    return expectedContent;
};
exports.barrel = barrel;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFycmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3ByZXNldHMvYmFycmVsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaUVBQXdDO0FBQ3hDLDBDQUFzQztBQUV0QywyQ0FBNkI7QUFDN0IsNkNBQW9DO0FBQ3BDLCtDQUFpQztBQUNqQywyQ0FBNkI7QUFFN0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBdUJHO0FBQ0ksTUFBTSxNQUFNLEdBU2QsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRTs7SUFDL0IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDeEMsTUFBTSxLQUFLLEdBQUcsTUFBQSxJQUFJLENBQUMsS0FBSyxtQ0FBSSxJQUFJLENBQUM7SUFFakMsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBRTNDLE1BQU0sYUFBYSxHQUFHLElBQUk7U0FDdkIsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQztTQUNuRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ25FLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENB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