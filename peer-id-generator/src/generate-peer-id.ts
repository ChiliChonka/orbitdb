import { createEd25519PeerId, exportToProtobuf } from '@libp2p/peer-id-factory'
import fs from 'fs/promises'

async function main() {
  const peerId = await createEd25519PeerId()

  const privKeyBytes = peerId.privateKey ?? (() => { throw new Error("Keine privateKey-Daten vorhanden!") })()
  const base64 = Buffer.from(privKeyBytes).toString('base64')

  await fs.writeFile('peer-id.json', JSON.stringify({ privateKey: base64 }, null, 2))
  console.log('Peer-ID gespeichert unter peer-id.json')
}

main()
