'use strict'

const { getPasswordHash, getEnvVarSessionsVariables, encryptBase64 } = require('./helpers')

console.log('🚀 START fnGetHelpers') 

const fnGetPasswordHash = async (event) => {
  try {
    const INFO = await getEnvVarSessionsVariables('fnGetPasswordHash',event)
    
    console.log('🚀 queryStringParameters.password:', INFO.queryStringParameters.password)
    console.log('🚀 queryStringParameters.username:', INFO.queryStringParameters.username)
    console.log('🚀 Date.now():', Date.now())

    let result = getPasswordHash(INFO.queryStringParameters.username, INFO.queryStringParameters.password, Date.now())
    console.log('🚀 result:', result)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result)
    }

  } catch (error) {
    console.log('🚀 fnGetWarranties - error.stack:', error.stack)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(error.stack)
    }
  }
}

const fnEncryptBase64 = async (event) => {
  try {
    const INFO = await getEnvVarSessionsVariables('fnEncryptBase64',event)

    console.log('🚀 queryStringParameters.username:', INFO.queryStringParameters.username)

    let result = await encryptBase64(INFO.queryStringParameters.username)
    console.log('🚀 result:', result)

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(result)
    }

  } catch (error) {
    console.log('🚀 fnGetWarranties - error.stack:', error.stack)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify(error.stack)
    }
  }
}

module.exports = {
  fnGetPasswordHash,
  fnEncryptBase64
}