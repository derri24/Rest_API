let fs = require('fs');
let folder = './tasks/';

module.exports = {

    write: function (obj) {
        let json = JSON.stringify(obj);
        fs.writeFileSync(folder + obj.id, json, function (err) {
            if (err)
                console.log(err);
        });
    },

    read: function (path) {
        return JSON.parse(fs.readFileSync(folder + path, 'utf8'));
    },

    readAllTasks: function (content) {
        let tasks = [];
        fs.readdirSync(folder).forEach(file => {
            let task = this.read(file);
            if (task.content.includes(content))
                tasks.push(task);
        });
        return tasks;
    },

    delete: function (path) {
        try {
            fs.unlinkSync(folder + path);
        } catch (error) {
            console.log(error);
        }
    },

};
