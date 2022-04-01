# use the last git tag as the version. if not on current tag, it will be tag-last-commit-hash
GIT_TAG   = $(shell git describe --tags --always 2>/dev/null)
VERSION   ?= 4.1.22 #${GIT_TAG}
IMAGE_TAG ?= ${VERSION}

# The Docker registry where images are pushed.
# Note that if you use an org (like on Quay and DockerHub), you should
# include that: quay.io/foo
REGISTRY = docker.io/lukepatrick


DOCKER_BUILD_FLAGS := 

DOCKER_NAME	       := jurassicsystems
DOCKER_RUN_FLAGS   := --rm --restart always --name $(DOCKER_NAME)
DOCKER_RUN_PORT	   := 80

DOCKER_IMAGE = jurassicsystems

AUDIT_BASE ?= ''

.PHONY: help
help: ## This help.
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.DEFAULT_GOAL := help

.PHONY: docker-build
docker-build: ## Build the container
	docker build -f Dockerfile $(DOCKER_BUILD_FLAGS) -t $(REGISTRY)/$(DOCKER_IMAGE):$(IMAGE_TAG) .

# You must be logged into DOCKER_REGISTRY before you can push.
.PHONY: docker-push
docker-push: ## Publish the container to artifactory
	docker push $(REGISTRY)/$(DOCKER_IMAGE):$(IMAGE_TAG)


.PHONY: docker-run
docker-run: vendor ## run the docker container
docker-run: $(addsuffix -run,$(IMAGES))

%-run:
	docker run -p $(DOCKER_RUN_PORT):$(DOCKER_RUN_PORT)/tcp \
		$(DOCKER_RUN_FLAGS) \
		-d $(REGISTRY)/$*:$(IMAGE_TAG);
	open http://localhost

.PHONY: docker-exec
docker-exec: vendor ## exec into docker container
	docker exec -it $(DOCKER_NAME) /bin/bash

