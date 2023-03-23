const dts = require("rollup-plugin-dts");

const config = [
  {
    input: "./dist/dts/index.d.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts.default()],
  },
];

export default config;
