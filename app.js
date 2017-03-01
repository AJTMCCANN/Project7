//  Requires

var moment = require("moment")
var Twit = require("twit")
var express = require("express")
var bodyParser = require("body-parser")

var CONFIG = require("./config.js")

// Initialize

var T = new Twit(CONFIG)
var app = express()

// View layer details

app.set("view engine", "pug")
app.set("views", __dirname +"/views")
// serves the static assets

app.use(express.static("public"))

// attaches the body object to the POST body request

app.use(bodyParser.urlencoded({extended: true}))

// Error handling middleware must be declared last

app.use( (err, req, res, next) => {
  res.status(500)
  res.render("error.pug", { error: err })
})

//

var user_info = new Promise( (resolve, reject) => {
  T.get("users/show", {user_id: 15727386}, function(error, user) {
    if (error) { reject(error) }
    else {
      var usr_inf = {}
      usr_inf.friends_count = user.friends_count
      usr_inf.screen_name = user.screen_name
      usr_inf.background_img = user.profile_banner_url
      usr_inf.avatar_img = user.profile_image_url
      resolve(usr_inf)
    }
  })
})

var friends = new Promise ( (resolve, reject) => {
  T.get("friends/list", {count: 5}, function(error, friends) {
    if (error) { reject(error) } else {
      var frnds = friends.users.map( function(friend, index) {
        var new_friend = {}
        new_friend._id = index
        new_friend.user_name = friend.name
        new_friend.user_id = "@" + friend.screen_name
        new_friend.avatar_img = friend.profile_image_url
        return new_friend
      })
      resolve(frnds)
    }
  })
})

var tweets = new Promise( (resolve, reject) => {
  T.get("statuses/user_timeline", {count: 5}, function(error, tweets) {
    if (error) { reject(error) } else {
      var twts = tweets.map( function(tweet, index) {
        var new_tweet = {}
        new_tweet._id = index
        new_tweet.timestamp = moment(tweet.created_at, "ddd MMM D HH:mm:ss ZZ YYYY").from(moment())
        new_tweet.author_name = tweet.user.name
        new_tweet.user_id = "@" + tweet.user.screen_name
        new_tweet.avatar_img = tweet.user.profile_image_url
        new_tweet.text = tweet.text
        new_tweet.retweet_count = tweet.retweet_count
        new_tweet.like_count = tweet.favorite_count
        return new_tweet
      })
      resolve(twts)
    }
  })
})

var direct_to_me = new Promise( (resolve, reject) => {
  T.get("direct_messages", {count: 2}, function(error, messages) {
    if (error) { reject(error) } else {
      var msgs = messages.map( function(message, index) {
        var new_msg = {}
        new_msg._id = index
        new_msg.avatar_img = message.sender.profile_image_url
        new_msg.text = message.text
        new_msg.timestamp = message.created_at
        new_msg.origin = "app--message"
        return new_msg
      })
      resolve(msgs)
    }
  })
})

var direct_from_me = new Promise( (resolve, reject) => {
  T.get("direct_messages/sent", {count: 3}, function(error, messages) {
    if (error) { reject(error) } else {
      var msgs = messages.map( function(message, index) {
        var new_msg = {}
        new_msg._id = index
        new_msg.avatar_img = message.sender.profile_image_url
        new_msg.text = message.text
        new_msg.timestamp = message.created_at
        new_msg.origin = "app--message--me"
        return new_msg
      })
      resolve(msgs)
    }
  })
})


var direct_msgs = new Promise( (resolve, reject) => {
  Promise.all([direct_to_me, direct_from_me]).then( (values) => {
    var all_msgs = values[0].concat(values[1])
    all_msgs.map( (msg, index) => {
      var how_long_ago = moment(msg.timestamp, "ddd MMM D HH:mm:ss ZZ YYYY").from(moment())
      msg["how_long_ago"] = how_long_ago
      var new_timestamp = parseInt(moment(msg.timestamp, "ddd MMM D HH:mm:ss ZZ YYYY").format("x"))
      msg.timestamp = new_timestamp
      msg._id = index
      return msg
    })
    var sorted_msgs = all_msgs.sort((a,b) => {return (a.timestamp - b.timestamp)})
    resolve(sorted_msgs)
  }).catch( (error) => { reject(error) })
})

var promises = [user_info, friends, tweets, direct_msgs]

// Routes

app.get("/", function(req, res) {
  Promise.all(promises).then( (values) => {
    res.render("template.pug", {user_info: values[0], friends: values[1], tweets: values[2], messages: values[3]})
    values[2].forEach( (item, index) => {
      console.log(index + " " + item.text)
    })
  }).catch( (error) => { res.render("error.pug", {error: error}) })
})

app.post("/send-tweet", function(req, res) {
  T.post("statuses/update", {status: req.body.tweet}, function(error, data) {
    if (error) { res.render("error.pug", {error: "Unable to post your tweet"}) }
    else { res.send("tweeted \"" + req.body.tweet + "\"") }
  })
})

app.get("*", function(req, res) {
  res.render("error.pug", {error: "That page doesn't exist"})
})

app.listen(3000, function() {
  console.log("listening on port 3000")
})
