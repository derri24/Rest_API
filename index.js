const express = require("express");
let filesystem = require('./filesystem');

const PORT = 3003;

const app = express()
app.use(express.json());


app.get("/index", (req, res) => {
    res.sendFile(__dirname + "/index.html")
})


app.get("/get", (req, res) => {
    let tasks = filesystem.readAllTasks(req.query.content);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(tasks));
})


app.get("/getTask", (req, res) => {
    let task = filesystem.read(req.query.id);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(task));
})


app.post("/create", (req, res) => {
    let task = req.body;
    filesystem.write(task);

})

app.post("/update", (req, res) => {
    let task = req.body;
    let oldTask = filesystem.read(task.id);
    oldTask.content = task.content;
    oldTask.status = task.status;
    oldTask.date = task.date;
    filesystem.write(oldTask);
})


app.delete("/delete", (req, res) => {
    filesystem.delete(req.query.id);
})

app.listen(PORT);