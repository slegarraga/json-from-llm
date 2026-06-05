import { defineConfig } from 'tsup';

const shared = {
  sourcemap: true,
  target: 'node18',
};

export default defineConfig([
  {
    ...shared,
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  },
  {
    ...shared,
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: false,
    clean: false,
  },
]);
