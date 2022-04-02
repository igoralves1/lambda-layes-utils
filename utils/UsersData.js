const { generateRandomValue } = require('./helpers')
let docuInf = require('../models/document_info.json')
console.log('🚀 docuInf:', docuInf)
const { getProductName } = require('./ProductsData')
const QUERIES = require('../sql/queries.json')

/**
 * Returns an object with payload data ready for publishing
 *
 * @param {string} user_email
 * @returns {Object}
 */
exports.getUserDetails = async (user_email) => {
    let details = {}

    if(!user_email || user_email == null) {
        return details
    }

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = `SELECT * FROM users WHERE username = ?`

        const sqlResult = await execute(sql, [user_email]) //await conn.query(sql, [user_email])
        const res = sqlResult[0]

        if(res) {
            details.user_id = res.idusers || ''
            details.firstname = res.firstname || ''
            details.lastname = res.lastname || ''
            details.email = res.username || ''
            details.telephone = res.telephone || ''
            details.company = res.company || ''
            details.address1 = res.office_address_one || ''
            details.address2 = res.office_address_two || ''
            details.city = res.city || ''
            details.country = res.country || ''
            details.region = res.state_province_region || ''
            details.zip_code = res.zip_postal_code || ''
        }

        return details

    } catch (error) {
        console.log("🚀 getUserDetails - error: ", error)
        console.log("🚀 getUserDetails - error stack: ", error.stack)
        return null
    }
}

exports.isUserExist = async (user_email) => {
    const { execute } = require('../tools/mysql.conn')
    try {

        const sql = `SELECT count(1) AS numbers FROM users WHERE username = ?`

        const sqlResult = await execute(sql, [user_email]) //conn.query(sql, [user_email])
        const res = sqlResult[0]

        console.log("sqlRes ==== ", sqlResult)
        var userexist
        if (res && res.numbers == 0) {
            userexist = false
        } else {
            userexist = true
        }

        return userexist

    } catch (error) {
        console.log("🚀 0.isUserExist - error:", error)
        console.log("🚀 0.1.isUserExist - error:", error.stack)
        return null
    }
}

/**
 * Checks if unit has online access
 *
 * @param {string} email
 * @param {string} serial_number
 * @returns {boolean}
 */
exports.updateActivationKey = async (email, activatin_key) => {
    const { execute } = require('../tools/mysql.conn')
    let isUpdated = false

    try {
        const sql = `UPDATE users SET activationkey = ? WHERE username = ?`

        const sqlResult = await execute(sql, [activatin_key, email]) //conn.query(sql, [activatin_key, email])
        const res = sqlResult[0]

        isUpdated = sqlResult ? sqlResult.changedRows : false

        return isUpdated

    } catch (error) {
        console.log("🚀 0.updateActivationKey - error: ", error)
        console.log("🚀 0.1updateActivationKey - error stack: ", error.stack)
        return null
    }
}

exports.updateLastLogin = async (params) => {
    let isUpdated = false
    const {user_id, hash_time, email} = params

    if(!user_id || user_id == null || !hash_time || hash_time == null || !email || email == null) {
        return false
    }

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = `INSERT INTO lastlogin (idusers,uip,attempts,time,successfullogin,date,loggedinto,temail)
        VALUES (?,'','0',?,'yes',NOW(),'Registered', ?)`

        const sqlResult = await execute(sql, [user_id, hash_time, email])
        const res = sqlResult[0]

        isUpdated = sqlResult ? Boolean(sqlResult.affectedRows) : false

        return isUpdated

    } catch (error) {
        console.log("🚀 0.updateActivationKey - error: ", error)
        console.log("🚀 0.1updateActivationKey - error stack: ", error.stack)
        return null
    }
}

exports.InsertUser = async (data) => {
    const activation_key = generateRandomValue()
    const {
        account_email,
        password,
        account_company_name,
        account_contact_name,
        account_phone_number,
        account_address,
        account_city,
        account_subregion,
        account_country,
        account_zip_code,
        language,
        language_iso3166 } = data

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = `INSERT INTO users(password, username, company, firstname, telephone, office_address_one, city, state_province_region, country, zip_postal_code, lang,groups, email, activationkey, activationstatus, activationdate) VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,'customer', ?, ?,'activated',CURRENT_TIMESTAMP())`
        const insertVals = [password,account_email,account_company_name,account_contact_name,account_phone_number,account_address,account_city,account_subregion,account_country,account_zip_code,language,account_email,activation_key]
        const sqlResult6 = await execute(sql, insertVals)

        const result = sqlResult6 ? sqlResult6[0] : {}

        return sqlResult6 ? sqlResult6.insertId : '' // result.affectedRows
    } catch (error) {
        console.log("🚀 0.InsertUser - error:", error)
        console.log("🚀 0.1.InsertUser - error:", error.stack)
        return null
    }
}



exports.getCustomerUnitsData = async (email) => {
    const { execute } = require('../tools/mysql.conn')
    let units = {}

    if(!email || email == null) {
        return units
    }

    try {
        const sql = `SELECT customers_units.serial_num, product_nickname, association_active, customers_units.idunits_warranties, created_at FROM customers_units LEFT JOIN units_warranties ON customers_units.idunits_warranties = units_warranties.idunits_warranties WHERE customers_units.user_email = ?`

        const sqlResult = await execute(sql, [email])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {
                const unit_information = {}
                const serial_num = data[k].serial_num
                const product_nickname = data[k].product_nickname && data[k].product_nickname != null ? data[k].product_nickname : ""
                const association_active = data[k].association_active ? true : false
                const idunits_warranties = data[k].idunits_warranties
                const warranty_registration_date = data[k].created_at && data[k].created_at != null && data[k].created_at != "Invalid Date" ? data[k].created_at : null


                const model_name = await getProductName(serial_num)

                const update_available = model_name.includes("BRAVO")


                units[serial_num] = {model: model_name, serial_number: serial_num, unit_nickname: product_nickname, warranty_registration_date: warranty_registration_date,
                    association_active: association_active, warranty_id: idunits_warranties, update_available: update_available}

            }
        }

        return units
    } catch (error) {
        console.log("🚀 getCustomerUnitsData - error: ", error)
        console.log("🚀 getCustomerUnitsData - error stack: ", error.stack)
        return {}
    }
}




exports.getCustomerSNData = async (email, serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    let units = {}

    if(!email || email == null) {
        return units
    }

    try {
        const sql = `SELECT customers_units.serial_num, product_nickname, association_active, customers_units.idunits_warranties, created_at FROM customers_units LEFT JOIN units_warranties ON customers_units.idunits_warranties = units_warranties.idunits_warranties WHERE customers_units.user_email = ? AND customers_units.serial_num = ?`

        const sqlResult = await execute(sql, [email, serial_num])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {

                console.log("data[k] ===== ", data[k])
                const serial_num = data[k].serial_num
                const product_nickname = data[k].product_nickname && data[k].product_nickname != null ? data[k].product_nickname : ""
                const association_active = data[k].association_active ? true : false
                const idunits_warranties = data[k].idunits_warranties
                const warranty_registration_date = data[k].created_at && data[k].created_at != null && data[k].created_at != "Invalid Date" ? data[k].created_at : null


                const model_name = await getProductName(serial_num)

                const update_available = model_name.includes("BRAVO")

                units[serial_num] = {model: model_name, serial_number: serial_num, unit_nickname: product_nickname, warranty_registration_date: warranty_registration_date,
                    association_active: association_active, warranty_id: idunits_warranties, update_available: update_available}

            }
        }

        return units
    } catch (error) {
        console.log("🚀 getCustomerSNData - error: ", error)
        console.log("🚀 getCustomerSNData - error stack: ", error.stack)
        return {}
    }
}


// return user Lastname, Firstname in users table.
exports.getUserName = async (email) => {
    const { execute } = require('../tools/mysql.conn')
    let userName = {"first_name": null, "last_name": null, "avatar_url": null}

    if(!email || email == null) {
        return userName
    } else {
        const sql = `SELECT firstname, lastname, avatar_url FROM users WHERE username = ?`
        const sqlResult = await execute(sql, [email])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []
        if (data.length > 0) {
                //userName = data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1) + ", " + data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1)
                userName.last_name =  data[0].lastname &&  data[0].lastname != null ? data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1) : null
                userName.first_name = data[0].firstname && data[0].firstname != null ? data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1) : null
                userName.avatar_url = data[0].avatar_url && data[0].avatar_url != null ? data[0].avatar_url : null
        }
        return userName
    }
}


//result is coming from isUpdateAvailable.
exports.getPrivacyChecked = async (serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    let PrivacyCheck = false

    if(!serial_num || serial_num == null) {
        return PrivacyCheck
    } else {
        const sql = `SELECT promo FROM is_update_available WHERE serial_num = ?`
        const sqlResult = await execute(sql, [serial_num])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []
        if (data.length > 0) {
            PrivacyCheck = data[0].promo== 1 ? true : false
        }
        return PrivacyCheck
    }
}



//return email, telephone from users and association_active from customers_units
exports.getUnitContact = async (serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    let UnitContact = {
        "online_access_active": false,
        "first_name": null,
        "last_name": null,
        "email": null,
        "phone": null
    }

    if(!serial_num || serial_num == null) {
        return UnitContact
    } else {

        //90% in this case
        const sql = `SELECT u.username, u.firstname, u.lastname, u.telephone, c.association_active
                      FROM users as u
                      LEFT JOIN
                      customers_units as c
                      ON u.username = c.user_email WHERE c.serial_num = ? AND c.association_active = 1`
        const sqlResult = await execute(sql, [serial_num])
        const res = sqlResult[0]
        let data = sqlResult && sqlResult != null ? sqlResult : []
        if (data.length > 0) {
            UnitContact.online_access_active = true
            //UnitContact.name = data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1) + ", " + data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1)
            UnitContact.first_name = data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1)
            UnitContact.last_name = data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1)
            UnitContact.email = data[0].username
            UnitContact.phone = data[0].telephone
        } else {
            const checkSQL = `SELECT u.username, u.firstname, u.lastname, u.telephone, c.association_active
                                FROM users as u
                                LEFT JOIN
                                customers_units as c
                                ON u.username = c.user_email WHERE c.serial_num = ? ORDER BY c.idcustomers_units DESC LIMIT 1`
            const checkSQLRes = await execute(checkSQL, [serial_num])
            data = checkSQLRes && checkSQLRes != null ? checkSQLRes : []
            if (data.length > 0) {
                UnitContact.online_access_active = false
                UnitContact.first_name = data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1)
                UnitContact.last_name = data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1)
                //UnitContact.name = data[0].lastname.charAt(0).toUpperCase() + data[0].lastname.slice(1) + ", " + data[0].firstname.charAt(0).toUpperCase() + data[0].firstname.slice(1)
                UnitContact.email = data[0].username
                UnitContact.phone = data[0].telephone
            }
        }

        return UnitContact
    }
}




//generate a note array.
exports.getNoteArray = async (note) => {
    let noteResponse = []
    let note_temp = ""
    let index = 1

    if(!note || note == null) {
        return noteResponse
    } else {

        note_temp = note.replace(/]/g, "")

        note_temp = note_temp.split("[ User: ")

        if (note_temp.length >= 2) {
            for (index=1; index<note_temp.length; index++) {
                const totalNotes = note_temp[index].split(",")
                console.log("totalNotes ==== ", totalNotes)

                const user = totalNotes[0]
                const dateNotes = totalNotes[1].split("Date: ")
                const date = dateNotes[1].substring(0,19);

                let noteInf = dateNotes[1].substring(21)
                noteInf = noteInf.replace(/\n\n/g, "").replace(/\n/g, " ")

                noteResponse.push({"user":user, "date":date, "note":noteInf})
            }
        }
        return noteResponse
    }
}


exports.getBravoTokenDetails = async (token) => {
    let details = {}

    if(!token || token == null) {
        return details
    }

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = `SELECT * FROM online_access_tokens WHERE token = ?`

        const sqlResult = await execute(sql, [token])
        const res = sqlResult[0]

        if(res) {
            details.idonline_access_tokens = res.idonline_access_tokens || ''
            details.account_email = res.account_email || ''
            details.serial_number = res.serial_number || ''
            details.uuid = res.uuid || ''
            details.model = res.model || ''
            details.token = res.token || ''
            details.is_active = res.is_active || ''
            details.is_online_access_active = res.is_online_access_active || ''
            details.created_at = res.created_at || null
            details.updated_at = res.updated_at || null
        }

        return details

    } catch (error) {
        console.log("🚀 getBravoTokenDetails - error: ", error)
        console.log("🚀 getBravoTokenDetails - error stack: ", error.stack)
        return null
    }
}


//Get an array contains serial number from customers_units by email.
exports.getSNFromEmail = async (email = null, association_active = 0, report = 0) => {
    let serial_num = []
    if(!email || email == null) {
        return serial_num
    }
    try {
        const { execute } = require('../tools/mysql.conn')
        let serial_number = []
        let report_condition = ""
        if (report == 1) {
            report_condition = " AND report_available = '1'"
        }

        const sql = `SELECT serial_num FROM customers_units WHERE user_email = ? AND association_active = ? ${report_condition}`
        const sqlResult = await execute(sql, [email, association_active])
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for (const k in data) {
                serial_number.push(data[k].serial_num)
            }
        }

        return serial_number
    } catch (error) {
        console.log("🚀 getSNFromEmail - error: ", error)
        console.log("🚀 getSNFromEmail - error stack: ", error.stack)
        return []
    }
}





//Get children from 'users_group'
exports.getOwnChildren = async (user_email) => {

    try{
        const { execute } = require('../tools/mysql.conn')
        const children = []

        if (!user_email || user_email == null) {
            return children
        }

        const sql = `SELECT email_child FROM users_group WHERE email_parent = ? AND activited_status = '1' `
        const sqlResult = await execute(sql, [user_email])
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data.length > 0) {
            for (const k in data) {
                children.push(data[k].email_child)
            }
        }

        return children
    } catch (error) {
        console.log("🚀 getOwnChildren - error: ", error)
        console.log("🚀 getOwnChildren - error stack: ", error.stack)
        return []
    }
}





//Get Notes from docu_entries_note table.
exports.getDocuEntryNote = async (tablename, printout_file_name) => {

    try{
        const { execute } = require('../tools/mysql.conn')
        const Notes = []

        if (!printout_file_name || printout_file_name == null) {
            return Notes
        }

        const sql = `SELECT notes FROM ${tablename} WHERE printout_file_name = ?`
        const sqlResult = await execute(sql, [printout_file_name])
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data.length > 0) {
            for (const k in data) {
                Notes.push(data[k].notes)
            }
        }

        return Notes
    } catch (error) {
        console.log("🚀 getDocuEntryNote - error: ", error)
        console.log("🚀 getDocuEntryNote - error stack: ", error.stack)
        return []
    }
}





//return year_month_day(yymmdd) or Serial Number from printout_file_name
exports.sortDataDate = async (a, b) => {
    // var objs = [
    //     { first_nom: 'Lazslo', last_nom: 'Jamf'     },
    //     { first_nom: 'Pig',    last_nom: 'Bodine'   },
    //     { first_nom: 'Pirate', last_nom: 'Prentice' }
    // ]
    try {
        if ( a.date < b.date ){
            return -1
        }
        if ( a.date > b.date ){
            return 1
        }
        return 0
    } catch (error) {
        console.log("🚀 sortDataDate - error: ", error)
        console.log('🚀 sortDataDate - error stack: ', error.stack)
        return ""
    }

}



//return an object contains report details.
exports.getUserReportsSterilization = async (email = null, start_date = null, end_date = null, sn = null) => {
    const { getYYYYMMDD } = require('./helpers')

    let details = {"data":[]}

    if(!email || email == null) {
        return details
    }

    try {
        const { execute } = require('../tools/mysql.conn')
        const { getSNFromEmail, getOwnChildren, getDocuEntryNote} = require('../utils/UsersData')
        const { sortDataDate } = require('../utils/UsersData')

        const { getProductName } = require('./ProductsData')
        const { getYYMMDDandSNFromPrintoutFileName } = require('./helpers')


        let today = await getYYYYMMDD(0)
        let thirty_days_ago = await getYYYYMMDD(29)

        let start_date_condition = "year_month_day >= " + "\'" + thirty_days_ago + "\'" + " AND"
        let end_date_condition = "year_month_day <= " + "\'" + today + "\'"


        let serial_number = ""
        let printout_file_name = ""
        let type = ""
        let SN_array = []

        let model_sn = {"hydrim":[], "statim":[], "bravo":[]}


        if (start_date != null) {
            start_date_condition = "year_month_day >= " + "\'" + start_date.split("-").join("") + "\'" + " AND"
        }
        if (end_date != null) {
            end_date_condition = "year_month_day <= " + "\'" + end_date.split("-").join("") + "\'"
        }

        if (sn != null) {
            SN_array = sn.split(",")
            //trim each element in array
            SN_array = SN_array.map(product => product.trim())
        } else {
            SN_array = await getSNFromEmail(email, 1, 1)

            //only select when association_active = 1 and report_available = 1
            const email_array = await getOwnChildren(email)
            if (email_array.length > 0) {
                for (const e in email_array) {
                    const current_emailSN_array = await getSNFromEmail(email_array[e], 1, 1)
                    SN_array.concat(current_emailSN_array)
                }
            }
        }

        if (SN_array.length > 0) {
            for (const k in SN_array) {
                serial_number = SN_array[k]
                type = await getProductName(serial_number)
                if (type.charAt(0) == "H") {
                    model_sn['hydrim'].push(serial_number)
                } else if (type.charAt(0) == "S") {
                    model_sn['statim'].push(serial_number)
                } else if (type.charAt(0) == "B") {
                    model_sn['bravo'].push(serial_number)
                }
            }
        }


        //console.log("Model SN ==== ", model_sn)
        let printoutsSQL, printousResult, printoutsData, sqlcondition = ""
        let printoutsDocuSQL, printoutsDocuResult, printoutsDocuData = ""
        let model_filename = {"hydrim":[], "statim":[], "bravo":[]}


        if (model_sn['hydrim'].length > 0) {
            sqlcondition = ""
            for (const k in model_sn['hydrim']) {
                sqlcondition = "\'" + model_sn['hydrim'][k] + "\'" + "," + sqlcondition
            }

            sqlcondition = sqlcondition.slice(0, -1)
            printoutsSQL = `SELECT printout_file_name FROM printouts_hydrim_s3 WHERE serial_num IN (${sqlcondition}) AND ${start_date_condition} ${end_date_condition}`

            printousResult = await execute(printoutsSQL)
            printoutsData = printousResult && printousResult != null ? printousResult : []

            if (printoutsData.length > 0) {
                for (const k in printoutsData) {
                    model_filename['hydrim'].push(printoutsData[k].printout_file_name)
                }
            }
        }

        if (model_sn['statim'].length > 0) {
            sqlcondition = ""
            for (const k in model_sn['statim']) {
                sqlcondition = "\'" + model_sn['statim'][k] + "\'" + "," + sqlcondition
            }

            sqlcondition = sqlcondition.slice(0, -1)
            printoutsSQL = `SELECT printout_file_name FROM printouts_statim_s3 WHERE serial_num IN (${sqlcondition}) AND ${start_date_condition} ${end_date_condition}`

            printousResult = await execute(printoutsSQL)
            printoutsData = printousResult && printousResult != null ? printousResult : []

            if (printoutsData.length > 0) {
                for (const k in printoutsData) {
                    model_filename['statim'].push(printoutsData[k].printout_file_name)
                }
            }
        }
        console.log("model_filename ======= ", model_filename)

        //repeat the same step as using SN.
        if (model_filename['hydrim'].length > 0) {

            sqlcondition = ""
            for (const k in model_filename['hydrim']) {
                sqlcondition = "\'" + model_filename['hydrim'][k] + "\'" + "," + sqlcondition
            }
            sqlcondition = sqlcondition.slice(0, -1)

            //printoutsDocuSQL = `SELECT *, notes FROM printouts_hydrim_docu_entries INNER JOIN printouts_hydrim_docu_entries_note ON printouts_hydrim_docu_entries.printout_file_name IN (${sqlcondition}) GROUP BY printouts_hydrim_docu_entries.printout_file_name`

            printoutsDocuSQL = `SELECT * FROM printouts_hydrim_docu_entries WHERE printouts_hydrim_docu_entries.printout_file_name IN (${sqlcondition})`

            printoutsDocuResult = await execute(printoutsDocuSQL)
            printoutsDocuData = printoutsDocuResult && printoutsDocuResult != null ? printoutsDocuResult : []

            if (printoutsDocuData.length > 0) {
                for (const l in printoutsDocuData) {
                    
                    serial_number = printoutsDocuData[l].serial_num
                    printout_file_name = printoutsDocuData[l].printout_file_name
                    console.log('🚀 printout_file_name: ', printout_file_name)

                    console.log('🚀 QUERY.getHydrimGeneralContent: ', QUERIES.getHydrimGeneralContent)
                    const general_contents = await execute(QUERIES.getHydrimGeneralContent, [printout_file_name])
                    console.log('🚀 getHydrimGeneralContent: ', general_contents) 

                    docuInf.id = printoutsDocuData[l].idprintouts_hydrim_docu_entries

                    docuInf.date = await getYYMMDDandSNFromPrintoutFileName("yymmdd", printout_file_name)
                    docuInf.machine_id  = serial_number

                    docuInf.model  = await getProductName(serial_number)

                    docuInf.cycle_number= printoutsDocuData[l].cycle_number
                    docuInf.cf = printoutsDocuData[l].cycle_fault

                    //docuInf.notes = printoutsDocuData[l].notes
                    docuInf.notes = await getDocuEntryNote("printouts_hydrim_docu_entries_note", printout_file_name)


                    docuInf.printout_file_name = printout_file_name
                    docuInf.cycle_data.start_time = printoutsDocuData[l].cycle_start_date_time
                    docuInf.cycle_data.end_time = printoutsDocuData[l].cycle_end_date_time
                    docuInf.cycle_data.cycle_name = printoutsDocuData[l].cycle_desc
                    docuInf.cycle_data.hold_time = printoutsDocuData[l].hold_time
                    docuInf.cycle_data.hold_temperature = printoutsDocuData[l].hold_temperature
                    docuInf.cycle_data.hold_pressure = printoutsDocuData[l].hold_pressure

                    //"lot_number" => substr($row_getdata["date_time"], 2, 6).$row_getdata["serial_num"].$row_getdata["cycle_number"],

                    docuInf.lot_number = printoutsDocuData[l].date_time.substr(2, 6) + serial_number + printoutsDocuData[l].cycle_number
                    docuInf.general_contents = general_contents
                    docuInf.ci_external =printoutsDocuData[l].ci_external
                    docuInf.ci_internal =printoutsDocuData[l].ci_internal
                    docuInf.bi_test = printoutsDocuData[l].bi_test
                    docuInf.bi_control = printoutsDocuData[l].bi_control
                    docuInf.test_cycle.air_removal = printoutsDocuData[l].air_removal
                    docuInf.test_cycle.vacuum_test = printoutsDocuData[l].vacuum_test
                    docuInf.test_cycle.wash_test = printoutsDocuData[l].wash_test

                    docuInf.screen_readout = printoutsDocuData[l].screen_readout
                    docuInf.packaging_intact = printoutsDocuData[l].packaging_intact
                    docuInf.packaging_dry = printoutsDocuData[l].packaging_dry
                    docuInf.instruments_dry = printoutsDocuData[l].instruments_dry
                    docuInf.packaging_sealed = printoutsDocuData[l].packaging_sealed

                    docuInf.initial.user_begin = printoutsDocuData[l].user_begin
                    docuInf.initial.user_end = printoutsDocuData[l].user_end
                    docuInf.initial.user_bi_verified = printoutsDocuData[l].user_bi_verify
                    
                    console.log('🚀 docuInf ON details.data.push(docuInf):', docuInf)
                    details.data.push(docuInf)
                }
            }
        }

        if (model_filename['statim'].length > 0) {
            sqlcondition = ""
            for (const k in model_filename['statim']) {
                sqlcondition = "\'" + model_filename['statim'][k] + "\'" + "," + sqlcondition
            }
            sqlcondition = sqlcondition.slice(0, -1)

            printoutsDocuSQL = `SELECT * FROM printouts_statim_docu_entries WHERE printouts_statim_docu_entries.printout_file_name IN (${sqlcondition})`

            printoutsDocuResult = await execute(printoutsDocuSQL)
            printoutsDocuData = printoutsDocuResult && printoutsDocuResult != null ? printoutsDocuResult : []

            if (printoutsDocuData.length > 0) {
                for (const l in printoutsDocuData) {

                    serial_number = printoutsDocuData[l].serial_num
                    printout_file_name = printoutsDocuData[l].printout_file_name
                    console.log('🚀 printout_file_name: ', printout_file_name)

                    console.log('🚀 QUERY.getStatimStatclaveGeneralContent: ', QUERIES.getStatimStatclaveGeneralContent)
                    const general_contents = await execute(QUERIES.getStatimStatclaveGeneralContent, [printout_file_name])
                    console.log('🚀 getStatimStatclaveGeneralContent: ', general_contents) 

                    docuInf.id = printoutsDocuData[l].idprintouts_statim_docu_entries

                    docuInf.date = await getYYMMDDandSNFromPrintoutFileName("yymmdd", printout_file_name)
                    docuInf.machine_id  = serial_number

                    docuInf.model  = await getProductName(serial_number)

                    docuInf.cycle_number= printoutsDocuData[l].cycle_number
                    docuInf.cf = printoutsDocuData[l].cycle_fault

                    //docuInf.notes = printoutsDocuData[l].notes
                    docuInf.notes = await getDocuEntryNote("printouts_statim_docu_entries_note", printout_file_name)


                    docuInf.printout_file_name = printout_file_name
                    docuInf.cycle_data.start_time = printoutsDocuData[l].cycle_start_date_time
                    docuInf.cycle_data.end_time = printoutsDocuData[l].cycle_end_date_time
                    docuInf.cycle_data.cycle_name = printoutsDocuData[l].cycle_desc
                    docuInf.cycle_data.hold_time = printoutsDocuData[l].hold_time
                    docuInf.cycle_data.hold_temperature = printoutsDocuData[l].hold_temperature
                    docuInf.cycle_data.hold_pressure = printoutsDocuData[l].hold_pressure

                    //"lot_number" => substr($row_getdata["date_time"], 2, 6).$row_getdata["serial_num"].$row_getdata["cycle_number"],

                    docuInf.lot_number = printoutsDocuData[l].date_time.substr(2, 6) + serial_number + printoutsDocuData[l].cycle_number
                    docuInf.general_contents = general_contents
                    docuInf.ci_external =printoutsDocuData[l].ci_external
                    docuInf.ci_internal =printoutsDocuData[l].ci_internal
                    docuInf.bi_test = printoutsDocuData[l].bi_test
                    docuInf.bi_control = printoutsDocuData[l].bi_control
                    docuInf.test_cycle.air_removal = printoutsDocuData[l].air_removal
                    docuInf.test_cycle.vacuum_test = printoutsDocuData[l].vacuum_test
                    docuInf.test_cycle.wash_test = printoutsDocuData[l].wash_test

                    docuInf.screen_readout = printoutsDocuData[l].screen_readout
                    docuInf.packaging_intact = printoutsDocuData[l].packaging_intact
                    docuInf.packaging_dry = printoutsDocuData[l].packaging_dry
                    docuInf.instruments_dry = printoutsDocuData[l].instruments_dry
                    docuInf.packaging_sealed = printoutsDocuData[l].packaging_sealed

                    docuInf.initial.user_begin = printoutsDocuData[l].user_begin
                    docuInf.initial.user_end = printoutsDocuData[l].user_end
                    docuInf.initial.user_bi_verified = printoutsDocuData[l].user_bi_verify
                    
                    console.log('🚀 docuInf ON details.data.push(docuInf):', docuInf)
                    details.data.push(docuInf)
                }
            }
        }
        console.log("details data length === ", details.data.length)

        //obj.sort().reverse();
        //Desending Order.
        details.data.sort(await sortDataDate).reverse()

        return details

    } catch (error) {
        console.log("🚀 getUserReportsSterilization - error: ", error)
        console.log("🚀 getUserReportsSterilization - error stack: ", error.stack)
        return {}
    }
}






//return result contains requested and received associations.
exports.getUserGroupEmail = async (email, relationship, status) => {
    const { execute } = require('../tools/mysql.conn')
    //relationship is parent or children. status is pending or approval

    let result = []

    if(!email || email == null) {
        return result
    }

    try {
        let sql = ""
        if (relationship == "parent") {
            sql = ""
        } else {

        }

        return result
    } catch (error) {
        console.log("🚀 getUserGroupEmail - error: ", error)
        console.log("🚀 getUserGroupEmail - error stack: ", error.stack)
        return {}
    }
}






//return result contains requested and received associations.
exports.getRequestReceivedData = async (id, email, condition = null) => {


    let result = {
        "association_id": "",
        "email": "",
        "company": ""
    }

    if(!email || email == null ) {
        return result
    }

    try {
        const { execute } = require('../tools/mysql.conn')
        result.association_id = id
        result.email = email

        const CompanySQL = "SELECT company FROM users WHERE username = ?"
        const CompanySQLRes = await execute(CompanySQL, [email])

        if (CompanySQLRes.length > 0) {
            result.company = CompanySQLRes[0].company
        }

        if (condition == "request_approved") {
            let Products = []
            const ProductSQL = "SELECT idusers, serial_num FROM customers_units WHERE user_email = ? AND association_active = '1' AND report_available = '1'"
            const ProductSQLRes = await execute(ProductSQL, [email])
            const ProductSQLData = ProductSQLRes && ProductSQLRes != null ? ProductSQLRes : []

            if (ProductSQLData.length > 0) {
                result.userid = ProductSQLData[0].idusers
                for (const k in ProductSQLData) {
                    Products.push(ProductSQLData[k].serial_num)
                }
            }
            result.products = Products
        }

        return result
    } catch (error) {
        console.log("🚀 getRequestReceivedData - error: ", error)
        console.log("🚀 getRequestReceivedData - error stack: ", error.stack)
        return {}
    }
}





//return result contains requested and received associations.
//requested.pending = Pending Request(0,1); requested.approved = Approved User Requests(1,1);
//received.pending = Pending Approval(0,1); received.approved = Users Granted Access(1,1);
exports.getUserAssociationsData = async (email) => {

    let result = {"data":
                        {"requested":
                                {"pending":[], "approved":[]},
                        "received":
                            {"pending":[], "approved":[]}}
                 }

    if(!email || email == null) {
        return result
    }

    try {
        const { execute } = require('../tools/mysql.conn')
        const { getRequestReceivedData } = require('../utils/UsersData')


        let email_result = {"requested_pending":[],"requested_approved":[],"received_pending":[],"received_approved":[]}

        const ChildSQL = "SELECT * FROM users_group WHERE email_parent = ?"

        const ChildSQLResult = await execute(ChildSQL, [email])
        const ChildSQLData = ChildSQLResult && ChildSQLResult != null ? ChildSQLResult : []
        // if (ChildSQLData.length > 0) {
        //     for (const k in ChildSQLData) {
        //         if (ChildSQLData[k].activited_status == 0 && ChildSQLData[k].email_status == 1){
        //             email_result.requested_pending.push([ChildSQLData[k].idusers_group, ChildSQLData[k].email_child])
        //         } else if (ChildSQLData[k].activited_status == 1 && ChildSQLData[k].email_status == 1){
        //             email_result.requested_approved.push([ChildSQLData[k].idusers_group, ChildSQLData[k].email_child])
        //         }
        //     }
        // }

        if (ChildSQLData.length > 0) {
            for (const k in ChildSQLData) {
                if (ChildSQLData[k].activited_status == 0){
                    email_result.requested_pending.push([ChildSQLData[k].idusers_group, ChildSQLData[k].email_child])
                } else if (ChildSQLData[k].activited_status == 1){
                    email_result.requested_approved.push([ChildSQLData[k].idusers_group, ChildSQLData[k].email_child])
                }
            }
        }


        const ParentSQL = "SELECT * FROM users_group WHERE email_child = ?"
        const ParentSQLResult = await execute(ParentSQL, [email])
        const ParentSQLData = ParentSQLResult && ParentSQLResult != null ? ParentSQLResult : []
        // if (ParentSQLData.length > 0) {
        //     for (const k in ParentSQLData) {
        //         if (ParentSQLData[k].activited_status == 0 && ParentSQLData[k].email_status == 1){
        //             email_result.received_pending.push([ParentSQLData[k].idusers_group, ParentSQLData[k].email_parent])
        //         } else if (ParentSQLData[k].activited_status == 1 && ParentSQLData[k].email_status == 1){
        //             email_result.received_approved.push([ParentSQLData[k].idusers_group, ParentSQLData[k].email_parent])
        //         }
        //     }
        // }

        if (ParentSQLData.length > 0) {
            for (const k in ParentSQLData) {
                if (ParentSQLData[k].activited_status == 0){
                    email_result.received_pending.push([ParentSQLData[k].idusers_group, ParentSQLData[k].email_parent])
                } else if (ParentSQLData[k].activited_status == 1){
                    email_result.received_approved.push([ParentSQLData[k].idusers_group, ParentSQLData[k].email_parent])
                }
            }
        }
        //console.log("email_result ==== ", email_result)

        let req_pendingData, req_approvedData, rec_pendingData, rec_approvedData
        if (email_result.requested_pending.length > 0) {
            for (const k in email_result.requested_pending) {
                req_pendingData = await getRequestReceivedData(email_result.requested_pending[k][0],email_result.requested_pending[k][1])
                result.data.requested.pending.push(req_pendingData)
            }
        }
        if (email_result.requested_approved.length > 0) {
            for (const k in email_result.requested_approved) {
                req_approvedData = await getRequestReceivedData(email_result.requested_approved[k][0],email_result.requested_approved[k][1], "request_approved")
                result.data.requested.approved.push(req_approvedData)
            }
        }
        if (email_result.received_pending.length > 0) {
            for (const k in email_result.received_pending) {
                rec_pendingData = await getRequestReceivedData(email_result.received_pending[k][0],email_result.received_pending[k][1])
                result.data.received.pending.push(rec_pendingData)
            }
        }
        if (email_result.received_approved.length > 0) {
            for (const k in email_result.received_approved) {
                rec_approvedData = await getRequestReceivedData(email_result.received_approved[k][0],email_result.received_approved[k][1])
                result.data.received.approved.push(rec_approvedData)
            }
        }

        return result
    } catch (error) {
        console.log("🚀 getUserAssociationsData - error: ", error)
        console.log("🚀 getUserAssociationsData - error stack: ", error.stack)
        return {}
    }
}





exports.checkAddEmail = async (personal_email, child_email) => {

    let result = {"status": 0}

    try {
        const { execute } = require('../tools/mysql.conn')
        const { getUserDetails } = require('../utils/UsersData')


        if(!child_email || child_email == null) {
            result["msg"] = "Waiting for typing"
        } else if (child_email == personal_email) {
            result["msg"] = "You can not add your current account"
        } else {
            const query1 = "SELECT idusers, user_email, serial_num FROM customers_units WHERE user_email = ?"
            const query1Res = await execute(query1, [child_email])

            if(query1Res.length > 0) {
                const child_id = query1Res[0].idusers

                const query2 = "SELECT * FROM users_group WHERE email_parent = ? AND email_child = ?"
                const query2Res = await execute(query2, [personal_email, child_email])
                const query2Data = query2Res && query2Res != null ? query2Res : []
                if (query2Data.length > 0) {
                    for (const k in query2Data) {
                        if (query2Data[k].activited_status == '1') {
                            result["msg"] = "You already added this email, you can not add the same email twice"
                        } else if (query2Data[k].end_time == null && query2Data[k].activited_status == '0') {
                            result["msg"] = "You already sent the request to this email, please do not resend and wait for approval"
                        }
                    }
                } else { //No child email in users_group. Ready to insert new data
                    let parent_id = 0
                    const personal_detail = await getUserDetails(personal_email)
                    if (personal_detail) {
                        parent_id = personal_detail.user_id
                    }
                    const inser_sql = "INSERT INTO users_group(idusers_child, email_child, idusers_parent, email_parent, start_time, activited_status, email_status) VALUES (?, ?, ?, ?, now(), '0', '0')"
                    await execute(inser_sql, [child_id, child_email, parent_id, personal_email])
                    result["status"] = 1
                    result["msg"] = "Email added successful !"

                    //send email here.
                }
            } else { //query1Res.length = 0, child does not exist
                result["msg"] = "The email you enter does not exist, please enter the right email"
            }
        }

        return result
    } catch (error) {
        console.log("🚀 checkAddEmail - error: ", error)
        console.log("🚀 checkAddEmail - error stack: ", error.stack)
        return {}
    }
}


//Accept association request.
exports.AcceptAssocRequest = async (idusers_group) => {
    let result = {"status": 0}

    if (!idusers_group || idusers_group == null) {
        return result
    }

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = "UPDATE users_group SET activited_status = '1' WHERE idusers_group = ? AND end_time IS NULL"
        const sqlRes = await execute(sql, [idusers_group])

        if (sqlRes.changedRows == '1') {
            result["status"] = 1
        }

        return result
    } catch (error) {
        console.log("🚀 AcceptAssocRequest - error: ", error)
        console.log("🚀 AcceptAssocRequest - error stack: ", error.stack)
        return {}
    }
}


exports.DisassociateUser = async (idusers_group) => {
    let result = {"status": 0}

    if (idusers_group == "") {
        return result
    }

    try {
        const { execute } = require('../tools/mysql.conn')

        const sql = "UPDATE users_group SET end_time = now(), activited_status = '0' WHERE idusers_group = ? AND activited_status = '1' AND end_time IS NULL"
        const sqlRes = await execute(sql, [idusers_group])

        if (sqlRes.changedRows == '1') {
            result["status"] = 1
        }

        return result
    } catch (error) {
        console.log("🚀 DisassociateUser - error: ", error)
        console.log("🚀 DisassociateUser - error stack: ", error.stack)
        return {}
    }
}



//Get product SN information from customers_units base on email and serial number.
exports.getUserProductSNRegister = async (email, serial_num) => {
    let result = {
        "data": {}
    }

    if (!email || !serial_num) {
        return result
    }

    try {
        const {execute} = require('../tools/mysql.conn')
        const {changeTimeFormat} = require('../utils/helpers')

        const sql = `SELECT idcustomers_units,association_active,idunits_warranties,warranty_registered_date,latest_oas_update_date FROM customers_units WHERE user_email = '${email}' AND serial_num = '${serial_num}'`
        const sqlRes = await execute(sql)
        if (sqlRes[0]) {
            result.data.id = sqlRes[0].idcustomers_units
            result.data.serial_number = serial_num
            result.data.email = email
            result.data.association_active = sqlRes[0].association_active
            result.data.warranty_id = sqlRes[0].idunits_warranties
            result.data.warranty_registration_date = await changeTimeFormat(sqlRes[0].warranty_registered_date)
        }

        return result
    } catch (error) {
        console.log("🚀 getUserProductSNRegister - error: ", error)
        console.log("🚀 getUserProductSNRegister - error stack: ", error.stack)
        return {}
    }
}





//Return {"status": 1} if we successfully insert a new row into customers_units.
exports.InsertUserProductSNRegister = async (email, serial_num, warranty_id, association_active) => {
    let result = {
        "status": 0
    }

    if (!email || !serial_num) {
        return result
    }

    try {
        const {execute} = require('../tools/mysql.conn')
        const { getUserDetails } = require('../utils/UsersData')

        const sql = `SELECT 1 FROM customers_units WHERE user_email = '${email}' AND serial_num = '${serial_num}'`
        const sqlRes = await execute(sql)
        //if SN and email exist in customerw_units, return false and message
        if (sqlRes[0]) {
          result.message = "This serial number and email already exist."
        } else {
            const userData = await getUserDetails(email)
            if (Object.keys(userData).length > 0) {
                const userID = userData.user_id

                const InsertSQL = `INSERT INTO customers_units(idusers,user_email,association_active,idunits_warranties,serial_num,latest_oas_update_date) VALUES (?,?,?,?,?,NOW())`
                const InsertSQLRes = await execute(InsertSQL, [userID,email,association_active,warranty_id,serial_num])
                console.log(InsertSQLRes)
                if (InsertSQLRes.insertId > 0){
                    result.status = 1
                }
            } else {
                result.message = "This email does not exist."
            }
        }

        return result
    } catch (error) {
        console.log("🚀 InsertUserProductSNRegister - error: ", error)
        console.log("🚀 InsertUserProductSNRegister - error stack: ", error.stack)
        return {}
    }
}