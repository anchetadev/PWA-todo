// to do:
// make mysql connection
// add server and routes (all routes in server for now)

var mysql = require("mysql");
var express = require("express");
var exphbs = require("express-handlebars");
var app = express();
// mysql connection config
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "todopwa",
});

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("connected as id " + connection.threadId);
});
// end mysql config
//public folder config
app.use(express.static("public"));
// handlebars set up
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
// end handlebars set up

// Routes
app.get("/", function(req, res){
    connection.query("SELECT * FROM todos;", function(err, todosFromDB) {
        if (err) throw err;
        res.render("index", {todos: todosFromDB})
      });
    
})

app.post("/todo", (req, res) => {
  console.log(req.body)
  connection.query(`INSERT INTO todos (name) VALUES ("${req.body.name}");`, function(err, res) {
    if (err) throw err;
    
  });
  res.redirect("/")
});
app.post("/todos", (req, res) => {
  console.log(req.body)
  var query = "INSERT INTO todos (name) VALUES ";
  req.body.map(task => {
    // if it's the last task in the list then we don't need a comma
    if (req.body.indexOf(task) == req.body.length -1) {
      query += `("${task.name}")` 
    }else{
      query += `("${task.name}"),` 
    }
  })
  query+= ";"
  connection.query(query, function(err, res) {
    if (err) throw err;
    
  });
  res.redirect("/")
});

app.delete("/todo/:id", (req,res)=>{
  var taskId = req.params.id
  console.log(taskId)
  connection.query(`DELETE FROM todos WHERE id = ${taskId};`, function(err, res) {
    if (err) throw err;
    
  });
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`)
);
