const {decode} = require('querystring')


module.exports = extractData


function extractData(reqBody, querystring) {
  if (typeof reqBody == 'string' && reqBody.length || Array.isArray(reqBody))
    return reqBody
  if (typeof reqBody.data == 'string' && reqBody.data.length ||
    Array.isArray(reqBody.data))  return reqBody.data

  const data = {}

  Object.assign(data, decode(querystring))

  if (reqBody.data)  Object.assign(data, reqBody.data)
  else if (reqBody) {
    for (const key in reqBody) {
      if (!['credentials', 'login', 'token'].includes(key))
        data[key] = reqBody[key]
    }
  }

  return data
}
