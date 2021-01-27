#!/bin/bash


PROJECT_NAME=socatel
CONTAINER_NAME=sct-reco-rest-api-endpoints
IMAGE_NAME="$PROJECT_NAME/$CONTAINER_NAME:latest"

echo "Stopping $CONTAINER_NAME"
docker container stop $CONTAINER_NAME

echo "Removing $CONTAINER_NAME"
docker container rm $CONTAINER_NAME

echo "Building $CONTAINER_NAME"
docker build -t $IMAGE_NAME .

echo "Creating $CONTAINER_NAME"
docker create -ti -p 8192:8192 --network=<mongodb_network_name> --name $CONTAINER_NAME $IMAGE_NAME

echo "Running Container $CONTAINER_NAME"
docker start $CONTAINER_NAME

