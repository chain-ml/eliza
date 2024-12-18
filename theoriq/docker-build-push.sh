DOCKER_REPO=us-west1-docker.pkg.dev/chainml-lab-devops/docker-manual
IMAGE_TAG=`git rev-parse --abbrev-ref HEAD`-`date +%y%m%d-%H%M%S`-`git rev-parse --short head`
IMAGE_NAME=eliza-alpha-bot

DOCKER_FLAGS=--push

docker buildx build ${DOCKER_FLAGS} --platform=linux/amd64 -f ../Dockerfile -t ${DOCKER_REPO}/${IMAGE_NAME}:${IMAGE_TAG} ..
echo $DOCKER_TAG
