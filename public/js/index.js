
$("#tweet-textarea").on("input propertychange", function() {
  $("#tweet-char").text((140 - $(this)[0].value.length))
})

$("#tweet-btn").on("click", function(event) {
  event.preventDefault()
  var this_tweet = $("#tweet-textarea")[0].value
  $.ajax({
    url: "/send-tweet",
    method: "POST",
    data: {tweet: this_tweet},
    timeout: 3000,
    error: (jqXHR) => {console.log(jqXHR)},
    success: (data) => {console.log(data)},
  }).then( () => {
    setTimeout( () => {
      location.reload(true)
    },2000)
  })
})
