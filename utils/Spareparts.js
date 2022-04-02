/**
 * Return spare parts components
 *
 * @param {string}
 * @returns {array}
 */
exports.GetSparepartComponents = async (component_item = "") => {
    const {execute} = require('../tools/mysql.conn')
    const {GetProductsSparepartsBlackList} = require('../utils/Spareparts')

    let result = []

    try {
        let blacklist_condition = " "
        const blacklist = await GetProductsSparepartsBlackList()

        if (blacklist) {
            for (const k in blacklist) {
                blacklist_condition = "\'" + blacklist[k] + "\'" + "," + blacklist_condition
            }

            blacklist_condition = blacklist_condition.slice(0, -2)
            blacklist_condition = " AND LEFT(component_item_part, 2) NOT IN (" + blacklist_condition + ") "
        }

        const sql = `SELECT * 
                     FROM (
                          SELECT cast(substring(LEVLL,-1) as unsigned) as level, component_item, 
                            idproducts_spare_parts_components_items as id, parent_id,
                            component_item_part, count(component_item_part) as cipc, description
                          FROM products_spare_parts_components_items
                          WHERE component_item like '%${component_item}%'
                          ${blacklist_condition}
                          GROUP BY component_item_part
                          ORDER BY idproducts_spare_parts_components_items asc
                        ) as t1 
                     WHERE level='1'`

        const sqlResult = await execute(sql)
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data) {
            result = data
        }

        return result
    } catch (error) {
        console.log("🚀 GetSparepartComponents - error: ", error.message)
        console.log("🚀 GetSparepartComponents - error stack: ", error.stack)
        return {}
    }
}


/**
 * Return total spareparts
 *
 * @param {string}
 * @returns {string}
 */
exports.GetTotalSpareparts = async (model_id = "", search = "") => {
    const {execute} = require('../tools/mysql.conn')
    let result = 0

    try {
        let search_condition = " WHERE (component_item LIKE '%" + search + "%' OR description LIKE '%" + search + "%')"
        let model_id_condition = ""
        if (model_id) {
            model_id_condition = " AND product_model_id='" + model_id + "'"
        }

        const sql = `SELECT 1
                     FROM (
                          SELECT t1.product_model_id, t1.component_item, t1.description, t2.image_ref, t2.image_mime_type, t2.image_name 
                          FROM scican.products_spare_parts as t1 
                          LEFT JOIN scican.products_spare_parts_images as t2 ON t1.component_item=t2.component_item
                    ) as t 
                    ${search_condition}
                    ${model_id_condition}
                    GROUP BY component_item 
                    ORDER BY description asc`

        const sqlResult = await execute(sql)

        if (sqlResult) {
            result = sqlResult.length
        }

        return result
    } catch (error) {
        console.log("🚀 GetTotalSpareparts - error: ", error.message)
        console.log("🚀 GetTotalSpareparts - error stack: ", error.stack)
        return {}
    }
}


/**
 * Return total spareparts
 *
 * @param {string}
 * @returns {string}
 */
exports.GetProductsSparepartsBlackList = async () => {
    const {execute} = require('../tools/mysql.conn')
    let result = []

    try {

        const sql = `SELECT spbl_value FROM products_spare_parts_black_list`

        const sqlResult = await execute(sql)

        if (sqlResult) {
            for (const k in sqlResult) {
                result.push(sqlResult[k].spbl_value)
            }
        }

        return result
    } catch (error) {
        console.log("🚀 GetTotalSpareparts - error: ", error.message)
        console.log("🚀 GetTotalSpareparts - error stack: ", error.stack)
        return {}
    }
}


/**
 * Return object contains spare parts information
 *
 * @param {string}
 * @returns {object}
 */
exports.GetSpareparts = async (model_id = "", search = "", page = 1, limit = 10) => {
    const { execute } = require('../tools/mysql.conn')
    const {GetSparepartComponents, GetTotalSpareparts} = require('../utils/Spareparts')


    let result = {"total_rows": 0, "data": []}


    try {

        let search_condition = " WHERE (component_item LIKE '%" + search + "%' OR description LIKE '%" + search + "%')"
        let model_id_condition = ""
        if (model_id) {
            model_id_condition = " AND product_model_id='" + model_id + "'"
        }

        const pageLimit = (parseInt(page) - 1) * parseInt(limit)
        let page_condition = "LIMIT " + pageLimit.toString() + ", " + limit

        const total_rows = await GetTotalSpareparts(model_id, search)
        if (total_rows) {
            result.total_rows = parseInt(total_rows)
        }


        const sql = `SELECT product_model_id, component_item, description, image_ref, image_mime_type, image_name 
                     FROM (
                          SELECT t1.product_model_id, t1.component_item, t1.description, t2.image_ref, t2.image_mime_type, t2.image_name 
                          FROM scican.products_spare_parts as t1 
                          LEFT JOIN scican.products_spare_parts_images as t2 ON t1.component_item=t2.component_item
                    ) as t 
                    ${search_condition}
                    ${model_id_condition}
                    GROUP BY component_item 
                    ORDER BY description asc ${page_condition}`


        const sqlResult = await execute(sql)
        const data = sqlResult && sqlResult != null ? sqlResult : []

        if (data) {
            for (const k in data) {
                let spare_parts = {
                    "model_id": "",
                    "item_id": "",
                    "description": "",
                    "image_url": "",
                    "components": []
                }
                let url = process.env.containerUrl + "/spareparts/images?ref="

                spare_parts.model_id = data[k].product_model_id
                spare_parts.item_id = data[k].component_item
                spare_parts.description = data[k].description
                if (data[k].image_ref) {
                    spare_parts.image_url = url + data[k].image_ref
                }
                const components = await GetSparepartComponents(data[k].component_item)
                if (components) {
                    for (const j in components) {
                        spare_parts.components.push(components[j])
                    }
                }

                result.data.push(spare_parts)
            }
        }

        return result
    } catch (error) {
        console.log("🚀 GetSparepartsImagesRefId - error: ", error.message)
        console.log("🚀 GetSparepartsImagesRefId - error stack: ", error.stack)
        return {}
    }
}