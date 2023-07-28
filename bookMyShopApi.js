let express = require("express") ;
let passport = require("passport");
let jwt = require("jsonwebtoken");
let JWTStrategy = require("passport-jwt").Strategy;
let ExtractJWT = require("passport-jwt").ExtractJwt;

var app = express();
app.use(express.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});

var port = process.env.PORT || 2022;
app.listen(port,()=>console.log(`Listening on port ${port}!`));

app.use(passport.initialize());
const parama = {
    jwtFromRequest:ExtractJWT.fromAuthHeaderAsBearerToken(),secretOrKey:"jwtsecret23647832"
};
const jwtExpirySeconds = 300;

const { movies,users,cities } = require("./movieData");
const { halls } = require("./hallData");
const { booksTicket } = require("./bookTicketData");

let strategyAll = new JWTStrategy(parama,function(token,done){
  // console.log("In JWTStrategy-All", token);
  let user1 = users.find((u)=>u.email==token.email);
  // console.log("user",user1);
  if(!user1)
  return done(null, false,{message: "Incorrect username or password"});
  else return done(null,user1);
});

passport.use("roleAll",strategyAll);

app.post("/user",function(req,res){
  let {email,password} = req.body;
  let user = users.find((u)=>u.email==email && u.password===password);
  if(user){
      let payload = {email:user.email};
      let token = jwt.sign(payload,parama.secretOrKey,{
          algorithm: "HS256",
          // expiresIn:jwtExpirySeconds,
      });
      // console.log(payload);
      res.send({token:  token});
  }else res.sendStatus(401);
});

app.get("/user",passport.authenticate("roleAll",{session: false}),function(req,res){
  // console.log("In GET /user", req.user);
  // console.log(req.user);
  res.send(req.user);
});

app.get("/movies/:city",function(req,res){
  let city = req.params.city;
  let q = req.query.q;
  let lang = req.query.lang;
  let format  = req.query.format;
  let genres = req.query.genres;
  try{
    let movieArr = movies.filter(m1=>m1.city.find(c1=>c1===city));
    if(q) movieArr = movieArr.filter(m1=>m1.name.toLowerCase()===q.toLowerCase());
    if(lang){
      let langArr = lang.split(",");
      movieArr = movieArr.filter((m1)=>m1.language.find(lg=>langArr.find(l1=>l1===lg)));
    }
    if(format){
      let formtArr = format.split(",");
      movieArr = movieArr.filter((m1)=>m1.format.find(ft=>formtArr.find(l1=>l1===ft)));
    }
    if(genres){
      let genreArr = genres.split(",");
      movieArr = movieArr.filter((m1)=>m1.genre.find(gt=>genreArr.find(g1=>g1===gt)));
    }
    res.send(movieArr);
  }catch(err){
    res.send(err)
  }
 
});

app.get("/movie/:id",function(req,res){
  let id = +req.params.id;
  let movie = movies.find(p1=>p1.id===id);
  // console.log(id,movie);
  res.send(movie);
});


app.get("/movies/:city/:id",function(req,res){
  let city = req.params.city;
  let id = req.params.id;
  let movie = movies.find(m1=>m1.id==id).name;
  let hall = halls.filter(p1=>p1.city.find(c1=>c1===city));
  let hall1 = hall.filter(h1=>h1.movie.find(m1=>m1===movie));
  // console.log(hall1);
  res.send(hall1);
});

app.get("/hall/:id",function(req,res){
  let id = req.params.id;
  let hall = halls.find(p1=>p1.id==id);
  // console.log(hall1);
  res.send(hall);
});



app.get("/app/seats",function(req,res){
  let city = req.params.city;
  let id = req.params.id;
  try{
    let movieArr = movies.filter(m1=>m1.city.find(c1=>c1===city));
    // console.log(movieArr);
    let movie = movieArr.find(mv=>mv.id==id);
      res.send(movie);
  }catch(err){
    res.send(err);
  }
})

app.put("/user/:id",function(req,res){
  let id = +req.params.id;
  let body = req.body;
  let index = users.findIndex(u1=>u1.id===id);
  users[index] = body;
  res.send("profile Updated");
})


app.get("/bookingSeat/:id",function(req,res){
  let id = +req.params.id;
  let user = booksTicket.find(u1=>u1.userId===id);
  if(user)
    res.send(user.tickets);
})

app.post("/bookingSeat/:id",function(req,res){
  let id = +req.params.id;
  let body = req.body;
  let user = booksTicket.find(u1=>u1.userId===id);
  if(user){
    let maxId = user.tickets.reduce((acc,curr)=>curr.ticketId>acc?curr.ticketId:acc,0);
    let newTicket = {ticketId:maxId+1,...body};
    user.tickets.push(newTicket);
    res.send(newTicket);
  }else{
    let ticket = {ticketId:1,...body};
    let newTicket = {userId:id,tickets:[ticket]};
    booksTicket.push(newTicket);
    res.send(newTicket);
  }
  let hall = halls.find(h1=>h1.name==body.hallName);
  body.tickets.map(t1=>{
      let seatNo = +t1.substring(1)-1;
      let findSeat = hall.showSeat[body.timeIndex].time.find(f1=>f1.name=== t1.charAt(0)).seatNo;
      findSeat[seatNo].b=true;
  })

});

app.post("/register",function(req,res){
  let body = req.body;
  let user = users.find(u1=>u1.email===body.email);
  if(!user){
    let mixId = users.reduce((acc,curr)=>curr.id>acc?curr.id:acc,0);
    let newUser = {id:mixId+1,...body};
    users.push(newUser);
    res.send("Create account Successfully...");
  }else{
    res.send({error:"email already exists"})
  }
  // console.log(user);
 
  // console.log(newUser);

})

app.get("/userFind/:email",function(req,res){
  let email = req.params.email;
  let user = users.find(u1=>u1.email===email);
  if(user) res.send({email:user.email});
  else res.send("not found")
  // console.log(user);
 
  // console.log(newUser);

})


app.post("/updateUser",function(req,res){
  let body = req.body;
  let {email,password} = body;
  let user = users.find(u1=>u1.email===email);
  if(user){
    user.password = password;
    res.status(200).send("update successfully");
  }else
    res.status(404).send("Not Found");

})

app.get("/cities",function(req,res){
  res.send(cities);

})