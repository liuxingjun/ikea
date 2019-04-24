var Crawler = require("crawler")
let fs = require("fs")
let os = require('os')
let collect = require('collect.js')
const cluster = require('cluster');
let URL = require('url')

var categoriesCount = null
var productCount = null
// console.log(process.env.NODE_ENV)
// if(){
// }
var fileName = null
var count = collect()
var categoriesError = collect()
var productError = collect()
var spider = new Crawler({
    maxConnections: 20,

    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error) {
            console.log(error)
        } else {
            var $ = res.$
            console.log($("title").text())
        }
        done()
    }
})

fileName = 'data/' + new Date().getTime() + '.json'
fs.writeFile(fileName, '[ ', (err) => {
    if (err) throw err
    console.log('文件已初始化')
})
spider.on('drain', function () {
    // For example, release a connection to database.
    fs.readFile(fileName, function (err, data) {
        if (err) throw err
        const file = fs.createWriteStream(fileName, { flags: 'r+', start: data.length - 1 })
        file.write(os.EOL + ']')
        file.end()
        file.on('finish', () => {
            var product = collect();
            fs.readdir('data', (err, data) => {
                if (err) throw err
                for (i = 0, len = data.length; i < len; i++) {
                    fs.readFile('data/' + data[i], (err, data) => {
                        if (err) throw err;
                        let item = collect(eval("(" + data.toString().replace(/[\r\n\t\s]/g, "") + ")")).unique('product_id')//.pluck('product_id');
                        product = product.merge(item.all()).unique('product_id')
                        // console.log(product.count())
                        productsFile = 'data/products' + new Date().getTime() + '.json'
                        fs.open(productsFile, 'a+', (err, fd) => {
                            const file = fs.createWriteStream(productsFile, {
                                flags: 'a+',
                                fd: fd
                            })
                            file.write('[')
                            for (let index = 0, length = products.count(); index < length; index++) {
                                const product = products.get(index)//[index];
                                product = os.EOL + JSON.stringify(product)
                                if (index + 1 < length) {
                                    product += ','
                                }
                                file.write(product)
                            }
                            file.end(os.EOL + ']')
                        })
                    });
                }
                // console.log( collect(  eval("(" + data.toString().replace(/[\r\n\t\s]/g, "") + ")") ).unique('product_id').count() ) 
            });

        });
    })




})

// productPage('https://www.ikea.cn/cn/zh/catalog/products/30348933/')

spider.queue({
    url: 'https://www.ikea.cn/cn/zh/catalog/allproducts/',
    // jQuery: false,
    callback: function (error, res, done) {
        if (error) {
            console.log(error)
        } else {
            var $ = res.$
            let requestUrl = res.request.uri.href
            $(".productCategoryContainer a").each(function (categoriesPageindex, element) {
                let href = $(this).attr('href')
                if (categoriesCount && categoriesPageindex == categoriesCount) {
                    return false
                }

                // console.log(href)
                // console.log(URL)
                categoriesPage(URL.resolve(requestUrl, href))
            })

        }
        done()
    }
})


function categoriesPage(uri) {
    // console.log(fileName)
    spider.queue({
        uri: uri,
        callback: function (error, res, done) {
            let requestUrl = res.request.uri.href
            if (error) {
                console.log(error)
                categoriesError.push(requestUrl)
            } else {
                let $ = res.$

                var products = []
                $(".threeColumn.product").each(function (productPageindex, element) {
                    let id = $(this).attr('id')
                    var product = {}
                    product.link = $(this).find(".productLink").attr('href')
                    if (productCount && productPageindex == productCount) {
                        return false
                    }
                    // cluster.fork({ 
                    //     file: fileName, 
                    //     url: URL.resolve(requestUrl, product.link),
                    //     spider:spider
                    // })
                    count.push(product.link)
                    productPage(URL.resolve(requestUrl, product.link))

                    // product.product_id = product.link.split("/")[5]
                    // product.img = $(this).find(".prodImg").attr('src')

                    // productDetails = $(this).children('.productDetails')
                    // product.name = productDetails.find(".productTitle").text()
                    // var priceElement = productDetails.find(".price.regularPrice").clone()
                    // priceElement.find('.comparisonContainer').remove()
                    // var priceUnit = priceElement.text().replace(/[\r\n\t]/g, "").split("/")
                    // product.unit = priceUnit[1]
                    // price = priceUnit[0].split(/[\s]/)
                    // product.currency = price[0]
                    // product.price = Number(price[1])

                    // var sizeString = productDetails.children('.moreInfo').children('.size').text()
                    // product.size = []
                    // sizeString.replace(/[\r\n\t]/g, "").split(',').map(function (item) {
                    //     if (item == '') {
                    //         return false
                    //     }
                    //     var item = item.split(':')
                    //     var size = {}
                    //     size.type = item[0]
                    //     var value = item[1].trim().split(/[\s]/)
                    //     size.value = value[0]
                    //     size.unit = value[1]
                    //     product.size.push(size)
                    // })
                    // // products.push(product)
                    // product = JSON.stringify(product)
                    // // console.log(product)
                    // fs.open(fileName, 'a+', (err, fd) => {
                    //     const file = fs.createWriteStream('data.json', {
                    //         flags: 'r+',
                    //         fd: fd
                    //     })
                    //     file.write(os.EOL + product + ',')
                    //     file.end()
                    // })
                })
            }
            done()
        }
    })
}

function productPage(uri) {
    spider.queue({
        uri: uri,
        callback: function (error, res, done) {
            let requestUrl = res.request.uri.href
            if (error) {
                console.log(error)
                productError.push(requestUrl)
            } else {
                if (res.statusCode != 200) {
                    productError.push(requestUrl)
                    done()
                    return false
                }
                var $ = res.$

                var product = {}
                product.link = requestUrl
                product.product_id = product.link.split("/")[7]
                // console.log(requestUrl)
                // console.log(product)

                let productData = collect(JSON.parse(res.body.match(/jProductData = ({[\s\S]*?});/)[1]).product.items).keyBy('partNumber').get(product.product_id)
                // console.log(productData)
                product.name = productData.name // $("#name").text().replace(/[\r\n\t]/g, "")
                product.type = productData.type // $("#type").text().replace(/[\r\n\t]/g, "")
                product.color = productData.color
                prodPrice = $("#prodPrice")
                price = prodPrice.children("#price1").text().trim().split(/[\s]/)

                product.currency = price[0]
                product.price = Number(price[1])
                product.unit = prodPrice.children('.productunit').text().replace(/[\r\n\t\/]/g, "").trim()
                product.number = $("#itemNumber").text()
                // let sizeString = eval("'" + $("#metric").html().replace(/[\r\n\t]/g, "").replace(/&#x(.*?)/g, "\\u$1") + "'").trim().split('<br>').filter(d => d)
                sizeString = productData.metric.split('<br/>').filter(d => d)
                product.assembled_size = []
                sizeString.map(function (item) {
                    if (item == '') {
                        return false
                    }
                    item = item.split(':')
                    // console.log(item)
                    let size = {}
                    size.type = item[0]
                    let value = item[1].trim().split(/[\s]/)
                    size.value = value[0]
                    size.unit = value[1]
                    product.assembled_size.push(size)
                })
                // product.number = $("#itemNumber").text()
                let series = $("#moreSeriesContainer").find('#gotoSSC_lnk1')
                // product.series={}
                // product.series.url = series.attr('href')
                // product.series.name = series.text().replace(/[\r\n\t访问系列]/g, "").trim()
                product.series = series.text().replace(/[\r\n\t访问系列]/g, "").trim()
                // console.log(product)

                // console.log(  )
                // console.log('jProductData = {"product":{}}'.match(/jProductData = (\S*?)/)[1])
                product = JSON.stringify(product)
                fs.open(fileName, 'a+', (err, fd) => {
                    const file = fs.createWriteStream(fileName, {
                        flags: 'r+',
                        fd: fd
                    })
                    file.write(os.EOL + product + ',')
                    file.end()
                })

            }
            done()
        }

    })
}
