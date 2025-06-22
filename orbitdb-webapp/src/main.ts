import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { webSockets } from '@libp2p/websockets'
import { preSharedKey } from '@libp2p/pnet'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'
  const swarmKey = new TextEncoder().encode(
    '/key/swarm/psk/1.0.0/\n/base16/\nfef2d1aa529dfa67806cd9b7e8984c5c38425cbda4fd3ec208ef4b0f78194844\n'
  )

    connectionProtector: preSharedKey({ psk: swarmKey }),
      identify: identify(),
  const peerAddr = new URLSearchParams(window.location.search).get('peer')
  if (peerAddr) {
    await libp2p.dial(multiaddr(peerAddr))
  } else {
    (document.getElementById('multiaddrs') as HTMLInputElement).value = libp2p.getMultiaddrs().map(ma => ma.toString()).join(', ')
  }


import { identify } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'
// @ts-ignore
import { createOrbitDB, IPFSAccessController } from '@orbitdb/core'

const start = async () => {
  const libp2p = await createLibp2p({
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true })
    }
  })

  const ipfs = await createHelia({ libp2p })
  const orbitdb = await createOrbitDB({ ipfs })

  const peer = new URLSearchParams(window.location.search).get('peer') || '/ip4/127.0.0.1/tcp/41535/ws/p2p/12D3KooWL5dkiBivpjYibPRRf7HhDPdRfAA6bn8g3fec7CEdirGP';
  if(peer) {
    orbitdb.ipfs.libp2p.dial(multiaddr(peer));
  }

  let db
  const addr = new URLSearchParams(window.location.search).get('db') || '/orbitdb/zdpuB2aYUCnZ7YUBrDkCWpRLQ8ieUbqJEVRZEd5aDhJBDpBqj'
  if (addr) {
    db = await orbitdb.open(addr)
  } else {
    db = await orbitdb.open('my-db', { AccessController: IPFSAccessController({ write: ['*'] }) });
    (document.getElementById('db-address') as HTMLInputElement).value = db.address.toString();
  }

  ;(document.getElementById('peer-id') as HTMLSpanElement).textContent = orbitdb.ipfs.libp2p.peerId.toString()

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
  })
}

start()
