var express = require("express");
var sqlite = require("sqlite");
var bodyParser = require("body-parser");

var app = express();
var dbConnection = sqlite.open("banco.sqlite", { Promise });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extend: true }));

app.get("/", async function(request, response) {
  var db = await dbConnection;
  var categoriasDb = await db.all("SELECT * FROM categorias");
  var vagas = await db.all("SELECT * FROM vagas");
  var categorias = categoriasDb.map(function(categoria) {
    return {
      id: categoria.id,
      categoria: categoria.categoria,
      vagas: vagas.filter(function(vaga) {
        return vaga.categoria === categoria.id
      })
    }
  });
  return response.render("home", {
    categorias: categorias,
    vagas: vagas
  });
});

app.get("/vaga/:id", async function(request, response) {
  var db = await dbConnection;
  var vaga = await db.get("SELECT * FROM vagas WHERE id = " + request.params.id);
  return response.render("vaga", {
    vaga: vaga
  });
});

app.get("/admin", function(request, response) {
  response.render("admin/home");
});

app.get("/admin/vagas", async function(request, response) {
  var db = await dbConnection;
  var vagas = await db.all("SELECT * FROM vagas");
  response.render("admin/vagas", {
    vagas: vagas
  });
});

app.get("/admin/vagas/delete/:id", async function(request, response) {
  var db = await dbConnection;
  await db.run("DELETE FROM vagas WHERE id = "+request.params.id);
  response.redirect("/admin/vagas");
});

app.get("/admin/vagas/nova", async function(request, response) {
  var db = await dbConnection;
  var categorias = await db.all("SELECT * FROM categorias");
  response.render("admin/nova-vaga", { categorias });
});

app.post("/admin/vagas/nova", async function(request, response) {
  var db = await dbConnection;
  var vaga = request.body;
  var titulo = vaga.titulo;
  var descricao = vaga.descricao;
  var categoria = vaga.categoria;
  await db.run("insert into vagas(categoria, titulo, descricao) values("+categoria+", '"+titulo+"', '"+descricao+"');");
  response.redirect("/admin/vagas");
});

app.get("/admin/vagas/editar/:id", async function(request, response) {
  var db = await dbConnection;
  var categorias = await db.all("SELECT * FROM categorias");
  var vaga = await db.get("SELECT * FROM vagas WHERE id = "+request.params.id);
  response.render("admin/editar-vaga", { categorias, vaga });
});

app.post("/admin/vagas/editar/:id", async function(request, response) {  
  var id = request.params.id;
  console.log(id);
  var vaga = request.body;
  var titulo = vaga.titulo;
  var descricao = vaga.descricao;
  var categoria = vaga.categoria;
  var db = await dbConnection;
  console.log("oii");
  await db.run("UPDATE vagas SET categoria = "+categoria+", titulo = '"+titulo+"', descricao = '"+descricao+"' WHERE id = "+id);
  response.redirect("/admin/vagas");
});

var init = async function() {
  var db = await dbConnection;
  await db.run("create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);");
  await db.run("create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);");
  // var categoria = "Engineering team";
  // await db.run("insert into categorias(categoria) values('"+categoria+"');");
  // var categoria = "Social Media Digital (San Francisco)";
  // var descricao = "Vaga para Fullstack developer que fez o curso do Fullsatck Lab";
  // await db.run("insert into vagas(categoria, titulo, descricao) values(2, '"+categoria+"', '"+descricao+"');");
}
init();

app.listen(3000, function(error) {
  if(error) {
    console.log("Não foi possível iniciar o servidor do Jobify");
  }
  else {
    console.log("Servidor do Jobify rodando...");
  }
});