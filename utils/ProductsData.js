/**
 * Returns product name
 *
 * @param {string} serial_number
 * @returns {string}
 */


//const { getProductName } = require('./ProductsData')


exports.getProductName = async (serial_number) => {
    const { execute } = require('../tools/mysql.conn')
    let product_name = ''

    if(!serial_number || serial_number == null) {
        return product_name
    }

    try {

        const prefix = serial_number.slice(0, 2) == "AJ" ? "AJ" : serial_number.slice(0, 4)
        const sql = `SELECT model_general_name FROM units_models WHERE productSerialNumberPrefix = ?`


        const sqlResult = await execute(sql, [prefix]) // conn.query(sql, [serial_number.slice(0, 4)])
        const res = sqlResult[0]

        if(res) {
            product_name = res.model_general_name //res[0].model_general_name
        }
        
        return product_name.split("-").join(" ")

    } catch (error) {
        console.log("🚀 getProductName - error: ", error)
        console.log("🚀 getProductName - error stack: ", error.stack)
        return ''
    }
}

/**
 * Returns an array of units
 *
 * @param {string} email
 * @returns {Array}
 */
exports.getCustomerUnits = async (email) => {
    const { execute } = require('../tools/mysql.conn')
    let units = []

    if(!email || email == null) {
        return units
    }

    try {
        const sql = `SELECT serial_num, association_active FROM customers_units WHERE user_email = ?`

        const sqlResult = await execute(sql, [email])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {
                units.push(
                    {
                        serial_number: data[k].serial_num,
                        association_status: data[k].association_active
                    }
                )
            }
        }

        return units
    } catch (error) {
        console.log("🚀 getCustomerUnits - error: ", error)
        console.log("🚀 getCustomerUnits - error stack: ", error.stack)
        return []
    }
}

/**
 * Returns an array of units
 *
 * @param {string} email
 * @returns {Array}
 */
exports.getCustomerAssociatedUnits = async (email) => {
    const { execute } = require('../tools/mysql.conn')
    let units = []

    if(!email || email == null) {
        return units
    }

    try {
        const sql = `SELECT serial_num, association_active FROM customers_units WHERE association_active = 1 AND user_email = ?`

        const sqlResult = await execute(sql, [email])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {
                units.push(
                    {
                        serial_number: data[k].serial_num,
                        association_status: data[k].association_active
                    }
                )
            }
        }

        return units
    } catch (error) {
        console.log("🚀 getCustomerAssociatedUnits - error: ", error)
        console.log("🚀 getCustomerAssociatedUnits - error stack: ", error.stack)
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
exports.checkOnlineAccessStatus = async (email, serial_number) => {
    const { execute } = require('../tools/mysql.conn')
    let isActive = false

    try {
        const sql = `SELECT association_active FROM customers_units WHERE association_active = 1 AND user_email = ? AND serial_num = ?`

        const sqlResult = await execute(sql, [email, serial_number])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            isActive = true
        }

        return isActive
    } catch (error) {
        console.log("🚀 checkOnlineAccessStatus - error: ", error)
        console.log("🚀 checkOnlineAccessStatus - error stack: ", error.stack)
        return null
    }
}

exports.associationDetails = async (email, serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    if(!serial_num || serial_num == null || !email || email == null) {
        console.log( '+++ Missing data - ', {'serial_number': serial_num, 'email': email} )
        return []
    }

    try {

        const sql = `SELECT * FROM customers_units WHERE association_active = 1 AND serial_num = '${serial_num}' and user_email='${email}'`

        const sqlResult = await execute(sql)
        const res = sqlResult[0]

        const data = sqlResult && sqlResult.length > 0 ? sqlResult[0] : []

        if (!data || typeof data == 'undefined' || data.length == 0) {
            return []
        } else {
            const outoput = [data.user_email, data.ca_active_ref_id]

            return [data.user_email, data.ca_active_ref_id]
        }

    } catch (error) {
        console.log("🚀 0.associationDetails - error:", error)
        console.log("🚀 0.1.associationDetails - error:", error.stack)
        return null
    }
}


/**
 *
 * @param {string} serial_num
 * @returns array
 */
exports.unitAssociations = async (serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    try {
        const sql = `SELECT * FROM customers_units WHERE serial_num = ?`

        const sqlResult = await execute(sql, [serial_num])
        const res = sqlResult[0]

        return sqlResult ? sqlResult : []
    } catch (error) {
        console.log("🚀 0.unitAssociations - error:", error)
        console.log("🚀 0.1.unitAssociations - error:", error.stack)
        return null
    }
}

/**
 *
 * @param {string} serial_num
 * @returns array
 */
exports.unitActiveAssociation = async (serial_num) => {
    const { execute } = require('../tools/mysql.conn')
    try {
        const sql = `SELECT user_email, association_active FROM customers_units WHERE association_active = 1 AND serial_num = ? LIMIT 1`

        const sqlResult = await execute(sql, [serial_num])
        const res = sqlResult[0]

        return sqlResult && sqlResult.length > 0? sqlResult[0] : []
    } catch (error) {
        console.log("🚀 0.unitAssociations - error:", error)
        console.log("🚀 0.1.unitAssociations - error:", error.stack)
        return null
    }
}


exports.getProductData = async (limit) => {
    const { execute } = require('../tools/mysql.conn')
    const { getProductName } = require('./ProductsData')

    let units = {}


    try {
        const sql = `SELECT DISTINCT customers_units.serial_num, product_nickname, product_in_room, association_active, customers_units.idunits_warranties, created_at FROM customers_units LEFT JOIN units_warranties ON customers_units.idunits_warranties = units_warranties.idunits_warranties ORDER BY customers_units.idcustomers_units DESC LIMIT ?`

        const sqlResult = await execute(sql, [limit])
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {

                const serial_num = data[k].serial_num
                const product_nickname = data[k].product_nickname && data[k].product_nickname != null ? data[k].product_nickname : null
                const room = data[k].product_in_room && data[k].product_in_room != null ? data[k].product_in_room : null
                const association_active = data[k].association_active ? true : false
                const idunits_warranties = data[k].idunits_warranties
                const warranty_registration_date = data[k].created_at && data[k].created_at != null && data[k].created_at != "Invalid Date" ? data[k].created_at : null

                const model_name = await getProductName(serial_num)

                const update_available = model_name.includes("BRAVO")


                units[serial_num] = {model: model_name, serial_number: serial_num, unit_nickname: product_nickname, room: room, warranty_registration_date: warranty_registration_date,
                    association_active: association_active, warranty_id: idunits_warranties, update_available: update_available}

            }
        }

        return units
    } catch (error) {
        console.log("🚀 getProductData - error: ", error)
        console.log("🚀 getProductData - error stack: ", error.stack)
        return {}
    }
}



exports.getProductSNData = async (serial_num) => {
    const { getProductName } = require('./ProductsData')
    const { execute } = require('../tools/mysql.conn')
    let units = {}


    try {
        const sql = `SELECT customers_units.serial_num, product_nickname, association_active, customers_units.idunits_warranties FROM customers_units LEFT JOIN units_warranties ON customers_units.idunits_warranties = units_warranties.idunits_warranties WHERE customers_units.serial_num = ? ORDER BY idcustomers_units DESC LIMIT 1`

        const sqlResult = await execute(sql, [serial_num])
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
        return []
    }
}






exports.getProductTyes = async () => {
    const { execute } = require('../tools/mysql.conn')

    // {
    //     //     "name": "STATIM 2000 G4",
    //     //     "image_url": "/statim_2000_g4.png"
    //     // },
    //     // {
    //     //     "name": "STATIM 5000 G4",
    //     //     "image_url": "/statim_5000_g4.png"
    //     // }

    let units = {
        "data": [
            {
                "name": "STATIM",
                "category": "",
                "models": []
            },
            {
                "name": "HYDRIM",
                "category": "",
                "models": []
            },
            {
                "name": "BRAVO",
                "category": "",
                "models": []
            },
            {
                "name": "STATCLAVE",
                "category": "",
                "models": []
            }
        ]
    }


    try {
        //remove model_general_name LIKE '%G4%' and set STATIM B core_unit = 1
        //const sql = `SELECT model_general_name, category FROM units_models WHERE model_general_name LIKE '%G4%' AND core_units = 1 GROUP BY model_general_name`
        const sql = `SELECT model_general_name, category FROM units_models WHERE core_units = 1 GROUP BY model_general_name`
        const sqlResult = await execute(sql)
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if(data.length > 0) {
            for( const k in data ) {
                console.log(data[k].model_general_name.split("-").join(" "))
                if (data[k].model_general_name.indexOf("STATIM") !== -1) {
                    units.data[0].category = data[k].category
                    units.data[0].models.push({
                        "name": data[k].model_general_name.split("-").join(" "),
                        "image_url": "/" + data[k].model_general_name.split("-").join("_") + ".png"
                    })
                } else if (data[k].model_general_name.indexOf("HYDRIM") !== -1) {
                    units.data[1].category = data[k].category
                    units.data[1].models.push({
                        "name": data[k].model_general_name.split("-").join(" "),
                        "image_url": "/" + data[k].model_general_name.split("-").join("_") + ".png"
                    })
                } else if (data[k].model_general_name.indexOf("BRAVO") !== -1) {
                    units.data[2].category = data[k].category
                    units.data[2].models.push({
                        "name": data[k].model_general_name.split("-").join(" "),
                        "image_url": "/" + data[k].model_general_name.split("-").join("_") + ".png"
                    })
                } else if (data[k].model_general_name.indexOf("STATCLAVE") !== -1) {
                    units.data[3].category = data[k].category
                    units.data[3].models.push({
                        "name": data[k].model_general_name.split("-").join(" "),
                        "image_url": "/" + data[k].model_general_name.split("-").join("_") + ".png"
                    })
                }
            }
        }

        return units
    } catch (error) {
        console.log("🚀 getProductTyes - error: ", error)
        console.log("🚀 getProductTyes - error stack: ", error.stack)
        return []
    }
}

//return printouts_tablename_s3 in the latest 30 days
exports.getCyclesData = async (tablename = null, sn = null, country = null, product_type = null) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD } = require('./helpers')
    let today = await getYYYYMMDD(0)
    let seven_days_ago = await getYYYYMMDD(6)
    let thirty_days_ago = await getYYYYMMDD(29)
    let tableid = "id" + tablename

    let sn_condition = ""
    let country_condition = ""
    let product_type_condition = ""

    if (sn != null) {
        sn_condition = "serial_num = " + "\'" + sn + "\'" + " AND"
    }
    if (country != null) {
        country_condition = "country = " + "\'" + country.toUpperCase() + "\'" + " AND"

    }
    if (product_type != null) {
        product_type_condition = "unit_type = " + "\'" + product_type.toUpperCase() + "\'" + " AND"
    }

    let totalCycles = {
                        "today": 0,
                        "last_seven_days": 0,
                        "last_thirty_days": 0
                       }

    try {

        if (tablename == null) {
            return totalCycles
        }
        //const sql = `SELECT year_month_day FROM printouts_hydrim_s3 WHERE year_month_day >= ? AND year_month_day <= ? ORDER BY ? DESC`
        const sql = `SELECT year_month_day FROM ${tablename} WHERE ${sn_condition} ${country_condition} ${product_type_condition} year_month_day >= ? AND year_month_day <= ? ORDER BY ? DESC`


        const sqlResult = await execute(sql, [thirty_days_ago, today, tableid])
        const data = sqlResult && sqlResult != null ? sqlResult : []

        let today_cy = 0
        let last_seven_days_cy = 0
        let last_thirty_days_cy = data.length

        if(data.length > 0) {
            for (const k in data) {
                if (data[k].year_month_day == today) {
                    today_cy++
                }
                if (data[k].year_month_day >= seven_days_ago) {
                    last_seven_days_cy++
                }
            }
        }
        totalCycles.today = parseInt(today_cy)
        totalCycles.last_seven_days = parseInt(last_seven_days_cy)
        totalCycles.last_thirty_days = parseInt(last_thirty_days_cy)

        return totalCycles

    } catch (error) {
        console.log("🚀 getCyclesData - error: ", error)
        console.log("🚀 getCyclesData - error stack: ", error.stack)
        return {}
    }

}

//pending = 1 get pending_for_action, otherwise get unit CF notifications.
exports.getCFData = async (pending = null, sn = null, country = null, product_type_condition = "") => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD } = require('./helpers')

    let today = await getYYYYMMDD(0)
    let seven_days_ago = await getYYYYMMDD(6)
    let thirty_days_ago = await getYYYYMMDD(29)

    let sn_condition = ""
    let country_condition = ""

    if (sn != null) {
        sn_condition = "serial_num = " + "\'" + sn + "\'" + " AND"
    }
    if (country != null) {
        country_condition = "country = " + "\'" + country.toUpperCase() + "\'" + " AND"
    }

    let totalCFs = {
                        "total_cf": {
                            "today": "",
                            "last_seven_days": "",
                            "last_thirty_days": ""
                        },
                        "total_cf_pending": {
                            "today": "",
                            "last_seven_days": "",
                            "last_thirty_days": ""
                        }
                    }

    try {
        // return unitsCF
        if (pending != 1){
            const sql = `SELECT year_month_day FROM units_cf_notifications WHERE ${sn_condition} ${country_condition} ${product_type_condition} year_month_day >= ? AND year_month_day <= ?  ORDER BY idunits_cf_notifications DESC`

            const sqlResult = await execute(sql, [thirty_days_ago, today])
            const data = sqlResult && sqlResult != null ? sqlResult : []

            let today_cf = 0
            let last_seven_days_cf = 0
            let last_thirty_days_cf = data.length
            if(data.length > 0) {
                for (const k in data) {
                    if (data[k].year_month_day == today) {
                        today_cf++
                    }
                    if (data[k].year_month_day >= seven_days_ago) {
                        last_seven_days_cf++
                    }
                }
            }
            totalCFs.total_cf.today = parseInt(today_cf)
            totalCFs.total_cf.last_seven_days = parseInt(last_seven_days_cf)
            totalCFs.total_cf.last_thirty_days = parseInt(last_thirty_days_cf)

            return totalCFs

        }
        //return unitsCFPending
        else if (pending == 1) {
            const sql = `SELECT year_month_day FROM units_cf_notifications WHERE ${sn_condition} ${country_condition} ${product_type_condition} year_month_day >= ? AND year_month_day <= ? AND pending_for_action = 1 ORDER BY idunits_cf_notifications DESC`

            const sqlResult = await execute(sql, [thirty_days_ago, today])
            const data = sqlResult && sqlResult != null ? sqlResult : []

            let today_cf_pending = 0
            let last_seven_days_cf_pending = 0
            let last_thirty_days_cf_pending = data.length
            if(data.length > 0) {
                for (const k in data) {
                    if (data[k].year_month_day == today) {
                        today_cf_pending++
                    }
                    if (data[k].year_month_day >= seven_days_ago) {
                        last_seven_days_cf_pending++
                    }
                }
            }
            totalCFs.total_cf_pending.today = parseInt(today_cf_pending)
            totalCFs.total_cf_pending.last_seven_days = parseInt(last_seven_days_cf_pending)
            totalCFs.total_cf_pending.last_thirty_days = parseInt(last_thirty_days_cf_pending)
            return totalCFs
        }
    } catch (error) {
        console.log("🚀 getCFData - error: ", error)
        console.log("🚀 getCFData - error stack: ", error.stack)
        return {}
    }
}


exports.getCycleMonthlyData = async (filter=null, sn=null, product_type=null) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD, getDaysName } = require('./helpers')
    let today = await getYYYYMMDD(0)
    let seven_days_ago = await getYYYYMMDD(6)
    let thirty_days_ago = await getYYYYMMDD(29)

    try {

        let CycleMonthlyData = {"data":[]}
        let sn_condition = ""
        let product_type_condition = ""
        let product_array

        if (sn != null) {
            sn_condition = "serial_num = " + "\'" + sn + "\'" + " AND"
        }

        if (product_type != null) {
            product_array = product_type.split(",")
            //trim each element in array
            product_array = product_array.map(product => product.trim())
            for (const k in product_array) {
                product_type_condition = product_type_condition +"unit_type = " + "\'" + product_array[k].toUpperCase().trim() + "\'" + " OR "
            }
            product_type_condition = product_type_condition.slice(0, -4)
            //product_type_condition = product_type_condition + " AND"
            product_type_condition = "("+product_type_condition +  ")" + " AND"
        } else if (product_type == null) {
            product_array = ['HYDRIM', 'STATIM', 'STATCLAVE', 'BRAVO']
            product_type_condition = ""
        }

        let Hydrimsql, Statimsql, Statclavesql, Bravosql
        let HydrimsqlResult, StatimsqlResult, BravosqlResult, StatclaveResult
        let Hydrimdata, Statimdata, Statclavedata, Bravodata

        let day
        let time = thirty_days_ago
        if (filter == "week") {
            day = 6
            time = seven_days_ago
        } else {
            day = 29
            time = thirty_days_ago
        }


        if (product_array.includes('HYDRIM')) {
            Hydrimsql = `SELECT LEFT(date_time, 10) as cycledate, count(1) as cycles FROM printouts_hydrim_s3 WHERE ${sn_condition} year_month_day >= ? AND year_month_day <= ? GROUP BY year_month_day`
            HydrimsqlResult = await execute(Hydrimsql, [time, today])
            Hydrimdata = HydrimsqlResult && HydrimsqlResult != null ? HydrimsqlResult : []
        }
        if (product_array.includes('STATIM')) {
            Statimsql = `SELECT LEFT(date_time, 10) as cycledate, count(1) as cycles FROM printouts_statim_s3 WHERE unit_type = 'STATIM' AND ${sn_condition} year_month_day >= ? AND year_month_day <= ? GROUP BY year_month_day`
            StatimsqlResult = await execute(Statimsql, [time, today])
            Statimdata = StatimsqlResult && StatimsqlResult != null ? StatimsqlResult : []
        }

        if (product_array.includes('STATCLAVE')) {
            Statclavesql = `SELECT LEFT(date_time, 10) as cycledate, count(1) as cycles FROM printouts_statim_s3 WHERE unit_type = 'STATCLAVE' AND ${sn_condition} year_month_day >= ? AND year_month_day <= ? GROUP BY year_month_day`
            StatclaveResult = await execute(Statclavesql, [time, today])
            Statclavedata = StatclaveResult && StatclaveResult != null ? StatclaveResult : []
        }
        if (product_array.includes('BRAVO')) {
            Bravosql = `SELECT LEFT(date_time, 10) as cycledate, count(1) as cycles FROM printouts_bravo_s3 WHERE ${sn_condition} year_month_day >= ? AND year_month_day <= ? GROUP BY year_month_day`
            BravosqlResult = await execute(Bravosql, [time, today])
            Bravodata = BravosqlResult && BravosqlResult != null ? BravosqlResult : []
        }


        const CFsql = `SELECT LEFT(date_originated, 10) as cycledate, count(1) as cycles FROM units_cf_notifications WHERE ${sn_condition} ${product_type_condition} year_month_day >= ? AND year_month_day <= ? GROUP BY year_month_day`
        const CPsql = `SELECT LEFT(date_originated, 10) as cycledate, count(1) as cycles FROM units_cf_notifications WHERE ${sn_condition} ${product_type_condition} year_month_day >= ? AND year_month_day <= ? AND pending_for_action = 1 GROUP BY year_month_day`
        const CFsqlResult = await execute(CFsql, [time, today])
        const CPsqlResult = await execute(CPsql, [time, today])
        const CFdata = CFsqlResult && CFsqlResult != null ? CFsqlResult : []
        const CPdata = CPsqlResult && CPsqlResult != null ? CPsqlResult : []


        let i

        let hydrimdaily, statimdaily, bravodaily, statclavedaily, cfdaily, cpdaily

        for (i=day; i>=0; i--){
            const date = await getYYYYMMDD(i, 1)
            const label = await getDaysName(i)
            hydrimdaily = 0
            statimdaily = 0
            statclavedaily = 0
            bravodaily = 0
            cpdaily =0
            cfdaily = 0
            for (const k in Hydrimdata) {
                if (Hydrimdata[k].cycledate == date) {
                    hydrimdaily = Hydrimdata[k].cycles && Hydrimdata[k].cycles != null ? parseInt(Hydrimdata[k].cycles) : 0
                }
            }
            for (const k in Statimdata) {
                if (Statimdata[k].cycledate == date) {
                    statimdaily = Statimdata[k].cycles && Statimdata[k].cycles != null ? parseInt(Statimdata[k].cycles) : 0
                }
            }
            for (const k in Bravodata) {
                if (Bravodata[k].cycledate == date) {
                    bravodaily = Bravodata[k].cycles && Bravodata[k].cycles != null ? parseInt(Bravodata[k].cycles) : 0
                }
            }
            for (const k in Statclavedata) {
                if (Statclavedata[k].cycledate == date) {
                    statclavedaily = Statclavedata[k].cycles && Statclavedata[k].cycles != null ? parseInt(Statclavedata[k].cycles) : 0
                }
            }

            for (const k in CFdata) {
                if (CFdata[k].cycledate == date) {
                    cfdaily = CFdata[k].cycles && CFdata[k].cycles != null ? parseInt(CFdata[k].cycles) : 0
                }
            }
            for (const k in CPdata) {
                if (CPdata[k].cycledate == date) {
                    cpdaily = CPdata[k].cycles && CPdata[k].cycles != null ? parseInt(CPdata[k].cycles) : 0
                }
            }

            const dailydetails = {
                "date": date,
                "cycles": hydrimdaily + statimdaily + statclavedaily + bravodaily,
                "faults": parseInt(cfdaily) && parseInt(cfdaily) != null ? parseInt(cfdaily) : 0,
                "pending": parseInt(cpdaily) && parseInt(cpdaily) != null ? parseInt(cpdaily) : 0 ,
                "label": label
            }

            CycleMonthlyData.data.push(dailydetails)
        }
        return CycleMonthlyData
    } catch (error) {
        console.log("🚀 getCyclesDailyData - error: ", error)
        console.log("🚀 getCyclesDailyData - error stack: ", error.stack)
        return {}
    }
}



exports.getCycleSummary = async (sn = null, country = null, product_type = null) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD } = require('./helpers')
    const { getCyclesData, getCFData } = require('./ProductsData')

    let summary = {
                    "data": {
                        "total_cycles": {
                            "today": "",
                            "last_seven_days": "",
                            "last_thirty_days": ""
                        },
                        "total_cf": {
                            "today": "",
                            "last_seven_days": "",
                            "last_thirty_days": ""
                        },
                        "total_cf_pending": {
                            "today": "",
                            "last_seven_days": "",
                            "last_thirty_days": ""
                        }
                    }
                  }


    try {
        let today = await getYYYYMMDD(0)
        let seven_days_ago = await getYYYYMMDD(6)
        let thirty_days_ago = await getYYYYMMDD(29)

        let product_array
        let product_type_condition = ""

        if (product_type != null) {
            product_array = product_type.split(",")
            //trim each element in array
            product_array = product_array.map(product => product.toUpperCase().trim())
            for (const k in product_array) {
                product_type_condition = product_type_condition +"unit_type = " + "\'" + product_array[k] + "\'" + " OR "
            }
            product_type_condition = product_type_condition.slice(0, -4)
            product_type_condition = "("+product_type_condition +  ")" + " AND"
        } else if (product_type == null) {
            product_array = ['HYDRIM', 'STATIM', 'STATCLAVE', 'BRAVO']
            product_type_condition = ""
        }

        let TotalHydrimCys, TotalStatimCys, TotalStatclaveCys, TotalBravoCys
        //Set default value to 0
        TotalHydrimCys = TotalStatimCys = TotalStatclaveCys = TotalBravoCys = await getCyclesData()

        if (product_array.includes('HYDRIM')) {
            TotalHydrimCys = await getCyclesData("printouts_hydrim_s3", sn, country, "HYDRIM")
        }
        if (product_array.includes('STATIM')) {
            TotalStatimCys = await getCyclesData("printouts_statim_s3", sn, country, "STATIM")
        }
        if (product_array.includes('STATCLAVE')) {
            TotalStatclaveCys = await getCyclesData("printouts_statim_s3", sn, country, "STATCLAVE")
        }
        if (product_array.includes('BRAVO')) {
            TotalBravoCys = await getCyclesData("printouts_bravo_s3", sn, country, "BRAVO")
        }

        //this one also includes staclave.
        summary.data.total_cycles.today = TotalHydrimCys.today + TotalStatimCys.today + TotalStatclaveCys.today + TotalBravoCys.today
        summary.data.total_cycles.last_seven_days = TotalHydrimCys.last_seven_days  + TotalStatimCys.last_seven_days + TotalStatclaveCys.last_seven_days + TotalBravoCys.last_seven_days
        summary.data.total_cycles.last_thirty_days = TotalHydrimCys.last_thirty_days  + TotalStatimCys.last_thirty_days + TotalStatclaveCys.last_thirty_days + TotalBravoCys.last_thirty_days


        let TotalCFs = await getCFData(null, sn, country, product_type_condition)

        let TotalCFPending = await getCFData(1, sn, country, product_type_condition)

        summary.data.total_cf.today = TotalCFs.total_cf.today
        summary.data.total_cf.last_seven_days = TotalCFs.total_cf.last_seven_days
        summary.data.total_cf.last_thirty_days = TotalCFs.total_cf.last_thirty_days

        summary.data.total_cf_pending.today = TotalCFPending.total_cf_pending.today
        summary.data.total_cf_pending.last_seven_days = TotalCFPending.total_cf_pending.last_seven_days
        summary.data.total_cf_pending.last_thirty_days =TotalCFPending.total_cf_pending.last_thirty_days

        return summary
    } catch (error) {
        console.log("🚀 getCycleSummary - error: ", error)
        console.log("🚀 getCycleSummary - error stack: ", error.stack)
        return {}
    }
}






exports.getCycleFaults = async (start_date = null, end_date = null, page = 1, serial_number = null, country = null, product_type = null) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD } = require('./helpers')
    const { getUserName, getPrivacyChecked, getUnitContact, getNoteArray } = require('./UsersData')
    const { getProductName } = require('./ProductsData')


    let CycleFaults = {
        "data": []
    }


    try {

        let today = await getYYYYMMDD(0)
        let thirty_days_ago = await getYYYYMMDD(29)


        let start_date_condition = "year_month_day >= " + "\'" + thirty_days_ago + "\'" + " AND"
        let end_date_condition = "year_month_day <= " + "\'" + today + "\'" + " AND"
        const pageLimit = (parseInt(page) - 1) * 10
        let page_condition = "LIMIT " + pageLimit.toString() + ", 10"
        let product_type_condition = "unit_type IS NOT NULL"


        let sn_condition = ""
        let country_condition = ""


        if (start_date != null) {
            start_date_condition = "year_month_day >= " + "\'" + start_date.split("-").join("") + "\'" + " AND"
        }
        if (end_date != null) {
            end_date_condition = "year_month_day <= " + "\'" + end_date.split("-").join("") + "\'" + " AND"
        }


        if (serial_number != null) {
            sn_condition = "serial_num = " + "\'" + serial_number + "\'" + " AND"
        }
        if (country != null) {
            country_condition = "AND country = " + "\'" + country.toUpperCase() + "\'" + ""

        }

        if (product_type != null) {
            const product_array = product_type.split(",")
            product_type_condition = product_type_condition + " AND "
            for (const k in product_array) {
                product_type_condition = product_type_condition +"unit_type = " + "\'" + product_array[k].toUpperCase().trim() + "\'" + " OR "
            }
            product_type_condition = product_type_condition.slice(0, -4)
            product_type_condition = "(" + product_type_condition + ")"
        }

        //limit 10 by page
        //const sql = `SELECT * FROM units_cf_notifications WHERE ${start_date_condition} ${end_date_condition} ${sn_condition} ${country_condition} ${product_type_condition} ${page_condition}`
        const sql = `SELECT * FROM units_cf_notifications WHERE ${start_date_condition} ${end_date_condition} ${sn_condition} ${product_type_condition} ${country_condition} ORDER BY idunits_cf_notifications DESC ${page_condition}`

        const sqlResult = await execute(sql)
        const res = sqlResult[0]
        const data = sqlResult && sqlResult != null ? sqlResult : []


        if(data.length > 0) {
            for (const k in data) {
                let FaultsDetail = {
                    "id": null,
                    "serial_number": null,
                    "cycle_number": null,
                    "unit_type": null,
                    //model need to come fron units_models
                    "model": null,
                    "cycle_fault": null,
                    "country": null,
                    "pending_for_action": null,
                    "action_in_progress": null,
                    "handeled_by": {
                        "first_name": null,
                        "last_name": null,
                        "email": null,
                        "avatar_url": null
                    },
                    "handeled_by_date": null,
                    "notification_status": null,
                    "date_originated": null,
                    "ip": null,
                    "software_update_available": null,
                    "online_access_active": null,
                    "privacy_checked": null,
                    "contact": {
                        "first_name": null,
                        "last_name": null,
                        "email": null,
                        "phone": null
                    },
                    "notes": []
                }
                FaultsDetail.id = data[k].idunits_cf_notifications
                FaultsDetail.serial_number = data[k].serial_num
                FaultsDetail.cycle_number = data[k].cycle_number
                FaultsDetail.unit_type = data[k].unit_type
                //FaultsDetail.model = data[k].model_type
                FaultsDetail.model = await getProductName(data[k].serial_num)
                FaultsDetail.cycle_fault = data[k].cycle_fault
                FaultsDetail.country = data[k].country
                sqlResult && sqlResult != null ? sqlResult : []
                FaultsDetail.pending_for_action = data[k].pending_for_action && data[k].pending_for_action == 1 ? true : false
                FaultsDetail.action_in_progress = data[k].action_in_progress && data[k].action_in_progress == 1 ? true : false
                const handeled_by_name = await getUserName(data[k].handeled_by)
                FaultsDetail.handeled_by.first_name = handeled_by_name.first_name
                FaultsDetail.handeled_by.last_name = handeled_by_name.last_name

                FaultsDetail.handeled_by.email = data[k].handeled_by
                FaultsDetail.handeled_by.avatar_url = handeled_by_name.avatar_url
                FaultsDetail.handeled_by_date = data[k].handeled_by_date
                FaultsDetail.notification_status = data[k].notification_status
                FaultsDetail.date_originated = data[k].date_originated
                FaultsDetail.ip = data[k].ip
                FaultsDetail.software_update_available = data[k].unit_type && data[k].unit_type == "BRAVO" ? true: false

                FaultsDetail.privacy_checked = await getPrivacyChecked(data[k].serial_num)
                const unitContact = await getUnitContact(data[k].serial_num)
                FaultsDetail.online_access_active = unitContact.online_access_active
                FaultsDetail.contact.first_name = unitContact.first_name
                FaultsDetail.contact.last_name = unitContact.last_name
                FaultsDetail.contact.email = unitContact.email
                FaultsDetail.contact.phone = unitContact.phone
                FaultsDetail.notes = await getNoteArray(data[k].note)


                CycleFaults.data.push(FaultsDetail)
            }
        }

        return CycleFaults

    } catch (error) {
        console.log("🚀 getCyclesFaults - error: ", error)
        console.log("🚀 getCyclesFaults - error stack: ", error.stack)
        return {}
    }
}




//return {} if cfid is not existed.
exports.getCFNotes = async (cfid) => {
    const { execute } = require('../tools/mysql.conn')
    const { getNoteArray } = require('./UsersData')
    const { changeTimeFormat } = require('./helpers')


    let notes = {
        "data":
            {
                "fault_id": "",
                "fault_date": "",
                "cycle_number": "",
                "cycle_fault": "",
                "report_id": "",
                "notes": []
            }
    }


    try {
        const sql = `SELECT idunits_cf_notifications, date_originated, cycle_number, cycle_fault, report_id, note FROM units_cf_notifications WHERE idunits_cf_notifications = ?`

        const sqlResult = await execute(sql, [cfid])
        const res = sqlResult[0]
        const sqldata = sqlResult && sqlResult != null ? sqlResult : []

        if (sqldata.length > 0) {
            notes.data.fault_id = res.idunits_cf_notifications
            notes.data.fault_date = await changeTimeFormat(res.date_originated)
            notes.data.cycle_number = res.cycle_number
            notes.data.cycle_fault = res.cycle_fault
            notes.data.report_id = res.report_id
            notes.data.notes = await getNoteArray(res.note)
            return notes
        }

        return {}
    } catch (error) {
        console.log("🚀 getCFNotes - error: ", error)
        console.log("🚀 getCFNotes - error stack: ", error.stack)
        return []
    }
}


exports.putCFNotes = async (cfid, user, date, note) => {


    const { execute } = require('../tools/mysql.conn')

    let result = {
                 "status": 0, // 0 = failure, 1= success,
                 "data": {
                    "insert_id": 0 //if update/no insert set to 0
                    }
                }

    try {
        let id = 0
        const SELECT_SQL = `SELECT idunits_cf_notifications, note FROM units_cf_notifications WHERE idunits_cf_notifications = ?`
        const SELECT_SQLResult = await execute(SELECT_SQL, [cfid])
        const SELECT_SQLDATA = SELECT_SQLResult && SELECT_SQLResult != null ? SELECT_SQLResult : []

        if (SELECT_SQLDATA.length > 0) {
            let currentNote = SELECT_SQLDATA[0].note
            id = parseInt(SELECT_SQLDATA[0].idunits_cf_notifications)
            console.log("currentNote === ", currentNote)

            if (currentNote == null) {
                currentNote = "[ " + "User: " + user + ", " + "Date: " + date + " ]\n" + note
            } else {
                currentNote = currentNote + "\n\n" + "[ " + "User: " + user + ", " + "Date: " + date + " ]\n" + note
            }
            const UPDATE_SQL = "UPDATE scican.units_cf_notifications SET note = ? WHERE idunits_cf_notifications = ?"
            const UPDATE_RES = await execute(UPDATE_SQL, [currentNote, cfid])

            if (UPDATE_RES.changedRows == '1') {
                result.status = 1
                result.data.insert_id = id
            }
        }

        return result
    } catch (error) {
        console.log("🚀 putCFNotes - error: ", error)
        console.log("🚀 putCFNotes - error stack: ", error.stack)
        return {}
    }
}






//return {} if no notes exist.
exports.getProductSNNotes = async (sn) => {
    const { execute } = require('../tools/mysql.conn')
    const { getNoteArray } = require('./UsersData')
    const { changeTimeFormat } = require('./helpers')


    let notes = {"data": []}


    try {
        const sql = `SELECT idunits_cf_notifications, date_originated, cycle_number, cycle_fault, report_id, note FROM units_cf_notifications WHERE serial_num = ? AND note IS NOT NULL`

        const sqlResult = await execute(sql, [sn])
        const res = sqlResult[0]
        const sqldata = sqlResult && sqlResult != null ? sqlResult : []

        if (sqldata.length > 0) {
            for (const k in sqldata) {
                // let faultData = {
                //     "fault_id": "",
                //     "date_originated": "",
                //     "cycle_number": "",
                //     "cycle_fault": "",
                //     "report_id": 0,
                //     "notes": []
                // }

                // faultData.fault_id = sqldata[k].idunits_cf_notifications
                // faultData.date_originated = await changeTimeFormat(sqldata[k].date_originated)
                // faultData.cycle_number = sqldata[k].cycle_number
                // faultData.cycle_fault = sqldata[k].cycle_fault
                // faultData.report_id = sqldata[k].report_id
                let totalnotes = await getNoteArray(sqldata[k].note)

                for (const j in totalnotes) {
                    let faultData = {
                        "fault_id": "",
                        "cycle_date": "",
                        "cycle_number": "",
                        "cycle_fault": "",
                        "report_id": 0,
                        "posted_by": "",
                        "note_date": "",
                        "note":""
                    }

                    faultData.fault_id = sqldata[k].idunits_cf_notifications
                    faultData.cycle_date = await changeTimeFormat(sqldata[k].date_originated)
                    faultData.cycle_number = sqldata[k].cycle_number
                    faultData.cycle_fault = sqldata[k].cycle_fault
                    faultData.report_id = sqldata[k].report_id
                    faultData.posted_by = totalnotes[j].user
                    faultData.note_date = totalnotes[j].date
                    faultData.note = totalnotes[j].note

                    //faultData.notes = totalnotes[j]
                    notes.data.push(faultData)
                }

                //notes.data.push(faultData)
            }
            return notes
        }

        return {}
    } catch (error) {
        console.log("🚀 getCFNotes - error: ", error)
        console.log("🚀 getCFNotes - error stack: ", error.stack)
        return []
    }
}



//Update units_cf_notifications and return {}
exports.putCycleFaults = async (fid, json) => {
    const { execute } = require('../tools/mysql.conn')

    const pending_for_action = json.pending_for_action == true ? 1 : 0
    const action_in_progress = json.action_in_progress == true ? 1 : 0
    const handeled_by = json.handeled_by != null ? json.handeled_by : ""
    const handeled_by_date = json.handeled_by_date != null ? json.handeled_by_date : "0000-00-00 00:00:00"

    try {
        const updateSQL = `UPDATE scican.units_cf_notifications SET pending_for_action = ?, action_in_progress = ?, handeled_by = ?, handeled_by_date = ? WHERE idunits_cf_notifications = ?`
        await execute(updateSQL, [pending_for_action, action_in_progress, handeled_by, handeled_by_date, fid])
        return {}
    } catch (error) {
        console.log("🚀 putCyclesFaults - error: ", error)
        console.log("🚀 putCyclesFaults - error stack: ", error.stack)
        return []
    }
}




//Update units_cf_notifications and return {}
exports.getProductSNCycles = async (sn, start_date, end_date) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD, addMinsinTime, changeTimeFormat, getCycleEventName, changeTypeToYYMMRR } = require('./helpers')
    const { getProductName } = require('./ProductsData')

    let today = await getYYYYMMDD(0)
    let thirty_days_ago = await getYYYYMMDD(30)

    let result = {"data":[]}


    const start_time = start_date != null ? await changeTypeToYYMMRR(start_date) : thirty_days_ago
    const end_time = end_date != null ? await changeTypeToYYMMRR(end_date) : today
    let type = await getProductName(sn)
    let tablename = ""
    if (type.charAt(0) == "H") {
        tablename = "printouts_hydrim_s3"
    } else if (type.charAt(0) == "S") {
        tablename = "printouts_statim_s3"
    } else if (type.charAt(0) == "B") {
        tablename = "printouts_bravo_s3"
    }
    let tableid = "id" + tablename


    try {
        if (tablename == "printouts_bravo_s3") {
            const sql = `SELECT ${tableid} AS ID, date_time, cycle_complete_time, cycle_end_time, serial_num, cycle_number, cycle_fault, cycle_end_event FROM ${tablename} WHERE serial_num = ? AND year_month_day >= ? AND year_month_day <= ?`

            const sqlResult = await execute(sql, [sn, start_time, end_time])
            const res = sqlResult[0]
            const data = sqlResult && sqlResult != null ? sqlResult : []

            console.log("this is bravo")
            if(data.length > 0) {
                for (const k in data) {
                    let cycledata = {
                        "cid": "",
                        "start": "",
                        "end": "",
                        "cycle_number": "",
                        "serial_number": "",
                        "cycle_fault": "",
                        "cycle_event": ""
                    }
                    cycledata.cid = data[k].ID
                    cycledata.start = await changeTimeFormat(data[k].date_time)
                    cycledata.end = await changeTimeFormat(data[k].cycle_end_time)
                    cycledata.cycle_number = data[k].cycle_number
                    cycledata.serial_number = data[k].serial_num
                    cycledata.cycle_fault = data[k].cycle_fault

                    if (cycledata.cycle_fault != ""){
                        cycledata.cycle_event = "CYCLE_FAULT"
                    } else {
                        cycledata.cycle_event = "CYCLE_COMPLETE"
                    }
                    result.data.push(cycledata)
                }
            }
        } else {
            const sql = `SELECT ${tableid} AS ID, date_time, cycle_complete_time, serial_num, cycle_number, cycle_fault, cycle_end_event_id FROM ${tablename} WHERE serial_num = ? AND year_month_day >= ? AND year_month_day <= ? AND cycle_number > 0`

            const sqlResult = await execute(sql, [sn, start_time, end_time])
            const res = sqlResult[0]
            const data = sqlResult && sqlResult != null ? sqlResult : []

            if(data.length > 0) {
                for (const k in data) {
                    let cycledata = {
                        "cid": "",
                        "start": "",
                        "end": "",
                        "cycle_number": "",
                        "serial_number": "",
                        "cycle_fault": "",
                        "cycle_event": ""
                    }
                    cycledata.cid = data[k].ID
                    cycledata.start = await changeTimeFormat(data[k].date_time)
                    cycledata.end = await addMinsinTime(data[k].date_time, 15)
                    cycledata.cycle_number = data[k].cycle_number
                    cycledata.serial_number = data[k].serial_num
                    cycledata.cycle_fault = data[k].cycle_fault
                    if (data[k].cycle_fault > 0) {
                        cycledata.cycle_event = "CYCLE_FAULT"
                    } else {
                        cycledata.cycle_event = await getCycleEventName(data[k].cycle_end_event_id)
                    }

                    result.data.push(cycledata)
                }
            }
        }

        return result
    } catch (error) {
        console.log("🚀 getProductSNCycles - error: ", error)
        console.log("🚀 getProductSNCycles - error stack: ", error.stack)
        return []
    }
}


exports.getCycleSNCID = async (sn, cid) => {
    const { execute } = require('../tools/mysql.conn')
    const { getYYYYMMDD, changeTimeFormat, getCycleEventName, getJSONPrintoutFileFromS3, getTXTCPTPrintoutFileFromS3 } = require('./helpers')
    const { getProductName, getBravoTempPressureFromCycleData,  getBravoTimeTemperaturePressure, getPrintoutsTempPressureFromCycleData, getPrintoutsSummaryFromTXT } = require('./ProductsData')

    try {
        let result = {"data":{}}
        console.log("sn === ", sn)
        let type = await getProductName(sn)
        let tablename = ""
        if (type.charAt(0) == "H") {
            tablename = "printouts_hydrim_s3"
        } else if (type.charAt(0) == "S") {
            tablename = "printouts_statim_s3"
        } else if (type.charAt(0) == "B") {
            tablename = "printouts_bravo_s3"
        }
        let tableid = "id" + tablename

        console.log("tablename === ", tablename)

        if (tablename == "printouts_bravo_s3") {
            const sql = `SELECT file_json, date_time, printout_file_name, year_month_day, cycle_number, cycle_fault, cycle_end_event, cycle_name FROM ${tablename} WHERE serial_num = ? AND ${tableid} = ?`

            const sqlResult = await execute(sql, [sn, cid])
            const data = sqlResult && sqlResult != null ? sqlResult : []

            if(data.length > 0) {
                //console.log("printoutfiles ===== ", await getPrintoutFileFromS3('printouts','2021/07/07/B20210707_00304_AJA00023.json'))
                result.data.cid = cid
                result.data.serial_number = sn
                result.data.model = await getProductName(sn)
                result.data.cycle_number = await data[0].cycle_number
                result.data.date = await changeTimeFormat(data[0].date_time)
                result.data.temperature_unit = "C"
                result.data.pressure_unit = "bar"

                let printout_file_name = data[0].printout_file_name
                result.data.printout_file_name = printout_file_name

                //012345678
                //B20210707_00304_AJA00023.json
                const year = printout_file_name.substr(1,4)
                const month = printout_file_name.substr(5,2)
                const day = printout_file_name.substr(7,2)

                const path = year + "/" + month + "/" + day + "/" + printout_file_name + ".json"


                result.data.summary_object = {}
                if (data[0].file_json == 1) {
                    const s3_data = await getJSONPrintoutFileFromS3('printouts', path)
                    result.data.chart = await getBravoTempPressureFromCycleData(s3_data)
                    //result.data.s3 = s3_data
                    const unit_data = s3_data.data

                    result.data.summary_object.machine_model = unit_data.machine_model
                    result.data.summary_object.serial_number = sn
                    result.data.summary_object.fw_version = unit_data.firmware_version
                    result.data.summary_object.current_cycle = unit_data.current_cycle
                    result.data.summary_object.program = unit_data.program
                    result.data.summary_object.temperature = unit_data.temperature
                    result.data.summary_object.pressure = unit_data.pressure
                    result.data.summary_object.process_time = unit_data.process_time
                    result.data.summary_object.stand_by = unit_data.stand_by
                    result.data.summary_object.pre_vacuum = unit_data.pre_vacuum
                    result.data.summary_object.drying_time = unit_data.drying_time
                    result.data.summary_object.water_measure = unit_data.water_measuring
                    result.data.summary_object.cycle_start = unit_data.cycle_start_time

                    result.data.summary_object.time_temperature_pressure = await getBravoTimeTemperaturePressure(s3_data)

                    result.data.summary_object.max_temp = {"time": unit_data.max_temperature_time, "temp": unit_data.max_temperature}
                    result.data.summary_object.min_temp = {"time": unit_data.min_temperature_time, "temp": unit_data.min_temperature}
                    result.data.summary_object.dry_pulse = unit_data.drying_pulse
                    result.data.summary_object.cycle_end = unit_data.cycle_end_time
                    result.data.summary_object.cycle_result = unit_data.cycle_result
                    result.data.summary_object.end_operator = unit_data.operator_end
                    result.data.summary_object.cycle_error = unit_data.cycle_error
                } else {
                    result.data.chart = {"temp":[],"pressure":[]}
                }

                result.data.summary = []
                result.data.status = data[0].cycle_name
                result.data.success = true

            }
        } else {
            const sql = `SELECT file_txt, file_cpt, date_time, printout_file_name, year_month_day, cycle_number, cycle_fault, cycle_end_event_id, cycle_name FROM ${tablename} WHERE serial_num = ? AND ${tableid} = ?`

            const sqlResult = await execute(sql, [sn, cid])
            const data = sqlResult && sqlResult != null ? sqlResult : []

            if(data.length > 0) {
                result.data.cid = cid
                result.data.serial_number = sn
                result.data.model = await getProductName(sn)
                result.data.cycle_number = await data[0].cycle_number
                result.data.date = await changeTimeFormat(data[0].date_time)
                result.data.temperature_unit = "C"
                result.data.pressure_unit = "kPa"


                let printout_file_name = data[0].printout_file_name
                result.data.printout_file_name = printout_file_name



                //012345678
                //S20210707_03551_320119D00003.txt
                const year = printout_file_name.substr(1,4)
                const month = printout_file_name.substr(5,2)
                const day = printout_file_name.substr(7,2)

                const txt_path = year + "/" + month + "/" + day + "/" + printout_file_name + ".txt"
                const cpt_path = year + "/" + month + "/" + day + "/" + printout_file_name + ".cpt"

                if (data[0].file_cpt == 1) {
                    const cpt_data = await getTXTCPTPrintoutFileFromS3('printouts', cpt_path)
                    result.data.chart = await getPrintoutsTempPressureFromCycleData(cpt_data)
                } else {
                    result.data.chart = {"temp":[],"press":[]}
                }

                if (data[0].file_txt == 1) {
                    const txt_data = await getTXTCPTPrintoutFileFromS3('printouts', txt_path)
                    result.data.summary = await getPrintoutsSummaryFromTXT(txt_data)
                } else {
                    result.data.summary = []
                }



                //result.data.txt = txt_data
                //result.data.cpt = cpt_data

                result.data.status = await getCycleEventName(data[0].cycle_end_event_id)
                result.data.success = true
            }
        }


        return result
    } catch (error) {
        console.log("🚀 getCycleSNCID - error: ", error)
        console.log("🚀 getCycleSNCID - error stack: ", error.stack)
        return {}
    }
}



//get Temperature and Pressure in Bravo from cycle data
exports.getBravoTempPressureFromCycleData = async (json) => {
    let cycle_data = {"temp":[], "pressure":[]}

    try {
        const detail_data = json.data.cycle_data
        if (detail_data) {
            let temp = ""
            let press = ""

            for (const k in detail_data) {
                const split = detail_data[k].split(";")
                if (split[2]) {
                    temp =  " " + split[2]
                    cycle_data.temp.push(temp.trim())
                }
                if (split[3]) {
                    press =  " " + split[3]
                    cycle_data.pressure.push(press.trim())
                }
            }
        }
        return cycle_data
    } catch (error) {
        console.log("🚀 getBravoTempPressureFromCycleData - error: ", error)
        console.log("🚀 getBravoTempPressureFromCycleData - error stack: ", error.stack)
        return {}
    }
}


//get Time, Temperature and Pressure from cycle data
exports.getBravoTimeTemperaturePressure = async (json)  =>  {
    let time_temperature_pressure = []

    try {
        const detail_data = json.data.cycle_data
        if (detail_data) {
            let TTP = {"time":"","tempe":"", "pressure":""}
            let time = ""
            let temp = ""
            let press = ""

            for (const k in detail_data) {
                const split = detail_data[k].split(";")
                if (split[0] && split[1]) {
                    time = split[0].trim() + " " + split[1].trim()
                    TTP.time = time
                }

                if (split[2]) {
                    temp = split[2].trim()
                    TTP.tempe = temp
                }
                if (split[3]) {
                    press = split[3].trim()
                    TTP.pressure = press
                }
                time_temperature_pressure.push(TTP)
            }
        }
        return time_temperature_pressure
    } catch (error) {
        console.log("🚀 getBravoTimeTemperaturePressure - error: ", error)
        console.log("🚀 getBravoTimeTemperaturePressure - error stack: ", error.stack)
        return {}
    }

}



//get Temperature and Pressure in Printouts from cycle data
exports.getPrintoutsTempPressureFromCycleData = async (cpt) => {

    let cycle_data = {"temp":[], "pressure":[]}

    try {
        if (cpt) {
            let temp = ""
            let press = ""
            const cpt_data = cpt.split("\n")
            //console.log("cpt_data ==== ", cpt_data)
            const cpt_length = cpt_data.length
            //console.log("cpt length ==== ", cpt_length)
            //length = 3, 1 and 2; length = 4, 2 and 3; length = 5, 2 and 3
            if (cpt_length == 3){
                temp = cpt_data[1].split(',')
                press = cpt_data[2].split(',')
            } else if (cpt_length > 3) {
                if (cpt_data[cpt_length - 1] != '') {
                    temp = cpt_data[cpt_length - 2].split(',')
                    press = cpt_data[cpt_length - 1].split(',')
                } else {
                    temp = cpt_data[cpt_length - 3].split(',')
                    press = cpt_data[cpt_length - 2].split(',')
                }
                //temp = cpt_data[2].split(',')
                //press = cpt_data[3].split(',')
            }

            for (const t in temp) {
                cycle_data.temp.push(temp[t])
            }
            for (const p in press) {
                cycle_data.pressure.push(press[p])
            }
        }
        return cycle_data
    } catch (error) {
        console.log("🚀 getPrintoutsTempPressureFromCycleData - error: ", error)
        console.log("🚀 getPrintoutsTempPressureFromCycleData - error stack: ", error.stack)
        return {}
    }
}





//get Temperature and Pressure in Printouts from cycle data
exports.getPrintoutsSummaryFromTXT = async (txt) => {

    let cycle_data = []

    try {
        if (txt) {
            const txt_data = txt.split("\n")
            for (const k in txt_data) {
                cycle_data.push(txt_data[k].replace("\r",""))
            }

        }
        return cycle_data
    } catch (error) {
        console.log("🚀 getPrintoutsSummaryFromTXT - error: ", error)
        console.log("🚀 getPrintoutsSummaryFromTXT - error stack: ", error.stack)
        return []
    }
}





//get
exports.getBravoOnlineAccessDetails = async (token) => {

    let cycle_data = []
    if (token == "" )
    try {
        if (txt) {
            const txt_data = txt.split("\r\n")
            for (const k in txt_data) {
                cycle_data.push(txt_data[k])
            }

        }
        return cycle_data
    } catch (error) {
        console.log("🚀 getPrintoutsSummaryFromTXT - error: ", error)
        console.log("🚀 getPrintoutsSummaryFromTXT - error stack: ", error.stack)
        return []
    }
}






//Update units_cf_notifications and return {}
exports.getFirmwareUpdate = async (model_name = null) => {
    const { execute } = require('../tools/mysql.conn')
    const { changeTimeFormat, getYYYYMMDD } = require('../utils/helpers')


    try {
        const sql = `SELECT  fd.fdid, fd.refid, fd.prefix, fd.prefix_number, um.model_general_name, fd.description, fd.adminnotes, fd.usernotes, fd.created, fdb.fdbid,  fdb.referenceid, fdb.filetype,fdb.bname
                    FROM filedownloads fd
                    INNER JOIN units_models um on um.prefix = fd.prefix 
                    INNER JOIN fdbuttons fdb on fdb.fdid = fd.fdid
                    WHERE um.prefix NOT LIKE '' 
                    AND fd.techaccess='yes'  
                    GROUP BY model_general_name,fdb.referenceid
                    ORDER BY model_general_name,fd.created DESC`
        const sqlResult = await execute(sql)
        const data = sqlResult && sqlResult != null ? sqlResult : []

        let result = {"data":[]}

        if (data.length > 0) {
            for (const k in data) {
                const model = data[k].model_general_name.replace(/-/g, " ")
                if (model_name != null && model != model_name) {
                    continue
                }

                let details = {
                    "model": "",
                    "image": "",
                    "current_version": "",
                    "latest_version": "",
                    "update_available": false,
                    "prefix": "",
                    "prefix_number": "",
                    "versions":[]
                 }
                
                 let versions = {
                     "id":0,
                     "name":"",
                     "created_at": "",
                     "files": [],
                     "release_notes": []
                 }

                 let files = {
                     "id": "",
                     "filename": "",
                     "filetype": "",
                     "reference_id": ""
                 }

                const image = ""

                const data_version = data[k].description
                let current_version = data_version
                let latest_version = ""
                let update_available = false
                const prefix = data[k].prefix
                const prefix_number = data[k].prefix_number
                const fdid = data[k].fdid
                const name = data[k].description
                const created_at = await changeTimeFormat(data[k].created)

                const created_at_time = created_at.substring(0, 10).replace(/-/g,"")
                const thirty_days_ago = await getYYYYMMDD(30)

                if (created_at_time > thirty_days_ago) {
                    update_available = true
                    latest_version = data_version
                }

                const fdbid = data[k].fdbid
                const filename = data[k].bname
                const filetype = data[k].filetype
                const reference_id = data[k].referenceid
                //noted test id 148
                let release_notes = data[k].usernotes.replace(/\n\n/g, "\n").split("\n")

                if (result.data.length == 0) {
                    details.model = model
                    details.image = image
                    details.current_version = current_version
                    details.latest_version = latest_version
                    details.update_available = update_available
                    details.prefix = prefix
                    details.prefix_number = prefix_number
                    versions.id = fdid
                    versions.name = name
                    versions.created_at = created_at
                    versions.release_notes.push(release_notes)

                    files.id = fdbid
                    files.filename = filename
                    files.filetype = filetype
                    files.reference_id = reference_id

                    versions.files.push(files)
                    details.versions.push(versions)
                    result.data.push(details)

                } else {
                    //always use the last element
                    const last_element = result.data[result.data.length - 1]
                    if (last_element.model != model) {
                        details.model = model
                        details.image = image
                        details.current_version = current_version
                        details.latest_version = latest_version
                        details.update_available = update_available
                        details.prefix = prefix
                        details.prefix_number = prefix_number
                        versions.id = fdid
                        versions.name = name
                        versions.created_at = created_at
                        versions.release_notes.push(release_notes)

                        files.id = fdbid
                        files.filename = filename
                        files.filetype = filetype
                        files.reference_id = reference_id

                        versions.files.push(files)
                        details.versions.push(versions)
                        result.data.push(details)

                    } else {
                        files.id = fdbid
                        files.filename = filename
                        files.filetype = filetype
                        files.reference_id = reference_id

                        const version_last_index = result.data[result.data.length - 1].versions.length - 1

                        if (result.data[result.data.length - 1].versions[version_last_index].created_at == created_at) {
                            result.data[result.data.length - 1].versions[version_last_index].files.push(files)
                        } else {
                            versions.id = fdid
                            versions.name = name
                            versions.created_at = created_at
                            versions.release_notes.push(release_notes)
                            versions.files.push(files)
                            result.data[result.data.length - 1].versions.push(versions)
                        }


                    }//end in last_element.model != model
                }// end in result data length

                //check current verision
                if (result.data[result.data.length - 1].update_available && !result.data[result.data.length - 1].versions[1]) {
                    result.data[result.data.length - 1].current_version = ""
                } else if (result.data[result.data.length - 1].update_available && result.data[result.data.length - 1].versions[1]) {
                    result.data[result.data.length - 1].current_version = result.data[result.data.length - 1].versions[1].name
                }

            } //end is for const k in in data
        }// end if data length

        return result
    } catch (error) {
        console.log("🚀 getFirmwareUpdate - error: ", error)
        console.log("🚀 getFirmwareUpdate - error stack: ", error.stack)
        return {}
    }
}




//Update fdbuttons table to set numofdownloads + 1
exports.UpdateFirmwareUpdateFiles = async (fid) => {
    const { execute } = require('../tools/mysql.conn')

    try {
        let result = {"status": 0}
        const sql = `UPDATE fdbuttons SET numofdownloads=numofdownloads+1 WHERE fdbid = ?`
        const sqlRes = await execute(sql, [fid])
        //update is changedRows
        if (sqlRes.changedRows == '1') {
            result.status = 1
        }
        return result
    } catch (error) {
        console.log("🚀 UpdateFirmwareUpdateFiles - error: ", error)
        console.log("🚀 UpdateFirmwareUpdateFiles - error stack: ", error.stack)
        return {}
    }
}




//Update fdbuttons table to set numofdownloads + 1
exports.UpdateUsersDownloadTracking = async (filename, refid, prefix, prefixNumber, username, userip, country) => {
    const { execute } = require('../tools/mysql.conn')
    const { getUserDetails } = require('../utils/UsersData')


    try {
        let result = {"status": 0}
        if (username && username != "") {
            const user_detail = await getUserDetails(username)
            const idusers = user_detail.user_id
            const sql = `INSERT INTO users_s_download_tracking (filename, refid, prefix, prefix_number, idusers, username, userip, country, date )
          VALUES ('${filename}', '${refid}',  '${prefix}',  '${prefixNumber}',  '${idusers}',  
          '${username}', '${userip}', '${country}', NOW())`

            const sqlRes = await execute(sql)
            //insert is affectedRows
            if (sqlRes.affectedRows == '1') {
                result.status = 1
            }
        }

        return result
    } catch (error) {
        console.log("🚀 UpdateUsersDownloadTracking - error: ", error)
        console.log("🚀 UpdateUsersDownloadTracking - error stack: ", error.stack)
        return {}
    }
}


//Get serial number notifications.
exports.getSNNotifications = async (sn) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {"data": []}

        const sql = `SELECT * FROM users_email_list_product_notif en 
            LEFT JOIN cycle_notification_type ct ON en.cycle_notification = ct.idcycle_notification_type 
            WHERE serial_number = '${sn}'`

        const sqlResult = await execute(sql)
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data.length > 0) {
            for (const k in data) {
                let notification = {
                    "id": "",
                    "email": "",
                    "cycle_notification_option": ""
                }

                notification.id = data[k].idusers_email_list_product_notif
                notification.email = data[k].recipient
                notification.cycle_notification_option = data[k].cycle_notification

                result.data.push(notification)
            }
        }

        return result
    } catch (error) {
        console.log("🚀 getProductsNotifications - error: ", error)
        console.log("🚀 getProductsNotifications - error stack: ", error.stack)
        return {}
    }
}


//Insert notifications into users_email_list_product_notif
exports.InsertUserNotifications = async (user, recipient, serial_number, model, cycle_notification_option) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {
            "status": 0,
            "data": {"insert_id": 0}
        }

        const sql = `INSERT INTO users_email_list_product_notif
              (useremail, serial_number, recipient, cycle_notification, model_general_name, created_at, updated_at)
              VALUES ('${user}', '${serial_number}', '${recipient}', '${cycle_notification_option}', '${model}', NOW(), NOW())`

        const sqlResult = await execute(sql)

        if (sqlResult.affectedRows == '1') {
            result.status = 1
            result.data.insert_id = sqlResult.insertId
        }
        return result
    } catch (error) {
        console.log("🚀 InsertUserNotifications - error: ", error)
        console.log("🚀 InsertUserNotifications - error stack: ", error.stack)
        return {}
    }
}




 //Inset uset notification in users_email_list_product_notif
exports.InsertUserNotifications = async (user, recipient, serial_number, model, cycle_notification_option) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {
            "status": 0,
            "data": {"insert_id": 0}
        }

        const sql = `INSERT INTO users_email_list_product_notif
              (useremail, serial_number, recipient, cycle_notification, model_general_name, created_at, updated_at)
              VALUES ('${user}', '${serial_number}', '${recipient}', '${cycle_notification_option}', '${model}', NOW(), NOW())`

        const sqlResult = await execute(sql)

        if (sqlResult.affectedRows == '1') {
            result.status = 1
            result.data.insert_id = sqlResult.insertId
        }
        return result
    } catch (error) {
        console.log("🚀 InsertUserNotifications - error: ", error)
        console.log("🚀 InsertUserNotifications - error stack: ", error.stack)
        return {}
    }
}


//Update cycle_notification in users_email_list_product_notif
exports.UpdateCycleNotifications = async (id, cycle_notification) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {"status": 0}
        const sql = `UPDATE users_email_list_product_notif
                      SET cycle_notification = '${cycle_notification}', updated_at = NOW()
                  WHERE idusers_email_list_product_notif = '${id}'`
        const sqlRes = await execute(sql)
        //update is changedRows
        if (sqlRes.changedRows == '1') {
            result.status = 1
        }
        return result
    } catch (error) {
        console.log("🚀 UpdateCycleNotifications - error: ", error)
        console.log("🚀 UpdateCycleNotifications - error stack: ", error.stack)
        return {}
    }
}


//Delete users_email_list_product_notif from ID
exports.DeleteNotifications = async (id) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {"status": 0}
        const sql = `DELETE FROM users_email_list_product_notif
                  WHERE idusers_email_list_product_notif = '${id}'`
        const sqlRes = await execute(sql)

        //update is changedRows
        if (sqlRes.affectedRows == '1') {
            result.status = 1
        }
        return result
    } catch (error) {
        console.log("🚀 DeleteNotifications - error: ", error)
        console.log("🚀 DeleteNotifications - error stack: ", error.stack)
        return {}
    }
}





//Delete users_email_list_product_notif from ID
exports.DeleteNotifications = async (id) => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {"status": 0}
        const sql = `DELETE FROM users_email_list_product_notif
                  WHERE idusers_email_list_product_notif = '${id}'`
        const sqlRes = await execute(sql)

        //update is changedRows
        if (sqlRes.affectedRows == '1') {
            result.status = 1
        }
        return result
    } catch (error) {
        console.log("🚀 DeleteNotifications - error: ", error)
        console.log("🚀 DeleteNotifications - error stack: ", error.stack)
        return {}
    }
}



//Delete users_email_list_product_notif from ID
exports.getCycleNotificationType = async () => {
    const {execute} = require('../tools/mysql.conn')

    try {
        let result = {"data": []}
        const sql = `SELECT idcycle_notification_type AS id, type FROM cycle_notification_type`

        const sqlResult = await execute(sql)
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data.length > 0) {
            for (const k in data) {
                result.data.push(data[k])
            }
        }
        return result
    } catch (error) {
        console.log("🚀 getCycleNotificationType - error: ", error)
        console.log("🚀 getCycleNotificationType - error stack: ", error.stack)
        return {}
    }
}