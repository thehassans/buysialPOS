const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = false
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log('> BuysialPOS running on port ' + port)
  })
}).catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
