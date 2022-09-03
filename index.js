const express=require('express');
const { geturls, beymenProducts } = require('./script/Beymen');
const port=process.env.PORT || 3001;
const app = express();
app.get('/beymen',geturls)
app.get('/beymenProduct',beymenProducts)
app.get('/',(req,res)=>{
  res.status(200).send('working')
})
app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`),
);