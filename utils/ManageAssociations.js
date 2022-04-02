
const { object } = require('@hapi/joi')
const { generateRandomValue } = require('./helpers')

/**
 * Insert into online_access_email_request_table when a user requests for an association email.
 * This is used to check that the right user is trying to associate from the email link that was clicked
 * 
 * @param {string} serial_number 
 * @param {string} email 
 * @returns boolean
 */
exports.saveAssociationEmailRequest = async (serial_number, email) => {
  try {
    const { execute } = require('../tools/mysql.conn')
    const sql = `INSERT INTO online_access_email_request (serial_num, account_email, request_date)
              Values (?, ?, NOW() )`

    const queryResult = await execute(sql, [serial_number, email])
    const res = queryResult

    return (Object.keys(res).length > 0 && res.affectedRows  != null) ? Boolean(res.affectedRows) : false
  } catch (error) {
    console.log("🚀 0 - saveAssociationEmailRequest- error:", error)
    console.log("🚀 0.1 - saveAssociationEmailRequest - error:", error.stack)
    return null
  }
}

const updateAssociationEndDate = async (user_email, serial_num, ca_active_ref_id) => {
  try {
    const { execute } = require('../tools/mysql.conn')

    const sql1 = `UPDATE scican.customers_units_assoc_dates SET
      linked_to_user_end_date=NOW(),
          data_updated=NOW()
      WHERE ca_active_ref_id=? AND user_email=? AND serial_num=?`

    const sqlResult2 = await execute(sql1, [ca_active_ref_id, user_email, serial_num])
  } catch (error) {
    console.log("🚀 0.updateAssociationEndDate - error:", error)
    console.log("🚀 0.1.updateAssociationEndDate - error:", error.stack)
  }
  
}

const insertAssociationDate = async (user_id, useremail, serial_num, ref_id) => {
  //Insert into customers_units_assoc_dates
  try {
    const { execute } = require('../tools/mysql.conn')

    const sql4 = `INSERT INTO scican.customers_units_assoc_dates
            (idusers, user_email, serial_num, ca_active_ref_id, linked_to_user_start_date, cycle_count_at_conf_assoc, data_updated)
            VALUES (?, ?, ?, ?, NOW(), 0, NOW())`

    const sqlResult4 = await execute(sql4, [user_id, useremail, serial_num, ref_id])
  } catch (error) {
    console.log("🚀 0.insertAssociationDate - error:", error)
    console.log("🚀 0.1.insertAssociationDate - error:", error.stack)
  }
  
}


exports.disassociate = async (user_email, serial_num, ca_active_ref_id = null) => {
  try {
    const { execute } = require('../tools/mysql.conn')

      const sql = `UPDATE scican.customers_units SET
          association_active=0,
          association_from=NULL,
          ca_active_ref_id=${ca_active_ref_id},
          web_conf_confirmed=0,
          web_conf_confirmed_date='0000-00-00 00:00:00',
          email_conf_sent_by_unit=0,
          email_conf_sent_by_unit_date='0000-00-00 00:00:00',
          current_location_date='0000-00-00 00:00:00',
          latest_oas_update_date=NOW()
      WHERE user_email=? AND serial_num=?`

      const sqlResult = await execute(sql, [user_email, serial_num])

      await updateAssociationEndDate(user_email, serial_num, ca_active_ref_id)

      return sqlResult ? Boolean(sqlResult.affectedRows) : false
      //return sqlResult[0] ? Boolean(sqlResult[0].affectedRows) : false

  } catch (error) {
      console.log("🚀 0.disassociate - error:", error)
      console.log("🚀 0.1.disassociate - error:", error.stack)
  }
}

exports.updateAssociation = async (user_email, serial_num, ca_active_ref_id) => {
  try {
    const { execute } = require('../tools/mysql.conn')

    const sql = `UPDATE scican.customers_units 
          SET web_conf_confirmed = 1,
          web_conf_confirmed_date = NOW(),
          email_conf_sent_by_unit = 1,
          email_conf_sent_by_unit_date = NOW(),
          prev_associations_active = prev_associations_active+1,
          association_active = 1,
          ca_active_ref_id = ?,
          latest_oas_update_date=NOW()
          WHERE user_email = ? AND serial_num = ?`

    const sqlResult = await execute(sql, [ca_active_ref_id, user_email, serial_num])

    // update unit associate dates table
    await insertAssociationDate(user_id, user_email, serial_num, ca_active_ref_id)
      

    return sqlResult ? Boolean(sqlResult.affectedRows) : false

  } catch (error) {
      console.log("🚀 0.updateAssociation - error:", error)
      console.log("🚀 0.1.updateAssociation - error:", error.stack)
  }
}

exports.insertAssociation = async (user_id, useremail, serial_num, ref_id) => {
  try {
    const { execute } = require('../tools/mysql.conn')
      const sql = `INSERT INTO customers_units
                (idusers,user_email,prev_associations_active,association_active,serial_num,ca_active_ref_id,latest_oas_update_date,idunits_warranties,web_conf_confirmed, web_conf_confirmed_date,email_conf_sent_by_unit,email_conf_sent_by_unit_date) 
                VALUES (?,?,1,1,?,?,NOW(),0,1,NOW(),1,NOW())`

      const sqlResult = await execute(sql, [user_id, useremail, serial_num, ref_id])

      return sqlResult ? Boolean(sqlResult.affectedRows) : false

  } catch (error) {
      console.log("🚀 0.insertAssociation - error:", error)
      console.log("🚀 0.1.insertAssociation - error:", error.stack)
  }
}


//Force associate. Diassociate unit first then asssociate to current customer.
exports.AssociateUnit = async (params, connection) => {
  const { user_id, useremail, serial_num} = params

  if(!user_id || user_id == null || !serial_num || serial_num == null || !useremail || useremail == null) {
      return false
  }
  
  let userPrevAssociated = false
  let diff_assoc_email = ''
  let isDisassociated = true
  let ass_active = 0
  let associationComplete = false
  let ca_active_ref_id = ''
  let diff_user_ref_id = ''
  let ref_id = generateRandomValue()

  try {
    const { execute } = require('../tools/mysql.conn')

    const sql = `SELECT * FROM customers_units WHERE serial_num = ?`
    

    const sqlResult = await execute(sql, [serial_num])
    const res = sqlResult[0]

    const data = sqlResult ? sqlResult : []

    if ( data ) {
        for( const k in data ) {
            ass_active = data[k].association_active
            if(useremail == data[k].user_email) {
                userPrevAssociated = true
                ca_active_ref_id = data[k].ca_active_ref_id

                if(ass_active) {
                    isDisassociated = false
                }
            }

            if(ass_active && data[k].user_email !== useremail) {
                diff_assoc_email = data[k].user_email
                diff_user_ref_id = data[k].ca_active_ref_id
                isDisassociated = false
            }
        }
    }

    // disassociate previously associated unit 
    if(diff_assoc_email) {
        //update customers_units table, set association_active=0
        const sql1 = `UPDATE scican.customers_units SET
        association_active=0,
        association_from=NULL,
        ca_active_ref_id=NULL,
        web_conf_confirmed=0,
        web_conf_confirmed_date='0000-00-00 00:00:00',
        email_conf_sent_by_unit=0,
        email_conf_sent_by_unit_date='0000-00-00 00:00:00',
        current_location_date='0000-00-00 00:00:00',
        latest_oas_update_date=NOW()
        WHERE user_email= ? AND serial_num= ? `

        const sqlResult1 = await execute(sql1, [diff_assoc_email, serial_num])

        //set prev_assoc_email to empty
        isDisassociated = sqlResult1 ? sqlResult1.changedRows : false

        //update ustomers_units_assoc_dates table, set linked_to_user_end_date to now()
        const sql2 = `UPDATE scican.customers_units_assoc_dates 
                    SET linked_to_user_end_date=NOW(), data_updated=NOW() 
                    WHERE ca_active_ref_id = ? AND user_email = ? AND serial_num = ?`

            const sqlResult2 = await execute(sql2, [diff_user_ref_id, diff_assoc_email, serial_num])

    }

    //if current user has previous associated but is not associated
    if (userPrevAssociated && isDisassociated) {
        //Update customers_units table set association_active=1
        const sql3 = `UPDATE scican.customers_units SET web_conf_confirmed=1,
            web_conf_confirmed_date=NOW(),email_conf_sent_by_unit=1,email_conf_sent_by_unit_date=NOW(),
            prev_associations_active=prev_associations_active+1,association_active=1,
            ca_active_ref_id= ?,latest_oas_update_date=NOW()
            WHERE serial_num= ? AND user_email= ?`

        const sqlResult3 = await execute(sql3, [ca_active_ref_id, serial_num, useremail])
        
        ref_id = ca_active_ref_id

        associationComplete = sqlResult3 ? sqlResult3.changedRows : false
    } else if(!userPrevAssociated && isDisassociated) {
        //Insert new data into customers_units table
        const sql6 = `INSERT INTO customers_units
        (idusers,user_email,prev_associations_active,association_active,serial_num,ca_active_ref_id,latest_oas_update_date,idunits_warranties,web_conf_confirmed, web_conf_confirmed_date,email_conf_sent_by_unit,email_conf_sent_by_unit_date) 
        VALUES (?,?,1,1,?,?,NOW(),0,1,NOW(),1,NOW())`

        const sqlResult6 = await execute(sql6, [user_id, useremail, serial_num, ref_id])

        associationComplete = sqlResult6 ? sqlResult6.affectedRows : false

        
    }

    //if insert/update of customer_units table was successfull, insert into customer_units_assoc_dates.
    if(associationComplete) {
        //Insert into customers_units_assoc_dates
        const sql4 = `INSERT INTO scican.customers_units_assoc_dates
                        (idusers,
                        user_email,
                        serial_num,
                        ca_active_ref_id,
                        linked_to_user_start_date,
                        cycle_count_at_conf_assoc,
                        data_updated)
                        VALUES
                        (?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        0,
                        NOW())`

        const sqlResult4 = await execute(sql4, [user_id, useremail, serial_num, ref_id])
    }

    return associationComplete
      
  } catch (error) {
      console.log("🚀 0.AssociateUnit - error:", error)
      console.log("🚀 0.1.AssociateUnit - error:", error.stack)
      return null
  }
}



exports.RequestAssociationHelp = async(serial_num=null, useremail, user_id) => {
    const { execute } = require('../tools/mysql.conn')
    const { generateRandomValue } = require('../utils/helpers')

    //let result = {"status": 0, "message":""}
    let result = {
        "status": 0,
        "message": "",
        "token": ""
    }


    let userPrevAssociated = false
    let diff_assoc_email = ''
    let isDisassociated = true
    let ass_active = 0
    let associationComplete = false
    let ca_active_ref_id = ''
    let diff_user_ref_id = ''
    let ref_id = generateRandomValue()

    try {
        if (serial_num != "") {
            const sql = `SELECT * FROM customers_units WHERE serial_num = ?`

            const sqlResult = await execute(sql, [serial_num])
            const data = sqlResult ? sqlResult : []
            let error = {
                "code": "",
                "message": ""
            }

            if ( data ) {
                for( const k in data ) {
                    ass_active = data[k].association_active
                    if(useremail == data[k].user_email) {
                        userPrevAssociated = true
                        ca_active_ref_id = data[k].ca_active_ref_id

                        if(ass_active) {
                            isDisassociated = false
                        }
                    }

                    if(ass_active && data[k].user_email !== useremail) {
                        diff_assoc_email = data[k].user_email
                        diff_user_ref_id = data[k].ca_active_ref_id
                        isDisassociated = false
                    }
                }
            } else {
                error.code = "SNNotExist"
                error.message = "The serial number does not exist"
                result.error = error
                //result.message = "The serial number does not exist"
            }

            //This unit is asssociated with another customer.
            if(diff_assoc_email) {
                error.code = "ContactCustomerServices"
                error.message = "An online access already exists for this machine. Please call customer services for further assistance. CA: 1-800-667-7733, US: 1-800-572-1211, EU: +49 (0)7561 98343 - 0, DE: +49 (0)7561 98343 - 0"
                result.error = error
                //result.message = "Currently unavailable. Please contact customer service for help"
                return result
            } else if (userPrevAssociated && !isDisassociated) {
                error.code = "AlreadyActive"
                error.message = "Your online access is already active for this machine"
                result.error = error
                //result.message = "This unit is already associated with you"
                return result
            }

            //if current user has previous associated but is not associated
            if (userPrevAssociated && isDisassociated) {
                //Update customers_units table set association_active=1
                const sql3 = `UPDATE scican.customers_units SET web_conf_confirmed=1,
            web_conf_confirmed_date=NOW(),email_conf_sent_by_unit=1,email_conf_sent_by_unit_date=NOW(),
            prev_associations_active=prev_associations_active+1,association_active=1,
            ca_active_ref_id= ?,latest_oas_update_date=NOW()
            WHERE serial_num= ? AND user_email= ?`

                const sqlResult3 = await execute(sql3, [ca_active_ref_id, serial_num, useremail])

                ref_id = ca_active_ref_id

                associationComplete = sqlResult3 ? sqlResult3.changedRows : false
            } else if(!userPrevAssociated && isDisassociated) {
                //Insert new data into customers_units table
                const sql6 = `INSERT INTO customers_units
        (idusers,user_email,prev_associations_active,association_active,serial_num,ca_active_ref_id,latest_oas_update_date,idunits_warranties,web_conf_confirmed, web_conf_confirmed_date,email_conf_sent_by_unit,email_conf_sent_by_unit_date) 
        VALUES (?,?,1,1,?,?,NOW(),0,1,NOW(),1,NOW())`

                const sqlResult6 = await execute(sql6, [user_id, useremail, serial_num, ref_id])

                associationComplete = sqlResult6 ? sqlResult6.affectedRows : false
            }

            //if insert/update of customer_units table was successfull, insert into customer_units_assoc_dates.
            if(associationComplete) {
                //Insert into customers_units_assoc_dates
                const sql4 = `INSERT INTO scican.customers_units_assoc_dates
                        (idusers,
                        user_email,
                        serial_num,
                        ca_active_ref_id,
                        linked_to_user_start_date,
                        cycle_count_at_conf_assoc,
                        data_updated)
                        VALUES
                        (?,
                        ?,
                        ?,
                        ?,
                        NOW(),
                        0,
                        NOW())`

                await execute(sql4, [user_id, useremail, serial_num, ref_id])
                result.status = 1
            }
        }
        return result
    } catch (error) {
        console.log("🚀 0.RequestAssociationHelp - error:", error)
        console.log("🚀 0.1.RequestAssociationHelp - error:", error.stack)
        return {}
    }
}





//NOT force to associate.
exports.RequestAssociation = async (serial_number=null, useremail, token) => {
    const { execute } = require('../tools/mysql.conn')
    const { getUserDetails, getBravoTokenDetails } = require('../utils/UsersData')
    const { RequestAssociationHelp } = require('../utils/ManageAssociations')

    try {

        //let result = {"status": 0, "message":""}
        let result = {
            "status": 0,
            "message": "",
            "token": ""
        }

        let response = []
        let error = {
            "code": "",
            "message": ""
        }


        //Check user exist or not first.
        const userDetails = await getUserDetails(useremail)
        const user_id = userDetails.user_id
        if (!user_id || user_id == null || user_id == '') {
            error.code = "UserNotProvided"
            error.message = "No user was found for this machine"
            result.error = error
            response.push(result)
            return response
        }

        //Bravo G4, SN is in online_access_token table
        let serial_num_array = []
        if (serial_number) {
            result = await RequestAssociationHelp(serial_number, useremail, user_id)
            result.sn = serial_number
            response.push(result)
        } else if (token != "") {
            let token_array = token.split(",")
            for (const k in token_array) {
                const Bravo_details = await getBravoTokenDetails(token_array[k])
                const serial_num = Bravo_details.serial_number || ""
                const token_active = Bravo_details.is_active || ""
                serial_num_array.push([serial_num, token_active, token_array[k]])
            }

            for (const j in serial_num_array) {
                //token_active != 1
                if (serial_num_array[j][1] != 1) {
                    error.code = "TokenExpired"
                    error.message = "This token has expired. Please check your machine for the latest token"
                    result.error = error
                    //result.message = "This token has expired. Please check your machine for the latest token"
                } else {
                    result = await RequestAssociationHelp(serial_num_array[j][0],useremail,user_id)
                }
                result.token = serial_num_array[j][2]
                response.push(result)
            }
        } else {
            error.code = "SNNotProvided"
            error.message = "Serial number not provided"
            result.error = error
            response.push(result)
        }

        return response
    } catch (error) {
        console.log("🚀 AssociateUnitByAPI - error:", error)
        console.log("🚀 AssociateUnitByAPI - error:", error.stack)
        return []
    }
}

//Need to make sure this SN is not associating with the customer now.
exports.AssociationInPending = async (user_id, useremail, serial_num, ref_id) => {
    try {
        const {execute} = require('../tools/mysql.conn')
        const {getWarrantyBySn} = require('../warranties/Warranties')

        let sql, sqlResult
        let idunits_warranties = 0

        const waranty_data = await getWarrantyBySn(serial_num)

        if (waranty_data.length > 0) {
            idunits_warranties = waranty_data[0].idunits_warranties
        }

        const checksql = `SELECT * FROM customers_units WHERE user_email = ? AND serial_num = ?`
        const checksqlRes = await execute(checksql, [useremail, serial_num])
        if (checksqlRes.length > 0) {
            //Update web_conf_confirmed and email_conf_sent_by_unit to 1 to display pending.
            sql = `UPDATE scican.customers_units SET
                      association_active=0,
                      association_from=NULL,
                      ca_active_ref_id=?,
                      idunits_warranties=?, 
                      web_conf_confirmed=1, 
                      web_conf_confirmed_date=NOW(),
                      email_conf_sent_by_unit=1,
                      email_conf_sent_by_unit_date=NOW(),                     
                      current_location_date='0000-00-00 00:00:00',
                      latest_oas_update_date=NOW()
                  WHERE user_email=? AND serial_num=?`
            sqlResult = await execute(sql, [ref_id, idunits_warranties, useremail, serial_num])
        } else {
            sql = `INSERT INTO customers_units
                (idusers,user_email,prev_associations_active,association_active,serial_num,ca_active_ref_id,latest_oas_update_date,idunits_warranties,web_conf_confirmed, web_conf_confirmed_date,email_conf_sent_by_unit,email_conf_sent_by_unit_date) 
                VALUES (?,?,0,0,?,?,NOW(),?,1,NOW(),1,NOW())`
            sqlResult = await execute(sql, [user_id, useremail, serial_num, ref_id, idunits_warranties])
        }
        return sqlResult ? Boolean(sqlResult.affectedRows) : false

    } catch (error) {
        console.log("🚀 0.AssociationInPending - error:", error)
        console.log("🚀 0.1.AssociationInPending - error:", error.stack)
        return false
    }
}


//Check the unit has warranty with giving email
exports.CheckUnitEmailWarranty = async (serial_num, useremail) => {
    try {
        const {execute} = require('../tools/mysql.conn')

        let result = {"status": 0}

        if (!serial_num || !useremail) {
            return result
        }


        const sql = `SELECT * FROM units_warranties WHERE serial_num = ? AND customer_email = ?`
        const sqlResult = await execute(sql, [serial_num, useremail])

        if (sqlResult.length > 0) {
            result.status = 1
        }

        return result
    } catch (error) {
        console.log("🚀 0.CheckUnitEmailWarranty - error:", error)
        console.log("🚀 0.1.CheckUnitEmailWarranty - error:", error.stack)
        return {}
    }
}


//Check the unit has warranty with giving email
exports.CheckUnitEmailAssociation = async (serial_num, useremail) => {
    try {
        const {execute} = require('../tools/mysql.conn')

        let result = {"status": 0}

        if (!serial_num || !useremail) {
            return result
        }
        let association_active = 0

        const sql = `SELECT association_active FROM customers_units WHERE serial_num = ? AND user_email = ? ORDER BY idcustomers_units DESC LIMIT 1`
        const sqlResult = await execute(sql, [serial_num, useremail])

        if (sqlResult.length > 0) {
            association_active = sqlResult[0].association_active
            if (association_active == 1) {
                result.status = 1
            }
        }

        return result
    } catch (error) {
        console.log("🚀 0.CheckUnitEmailAssociation - error:", error)
        console.log("🚀 0.1.CheckUnitEmailAssociation - error:", error.stack)
        return {}
    }
}

