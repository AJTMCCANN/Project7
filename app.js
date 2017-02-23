var Twit = require('twit')
var CONFIG = require('./config.js')

var T = new Twit(CONFIG);

var express = require('express')
var app = express()

var friend_count = new Promise( (resolve, reject) => {
  T.get('users/show', {user_id: 15727386}, function(error, user, response) {
    if (error) {console.error(error)}
    console.log(user.friends_count)
    resolve(user.friends_count)
  });
})

var friends = new Promise ( (resolve, reject) => {
  T.get('friends/list', {count: 5}, function(error, friends, response) {
    if (error) {console.error(error)}
    var frnds = friends.users.map( function(friend, index) {
      var new_friend = {}
      new_friend._id = index
      new_friend.user_name = friend.name
      new_friend.user_id = "@" + friend.screen_name
      new_friend.avatar_img = friend.profile_image_url
      return new_friend
    })
    // console.log(frnds)
    resolve(frnds)
  })
})

// var tweets = function get_tweets() {
//   T.get('statuses/user_timeline', {count: 5}, function(error, tweets, response) {
//     if (error) {console.error(error)}
//     var twts = tweets.map( function(tweet, index) {
//       var new_tweet = {}
//       new_tweet._id = index
//       new_tweet.timestamp = tweet.created_at
//       new_tweet.author_name = tweet.user.name
//       new_tweet.user_id = "@" + tweet.user.screen_name
//       new_tweet.avatar_img = tweet.user.profile_image_url
//       new_tweet.text = tweet.text
//       new_tweet.retweet_count = tweet.retweet_count
//       new_tweet.like_count = tweet.favorite_count
//       return new_tweet
//     })
//     // console.log(twts)
//     return twts
//   })
// }
//
// function get_direct_messages_to_me() {
//   T.get('direct_messages', {count: 5}, function(error, messages, response) {
//     if (error) {console.error(error)}
//     var msgs = messages.map( function(message, index) {
//       var new_msg = {}
//       new_msg._id = index
//       new_msg.avatar_img = message.sender.profile_image_url
//       new_msg.text = message.text
//       new_msg.timestamp = message.created_at
//       new_msg.origin = "app--message"
//       return new_msg
//     })
//     // console.log(msgs)
//     return msgs
//   })
// }
//
// function get_direct_messages_from_me() {
//     T.get('direct_messages/sent', {count: 5}, function(error, messages, response) {
//       if (error) {console.error(error)}
//       var msgs = messages.map( function(message, index) {
//         var new_msg = {}
//         new_msg._id = index
//         new_msg.avatar_img = message.sender.profile_image_url
//         new_msg.text = message.text
//         new_msg.timestamp = message.created_at
//         new_msg.origin = "app--message--me"
//         return new_msg
//       })
//       // console.log(msgs)
//       return msgs
//     })
// }

//TODO: Combine the two get_direct_messages functions into a get_sorted_messages function

console.log(typeof friend_count)

app.set('view engine', 'pug')
app.set('views', __dirname +'/views')
app.use(express.static('public'))

app.get('/pug', function(req, res) {
  friends.then( (friends) => {
    res.render('template.pug', {friends: friends})
  })
})

app.listen(3000, function() {
  console.log("listening on port 3000")
})
