var express = require("express"), 
    mongodb = require("mongodb")
    
/** * Set up application. */
app = express.createServer()
       
/** * Middleware. */ 
app.use( express.bodyParser()); 
app.use( express.cookieParser()); 
app.use( express.session({ secret: "my secret" })); 

/** * Authentication middleware. */
app.use( function (req, res, next) {
  if (req.session.loggedIn) {
    res.local("authenticated", true);
    //console.log("\033[96m + \033[39m LoggedIn: "+req.session.loggedIn );
    //app.users.findOne({ _id: { $oid: req.session.loggedIn } }, function (err, doc) {
    app.users.findOne({ _id: app.users.db.bson_serializer.ObjectID.createFromHexString(req.session.loggedIn) }, function (err, doc) {
      if (err) return next(err);
      res.local("me", doc);
      next();
    });
  } else {
    res.local("authenticated", false);
    next();
  }
});


/** * Specify your views options. */ 
app.set("view engine", "jade"); 

// the following line won"t be needed in express 3 
app.set("view options", { layout: false });

/** * Connect to the database. */
var server = new mongodb.Server("127.0.0.1", 27017)

new mongodb.Db("my-website", server).open(function (err, client) {
  // don’t allow the app to start if there was an error
  if (err) throw err;
  console.log("\033[96m + \033[39m connected to mongodb");
 
  // set up collection shortcuts
  app.users = new mongodb.Collection(client, "users");

  client.ensureIndex("users", "email", function (err) {
    if (err) throw err;
    client.ensureIndex("users", "password", function (err) {
      if (err) throw err;
      console.log("\033[96m + \033[39m ensured indexes");

      // listen
      app.listen(3000, function () {
        console.log("\033[96m + \033[39m app listening on *: 3000");
      });
    });
  });
});

/** * Default route */ 
app.get("/", function (req, res) { 
  res.render("index");
  //res.render("index", { authenticated: false });
});

/** * Signup route */ 
app.get("/signup", function (req, res) { 
  res.render("signup"); 
});

/** * Signup processing route */
app.post("/signup", function (req, res, next) {
  app.users.insert(req.body.user, function (err, doc) {
    if (err) return next(err);
    res.redirect("/login/" + doc[0].email);
  });
});

app.post("/login", function (req, res) {
  app.users.findOne({ email: req.body.user.email, password: req.body.user.password }, function (err, doc) {
    if (err) return next(err);
    if (!doc) return res.send("<p> User not found. Go back and try again </p >");
    req.session.loggedIn = doc._id.toString();
    res.redirect("/");
  });
});

/** * Logout route. */
app.get("/logout", function (req, res) {
  req.session.loggedIn = null;
  res.redirect("/");
});



/** * Login route */
app.get("/login/:signupEmail", function (req, res) {
  res.render("login", { signupEmail:req.params.signupEmail });
});

/** * Login route */
app.get("/login", function (req, res) { 
  res.render("login"); 
}); 

/** * Listen */ 
app.listen( 3000);





