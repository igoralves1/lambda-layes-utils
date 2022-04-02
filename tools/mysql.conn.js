const db = require('mysql2/promise')

/**
 * Doc: https://github.com/mysqljs/mysql#escaping-query-identifiers
 * TODO create a console.log of full sql (with arguments)
 * @param  {} sql
 * @param  {} args
 *
 * Note: https://stackoverflow.com/questions/41169797/node-js-mysql-printing-actual-query-in-error-log-in-node-js
 */
// module.exports.execute = async function (sql, args) {
//   try {
//     console.log('🚀 START mysqlExecute')
//     console.log('🚀 sql: ', sql)
//     console.log('🚀 args: ', args)
//     const connection = await db.createConnection({
//       host: process.env.rdsMySqlHost,
//       user: process.env.rdsMySqlUsername,
//       password: process.env.rdsMySqlPassword,
//       database: process.env.rdsMySqlDb
//     })
//     const [rows, fields] = await connection.execute(sql, args)
//     connection.end()
//     console.log('🚀 rows: ', rows)
//     return rows
//   } catch (error) {
//     console.log('🚀 mysqlExecute - error.stack:', error.stack)
//   }
// }
module.exports.execute = async function (sql, args) {
  console.log('🚀 START mysqlExecute')
  console.log('🚀 sql: ', sql)
  console.log('🚀 args: ', args)
  const connection = await db.createConnection({
    host: process.env.rdsMySqlHost,
    user: process.env.rdsMySqlUsername,
    password: process.env.rdsMySqlPassword,
    database: process.env.rdsMySqlDb
  })
  const [rows, fields] = await connection.execute(sql, args)
  connection.end()
  console.log('🚀 rows: ', rows)
  return rows
}
