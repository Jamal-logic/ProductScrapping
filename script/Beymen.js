const puppeteer = require("puppeteer");
const fs = require("fs");
async function geturls(req, res) {
  const store = req.query['url'];
  const start = req.query['start'];
  const limit = req.query['limit'];
  const file = req.query['filename'];
  console.log(store, start, limit, file);
  if (store === undefined || start === undefined || start === undefined || file === undefined) {
    res.status(500).json('variables missing')
  }
  else if (store === '' || start === '' || start === '' || file === '') {
    res.status(500).json('variables data missing')
  }
  else {
    let count = 0;
    let urls = [];
    let fileurls = [];
    const browser = await puppeteer.launch();
    for (let b = start; b <= limit; b++) {
      const page = await browser.newPage();
      console.log(file, "Page", b);
      try {
        await page.goto(`${store}?sayfa=${b}`, {
          timeout: 0,
        });
        for (let i = 1; i <= 200; i++) {
          const [el] = await page.$x(
            `//*[@id="productList"]/div[${i}]/div/div/div[2]/a[2]`
          );
          try {
            const url = await el.getProperty("href");
            const urlHref = await url.jsonValue();
            urls.push(urlHref);
            fileurls.push(urlHref);
            count++;
          } catch (error) { }
        }
        page.close();
      } catch (error) {
        console.log(`Page is'nt working`);
        let jsonCatch = JSON.stringify(fileurls);
        fs.appendFile(`${file}urls.json`, jsonCatch, "utf8", function (err) {
          if (err) {
            return console.log(err);
          }
          fileurls = [];
          console.log("The file was saved!");
        });
      }
    }
    console.log("Number of Products", count);
    var jsonUrl = JSON.stringify(fileurls);
    fs.appendFile(`${file}urls.json`, jsonUrl, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
    console.log(urls.length);
    let products = [];
    let productcount = 0;
    for (let j = 0; j < urls.length; j++) {
      const singlepage = await browser.newPage();
      try {
        await singlepage.goto(urls[j], {
          waitUntil: 'networkidle0',
        });
        await singlepage.setViewport({
          width: 1200,
          height: 2000
      });
  
        const [t] = await singlepage.$x(
          `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/a`
        );
        const [desc] = await singlepage.$x(
          `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/span`
        );
        const [price] = await singlepage.$x(`//*[@id="priceNew"]`);
        const [oldprice] = await singlepage.$x(`//*[@id="priceOld"]`);
        const [color] = await singlepage.$x(`/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/div[2]/div[1]/label/text()`);
        let PriceVal = "",
          DescVal = "",
          titleVal = "",
          discVal = "",
          Colorval = "";
        try {
          const colorP = await color.getProperty("textContent");
          Colorval = await colorP.jsonValue();
        } catch (error) { }
        try {
          const Price = await price.getProperty("textContent");
          PriceVal = await Price.jsonValue();
        } catch (error) { }
        try {
          const OldPrice = await oldprice.getProperty("textContent");
          discVal = await OldPrice.jsonValue();
        } catch (error) {
          discVal = PriceVal;
        }
        try {
          const title = await t.getProperty("textContent");
          titleVal = await title.jsonValue();
        } catch (error) { }
        try {
          const description = await desc.getProperty("textContent");
          DescVal = await description.jsonValue();
        } catch (error) { }
        let ASize = [];
        for (let s = 0; s <= 50; s++) {
          const [sizes] = await singlepage.$x(`//*[@id="sizes"]/div/span[${s}]`);
          try {
            const className = await sizes.getProperty("className");
            const classContent = await className.jsonValue();
            if (classContent === "m-variation__item -disabled") {
            } else if (classContent === "m-variation__item") {
              const Size = await sizes.getProperty("textContent");
              const SizeContent = await Size.jsonValue();
              ASize.push(SizeContent);
            }
            else {
              const Size = await sizes.getProperty("textContent");
              const SizeContent = await Size.jsonValue();
              ASize.push(SizeContent);
            }
          } catch (error) {}
        }
        let catlist = ['Ana Sayfa'];
        for (let c = 2; c <= 10; c++) {
          const [cat] = await singlepage.$x(
            `//*[@id="breadcrumb"]/ol/li[${c}]/a/span`
          );
          try {

            const catname = await cat.getProperty("textContent");
            const catVal = await catname.jsonValue();
            // if(c===1){
            //   console.log(catVal);
            //   catVal = catVal.substring(0, catVal.length - 1);
            //   console.log(catVal);
            // }
            // console.log(catval);
            catlist.push(catVal);
          } catch (error) { }
        }

        let Images = [];
        for (let d = 1; d <= 3; d++) {
          const [image] = await singlepage.$x(
            `/html/body/div[3]/div[1]/div[1]/div[2]/div[1]/figure/img[${d}]`
          );
          try {
            const imgsrc = await image.getProperty("src");
            const imgContent = await imgsrc.jsonValue();
            Images.push(imgContent);
          } catch (error) { }
        }
        let spec = [];
        for (let ps = 0; ps <= 50; ps++) {
          const [specX] = await singlepage.$x(
            `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/div[6]/div/ul/span[${ps}]`
          );
          try {
            const specs = await specX.getProperty("textContent");
            const specContent = await specs.jsonValue();
            spec.push(specContent);
          } catch (error) { }
        }
        products.push({
          id: j + 1,
          url: urls[j],
          title: titleVal,
          description: DescVal,
          color: Colorval,
          category: catlist,
          price: PriceVal,
          sizes: ASize,
          specification: spec,
          oldPrice: discVal,
          images: Images,
        });
        productcount++;
        console.log(file, "#", productcount);
      } catch (error) {
        console.log("Product not found");
        var ProductContent = JSON.stringify(products);
        fs.appendFile(`${file}.json`, ProductContent, "utf8", function (err) {
          if (err) {
            return console.log(err);
          }
          products = [];
          console.log("The file was saved!");
        });
      }
      singlepage.close();
    }
    var jsonContent = JSON.stringify(products);
    fs.appendFile(`${file}.json`, jsonContent, "utf8", function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
    });
    console.log("Number of Products", productcount);
    await browser.close();

  }

}
async function beymenProducts(req, res) {
  const urlFile = req.query['urlfile'];
  const start = req.query['start'];
  const limit = req.query['limit'];
  const file = req.query['filename'];
  if (urlFile === undefined || start === undefined || start === undefined || file === undefined) {
    res.status(500).json('variables missing')
  }
  else if (urlFile === '' || start === '' || start === '' || file === '') {
    res.status(500).json('variables data missing')
  }
  else{
    let urls=await readJson(urlFile)
    console.log(urls);
    const browser = await puppeteer.launch();
    let products = [];
    let productcount = 0;
    if(urls.length===0 || limit>urls.length){
    res.status(404).json('limit reached or file not found')
    }
    else
    {
      for (let j = start; j < limit; j++) {
        const singlepage = await browser.newPage();
        try {
          await singlepage.goto(urls[j], {
            waitUntil: 'networkidle0',
          });
          await singlepage.setViewport({
            width: 1200,
            height: 2000
        });
    
          const [t] = await singlepage.$x(
            `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/a`
          );
          const [desc] = await singlepage.$x(
            `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/span`
          );
          const [price] = await singlepage.$x(`//*[@id="priceNew"]`);
          const [oldprice] = await singlepage.$x(`//*[@id="priceOld"]`);
          const [color] = await singlepage.$x(`/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/div[2]/div[1]/label/text()`);
          let PriceVal = "",
            DescVal = "",
            titleVal = "",
            discVal = "",
            Colorval = "";
          try {
            const colorP = await color.getProperty("textContent");
            Colorval = await colorP.jsonValue();
          } catch (error) { }
          try {
            const Price = await price.getProperty("textContent");
            PriceVal = await Price.jsonValue();
          } catch (error) { }
          try {
            const OldPrice = await oldprice.getProperty("textContent");
            discVal = await OldPrice.jsonValue();
          } catch (error) {
            discVal = PriceVal;
          }
          try {
            const title = await t.getProperty("textContent");
            titleVal = await title.jsonValue();
          } catch (error) { }
          try {
            const description = await desc.getProperty("textContent");
            DescVal = await description.jsonValue();
          } catch (error) { }
          let ASize = [];
          for (let s = 0; s <= 50; s++) {
            const [sizes] = await singlepage.$x(`//*[@id="sizes"]/div/span[${s}]`);
            try {
              const className = await sizes.getProperty("className");
              const classContent = await className.jsonValue();
              if (classContent === "m-variation__item -disabled") {
              } else if (classContent === "m-variation__item") {
                const Size = await sizes.getProperty("textContent");
                const SizeContent = await Size.jsonValue();
                ASize.push(SizeContent);
              }
              else {
                const Size = await sizes.getProperty("textContent");
                const SizeContent = await Size.jsonValue();
                ASize.push(SizeContent);
              }
            } catch (error) {}
          }
          let catlist = ['Ana Sayfa'];
          for (let c = 2; c <= 10; c++) {
            const [cat] = await singlepage.$x(
              `//*[@id="breadcrumb"]/ol/li[${c}]/a/span`
            );
            try {
    
              const catname = await cat.getProperty("textContent");
              const catVal = await catname.jsonValue();
    
              catlist.push(catVal);
            } catch (error) { }
          }
    
          let Images = [];
          for (let d = 1; d <= 3; d++) {
            const [image] = await singlepage.$x(
              `/html/body/div[3]/div[1]/div[1]/div[2]/div[1]/figure/img[${d}]`
            );
            try {
              const imgsrc = await image.getProperty("src");
              const imgContent = await imgsrc.jsonValue();
              Images.push(imgContent);
            } catch (error) { }
          }
          let spec = [];
          for (let ps = 0; ps <= 50; ps++) {
            const [specX] = await singlepage.$x(
              `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/div[6]/div/ul/span[${ps}]`
            );
            try {
              const specs = await specX.getProperty("textContent");
              const specContent = await specs.jsonValue();
              spec.push(specContent);
            } catch (error) { }
          }
          products.push({
            id: j + 1,
            url: urls[j],
            title: titleVal,
            description: DescVal,
            color: Colorval,
            category: catlist,
            price: PriceVal,
            sizes: ASize,
            specification: spec,
            oldPrice: discVal,
            images: Images,
          });
          productcount++;
          console.log(file,' limit ',limit, "#", productcount);
        } catch (error) {
          console.log("Product not found");
          var ProductContent = JSON.stringify(products);
          fs.appendFile(`${file}.json`, ProductContent, "utf8", function (err) {
            if (err) {
              return console.log(err);
            }
            products = [];
            console.log("The file was saved!");
          });
        }
        singlepage.close();
      }
      var jsonContent = JSON.stringify(products);
      fs.appendFile(`${file}.json`, jsonContent, "utf8", function (err) {
        if (err) {
          return console.log(err);
        }
        console.log("The file was saved!");
      });
      console.log("Number of Products", productcount);
  
    }
    await browser.close();
  }
}
async function readJson(urlFile){
  return JSON.parse(fs.readFileSync(`${urlFile}.json`))
}
module.exports = { geturls,beymenProducts }
