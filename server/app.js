var express = require('express');
var app = express();

var path = require('path');
var bodyParser = require('body-parser');

var pg = require('pg');
var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/sql_lecture';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({expanded: true}));


app.get('/find',function(req,res){
    var person = "%" + req.query.peopleSearch +  "%";
    pg.connect(connectionString, function(err,client){
        client.query("SELECT name, age, location,address,animal From people WHERE name ILIKE $1", [person], function(err,result){
            if(err) {
                console.log("Error finding data: ", err);
                res.send(false);
            }
            //console.log(result);
            console.log(result.rows);
            res.send(result.rows);
        })
    })
});

// Get all the people information
app.get('/data', function(req,res){
    var results = [];

    //SQL Query > SELECT data from table
    pg.connect(connectionString, function (err, client, done) {
        var query = client.query("SELECT id, name, location, age, address, animal FROM people ORDER BY name ASC");

        // Stream results back one row at a time, push into results array
        query.on('row', function (row) {
            results.push(row);
        });

        // After all data is returned, close connection and return results
        query.on('end', function () {
            client.end();
            return res.json(results);
        });

        // Handle Errors
        if (err) {
            console.log(err);
        }
    });
});

// Add a new person
app.post('/data', function(req,res){
    //console.log(req);
    var addedPerson = {
        "name" : req.body.peopleAdd,
        "location" : req.body.locationAdd,
        "age" : req.body.ageAdd,
        "address": req.body.addressAdd,
        "animal": req.body.animalAdd
    };

    pg.connect(connectionString, function (err, client) {
        //SQL Query > Insert Data
        //Uses prepared statements, the $1 and $2 are placeholder variables. PSQL then makes sure they are relatively safe values
        //and then uses them when it executes the query.

        //var query = "INSERT INTO people (name, location) VALUES ('" + addedPerson.name + "', '" + addedPerson.location + "')";
        //console.log(query);
        //client.query(query);

        client.query("INSERT INTO people (name, location, age, address, animal) VALUES ($1, $2, $3, $4, $5) RETURNING id", [addedPerson.name, addedPerson.location, addedPerson.age, addedPerson.address, addedPerson.animal],
            function(err, result) {
                if(err) {
                    console.log("Error inserting data: ", err);
                    res.send(false);
                }
                console.log(result);
                res.send(true);
            });

    });

});

app.delete('/data', function(req,res){
    //console.log(req.body.id);
    //
    //Person.findByIdAndRemove({"_id" : req.body.id}, function(err, data){
    //    if(err) console.log(err);
    //    res.send(data);
    //});
    console.log(req.body);
    var deletedId = req.body.id;
    pg.connect(connectionString, function(err,client){
        client.query("DELETE FROM people WHERE id=$1", [deletedId] , function(err,result){
            if (err){
                console.log("oops its an error", err);
                res.send(false);
            }
            console.log(result);
            res.send(true);
        });
    })


});

app.get("/*", function(req,res){
    var file = req.params[0] || "/views/index.html";
    res.sendFile(path.join(__dirname, "./public", file));
});

app.set("port", process.env.PORT || 5000);
app.listen(app.get("port"), function(){
    console.log("Listening on port: ", app.get("port"));
});
