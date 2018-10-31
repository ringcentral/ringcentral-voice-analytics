window.onload = init;
// var aPlayer = null;
var index = 0;
var mIndex = 1;
var wwoArr = []

var wordElm = null;
var mContent = "";

var speakerSentiment = -1
var foundIndex = 0;
var positiveThreshold = 0.5;
var negativeThreshold = -0.5;
var fixedSubstractedHeight = 0;

var wavesurfer;
var audioPlayLine;

function init() {
  initializeAudioPlayer()
  fixedSubstractedHeight = $("#menu_header").height()
  fixedSubstractedHeight += $("#search_bar").height()
  fixedSubstractedHeight += $("#subject_header").height()
  fixedSubstractedHeight += $("#footer").height()
  //alert($("#footer").height())
  //upperBlockHeight = $("#upper_block").height()
  var h = $(window).height() - (fixedSubstractedHeight);

//  var h = $(window).height() - (height + 190);

  $("#conversations_block").height(h-210)
  //$("#analyzed_content").height(h-125)

  var sliderPos = document.getElementById("positiveSentimentRange");
  sliderPos.oninput = function() {
    positiveThreshold = this.value/1000;
    $("#posval").html(positiveThreshold.toFixed(2))
    var percent = (positiveThreshold * 100).toFixed(2);
    var style = 'linear-gradient(to right, #b8e986 0%, #b8e986 ' + percent + '%, #c8ccd1 ' + percent + '%, #c8ccd1)';
    sliderPos.style.background = style;
    displayAnalytics('sentiment')
  }

  var sliderNeg = document.getElementById("negativeSentimentRange");
  sliderNeg.oninput = function() {
      negativeThreshold = (this.value/1000) * -1;
      $("#negval").html(negativeThreshold.toFixed(2))
      var percent = (positiveThreshold * 100).toFixed(2);
      var style = 'linear-gradient(to right, #e98f86 0%, #e98f86 ' + percent + '%, #c8ccd1 ' + percent + '%, #c8ccd1)';
      sliderNeg.style.background = style;
      displayAnalytics('sentiment')
  }
  displayAnalytics('keywords')
  $("#search").focus()
}

function setSpeakersWithSentiment(){
  speakerSentiment = $("#speakers").val()
  displayAnalytics('sentiment')
}
function displayConversations() {
  $("#text_block").hide()
  $("#conversations_block").show()
}
function displayAnalytics(option){
  if (option == 'sentiment'){
    $("#sentiment_adjust").show()
    $("#sentiment-tab").addClass("tab-selected");
    $("#keyword-tab").removeClass("tab-selected");
    var upperBlockHeight = $("#upper_block").height() + 130
    var h = $(window).height() - (fixedSubstractedHeight);
    $("#analyzed_content").height(h-upperBlockHeight)
    $("#analyzed_content").show();
    var itemArr = JSON.parse(window.results.sentiments)
    var text = "<div>"
/*
      // HPE sentiment analysis
      if (window.results.type == "VM"){
        var sentence = "<span class='sentiment_line'>" + window.results.transcript + "</span>"
        for (var item of itemArr){
          if (item.hasOwnProperty('positive')){
            for (var pos of item.positive){
              if (pos.score > positiveThreshold){
                var fullStop = window.results.transcript + "."
                if (pos.sentiment == null && pos.topic == null && fullStop == pos.text){
                  sentence = "<span class='sentiment_line positive_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = pos.text.toLowerCase()
                  sentence = sentence.replace(lowerCaseText, "<span class='positive_block'>" + lowerCaseText + "</span>")
                }
                if (pos.topic != null){
                  sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                }
                if (pos.sentiment != null){
                  sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                }
              }
            }
          }
          if (item.hasOwnProperty('negative')){
            for (var neg of item.negative){
              if (neg.score < negativeThreshold){
                var fullStop = window.results.transcript + "."
                if (neg.sentiment == null && neg.topic == null && fullStop == neg.text){
                  sentence = "<span class='sentiment_line negative_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = neg.text.toLowerCase()
                  sentence = sentence.replace(neg.text, "<span class='negative_block'>" + neg.text + "</span>")
                }
                if (neg.topic != null)
                  sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                if (neg.sentiment != null)
                  sentence = sentence.replace(neg.sentiment, "<span class='sentiment'>" + neg.sentiment + "</span>")
              }
            }
          }
        }
        text += sentence
      }else{ // call recording dialogue
        for (var item of itemArr){
            if (speakerSentiment == -1){
              sentence = '' //item.sentence
              if (item.hasOwnProperty('positive')){
                for (var pos of item.positive){
                  if (pos.score > positiveThreshold){
                    if (sentence == ''){
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": Goto => </span>"
                      sentence = item.sentence
                    }
                    var fullStop = item.sentence + "."
                    if (pos.sentiment == null && pos.topic == null && fullStop == pos.text){
                      sentence = "<span class='positive_block'>" + sentence + "</span>"
                    }else
                      sentence = sentence.replace(pos.text, "<span class='positive_block'>" + pos.text + "</span>")
                    if (pos.topic != null)
                      sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                    if (pos.sentiment != null)
                      sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                  }
                }
              }
              if (item.hasOwnProperty('negative')){
                for (var neg of item.negative){
                  if (neg.score < negativeThreshold){
                    if (sentence == ''){
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": Goto => </span>"
                      sentence = item.sentence
                    }
                    var fullStop = item.sentence + "."
                    if (neg.sentiment == null && neg.topic == null && fullStop == neg.text){
                      sentence = "<span class='negative_block'>" + sentence + "</span>"
                    }else
                      sentence = sentence.replace(neg.text, "<span class='negative_block'>" + neg.text + "</span>")
                    if (neg.topic != null)
                      sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                    if (neg.sentiment != null)
                      sentence = sentence.replace(neg.sentiment, "<span class='sentiment''>" + neg.sentiment + "</span>")
                  }
                }
              }
              if (sentence != '')
                text += sentence + "</div>"
            }else{ //if (speakerSentiment == 0){
              if (item.speakerId == speakerSentiment){
                sentence = '' //item.sentence
                if (item.hasOwnProperty('positive')){
                  for (var pos of item.positive){
                    if (pos.score > positiveThreshold){
                      if (sentence == ''){
                        text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": Goto => </span>"
                        sentence = item.sentence
                      }
                      var fullStop = item.sentence + "."
                      if (pos.sentiment == null && pos.topic == null && fullStop == pos.text){
                        sentence = "<span class='positive_block'>" + sentence + "</span>"
                      }else
                        sentence = sentence.replace(pos.text, "<span class='positive_block'>" + pos.text + "</span>")
                      if (pos.topic != null)
                        sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                      if (pos.sentiment != null)
                        sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                    }
                  }
                }
                if (item.hasOwnProperty('negative')){
                  for (var neg of item.negative){
                    if (neg.score < negativeThreshold){
                      if (sentence == ''){
                        text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": Goto => </span>"
                        sentence = item.sentence
                      }
                      var fullStop = item.sentence + "."
                      if (neg.sentiment == null && neg.topic == null && fullStop == neg.text){
                        sentence = "<span class='negative_block'>" + sentence + "</span>"
                      }else
                        sentence = sentence.replace(neg.text, "<span class='negative_block'>" + neg.text + "</span>")
                      if (neg.topic != null)
                        sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                      if (neg.sentiment != null)
                        sentence = sentence.replace(neg.sentiment, "<span class='sentiment'>" + neg.sentiment + "</span>")
                    }
                  }
                }
                if (sentence != '')
                  text += sentence + "</div>"
              }
            }
        }
      }
*/
/*
      if (window.results.type == "VM"){
        var sentence = "<span class='sentiment_line'>" + window.results.transcript + "</span>"
        for (var item of itemArr){
          if (item.hasOwnProperty('positive')){
            for (var pos of item.positive){
              if (pos.score > positiveThreshold){
                var fullStop = window.results.transcript + "."
                if (pos.sentiment == null && pos.topic == null && fullStop == pos.text){
                  sentence = "<span class='sentiment_line positive_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = pos.text.toLowerCase()
                  sentence = sentence.replace(lowerCaseText, "<span class='positive_block'>" + lowerCaseText + "</span>")
                }
                if (pos.topic != null){
                  sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                }
                if (pos.sentiment != null){
                  sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                }
              }
            }
          }
          if (item.hasOwnProperty('negative')){
            for (var neg of item.negative){
              if (neg.score < negativeThreshold){
                var fullStop = window.results.transcript + "."
                if (neg.sentiment == null && neg.topic == null && fullStop == neg.text){
                  sentence = "<span class='sentiment_line negative_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = neg.text.toLowerCase()
                  sentence = sentence.replace(neg.text, "<span class='negative_block'>" + neg.text + "</span>")
                }
                if (neg.topic != null)
                  sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                if (neg.sentiment != null)
                  sentence = sentence.replace(neg.sentiment, "<span class='sentiment'>" + neg.sentiment + "</span>")
              }
            }
          }
        }
        text += sentence
      }else{ // call recording dialogue
        for (var item of itemArr){
            if (speakerSentiment == -1){
              sentence = '' //item.sentence
              if (item.hasOwnProperty('positive')){
                for (var pos of item.positive){
                  if (pos.score > positiveThreshold){
                    //if (sentence == ''){
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ", true)'>Speaker "+ item.speakerId + ": </span>"
                      //sentence = item.sentence
                    //}
                    sentence = "<span class='positive_block'>" + pos.text + "</span>"
                    if (pos.topic != null)
                      sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                    if (pos.sentiment != null)
                      sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                    text += sentence + "</div>"
                  }
                }
              }
              if (item.hasOwnProperty('negative')){
                for (var neg of item.negative){
                  if (neg.score < negativeThreshold){
                    text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ", true)'>Speaker "+ item.speakerId + ": </span>"
                    sentence = "<span class='negative_block'>" + neg.text + "</span>"
                    if (neg.topic != null)
                      sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                    if (neg.sentiment != null)
                      sentence = sentence.replace(neg.sentiment, "<span class='sentiment''>" + neg.sentiment + "</span>")
                    text += sentence + "</div>"
                  }
                }
              }
              //if (sentence != '')
              //  text += sentence + "</div>"
            }else{ //if (speakerSentiment == 0){
              if (item.speakerId == speakerSentiment){
                sentence = '' //item.sentence
                if (item.hasOwnProperty('positive')){
                  for (var pos of item.positive){
                    if (pos.score > positiveThreshold){
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ", true)'>Speaker "+ item.speakerId + ": </span>"
                      sentence = "<span class='positive_block'>" + pos.text + "</span>"
                      if (pos.topic != null)
                        sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                      if (pos.sentiment != null)
                        sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                      text += sentence + "</div>"
                    }
                  }
                }
                if (item.hasOwnProperty('negative')){
                  for (var neg of item.negative){
                    if (neg.score < negativeThreshold){
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ", true)'>Speaker "+ item.speakerId + ": </span>"
                      sentence = "<span class='negative_block'>" + neg.text + "</span>"
                      if (neg.topic != null)
                        sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                      if (neg.sentiment != null)
                        sentence = sentence.replace(neg.sentiment, "<span class='sentiment'>" + neg.sentiment + "</span>")
                      text += sentence + "</div>"
                    }
                  }
                }
              }
            }
        }
      }
*/
      if (window.results.type == "VM"){
        var sentence = "<span class='sentiment_line'>" + window.results.transcript + "</span>"
        for (var item of itemArr){
          if (item.hasOwnProperty('positive')){
            for (var pos of item.positive){
              if (pos.score > positiveThreshold){
                var fullStop = window.results.transcript + "."
                if (pos.sentiment == null && pos.topic == null && fullStop == pos.text){
                  sentence = "<span class='sentiment_line positive_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = pos.text.toLowerCase()
                  sentence = sentence.replace(lowerCaseText, "<span class='positive_block'>" + lowerCaseText + "</span>")
                }
                if (pos.topic != null){
                  sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                }
                if (pos.sentiment != null){
                  sentence = sentence.replace(pos.sentiment, "<span class='sentiment'>" + pos.sentiment + "</span>")
                }
              }
            }
          }
          if (item.hasOwnProperty('negative')){
            for (var neg of item.negative){
              if (neg.score < negativeThreshold){
                var fullStop = window.results.transcript + "."
                if (neg.sentiment == null && neg.topic == null && fullStop == neg.text){
                  sentence = "<span class='sentiment_line negative_block'>" + sentence + "</span>"
                }else{
                  var lowerCaseText = neg.text.toLowerCase()
                  sentence = sentence.replace(neg.text, "<span class='negative_block'>" + neg.text + "</span>")
                }
                if (neg.topic != null)
                  sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                if (neg.sentiment != null)
                  sentence = sentence.replace(neg.sentiment, "<span class='sentiment'>" + neg.sentiment + "</span>")
              }
            }
          }
        }
        text += sentence
      }else{ // call recording dialogue
        if (speakerSentiment == -1){
          var speakerCount = itemArr.length
          var speakersArr = []
          for (var item of itemArr) {
            var newSpeaker = true
            for (var i=0; i<speakersArr.length; i++) {
              var sp = speakersArr[i]
              if (sp.name == item.speakerId.toString()){
                newSpeaker = false
                break
              }
            }
            if (newSpeaker){
              var speaker = {}
              speaker['name'] = item.speakerId.toString()
              //alert(speaker.name)
              speaker['sentences'] = []
              speakersArr.push(speaker)
            }
          }
          for (var item of itemArr){
            sentence = '' //item.sentence
            if (item.hasOwnProperty('positive')){
              for (var pos of item.positive){
                if (pos.score > positiveThreshold){
                  var tText = truncateText(pos.text)
                  sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                  sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
                  sentence += "<span class=\"positive_block\">.." + tText + "..</span>"
                  /*
                  if (pos.topic != null)
                    sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                  if (pos.sentiment != null)
                    sentence = sentence.replace(pos.sentiment, "<span class=\"sentiment\">" + pos.sentiment + "</span>")
                  //text += sentence + "</div>"
                  */
                  sentence += "</div>"
                  for (var i=0; i<speakersArr.length; i++) {
                    var sp = speakersArr[i]
                    if (sp.name == item.speakerId){
                      sp.sentences.push(sentence)
                      break
                    }
                  }
                }
              }
            }
            if (item.hasOwnProperty('negative')){
              for (var neg of item.negative){
                if (neg.score < negativeThreshold){
                  var tText = truncateText(neg.text)
                  sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                  sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
                  sentence += "<span class=\"negative_block\">.. " + tText + " ..</span>"
                  /*
                  if (neg.topic != null)
                    sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                  if (neg.sentiment != null)
                    sentence = sentence.replace(neg.sentiment, "<span class=\"sentiment\">" + neg.sentiment + "</span>")
                  */
                  sentence += "</div>"
                  for (var i=0; i<speakersArr.length; i++) {
                    var sp = speakersArr[i]
                    if (sp.name == item.speakerId){
                      sp.sentences.push(sentence)
                      break
                    }
                  }
                }
              }
            }
          }
          for (var i=0; i<speakersArr.length; i++) {
            var sp = speakersArr[i]
            text += "<div class=\"sentiment_line speaker_name\">Speaker "+ sp.name + ": </div>"
            for (var sent of sp.sentences){
              text += sent
            }
            text += "</div>"
          }
        }else{ //if (speakerSentiment == 0){
          var speaker = {}
          for (var item of itemArr) {
            if (item.speakerId == speakerSentiment){
              speaker['name'] = item.speakerId.toString()
              speaker['sentences'] = []
              break
            }
          }
          for (var item of itemArr){
            if (item.speakerId == speakerSentiment){
              sentence = '' //item.sentence
              if (item.hasOwnProperty('positive')){
                for (var pos of item.positive){
                  if (pos.score > positiveThreshold){
                    var tText = truncateText(pos.text)
                    sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                    sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
                    sentence += "<span class=\"positive_block\">.. " + tText + " ..</span>"
                    /*
                    if (pos.topic != null)
                      sentence = sentence.replace(pos.topic, "<b>" + pos.topic + "</b>")
                    if (pos.sentiment != null)
                      sentence = sentence.replace(pos.sentiment, "<span class=\"sentiment\">" + pos.sentiment + "</span>")
                    */
                    sentence += "</div>"
                    speaker.sentences.push(sentence)
                  }
                }
              }
              if (item.hasOwnProperty('negative')){
                for (var neg of item.negative){
                  if (neg.score < negativeThreshold){
                    var tText = truncateText(neg.text)
                    sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                    sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
                    sentence += "<span class=\"negative_block\">.. " + tText + " ..</span>"
                    /*
                    if (neg.topic != null)
                      sentence = sentence.replace(neg.topic, "<b>" + neg.topic + "</b>")
                    if (neg.sentiment != null)
                      sentence = sentence.replace(neg.sentiment, "<span class=\"sentiment\">" + neg.sentiment + "</span>")
                    */
                    sentence += "</div>"
                    speaker.sentences.push(sentence)
                  }
                }
              }
            }
          }
          text += "<div class=\"sentiment_line speaker_name\">Speaker "+ speaker.name + ": </div>"
          for (var sent of speaker.sentences){
            text += sent
          }
          text += "</div>"
        }
      }
      text += "</div>"
      //alert(text)
      $("#analyzed_content").html(text)
    }else if (option == 'keywords'){
      $("#sentiment-tab").removeClass("tab-selected");
      $("#keyword-tab").addClass("tab-selected");
      $("#sentiment_adjust").hide()
      var upperBlockHeight = $("#upper_block").height() + 130
      var h = $(window).height() - (fixedSubstractedHeight);
      $("#analyzed_content").height(h-upperBlockHeight)
      var text = "" // 942249526628
      var itemArr = JSON.parse(window.results.keywords)
      for (var item of itemArr){
        if (item.text != "class" && item.text != 'keywords'){
        text += "<span class='keyword' onclick='jumptToKeyword(\"" + item.text + "\")'>" + item.text + "</span>"
        }
      }
      $("#analyzed_content").html(text)

    }else if (option == 'actions'){
      $("#sentiment_adjust").hide()

      var itemArr = JSON.parse(window.results.actions)
      var text = ""
      for (var item of itemArr){
        var upper = item.charAt(0).toUpperCase() + item.substr(1);
        text += "<div>" + upper + "</div>"
      }
      $("#analyzed_content").html(text)
    }
}
function truncateText(text){
  var wordsArr = text.split(" ")
  var ret = ""
  if (wordsArr.length > 15){
    for (var i=0; i<wordsArr.length; i++){
      if (i == 15){
        ret += wordsArr[i]
        break
      }
      ret += wordsArr[i] + " "
    }
  }else {
    ret = text
  }
  return ret
}

function initializeAudioPlayer(){
  wwoArr = JSON.parse(window.results.wordsandoffsets)
  wordElm = document.getElementById("word0");
  // aPlayer = document.getElementById("audio_player");
  // aPlayer.addEventListener("timeupdate",seektimeupdate,false);
  // aPlayer.addEventListener('loadeddata', audioLoaded, false);
  // aPlayer.addEventListener('seeked', seekEnded, false);

  wavesurfer = WaveSurfer.create({
    // Use the id or class-name of the element you created, as a selector
    container: '#waveform',
    // The color can be either a simple CSS color or a Canvas gradient
    // waveColor: linGrad,
    // progressColor: 'hsla(200, 100%, 30%, 0.5)',
    cursorColor: '#fff',
    backend: 'MediaElement', // This parameter makes the waveform look like SoundCloud's player
    barWidth: 2,
    barHeight: 5,
    barGap: 1,
    height: 30,
    fillParent: true,
    // maxCanvasWidth: 600,
    progressColor: '#0684bd',
    waveColor: '#ffffff',
    cursorWidth: 0,
    // normalize: true,
  });

  wavesurfer.load('/proxyaudio?url=' + encodeURIComponent(window.results.recording_url));
  audioPlayLine = document.getElementById("audio_play_line");
  wavesurfer.on('audioprocess', function () {
    var currentTime = wavesurfer.getCurrentTime();
    var duration = wavesurfer.getDuration();
    var percent = (currentTime * 100.0 /duration).toFixed(2);
    var style = 'linear-gradient(to right, transparent 0%, transparent ' + percent + '%, #c8ccd1 ' + percent + '%, #c8ccd1)';
    audioPlayLine.style.background = style;
    $('#audio-play-time').html(formatDuration(currentTime));
    seektimeupdate();
  });
  wavesurfer.on('play', function () {
    $('#audio-play').hide();
    $('#audio-pause').show();
    seekEnded() // think better to be here
  });
  wavesurfer.on('ready', function () {
    $('#audio-play').show();
    $('#audio-pause').hide();
    var duration = wavesurfer.getDuration();
    $('#audio-duration').html(formatDuration(duration));
    $('#audio-play-time').html(formatDuration(0));
    audioLoaded();
  });
  wavesurfer.on('finish', function(seeking) {
    $('#audio-play').show();
    $('#audio-pause').hide();
    //seekEnded();
  });
  $('#audio-button').click(function() {
    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
      $('#audio-play').show();
      $('#audio-pause').hide();
    } else {
      wavesurfer.play();
      $('#audio-play').hide();
      $('#audio-pause').show();
    }
  });
}

function audioLoaded() {
    mIndex = 0;
}
function seekEnded() {
    var pos = wavesurfer.getCurrentTime();
    resetReadWords(pos);
    var id = "word" + mIndex;
    wordElm = document.getElementById(id);
}
function seektimeupdate() {
    var pos = wavesurfer.getCurrentTime();
    if (mIndex < wwoArr.length)
    {
        var check = wwoArr[mIndex].offset;
        while (check && pos >= check)
        {
            wordElm.setAttribute("class", "readtext");
            wordElm = document.getElementById("word"+mIndex);
            wordElm.setAttribute("class", "word");
            mIndex++;
            check = wwoArr[mIndex] && wwoArr[mIndex].offset;
        }
    }
}

function resetReadWords(value) {
    var elm;
    for (var i=0; i<mIndex; i++) {
        var idee = "word" + i;
        elm = document.getElementById(idee);
        elm.setAttribute("class", "unreadtext");
    }
    mIndex = 0;
    var pos =  wwoArr[mIndex].offset;
    while (pos && pos < value) {
        var idee = "word" + mIndex;
        elm = document.getElementById(idee);
        elm.setAttribute("class", "readtext");
        mIndex++;
        pos =  wwoArr[mIndex] && wwoArr[mIndex].offset;
    }
}

function jumpToSentiment(timeStamp, sentence, words){
  sentence = unescape(sentence)
  words = unescape(words)
  //alert(sentence)
  var wordArr = words.split(" ")
  var sentenceArr = sentence.split(" ")
  //alert(sentenceArr)
  for (var i=0; i<wwoArr.length; i++){
    var item = wwoArr[i]
    if (item.offset == timeStamp){
      var n = 0
      for (n=0; n<sentenceArr.length; n++){
        var matchArr = []
        for (var m=0; m<wordArr.length; m++){
          matchArr.push(sentenceArr[n+m])
        }
        var match = matchArr.join(" ")
        //alert(match)
        if (match.indexOf(words) >= 0){
          timeStamp = wwoArr[n+i].offset
          //alert(wwoArr[startPos].word)
          jumpTo(timeStamp, true)
          return
        }
      }
    }
  }
}
function jumptToKeyword(keyword){
  var wordArr = keyword.split(" ")
  var searchWord = $("#search").val(keyword)
  $("#search").focus()
  let regEx = new RegExp(`\\b${keyword}\\b`, 'i');
  for (var i=mIndex; i<wwoArr.length; i++){
    var matchArr = []
    for (n=0; n<wordArr.length; n++){
      var m = i+n
      if (m < wwoArr.length - wordArr.length)
        matchArr.push(wwoArr[m].word)
      else
        break
    }
    var match = matchArr.join(" ")
    if (regEx.test(match)){
      var timeStamp = wwoArr[i].offset
      jumpTo(timeStamp, true)
      return
    }
  }
  //alert("not found")
  if (i >= wwoArr.length){
    //alert("in here")
    for (var i=0; i<wwoArr.length; i++){
      var matchArr = []
      for (n=0; n<wordArr.length; n++){
        var m = i+n
        if (m < wwoArr.length - wordArr.length)
          matchArr.push(wwoArr[m].word)
        else
          break
      }
      var match = matchArr.join(" ")
      if (regEx.test(match)){
        var timeStamp = wwoArr[i].offset
        jumpTo(timeStamp, true)
        break
      }
    }
  }
}

function selectWord(){
  $("#search").select()
}
function searchForText(){
  var searchWord = $("#search").val()

  this.event.preventDefault();
  if (searchWord == "*")
    return
  //$("#search").focus()
  jumptToKeyword(searchWord)
}

function jumpTo(timeStamp, scrollIntoView) {
  wavesurfer.pause();
  resetReadWords(timeStamp);
  var id = "word" + mIndex;
  wordElm = document.getElementById(id);
  // aPlayer.currentTime = timeStamp;
  if (scrollIntoView){
    var elm = "#" + id
    $(elm)[0].scrollIntoView();
  }
  // David wants to have some delay to play on click. Keep this value
  window.setTimeout(function(){
    wavesurfer.play(timeStamp);
    //seekEnded() // either here or inside the play
  }, 800)
}

function getInterestsRequestCallback(resp) {
    var data = JSON.parse(resp);
    if (data.length > 0)
    {
        var text = "<div>";
        for (var i=0; i< data.length; i++)
        {
            var entity = data[i];
            if (entity.type == "companies_eng")
            {
                text += "<b>Companiy name: </b><span style=\"color:#01A982 !important\"> " + entity.normalized_text + "</span></br>";
                if (entity.hasOwnProperty('additional_information'))
                {
                    var additional = entity.additional_information;
                    var url = "";
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://" + additional.wikipedia_eng;
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('url_homepage'))
                    {
                        text += "<b>Home page: </b><a href=\"";
                        if (additional.url_homepage.indexOf("http") == -1)
                            url = "http://" + additional.url_homepage;
                        else
                            url = additional.url_homepage;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('company_wikipedia'))
                    {
                        var wikiPage = "";
                        for (var p=0; p < additional.company_wikipedia.length; p++)
                            wikiPage += additional.company_wikipedia[p] + ", ";
                        if (wikiPage.length > 3)
                            wikiPage = wikiPage.substring(0, wikiPage.length - 2);
                        text += "<b>Wikipedia:</b> " + wikiPage + "</br>";
                    }
                    if (additional.hasOwnProperty('company_ric'))
                    {
                        var wikiPage = "";
                        for (var p=0; p<additional.company_ric.length; p++)
                            wikiPage += additional.company_ric[p] + ", ";
                        if (wikiPage.length > 3)
                            wikiPage = wikiPage.substring(0, wikiPage.length - 2);
                        text += "<b>RIC:</b> " + wikiPage + "</br>";
                    }
                }
            }
            else if (entity.type == "places_eng")
            {
                text += "<div style=\"color:#01A982 !important\">Place name: " + entity.normalized_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var url = "";
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('place_population'))
                    {
                        var pop = parseFloat(additional.place_population, 2);
                        var population = numberWithCommas(pop);// pop.toString();
                        /*
                        if (pop > 1000000)
                        {
                            pop /= 1000000;
                            population = pop.toString() + " million";
                        }
                        */

                        text += "<b>Population:</b> " + population + "</br>";
                    }
                    if (additional.hasOwnProperty('image'))
                    {
                        text += "<img src=\"";
                        text += additional.image + "\" width=\"50%\"/>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        text += "<b>Wiki page: </b><a target='_blank' href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.lat != 0.0 && additional.lon != 0.0)
                    {
                        var zoom = "10z";
                        if (additional.hasOwnProperty('place_type'))
                        {
                            switch (additional.place_type)
                            {
                                case "region1":
                                    zoom = ",6z";
                                    break;
                                case "continent":
                                    zoom = ",5z";
                                    break;
                                case "area":
                                    zoom = ",7z";
                                    break;
                                case "country":
                                    zoom = ",4z";
                                    break;
                                case "populated place":
                                    zoom = ",10z";
                                    break;
                                default:
                                    zoom = ",12z";
                                    break;
                            }
                        }
                        text += "<b>Map: </b><a target='_blank' href=\"https://www.google.com/maps/@" + additional.lat + "," + additional.lon + zoom + "\">";
                        text += "Show map</a></br>";
                    }
                }
            }
            else if (entity.type == "people_eng")
            {
                text += "<div style=\"color:#01A982 !important\">People name: " + entity.normalized_text + "</div>";

                if (entity.hasOwnProperty('additional_information'))
                {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('person_profession'))
                    {
                        var prof = "";
                        for (var p=0; p < additional.person_profession.length; p++)
                            prof += additional.person_profession[p] + ", ";
                        if (prof.length > 3)
                            prof = prof.substring(0, prof.length - 2);
                        text += "<b>Profession:</b> " + prof + "</br>";
                    }
                    if (additional.hasOwnProperty('person_date_of_birth'))
                        text += "<b>DoB:</b> " + additional.person_date_of_birth + "</br>";
                    if (additional.hasOwnProperty('person_date_of_death'))
                        text += "<b>DoD:</b> " + additional.person_date_of_death + "</br>";
                    if (additional.hasOwnProperty('image'))
                    {
                        text += "<img src=\"";
                        text += additional.image + "\" width=\"50%\"/>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('wikipedia_eng'))
                    {
                        var url = "";
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                }
            }
            else if (entity.type == "drugs_eng")
            {
                text += "<div style=\"color:#01A982 !important\">Drugs: " + entity.original_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('wikipedia_eng')) {
                        var url = "";
                        text += "<b>Wiki page: </b><a href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('disease_icd10')) {
                        var temp = "";
                        for (var p = 0; p < additional.disease_icd10.length; p++)
                            temp += additional.disease_icd10[p] + ", ";
                        if (temp.length > 3)
                            temp = temp.substring(0, temp.length - 2);
                        text += "<b>Disease:</b> " + temp + "</br>";
                    }
                }
            } else if (entity.type == "medical_conditions") {
                text += "<div style=\"color:#01A982 !important\">Medical condition: " + entity.original_text + "</div>";
                if (entity.hasOwnProperty('additional_information')) {
                    var additional = entity.additional_information;
                    if (additional.hasOwnProperty('wikipedia_eng')) {
                        var url = "";
                        text += "<b>Wiki page: </b><a target='_blank' href=\"";
                        if (additional.wikipedia_eng.indexOf("http") == -1)
                            url = "http://";
                        else
                            url = additional.wikipedia_eng;
                        text += url + "\">";
                        text += url + "</a>";
                        text += "</br>";
                    }
                    if (additional.hasOwnProperty('disease_icd10')) {
                        for (var p = 0; p < additional.disease_icd10.length; p++) {
                            text += "<b>ICD-10: </b><a target='_blank' href=\"";
                            text += additional.disease_icd10[p] + "\">";
                            text += "link</a>";
                            text += "</br>";
                        }
                    }
                }
            }
            text += "<br/>";
        }
        text += "</div>";
        $('#analytics_block').html(text);
    }
}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function padLeft(input, char, length) {
  var str = `${input}`;
  var padding = [];
  for (var i = str.length; i < length; i += 1) {
    padding.push(char);
  }
  return padding.join('') + str;
}
function formatDuration(duration) {
  if (Number.isNaN(duration)) {
    return '--:--';
  }
  var intDuration = typeof duration === 'number' ?
    Math.round(duration) :
    parseInt(duration, 10);

  var seconds = padLeft(intDuration % 60, '0', 2);
  var minutes = padLeft(Math.floor(intDuration / 60) % 60, '0', 2);
  var hours = Math.floor(intDuration / 3600) % 24;
  var string = '';
  if (hours > 0) {
    string = string + padLeft(hours, '0', 2)   + ':';
  }
  string = string + minutes + ':' + seconds;
  return string;
}
