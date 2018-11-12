var readFile = require('fs').readFile,
    basename = require('path').basename;
var util = require('util')

isJSON=function(value) {
  var ret = true
  try {
    JSON.parse(value);
  } catch (e) {
    ret = false
  }
  return ret
}
exports.build_combination = function(data, boundary, callback) {
  if (typeof data != 'object')
    return callback(new Error('Multipart builder expects data as key/val object.'));

  var body   = '',
      count  = Object.keys(data).length;
  if (count === 0)
    return callback(new Error('Empty multipart body. Invalid data.'))

  var done = function(err, section) {
    if (err) return callback(err);
    if (section) body += section;
    --count || callback(null, body + '--' + boundary + '--');
  };

  var extra = function(err, section) {
    if (err) return callback(err);
    if (section)
      body += section;
  };

  for (var key in data) {
    var value = data[key];
    if (value === null || typeof value == 'undefined') {
      done();
    }else {
      if (key == 'apikey' || key == 'combination'){
        var part = (value.buffer || value.file || value.content_type) ? value : {value: value};
        generate_part(key, part, boundary, done);
      }else if (key == 'file'){
        var len = value.length
        for(var i=0; i<len; i++) {
          var k = Object.keys(value[i])[0]
          var f = value[i][k]
          var part = (k.buffer || k.file || k.content_type) ? k: {value: k};

          generate_part("file_parameters", part, boundary, extra);

          //var p = {}
          part = {'file':f,'content_type':'multipart/form-data'}
          generate_part("file", part, boundary, done);
        }
      }else{
        var d = ""
        if (isJSON(value)){
          d = util.format('{"name":"%s","value":%s}', key, value)
        }else {
          d = util.format('{"name":"%s","value":"%s"}', key, value)
        }
        var part = (value.buffer || value.file || value.content_type) ? value : {value: d};
        generate_part("parameters", part, boundary, done);
      }
    }
  }
}

exports.build = function(data, boundary, callback) {
  if (typeof data != 'object')
    return callback(new Error('Multipart builder expects data as key/val object.'));

  var body   = '',
      object = flatten(data),
      count  = Object.keys(object).length;

  if (count === 0)
    return callback(new Error('Empty multipart body. Invalid data.'))

  var done = function(err, section) {
    if (err) return callback(err);
    if (section) body += section;
    --count || callback(null, body + '--' + boundary + '--');
  };

  for (var key in object) {
    var value = object[key];

    //console.log("val: " + value)
    if (value === null || typeof value == 'undefined') {
      //console.log("DONE");
      done();
    } else {
      var part = (value.buffer || value.file || value.content_type) ? value : {value: value};
      //console.log("key: " + key)
      //console.log("part: " + JSON.stringify(part))
      //console.log("value: " + JSON.stringify(value))
      generate_part(key, part, boundary, done);
    }
  }

}

var generate_part = function(name, part, boundary, callback) {
  var return_part = '--' + boundary + '\r\n';
  return_part += 'Content-Disposition: form-data; name="' + name + '"';

  var append = function(data, filename) {
    if (data) {
      var binary = part.content_type.indexOf('text') == -1;
      return_part += '; filename="' + encodeURIComponent(filename) + '"\r\n';
      if (binary) return_part += 'Content-Transfer-Encoding: binary\r\n';
      return_part += 'Content-Type: ' + part.content_type + '\r\n\r\n';
      return_part += binary ? data.toString('binary') : data.toString('utf8');
    }

    callback(null, return_part + '\r\n');
  };

  if ((part.file || part.buffer) && part.content_type) {
    var filename = part.filename ? part.filename : part.file ? basename(part.file) : name;
    if (part.buffer) return append(part.buffer, filename);

    readFile(part.file, function(err, data) {
      if (err) return callback(err);
      append(data, filename);
    });

  } else {

    if (typeof part.value == 'object')
      return callback(new Error('Object received for ' + name + ', expected string.'))

    if (part.content_type) {
      return_part += '\r\n';
      return_part += 'Content-Type: ' + part.content_type;
    }

    return_part += '\r\n\r\n';
    return_part += part.value;
    append();

  }

}

// flattens nested objects for multipart body
var flatten = function(object, into, prefix) {
  into = into || {};

  for(var key in object) {
    var prefix_key = prefix ? prefix + '[' + key + ']' : key;
    var prop = object[key];

    if (prop && typeof prop === 'object' && !(prop.buffer || prop.file || prop.content_type))
      flatten(prop, into, prefix_key)
    else
      into[prefix_key] = prop;
  }

  return into;
}
