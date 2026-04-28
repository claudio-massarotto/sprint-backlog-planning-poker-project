import os from 'node:os';

export function getLocalUrls(port) {
  const urls = [];
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family !== 'IPv4' || entry.internal) continue;
      urls.push(`http://${entry.address}:${port}`);
    }
  }

  return urls;
}

export function printServerUrls(port) {
  const localUrls = getLocalUrls(port);

  console.log('\nPlanning Poker server avviato\n');
  console.log('Locale:');
  console.log(`http://localhost:${port}`);

  if (localUrls.length) {
    console.log('\nRete locale:');
    localUrls.forEach((url) => console.log(url));
  } else {
    console.log('\nRete locale: nessun indirizzo IPv4 rilevato');
  }

  console.log('\nCondividi uno degli indirizzi di rete locale con il team.\n');
}
