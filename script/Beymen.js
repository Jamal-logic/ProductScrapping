const puppeteer = require("puppeteer");
const fs = require("fs");
async function geturls(req,res) {
  const store=req.query['url'];
  const start=req.query['start'];
  const limit=req.query['limit'];
  const file=req.query['filename'];
  let count = 0;
  let urls = [];
  let fileurls = [];
  const browser = await puppeteer.launch();
  for (let b = start; b <= limit; b++) {
    const page = await browser.newPage();
    console.log(file,"Page", b);
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
        } catch (error) {}
      }
      page.close();
    } catch (error) {
      console.log(`Page is'nt working`);
      let jsonCatch = JSON.stringify(fileurls);
      fs.appendFile(`${file}Url.json`, jsonCatch, "utf8", function (err) {
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
  fs.appendFile(`${file}url.json`, jsonUrl, "utf8", function (err) {
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
      await singlepage.goto(urls[j]);
      const [t] = await singlepage.$x(
        `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/a`
      );
      const [desc] = await singlepage.$x(
        `/html/body/div[3]/div[1]/div[1]/div[2]/div[2]/h1/span`
      );
      const [price] = await singlepage.$x(`//*[@id="priceNew"]`);
      const [oldprice] = await singlepage.$x(`//*[@id="priceOld"]`);
      let PriceVal = "",
        DescVal = "",
        titleVal = "",
        discVal = "";

      try {
        const Price = await price.getProperty("textContent");
        PriceVal = await Price.jsonValue();
      } catch (error) {}
      try {
        const OldPrice = await oldprice.getProperty("textContent");
        discVal = await OldPrice.jsonValue();
      } catch (error) {
        discVal = PriceVal;
      }
      try {
        const title = await t.getProperty("textContent");
        titleVal = await title.jsonValue();
      } catch (error) {}
      try {
        const description = await desc.getProperty("textContent");
        DescVal = await description.jsonValue();
      } catch (error) {}
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
        } catch (error) {}
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
        } catch (error) {}
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
        } catch (error) {}
      }
      products.push({
        id: j + 1,
        title: titleVal,
        description: DescVal,
        price: PriceVal,
        sizes: ASize,
        specification: spec,
        oldPrice: discVal,
        images: Images,
      });
      productcount++;
      console.log(file,"#", productcount);
    } catch (error) {
      console.log("Product not found");
      var ProductContent = JSON.stringify(products);
      fs.appendFile(`${file}.json`, ProductContent, "utf8", function (err) {
        if (err) {
          return console.log(err);
        }
        products=[];
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
module.exports={geturls}
