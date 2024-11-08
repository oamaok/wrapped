import esbuild from 'esbuild'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'

const isProduction = process.env.NODE_ENV === 'production'
const isWatch = process.argv.some((arg) => arg === '--watch')

const ctx = await esbuild.context({
  entryPoints: ['./src/index.tsx'],
  bundle: true,
  outdir: './dist/',
  minify: isProduction,
  loader: {
    '.woff': 'file',
    '.woff2': 'file',
    '.gif': 'file',
    '.svg': 'file',
  },
  plugins: [
    sassPlugin({
      transform: postcssModules({
        basedir: './src/',
        generateScopedName: '[name]_[local]_[hash:base64:5]',
      }),
    }),
    {
      name: 'build-time',
      setup({ onStart, onEnd }) {
        onStart(() => {
          console.log('Building client...')
          console.time('Build client')
        })
        onEnd(() => {
          console.timeEnd('Build client')
        })
      },
    },
  ],
})

if (isWatch) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  await ctx.dispose()
}
