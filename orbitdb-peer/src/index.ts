import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
//@ts-ignore
import { createOrbitDB, IPFSAccessController } from '@orbitdb/core'
import { LevelBlockstore } from 'blockstore-level'
import { Libp2pOptions } from './config/libp2p.js'
import { multiaddr } from '@multiformats/multiaddr'
import { createFromProtobuf } from '@libp2p/peer-id-factory'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import fs from 'fs'
import readline from 'node:readline'


const main = async () => {
  // create a random directory to avoid OrbitDB conflicts.
  let randDir = (Math.random() + 1).toString(36).substring(2)
    
  const blockstore = new LevelBlockstore(`./blockstore/${randDir}/ipfs/blocks`)
  const peerIdData = JSON.parse(fs.readFileSync(new URL('../peer-id.json', import.meta.url)).toString())
  const peerId = await createFromProtobuf(uint8ArrayFromString(peerIdData.base64, 'base64pad'))
  const libp2p = await createLibp2p({ ...(Libp2pOptions as any), peerId } as any)
  const ipfs = await createHelia({ libp2p, blockstore })

  const orbitdb = await createOrbitDB({ ipfs, directory: `./blockstore/${randDir}/orbitdb` })

  let db

  if (process.argv[2] && process.argv[3]) {
    await orbitdb.ipfs.libp2p.dial(multiaddr(process.argv[3]))
    console.log('opening db', process.argv[2])
    db = await orbitdb.open(process.argv[2])
  } else {
    // When we open a new database, write access is only available to the 
    // db creator. If we want to allow other peers to write to the database,
    // they must be specified in IPFSAccessController write array param. Here,
    // we simply allow anyone to write to the database. A more robust solution
    // would use the OrbitDBAccessController to provide mutable, "fine-grain"
    // access using grant and revoke.
    db = await orbitdb.open('my-db', { AccessController: IPFSAccessController({ write: ['*']}) })
    
    console.log('libp2p address', '(copy one of these addresses then dial into this node from the second node)', orbitdb.ipfs.libp2p.getMultiaddrs())
    
    // Copy this output if you want to connect a peer to another.
    console.log('my-db address', '(copy my db address and use when launching peer 2)', db.address)
  }

  db.events.on('update', async (entry:any) => {
    // what has been updated.
    console.log('update', entry.payload.value)
  })
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
  });
  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input === 'exit') {
      rl.close();
      return;
    }

    // Hier kannst du etwas mit der Eingabe machen
    await db.add(orbitdb.ipfs.libp2p.peerId + ": " + input)
    // Zeigt wieder den Prompt
    rl.prompt();
  }).on('close', () => {
    console.log('Tschüss!');
    process.exit(0);
  });

  // Clean up when stopping this app using ctrl+c
  process.on('SIGINT', async () => {
      // print the final state of the db.
      console.log((await db.all()).map((e: any) => e.value))
      // Close your db and stop OrbitDB and IPFS.
      await db.close()
      await orbitdb.stop()
      await ipfs.stop()

      process.exit()
  })
}

main()
