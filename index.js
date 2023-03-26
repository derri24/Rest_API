const express = require("express");
let filesystem = require('./filesystem');
let jwt = require("jsonwebtoken");
let crypto = require('crypto')


const PORT = 3003;
const PRIVATE_KEY = 'tr8j0e2w6q2';

const app = express()
app.use(express.json());

let server = require('http').createServer(app);
let WebSocket = require('ws');
let wss = new WebSocket.WebSocketServer({server: server});


wss.on('connection', function (ws) {

    ws.on('message', function incoming(message) {
        let obj = JSON.parse(message);

        if (!isValidToken(obj)) {
            let result = {status: 401};
            if (obj.request !== "/index") {
                ws.send(JSON.stringify(result));
            }
            return;
        }
        if (obj.request === 'registration') {
            let result = registration(obj);
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'authorization') {
            let result = authorization(obj);
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'getAllTasks') {
            let result = getAllTasks(obj);
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'create') {
            let result = create(obj)
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'delete') {
            let result = deleteTask(obj)
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'getTaskForView') {
            let result = getTask(obj)
            ws.send(JSON.stringify(result));
            return;
        }
        if (obj.request === 'update') {
            let result = update(obj);
            ws.send(JSON.stringify(result));
        }
    });
});

function isValidToken(obj) {
    try {
        if (obj.request !== "registration" && obj.request !== "authorization")
            jwt.verify(obj.token, PRIVATE_KEY)
    } catch (ex) {
        return false;
    }
    return true;
}

function registration(user) {
    let result = {};
    if (user.name === "" || user.login === "" || user.password === "") {
        result.status = 403;
        result.message = "You should fill all fields!";
        return result;
    }
    if (user.password.length < 8) {
        result.status = 403;
        result.message = "Password should has length more than 7!";
        return result;
    }
    if (filesystem.readUsers().some(x => x.login === user.login)) {
        result.status = 403;
        result.message = "This login already exist!";
        return result;
    } else {
        result.status = 200;
        result.message = "Success!";

        let password = user.password;
        user.password = crypto.createHash('sha256').update(password).digest('hex');
        filesystem.writeUser(user);
    }

    return result;
}


function authorization(credentials) {
    let result = {};
    credentials.password = crypto.createHash('sha256').update(credentials.password).digest('hex');
    let users = filesystem.readUsers();
    if (users.some(x => x.login === credentials.login) && users.some(x => x.password === credentials.password)) {
        result.status = 200;
        result.token = jwt.sign({
            name: credentials.name,
            login: credentials.login,
            creationTime: Date.now() + 1000 * 60 * 60 * 12
        }, PRIVATE_KEY);
    } else {
        result.status = 400;
        result.message = "Incorrect login or password!";
    }
    return result;
}

function getAllTasks(obj) {
    return {
        request: obj.request,
        status: 200,
        tasks: filesystem.readAllTasks(obj.searchStr),
    };
}

function getTask(obj) {
    return {
        request: obj.request,
        status: 200,
        task: filesystem.readTask(obj.id),
    };
}

function update(obj) {
    let task = obj.task;
    let oldTask = filesystem.readTask(task.id);
    oldTask.content = task.content;
    oldTask.status = task.status;
    oldTask.date = task.date;

    filesystem.writeTask(oldTask);

    return {status: 200};
}

function create(obj) {
    filesystem.writeTask(obj.task);
    return {status: 200};
}

function deleteTask(obj) {
    filesystem.delete(obj.id);
    return {status: 200};
}

app.get("/authorization", (req, res) => {
    res.sendFile(__dirname + "/views/authorization.html")
})

app.get("/registration", (req, res) => {
    res.sendFile(__dirname + "/views/registration.html");
})

app.get("/index", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
})

server.listen(PORT, () => console.log("Server started"))