window.onload = init;
//var result
var aPlayer = null;
var index = 0;
var mIndex = 1;
var wwoArr = [];

var wordElm = null;
var searchWordArr = new Array();

var speakerSentiment = -1
var foundIndex = 0;
var positiveThreshold = 0.5;
var negativeThreshold = -0.5;
var fixedSubstractedHeight = 0
//var upperBlockHeight = 0
function init() {
  initializeAudioPlayer()
  fixedSubstractedHeight = $("#menu_header").height()
  fixedSubstractedHeight += $("#search_bar").height()
  fixedSubstractedHeight += $("#subject_header").height()
  fixedSubstractedHeight += $("#footer").height()
  //upperBlockHeight = $("#upper_block").height()
  var h = $(window).height() - (fixedSubstractedHeight);
  $("#conversations_block").height(h - 150);

  var sliderPos = document.getElementById("positiveSentimentRange");
  sliderPos.oninput = function() {
    positiveThreshold = this.value/1000;
    $("#posval").html(positiveThreshold);
    var percent = (positiveThreshold * 100).toFixed(2);
    var style = 'linear-gradient(to right, #b8e986 0%, #b8e986 ' + percent + '%, #c8ccd1 ' + percent + '%, #c8ccd1)';
    sliderPos.style.background = style;
    displayAnalytics('sentiment');
  }

  var sliderNeg = document.getElementById("negativeSentimentRange");
  sliderNeg.oninput = function() {
      negativeThreshold = (this.value/1000) * -1;
      $("#negval").html(negativeThreshold)
      var percent = (this.value/10).toFixed(2);
      var style = 'linear-gradient(to right, #e98f86 0%, #e98f86 ' + percent + '%, #c8ccd1 ' + percent + '%, #c8ccd1)';
      sliderNeg.style.background = style;
      displayAnalytics('sentiment');
  }
  $("#search").focus()
  //displayAnalytics('keywords');
}
function setSpeakersWithSentiment(){
  speakerSentiment = $("#speakers").val()
  displayAnalytics('sentiment')
}

function displayAnalytics(option){
  if (option == 'sentiment'){
    $("#sentiment_adjust").show()
    $("#sentiment-tab").addClass("tab-selected");
    $("#keyword-tab").removeClass("tab-selected");
    var upperBlockHeight = $("#upper_block").height() + 130
    var h = $(window).height() - (fixedSubstractedHeight);
    $("#analyzed_content").height(h-upperBlockHeight < 150 ? 150 : h-upperBlockHeight);

    var itemArr = JSON.parse(window.results.sentiments)
    var text = "<div>"
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
          speaker['sentences'] = []
          speakersArr.push(speaker)
        }
      }
      for (var item of itemArr){
        sentence = '' //item.sentence
        if (item.hasOwnProperty('positive')){
          for (var pos of item.positive){
            if (pos.score > positiveThreshold){
              var tText = truncateText(pos.text || pos.normalized_text);
              sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
              sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
              sentence += "<span class=\"positive_block\">.. " + tText + " ..</span>"
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
              var tText = truncateText(neg.text || neg.normalized_text);
              sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
              sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
              sentence += "<span class=\"negative_block\">.. " + tText + " ..</span>"
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
          sentence = ''
          if (item.hasOwnProperty('positive')){
            for (var pos of item.positive){
              if (pos.score > positiveThreshold){
                var tText = truncateText(pos.text || pos.normalized_text);
                sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
                sentence += "<span class=\"positive_block\">.. " + tText + " ..</span>"
                sentence += "</div>"
                speaker.sentences.push(sentence)
              }
            }
          }
          if (item.hasOwnProperty('negative')){
            for (var neg of item.negative){
              if (neg.score < negativeThreshold){
                var tText = truncateText(neg.text || neg.normalized_text);
                sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(tText) + "')\">"
                sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
                sentence += "<span class=\"negative_block\">.. " + tText + " ..</span>"
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
    text += "</div>"
    $("#analyzed_content").html(text)
  }else if (option == 'keywords'){
    $("#sentiment-tab").removeClass("tab-selected");
    $("#keyword-tab").addClass("tab-selected");
    $("#sentiment_adjust").hide();
    var upperBlockHeight = $("#upper_block").height() + 130
    var h = $(window).height() - (fixedSubstractedHeight);
    $("#analyzed_content").height(h-upperBlockHeight < 150 ? 150 : h-upperBlockHeight);
    var text = "";
    var itemArr = JSON.parse(window.results.keywords);
    for (var item of itemArr){
      if (item.text != "class" && item.text != 'keywords'){
        text += "<span class='keyword' onclick='jumptToKeyword(\"" + item.text + "\")'>" + item.text + "</span>"
      }
    }
    $("#analyzed_content").html(text);
  }
}
function truncateText(text){
  var wordsArr = text.split(" ");
  var ret = "";
  if (wordsArr.length > 15){
    for (var i=0; i<wordsArr.length; i++){
      if (i == 15){
        ret += wordsArr[i];
        break
      }
      ret += wordsArr[i] + " ";
    }
  }else {
    ret = text;
  }
  return ret;
}

var isPlaying = false;
var progress;
var progressBar;
var videoSliderVolumeRange;
function initializeAudioPlayer(){
  wwoArr = JSON.parse(window.results.wordsandoffsets);
  wordElm = document.getElementById("word0");
  aPlayer = document.getElementById("audio_player");
  progress = document.getElementById("video-progress");
  progressBar = document.getElementById('progress-bar');
  aPlayer.addEventListener("timeupdate", function() {
    seektimeupdate();
    if (!progress.getAttribute('max')) {
      progress.setAttribute('max', aPlayer.duration);
    }
    progress.value = aPlayer.currentTime;
    progressBar.style.width = Math.floor((aPlayer.currentTime / aPlayer.duration) * 100) + '%';
    $('#video-playing-time').html(formatDuration(aPlayer.currentTime))
  }, false);
  aPlayer.addEventListener('loadeddata', audioLoaded, false);
  aPlayer.addEventListener('seeked', seekEnded, false);
  aPlayer.addEventListener('loadedmetadata', function() {
    progress.setAttribute('max', aPlayer.duration);
    $('#video-duration').html(formatDuration(aPlayer.duration));
  });
  isPlaying = false;
  $('#video-play').show();
  aPlayer.addEventListener('pause', function () {
    isPlaying = false;
    $('#video-pause').hide();
    $('#video-play').show();
  });
  aPlayer.addEventListener('ended', function () {
    isPlaying = false;
    $('#video-pause').hide();
    $('#video-play').show();
  });
  aPlayer.addEventListener('play', function () {
    isPlaying = true;
    $('#video-pause').show();
    $('#video-play').hide();
  });
  $('#video-pause').click(function() {
    if (isPlaying) {
      isPlaying = false;
      aPlayer.pause();
      $('#video-pause').hide();
      $('#video-play').show();
    }
  });
  $('#video-play').click(function() {
    if (!isPlaying) {
      isPlaying = true;
      aPlayer.play();
      $('#video-pause').show();
      $('#video-play').hide();
    }
  });
  progress.addEventListener('click', function(e) {
    var pos = (e.pageX  - (this.offsetLeft + this.offsetParent.offsetLeft)) / this.offsetWidth;
    aPlayer.currentTime = pos * aPlayer.duration;
  });
  videoSliderVolumeRange = window.document.getElementById("videoSliderVolumeRange");
  $('#volume-icon').click(function () {
    $('#videoSliderVolumeRange').toggle();
  });
  videoSliderVolumeRange.oninput = function() {
    var percent = (this.value/10).toFixed(2);
    var style = 'linear-gradient(to right, #ffffff 0%, #ffffff ' + percent + '%, #888888 ' + percent + '%, #888888)';
    videoSliderVolumeRange.style.background = style;
    aPlayer.volume = this.value / 1000.0;
  }
  $('#fullscreen-icon').click(function() {
    if (aPlayer.requestFullscreen) {
      aPlayer.requestFullscreen();
    } else if (aPlayer.mozRequestFullScreen) {
      aPlayer.mozRequestFullScreen();
    } else if (aPlayer.webkitRequestFullScreen) {
      aPlayer.webkitRequestFullScreen();
    }
  });
}

function audioLoaded() {
    mIndex = 0;
    //upperBlockHeight = $("#upper_block").height()
    displayAnalytics('keywords');
}
function seekEnded() {
    var pos = aPlayer.currentTime;
    resetReadWords(pos);
    var id = "word" + mIndex;
    wordElm = document.getElementById(id);
}
function seektimeupdate() {
    var pos = aPlayer.currentTime;
    if (mIndex < wwoArr.length)
    {
        var check = wwoArr[mIndex].offset;
        while (pos >= check)
        {
            wordElm.setAttribute("class", "readtext");
            wordElm = document.getElementById("word"+mIndex);
            wordElm.setAttribute("class", "word");
            mIndex++;
            check = wwoArr[mIndex].offset;
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
    while (pos < value) {
        var idee = "word" + mIndex;
        elm = document.getElementById(idee);
        elm.setAttribute("class", "readtext");
        mIndex++;
        pos =  wwoArr[mIndex].offset;
    }
}

function jumpToSentiment(timeStamp, sentence, words){
  sentence = unescape(sentence)
  words = unescape(words)
  var wordArr = words.split(" ")
  var sentenceArr = sentence.split(" ")
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
        if (match.indexOf(words) >= 0){
          timeStamp = wwoArr[n+i].offset
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
  if (i >= wwoArr.length){
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
  aPlayer.pause();
  resetReadWords(timeStamp);
  var id = "word" + mIndex;
  wordElm = document.getElementById(id);
  aPlayer.currentTime = timeStamp;
  if (scrollIntoView){
    var elm = "#" + id
    $(elm)[0].scrollIntoView();
  }
  window.setTimeout(function(){
    aPlayer.play();
  }, 800)
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
