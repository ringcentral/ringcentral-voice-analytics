window.onload = init;
//var result
var aPlayer = null;
var index = 0;
var mIndex = 1;
var wwoArr = []
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

  var h = $(window).height() - 230;

  $("#conversations_block").height(h)
  $("#analytics_block").height(h)
  $("#analyzed_content").height(h-92)
  //$("#my_canvas").height(h)
  //$("#my_canvas").width(h)

  var sliderPos = document.getElementById("positiveSentimentRange");
  sliderPos.oninput = function() {
    positiveThreshold = this.value/1000;
    $("#posval").html(positiveThreshold.toFixed(2))
    displayAnalytics('sentiment')
  }

  var sliderNeg = document.getElementById("negativeSentimentRange");
  sliderNeg.oninput = function() {
      negativeThreshold = (this.value/1000) * -1;
      $("#negval").html(negativeThreshold.toFixed(2))
      displayAnalytics('sentiment')
  }
  displayAnalytics('keywords')
  $("#search").focus()
  /*
  $('#dropdown-list').click(function(e){
    $('#sentiment-dropdown').text(this.innerHTML);
  });

  $(document.body).on('click', '.dropdown-menu li a', function (e) {
    alert($(this).text());
  });
  */
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
    //$("#sentiment_adjust").hide()
    $("#conversations_block").show()

  }else if (option == 'sentiment'){
    $("#sentiment_adjust").show()
    //$("#keyword-tab").css('class', 'tab-selected')
    $("#sentiment-tab").addClass("tab-selected");
    $("#keyword-tab").removeClass("tab-selected");
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
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": </span>"
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
                    text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": </span>"
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
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": </span>"
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
                      text += "<div class='sentiment_line'><span style='color:orange' onclick='jumpTo(" + item.timeStamp + ")'>Speaker "+ item.speakerId + ": </span>"
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
      text += "</div>"
      $("#analyzed_content").html(text)
    }else if (option == 'entities'){
      $("#sentiment_adjust").hide()
      $("#my_canvas").hide()
      $("#analytics_block").show()

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
      $("#sentiment_adjust").hide()
      /*
      $("#my_canvas").show()
      $("#analytics_block").hide()
      var itemArr = JSON.parse(window.results.concepts)
      var list = []
      for (var item of itemArr){
        var kw = []
        kw.push(item.text)
        kw.push(parseInt(item.relevance*10))
        kw.push(item.dbpedia_resource)
        list.push(kw)
      }
      var options = {
        list : list,
        gridSize: 8,
        weightFactor: 5,
        fontFamily: 'Finger Paint, cursive, sans-serif',
        //click: function(item) {alert(item[0] + ':' + item[1]);},
        click : function(item) { window.open(item[2]) },
        fontCSS: 'https://fonts.googleapis.com/css?family=Finger+Paint',
        backgroundColor: '#425563'
      }
      WordCloud(document.getElementById('my_canvas'), options );
      //WordCloud(document.getElementById('my_canvas'), { list: list } );
      */
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
      $("#analytics_block").html(text)

    }else if (option == 'keywords'){
      $("#sentiment-tab").removeClass("tab-selected");
      $("#keyword-tab").addClass("tab-selected");
      $("#sentiment_adjust").hide()

      /*
      $("#analytics_block").hide()
      $("#my_canvas").show()
      var itemArr = JSON.parse(window.results.keywords)
      var list = []
      for (var item of itemArr){
        var kw = []
        kw.push(item.text)
        kw.push(parseInt(item.relevance*10))
        list.push(kw)
      }
      var options = {
        list : list,
        gridSize: 10,
        weightFactor: 10,
        fontFamily: 'Finger Paint, cursive, sans-serif',
        fontCSS: 'https://fonts.googleapis.com/css?family=Finger+Paint',
        shape: 'diamond'
      }
      //WordCloud(document.getElementById('my_canvas'), options );
      WordCloud(document.getElementById('my_canvas'), { list: list } );
      //WordCloud(document.getElementById('canvas'), options );
      */
      var text = ""//"<div>" + window.results.transcript + "</div>"
      var itemArr = JSON.parse(window.results.keywords)
      for (var item of itemArr){
        if (item.text != "class" && item.text != 'keywords'){
        //var regEx = new RegExp("\\b" + item.text + "\\b", "g");
        //text = text.replace(regEx, "<span class='keywords'>" + item.text + "</span>")
        text += "<span class='keyword'>" + item.text + "</span>"
        }
      }
      $("#analyzed_content").html(text)

    }else if (option == 'actions'){
      $("#sentiment_adjust").hide()
      //$("#my_canvas").hide()
      //$("#analytics_block").show()

      var itemArr = JSON.parse(window.results.actions)
      var text = ""
      for (var item of itemArr){
        var upper = item.charAt(0).toUpperCase() + item.substr(1);
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
/*
$("#searchForm").submit(function(e){
    e.preventDefault();
    alert("call this")
    searchForText()
    return false;
});
*/
function selectWord(){
  $("#search").select()
}
function searchForText(){
  var searchWord = $("#search").val()
  if (searchWord == "*")
    return
  $("#search").focus()
  var regEx = new RegExp(searchWord, "i");
  for (var i=mIndex; i<wwoArr.length; i++){
    var word = wwoArr[i].word
    //if (word == searchWord){
    if (regEx.test(word)){
      var timeStamp = wwoArr[i].offset
      jumpTo(timeStamp)
      // scroll to view
      var id = "#word" + i
      $(id)[0].scrollIntoView();
      break
    }
  }
  if (i >= wwoArr.length){
    for (var i=0; i<wwoArr.length; i++){
      var word = wwoArr[i].word
      if (regEx.test(word)){
        var timeStamp = wwoArr[i].offset
        jumpTo(timeStamp)
        // scroll to view
        var id = "#word" + i
        $(id)[0].scrollIntoView();
        break
      }
    }
  }
}

function jumpTo(timeStamp) {
  aPlayer.pause();
  resetReadWords(timeStamp);
  var id = "word" + mIndex;
  wordElm = document.getElementById(id);
  aPlayer.currentTime = timeStamp;
  aPlayer.play();
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
