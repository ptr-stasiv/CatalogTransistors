const mysql = require('mysql2');
var http = require('http');
const express = require('express');
const ejs = require('ejs');
const path = require('path');
const app = express();
const multer = require('multer'); 
const fs = require('fs');

const IMAGES_DIRECTORY = path.join(__dirname, '../images');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const port = 80;

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/images', express.static(IMAGES_DIRECTORY));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'sys'
});

connection.connect((error) => {
  if (error) {
    console.error('Error connecting to MySQL database:', error);
  } 
  else {
    console.log('Connected to MySQL database!');
  }
});

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/getSearchData/:typeParam/:param', (req, res) => { 
  const typeParam = req.params.typeParam;
  const param = req.params.param;

  connection.query(`SELECT * FROM bipolar_transistors WHERE ${typeParam} LIKE "${param}"`, (err, rows) => {
    if (err) {

      console.error('Error executing query: ' + err.stack);
      res.json({});
      return;
    }
    else
    {
      console.log("Send unsorted data");
      res.json(rows);
    }
  });
});

app.get('/getSortedData/:param/:typeParam/:search', (req, res) => {
  const param = req.params.param;
  const typeParam = req.params.typeParam;
  const search = req.params.search;

  //Send unsorted data
  if(param == "Default")
  {
    connection.query(`SELECT * FROM bipolar_transistors WHERE ${typeParam} LIKE "${search}"`, (err, rows) => {
        if (err) {
    
          console.error('Error executing query: ' + err.stack);
    
          res.status(500).send('Database error');
          return;
        }
        else
        {
          console.log("Send unsorted data");
          res.json(rows);
        }
    });
  }
  else
  {
    connection.query(`SELECT * FROM bipolar_transistors WHERE ${typeParam} LIKE "${search}" ORDER BY ${param} ASC`, (err, rows) => {
      if (err) {
  
        console.error('Error executing query: ' + err.stack);
  
        res.status(500).send('Database error');
        return;
      }
      else
      {
        console.log("Send unsorted data");
        res.json(rows);
      }
    });
  }
});

app.get('/remove/:param', (req, res) => { 
  const param = req.params.param;

  connection.query(`DELETE FROM bipolar_transistors WHERE Name LIKE "${param}"`, (err, rows) => {
    if (err) {
    
      console.error('Error executing query: ' + err.stack);

      res.status(500).send('Database error');
      return;
    }
    else
    {
      console.log("Send unsorted data");
      res.json(rows);
    }
  });
});

app.get('/getSortedData/:param', (req, res) => {
  const param = req.params.param;

  //Send unsorted data
  if(param == "Default")
  {
    connection.query('SELECT * FROM bipolar_transistors', (err, rows) => {
        if (err) {
    
          console.error('Error executing query: ' + err.stack);
    
          res.status(500).send('Database error');
          return;
        }
        else
        {
          console.log("Send unsorted data");
          res.json(rows);
        }
    });
  }
  else
  {
    connection.query(`SELECT * FROM bipolar_transistors ORDER BY ${param} ASC`, (err, rows) => {
      if (err) {
  
        console.error('Error executing query: ' + err.stack);
  
        res.status(500).send('Database error');
        return;
      }
      else
      {
        console.log("Send unsorted data");
        res.json(rows);
      }
    });
  }
});

app.post('/addProduct', upload.single('image'), (req, res) => {
  var { productName, productType, pcMax, UEce_max, UEcb_max, UEeb_max, Ic_max, F_max, H21_e, CMax } = req.body;

  var properties = [ productName, productType, pcMax, UEce_max, UEcb_max, UEeb_max, Ic_max, F_max, H21_e, CMax ];
  var table = ["Name", "Type", "PC_Max", "UCE_Max", "UCB_Max", "UEB_Max", "IC_Max", "F_Max", "HE", "T"];

  connection.query(`SELECT * FROM bipolar_transistors WHERE Name LIKE "${productName}"`, (err, rows) => {
    if (err || rows.length <= 0) {

      pcMax = pcMax == '' ? 0 : pcMax;
      UEce_max = UEce_max ==  '' ? 0 : UEce_max;
      UEcb_max = UEcb_max ==  '' ? 0 : UEcb_max;
      UEeb_max = UEeb_max ==  '' ? 0 : UEeb_max;
      Ic_max = Ic_max ==  '' ? 0 : Ic_max;
      F_max = F_max ==  '' ? 0 : F_max;
      H21_e = H21_e ==  '' ? 0 : H21_e;
      CMax = CMax ==  '' ? 0 : CMax;
    
      var originalFileName = 'no-image.jpg';
      var imageName = `${originalFileName}`;
      var imagePath = path.join(IMAGES_DIRECTORY, imageName);
    
      if(req.file)
      {
        const image = req.file.buffer;
        originalFileName = req.file.originalname;
    
        imageName = `${originalFileName}`;
        imagePath = path.join(IMAGES_DIRECTORY, imageName);
      
    
        fs.writeFileSync(imagePath, image);
      }
    
    
      connection.query('INSERT INTO bipolar_transistors (Name, Type, PC_Max, UCE_Max, UCB_Max, UEB_Max, IC_Max, F_Max, HE, T, ImagePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
                      [productName, productType, pcMax, UEce_max, UEcb_max, UEeb_max, Ic_max, F_max, H21_e, CMax, `../images/${originalFileName}`], (err, result) => 
      {
        if (err) {
          console.error('Error executing query: ' + err.stack);
          res.status(500).send('Database error');
          return;
        }
        console.log("data added");
        res.redirect('/');
      });
      return;
    }
    else
    {
      for(var i = 0; i < properties.length; ++i)
      {
        if(properties[i] != undefined && properties[i] != productName)
        {
          connection.query(`UPDATE bipolar_transistors SET ${table[i]} = "${properties[i]}" WHERE Name = "${productName}";`, [], (err, result) => { });
        }
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running`);
});