const express = require("express");
let filesystem = require('./filesystem');
let jwt = require("jsonwebtoken");
let crypto = require('crypto')

const cookieParser = require('cookie-parser');


const PORT = 3003;

const app = express()
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
    try {
        if (req.url !== "/registration" && req.url !== "/authorization") {
            let token = req.cookies.authorization;
            jwt.verify(token, 'tr8j0e2w6q2')
        }
        next();
    } catch (err) {
        if (req.url !== "/index") {
            res.sendStatus(401);
            return;
        }
        res.redirect("/authorization");
    }
})

app.get("/authorization", (req, res) => {
    res.sendFile(__dirname + "/views/authorization.html")
})

app.get("/registration", (req, res) => {
    res.sendFile(__dirname + "/views/registration.html");
})

app.get("/index", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
})


app.get("/get", (req, res) => {
    let tasks = filesystem.readAllTasks(req.query.content);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(tasks));
})


app.get("/getTask", (req, res) => {
    let task = filesystem.readTask(req.query.id);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(task));
})


app.post("/create", (req, res) => {
    let task = req.body;
    filesystem.writeTask(task);
    res.end();
})

app.post("/update", (req, res) => {
    let task = req.body;

    let oldTask = filesystem.readTask(task.id);
    oldTask.content = task.content;
    oldTask.status = task.status;
    oldTask.date = task.date;

    filesystem.writeTask(oldTask);
    res.end();
})

app.post("/registration", (req, res) => {
    let user = req.body;
    if (user.name === "" || user.login === "" || user.password === "") {
        res.status(403).send("You should fill all fields!");
        return;
    }
    if (user.password.length < 8) {
        res.status(403).send("Password should has length more than 7!");
        return;
    }
    if (filesystem.readUsers().some(x => x.login === user.login)) {
        res.status(403).send("This login already exist!");
        return;
    } else {
        res.status(200).send("Success!");
    }
    user.password = crypto.createHash('sha256').update(user.password).digest('hex');
    filesystem.writeUser(user);
    res.end();
})

app.post("/authorization", (req, res) => {
    let credentials = req.body;
    credentials.password = crypto.createHash('sha256').update(credentials.password).digest('hex');
    let users = filesystem.readUsers();
    if (users.some(x => x.login === credentials.login) && users.some(x => x.password === credentials.password)) {
        let token = jwt.sign({
            name: credentials.name,
            login: credentials.login,
            creationTime: Date.now()
        }, 'tr8j0e2w6q2');
        res.status(200).cookie('authorization', token, {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 12),
            httpOnly: true
        }).send();
    } else {
        res.sendStatus(404)
    }
})

app.delete("/delete", (req, res) => {

    filesystem.delete(req.query.id);
    res.end();
})

app.listen(PORT);