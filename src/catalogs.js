import { readJSON, writeCSV } from 'https://deno.land/x/flat@0.0.15/mod.ts'
import { parse } from "https://deno.land/std@0.175.0/flags/mod.ts";
import * as log from "https://deno.land/std@0.177.0/log/mod.ts";

//region 获取参数
const flags = parse(Deno.args, {
    string: ["log"],
    default: { "log": "info" },
});
console.debug("flags:", flags);
//endregion

// Deno.exit(5);
await log.setup({
    handlers: {
        default: new log.handlers.ConsoleHandler("DEBUG"),
    },
    loggers: {
        default: {
            level: flags.log.toUpperCase(),
            handlers: ["default"],
        },
    },
});
const filename = Deno.args[0] // Same name as downloaded_filename
let data = []
try {
    data = await readJSON(filename)
    log.debug("read success to" + filename)
} catch (error) {
    log.error('read error to ' + filename + ' error:' + error.message);
    Deno.exit(1)
}

// log.debug(data[4].subCategories[1])
const csvCategorylist = []
function flat(categories, parent_id, depth) {
    for (const category of categories) {
        // log.debug(category.name)
        const newCategory = {}
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
const newfile = `./data/catalogs.csv`
try {
    await writeCSV(newfile, csvCategorylist)
    log.debug('write success to ' + newfile);
} catch (error) {
    log.error('write error to ' + newfile + " error :" + error.message);
}
