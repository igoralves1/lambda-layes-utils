'use strict'

exports.getTableMap = async (table_name) => {
  try {
    console.log(`🚀 1 - getTableMap(${table_name})`)
    const table_map = require(`../utils/sourceDataBaseMap/${table_name}.json`)
    return table_map
  } catch (error) {
    console.log(`🚀 0 - getTableMap(${table_name}) - error.stack:`, error.stack)
    return (error.stack)
  }
}

exports.getTableMapGitHub = async (table_name) => {
  try {
    console.log(`🚀 1 - getTableMapGitHub(${table_name})`)
    const axios = require('axios')
    let table_map
    await axios.get('https://raw.githubusercontent.com/igoralves1/testread/main/tab_test.json')
    .then(response => {
        table_map = response.data
    })
    .catch(error => {
        console.log(error)
    })
    return table_map
  } catch (error) {
    console.log(`🚀 0 - getTableMapGitHub(${table_name}) - error.stack:`, error.stack)
    return (error.stack)
  }
}
