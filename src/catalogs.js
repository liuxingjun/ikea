import { readJSON, writeCSV } from 'https://deno.land/x/flat/mod.ts'
import _ from 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/+esm'

// The filename is the first invocation argument

const filename = Deno.args[0] // Same name as downloaded_filename
const data = await readJSON(filename)
// console.debug(data[4].subCategories[1])
var csvCategorylist = []
function flat(categories, parent_id, depth) {
    for (const category of categories) {
        // console.log(category.name)
        var newCategory = {}
        newCategory.id = category.id
        newCategory.name = category.name
        newCategory.parent_id = parent_id
        newCategory.depth = depth
        newCategory.url = category.url
        newCategory.globalImageUrl = category.globalImageUrl
        if (category.subCategories.length > 0) {
            flat(category.subCategories, category.id, depth + 1)
        }
        csvCategorylist.push(newCategory)
    }
}
flat(data, 0, 1)
// console.debug(csvCategorylist.length)
// Pluck a specific key off
// and write it out to a different file
// Careful! any uncaught errors and the workflow will fail, committing nothing.
const newfile = `./data/catalogs.csv`
await writeCSV(newfile, csvCategorylist)