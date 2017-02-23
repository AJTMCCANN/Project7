var moment = require('moment')
var Twit = require('twit')
var CONFIG = require('./config.js')

var T = new Twit(CONFIG);

var express = require('express')
var app = express()

var friend_count = new Promise( (resolve, reject) => {
  T.get('users/show', {user_id: 15727386}, function(error, user, response) {
    if (error) { reject(error) }
    resolve(user.friends_count)
  });
})

var friends = new Promise ( (resolve, reject) => {
  T.get('friends/list', {count: 5}, function(error, friends, response) {
    if (error) { reject(error) }
    var frnds = friends.users.map( function(friend, index) {
      var new_friend = {}
      new_friend._id = index
      new_friend.user_name = friend.name
      new_friend.user_id = "@" + friend.screen_name
      new_friend.avatar_img = friend.profile_image_url
      return new_friend
    })
    resolve(frnds)
  })
})

var tweets = new Promise( (resolve, reject) => {
  T.get('statuses/user_timeline', {count: 5}, function(error, tweets, response) {
    if (error) { reject(error) }
    var twts = tweets.map( function(tweet, index) {
      var new_tweet = {}
      new_tweet._id = index
      new_tweet.timestamp = tweet.created_at
      new_tweet.author_name = tweet.user.name
      new_tweet.user_id = "@" + tweet.user.screen_name
      new_tweet.avatar_img = tweet.user.profile_image_url
      new_tweet.text = tweet.text
      new_tweet.retweet_count = tweet.retweet_count
      new_tweet.like_count = tweet.favorite_count
      return new_tweet
    })
    resolve(twts)
  })
})

var direct_to_me = new Promise( (resolve, reject) => {
  T.get('direct_messages', {count: 3}, function(error, messages, response) {
    if (error) { reject(error) }
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
  })
})

var direct_from_me = new Promise( (resolve, reject) => {
    T.get('direct_messages/sent', {count: 2}, function(error, messages, response) {
      if (error) { reject(error) }
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
    })
})


var direct_msgs = new Promise( (resolve, reject) => {
  Promise.all([direct_to_me, direct_from_me]).then( (values) => {
  var all_msgs = values[0].concat(values[1])
  all_msgs.map( (msg, index) => {
    how_long_ago = moment(msg.timestamp, "ddd MMM D HH:mm:ss ZZ YYYY").from(moment())
    msg["how_long_ago"] = how_long_ago
    new_timestamp = parseInt(moment(msg.timestamp, "ddd MMM D HH:mm:ss ZZ YYYY").format("x"))
    msg.timestamp = new_timestamp
    msg._id = index
    return msg
  })
  sorted_msgs = all_msgs.sort((a,b) => {return (a.timestamp - b.timestamp)})
  console.log(sorted_msgs)
  resolve(sorted_msgs)
})})

//TODO: Combine the two get_direct_messages functions into a get_sorted_messages function

promises = [friend_count, friends, tweets, direct_msgs]

app.set('view engine', 'pug')
app.set('views', __dirname +'/views')
app.use(express.static('public'))

app.get('/pug', function(req, res) {
  Promise.all(promises).then( (values) => {
    res.render('template.pug', {friend_count: values[0], friends: values[1], tweets: values[2], messages: values[3]})
  })
})

app.listen(3000, function() {
  console.log("listening on port 3000")
})
