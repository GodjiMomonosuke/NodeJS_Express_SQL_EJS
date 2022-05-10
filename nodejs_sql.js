//Open Call Express 
const express = require('express')
const bodyParser = require('body-parser')

const mysql = require('mysql');
const res = require('express/lib/response');

const app = express()
const port = process.env.PORT || 5000;

app.use(bodyParser.json())

app.set('view engine','ejs')

//MySQL Connect phpMyAdmin
const pool = mysql.createPool({
    connectionLimit : 10,
    connectionTimeout : 20,
    host : 'localhost', //www.google.com/sql or Server IP Address
    user : 'root',
    password : '',
    database : 'nodejs_beer' //Connect Database from beers.sql (Import to phpMyAdmin)
})

//GET (เรียกข้อมูลขึ้นมาดู) | POST (ส่งข้อมูลหน้า Website กลับเข้ามา)
//GET All Beers (beers.sql)

var obj = {}

app.get('/additem', (req, res) => {
    res.render('additem')
})

app.get('',(req, res) => {

    pool.getConnection((err, connection) => {  //err คือ connect ไม่ได้ or connection คือ connect ได้ บรรทัดที่ 13-20
        if(err) throw err
        console.log("connected id : ?" ,connection.threadId) //ให้ print บอกว่า Connect ได้ไหม
        //console.log(`connected id : ${connection.threadId}`) //ต้องใช้ ` อยู่ตรงที่เปลี่ยนภาษา ใช้ได้ทั้ง 2 แบบ
        
        connection.query('SELECT * FROM beers', (err, rows) => { 
            connection.release();
            if(!err){ 

                obj = {beers: rows, Error : err}

                res.render('index', obj)

                res.send(rows)
            } else {
                console.log(err)
            }
         }) 
    })
})

//Copy บรรทัดที่ 24 - 42 มาปรับแก้ Code ใหม่
//สร้างหน้าย่อย ดึงข้อมูลเฉพาะ id ที่ต้องการ คือ 123, 124, 125
app.get('/:id',(req, res) => {

    pool.getConnection((err, connection) => {  //err คือ connect ไม่ได้ or connection คือ connect ได้ บรรทัดที่ 13-20
        if(err) throw err
        console.log("connected id : ?" ,connection.threadId) //ให้ print บอกว่า Connect ได้ไหม
        //console.log(`connected id : ${connection.threadId}`) //ต้องใช้ ` อยู่ตรงที่เปลี่ยนภาษา ใช้ได้ทั้ง 2 แบบ

        connection.query('SELECT * FROM beers WHERE `id` = ?', req.params.id, (err, rows) => { 
            connection.release();
            if(!err){ //ถ้าไม่ error จะใส่ในตัวแปร rows
               // res.send(rows)
               obj = {beers: rows, Error : err}

               res.render('showbyid.ejs', obj)

            } else {
                console.log(err)
            }
         }) 
    })
})

//Add New GET เปลี่ยน path และใส่ตัวแปรไป 2 ตัวคือ name, id
app.get('/getname_id/:name&:id',(req, res) => {

    pool.getConnection((err, connection) => {  //err คือ connect ไม่ได้ or connection คือ connect ได้ บรรทัดที่ 13-20
        if(err) throw err
        console.log("connected id : ?" ,connection.threadId) //ให้ print บอกว่า Connect ได้ไหม
        //console.log(`connected id : ${connection.threadId}`) //ต้องใช้ ` อยู่ตรงที่เปลี่ยนภาษา ใช้ได้ทั้ง 2 แบบ

        connection.query('SELECT * FROM beers WHERE `id` = ? OR `name` LIKE ?', [req.params.id, req.params.name], (err, rows) => { 
            connection.release();
            if(!err){ //ถ้าไม่ error จะใส่ในตัวแปร rows
                //res.send(rows)
                obj = {beers: rows, Error : err}

                res.render('getnameid', obj)

            } else {
                console.log(err)
            }
         }) 
    })
})

//(1) POST --> INSERT
//ใช้คำสั่งที่ให้สามารถรับข้อมูล x-www-form urlencoded ทดสอบ Postmsn ลงฐานข้อมูลได้
app.use(bodyParser.urlencoded({extended: false}))
//สร้างตัว path ของเว็บไซต์ additem
app.post('/additem',(req,res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err 
        const params = req.body

       //Check 
       pool.getConnection((err, connection2) => {
        connection2.query(`SELECT COUNT(id) AS count FROM beers WHERE id = ${params.id}`, (err, rows) => {
            if(!rows[0].count){
                connection.query('INSERT INTO beers SET ?', params, (err, rows) => {
                    connection.release()
                    if(!err){
                        //res.send(`${params.name} is complete adding item. `)
                        obj = {Error:err, mesg : `Success adding data ${params.name}`}                                   
                        res.render('additem', obj)
                    }else {
                        console.log(err)
                        }
                    })           
            } else {
                //res.send(`${params.name} do not insert data`)
                obj = {Error:err, mesg : `Can not adding data ${params.name}`}                           
                res.render('additem', obj)
                }
            })
        })
    })
})

//(2)DELETE
app.delete('/delete/:id',(req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err 
        console.log("connected id : ?",connection.threadId)
        //ลบข้อมูลโดยใช้ id
        connection.query('DELETE FROM `beers` WHERE `beers`.`id` = ?', [req.params.id],(err, rows) => {
            connection.release()
            if(!err){
                res.send(`${[req.params.id]} is complete delete item.`)
            } else{
                console.log(err)
            }
            })
        })
})

//(3)PUT ทำการ UPDATE ข้อมูลใน Database ใช้วิธีการทดสอบทำเช่นเดียวกับของ POST
app.put('/update',(req, res) => {
    pool.getConnection((err, connection) =>{
        if(err) throw err
        console.log("connected id : ?", connection.threadId)
 
        //สร้างตัวแปรแบบกลุ่ม
        const {id, name, tagline, description, image} = req.body       
 
        //Update ข้อมูลต่าง ๆ ตามลำดับ โดยใช้เงื่อนไข id
        connection.query('UPDATE beers SET name = ?, tagline = ?, description = ?, image = ? WHERE id = ?', [name, tagline, description, image, id], (err, rows) => {
            connection.release();
            if(!err){ 
                res.send(`${name} is complete update item. `) 
            } else {
                console.log(err)
            }
        })
    })
})

//UPDATE `beers` SET `name` = 'New Chang', `tagline` = '8851993625136888', `description` = 'New เบียร์ช้าง - Chang - 2 x 490 mL (980 mL) ' WHERE `beers`.`id` = 123;

app.listen(port, () => 
    console.log("listen on port : ?", port)
    )