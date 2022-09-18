import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import dts from "vite-plugin-dts";
import { ModuleFormat } from "rollup";

const getFileEndingFromFormat = (format: ModuleFormat) => {
  switch (format) {
    case "es":
    case "esm":
    case "module":
      return ".mjs";
    case "cjs":
    case "commonjs":
      return ".cjs";
    default:
      return `.${format}.js`;
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: "src"
    }),
  ],
  build: {
    outDir: "dist",
    lib: {
      entry: resolve(__dirname, "lib/index.ts"),
      name: "index",
      formats: ["es", "umd"],
      fileName: (format) =>
        `index${getFileEndingFromFormat(format)}`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
