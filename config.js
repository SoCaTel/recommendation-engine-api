const Config = {
    PIO_reco_url: "<insert_predictionio_recommendation_engine_url>",   // e.g. "http://127.0.0.1:8000/queries.json",
    PIO_default_arr_result_size: 5,  // Maximum number of returned results by the predictionio recommendation engine

    Elasticsearch_Endpoint: "<insert_elasticsearch_endpoint_for_queries>",  // e.g. http://127.0.0.1:9200/
    Elasticsearch_Authorisation : "<insert_authentication_token>",  // Typically following the "Basic" HTTP authentication scheme

    // The following are the pre-defined names of elasticsearch indices for the SoCaTel project.
    Elasticsearch_default_agg_size: 10,  // Maximum number of returned results by Elasticsearch queries
    Elasticsearch_socatel_history_index: 'so_history',
    Elasticsearch_socatel_posts_index: 'so_post',
    Elasticsearch_socatel_user_index: 'so_user',
    Elasticsearch_socatel_group_index: 'so_group',
    Elasticsearch_post_likes_field_name: 'post_upvotes',
    Elasticsearch_post_dislikes_field_name: 'post_downvotes',
    Elasticsearch_post_timestamp_field_name: 'post_timestamp',
    Elasticsearch_view_history_type: 7,
    Elasticsearch_join_history_type: 5,
    Elasticsearch_posts_history_type: 4,
    
    MongoDB_default_arr_result_size: 10,  // Maximum number of returned results by the MongoDB queries
    
    MongoDB_Host: '<insert_host_name>', // e.g. 'localhost' or a docker instance's name
    MongoDB_Port: '27017',  // default MongoDB port, change as necessary
    MongoDB_Username: 'default_username',
    MongoDB_Password: 'default_password',

    // The following are pre-defined collection names for the supported relationships between elasticsearch indices
    MongoDB_GroupsToGroups_db: 'groups_to_groups',
    MongoDB_GroupsToGroups_collection: 'so_group_to_so_group',

    MongoDB_ServicesToServices_db: 'services_to_services',
    MongoDB_ServicesToServices_collection: 'so_service_to_so_service',

    MongoDB_GroupsToServices_db: 'groups_to_services',
    MongoDB_GroupsToServices_collection: 'so_group_to_so_service',

    MongoDB_UsersToServices_db: 'user_to_services',
    MongoDB_UsersToServices_collection: 'user_to_so_service',

    // Setup username/password authentication for this node.js instance
    restapi_username: '<insert_restapi_username>',  // this is up to the developer
    restapi_password: '<insert_restapi_password>',  // this is up to the developer
    restapi_port: 8192,  // this is up to the developer. If changed, also change in the Dockerfile as well

    es_get_group_locality: `{
        "_source": [
            "locality.locality_id",
            "locality.locality_parent.locality_id",
            "group_id"
          ],
          "query": {
            "bool": {
              "must": {
                "bool": {
                  "should": [$should_match_list]
                }
              }
            }
          }
    }`,
    es_should_match_group_template: `{
        "match": {
            "group_id": $group_id
        }   
    }`,

    query_body_transformation: function(str, to_replace, is_array, replace_identifier){
        if (!is_array){
            // replace all occurrences
            return str.split(replace_identifier).join(`${to_replace}`) 
        } else {
            if (!Array.isArray(to_replace)){
                throw 'to_replace is not an array';
            }

            var to_return = '';
            for(var i = 0; i < to_replace.length; i++){
                if (i !== to_replace.length -1){
                    to_return = `${to_return}"${to_replace[i]}",`;
                }
                else {
                    to_return = `${to_return}"${to_replace[i]}"`;
                }
            } 
            return str.replace(replace_identifier, to_return);     
        }
    },
    sort_dict_by_value: function(dict, size, key_name, val_name, key_as_int=false){
        var items = Object.keys(dict).map(function(key) {
            return [key, dict[key]];
        });
          
        // Sort the array based on the second element
        items.sort(function(first, second) {
            return second[1] - first[1];
        });

        var out = []
        rank = 1
        items.slice(0, size).forEach(function(item){
            var cur_out = {}
            cur_out[key_name] = key_as_int ? parseInt(item[0]) : item[0]

            if (val_name === undefined) {
                cur_out['rank'] = rank
                rank += 1
            } else {
                cur_out[val_name] = item[1]
            }

            out.push(cur_out)
        })

        return out
    },
    es_query_finalisation: function(str){
        return JSON.parse(str)
    }
}

module.exports = Config;
