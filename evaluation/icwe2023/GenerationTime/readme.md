# Track goparser parse times

The testdata directory will be mounted into /usr/app.

**enter docker the container**  
`docker-compose run --rm --user root dev`

**navigate to directory**  
`cd /usr/app`

**execute time script**  
`./time.sh`

Time files are located in `testdata/timings` directory.  
Generated artifacts are located in `testdata/tmp` directory.

Alternatively a single command can be used to execute the script but it's slower due to the containers startup time.

`docker-compose run --rm dev ./time.sh`

## used projects to measure

https://github.com/google/wire  
https://github.com/hashicorp/terraform

## troubleshooting

**unzip the directories**

```bash
tar -zxf wire.tar.gz
tar -zxf terraform.tar.gz
```

**zip the directories**  
`tar -zcf wire.tar.gz wire`
`tar -zcf terraform.tar.gz terraform`
