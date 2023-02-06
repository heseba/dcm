.SILENT: go-temppath, plugin-temppath

SHELL:=/bin/bash

WWW_DIST:=
WASM_DIST:=

#=========================
# Mandatory params
#=========================
# targets
www-check:
  # path to public folder, mainly to deposit the wasm files
  ifndef WWW
    $(error "Please provide your public path. [WWW=<path>]")
  else
    WWW_DIST=$(WWW)
    WASM_DIST=$(WWW_DIST)/wasm
  endif

plugin-check:
  ifndef PLUGINS
    $(error "Please provide your plugin path. [PLUGINS=<path>]")
  endif

# guard-%:
# 	@ if [ "${${*}}" = "" ]; then \
# 		echo "Environment variable $* not set"; \
# 		exit 1; \
# 	fi

#=========================
# Optional params
#=========================

go-temppath:
  ifndef GOSRC
    # if you are in docker, you know where to look,
    # check if the directoy is empty, otherwise we cannot compile anything
    ifdef APP_DIR
      # if the lookup is empty
      ifeq ($(wildcard $(GOTEMP)/*),)
        $(error "Temporary GO file directory is empty. Please provide the path to your parsed GO files. [GOSRC=<path>]")
      else
        GOSRC=$(GOTEMP)
      endif
    else
      # if you are not in docker and its not the default folder, provide alternative path
      ifeq ($(wildcard ./tmp/gotemp/*),)
        $(error "Temporary GO file directory is empty. Please provide the path to your parsed GO files. [GOSRC=<path>]")
      else
        GOSRC=./tmp/gotemp
      endif
    endif
  endif

plugin-temppath:
  ifndef PLUGINSRC
    # if you are in docker, you know where to look,
    # check if the directoy is empty, otherwise we cannot compile anything
    ifdef APP_DIR
      # if the lookup is empty
      ifeq ($(wildcard $(PLUGINTEMP)/*),)
        $(error "Temporary plugin file directory is empty. Please provide the path to your parsed plugin files. [PLUGINSRC=<path>]")
      else
        PLUGINSRC=$(PLUGINTEMP)
      endif
    else
      # if you are not in docker and its not the default folder, provide alternative path
      ifeq ($(wildcard ./tmp/plugintemp/*),)
        $(error "Temporary plugin file directory is empty. Please provide the path to your parsed plugin files. [PLUGINSRC=<path>]")
      else
        PLUGINSRC=./tmp/plugintemp
      endif
    endif
  endif

all: clean build
build: compile-wasm glue compile-plugin

# build wasm files from generated go temp files
compile-wasm: www-check go-temppath
	@echo "Generating WASM files..."
  # check if directories exist and create if necessary
	@test -d $(WASM_DIST) || mkdir -p $(WASM_DIST)
	@for filepath in $(GOSRC)/*.go; do\
    printf -v file '%s' $${filepath##*/};\
    printf -v filename '%s' $${file%%.*};\
		GOOS=js GOARCH=wasm go build -o $(WASM_DIST)/$${filename}.wasm $(GOSRC)/$${filename}.go; \
	done & wait $!
	@echo "WASM files generated into: $(WASM_DIST)"

# build plugin.so files from generated plugin temp files
compile-plugin: plugin-check plugin-temppath
	@echo "Generating PLUGIN files..."
  # check if directories exist and create if necessary
	@test -d $(PLUGINS) || mkdir -p $(PLUGINS)
	@for filepath in $(PLUGINSRC)/*.go; do\
    printf -v file '%s' $${filepath##*/};\
    printf -v filename '%s' $${file%%.*};\
		if [[ ! -z "${DEBUG}" && "${DEBUG}" == "true" ]]; then \
			go build -gcflags="all=-N -l" -buildmode=plugin -o $(PLUGINS)/$${filename}.so $(PLUGINSRC)/$${filename}.go; \
		else \
			go build -buildmode=plugin -o $(PLUGINS)/$${filename}.so $(PLUGINSRC)/$${filename}.go; \
		fi \
	done & wait $!
	@echo "PLUGIN files generated into: $(PLUGINS)"

# clear generated files
clean: clean-wasm clean-plugin

clean-wasm: www-check
	@[ ! -d  $(WASM_DIST) ] || rm -rf $(WASM_DIST)
	@[ ! -f  $(WWW_DIST)/wasm_exec.js ] || rm -rf $(WWW_DIST)/wasm_exec.js
	@echo "WASM directory and JavaScript glue code cleared up."

clean-plugin: plugin-check
	@[ ! -d  $(PLUGINS) ] || rm -rf $(PLUGINS)
	@echo "PLUGINS directory cleared up."

# Copy JavaScript glue code for wasm files
glue: www-check
	@cp $$(go env GOROOT)/misc/wasm/wasm_exec.js $(WWW_DIST)
	@echo "JavaScript glue code copied into: $(WWW_DIST)"
