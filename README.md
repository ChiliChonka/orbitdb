# Simple OrbitDB Chat

This repository contains a minimal example of a chat application built with Node.js and OrbitDB. It uses an IPFS node and serves a basic browser interface.

The frontend bundles the IPFS and OrbitDB browser builds locally so no external CDN is required.

## Usage

Install Docker and run:

```bash
docker-compose up --build
```

Visit `http://localhost:8080` in two browsers to chat.

The included IPFS node runs with `--enable-pubsub-experiment` so OrbitDB can replicate chat messages between peers.
