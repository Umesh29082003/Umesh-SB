const express=require('express')
const app=express()
const connectDb=require('./db')
const router=require('./auth-router')
app.use(express.json())



connectDb().then(()=>{
    console.log("Hello DB")
})


app.use('/',router)

const PORT =3000;
app.listen(PORT, ()=>{
    console.log('server is running at port:'+PORT);
})
