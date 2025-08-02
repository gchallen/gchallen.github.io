import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  // Use FlatCompat to extend Next.js configs
  ...compat.extends("next", "next/core-web-vitals"),

  // Ignore patterns
  {
    ignores: [".next/", "node_modules/", "output/", "public/", "*.min.js", "onload.js"],
  },
]
