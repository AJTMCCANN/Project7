var express = require('express')
var app = express()

app.set('view engine', 'pug')
app.set('views', __dirname +'/views')
app.use(express.static('public'))

app.get('/pug', function(req, res) {
  res.render('template.pug')
})

app.listen(3000, function() {
  console.log("listening on port 3000")
})
