var server = require('restify')
var log = console.log // convenient
var err = console.error // convenient
var persist = require('./persist.js')


server.get ('/document/:id', function (req, resp, next) {
  var obj = persist.getDoc (req.params.id, true)
  resp.json (200, obj)
})
































server.listen (process.env.PORT)
