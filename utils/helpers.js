const crypto = require('crypto')

/**
 * generates an md5 hash
 *
 * @returns string
 */
exports.generateRandomValue = () => {
  const randVal = Math.random() + Math.random() + Math.random() + Math.random() + Math.random()
  let hash = crypto.createHash('md5').update(String(randVal)).digest("hex")

  return hash
}


exports.decryptBuffertoString = async (string) => {
    try {
        if (string) {
            return Buffer.from(string).toString()
        }
        return ""
    } catch (error) {
        console.log("🚀 0.decryptBuffertoString - error:", error)
        console.log("🚀 0.1.decryptBuffertoString - error:", error.stack)
        return null
    }
}

exports.decryptBase64 = async (string) => {
    try {
        return Buffer.from(string, 'base64').toString()
    } catch (error) {
        console.log("🚀 0.decryptBase64 - error:", error)
        console.log("🚀 0.1.decryptBase64 - error:", error.stack)
        return null
    }
}

exports.encryptBase64 = async (string) => {
    try {
        return Buffer.from(string).toString('base64')
    } catch (error) {
        console.log("🚀 0.encryptBase64 - error:", error)
        console.log("🚀 0.1.encryptBase64 - error:", error.stack)
        return null
    }
}

exports.buildResponse = async(statusCode, body, content_type="charset=utf-8") => {
    return {
        statusCode: statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "Content-Type": content_type
        },
        body: JSON.stringify(body, null, 2)
    }
}

//return YYYYMMDD type for x days ago
//return YYYY-MM-DD if y = 1 for x days ago
exports.getYYYYMMDD = async (x, y=null) => {
    let date = new Date()
    date.setDate(date.getDate() - x)

    if (y == 1) {
        return date.toISOString().split('T')[0]
    }
    return date.toISOString().split('T')[0].split("-").join("")
}

//return which weekday for x days ago
exports.getDaysName = async (x) => {

    let d = new Date()

    let weekday=new Array(7)
    weekday[0]="Sun"
    weekday[1]="Mon"
    weekday[2]="Tue"
    weekday[3]="Wed"
    weekday[4]="Thu"
    weekday[5]="Fri"
    weekday[6]="Sat"
    d.setDate(d.getDate() - x)
    let n = d.getDay()
    return weekday[n]
}

/**
 * Changes the date format from '2019-04-23T12:20:40.000Z' to '2019-04-23 12:20:40'.
 *
 * @param {mysql DATETIME} date A date in the format '2019-04-23T12:20:40.000Z'.
 * @return {mysql DATETIME} A date in the format '2019-04-23 12:20:40'.
 */
exports.changeTimeFormat = async (date) => {
  try {
    //console.log('🚀 START changeTimeFormat')
      if (date == 'Invalid Date') {
          return '0000-00-00 00:00:00'
      }
    let dt = date.toISOString().slice(0, -5)
    return dt.split('T').join(' ')
  } catch (error) {
    console.log('🚀 changeTimeFormat - error stack: ', error.stack)
    return error.stack
  }
}


//change 2021-06-30 to 20210630
exports.changeTypeToYYMMRR = async (date) => {
    try {
        console.log('🚀 changeTypeToYYMMRR')
        let yymmdd_array = date.split("-")
        return yymmdd_array[0] + yymmdd_array[1] + yymmdd_array[2]
    } catch (error) {
        console.log('🚀 changeTimeFormat - error stack: ', error.stack)
        return error.stack
    }
}

//Add how many mins in x.
exports.addMinsinTime = async (x, min) => {
    const { changeTimeFormat } = require('./helpers')

    let z = new Date(x)
    const a = z.setMinutes(z.getMinutes() + min)
    const b  = new Date(a)

    return await changeTimeFormat(b)


    //const y = Date(x.getTime() + minutes*60000)
    //console.log("y ==== ", y)
}


//get cycle event name from cycle event id in printouts.
exports.getCycleEventName = async (cycle_end_event_id) => {
    let EventName = cycle_end_event_id && cycle_end_event_id != null ? cycle_end_event_id : ""

    if (EventName != "") {
        //IDS_ is in Statim and MSG_ is in Hydrim, MSG_CF_4 is in Hydrim
        const cycle_name = EventName.replace("IDS_", "").replace("MSG_", "")
        if (cycle_name.toUpperCase().includes("CF")) {
            return "CYCLE_FAULT"
        } else if (cycle_name.toUpperCase().includes("CYCLE_ABORTED")) {
            return "CYCLE_ABORTED"
        }
        return cycle_name
    }
    return ""
}

/**
 * Decrypts the provided key into a JSON
 *
 * @param {mysql DATETIME} key .
 * @return {JSON} .
*/
exports.decryptKey = async (key) => {
  try {
    console.log('🚀 START helper.decryptKey')
    const axios = require('axios')

    const qs = require('querystring')
    const url = 'https://dev4.scican.com/crypto/decrypt'

    const requestBody = {
      decrypt: key
    }
    console.log('🚀 requestBody', requestBody)

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }

    const axiosconnect = await axios.create()

    const res = await axiosconnect.post(url, qs.stringify(requestBody), config)
    return res.data
  } catch (error) {
    console.log('🚀 helper.decryptKey - error stack: ', error.stack)
    return error.stack
  }
}

/**
 * Returns a JSON information based on the IP
 *
 * @param {ip} key .
 * @return {JSON} .
*/
exports.getGeoData = async (ip) => {
  try {
    console.log('🚀 START helpers.getGeoData')
    const axios = require('axios')
    const url = 'https://dev4.scican.com/geo' + '/' + ip
    const axiosconnect = await axios.create()
    const RESULT = await axiosconnect.get(url)
    console.log('🚀 RESULT: ', RESULT)
    return RESULT.data
  } catch (error) {
    return error.stack
  }
}

/**
 * Returns a JSON information based on the IP
 *
 * @param {JSON} softwareVersionJSON .
 * @return {JSON} .
*/
exports.getSoftwareVersions = async (softwareVersionJSON) => {
  try {
    const { getLabel } = require('./helpers')
    let RESULT = require('../models/softwareVersion.json')
    console.log('🚀 START getSoftwareVersions')

    let tem = JSON.parse(softwareVersionJSON)

    for (const k in tem) {
      for (const p in tem[k]) {
        for (const q in tem[k][p]) {
          let type = Object.keys(tem[k][p][q])[0]
          let value = Object.values(tem[k][p][q])[0]

          if (p === 'interfaceupdates') {
            const vel = type.toLowerCase().charAt(0)
            switch (vel) {
              case 't':
                RESULT.interface_t = await getLabel(type + '-' + value, 'INTERFACE')
                break
              case 'm':
                RESULT.interface_m = await getLabel(type + '-' + value, 'INTERFACE')
                break
              case 'w':
                RESULT.interface_w = await getLabel(type + '-' + value, 'INTERFACE')
                break
              case 's':
                RESULT.interface_s = await getLabel(type + '-' + value, 'INTERFACE')
                break
              case 'd':
                RESULT.interface_d = await getLabel(type + '-' + value, 'INTERFACE')
                break
            }
          } else if (p === 'instructionsupdates') {
            RESULT.instruction = await getLabel(type + '-' + value, 'ISTRUCTION')
          } else if (p === 'screensaverupdates') {
            RESULT.screen_saver = await getLabel(type + '-' + value, 'SCREENSAVER')
          }
        }
      }
    }
    return RESULT
  } catch (error) {
    console.log('🚀 getSoftwareVersions - error stack: ', error.stack)
    return error.stack
  }
}

/**
 * Returns a JSON information based on the IP
 *
 * @param {JSON} scicanDbTableName .
 * @param {JSON} swtype .
 * @param {JSON} svDate .
 * @return {JSON} .
*/
exports.getSoftwarelableFromDBTable = async (scicanDbTableName, swtype, svDate) => {
  try {
    const { execute } = require('../tools/mysql.conn')

    let softwareLabel = ''

    const swtype_attribute = "'%" + swtype + "%'"
    const svDate_attribute = "'%" + svDate + "%'"

    const sql = 'SELECT software_label FROM ' + scicanDbTableName + ' WHERE swtype LIKE ' + swtype_attribute + ' AND version LIKE ' + svDate_attribute

    const sqlResult = await execute(sql)

    const data = sqlResult && sqlResult != null ? sqlResult : []

    if (data.length > 0) {
      softwareLabel = data[0].software_label + '-' + svDate
    } else {
      softwareLabel = swtype + '-' + svDate
    }

    return softwareLabel
  } catch (error) {
    console.log('🚀 getSoftwarelableFromDBTable - error stack: ', error.stack)
    return error.stack
  }
}

exports.getLabel = async (software_version, flag) => {
    const { getSoftwarelableFromDBTable } = require('./helpers')
    try {
        let finalString = ""
        const stringDateSub = software_version.split("-")
        if (stringDateSub.length == 2) {
            const swtype = stringDateSub[0]
            const sVersionDate = stringDateSub[1]
            const firstLetter = swtype.charAt(0)

            //instructions updates if first-letter is : "I"
            if (flag==='ISTRUCTION' && firstLetter==='I')
            {
                finalString = await getSoftwarelableFromDBTable('instructionsupdates', swtype, sVersionDate);
            }
            //screensavers updates if first-letter is : "A"
            else if (flag==='SCREENSAVER' && firstLetter==='A')
            {
                finalString = await getSoftwarelableFromDBTable('screensaverupdates', swtype, sVersionDate);
            }
            //interface updates if first-letter is : "S,T,M,W,D"
            else if (flag==='INTERFACE' && (firstLetter==='S' || firstLetter==='T' || firstLetter==='M' || firstLetter==='W' || firstLetter==='D'))
            {
                finalString = await getSoftwarelableFromDBTable('interfaceupdates', swtype, sVersionDate)
            }
        }
        return finalString
    } catch (error) {
        console.log('🚀 getLabel - error stack: ', error.stack)
        return error.stack
    }
}

//return a JSON object which comes from S3.
exports.getJSONPrintoutFileFromS3 = async (bucket, Key) => {
    const AWS = require('aws-sdk')
    const S3 = new AWS.S3()
    let res = ""
    try {
        const params = {
            Bucket: bucket,
            Key: Key
        }

        const data = await S3.getObject(params).promise()
        // const res = data.Body.toString('utf-8')
        if (data) {
            res = JSON.parse(data.Body.toString('utf-8'))
            // console.log(res.toString('utf-8'))
        }
        return res
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }

}

//return a txt or cpt file which comes from S3.
exports.getTXTCPTPrintoutFileFromS3 = async (bucket, Key) => {
    const AWS = require('aws-sdk')
    const S3 = new AWS.S3()
    let res = ""
    try {
        const params = {
            Bucket: bucket,
            Key: Key
        }

        const data = await S3.getObject(params).promise()
        // const res = data.Body.toString('utf-8')
        if (data) {
            res = data.Body.toString('utf-8')
            // console.log(res.toString('utf-8'))
        }
        return res
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }

}

//return a json contains normal payload encryption
exports.EncryptString = async (string) => {
    const axios = require('axios')
    const url = process.env.containerUrl + "/key-validation"


    try {
        let response
        const json = {"payload":string}

        const axiosconnect = await axios.create()
        const result = await axiosconnect.post(url, json)
        console.log("result ==== ", result)
        response = result.data

        return response

    } catch (error) {
        console.log('🚀 EncryptString - error stack: ', error.stack)
        return error.stack    }

}

//return a json contains MAC ADDRESS(password) encryption
exports.getSuperPassword = async (string) => {
    const axios = require('axios')

    console.log("envionment === ", process.env.containerUrl)
    const url = process.env.containerUrl + "/super-password"

    try {
        let response
        const json = {"payload":string}

        const axiosconnect = await axios.create()
        const result = await axiosconnect.post(url, json)
        console.log("result ==== ", result)
        response = result.data

        if (response.Encryption_Key) {
            response = response.Encryption_Key
            if (response == "No encryption key") {
                response = null
            }
        } else {
            response = null
        }

        return response

    } catch (error) {
        console.log('🚀 getSuperPassword - error stack: ', error.stack)
        return error.stack    }

}

//return year_month_day(yymmdd) or Serial Number from printout_file_name
exports.getYYMMDDandSNFromPrintoutFileName = async (param, printout_file_name) => {

    let res = ""
    if (!printout_file_name || printout_file_name == null) {
        return res
    }

    try {
        const YYMMDD_SN = printout_file_name.split("_")
        if (param == "yymmdd") {
            res = YYMMDD_SN[0].substr(1)
        } else if (param == "sn") {
            res = YYMMDD_SN[2]
        }
        return res
    } catch (error) {
        console.log("🚀 getYYMMDDandSNFromPrintoutFileName - error: ", error)
        console.log('🚀 getYYMMDDandSNFromPrintoutFileName - error stack: ', error.stack)
        return ""
    }

}

/**
  Returns a NOW() MYSQL formatted string (MySQL DATETIME) created from a new Date()
  (Tue Sep 14 2021 13:12:21 GMT-0400 (Eastern Daylight Time) -> 2021-09-14 17:13:41).

  source:
  https://stackoverflow.com/questions/168736/how-do-you-set-a-default-value-for-a-mysql-datetime-column
  https://www.freecodecamp.org/news/javascript-date-now-how-to-get-the-current-date-in-javascript/
  https://stackoverflow.com/questions/47903115/mysql-timestamp-now-is-not-working-with-nodejs
*/
exports.convertNowJStoNowMySql = async () => {
  try {
    return new Date().toISOString().slice(0, 19).replace('T', ' ')
  } catch (error) {
    console.log('🚀 convertNowJStoNowMySql - error:', error.stack)
    return error.stack
  }
}

/**
  Returns a JSON { offset: ... , limit: ... } to be used in a pagination MYSQL query

  source:
*/
exports.getPaginationLimits = async (page, limit) => {
  try {
    return { offset: (page - 1) * limit, limit: limit }
  } catch (error) {
    console.log('🚀 getPaginationLimits - error:', error.stack)
    return error.stack
  }
}
/**

returns:
  INFO Object

  INFO = {
    resource: event.resource,
    ip: event.requestContext.identity.sourceIp,
    pathParameters: event.pathParameters,
    queryStringParameters: event.queryStringParameters,
    body: event.body,
    jsonParsedBody: JSON.parse(event.body),
    httpMethod: event.httpMethod
  }
  AND print a console.log in AWS lambdas
  console.log(`🚀 START ${processName}`)
  console.log('🚀 resource: ', INFO.resource)
  console.log('🚀 ip: ', INFO.ip)
  console.log('🚀 pathParameters: ', INFO.pathParameters)
  console.log('🚀 queryStringParameters: ', INFO.queryStringParameters)
  console.log('🚀 body: ', INFO.body)
  console.log('🚀 jsonParsedBody: ', INFO.jsonParsedBody)
  console.log('🚀 httpMethod: ', INFO.httpMethod)
  console.log('🚀 INFO: ', INFO)

*/
exports.getEnvVarSessionsVariables = async (processName, event) => {
  try {
    const INFO = {
      resource: event.resource,
      ip: event.requestContext.identity.sourceIp,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters,
      body: event.body,
      jsonParsedBody: JSON.parse(event.body),
      httpMethod: event.httpMethod
    }

    console.log(`🚀 START ${processName}`)
    console.log('🚀 resource: ', INFO.resource)
    console.log('🚀 ip: ', INFO.ip)
    console.log('🚀 pathParameters: ', INFO.pathParameters)
    console.log('🚀 queryStringParameters: ', INFO.queryStringParameters)
    console.log('🚀 body: ', INFO.body)
    console.log('🚀 jsonParsedBody: ', INFO.jsonParsedBody)
    console.log('🚀 httpMethod: ', INFO.httpMethod)
    console.log('🚀 INFO: ', INFO)

    return INFO
  } catch (error) {
    console.log('🚀 getEnvVarSessionsVariables - error:', error.stack)
    return error.stack
  }
}


/**
 * 
 * @param {string} username Ex: testAbc@somethin.com
 * @param {string} password EX: jgdd6#5467!
 * @param {string} random_string Ex: 1519211809934 - Use Date.now() -> The static Date.now() method returns the number of milliseconds elapsed since January 1, 1970 00:00:00 UTC.
 * 
 * @returns mixed string|boolean 
 */
exports.getPasswordHash = function (username, password, random_string) {
  if( !username || typeof username !== 'string' || !password  || typeof password !== 'string' || !random_string  || typeof username !== 'string') {
    return false
  }

  const update_string = String(random_string).toLowerCase() + username.toLowerCase()

  let salt = crypto.createHash('sha256').update(update_string).digest("hex")
  let hash = salt + password

  for( let i = 0; i < 95223; i++ ) {
    hash = crypto.createHash('sha256').update(hash).digest("hex")
  }

  hash = salt + hash

  return hash
}