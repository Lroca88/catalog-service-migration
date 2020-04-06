var request = require("request");
let access_token = null;

function init() {
  var options = {
    method: "POST",
    url:
      "https://login.microsoftonline.com/15ccb6d1-d335-4996-b6f9-7b6925f08121/oauth2/v2.0/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    form: {
      client_id: "955908a2-2696-419a-ae5f-ec5b5d57b311",
      scope: "api://bf8a5b3f-6027-41a2-b948-90b921fd9f41/.default",
      client_secret: "altEd/ditB8eQr.CvYl=O382kt@tNQp9",
      grant_type: "client_credentials"
    }
  };
  return new Promise((resolve, reject) => {
    request(options, function(error, response) {
      if (error) throw new Error(error);
      let body = JSON.parse(response.body);
      access_token = body.access_token
      return resolve(response);
    });
  });
}

function insertRecord(record, url) {
  var options = {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': 'eda238bb1940421db39464156639446f',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify(record)
  };
  return new Promise((resolve, reject) => {
    request(options, function (error, response) { 
      if (error) throw new Error(error);
      return resolve(response);
    });
  })
} 

module.exports = {
  init,
  insertRecord
}
