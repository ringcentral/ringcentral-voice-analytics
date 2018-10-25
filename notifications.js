var fs = require('fs')
var async = require("async");
const sqlite3 = require('sqlite3').verbose();
var CALLS_DATABASE = './db/calllogs.db';

function removeRegisteredSubscription() {
    engine.platform.get('/subscription')
      .then(function (response) {
        var data = response.json();
        if (data.records.length > 0){
          for(var record of data.records) {
            // delete old subscription before creating a new one
            platform.delete('/subscription/' + record.id)
              .then(function (response) {
                console.log("deleted: " + record.id)
              })
              .catch(function(e) {
                console.error(e);
                throw e;
              });
          }
        }
      })
      .catch(function(e) {
          console.error(e);
          throw e;
      });
}
//var subcription = rcsdk.createSubscription()
function subscribeForNotification(subcription){
  var eventFilter = []
  eventFilter.push('/restapi/v1.0/account/~/presence')
  subcription.setEventFilters(eventFilter)
  .register()
  .then(function(resp){
      console.log('ready to get missed call event')
  })
  .catch(function(e){
    throw e
  })
}
subcription.on(subcription.events.notification, function(msg){
  var user = {}
  user['extensionId'] = msg.body.extensionId
  user['telephonyStatus'] = msg.body.telephonyStatus
  user['startTime'] = ""
  console.log("STATUS: " + JSON.stringify(msg.body))
  checkMissedCall(user)
})

function checkMissedCall(user){
  var newUser = true
  for (var i=0; i<users.length; i++){
    console.log("stored: " + users[i].telephonyStatus)
    console.log("new   : " + user.telephonyStatus)
    if (users[i].extensionId == user.extensionId){
      newUser = false
      if (users[i].telephonyStatus == "NoCall" && user.telephonyStatus == "Ringing"){
        users[i].telephonyStatus = user.telephonyStatus
        var date = new Date()
        var time = date.getTime()

        var lessXXSeconds = time - (10 * 1000)
        var from = new Date(lessXXSeconds)
        var dateFrom = from.toISOString()
        users[i].startTime = dateFrom.replace('/', ':')
        console.log("START TIME: " + users[i].startTime)
        console.log("this extensionId " + users[i].extensionId + " has an incoming call")
        break
      }
      if (users[i].telephonyStatus == "Ringing" && user.telephonyStatus == "CallConnected"){
        users[i].telephonyStatus = user.telephonyStatus
        var date = new Date()
        var time = date.getTime()

        var lessXXSeconds = time - (60 * 1000)
        var from = new Date(lessXXSeconds)
        var dateFrom = from.toISOString()
        users[i].startTime = dateFrom.replace('/', ':')
        console.log("START TIME: " + users[i].startTime)
        console.log("this extensionId " + users[i].extensionId + " has a accepted a call")
        break
      }
      if (users[i].telephonyStatus == "Ringing" && user.telephonyStatus == "NoCall"){
        users[i].telephonyStatus = user.telephonyStatus
        console.log("this extensionId " + users[i].extensionId + " has a missed call")
        // now cause a 30 sec delay then check for call recordings
        setTimeout(function(){
          readExtensionCallLogs(users[i].extensionId, users[i].startTime)
        }, 30000)
        break
      }
      if (users[i].telephonyStatus == "CallConnected" && user.telephonyStatus == "NoCall"){
        users[i].telephonyStatus = user.telephonyStatus
        console.log("this extensionId " + users[i].extensionId + " has terminated a call")
        // now cause a 30 sec delay then check for call recordings
        setTimeout(function(){
          readExtensionCallLogs(users[i].extensionId, users[i].startTime)
        }, 30000)
        break
      }
      users[i].telephonyStatus = user.telephonyStatus
    }
  }
  if (newUser){
    users.push(user)
  }
}

function readExtensionCallLogs(extensionId, startTime){
  var endpoint = '/account/~/extension/'+ extensionId +'/call-log'
  var params = {}
  var date = new Date()
  //var time = date.getTime()

  //var lessXXDays = time - (84600 * 1 * 1000)
  //var from = new Date(lessXXDays)
  var dateTo = date.toISOString()
  dateTo = dateTo.replace('/', ':')
  console.log("END TIME: " + dateTo)

  params['view'] = 'Detailed'
  params['dateFrom'] = startTime
  params['dateTo'] = dateTo

  var recordArr = []
  platform.get(endpoint, params)
  .then(function(resp){
    var json = resp.json()
    console.log(JSON.stringify(json))
    async.each(json.records,
      function(record, callback){
        if (record.hasOwnProperty("recording")){
          var item = {}
          if (record.hasOwnProperty('from')){
            if (record.from.hasOwnProperty('phoneNumber'))
              item['fromRecipient'] = record.from.phoneNumber
            else if (record.from.hasOwnProperty('name'))
              item['fromRecipient'] = record.from.name
          }else{
            item['fromRecipient'] = "Unknown #"
          }
          if (record.hasOwnProperty('to')){
            if (record.to.hasOwnProperty('phoneNumber'))
              item['toRecipient'] = record.to.phoneNumber
            else if (record.to.hasOwnProperty('name'))
              item['toRecipient'] = record.to.name
          }else{
            item['toRecipient'] = "Unknown #"
          }
          item['date'] = new Date(record.startTime).getTime() / 1000
          item['type'] = "CR"
          item['processed'] = 0
          item['duration'] = record.duration
          item['id'] = record.recording.id
          item['recordingUrl'] = record.recording.contentUri
          var recordedFile = item.id + ".mp3"
          item['localAudio'] = "http://localhost:3002/recordings/" + recordedFile
          recordArr.push(item)
          var emptyFields = ', "", "", "", "", "all", "", 0,0,0, "", "", "", "", "", ""'
          var query = "INSERT or IGNORE into calls VALUES (" + item['id'] + "," + item['date'] + ",'" + item['type'] + "','" + item['fromRecipient'] + "','" + item['toRecipient'] + "','" + item['recordingUrl'] + "'," + item['duration'] + ",'" + item['localAudio'] + "', " + item['processed']
          query += emptyFields + ")";

          db.run(query, function(err, result) {
            if (err){
              console.error(err.message);
            }else{
              callback()
            }
          });

          console.log("THIS CALL HAS A RECORDING: " + record.recording.contentUri)
          callback()
        }else if (record.hasOwnProperty("message")){
          if (record.message.type == "VoiceMail"){
            var item = {}
            if (record.hasOwnProperty('from')){
              if (record.from.hasOwnProperty('phoneNumber'))
                item['fromRecipient'] = record.from.phoneNumber
              else if (record.from.hasOwnProperty('name'))
                item['fromRecipient'] = record.from.name
            }else{
              item['fromRecipient'] = "Unknown #"
            }
            if (record.hasOwnProperty('to')){
              if (record.to.hasOwnProperty('phoneNumber'))
                item['toRecipient'] = record.to.phoneNumber
              else if (record.to.hasOwnProperty('name'))
                item['toRecipient'] = record.to.name
            }else{
              item['toRecipient'] = "Unknown #"
            }
            item['date'] = new Date(record.startTime).getTime() / 1000
            item['type'] = "VM"
            item['processed'] = 0
            item['duration'] = record.duration
            item['id'] = record.message.id
            item['recordingUrl'] = record.message.uri
            var recordedFile = item.id + ".mp3"
            item['localAudio'] = "http://localhost:3002/recordings/" + recordedFile
            recordArr.push(item)
            var emptyFields = ', "", "", "", "", "all", "", 0,0,0, "", "", "", "", "", ""'
            var query = "INSERT or IGNORE into calls VALUES (" + item['id'] + "," + item['date'] + ",'" + item['type'] + "','" + item['fromRecipient'] + "','" + item['toRecipient'] + "','" + item['recordingUrl'] + "'," + item['duration'] + ",'" + item['localAudio'] + "', " + item['processed']
            query += emptyFields + ")";

            db.run(query, function(err, result) {
              if (err){
                console.error(err.message);
              }else{
                callback()
              }
            });

            console.log("THIS CALL HAS A VOICEMAIL: " + record.message.uri)
            callback()
          }
        }else{
          console.log("THIS CALL HAS NO RECORDING")
          callback()
        }
      }
    );
    saveAudioFile(recordArr, res)
  })
  .catch(function(e){
    /*
    var errorRes = {}
    var err = e.toString();
    if (err.includes("ReadCompanyCallLog")){
      errorRes['calllog_error'] = "You do not have admin role to access account level. You can choose the extension access level."
      res.send(JSON.stringify(errorRes))
    }else{
      errorRes['calllog_error'] = "Cannot access call log."
      res.send(JSON.stringify(errorRes))
    }
    */
    console.log(err)
  })
}
