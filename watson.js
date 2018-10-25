var watson = require('watson-developer-cloud');
var fs = require('fs');
const pgdb = require('./db')
//var google = require('./google');
var haven = require('./hpe');


var speechToText = new watson.SpeechToTextV1({
  username: process.env.WATSON_USERNAME,
  password: process.env.WATSON_PWD,
  url: 'https://stream.watsonplatform.net/speech-to-text/api/'
});

var transcribe = function(table, res, body, bufferStream){
  var thisRes = res
  console.log("transcribing...")
  var thisId = body.audioSrc
  var speakerLabel = true
  var  params = {
      model: 'en-US_NarrowbandModel',
      audio: bufferStream,
      content_type: 'audio/mp3',
      timestamps: true,
      interim_results: false,
      max_alternatives:1,
      profanity_filter: false,
      smart_formatting: true,
      speaker_labels: speakerLabel
    };

  speechToText.recognize(params, function(err, res) {
    if (err)
      console.log(err);
    else{
      var transcript = ""
      if (res.results.length > 0){
        var count = 0
        var speakers = []
        if (speakerLabel){
          count = res.speaker_labels.length
          speakers = res.speaker_labels
        }
        var conversations = []
        var sentence = []
        var index = 0
        var wordArr = []
        var offsetArr = []
        var wordswithoffsets = []
        var addLastSentence = true
        var speakerSentence = {}
        speakerSentence['sentence'] = []
        speakerSentence['timestamp'] = []

        for (var result of res.results){
          var cleanText = result.alternatives[0].transcript.trim()
          if (result.alternatives[0].transcript != " "){
            cleanText = cleanText.charAt(0).toUpperCase() + cleanText.substr(1);
            transcript += cleanText + ". ";
          }
          if (speakerLabel){
            var previousSpeaker = speakers[index].speaker
            addLastSentence = true
            for (var word of result.alternatives[0].timestamps){
              if (word[0] != "%HESITATION"){
                var wordoffset = {}
                wordoffset['word'] = word[0]
                wordoffset['offset'] = word[1]
                wordswithoffsets.push(wordoffset)
                if (index < count){
                  var speakerId = speakers[index].speaker
                  var timeStamp = speakers[index].from
                  var newWord = word[0]
                  index++
                  if (index < count){
                    if (previousSpeaker != speakers[index].speaker){
                      speakerSentence['speakerId'] = speakerId
                      speakerSentence['timestamp'].push(timeStamp)
                      speakerSentence['sentence'].push(newWord)
                      conversations.push(speakerSentence)
                      speakerSentence = {}
                      speakerSentence['sentence'] = []
                      speakerSentence['timestamp'] = []
                      addLastSentence = false
                    }else{
                      addLastSentence = true
                      speakerSentence['speakerId'] = speakerId
                      speakerSentence['timestamp'].push(timeStamp)
                      speakerSentence['sentence'].push(newWord)
                    }
                    previousSpeaker = speakers[index].speaker
                  }else{
                    addLastSentence = true
                    speakerSentence['speakerId'] = speakerId
                    speakerSentence['timestamp'].push(timeStamp)
                    speakerSentence['sentence'].push(newWord)
                  }
                }
              }else{
                index++
              }
            }
          }else{ // just for in case we don't need the speaker label!
            for (var word of result.alternatives[0].timestamps){
              var oriword = word[0]
              if (oriword !=  '%HESITATION'){
                var wordoffset = {}
                wordoffset['word'] = word[0]
                wordoffset['offset'] = word[1]
                wordswithoffsets.push(wordoffset)
                speakerSentence['timestamp'].push(word[1])
                speakerSentence['sentence'].push(oriword)
              }
            }
            conversations.push(speakerSentence)
            speakerSentence = {}
            speakerSentence['sentence'] = []
            speakerSentence['timestamp'] = []
          }
        }
        if (speakerSentence.sentence.length > 0){
          conversations.push(speakerSentence)
        }
        transcript = transcript.replace(/"/, "'")
        transcript = transcript.trim()
        var textWithPunctuation = ""
        var blockTimeStamp = []
        // guess and make artificial puncuation (full stop) base on result sentence
        for (var i=0; i<conversations.length; i++){
          var dialogue = conversations[i]
          var temp = dialogue.sentence.join(" ")
          temp = temp.replace(/\./g, "")
          temp = temp.charAt(0).toUpperCase() + temp.substr(1);
          textWithPunctuation += temp + ". "
          var wArr = temp.split(" ")
          conversations[i].sentence = wArr
          var speaker_timestamp = {}
          speaker_timestamp['speakerId'] = dialogue.speakerId
          speaker_timestamp['timeStamp'] = dialogue.timestamp[0]
          blockTimeStamp.push(speaker_timestamp)
        }
        textWithPunctuation = textWithPunctuation.trim()
        var query = ''
        if (body.type == 'VM')
          query = "UPDATE " + table + " SET wordsandoffsets='" + escape(JSON.stringify(wordswithoffsets)) + "', transcript='" + escape(transcript) + "', conversations='" + escape(JSON.stringify(conversations))  + "' WHERE uid=" + thisId;
        else
          query = "UPDATE " + table + " SET wordsandoffsets='" + escape(JSON.stringify(wordswithoffsets)) + "', transcript='" + escape(textWithPunctuation) + "', conversations='" + escape(JSON.stringify(conversations))  + "' WHERE uid=" + thisId;
        pgdb.update(query, function(err, result) {
          if (err){
            console.error(err.message);
          }else{
            console.error(result);
          }
        });

        preAnalyzing(table, blockTimeStamp, textWithPunctuation, transcript, thisId)
        var response = {}
        response['status'] = "ok"
        response['result'] = textWithPunctuation
      }else{
        var response = {}
        response['status'] = "ok"
        response['result'] = "This audio has no voice content!"
      }
      if (thisRes != null)
        thisRes.send(JSON.stringify(response))
    }
  });
}

module.exports.transcribe = transcribe

var nlu = new watson.NaturalLanguageUnderstandingV1({
  "url": "https://gateway.watsonplatform.net/natural-language-understanding/api",
  "username": process.env.WATSON_ANALYTIC_USERNAME,
  "password": process.env.WATSON_ANALYTIC_PWD,
  'version': '2018-03-16'
});


function preAnalyzing(table, blockTimeStamp, text, transcript, thisId){
  var parameters = {
    'text': text,
    'features': {
      'concepts': {},
      'categories': {},
      'entities': {
        'emotion': true,
        'sentiment': true
      },
      'keywords': {
        'limit': 100
      }
    }
  }
  nlu.analyze(parameters, function(err, response) {
    if (err)
      console.log('error:', err);
    else{
      console.log(JSON.stringify(response))
      haven.hod_sentiment(table, blockTimeStamp, text, response, transcript, thisId)
    }
  });
}

const { wordsToNumbers } = require('words-to-numbers');

function detectPhoneNumber(text){
  //var textNum = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
  var phrases = ['call me back at','call me back', 'call me', 'give me a call', 'reach me at']
/*
  var regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
  var phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  var newString = text.search(phoneno, "phone number")
  console.log("What " + newString)
*/
  //var phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  //var phoneno = /^((\+\d{1,3}(-| )?\(?\d\)?(-| )?\d{1,3})|(\(?\d{2,3}\)?))(-| )?(\d{3,4})(-| )?(\d{4})(( x| ext)\d{1,5}){0,1}$/
  var phoneno = /[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
  var actionableArr = []
  for (var phrase of phrases){
    var startPos = text.indexOf(phrase)
    if (startPos >= 0){
      startPos += phrase.length
      var subStr = text.substring(startPos, text.length-1)
      console.log("subStr: " + subStr)
      var newString = subStr.match(phoneno)
      console.log("RESULT: " + newString)
      break
    }
  }
  /*
  console.log("ORI TEXT: " + text)
  var newText = wordsToNumbers(text);
  console.log("NEW TEXT: " + newText)
  */
}

function gl_analyzing(transcript, thisId){
  google.gcp_sentiment(thisId, transcript)
}

function analyzing(transcript, input, thisId) {
  var targets = []
  for (var i=0; i<input.keywords.length; i++){
    if (i == 20)
      break
    var item = input.keywords[i]
    targets.push(item.text)
  }
  console.log(JSON.stringify(targets))
  var parameters = {
    'text': transcript,
    'features': {
      'emotion': {'targets': targets},
      'sentiment': {'target': targets} // ['product','service','employee','quality','performance','API']
    }
  }
  var id = thisId
  var data = {}
  data['semantic_roles'] = escape(JSON.stringify(input.semantic_roles))
  data['keywords'] = escape(JSON.stringify(input.keywords))
  data['relations'] = escape(JSON.stringify(input.relations))
  data['entities'] = escape(JSON.stringify(input.entities))
  data['concepts'] = escape(JSON.stringify(input.concepts))

  nlu.analyze(parameters, function(err, response) {
    if (err)
      console.log('error:', err);
    else
      //parseResponse(response)
      data['sentiment'] = escape(JSON.stringify(response.sentiment))
      data['sentiment_label'] = response.sentiment.document.label
      data['sentiment_score'] = response.sentiment.document.score
      data['emotion'] = escape(JSON.stringify(response.emotion))
      var query = "UPDATE calls SET processed=1" // entities=\"" + escape(JSON.stringify(response, null, 2)) + "\" WHERE id=" + thisId;
      query += ', sentiment="' + data.sentiment + '"'
      query += ', sentiment_label="' + data.sentiment_label + '"'
      query += ', sentiment_score=' + data.sentiment_score
      query += ', emotion="' + data.emotion + '"'
      query += ', semantic_roles="' + data.semantic_roles + '"'
      query += ', keywords="' + data.keywords + '"'
      query += ', relations="' + data.relations + '"'
      query += ', entities="' + data.entities + '"'
      query += ', concepts="' + data.concepts + '"'
      query += ' WHERE id=' + id;
      //console.log(query)
      let db = new sqlite3.Database(CALLS_DATABASE);
      db.run(query, function(err, result) {
        if (err){
          console.error(err.message);
        }
      });
  });
}

var assistant = new watson.AssistantV1({
  username: process.env.WATSON_USERNAME,
  password: process.env.WATSON_PWD,
  version: '2018-02-16'
});

function parseResponse(response){
  console.log(JSON.stringify(response));
  console.log(response.sentiment.document.label + "/" + response.sentiment.document.score)
  console.log(response.emotion.document.emotion.sadness)
  console.log("Detect emotion")
  for (var entity of response.emotion.targets){
    console.log(entity.text + "/" + entity.emotion.sadness)
  }
  console.log("Detect sentiments")
  if (response.sentiment.hasOwnProperty('targets')){
    for (var sentiment of response.sentiment.targets){
      console.log(sentiment.text + "/" + sentiment.score + "/" + sentiment.label)
    }
  }
}

var async = require("async");
function detectEmotion(conversations){

  async.each(conversations,
    function(item, callback){
      var text = item.sentence.join(" ")

      if (item.sentence.length > 2){
        var parameters = {
          'text': text,
          'features': {
            'emotion': {'targets': item.sentence},
            'sentiment': {'target': item.sentence} // ['product','service','employee','quality','performance','API']
          }
        }
        nlu.analyze(parameters, function(err, response) {
          if (err)
            console.log('error:', err);
          else{
            console.log("INPUT: " + text)
            console.log("SENTENCE ENT.: " + JSON.stringify(response))
            setTimeout(function() {
              callback()
            }, 3000);
          }
        });
      }
    });
}

function getEntities(){
  var params = {
    workspace_id: '9978a49e-ea89-4493-b33d-82298d3db20d',
    entity: 'beverage'
  };

  assistant.listWorkspaces(function(err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  });
  /*
  assistant.listValues(params, function(err, response) {
    if (err) {
      console.error(err);
    } else {
      console.log(JSON.stringify(response, null, 2));
    }
  });
  */
}
// or streaming
/*
fs.createReadStream('./resources/speech.wav')
  .pipe(speechToText.createRecognizeStream({ content_type: 'audio/l16; rate=44100' }))
  .pipe(fs.createWriteStream('./transcription.txt'));var watson = require('watson-developer-cloud');

*/
