#!/bin/bash

iterations=100

gin="gin/"
frp="frp/"
fzf="fzf/"
webserver="webserver/"
terraform="terraform/"

directories=($gin $frp $fzf $webserver $terraform)
ensureDirectories=($webserver $terraform $gin $frp $fzf)

function displaytime {
  # Milliseconds
  local ms="$(($1/1000000))"
  # Seconds
  local s="$(($1/1000000000))"

  # Milliseconds (2 milliseconds correction)
  local MS="$((ms-2))"
  # Seconds
  local S="$((s%60))"
  local M="$((s/60%60))"
  local H="$((s/60/60%24))"
  local D="$((s/60/60/24))"
  (( $D > 0 )) && printf '%02d days ' $D
  (( $H > 0 )) && printf '%02d hours ' $H
  (( $M > 0 )) && printf '%02d minutes ' $M
  (( $S > 0 )) && printf '%02d seconds ' $S
  (( $D > 0 || $H > 0 || $M > 0 || $S > 0 )) && printf 'and '
  printf '%d milliseconds\n' "${MS:(-3)}"
}

function trackTime {
  # UNIX timestamp concatenated with nanoseconds
  local start=$(date +%s%N)
  # execute function and suppress any output
  { ($@)  >/dev/null 2>&1; }

  local end=$(date +%s%N)
  # Time interval in nanoseconds
  local difference="$((end-start))"
  echo $(displaytime difference)
}

function getFileCount {
  echo $(find "$1" -type f -name "*.go" | wc -l);
}


printf "copy CFDs...\n"
for dirname in ${ensureDirectories[@]}; do
  dirName=${dirname%?}
  # if directories do not exist unzip them
  if [ ! -d $dirName ]; then
    printf "generating necessary directories...\n"
    tar -zxf ${dirName}.tar.gz
  fi
  # copy CFD files
  cp -rf $PWD/CFD_${dirName}.yaml $PWD/${dirName}/CFD.yaml
done

function main {
  local tmpDir=$PWD/tmp
  local timeDir=$PWD/timings
  local parserTimeName=_parser_time.txt
  local wasmBuilderTimeName=_wasmbuilder_time.txt
  local compilerTimeName=_compiler_time.txt

  for dirname in ${directories[@]}; do
    local dirName=${dirname%?}
    local filename=${dirName}${parserTimeName}
    local jsonExport=$tmpDir/${dirName}_export.json

    # file count
    local count=$(getFileCount $dirName/)

    # goparser
    rm $timeDir/$filename 2> /dev/null
    echo "gofile count: $count" >> $timeDir/$filename
    echo $'\nGOPARSER\n===============================' >> $timeDir/$filename
    for i in $(seq 1 $iterations); do
      { time goparser -m -o $jsonExport -p $dirName/ >/dev/null 2>&1; } 2>> $timeDir/$filename;
    done;

    # wasm-builder - copy your CFDs over!
    filename=${dirName}${wasmBuilderTimeName}
    rm $timeDir/$filename 2> /dev/null
    echo $'\nWASM-BUILDER\n===============================' >> $timeDir/$filename
    for i in $(seq 1 $iterations); do
      { time node $APP_DIR/index.js -cfd $PWD/$dirName/CFD.yaml -e $jsonExport -t $tmpDir/$dirName/gotemp -p $tmpDir/$dirName/plugintemp >/dev/null 2>&1; } 2>> $timeDir/$filename;
    done;

    # compile files
    filename=${dirName}${compilerTimeName}
    rm $timeDir/$filename 2> /dev/null
    echo $'\nCOMPILER\n===============================' >> $timeDir/$filename
    for i in $(seq 1 $iterations); do
      { time make -f "$APP_DIR"/Makefile all GOSRC=$tmpDir/$dirName/gotemp PLUGINSRC=$tmpDir/$dirName/plugintemp WWW=$tmpDir/$dirName/wasm PLUGINS=$tmpDir/$dirName/plugins >/dev/null 2>&1; } 2>> $timeDir/$filename;
    done;
  done
}

printf "start tracking time...\n"

echo script took: $(trackTime main)
# time main

# previous time tracking method
# { time ... >/dev/null 2>&1; } 2>> $timeDir/$filename;
