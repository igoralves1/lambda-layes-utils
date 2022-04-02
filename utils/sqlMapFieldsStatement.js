'use strict'
const { getTableMap } = require('../utils/DataBaseMaps')
let sqlStatement = ''

exports.getSqlMapFieldsStatement = async (table_name) => {
  try {
    console.log(`🚀 START getSqlMapFieldsStatement(${table_name})`)
    const table_map = await getTableMap(table_name)
    // Todo create the Sql statement for the GET verb. For now it is only returning the whole JSONMap
    sqlStatement = table_map
    return sqlStatement
  } catch (error) {
    console.log(`🚀 0 - getSqlMapFieldsStatement(${table_name}) - error.stack:`, error.stack)
    return (error.stack)
  }
}

exports.postSqlMapFieldsStatement = async (table_name, post_fields) => {
  try {
    console.log('🚀 START postSqlMapFieldsStatement')
    const table_map = await getTableMap(table_name)
    console.log('🚀 table_map: ', table_map)

    sqlStatement = { fields: '', values: '', fieldsStrSql: '', valuesArray: '', PUTStrFields: '' }
    let fieldsStr = '('
    let fieldsStrSql = '('
    const valuesArray = []

    let PUTStrFields = ''

    for (const key in post_fields) {
      console.log('🚀 key:value ', key + ':' + table_map[key])
      fieldsStr += '`' + table_map[key] + '`' + ','
      fieldsStrSql += '?,'
      valuesArray.push(post_fields[key])
      PUTStrFields += '`' + table_map[key] + '` = ?' + ','
    }

    sqlStatement.fields = fieldsStr.replace(/.$/, ')')
    sqlStatement.fieldsStrSql = fieldsStrSql.replace(/.$/, ')')
    sqlStatement.valuesArray = valuesArray
    sqlStatement.PUTStrFields = PUTStrFields.replace(/.$/, '')

    return sqlStatement
  } catch (error) {
    console.log(`🚀 postSqlMapFieldsStatement(${table_name}) - error.stack:`, error.stack)
    return (error.stack)
  }
}
