import data from './data.json' with { type: 'json' }
import fetch from 'node-fetch'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dir = path.resolve(__dirname, 'client/dist/attachments')
await fs.mkdir(dir, { recursive: true })

for (const attachment of data.allAttachments) {
  console.log('downloading', attachment)
  const file = await fetch(attachment.url).then((res) => {
    if (res.status !== 200) throw res
    return res.body
  })
  const url = new URL(attachment.url)
  const ext = url.pathname.split('.').pop()
  const filename = attachment.id + '.' + ext
  await fs.writeFile(path.resolve(dir, filename), file)
}

process.exit(0)
