var request = require("request");
let access_token = null;

function init(msftAuthUrl, msftClientId, msftScope, msoftOauthClientSecret) {
  var options = {
    method: "POST",
    url: msftAuthUrl,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    form: {
      client_id: msftClientId,
      scope: msftScope,
      client_secret: msoftOauthClientSecret,
      grant_type: "client_credentials"
    }
  };
  return new Promise((resolve, reject) => {
    request(options, function (error, response) {
      if (error) throw new Error(error);
      let body = JSON.parse(response.body);
      access_token = body.access_token
      return resolve(response);
    });
  });
}

function insertRecord(record, url, apiMSubscriptionKey) {
  var options = {
    method: 'POST',
    url,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': apiMSubscriptionKey,
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
