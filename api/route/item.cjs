getItems.secure = true

module.exports = getItems

function getItems(body) {
  return [body, {id: 04, type: 'food'}, {id: 55, type: 'misc'}]
}
