var deleteArray = new Array()

function initForReadLog() {
  $( "#fromdatepicker" ).datepicker({ dateFormat: "yy-mm-dd"});
  $( "#todatepicker" ).datepicker({dateFormat: "yy-mm-dd"});
  var pastMonth = new Date();
  var day = pastMonth.getDate()
  var month = pastMonth.getMonth() - 1
  var year = pastMonth.getFullYear()
  if (month < 0){
    month = 11
    year -= 1
  }
  $( "#fromdatepicker" ).datepicker('setDate', new Date(year, month, day));
  $( "#todatepicker" ).datepicker('setDate', new Date());
}
function initForRecordedCalls() {
  var height = $("#menu_header").height()
  height += $("#search_bar").height()
  height += $("#call_list_header").height()
  height += $("#footer").height()

  var h = $(window).height() - (height + 90);
  $("#call_items").height(h)

  $('#call_items').find('tr').click( function() {
    var index = $(this).index()
    if (window.calls[index].processed == 1){
      openAnalyzed(window.calls[index].uid)
    }else if (window.calls[index].processed == 0) {
      var r = confirm("This content has not been transcribed yet.Do you want to transcribe it now?");
      if (r == true) {
        transcribe(window.calls[index].uid, window.calls[index].call_type, window.calls[index].recording_url)
      }
    }else{
      //alert("Analysis is not available.")
      var r = confirm("This content has not been transcribed yet.Do you want to transcribe it now?");
      if (r == true) {
        transcribe(window.calls[index].uid, window.calls[index].call_type, window.calls[index].recording_url)
      }
    }
  });

  $("#search").focus()
  $("#search").select()
}
function selectionHandler(elm){
  if ($(elm).prop("checked")){
    deleteArray = []
    for (var item of calls){
      var eid = "#sel_"+ item.uid
      $(eid).prop('checked', true);
      var item = {}
      item['id'] = item.uid
      item['type'] = item.type
      item['rec_id'] = item.rec_id
      deleteArray.push(item)
    }
  }else{
    for (var item of window.calls){
      var eid = "#sel_"+ item.uid
      $(eid).prop('checked', false);
    }
    deleteArray = []
  }
}
function logout(){
  window.location.href = "index?n=1"
}
function selectSelectText(){
  $("#search").select()
}

function openAnalyzed(id){
  var search = $("#search").val()
  post_to_url('/analyze', {
    CallId: id,
    searchWord: search
  }, 'post');
}

function post_to_url(path, params, method) {
    method = method || "post";
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);
    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }
    document.body.appendChild(form);
    form.submit();
}

function readCallLogs(){
  $("#fromdatepicker").prop("disabled", true);
  $("#todatepicker").prop("disabled", true);
  $("#readcalllogs").prop("disabled", true);
  $("#logginIcon").css('display', 'inline');
  var configs = {}
  configs['dateFrom'] = $("#fromdatepicker").val() + "T00:00:00.001Z"
  configs['dateTo'] = $("#todatepicker").val() + "T23:59:59.999Z"
  if ($('#extensionids') != undefined) {
    configs['extensionList'] = JSON.stringify($('#extensionids').val());
  }else{
    configs['extensionList'] = [];
  }
  //alert(JSON.stringify(configs))
  var url = "readlogs"
  var posting = $.post( url, configs );
  posting.done(function( response ) {
    var res = JSON.parse(response)
    if (res.status != "ok") {
      alert(res.calllog_error)
    }else{
      window.location = "recordedcalls"
    }
  });
  posting.fail(function(response){
    alert(response.statusText);
  });
}
function enableNotification(){
  if ($('#notification_btn').text() == "Disable Auto Processing"){
    var url = "disablenotification"
    var getting = $.get( url );
    getting.done(function( response ) {
      var res = JSON.parse(response)
      if (res.result != "ok") {
        alert(res.calllog_error)
      }else{
        $('#notification_btn').text("Enable Auto Processing")
      }
    });
    getting.fail(function(response){
      alert(response.statusText);
    });
  }else{
    var url = "enablenotification"
    var configs = {}
    if ($('#extensionids') != undefined) {
      configs['extensionList'] = JSON.stringify($('#extensionids').val());
    }else{
      configs['extensionList'] = [];
    }
    var posting = $.post(url, configs);
    posting.done(function( response ) {
      var res = JSON.parse(response)
      if (res.result != "ok") {
        alert(res.calllog_error)
      }else{
        $('#notification_btn').text("Disable Auto Processing")
      }
    });
    posting.fail(function(response){
      alert(response.statusText);
    });
  }
}

function startSearch(){
  $("#searchForm").submit()
  this.event.preventDefault();
}

function transcribe(audioId, type, recordingUrl){
  $('#ts_' + audioId).hide()
  $('#pi_' + audioId).show()
  var configs = {}
  configs['audioSrc'] = audioId
  configs['type'] = type
  if (type == 'VR'){
    recordingUrl = recordingUrl.replace('.mp4', '.mp3')
  }

  configs['recordingUrl'] = recordingUrl
  //configs['fname'] = fileName
  var url = "transcribe"
  disableAllInput(true)
  var posting = $.post( url, configs );
  posting.done(function( response ) {
    //alert(res)
    disableAllInput(false)
    var res = JSON.parse(response)
    if (res.status == "failed") {
      alert(res.message + " Please try again!")
    }else if (res.status == "empty") {
      $('#tt_' + audioId).html("Cannot recognize any text from this call.")
    }else if (res.status == "ok"){
      var itemArr = JSON.parse(res.result.keywords)
      //alert(JSON.stringify(itemArr))
      var count = itemArr.length
      var keywords = ""
      for (var i=0; i < count; i++) {
        var item = itemArr[i]
        //alert(JSON.stringify(item))
        keywords += '<span class="keyword">' + item.text + '</span>'
        if (i > 4) {
          break
        }
      }
      var icon = 'img/'
      icon += res.result.sentiment + '.png'
      $('#pi_' + audioId).hide()
      $('#st_' + audioId).attr("src", icon);
      $('#tt_' + audioId).html(keywords)
      $('#ts_' + audioId).html(res.result.subject)
      $('#ts_' + audioId).show()
    } else if (res.status == "in_progress"){
      // should poll or ask user to mamually check?
      $('#tt_' + audioId).html(res.message)
      startPolling(res.uid)
    }
  });
  posting.fail(function(response){
    disableAllInput(false)
    alert(response.statusText);
  });
}
function startPolling(uid){
  var thisUID = uid
  var thisText = "Transcribing ..."
  var checkTimer = window.setInterval(function (){
    var url = "checktranscription?uid="+thisUID
    var getting = $.get( url );
    getting.done(function( response ) {
      var res = JSON.parse(response)
      if (res.status != "ok") {
        alert(res.calllog_error)
      }else{
        if (res.state == '1'){
          clearInterval(checkTimer)
          window.location = "recordedcalls"
        }else{
          thisText += "."
          $('#tt_' + thisUID).html(thisText)
        }
      }
    });
    getting.fail(function(response){
      clearInterval(checkTimer)
      alert(response.statusText);
    });
  }, 5000)
}

function disableAllInput(disable){
  var elems = document.getElementsByTagName('button');
  var len = elems.length;
  if (disable == true){
    for (var i = 0; i < len; i++) {
        elems[i].disabled = true;
    }
  }else{
    for (var i = 0; i < len; i++) {
        elems[i].disabled = false;
    }
  }
}

function confirmRemove(id){
  var r = confirm("Do you really want to remove this call from local database?");
  if (r == true) {
    removeFromLocalDB(id)
  }
}

function removeFromLocalDB(id){
  var configs = {}
  configs['id'] = id
  var url = "remove"
  var posting = $.post(url, configs)
  posting.done(function(response) {
    var res = JSON.parse(response)
    if (res.status == "error") {
      alert("error")
    }else{
      window.location = "recordedcalls"
    }
  });
  posting.fail(function(response){
    alert(response.statusText)
  });
}

function confirmDelete(id, type, rec_id) {
  var r = confirm("Do you really want to delete this call from RingCentral call log database?");
  if (r == true) {
    deleteFromDB(id, type, rec_id)
  }
}

function deleteFromDB(id, type, rec_id){
  var configs = {}
  configs['id'] = id
  configs['type'] = type
  configs['rec_id'] = rec_id
  var url = "delete"
  var posting = $.post(url, configs)
  posting.done(function(response) {
    var res = JSON.parse(response)
    if (res.status == "error") {
      alert(res.calllog_error)
    }else{
      window.location = "recordedcalls"
    }
  });
  posting.fail(function(response){
    alert(response.statusText)
  });
}

function findSimilar(id){
  var configs = {}
  configs['id'] = id
  var url = "findsimilar"
  var posting = $.post(url, configs)
  posting.done(function(response) {
    var res = JSON.parse(response)
    if (res.status == "error") {
      alert(res.calllog_error)
    }else{
      alert("ok")
    }
  });
  posting.fail(function(response){
    alert(response.statusText)
  });
}

function selectForDelete(elm, cid, type, rec_id){
  var eid = "#sel_"+cid
  if ($(eid).prop("checked")){
    var item = {}
    item['id'] = cid
    item['type'] = type
    item['rec_id'] = rec_id
    deleteArray.push(item)
  }else{
    for (var i = 0; i < deleteArray.length; i++){
      if (deleteArray[i].id == cid){
        deleteArray.splice(i, 1)
        break
      }
    }
  }
  var rem = document.getElementById("rem_btn");
  var del = document.getElementById("del_btn");
  if (deleteArray.length > 0){
    //rem.disabled = true
    //del.disabled = true
    //$("#rem_btn").prop("")
    $("#rem_btn").prop("disabled", false);
    $("#del_btn").prop("disabled", false);
  }else{
    //rem.disabled = false
    //del.disabled = false
    $("#rem_btn").prop("disabled", true);
    $("#del_btn").prop("disabled", true);
  }
}
function confirmRemoveSelectedItemsFromDB(){
  var r = confirm("Do you really want to remove selected calls from local database?");
  if (r == true) {
    removeSelectedItemsFromLocalDB()
  }
}

function confirmDeleteSelectedItemsFromCallLogDb(){
  if (deleteArray.length <= 0 )
    return
  var r = confirm("Do you really want to delete selected calls from RingCentral call log database?");
  if (r == true) {
    deleteSelectedItemsFromCallLogDb()
  }
}

function removeSelectedItemsFromLocalDB(){
  var configs = {}
  configs['calls'] = JSON.stringify(deleteArray)
  var url = "remove"
  var posting = $.post(url, configs)
  posting.done(function(response) {
    var res = JSON.parse(response)
    if (res.status == "error") {
      alert("error")
    }else{
      window.location = "recordedcalls"
    }
  });
  posting.fail(function(response){
    alert(response.statusText)
  });
}

function deleteSelectedItemsFromCallLogDb(){
  var configs = {}
  configs['calls'] = JSON.stringify(deleteArray)
  var url = "delete"
  var posting = $.post(url, configs)
  posting.done(function(response) {
    var res = JSON.parse(response)
    if (res.status == "error") {
      alert(res.calllog_error)
    }else{
      window.location = "recordedcalls"
    }
  });
  posting.fail(function(response){
    alert(response.statusText)
  });
}
