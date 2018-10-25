var http = require("https");
var VB_BearerToken ="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMjE2YzRjNy02Mjg2LTRjZDUtYmMzZi03ZDJlMzY5MDU0MmYiLCJ1c2VySWQiOiJhdXRoMHw1YWEyZDY1YTI4ZWE5ZDI5MThjYTE5MGYiLCJvcmdhbml6YXRpb25JZCI6ImFiNzE5NzNkLWQ5NjAtZDBkYi1kYmU3LWUwYjdkNTIxZDgwMCIsImVwaGVtZXJhbCI6ZmFsc2UsImlhdCI6MTUyMDk3NjkyMzg1OCwiaXNzIjoiaHR0cDovL3d3dy52b2ljZWJhc2UuY29tIn0.z5jaEknKdDH_pnF0Pp8Ne2q5TR6VqMdhCa2rUO7Adzw"
var VB_EndPoint = "https://apis.voicebase.com/v3/media"
var host = "https://apis.voicebase.com/"

var options = {
  "method": "POST",
  "hostname": VB_EndPoint,
  "headers": {
    "Content-Type": "multipart/form-data",
    "Authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMjE2YzRjNy02Mjg2LTRjZDUtYmMzZi03ZDJlMzY5MDU0MmYiLCJ1c2VySWQiOiJhdXRoMHw1YWEyZDY1YTI4ZWE5ZDI5MThjYTE5MGYiLCJvcmdhbml6YXRpb25JZCI6ImFiNzE5NzNkLWQ5NjAtZDBkYi1kYmU3LWUwYjdkNTIxZDgwMCIsImVwaGVtZXJhbCI6ZmFsc2UsImlhdCI6MTUyMDk3NjkyMzg1OCwiaXNzIjoiaHR0cDovL3d3dy52b2ljZWJhc2UuY29tIn0.z5jaEknKdDH_pnF0Pp8Ne2q5TR6VqMdhCa2rUO7Adzw"
  }
};

var transcriptCallbackUrl = "https://7dd04fcf.ngrok.io/callback"
var vttCallbackUrl = "https://7dd04fcf.ngrok.io/callback/vtt"

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
req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"configuration\"\r\n\r\n{\n  \"speechModel\": { \"language\": \"en-US\" },\n\n  \"publish\": {\n    \"callbacks\": [\n      {\n        \"url\" : " + transcriptCallbackUrl + "\n      },\n      {\n        \"url\" : \"./recordings/812656069021.mp3\" ,\n        \"method\" : \"POST\",\n        \"include\" : [ \"transcript\"]\n      }\n\n\ncurl --request POST \\\n  --url https://apis.voicebase.com/v3/media \\\n  --header 'accept: application/json' \\\n  --header 'authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiJmMjE2YzRjNy02Mjg2LTRjZDUtYmMzZi03ZDJlMzY5MDU0MmYiLCJ1c2VySWQiOiJhdXRoMHw1YWEyZDY1YTI4ZWE5ZDI5MThjYTE5MGYiLCJvcmdhbml6YXRpb25JZCI6ImFiNzE5NzNkLWQ5NjAtZDBkYi1kYmU3LWUwYjdkNTIxZDgwMCIsImVwaGVtZXJhbCI6ZmFsc2UsImlhdCI6MTUyMDk3NjkyMzg1OCwiaXNzIjoiaHR0cDovL3d3dy52b2ljZWJhc2UuY29tIn0.z5jaEknKdDH_pnF0Pp8Ne2q5TR6VqMdhCa2rUO7Adzw' \\\n  --header 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
/*
req.write("------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name=\"configuration\"\r\n\r\n{\n  \"speechModel\": { \"language\": \"en-US\" },\n\n  \"publish\": {\n    \"callbacks\": [\n      {\n        \"url\" : " + transcriptCallbackUrl + "\n      },\n      {\n        \"url\" : " + transcriptCallbackUrl + " ,\n        \"method\" : \"POST\",\n        \"include\" : [ \"transcript\", \"knowledge\", \"metadata\", \"prediction\", \"streams\", \"spotting\" ]\n      },\n {\n        \"url\" : " + vttCallbackUrl + ",\n        \"method\" : \"PUT\",\n        \"type\" : \"transcript\",\n        \"format\" : \"webvtt\"\n      },\n      {\n        \"url\" : \"https://example.org/callback/srt\",\n        \"method\" : \"PUT\",\n        \"type\" : \"transcript\",\n        \"format\" : \"srt\"\n      },\n      {\n        \"url\" : \"https://example.org/callback/media\",\n        \"method\" : \"PUT\",\n        \"type\" : \"media\",\n        \"stream\": \"original\"\n      }\n    ]\n  }\n}\n\n\ncurl --request POST \\\n  --url https://apis.voicebase.com/v3/media \\\n  --header 'accept: application/json' \\\n  --header 'authorization: Bearer YOUR-BEARER-TOKEN' \\\n  --header 'content-type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'\n\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--");
*/
req.end();
