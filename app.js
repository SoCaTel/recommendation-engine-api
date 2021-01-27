const app = require('express')()
const bodyParser = require('body-parser');
const basicAuth = require('express-basic-auth');
var auth = require('http-auth');
const _Config = require('./config.js');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = YAML.load('socatel-api-endpoints.yml');
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const { Client } = require('@elastic/elasticsearch');
var request = require('request');

const mongo_url = 'mongodb://' + _Config.MongoDB_Username + ':' + _Config.MongoDB_Password + 
    '@' + _Config.MongoDB_Host + ':' + _Config.MongoDB_Port + '/'

    
const es_client = new Client({ 
    node: _Config.Elasticsearch_Endpoint,
    headers: {
        Authorization: _Config.Elasticsearch_Authorisation
    }
})


var users = [];
users[_Config.restapi_username] = _Config.restapi_password;

var basic_auth = basicAuth({
    users: users,
    unauthorizedResponse: function(req){
        return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided'
    }
});

app.use(bodyParser.json({ type: 'application/json' }))

app.get('/api/recommendation_getSimilarGroupsToGroup/:group_id/:size/:locality_id', basic_auth, (req, res) => {
    try {
        size = ((req.params.size == "undefined") ? _Config.MongoDB_default_arr_result_size : req.params.size)

        MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {

            if (err) { 
                console.log(err.message)
                return res.status(500).send([]);
            }
         
            const gtg_db = client.db(_Config.MongoDB_GroupsToGroups_db);
            var sim_selector = {'combo': new RegExp("^" + req.params.group_id + "::", 'i')}

            out = []
            rank = []
            gtg_db.collection(_Config.MongoDB_GroupsToGroups_collection).find(
                sim_selector).toArray(function(err, result) {
                    try {
                        if (err) {
                            console.log(err.message)
                            return res.status(500).send([]);
                        }
                        
                        if (result.length > 0) {
                            result.forEach(function(inner_result){
                                if (err) {
                                    console.log(err.message)
                                    return res.status(500).send([]);
                                }
                                
                                res_split = inner_result['combo'].split("::")
                                if (parseFloat(res_split[2]) > 0 && res_split[0] != res_split[1]) {
                                    if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)) {
                                        out[res_split[1]] = parseFloat(res_split[2])
                                    } else { 
                                        var group_template = _Config.query_body_transformation(_Config.es_should_match_group_template, res_split[1], false, "$group_id")
                                        out.push(group_template)
                                        rank.push(parseFloat(res_split[2]))
                                    }
                                }
                            });

                            if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)) {
                                return res.send(_Config.sort_dict_by_value(out, size, "similar_group_id", undefined, true))
                            } else {
                                var query = _Config.query_body_transformation(_Config.es_get_group_locality, out, false, "$should_match_list")
                                var query = _Config.es_query_finalisation(query)

                                es_client.search({index: _Config.Elasticsearch_socatel_group_index, body: query}, 
                                    function(err, result) {
                                        if(err) {
                                            console.log(err.message)  
                                            return res.status(500).send([])
                                        } else {
                                            final_out = []
                                            if (result.body.hits.hits.length > 0) {
                                                result.body.hits.hits.forEach(function(hit, i){
                                                    if (hit._source.locality.locality_id == req.params.locality_id || (!isNaN(hit._source.locality.locality_parent) && 
                                                        hit._source.locality.locality_parent.locality_id == req.params.locality_id)) {
                                                        final_out[hit._source.group_id] = parseFloat(rank[i])
                                                    }
                                                })
                                            }
                                        }

                                        return res.send(_Config.sort_dict_by_value(final_out, size, "similar_group_id", undefined, true))
                                    }
                                )
                            }
                        } else {
                            return res.send([])
                        }
                    } catch (err) {
                        console.log(err.message)
                        return res.status(500).send([])
                    }

                client.close();
            });
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/recommendation_getSimilarServicesToService/:service_id/:size', basic_auth, (req, res) => {
    try {
        size = ((req.params.size == "undefined") ? _Config.MongoDB_default_arr_result_size : req.params.size)

        MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {

            if (err) {
                console.log(err.message)
                res.status(500).send([]);
            }
         
            const gtg_db = client.db(_Config.MongoDB_ServicesToServices_db);
            var sim_selector = {'combo': new RegExp("^" + req.params.service_id + "::", 'i')}
            
            out = {}
            gtg_db.collection(_Config.MongoDB_ServicesToServices_collection).find(
                sim_selector).toArray(function(err, result) {
                    if (err) { 
                        console.log(err.message)
                        return res.status(500).send([]);
                    }
                    
                    if (result.length > 0) {
                        result.forEach(function(inner_result){
                            if (err) { 
                                console.log(err.message)
                                res.status(500).send([]);
                            }
                            
                            res_split = inner_result['combo'].split("::")
                            if (parseFloat(res_split[2]) > 0 && res_split[0] != res_split[1]) {
                                out[res_split[1]] = parseFloat(res_split[2])
                            }
                        });

                        return res.send(_Config.sort_dict_by_value(out, size, "similar_service_id", undefined, true))
                    } else {
                        return res.send([])
                    }

                client.close();
            });
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/recommendation_getSimilarServicesToGroup/:group_id/:size', basic_auth, (req, res) => {
    try {
        size = ((req.params.size == "undefined") ? _Config.MongoDB_default_arr_result_size : req.params.size)

        MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {

            if (err) throw err;
         
            const gtg_db = client.db(_Config.MongoDB_GroupsToServices_db);
            var sim_selector = {'combo': new RegExp("^" + req.params.group_id + "::", 'i')}

            out = {}
            gtg_db.collection(_Config.MongoDB_GroupsToServices_collection).find(
                sim_selector).toArray(function(err, result) {
                    if (err) {
                        console.log(err.message)
                        return res.status(500).send([]);
                    }
                    
                    if (result.length > 0) {
                        result.forEach(function(inner_result){
                            if (err) {
                                console.log(err.message)
                                res.status(500).send([]);
                            }
                            
                            res_split = inner_result['combo'].split("::")
                            if (parseFloat(res_split[2]) > 0 && res_split[0] != res_split[1]) {
                                out[res_split[1]] = parseFloat(res_split[2])
                            }
                        });

                        return res.send(_Config.sort_dict_by_value(out, size, "similar_service_id", undefined, true))
                    } else {
                        return res.send([])
                    }

                client.close();
            });
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.get('/api/recommendation_getGroupGivenUser/:user_id/:size/:locality_id', basic_auth, (req, res) => {
    size = ((req.params.size == "undefined") ? _Config.PIO_default_arr_result_size : req.params.size)
    var reco_request = {"user": req.params.user_id, "num": size}

    request.post({
        'url': _Config.PIO_reco_url,
        'headers': { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': "*",
            "Access-Control-Allow-Methods": "*"
        },
        body: JSON.stringify(reco_request)  
    }, function(err,resp){
        if (err){
            console.log(err)
            return res.status(500).send([])
        }
        
        try {
            resp_body = JSON.parse(resp.body)
            to_return = []
            rank = []

            resp_body.itemScores.forEach(function(elem){
                if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)) {
                    inner = {}
                    inner['group_id'] = parseInt(elem['item'])
                    inner['score'] = elem['score']
                    to_return.push(inner)
                } else {
                    var group_template = _Config.query_body_transformation(_Config.es_should_match_group_template, parseInt(elem['item']), false, "$group_id")
                    to_return.push(group_template)
                    rank.push(elem['score'])
                }
            })
        } catch (err) {
            console.log(err.message)
            return res.status(500).send([])
        }

        if (req.params.locality_id === "undefined" || isNaN(req.params.locality_id)) {
            return res.status(200).send(to_return);
        } else {
            var query = _Config.query_body_transformation(_Config.es_get_group_locality, to_return, false, "$should_match_list")
            var query = _Config.es_query_finalisation(query)

            es_client.search({index: _Config.Elasticsearch_socatel_group_index, body: query}, 
                function(err, result) {
                    if(err) {
                        console.log(err.message)  
                        return res.status(500).send([])
                    } else {
                        final_out = []
                        if (result.body.hits.hits.length > 0) {
                            result.body.hits.hits.forEach(function(hit, i){
                                if (hit._source.locality.locality_id == req.params.locality_id || (!isNaN(hit._source.locality.locality_parent) && 
                                    hit._source.locality.locality_parent.locality_id == req.params.locality_id)) {
                                    final_out[hit._source.group_id] = parseFloat(rank[i])
                                }
                            })
                        }
                    }

                    return res.send(_Config.sort_dict_by_value(final_out, size, "group_id", "score", true))
                }
            )
        }
    })
})

app.get('/api/recommendation_getServiceGivenUser/:user_id/:size', basic_auth, (req, res) => {
    try {
        size = ((req.params.size == "undefined") ? _Config.PIO_default_arr_result_size : req.params.size)

        MongoClient.connect(mongo_url, { useNewUrlParser: true }, (err, client) => {

            if (err) throw err;
         
            const gtg_db = client.db(_Config.MongoDB_UsersToServices_db);
            var sim_selector = {'combo': new RegExp("^" + req.params.user_id + "::", 'i')}

            out = {}
            gtg_db.collection(_Config.MongoDB_UsersToServices_collection).find(
                sim_selector).toArray(function(err, result) {
                    if (err) throw err
                        
                    if (result.length == 0) return res.status(200).send([])

                    result.forEach(function(inner_result){
                        if (err) {
                            console.log(err.message)
                            res.status(500).send([]);
                        }
                        
                        res_split = inner_result['combo'].split("::")
                        if (parseFloat(res_split[2]) > 0 && res_split[0] != res_split[1]) {
                            out[res_split[1]] = parseFloat(res_split[2])
                        }
                    });

                    return res.send(_Config.sort_dict_by_value(out, size, "similar_service_id", undefined, true))
                    
                client.close();
            });
        });
    } catch (err) {
        console.log(err.message)
        return res.status(500).send([])
    }
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(_Config.restapi_port, () =>
  console.log(`SoCaTel REST API Layer listens on port ${_Config.restapi_port}!`),
);