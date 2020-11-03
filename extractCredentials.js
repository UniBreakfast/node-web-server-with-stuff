export default function presentCredentials(req={}, reqBody={}, data={}) {
  const credentials = {}
  const keys = ['login', 'token']

  assignMissing(credentials, reqBody.credentials)
  assignMissing(credentials, reqBody, keys)
  assignMissing(credentials, req.headers, keys)
  assignMissing(credentials, data.credentials)
  assignMissing(credentials, data, keys)

  return credentials
}

function assignMissing(target, source, keys) {
  if (!source || typeof source != 'object') return

  (keys || Object.keys(source)).forEach(key => {
    if (!target[key] && source[key])  target[key] = source[key]
  })
}