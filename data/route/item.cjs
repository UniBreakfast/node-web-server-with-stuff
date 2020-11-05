module.exports = {
  get(data, user, method, url) {
    return [
      {
        [user+'_echo']: data, method, url,
        ...Array.isArray(data) ? {__raw: data.__raw} : {},
      },
      {id: 04, type: 'food'},
      {id: 55, type: 'misc'},
    ]
  },
  post: {
    access: 'guest',
    handler(data, user, method, url) {
      return [
        {
          [user+'_echo']: data, method, url,
          ...Array.isArray(data) ? {__raw: data.__raw} : {},
        },
      ]
    },
  }
}
