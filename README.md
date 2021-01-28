<img src="https://platform.socatel.eu/images/socatel-logo.png" alt="SoCaTelLogo" width="250" />

# Recommender engine REST API Endpoints

This project contains the recommendation engine endpoints that expose recommendations when given a SoCaTel entity to 
other entities (groups, users, services, organisations).

## Getting Started
### Prerequisites

These instructions will get you a copy of the project up and running on your local machine for development and testing 
purposes. See deployment for notes on how to deploy the project on a live system.

All tools and processes are meant to be deployed under a docker container. To get everything set up, you should:

* Have docker installed in your machine. See [this](https://runnable.com/docker/install-docker-on-linux) for a
 general guide on Linux machines (preferred OS for this project).

The docker container used will take care of installing node and all packages required to expose endpoints included here.

You will need to have the following setup, found in the [SoCaTel](https://github.com/SoCaTel/) group:
* PredictionIO recommendation engine, to retrieve user to user recommendations.
* GraphQL, for semantic repository queries, found [here](https://github.com/SoCaTel/socatel-graphql) exposed through
 API calls in [this](https://github.com/SoCaTel/rest-api) repository.
* Elasticsearch, for direct queries to the database. For help in setting this up and the necessary Elasticsearch indices
, refer to [this](https://github.com/SoCaTel/elasticsearch-schema) repository.
* MongoDB, for accessing recommendation and semantic engine's stored outputs from periodical runs

**NOTE** This repository has been developed using Python 3.6

## Configurations

Under the `config.js` file, change the `Elasticsearch`, `GraphQL`, `PIO` (PredictionIO) and `MongoDB` related fields, based on your current setup.

Basic authorisation is also supported, so you should change the following based on a unique set of username and password:

* `restapi_username`
* `restapi_password`

The default port used is 8192, if you need to change it, edit the `restapi_port` parameter.

## Deployment

Retrieve the `<mongodb_network_name>` in the `./docker_build.sh` from the second line of the following command's output (the MongoDB setup is done in the sentiment classification engine component setup):
`docker inspect <mongo_image_id> | grep -A 2 "Networks"`

Then run `./docker_build.sh` to deploy this on your Linux machine of choice.
Access the GUI (built on Swagger) through: `<host>:8192/api-docs/#/`, where host is your Linux machine's IP address (the docker exposes the application on localhost).

## Built With

* [Docker](https://www.docker.com/) - The secure way to build and share this application, anywhere.
* [NodeJS](https://nodejs.org/en/) - A powerful Javascript runtime where scalable network applications are built.
* [Swagger](https://swagger.io/) - Used for API documentation and exposure on its GUI tool

## **Contact**
If you encounter any problems, please contact the following:

[<img src="https://www.cyric.eu/wp-content/uploads/2017/04/cyric_logo_2017.svg" alt="CyRIC | Cyprus Research and Innovation Centre" width="150" />](mailto:info@cyric.eu)

## License

[Apache-2.0](LICENSE)

## Acknowledgments

* [SoCaTel project](https://www.socatel.eu/)
* [Horizon 2020](https://ec.europa.eu/programmes/horizon2020/en)
