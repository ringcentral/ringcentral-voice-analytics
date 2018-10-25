const curl = new (require( 'curl-request' ))();

var VB_BearerToken ="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMjE2YzRjNy02Mjg2LTRjZDUtYmMzZi03ZDJlMzY5MDU0MmYiLCJ1c2VySWQiOiJhdXRoMHw1YWEyZDY1YTI4ZWE5ZDI5MThjYTE5MGYiLCJvcmdhbml6YXRpb25JZCI6ImFiNzE5NzNkLWQ5NjAtZDBkYi1kYmU3LWUwYjdkNTIxZDgwMCIsImVwaGVtZXJhbCI6ZmFsc2UsImlhdCI6MTUyMDk3NjkyMzg1OCwiaXNzIjoiaHR0cDovL3d3dy52b2ljZWJhc2UuY29tIn0.z5jaEknKdDH_pnF0Pp8Ne2q5TR6VqMdhCa2rUO7Adzw"
var VB_EndPoint = "https://apis.voicebase.com/v3/media"

/*
curl --request POST \
  --url https://apis.voicebase.com/v3/media \
  --header 'Authorization: Bearer YOUR-BEARER-TOKEN' \
  --header 'Content-Type: multipart/form-data' \
  --header 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' \
  --form 'configuration={
  "speechModel": { "language": "en-US" },

  "publish": {
    "callbacks": [
      {
        "url" : "https://example.org/callback"
      },
      {
        "url" : "https://example.org/callback",
        "method" : "POST",
        "include" : [ "transcript", "knowledge", "metadata", "prediction", "streams", "spotting" ]
      },
      {
        "url" : "https://example.org/callback/vtt",
        "method" : "PUT",
        "type" : "transcript",
        "format" : "webvtt"
      },
      {
        "url" : "https://example.org/callback/srt",
        "method" : "PUT",
        "type" : "transcript",
        "format" : "srt"
      },
      {
        "url" : "https://example.org/callback/media",
        "method" : "PUT",
        "type" : "media",
        "stream": "original"
      }
    ]
  }
}


curl --request POST \
  --url https://apis.voicebase.com/v3/media \
  --header '\''accept: application/json'\'' \
  --header '\''authorization: Bearer YOUR-BEARER-TOKEN'\'' \
  --header '\''content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'\''
'
*/

var transcriptCallbackUrl = "https://7dd04fcf.ngrok.io/callback"
var vttCallbackUrl = "https://7dd04fcf.ngrok.io/callback/vtt"
var publishConfig = {}
//var callback =
publish = { "callbacks": [
    {
      "url" : "https://7dd04fcf.ngrok.io/callback"
    },
    {
      "url" : "http://localhost:3002/recordings/812656069021.mp3",
      "method" : "POST",
      "include" : [ "transcript" ]
    }
  ]
}

curl.setHeaders([
    'Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
    'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMjE2YzRjNy02Mjg2LTRjZDUtYmMzZi03ZDJlMzY5MDU0MmYiLCJ1c2VySWQiOiJhdXRoMHw1YWEyZDY1YTI4ZWE5ZDI5MThjYTE5MGYiLCJvcmdhbml6YXRpb25JZCI6ImFiNzE5NzNkLWQ5NjAtZDBkYi1kYmU3LWUwYjdkNTIxZDgwMCIsImVwaGVtZXJhbCI6ZmFsc2UsImlhdCI6MTUyMDk3NjkyMzg1OCwiaXNzIjoiaHR0cDovL3d3dy52b2ljZWJhc2UuY29tIn0.z5jaEknKdDH_pnF0Pp8Ne2q5TR6VqMdhCa2rUO7Adzw',
    'Content-Type: multipart/form-data'
])
//.setBody({
.setMultipartBody( [ {
  configuration: {"speechModel": { "language": "en-US" },
  publish: { "callbacks": [
      {
        "url" : "https://7dd04fcf.ngrok.io/callback"
      },
      {
        "url" : "http://localhost:3002/recordings/812656069021.mp3",
        "method" : "POST",
        "include" : [ "transcript" ]
      }
    ]
  }
//})
} ] )
.post('https://apis.voicebase.com/v3/media')
.then(({statusCode, body, headers}) => {
    console.log(statusCode, body, headers)
})
.catch((e) => {
    console.log(e);
});

/*
.setMultipartBody([{
  name: 'filename',
  contents: 'yourimage.png'
}, {
  name: 'file',
  file: './yourimage.png',
  type: 'image/png'
},
{
  configuration={
  "speechModel": { "language": "en-US" },
}])

var http = require("https");

var options = {
  "method": "POST",
  "hostname": [
    "apis",
    "voicebase",
    "com"
  ],
  "path": [
    "v3",
    "media"
  ],
  "headers": {
    "Content-Type": "multipart/form-data",
    "Authorization": "Bearer YOUR-BEARER-TOKEN"
  }
};

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"configuration\"\r\n\r\n{\n  \"speechModel\": { \"language\": \"en-US\" },\n\n  \"publish\": {\n    \"callbacks\": [\n      {\n        \"url\" : \"https://example.org/callback\"\n      },\n      {\n        \"url\" : \"https://example.org/callback\",\n        \"method\" : \"POST\",\n        \"include\" : [ \"transcript\", \"knowledge\", \"metadata\", \"prediction\", \"streams\", \"spotting\" ]\n      },\n      {\n        \"url\" : \"https://example.org/callback/vtt\",\n        \"method\" : \"PUT\",\n        \"type\" : \"transcript\",\n        \"format\" : \"webvtt\"\n      },\n      {\n        \"url\" : \"https://example.org/callback/srt\",\n        \"method\" : \"PUT\",\n        \"type\" : \"transcript\",\n        \"format\" : \"srt\"\n      },\n      {\n        \"url\" : \"https://example.org/callback/media\",\n        \"method\" : \"PUT\",\n        \"type\" : \"media\",\n        \"stream\": \"original\"\n      }\n    ]\n  }\n}\n\n\ncurl --request POST \\\n  --url https://apis.voicebase.com/v3/media \\\n  --header 'accept: application/json' \\\n  --header 'authorization: Bearer YOUR-BEARER-TOKEN' \\\n  --header 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
req.end();
*/
