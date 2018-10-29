window.onload = init;
//var result
var aPlayer = null;
var index = 0;
var mIndex = 1;
var wwoArr = [];
var wordsArr = [];
var offsetArr = [];
var conceptsArr;
var occurrencesArr;
var wordElm = null;
var mContent = "";
var searchWordArr = new Array();

var mReference = "";

var speakerSentiment = -1
var foundIndex = 0;
var positiveThreshold = 0.5;
var negativeThreshold = -0.5;

function init() {
  initializeAudioPlayer()
  var h = $(window).height() - 210;

  $("#conversations_block").height(h)
  $("#analytics_block").height(h)

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
  displayAnalytics('keywords');
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
    if (option == 'transcript'){
      $("#analytics_block").hide()
      $("#sentiment_adjust").hide()
      $("#conversations_block").show()
    }else if (option == 'text'){
      $("#conversations_block").hide()
      $("#analytics_block").show()
      $("#sentiment_adjust").hide()
      var text = "<div>" + window.results.transcript + "</div>"
      $("#analytics_block").html(text)
    }else if (option == 'sentiment'){
      $("#sentiment_adjust").show()
      $("#sentiment-tab").addClass("tab-selected");
      $("#keyword-tab").removeClass("tab-selected");
      $("#analyzed_content").show();

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
                //sentence = "<div class=\"sentiment_line\" onclick=\"jumpTo(" + item.timeStamp + ")\">"
                sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(pos.text) + "')\">"
                sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
                sentence += "<span class=\"positive_block\">.." + pos.text + "..</span>"
                sentence += "</div>"
                //alert(sentence)
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
                //sentence = "<div class=\"sentiment_line\" onclick=\"jumpTo(" + item.timeStamp + ")\">"
                sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(neg.text) + "')\">"
                sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
                sentence += "<span class=\"negative_block\">.." + neg.text + "..</span>"
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
            //alert(sent)
            text += sent
          }
          text += "</div>"
        }
        //alert(text)
        //if (sentence != '')
        //  text += sentence + "</div>"
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
                  //sentence = "<div class=\"sentiment_line\" onclick=\"jumpTo(" + item.timeStamp + ")\">"
                  sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(pos.text) + "')\">"
                  sentence += "<span class=\"sentiment_icon positive_icon\"></span>"
                  sentence += "<span class=\"positive_block\">" + pos.text + "</span>"
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
                  //sentence = "<div class=\"sentiment_line\" onclick=\"jumpTo(" + item.timeStamp + ")\">"
                  sentence = "<div class=\"sentiment_line\" onclick=\"jumpToSentiment(" + item.timeStamp + ",'" + escape(item.sentence) + "','" + escape(neg.text) + "')\">"
                  sentence += "<span class=\"sentiment_icon negative_icon\"></span>"
                  sentence += "<span class=\"negative_block\">" + neg.text + "</span>"
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
      text += "</div>"
      $("#analyzed_content").html(text)
    }else if (option == 'entities'){
      $("#conversations_block").hide()
      $("#analytics_block").show()
      $("#sentiment_adjust").hide()
      getInterestsRequestCallback(window.results.entities)
      return
      var entityArr = JSON.parse(window.results.entities)
      var text = "<div>"
      for (var item of entityArr){
        text += "<div>" + item.type + "/" + item.text + "</div>"
      }
      text += "</div>"
      $("#analytics_block").html(text)
    }else if (option == 'concepts'){
      $("#conversations_block").hide()
      $("#analytics_block").show()
      $("#sentiment_adjust").hide()

      var itemArr = JSON.parse(window.results.concepts)
      var text = "<div>"
      for (var item of itemArr){
        var highlighted = ""
        if (item.relevance > 0.9)
          highlighted = "high-relevance"
        else if (item.relevance > 0.7)
          highlighted = "medium-relevance"
        else
          highlighted = "low-relevance"
        text += "<div>" + "<a target='_blank'  class='" + highlighted + "' href='" + item.dbpedia_resource + "'>" + item.text + "</a>" + "</div>"
        //text += "<a href='" + item.dbpedia_resource + "'>Resource</a>"
      }
      text += "</div>"
/*
      var text = "<div>" + window.results.transcript + "</div>"
      var itemArr = JSON.parse(window.results.concepts)
      for (var item of itemArr){
        alert(item.text)
        var highlighted = ""
        if (item.relevance > 0.9)
          highlighted = "high-relevance"
        else if (item.relevance > 0.7)
          highlighted = "medium-relevance"
        else
          highlighted = "low-relevance"
        var regEx = new RegExp("\\b" + item.text + "\\b", "ig");
        var temp = "<a href='" + item.dbpedia_resource + "'>" + item.text + "</a>"
        text = text.replace(regEx, "<span class='" + highlighted + "'>" + temp + "</span>")
      }
*/
      $("#analytics_block").html(text)
    }else if (option == 'keywords'){
      $("#sentiment-tab").removeClass("tab-selected");
      $("#keyword-tab").addClass("tab-selected");
      // $("#conversations_block").hide()
      $("#analyzed_content").show();
      $("#sentiment_adjust").hide();
      /*
      var itemArr = JSON.parse(window.results.keywords)
      var text = "<div>"
      for (var item of itemArr){
        text += "<div>" + item.text + "</div>"
      }
      text += "</div>"
      */
      var text = ""//"<div>" + window.results.transcript + "</div>"
      var itemArr = JSON.parse(window.results.keywords)
      for (var item of itemArr){
        if (item.text != "class" && item.text != 'keywords'){
        //var regEx = new RegExp("\\b" + item.text + "\\b", "g");
        //text = text.replace(regEx, "<span class='keywords'>" + item.text + "</span>")
        text += "<span class='keyword' onclick='jumptToKeyword(\"" + item.text + "\")'>" + item.text + "</span>"
        }
      }
      $("#analyzed_content").html(text)
      // var text = "<div>" + window.results.transcript + "</div>"
      // var itemArr = JSON.parse(window.results.keywords)
      // for (var item of itemArr){
      //   if (item.text != "class" && item.text != 'keywords'){
      //   var regEx = new RegExp("\\b" + item.text + "\\b", "g");
      //   text = text.replace(regEx, "<span class='keywords'>" + item.text + "</span>")
      //   }
      // }
      // //alert(text)
      // $("#analyzed_content").html(text)
    }else if (option == 'semantic'){
      // $("#conversations_block").hide();
      $("#sentiment_adjust").show()
      $("#sentiment-tab").addClass("tab-selected");
      $("#keyword-tab").removeClass("tab-selected");
      $("#analyzed_content").show();
      $("#sentiment_adjust").show();
      var itemArr = JSON.parse(window.results.semantic_roles)
      var text = ""
      for (var item of itemArr){
        var upper = item.sentence.charAt(0).toUpperCase() + item.sentence.substr(1);
        text += "<div>" + upper + "</div>"
      }
      $("#analyzed_content").html(text)
    }
}

function initializeAudioPlayer(){
  wwoArr = JSON.parse(window.results.wordsandoffsets)
  wordElm = document.getElementById("word0");
  aPlayer = document.getElementById("audio_player");
  aPlayer.addEventListener("timeupdate",seektimeupdate,false);
  aPlayer.addEventListener('loadeddata', audioLoaded, false);
  aPlayer.addEventListener('seeked', seekEnded, false);
}

function audioLoaded() {
    mIndex = 0;
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
    alert(word)
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
  $("#search").focus()
  jumptToKeyword(searchWord)
}

function jumpTo(timeStamp, scrollIntoView) {
  aPlayer.pause();
  resetReadWords(timeStamp);
  var id = "word" + mIndex;
  wordElm = document.getElementById(id);
  aPlayer.currentTime = timeStamp;
  aPlayer.play();
  if (scrollIntoView){
    var elm = "#" + id
    $(elm)[0].scrollIntoView();
  }
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
