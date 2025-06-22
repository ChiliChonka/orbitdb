import { webSockets } from '@libp2p/websockets'
import { identify } from '@libp2p/identify'
import { preSharedKey } from '@libp2p/pnet'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { circuitRelayTransport, circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'

const swarmKey = new TextEncoder().encode(
  '/key/swarm/psk/1.0.0/\n/base16/\nfef2d1aa529dfa67806cd9b7e8984c5c38425cbda4fd3ec208ef4b0f78194844\n'
)

export const Libp2pOptions = {
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/10335/ws']
  },
  transports: [
    webSockets(),
    circuitRelayTransport()
  ],
  connectionProtector: preSharedKey({ psk: swarmKey }),
  connectionEncrypters: [noise()],
  streamMuxers: [yamux()],
  services: {
    relay: circuitRelayServer(),
    identify: identify(),
    pubsub: gossipsub({ allowPublishToZeroTopicPeers: true }),
  }
}
