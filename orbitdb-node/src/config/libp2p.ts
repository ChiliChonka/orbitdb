import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { identify } from '@libp2p/identify'
import { preSharedKey } from '@libp2p/pnet'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'

export const Libp2pOptions = {
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/10333', '/ip4/0.0.0.0/tcp/10333/ws']
  },
  transports: [
    tcp(),
    webSockets()
  ],
  connectionProtector: preSharedKey({ psk: new TextEncoder().encode('/key/swarm/psk/1.0.0/\n/base16/\nfef2d1aa529dfa67806cd9b7e8984c5c38425cbda4fd3ec208ef4b0f78194844\n') }),
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true })
  }
}
