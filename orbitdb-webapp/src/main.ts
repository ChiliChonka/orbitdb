import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { webSockets } from '@libp2p/websockets'
import { preSharedKey } from '@libp2p/pnet'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'
// @ts-ignore
import { createOrbitDB, IPFSAccessController } from '@orbitdb/core'
import { ping } from '@libp2p/ping'
import { MemoryBlockstore } from 'blockstore-core/memory'

const swarmKey = new TextEncoder().encode(
  '/key/swarm/psk/1.0.0/\n/base16/\nfef2d1aa529dfa67806cd9b7e8984c5c38425cbda4fd3ec208ef4b0f78194844\n'
)

const peer = new URLSearchParams(window.location.search).get('peer') || '/ip4/127.0.0.1/tcp/10335/ws/p2p/12D3KooWENza5Fdu8HW3KAF4xhJnjjyq6wyDvjmrM3cBmP6Vshih';
const addr = new URLSearchParams(window.location.search).get('db') || '/orbitdb/zdpuB2aYUCnZ7YUBrDkCWpRLQ8ieUbqJEVRZEd5aDhJBDpBqj'
  
const start = async () => {
  const libp2p = await createLibp2p({
    transports: [
      webSockets(),
    ],
    connectionProtector: preSharedKey({ psk: swarmKey }),
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        scoreThresholds: {
          gossipThreshold: -9999,
          publishThreshold: -9999,
          graylistThreshold: -9999,
          acceptPXThreshold: -9999
        },
        scoreParams: {
          topics: {},
          decayInterval: 1_000,
          decayToZero: 0.01,
          retainScore: 10_000
        }        
      }),
      ping: ping()
    },
    peerDiscovery: []
  })

  const peerAddr = new URLSearchParams(window.location.search).get('peer')
  if (peerAddr) {
    await libp2p.dial(multiaddr(peerAddr))
  } else {
    (document.getElementById('multiaddrs') as HTMLInputElement).value = libp2p.getMultiaddrs().map(ma => ma.toString()).join(', ')
  }

  const blockstore = new MemoryBlockstore()
  const ipfs = await createHelia({
    libp2p,
    blockstore,
    routers: []
  })
  const orbitdb = await createOrbitDB({ ipfs })

  const peer = new URLSearchParams(window.location.search).get('peer') || '/ip4/127.0.0.1/tcp/10335/ws/p2p/12D3KooWENza5Fdu8HW3KAF4xhJnjjyq6wyDvjmrM3cBmP6Vshih';
  if(peer) {
    console.log("dial", peer);
    orbitdb.ipfs.libp2p.dial(multiaddr(peer));
  }

  let db
  const addr = new URLSearchParams(window.location.search).get('db') || '/orbitdb/zdpuB2aYUCnZ7YUBrDkCWpRLQ8ieUbqJEVRZEd5aDhJBDpBqj'
  if (addr) {
    console.log("addr", addr);
    db = await orbitdb.open(addr)
  } else {
    db = await orbitdb.open('my-db', { AccessController: IPFSAccessController({ write: ['*'] }) });
    console.log("no-addr", db.address);
  }
  (document.getElementById('db-address') as HTMLInputElement).value = db.address.toString();

  (document.getElementById('peer-id') as HTMLSpanElement).textContent = orbitdb.ipfs.libp2p.peerId.toString()

  db.events.on('update', (entry: any) => {
    const item = document.createElement('li')
    item.textContent = entry.payload.value
    document.getElementById('entries')!.appendChild(item)
  })

  document.getElementById('form')!.addEventListener('submit', async (e) => {
    e.preventDefault()
    const input = (document.getElementById('input') as HTMLInputElement)
    await db.add(`${orbitdb.ipfs.libp2p.peerId}: ${input.value}`)
    input.value = ''
    return false;
  })
}

start()
