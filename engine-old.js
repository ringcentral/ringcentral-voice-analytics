var RC = require('ringcentral')
var fs = require('fs')
var async = require("async");
const pgdb = require('./db')
const User = require('./usershandler.js')

var watson = require('./watson');

require('dotenv').load()

var rcsdk = null
var platform = null
var subscription = null

var users = []
//var extensionList = []
var categoryArr = []

function getUserIndex(id){
  console.log("USERS LENGTH:" + users.length)
  for (var i=0; i<users.length; i++){
    var user = users[i]
    console.log("USER ID:" + user.getUserId())
    if (id == user.getUserId()){
      return i
    }
  }
  return -1
}

function getUserIndexByExtensionId(extId){
  console.log("USERS LENGTH:" + users.length)
  for (var i=0; i<users.length; i++){
    var user = users[i]
    console.log("EXTENSiON ID:" + user.getExtensionId())
    if (extId == user.getExtensionId()){
      return i
    }
  }
  return -1
}

var databaseName = ''
var engine = module.exports = {
  loadLogin: function(req, res){
    if (req.query.env == "demo"){
      var userIndex = getUserIndex(100)
      if (userIndex < 0){
        req.session.userId = 100;
        var user = new User(100)
        user.setExtensionId(100)
        users.push(user)
      }else{
        req.session.userId = 100;
      }
      loadDemo()
      res.render('readlog', {
        user: 'demos'
      })
      return
    }

    if (req.session.userId == 0) { //(!req.session.hasOwnProperty("userId")){
      console.log("load login page")
      var id = new Date().getTime() //generateRandomCode(7)
      console.log(id)
      req.session.userId = id;
      var user = new User(id, req.query.env)
      users.push(user)
      var p = user.getPlatform()
      if (p != null){
        res.render('login', {
          authorize_uri: p.loginUrl({ // authUrl
            brandId: process.env.RINGCENTRAL_BRAND_ID,
            redirectUri: process.env.RC_APP_REDIRECT_URL
          }),
          redirect_uri: process.env.RC_APP_REDIRECT_URL,
          token_json: ''
        });
      }
    }else{
      console.log("Must be a reload page")
      //if (req.session.loggedIn == true){
        var index = getUserIndex(req.session.userId)
        if (index >= 0)
          res.render('readlog', {
            user: 'real'
          })
        else
          engine.forceLogin(req, res)
    }
  },
  forceLogin: function(req, res){
    console.log("forceLogin")
    req.session.destroy();
  },
  login: function(req, res){
    var thisReq = req
    var userIndex = getUserIndex(req.session.userId)
    if (userIndex < 0)
      return
    if (req.query.code) {
      console.log("CALL LOGIN FROM USER")
      var extensionId = users[userindex].login()
      console.log("EXTENSION ID: " + extensionId)
      /*
      var platform = users[userindex].getPlatform()

        p.login({
          code: req.query.code,
          redirectUri: process.env.RC_APP_REDIRECT_URL
        })
        .then(function (token) {
          var json = token.json()
          //console.log(JSON.stringify(json))
          var newToken = {}
          newToken['access_token'] = json.access_token
          newToken['expires_in'] = json.expires_in
          newToken['token_type'] = json.token_type
          newToken['refresh_token'] = json.refresh_token
          newToken['refresh_token_expires_in'] = json.refresh_token_expires_in
          newToken['login_timestamp'] = Date.now() / 1000
          console.log("ACCESS-TOKEN-EXPIRE-IN: " + json.expires_in)
          console.log("REFRESH-TOKEN-EXPIRE-IN: " + json.refresh_token_expires_in)
          users[userIndex].setUserToken(newToken)
          users[userIndex].setExtensionId(json.owner_id)
          console.log('logged_in');
          res.send('login success');
          p.get('/account/~/extension/~/')
            .then(function(response) {
              //console.log(response)
              var jsonObj = response.json();
              var table = users[userIndex].getUserTable()
              createTable(table)
              if (jsonObj.permissions.admin.enabled){
                users[userIndex].setAdmin(true)
                engine.getAccountExtensions(userIndex, jsonObj.id)
              }else{
                var item = {}
                var extensionList = []
                item['id'] = jsonObj.id
                item['extNum'] = jsonObj.extensionNumber.toString()
                item['fullName'] = jsonObj.contact.firstName + " " + jsonObj.contact.lastName
                console.log(item.fullName)
                console.log(item.extNum)
                extensionList.push(item)
                users[userIndex].setUserExtensionList(extensionList)
                engine.readPhoneNumber(userIndex, p)
              }
              //req.session.loggedIn = true
              //console.log("SET session: " + req.session.loggedIn)
            })
            .catch(function(e) {
                console.log("Failed")
                console.error(e);
            });
        })
        .catch(function (e) {
          console.log('ERR ' + e.message || 'Server cannot authorize user');
          res.send('Login error ' + e);
        });
        */
    } else {
      res.send('No Auth code');
    }
  },
  readPhoneNumber: function(userIndex, p){
    p.get('/account/~/extension/~/phone-number')
      .then(function(response) {
        var jsonObj =response.json();
        var count = jsonObj.records.length
        for (var record of jsonObj.records){
          console.log(JSON.stringify(record))
          if (record.usageType == "MainCompanyNumber"){
            users[userIndex].setMainCompanyNumber(record.phoneNumber.replace("+", ""))
            console.log(users[userIndex].getMainCompanyNumber())
            break;
          }
        }
      })
      .catch(function(e) {
        console.log("Failed")
        console.error(e);
      });
  },
  logout: function(req, res){
    console.log("LOGOUT FUNC")
    var index = getUserIndex(req.session.userId)
    if (index < 0){
      return engine.forceLogin(req, res)
    }
    var p = getPlatform(index)
    p.logout()
      .then(function (token) {
        console.log("logged out")
        p.auth().cancelAccessToken()
        users.splice(index, 1);
        return engine.forceLogin(req, res)
      })
      .catch(function (e) {
        console.log('ERR ' + e.message || 'Server cannot authorize user');
        res.send('Login error ' + e);
      });
  },
  getAccountExtensions: function (index){
    var endpoint = '/account/~/extension'
    var params = {
        status: "Enabled",
        type: "User",
        perPage: 1000
    }
    var p = getPlatform(index)
    p.get(endpoint, params)
      .then(function(resp){
        var json = resp.json()
        var extensionList = []
        for (var record of json.records){
          var item = {}
          item['id'] = record.id
          item['extNum'] = record.extensionNumber.toString()
          item['fullName'] = record.contact.firstName + " " + record.contact.lastName
          console.log(item.fullName)
          extensionList.push(item)
        }
        users[index].setUserExtensionList(extensionList)
        engine.readPhoneNumber(index, p)
      })
      .catch(function(e){
        throw e
      })
    console.log("DONE getAccountExtensions")
  },
  readCategories: function(index, nextQuery, retObj, res, field, keyword){
      var query = "SELECT categories FROM " + users[index].getUserTable();
      var categoryArr = []
      pgdb.read(query, (err, result) => {
        //console.log(result.rows)
        if(err != null){
          console.log(err);
          return categoryArr
          //callback(err);
        }
        if (result.rows.length == 0){
          var response = {}
          res.send(response)
        }else
          //console.log("category: " + unescape(JSON.stringify(allRows)))
          categoryArr.push("Unclassified")
          for (var item of result.rows){
            var cat = unescape(item.categories)
            if (cat.length > 0){
              var c = JSON.parse(cat)
              if (c.length > 0){
                for (var o of c){
                  var arr = o.split("/")
                  for (var a of arr){
                    if (a.length){
                      var newItem = true
                      for (var existCat of categoryArr){
                        if (existCat == a){
                          newItem = false
                          break
                        }
                      }
                      if (newItem){
                        //console.log("item: " + a)
                        categoryArr.push(a)
                      }
                    }
                  }
                }
              }
            }
          }
          console.log("categoryArr: " + JSON.stringify(categoryArr))
          users[index].setCategoryList(categoryArr)
          retObj['categories'] = JSON.stringify(categoryArr)
          engine.readFullData(index, nextQuery, retObj, res, field, keyword)
      });
    },
    subscribeForNotification: function (req){
      engine.removeRegisteredSubscription(req)
      subscribeForNotification(req)
    },
    removeRegisteredSubscription: function(req) {
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return //engine.forceLogin(req, res)
      }
      var p = getPlatform(index)
      p.get('/subscription')
        .then(function (response) {
          var data = response.json();
          if (data.records.length > 0){
            for(var record of data.records) {
              // delete old subscription before creating a new one
              //if (users[index].getSubscriptionId() == record.id){
              console.log(record)
              p.delete('/subscription/' + record.id)
                .then(function (response) {
                  console.log("deleted: " + record.id)
                })
                .catch(function(e) {
                  console.error(e);
                  throw e;
                });
            //}
            }
          }
        })
        .catch(function(e) {
          console.error(e);
          throw e;
        });
    },
    removeItemFromDB: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var query = "DELETE FROM " + users[index].getUserTable() + " WHERE uid=" + req.body.id;
      //console.log(query)
      pgdb.remove(query, function (err, result) {
        if (err){
          res.send('{"status":"error"}')
          return console.error(err.message);
        }
        res.send('{"status":"ok"}')
      });
    },
    deleteItemFromCallLogDb: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var p = getPlatform(index)
      var thisRes = res
      var thisReq = req
      //console.log(req.body.id)
      //console.log(req.body.rec_id)
      if (req.body.MsgType == "PR"){
        var query = "DELETE FROM " + users[index].getUserTable() + " WHERE uid=" + req.body.id;
        //console.log(query)
        pgdb.remove(query, function (err, result) {
          if (err){
            thisRes.send('{"status":"error"}')
            return console.error(err.message);
          }
          thisRes.send('{"status":"ok"}')
        });
      }else{
        var endpoint = '/restapi/v1.0/account/~/call-log/' + req.body.rec_id
        if (!users[index].isAdmin())
          endpoint = '/restapi/v1.0/account/~/extension/~/call-log/' + req.body.rec_id

        p.delete(endpoint)
          .then(function(){
            var query = "DELETE FROM " + users[index].getUserTable() + " WHERE uid=" + req.body.id;
            //console.log(query)
            pgdb.remove(query, function (err, result) {
              if (err){
                thisRes.send('{"status":"error"}')
                return console.error(err.message);
              }
              //engine.loadCallsFromDB(req, res)
              thisRes.send('{"status":"ok"}')
            });

          })
          .catch(function(e){
            console.log(e)
            //engine.loadCallsFromDB(req, res)
            thisRes.send('{"status":"error"}')
          })
      }
    },
    createRecord: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var item = {}
      item['from_number'] = "+16502245476"
      item['from_name'] = "Ryan"
      item['to_number'] = "+16505130930"
      item['to_name'] = "Paco"
      item['extension_num'] = "101"
      item['full_name'] = "Demo Account"
      item['date'] = new Date().getTime() /// 1000
      item['type'] = req.body.type
      item['processed'] = false
      item['duration'] = 1
      item['uid'] = generateRandomCode(9)
      item['rec_id'] = generateRandomCode(15)
      item['recording_url'] = "http://www.qcalendar.com/audios/" + req.body.fname
      if (req.body.type == 'VR')
        req.body.fname.replace('.mp4', '.mp3')
      var recordedFile = item.id + ".mp3"
      var query = "INSERT INTO " + users[index].getUserTable()
      query += "(uid, rec_id, call_date, call_type, extension_num, full_name, from_number, from_name, to_number, to_name, recording_url, duration, processed, wordsandoffsets, transcript, conversations, sentiments, sentiment_label, sentiment_score, sentiment_score_hi, sentiment_score_low, has_profanity, profanities, keywords, entities, concepts, categories, actions)"
      query += " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)"
      var values = [item['uid'], item['rec_id'],item['date'],item['type'],item['extension_num'],item['full_name'],item['from_number'],item['from_name'],item['to_number'],item['to_name'],item['recording_url'],item['duration'],0,"","","","","",0,0,0,0,"","","","","",""]
      pgdb.insert(query, values, (err, result) =>  {
        if (err){
          console.error(err.message);
        }else{
          res.send('{"result":"ok"}')
        }
      })
    },
    transcriptCallRecording: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      getAudioFile(index, req.body, res)
    },
    analyzeContent: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }

      var query = "SELECT * FROM " + users[index].getUserTable() + " WHERE uid=" + req.body.CallId;
      pgdb.read(query, (err, result) => {
        if (err){
          return console.error(err.message);
        }
        //console.log(JSON.stringify(result.rows[0]))
        var row = result.rows[0]
        if (users[index].getUserId() != 100){
          var p = getPlatform(index)
          if (row.call_type == 'VM' || row.call_type == 'CR')
            row.recording_url = p.createUrl(row.recording_url, {addToken: true});
        }
        row.conversations = unescape(row.conversations)
        row.transcript = unescape(row.transcript)
        row.entities = unescape(row.entities)
        row.keywords = unescape(row.keywords)
        row.actions = unescape(row.actions)
        row.concepts = unescape(row.concepts)
        row.sentiments = unescape(row.sentiments)
        row.profanities = unescape(row.profanities)
        row.wordsandoffsets = unescape(row.wordsandoffsets)
        //console.log(row.wordsandoffsets)
        var page = 'recordedcall'
        if (row.call_type == 'VR')
          page = 'videocall'
        res.render(page, {
          results: row,
          companyNumber: users[index].getMainCompanyNumber(),
          searchWord: req.body.searchWord
        })
      });
    },
    // use async
    readCallRecordingsAsync: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      extIndex = 0
      readExtensionCallLog(req.body, res, index)
    },
    findSimilar: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var query = "SELECT uid, keywords FROM " + users[index].getUserTable();
      pgdb.read(query, (err, result) => {
        if (err){
          return console.error(err.message);
        }
        console.log(JSON.stringify(result))
        var refKeywords = []
        for (var i = 0; i < result.length; i++){
          var r = result[i]
          if (r.id == req.body.id){
            console.log("found")
            var item = {}
            item['id'] = req.body.id
            item['kw'] = JSON.parse(unescape(r.keywords))
            refKeywords.push(item)
            break
          }
        }
        for (var i = 0; i < result.length; i++){
          var r = result[i]
          if (r.id != req.body.id){
            console.log("--- new content ---")
            if (r.keywords != ""){
              var kwObj = JSON.parse(unescape(r.keywords))
              console.log("count: " + kwObj.length)
              var tempKeywords = []
              for (var refKw of refKeywords[0].kw){
                for (var kw of kwObj){
                  if (kw.text == refKw.text){
                    console.log("matched: " + refKw.text + " == " + kw.text)
                    var item = {}
                    item['text'] = kw.text
                    item['reference'] = kw.relevance
                    tempKeywords.push(item)
                    break
                  }
                }
              }
              if (tempKeywords.length > 0){
                var item = {}
                item['id'] = r.id
                item['kw'] = tempKeywords
                console.log(r.id + ": " + JSON.stringify(tempKeywords))
                refKeywords.push(item)
              }
            }
          }else{
            console.log("reference keyword!")
          }
        }
        console.log(JSON.stringify(refKeywords))

        res.send('{"status":"OK"}')
        /*
        res.render('recordedcall', {
          results: result,
          searchWord: req.body.searchWord
        })
        */
      });
    },
    searchCallsFromDB: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var posVal = req.body.positiveRange/1000
      var negVal = (req.body.negativeRange/1000) * -1

      var query = "SELECT uid, rec_id, call_date, call_type, extension_num, full_name, recording_url, transcript, processed, from_number, from_name, to_number, to_name, sentiment_label, sentiment_score_hi, sentiment_score_low, has_profanity, keywords FROM " + users[index].getUserTable() + " WHERE "
      var typeQuery = ""
      if (req.body.types != "all"){
        var checkType = req.body.types
        typeQuery = "call_type='" + checkType + "' AND "
      }
      var searchArg = req.body.search.trim()
      query += typeQuery
      if (req.body.fields == "all"){
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else{
            req.body.positiveRange = 1
            req.body.negativeRange = 1
            query += "(sentiment_score_low <= 0 OR sentiment_score_hi >= 0)";
          }
        }else{
          if (req.body.sentiment == "all"){
            query += "processed=true AND ("
            query += "transcript ILIKE '%" + searchArg + "%' OR "
            query += "keywords ILIKE '%" + searchArg + "%' OR "
            query += "concepts ILIKE '%" + searchArg + "%' OR "
            query += "from_number ILIKE '%" + searchArg + "%' OR "
            query += "from_name ILIKE '%" + searchArg + "%' OR "
            query += "to_number ILIKE '%" + searchArg + "%' OR "
            query += "to_name ILIKE '%" + searchArg + "%' OR "
            query += "extension_num ILIKE '%" + searchArg + "%' OR "
            query += "categories ILIKE '%" + searchArg + "%')"
          }else{
            query += "processed=true AND ("
            query += "transcript ILIKE '%" + searchArg + "%' OR "
            query += "keywords ILIKE '%" + searchArg + "%' OR "
            query += "concepts ILIKE '%" + searchArg + "%' OR "
            query += "from_number ILIKE '%" + searchArg + "%' OR "
            query += "from_name ILIKE '%" + searchArg + "%' OR "
            query += "to_number ILIKE '%" + searchArg + "%' OR "
            query += "to_name ILIKE '%" + searchArg + "%' OR "
            query += "extension_num ILIKE '%" + searchArg + "%' OR "
            query += "categories LIKE '%" + searchArg + "%') AND "
            query += "sentiment_label='" + req.body.sentiment + "'";
          }
        }
      }else if (req.body.fields == "transcript"){
        query += "processed=true AND "
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else{
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
          }
        }else{
          /*
          if (req.body.sentiment == "positive")
            query += "transcript LIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "transcript LIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "transcript LIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += "transcript LIKE '% " + searchArg + "%' AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
          */
          //var reg = " \b[" + searchArg + "\b]"
          if (req.body.sentiment == "positive")
            query += "transcript ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "transcript ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "transcript ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += "transcript ILIKE '%" + searchArg + "%' AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }
      }else if (req.body.fields == "keywords"){
        query += "processed=true AND "
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else{
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
          }
        }else{
          if (req.body.sentiment == "positive")
            query += "keywords ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "keywords ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "keywords ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += "keywords ILIKE '%" + searchArg + "%' " + " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }
      }else if (req.body.fields == "concepts"){
        query += " processed=true AND "
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else{
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
          }
        }else{
          if (req.body.sentiment == "positive")
            query += "concepts ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "concepts ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "concepts ILIKE '%" + searchArg + "%' AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += "concepts ILIKE '%" + searchArg + "%' " + " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }
      }else if (req.body.fields == "from"){
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }else{
          query += "from_number ILIKE '%" + searchArg + "%' OR from_name ILIKE '%" + searchArg + "%'"
          if (req.body.sentiment == "positive")
            query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi > " + posVal;
          else if (req.body.sentiment == "negative")
            query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low < " + negVal;
          else if (req.body.sentiment == "neutral")
            query += " AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi > " + posVal + ")";
        }
      }else if (req.body.fields == "to"){
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi > " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low < " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else
            //query += "1";
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }else{
          query += "to_number ILIKE '%" + searchArg + "%' OR to_name ILIKE '%" + searchArg + "%'"
          if (req.body.sentiment == "positive")
            query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += " AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }
      }else if (req.body.fields == "extension"){
        if (searchArg == "*") {
          if (req.body.sentiment == "positive")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "sentiment_label='" + req.body.sentiment + "'";
          else
            query += "(sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }else{
          if (req.body.sentiment == "positive")
            query += "extension_num=" + searchArg + " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
          else if (req.body.sentiment == "negative")
            query += "extension_num=" + searchArg + " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
          else if (req.body.sentiment == "neutral")
            query += "extension_num=" + searchArg + " AND sentiment_label='" + req.body.sentiment + "'";
          else
            query += "extension_mum=" + searchArg + " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
        }
      }else if (req.body.fields == "categories"){
        //console.log("SEARCH ARG: " + escape(req.body.categories))
        query += "processed=true AND categories LIKE '%" + escape(req.body.categories) + "%'"

        if (req.body.sentiment == "positive")
          query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_hi >= " + posVal;
        else if (req.body.sentiment == "negative")
          query += " AND sentiment_label='" + req.body.sentiment + "' AND sentiment_score_low <= " + negVal;
        else if (req.body.sentiment == "neutral")
          query += " AND sentiment_label='" + req.body.sentiment + "'";
        else
          query += " AND (sentiment_score_low <= " + negVal + " OR sentiment_score_hi >= " + posVal + ")";
      }
      console.log(query)
      var retObj = {}
      retObj['catIndex'] = req.body.categories
      retObj['searchArg'] = searchArg
      retObj['sentimentArg'] = req.body.sentiment
      retObj['fieldArg'] = req.body.fields
      retObj['typeArg'] = req.body.types
      retObj['posVal'] = req.body.positiveRange
      retObj['negVal'] = req.body.negativeRange
      if (users[index].getCategoryList().length == 0){
        engine.readCategories(index, query, retObj, res, searchArg)
      }else{
        retObj['categories'] = JSON.stringify(users[index].getCategoryList())
        engine.readFullData(index, query, retObj, res, req.body.fields, searchArg)
      }
    },
    readFullData: function(index, query, retObj, res, field, keyword){
      pgdb.read(query, (err, result) =>  {
        if (err){
          return console.error(err.message);
        }
        //console.log(result)
        var rows = result.rows
        if (field != null && field == 'keywords'){
          console.log("search keywords")
          for (var i = 0; i < rows.length; i++){
            var r = rows[i]
            var kwObj = JSON.parse(unescape(r.keywords))
            for (var kw of kwObj){
              if (kw.text == keyword){
                rows[i]['score'] = kw.relevance
                break
              }
            }
          }
          //console.log("BEFORE: " + JSON.stringify(rows))
          rows.sort(sortScores)
          //console.log("AFTER: " + JSON.stringify(rows))
        }
        else
          rows.sort(sortDates)
        var userLevel = 'demo'
        if (users[index].getUserId() != 100){
          userLevel = 'real'
          var p = getPlatform(index)
          for (var i=0; i<rows.length; i++){
            if (rows[i].call_type == "CR" || rows[i].call_type == "VM"){
              rows[i].recording_url = p.createUrl(rows[i].recording_url, {addToken: true});
            }
          }
        }
        //console.log(rows)

        //if (users[index].getUserId() == 100)
        //  userLevel = 'demo'
        res.render('recordedcalls', {
            calls: rows,
            companyNumber: users[index].getMainCompanyNumber(),
            categories: retObj.categories,
            catIndex: retObj.catIndex,
            searchArg: retObj.searchArg,
            sentimentArg: retObj.sentimentArg,
            fieldArg: retObj.fieldArg,
            typeArg: retObj.typeArg,
            posVal:retObj.posVal,
            negVal:retObj.negVal,
            itemCount: rows.length,
            user:userLevel
          })
      });
    },
    loadCallsFromDB: function(req, res){
      var index = getUserIndex(req.session.userId)
      if (index < 0){
        return engine.forceLogin(req, res)
      }
      var query = "SELECT uid, rec_id, call_date, call_type, extension_num, full_name, recording_url, transcript, processed, from_number, from_name, to_number, to_name,sentiment_label, sentiment_score_hi, sentiment_score_low, has_profanity FROM " + users[index].getUserTable();
      var retObj = {}
      retObj['catIndex'] = "Unclassified"
      retObj['searchArg'] = "*"
      retObj['sentimentArg'] = 'all'
      retObj['fieldArg'] = 'all'
      retObj['typeArg'] = 'all'
      retObj['posVal'] = 0
      retObj['negVal'] = 0
      if (users[index].getCategoryList().length == 0){
        engine.readCategories(index, query, retObj, res, null, "")
      }else{
        retObj['categories'] = JSON.stringify(users[index].getCategoryList())
        engine.readFullData(index, query, retObj, res, null, "")
      }
    }
}

function getAudioFile(index, body, res){
  console.log("getAudioFile")
  var table = users[index].getUserTable()
  if (body.type == "PR" || body.type == "VR"){
    var audioSrc = body.recordingUrl
    audioSrc = audioSrc.replace("http://www.qcalendar.com/audios", "./recordings")
    // reset category to force the app read new category form new content
    users[index].setCategoryList([])
    watson.transcribe(table, res, body, fs.createReadStream(audioSrc))
  }else {
    var p = getPlatform(index)
    var obj = body
    var thisRes = res
    p.get(body.recordingUrl)
      .then(function(res) {
        return res.response().buffer();
      })
      .then(function(buffer) {
        var stream = require('stream');
        var bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        users[index].setCategoryList([])
        watson.transcribe(table, thisRes, body, bufferStream)
      })
      .catch(function(e){
        console.log(e)
        throw e
      })
  }
}
/*
function saveAudioFile(resObj){
  console.log("saveAudioFile")
  async.each(recordArr,
    // 2nd param is the function that each item is passed to
    function(record, callback){
      // Call an asynchronous function, often a save() to DB
      //console.log(JSON.stringify(record))

      var recordingId = record.id
      var recordingUrl = record.recordingUrl
      platform.get(recordingUrl)
        .then(function(res) {
          //console.log("ok")
          return res.response().buffer();
        })
        .then(function(buffer) {
          //console.log("buffer")
          var audioSrc = "./recordings/" + record.id + '.mp3'
          fs.writeFileSync(audioSrc, buffer);
          //console.log("audioSrc: " + audioSrc)
          //var check = watson.transcribe(audioSrc)
          //console.log("CHECK: " + check)
          callback()
        })
        .catch(function(e){
          console.log(e)
          throw e
        })
    },
    function(err){
      //console.log("completed")
      //console.log(JSON.stringify(recordArr))
      resObj.send('{"result":"ok"}')
    }
  );
}
*/
function needLogin(res){
  if (!platform.auth().accessTokenValid()) {
    if (platform.auth().refreshTokenValid()){
      console.log("call refresh()")
      platform.refresh()
      .then (function(r){
        console.log("REFRESH")
        engine.loadCallsFromDB("", res)
      })
    }else{
      console.log("LOGIN")
      engine.login("", res)
    }

    return false
  }
  return true
}

var extIndex = 0
function readExtensionCallLog(body, res, userIndex){
  var ext = users[userIndex].getExtensionList()[extIndex]
  var extensionList = users[userIndex].getExtensionList()
  var endpoint = '/account/~/extension/'+ ext.id +'/call-log'
  var thisBody = body
  var thisRes = res
  var params = {
    view: "Detailed",
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    showBlocked: true,
    type: "Voice",
    perPage: 1000
  }

  var p = getPlatform(userIndex)
  async.waterfall([
      _function(p, res, endpoint, params, userIndex, extensionList)
    ], function (error, success) {
        if (error) {
          console.log('Something is wrong!');
        }
        extIndex++
        console.log('read next extension..');
        if (extIndex < extensionList.length){
          setTimeout(function(){
            readExtensionCallLog(thisBody, thisRes, userIndex)
          }, 1000)
        }else{
          console.log('Done read call log!');
          extIndex = 0
          thisRes.send('{"status":"ok"}')
        }
    });
}

function _function (p, res, endpoint, params, index, extensionList) {
  var thisIndex = index
  var thisRes = res
  return function (callback) {
    p.get(endpoint, params)
      .then(function(resp){
        var json = resp.json()
        if (json.records.length == 0){
          return callback (null, json);
        }
        async.each(json.records,
          function(record, callback0){
            //console.log("RECORD: " + JSON.stringify(record))
            var item = {}
            if (record.hasOwnProperty("message") && record.message.type == "VoiceMail"){
              item['call_type'] = "VM"
              item['uid'] = record.message.id
              var recordingUrl = record.message.uri.replace("platform", "media")
              recordingUrl += "/content/" + record.message.id
              item['recording_url'] = recordingUrl
            }else if (record.hasOwnProperty("recording")){
              item['call_type'] = "CR"
              item['uid'] = record.recording.id
              item['recording_url'] = record.recording.contentUri
            }else {
              //console.log("NO CR/VM")
              return callback0(null, null)
            }
            // CR and VM has the same 'from' and 'to' data structure
            if (record.hasOwnProperty('to')){
              if (record.to.hasOwnProperty('phoneNumber'))
                item['to_number'] = record.to.phoneNumber
              else if (record.to.hasOwnProperty('extensionNumber'))
                item['to_number'] = users[thisIndex].getMainCompanyNumber() + "*" + record.to.extensionNumber
              else
                item['to_number'] = "Unknown #"
              if (record.to.hasOwnProperty('name'))
                item['to_name'] = record.to.name
              else
                item['to_name'] = "Unknown"
            }else{
              item['to_number'] = "Unknown #"
              item['to_name'] = "Unknown"
            }

            if (record.hasOwnProperty('from')){
              if (record.from.hasOwnProperty('phoneNumber'))
                item['from_number'] = record.from.phoneNumber
              else if (record.from.hasOwnProperty('extensionNumber'))
                item['from_number'] = users[thisIndex].getMainCompanyNumber() + "*" + record.from.extensionNumber
              else
                item['from_number'] = "Unknown #"
              if (record.from.hasOwnProperty('name'))
                item['from_name'] = record.from.name
              else
                item['from_name'] = "Unknown"
            }else{
              item['from_number'] = "Unknown #"
              item['from_name'] = "Unknown"
            }
            item['call_date'] = new Date(record.startTime).getTime()
            item['processed'] = false
            item['rec_id'] = record.id
            item['duration'] = record.duration
            for (var ext of extensionList){
              for (var leg of record.legs){
                if (leg.hasOwnProperty('extension')){
                  if (ext.id == leg.extension.id){
                    item['extension_num'] = ext.extNum
                    item['full_name'] = ext.fullName
                    break
                  }
                  break
                }
              }
            }
            var query = "INSERT INTO " + users[index].getUserTable()
            query += "(uid, rec_id, call_date, call_type, extension_num, full_name, from_number, from_name, to_number, to_name, recording_url, duration, processed, wordsandoffsets, transcript, conversations, sentiments, sentiment_label, sentiment_score, sentiment_score_hi, sentiment_score_low, has_profanity, profanities, keywords, entities, concepts, categories, actions)"
            query += " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)"
            var values = [item['uid'], item['rec_id'],item['call_date'],item['call_type'],item['extension_num'],item['full_name'],item['from_number'],item['from_name'],item['to_number'],item['to_name'],item['recording_url'],item['duration'],0,"","","","","",0,0,0,0,"","","","","",""]
            query += " ON CONFLICT DO NOTHING"
            //setTimeout(function(){
                pgdb.insert(query, values, (err, result) =>  {
                  if (err){
                    console.error(err.message);
                    //callback0(null, result)
                  }
                  /*
                  else{
                    console.log("inserted");
                    callback0(null, result)
                  }
                  */
                  //console.log("inserted");
                  //if (iterate == count)
                  //  return callback(null, null)
                  //else
                    return callback0(null, result)
                })
            //}, 1000)
          },
          function (err){
            //console.log("function err")
            return callback (null, json);
          })
        })
        .catch(function(e){
          var errorRes = {}
          var err = e.toString();
          if (err.includes("ReadCompanyCallLog")){
            errorRes['calllog_error'] = "You do not have admin role to access account level. You can choose the extension access level."
            thisRes.send(JSON.stringify(errorRes))
          }else{
            errorRes['calllog_error'] = "Cannot access call log."
            thisRes.send(JSON.stringify(errorRes))
          }
          console.log(err)
        })
   }
}
function loadDemo(){
  createTable("user_100")
}
function dropTable(table){
  var query = "DROP TABLE IF EXISTS " + table
  pgdb.delete_table(query, (err, res) => {
    if (err) {
      console.log(err, res)
      //copyTable(table)
    }else{
      console.log("DONE")
      //copyTable(table)
    }
  })
}
function createTable(table) {
  console.log("CREATE TABLE")
  pgdb.create_table(table, (err, res) => {
    if (err) {
      console.log(err, res)
      //copyTable(table)
    }else{
      console.log("DONE")
      copyTable(table)
    }
  })

//copyTable('demos')

}

const sqlite3 = require('sqlite3').verbose();
var USERS_DATABASE = './db/users.db';

function copyTable(table){
  console.log("Copy demos table")
  var query = 'SELECT * FROM demos'
  let db = new sqlite3.Database(USERS_DATABASE);
  db.serialize(function() {
    db.all(query, function(err, allRows) {
      if(err != null){
        console.log(err);
        callback(err);
      }
      const math = require('mathjs')
      async.each(allRows,
        function(row, callback){
          var item = {}
          var wordsandoffsets = []
          var words = []
          var offsets = []
          Object.keys(row).forEach((key) => {
            if (key == 'id')
              item['uid'] = row[key]
            else if (key == 'rec_id') {
              item[key] = row[key]
            }else if (key == 'date') {
              item['call_date'] = row[key] * 1000
            }else if (key == 'type') {
              item['call_type'] = row[key]
            }else if (key == 'date') {
              item['call_date'] = row[key]
            }else if (key == 'extensionNum') {
              item['extension_num'] = row[key]
            }else if (key == 'fullName') {
              item['full_name'] = row[key]
            }else if (key == 'fromRecipient') {
              item['from_number'] = row[key]
            }else if (key == 'toRecipient') {
              item['to_number'] = row[key]
            }else if (key == 'extensionNum') {
              item['extension_num'] = row[key]
            }else if (key == 'recordingUrl') {
              item['recording_url'] = row[key]
            }else if (key == 'duration') {
              item['duration'] = row[key]
            }else if (key == 'processed') {
              if (row[key] == 1)
                item[key] = true
              else
                item[key] = false
            }else if (key == 'words') {
              //console.log("WORDS: " + unescape(row[key]))
              words = JSON.parse(unescape(row[key]))
              //wordsandoffsets['words'] = row[key]
            }else if (key == 'offsets') {
              //console.log("OFFSETS: " + unescape(row[key]))
              offsets = JSON.parse(unescape(row[key]))
              //wordsandoffsets['offsets'] = row[key]
            }else if (key == 'transcript') {
              item['transcript'] = escape(row[key])
            }else if (key == 'conversations') {
              item[key] = row[key]
            }else if (key == 'sentiment') {
              item['sentiments'] = row[key]
            }else if (key == 'sentiment_label') {
              item[key] = row[key]
            }else if (key == 'sentiment_score') {
              item[key] = row[key]
            }else if (key == 'sentiment_score_hi') {
              item[key] = row[key]
            }else if (key == 'sentiment_score_low') {
              item[key] = row[key]
            }else if (key == 'hasProfanity') {
              item['has_profanity'] = row[key]
            }else if (key == 'profanities') {
              item[key] = row[key]
            }else if (key == 'keywords') {
              item[key] = row[key]
            }else if (key == 'entities') {
              item[key] = row[key]
            }else if (key == 'concepts') {
              item[key] = row[key]
            }else if (key == 'categories') {
              item[key] = row[key]
            }else if (key == 'relations') {
              item['actions'] = row[key]
            }
          });

          item['from_name'] = 'Unknown'
          item['to_name'] = 'Unknown'

          for (var i=0; i<words.length; i++){
            var temp = {}
            temp['word'] = words[i]
            temp['offset'] = offsets[i]
            //console.log(JSON.stringify(temp))
            wordsandoffsets.push(temp)
          }
          //console.log("-----------------------")
          //console.log(JSON.stringify(wordsandoffsets))
          //console.log("-----------------------")
          item['wordsandoffsets'] = escape(JSON.stringify(wordsandoffsets))
          //console.log(item)

          var query = "INSERT INTO " + table
          query += "(uid, rec_id, call_date, call_type, extension_num, full_name, from_number, from_name, to_number, to_name, recording_url, duration, processed, wordsandoffsets, transcript, conversations, sentiments, sentiment_label, sentiment_score, sentiment_score_hi, sentiment_score_low, has_profanity, profanities, keywords, entities, concepts, categories, actions)"
          query += " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)"
          var values = [item['uid'], item['rec_id'],item['call_date'],item['call_type'],item['extension_num'],item['full_name'],item['from_number'],item['from_name'],item['to_number'],item['to_name'],item['recording_url'],item['duration'],item['processed'],item['wordsandoffsets'],item['transcript'],item['conversations'],item['sentiments'],item['sentiment_label'],item['sentiment_score'],item['sentiment_score_hi'],item['sentiment_score_low'],item['has_profanity'], item['profanities'],item['keywords'],item['entities'],item['concepts'],item['categories'],item['actions']]
          query += " ON CONFLICT DO NOTHING"
          //setTimeout(function(){
          pgdb.insert(query, values, (err, result) =>  {
            if (err){
              console.error(err.message);
              //callback0(null, result)
            }
            callback(null, result)
          })

        })
    });
  });
}

function sortDates(a,b) {
  return new Date(parseInt(b.call_date)) - new Date(parseInt(a.call_date));
}

function sortScores(a,b) {
  return b.score - a.score;
}

function getIndexBySubscriptionId(id){
  for (var i = 0; i < users.length; i++){
    var subId = users[i].getNotificationUsers().subId
    if (subId == id) {
      return i
    }
  }
}
function subscribeForNotification(req){
  var index = getUserIndex(req.session.userId)
  if (index < 0){
    return //engine.forceLogin(req, res)
  }
  var extensionList = users[index].getExtensionList()
  var eventFilter = []
  eventFilter.push('/restapi/v1.0/account/~/presence')
  for (var ext of extensionList){
    var fil = '/restapi/v1.0/account/~/extension/' + ext.id + '/message-store'
    console.log(fil)
    eventFilter.push(fil)
  }
  subscription.setEventFilters(eventFilter)
  .register()
  .then(function(resp){
    var json = resp.json();
    console.log('ready to get detect recorded calls and voicemail')
    //console.log("resp: " + JSON.stringify(resp))
    //console.log("owner_id: " + resp.owner_id)
    //console.log("owner_id: " + json.owner_id)
    //console.log("subscriptionId: " + json.id)
    var user = {}
    user['subId'] = json.id
    users[index].setNotificationUsers(user)
  })
  .catch(function(e){
    throw e
  })

  subscription.on(subscription.events.notification, function(msg){
    console.log(msg.ownerId)
    var index = getIndexBySubscriptionId(msg.subscriptionId)
    var extensionId = users[index].getExtensionId() //ownerId":"1426275020"
    if (extensionId == msg.ownerId) {
      if (msg.event.indexOf('message-store') > 0){
        if (msg.body.changes[0].type == "VoiceMail" && msg.body.changes[0].newCount > 0){
          console.log("Voicemail")
          var notificationUser = users[index].getNotificationUsers()
          if (notificationUser.subId == msg.subscriptionId){
            var date = new Date()
            var time = date.getTime()
            var moreXXSeconds = time + (36 * 1000) //+ (3600 * 8)
            var toDate = new Date(moreXXSeconds)
            var stopTime = toDate.toISOString()
            stopTime = stopTime.replace('/', ':')
            console.log("END TIME: " + stopTime)
            var extId = msg.body.extensionId
            var startTime = notificationUser.startTime
            setTimeout(function(){
              readExtensionCallLogs(index, extId, startTime, stopTime, false)
            }, 5000)

          }
        }
        console.log("BODY: " + JSON.stringify(msg.body))
      }else if (msg.event.indexOf('presence') > 0){
        var user = {}
        user['extensionId'] = msg.body.extensionId
        user['telephonyStatus'] = msg.body.telephonyStatus
        user['startTime'] = ""
        user['hasMissedCall'] = false
        console.log("STATUS: " + JSON.stringify(msg))
        checkMissedCall(index, user)
      }
    }
  })
}
function checkMissedCall(index, user){
  var newUser = true
  var notificationUser = users[index].getNotificationUsers()
  if (notificationUser.extensionId != undefined){
    console.log("stored: " + notificationUser.telephonyStatus)
    console.log("new   : " + user.telephonyStatus)
    if (notificationUser.extensionId == user.extensionId){
      newUser = false
      if (notificationUser.telephonyStatus == "NoCall" && user.telephonyStatus == "Ringing"){
        notificationUser.telephonyStatus = user.telephonyStatus
        var date = new Date()
        var time = date.getTime()
        var lessXXSeconds = time - (36 * 1000)// + (3600 * 8)
        var from = new Date(lessXXSeconds)
        var dateFrom = from.toISOString()
        notificationUser.startTime = dateFrom.replace('/', ':')
        users[index].setNotificationUsers(notificationUser)
        console.log("START TIME: " + notificationUser.startTime)
        console.log("this extensionId " + notificationUser.extensionId + " has an incoming call")
      }
      else if (notificationUser.telephonyStatus == "Ringing" && user.telephonyStatus == "CallConnected"){
        notificationUser.telephonyStatus = user.telephonyStatus
        notificationUser.hasMissedCall = false
        users[index].setNotificationUsers(notificationUser)
        console.log("this extensionId " + notificationUser.extensionId + " has a accepted a call")
      }
      else if (notificationUser.telephonyStatus == "Ringing" && user.telephonyStatus == "NoCall"){
        notificationUser.telephonyStatus = user.telephonyStatus
        notificationUser['hasMissedCall'] = true
        users[index].setNotificationUsers(notificationUser)
        console.log("this extensionId " + notificationUser.extensionId + " has a missed call")
        // now cause a 3 mins delay then check for call recordings
        /*
        setTimeout(function(){
          readExtensionCallLogs(users[i].extensionId, users[i].startTime, stopTime, false)
        }, 180000)
        */
      }
      else if (notificationUser.telephonyStatus == "CallConnected" && user.telephonyStatus == "NoCall"){
        notificationUser.telephonyStatus = user.telephonyStatus
        users[index].setNotificationUsers(notificationUser)
        console.log("this extensionId " + notificationUser.extensionId + " has terminated a call")
        // now cause a 30 sec delay then check for call recordings
        var date = new Date()
        var stopTime = date.toISOString()
        stopTime = stopTime.replace('/', ':')
        console.log("END TIME: " + stopTime)
        setTimeout(function(){
          readExtensionCallLogs(index, notificationUser.extensionId, notificationUser.startTime, stopTime, true)
        }, 20000)
      } else {
        notificationUser.telephonyStatus = user.telephonyStatus
        users[index].setNotificationUsers(notificationUser)
      }
    }
  }
  if (newUser){
    if (user.telephonyStatus == "Ringing"){
      var date = new Date()
      var time = date.getTime()
      var lessXXSeconds = time - (36 * 1000) //+ (3600 * 8)
      var from = new Date(lessXXSeconds)
      var dateFrom = from.toISOString()
      notificationUser['startTime'] = dateFrom.replace('/', ':')
      notificationUser['extensionId'] = user.extensionId
      notificationUser['telephonyStatus'] = user.telephonyStatus
      notificationUser['hasMissedCall'] = user.hasMissedCall
      console.log("START TIME: " + notificationUser['startTime'])
      console.log("this extensionId " + notificationUser['extensionId'] + " has an incoming call")
    }
    users[index].setNotificationUsers(notificationUser)
  }
}

function readExtensionCallLogs(index, extensionId, startTime, stopTime, withCallRecording){
  var endpoint = '/account/~/extension/'+ extensionId +'/call-log'
  var params = {}

  params['view'] = 'Detailed'
  params['dateFrom'] = startTime
  params['dateTo'] = stopTime
  if (withCallRecording)
    params['recordingType'] = 'All' //withCallRecording
  console.log(JSON.stringify(params))
  var p = getPlatform(index)
  console.log(endpoint)
  p.get(endpoint, params)
  .then(function(resp){
    console.log("RESPONSE: " + resp)
    var json = resp.json()
    if (json.records.length == 0){
      return
    }
    async.each(json.records,
      function(record, callback){
        console.log("RECORD: " + JSON.stringify(record))
        var item = {}
        if (record.hasOwnProperty("message") && record.message.type == "VoiceMail"){
          item['call_type'] = "VM"
          item['uid'] = record.message.id
          var recordingUrl = record.message.uri.replace("platform", "media")
          recordingUrl += "/content/" + record.message.id
          item['recording_url'] = recordingUrl
        }else if (record.hasOwnProperty("recording")){
          item['call_type'] = "CR"
          item['uid'] = record.recording.id
          item['recording_url'] = record.recording.contentUri
        }else {
          return callback(null, null)
        }
        // CR and VM has the same 'from' and 'to' data structure
        if (record.hasOwnProperty('to')){
          if (record.to.hasOwnProperty('phoneNumber'))
            item['to_number'] = record.to.phoneNumber
          else if (record.to.hasOwnProperty('extensionNumber'))
            item['to_number'] = users[index].getMainCompanyNumber() + "*" + record.to.extensionNumber
          else
            item['to_number'] = "Unknown #"
          if (record.to.hasOwnProperty('name'))
            item['to_name'] = record.to.name
          else
            item['to_name'] = "Unknown"
        }else{
          item['to_number'] = "Unknown #"
          item['to_name'] = "Unknown"
        }

        if (record.hasOwnProperty('from')){
          if (record.from.hasOwnProperty('phoneNumber'))
            item['from_number'] = record.from.phoneNumber
          else if (record.from.hasOwnProperty('extensionNumber'))
            item['from_number'] = users[index].getMainCompanyNumber() + "*" + record.from.extensionNumber
          else
            item['from_number'] = "Unknown #"
          if (record.from.hasOwnProperty('name'))
            item['from_name'] = record.from.name
          else
            item['from_name'] = "Unknown"
        }else{
          item['from_number'] = "Unknown #"
          item['from_name'] = "Unknown"
        }
        item['call_date'] = new Date(record.startTime).getTime()
        item['processed'] = false
        item['rec_id'] = record.id
        item['duration'] = record.duration
        var extensionList = users[index].getExtensionList()
        for (var ext of extensionList){
          for (var leg of record.legs){
            if (leg.hasOwnProperty('extension')){
              if (ext.id == leg.extension.id){
                item['extension_num'] = ext.extNum
                item['full_name'] = ext.fullName
                break
              }
              break
            }
          }
        }
        var query = "INSERT INTO " + users[index].getUserTable()
        query += "(uid, rec_id, call_date, call_type, extension_num, full_name, from_number, from_name, to_number, to_name, recording_url, duration, processed, wordsandoffsets, transcript, conversations, sentiments, sentiment_label, sentiment_score, sentiment_score_hi, sentiment_score_low, has_profanity, profanities, keywords, entities, concepts, categories, actions)"
        query += " VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)"
        var values = [item['uid'], item['rec_id'],item['call_date'],item['call_type'],item['extension_num'],item['full_name'],item['from_number'],item['from_name'],item['to_number'],item['to_name'],item['recording_url'],item['duration'],0,"","","","","",0,0,0,0,"","","","","",""]
        query += " ON CONFLICT DO NOTHING"
        pgdb.insert(query, values, (err, result) =>  {
          if (err){
            console.error(err.message);
          }
          console.log("saveVoiceFile")
          saveVoiceFile(index, p, item['call_type'], item['uid'], item['recording_url'])
          return callback(null, result)
        })
      },
      function (err){
        //console.log("function err")
        //return callback (null, json);

      })
    })
    .catch(function(e){
      var errorRes = {}
      var err = e.toString();
      if (err.includes("ReadCompanyCallLog")){
        errorRes['calllog_error'] = "You do not have admin role to access account level. You can choose the extension access level."
        console.log(errorRes['calllog_error'])
        //thisRes.send(JSON.stringify(errorRes))
      }else{
        errorRes['calllog_error'] = "Cannot access call log."
        console.log(errorRes['calllog_error'])
      }
      console.log(err)
    })
}


function saveVoiceFile(index, p, type, recordingId, contentUri){
  console.log("saveVoiceFile")
  p.get(contentUri)
    .then(function(res) {
      return res.response().buffer();
    })
    .then(function(buffer) {
      var stream = require('stream');
      var bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      var body = {}
      body['type'] = type
      body['audioSrc'] = recordingId
      console.log("CALL Watson?")
      //watson.transcribe(null, body, bufferStream)
      var table = users[index].getUserTable()
      users[index].setCategoryList([])
      watson.transcribe(table, null, body, bufferStream)
    })
    .catch(function(e){
      console.log(e)
      throw e
    })
}
const randomize = require('randomatic');
function generateRandomCode(digits) {
  var code = randomize('0', digits);
  return code
}
