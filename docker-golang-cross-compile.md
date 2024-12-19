---
lang: en
last_modified_at: 2017-11-13
---
## Go cross-compilation from Docker

<https://hub.docker.com/_/golang/>

### For Windows

```
docker run --rm -v "$PWD":/usr/src/app -w /usr/src/app -e GOOS=windows -e GOARCH=amd64 golang:1.9 go build -v
```

#### without opened console window

```
docker run --rm -v "$PWD":/usr/src/app -w /usr/src/app -e GOOS=windows -e GOARCH=amd64 golang:1.9 go build -v -ldflags "-H windowsgui"
```
