import { parseArgs } from 'node:util'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import esbuild from 'esbuild'
import { createRequire } from 'node:module'
/**
 * 解析命令行参数
 */
const {
  values: { format },
  positionals
} = parseArgs({
  allowPositionals: true,
  options: {
    format: {
      type: 'string',
      short: 'f',
      default: 'esm'
    }
  }
})

// 创建 esm 的 filename、 dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const require = createRequire(import.meta.url)
const target = positionals.length ? positionals[0] : 'vue'
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)

const outfile = resolve(
  __dirname,
  `../packages/${target}/dist/${target}.${format}.js`
)

const pkg = require(`../packages/${target}/package.json`)

esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile, // 输出文件
    format, // 打包格式 csj esm iife
    platform: format === 'cjs' ? 'node' : 'browser', // 打包平台 node browse
    sourcemap: true,
    bundle: true, // 把所有的依赖打包到一个文件中
    globalName: pkg.buildOptions.name
  })
  .then(ctx => ctx.watch())
