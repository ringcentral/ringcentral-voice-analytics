var havenondemand = require('havenondemand')
var hodClient = new havenondemand.HODClient(process.env.HOD_APIKEY, "v2")
console.log("key: " + process.env.HOD_APIKEY)
const pgdb = require('./db')

var callActionDictionary = ['my number is', 'my cell phone is', 'my cell number is', 'my phone number is', 'call me back', 'give me a call', 'ring me mback', 'reach me at']

module.exports.haven_sentiment = function(table, blockTimeStamp, conversations, input, transcript, id, callback){
  var thisId = id
  var thisCallback = callback
  var data = {}
  data['keywords'] = escape(JSON.stringify(input.keywords))
  var subject = ""
  if (for var nn=0; nn<input.keywords.length; nn++){
    subject += input.keywords[nn].text
    var subjectArr = concept.split(" ")
    if (subjectArr.length > 1)
      break
  }
  if (subject != "")
    data['subject'] = subject
  else
    data['subject'] = "Not defined"
  //data['entities'] = escape(JSON.stringify(input.entities))
  //data['concepts'] = escape(JSON.stringify(input.concepts))

  //"categories":[{"score":0.706865,"label":"/style and fashion/accessories/backpacks"},{"score":0.383294,"label":"/business and industrial/advertising and marketing/advertising"},{"score":0.347209,"label":"/shopping/retail"}]}
  var categories = []
  //var classification = input.categories
  input.categories.forEach(category => {
    if (category.score > 0.2)
      categories.push(category.label)
    console.log("CAT Label: " + category.label)
    console.log(`Label: ${category.label}, Score: ${category.score}`);
  });
  if (categories.length == 0)
    categories.push('Unclassified')
  input['categories'] = categories

  data['categories'] = escape(JSON.stringify(categories))
  var textArr = []
  for (var i=0; i<conversations.length; i++)
    textArr.push(conversations[i].sentence.join(" "))
  var request = {'text' : textArr}
  hodClient.get('analyzesentiment', request, false, function(err, resp, body) {
    if (!err) {
      console.log("HOD SENTIMENT")
        var results = []
        var count = 0
        var score = 0
        var num = 0
        var hi = 0
        var low = 0
        for (var sentence of resp.body.sentiment_analysis){
          if (sentence.aggregate.score != 0){
            var modSentence = {}
            if (count < conversations.length){
              modSentence['timeStamp'] = conversations[count].timestamp[0]
              modSentence['speakerId'] = conversations[count].speakerId
            }
            modSentence['sentence'] = textArr[count]
            var posArr = []
            var negArr = []
            modSentence['sentiment_label'] = sentence.aggregate.sentiment
            modSentence['sentiment_score'] = sentence.aggregate.score
            for (var pos of sentence.positive){
              var posObj = {}
              posObj['topic'] = pos.topic
              posObj['sentiment'] = pos.sentiment
              posObj['score'] = pos.score
              posObj['text'] = pos.original_text
              if (pos.score > hi)
                hi = pos.score
              score += pos.score
              num++
              posArr.push(posObj)
            }
            if (posArr.length > 0)
              modSentence['positive'] = posArr

            for (var neg of sentence.negative){
              var negObj = {}
              negObj['topic'] = neg.topic
              negObj['sentiment'] = neg.sentiment
              negObj['score'] = neg.score
              negObj['text'] = neg.original_text
              if (neg.score < low)
                low = neg.score
              score += neg.score
              num++
              negArr.push(negObj)
            }
            if (negArr.length > 0)
              modSentence['negative'] = negArr

            results.push(modSentence)
          }else{
            console.log(textArr[count])
          }
          count++
        }

        var average = score/num
        //console.log("SCORE :" + average)
        if (average > 0.4)
          data['sentiment_label'] = "positive"
        else if (average < -0.4)
          data['sentiment_label'] = "negative"
        else
          data['sentiment_label'] = "neutral"
        data['sentiment_score'] = score
        data['sentiment_score_hi'] = hi
        data['sentiment_score_low'] = low
        data['emotion'] =  "" //escape(JSON.stringify(response.emotion))
        data['sentiment'] = results

        // read entitis extraction
        //console.log("TRANS: " + transcript)
        var entityType = ['people_eng','places_eng','companies_eng','professions_eng','profanities','professions','number_phone_us', 'pii', 'pii_ext', 'address_us', 'address_ca', 'date_eng']
        var request = {'text' : transcript,
                        'entity_type' : entityType,
                        'show_alternatives': false
                      }
        hodClient.get('extractentities', request, false, function(err, resp, body) {
        //console.log(JSON.stringify(resp.body))
        if (!err) {
            var profanity = []
            var hasBadWord = false
            var actions = []
            var phoneNumbers = []
            var actionTranscript = transcript
            for (var term of callActionDictionary){
              var regExp = new RegExp("\\b" + term + "\\b", "ig");
              if (actionTranscript.match(regExp) != null){
                var item = {}
                //item['action'] = "callback"
                //break
                actionTranscript = actionTranscript.replace(regExp, '<span style="font-size: 1.4em; color:#fff624">' + term + "</span>")
              }
            }
            for (var entity of resp.body.entities){
              //console.log(JSON.stringify(entity))
              if (entity.type == "profanities" && entity.score > 0.6){
                hasBadWord = true
                var prof = {}
                prof['text'] = []
                for (var mat of entity.matches){
                  prof['text'].push(mat.original_text)
                }
                prof['score'] = entity.score
                profanity.push(prof)
              }

              if (entity.type == "number_phone_us"){
                  //console.log("phone num: " + entity.normalized_text)
                  var newNumber = true
                  for (var number of phoneNumbers){
                    if (number == entity.normalized_text){
                      newNumber = false
                      break
                    }
                  }
                  if (newNumber)
                    phoneNumbers.push(entity.normalized_text)
              }
            }
            for (var number of phoneNumbers){
              var regExp = new RegExp("\\b" + number + "\\b", "ig")
              if (actionTranscript.match(regExp) != null){
                actionTranscript = actionTranscript.replace(regExp, '<a href="rcmobile://call?number=' + number + '">' + number + '</a>')
                //console.log(actionTranscript)
              }
            }
            actions.push(actionTranscript)
            //console.log("action: " + transcript)
            var query = "UPDATE " + table + " SET processed=1"
            query += ", sentiments='" + escape(JSON.stringify(results)) + "'"
            query += ", sentiment_label='" + data.sentiment_label + "'"
            query += ", sentiment_score=" + data.sentiment_score
            query += ", sentiment_score_hi=" + data.sentiment_score_hi
            query += ", sentiment_score_low=" + data.sentiment_score_low
            query += ", has_profanity=" + hasBadWord
            query += ", profanities='" + escape(JSON.stringify(profanity)) + "'"
            query += ", keywords='" + data.keywords + "'"
            query += ", actions='" + escape(JSON.stringify(actions)) + "'"
            query += ", entities='" + escape(JSON.stringify(resp.body.entities)) + "'"
            query += ", concepts='" + data.concepts + "'"
            query += ", categories='" + data.categories + "'"
            query += ", subject='" + data.subject + "'"
            query += " WHERE uid=" + thisId;
            //console.log(query)
            var ret = {}
            ret['sentiment'] = data.sentiment_label
            ret['keywords'] = unescape(data.keywords)
            ret['subject'] = data.subject
            console.log("KEYWORDS: " + unescape(data.keywords))
            //thisCallback(null, ret)
            pgdb.update(query, (err, result) => {
              if (err){
                var ret = {}
                ret['sentiment'] = ""
                ret['keywords'] = ""
                ret['subject'] = ""
                thisCallback(err, JSON.stringify(ret))
                console.error(err.message);
              }else{
                console.log("MUST CALLBACK to exit: " + result);
                var ret = {}
                ret['sentiment'] = data.sentiment_label
                ret['keywords'] = unescape(data.keywords)
                ret['subject'] = data.subject
                console.log("KEYWORDS: " + unescape(data.keywords))
                thisCallback(null, ret)
              }
            });
          }
        })
        //
    }else{
      console.log("ERROR: " + JSON.stringify(err))
      var ret = {}
      ret['sentiment'] = ""
      ret['keywords'] = ""
      thisCallback("ERROR", JSON.stringify(ret))
    }
  })
}
