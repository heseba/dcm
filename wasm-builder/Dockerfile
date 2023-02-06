ARG GO_VER=1.19.0-bullseye

FROM golang:$GO_VER
LABEL autodelete="true"
LABEL maintainer="Alexander Senger<senger.alexander@yahoo.de>"

# USER root

######################################## Build Arguments (can overwrite .env)

############# Project
ARG APP_DIR=/usr/local/src/app
ARG GOPARSEREXPORT=/tmp
ARG GOTEMP=/tmp/gotemp
ARG PLUGINTEMP=/tmp/plugintemp
############# User
ARG USER=wasm
ARG GROUP=wasm
ARG UID=1000
ARG GID=1000
############# Node
ARG NODE_VER=16.17.0
ARG NODE_PACKAGE=node-v$NODE_VER-linux-x64
ARG NODE_HOME=/opt/$NODE_PACKAGE

######################################## Environment Variables (inside image)

############# Project
ENV APP_DIR=$APP_DIR
ENV GOPARSEREXPORT=$GOPARSEREXPORT
ENV GOTEMP=$GOTEMP
ENV PLUGINTEMP=$PLUGINTEMP
############# Node
ENV NODE_PATH $NODE_HOME/lib/node_modules
ENV PATH $NODE_HOME/bin:$PATH

######################################## Installing dependencies and programs

RUN apt-get update \
  && apt-get install -y --no-install-recommends make curl \
  && curl https://nodejs.org/dist/v$NODE_VER/$NODE_PACKAGE.tar.gz | tar -xzC /opt/ \
  && npm i -g npm@latest js-yaml \
  && rm -rf /var/lib/apt/lists/*

######################################## Image hardening or User creation

RUN groupadd -g $GID $GROUP \
  && useradd -m -g $GID -u $UID $USER

######################################## Setup directories

COPY ./docker/wasmbuilder $APP_DIR
# RUN chmod a+x /usr/local/bin/*
COPY ./docker/scripts /usr/local/bin
COPY ./docker/goparser /go/src/goparser

# install the goparser and remove source files afterwards, installed packages (GO, Node) are owned by root -> transfer rights to USER
RUN docker-entrypoint \
  && rm -f /usr/local/bin/docker-entrypoint \
  && rm -rf /go/src/goparser \
  && chown -R $USER:$GROUP /go/pkg \
  && chown -R $USER:$GROUP $NODE_PATH

USER $USER
# directory when starting a container, also creates it
WORKDIR /usr/app

# CMD ["wasmbuilder"]
