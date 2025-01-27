import axios from "axios";

export async function enableServerApi(host:string,port:string):Promise<boolean> {
  try {
    const address = host.split(':')[0]
    const res = (await axios.get(`http://${host}:${port}/enable`));
    return res.data
  } catch (_) {
    return false
  }
}

async function test() {
  const a = await enableServerApi(`127.0.0.1`,'6511')
  console.log(a)
}
test()
