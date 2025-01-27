import {Context} from 'koishi';
import axios from 'axios';

export const inject = {
  required: ['database']
}

declare module 'koishi' {
  interface Tables {
    address: Address;
    addressApi: AddressApi;
  }
}

export let address: [string, string][] = []; // 初始化为空数组嵌套数组
let start = true;

export interface Address {
  id: string;
  time: Date;
  host: string;
}

export async function getStatus(h: string): Promise<string> {
  let serverStatus = 'error';
  try {
    const response = await axios.get(`https://www.starss.cc/api/mdt?host=${h}`);
    const {
      host,
      port,
      status,
      name,
      maps,
      players,
      version,
      wave,
      vertype,
      gamemode,
      description,
      modename,
      limit,
      ping,
    } = response.data;

    const {n, v} = gamemode;
    serverStatus = '\n地址：因腾讯限制，请自行寻找\n名字：' + name + '\n状态：' + status + '\n延迟：' + ping + '\n地图：' + maps + '\n人数：' + players + '/' + limit + '\n版本：' + version + '\n波数：' + wave + '\n模式：' + n + '\n描述：' + description;
  } catch (e) {
    console.error('获取服务器状态时发生错误:', e.message);
    console.error('请检查网页链接的合法性，并适当重试。如果问题仍然存在，可能是网络问题或链接本身的问题。');
  }
  return serverStatus;
}

async function updateAddress(ctx: Context): Promise<void> {
  while (true) {
    try {
      let newAddress: [string, string][] = [];
      ctx.inject(['database'], async (ctx) => {
        const results = await ctx.database.get('address', {});
        for (const e of results) {
          newAddress.push([e.id, e.host]);
        }

        address = newAddress;
      })
    } catch (error) {
      console.error('Error in updateAddress:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

export function nowUpdateAddress(ctx: Context): void {
  let newAddress: [string, string][] = [];
  try {
    ctx.inject(['database'], async (ctx) => {
      const results = await ctx.database.get('address', {});

      for (const e of results) {
        newAddress.push([e.id, e.host]);
      }

      address = newAddress;
    })
  } catch (error) {
    console.error('Error in nowUpdateAddress:', error);
  }
}

export function addressLoad(ctx: Context): void {
  ctx.model.extend('address', {
    id: 'string',
    time: 'timestamp',
    host: 'string',
  });

  if (start) {
    start = false;
    updateAddress(ctx);
  }
}

export async function getServerStatusByGroup(ctx: Context, group: string): Promise<string> {
  for (const [id, host] of address) {
    if (id === group) return await getStatus(host);
  }
  return "获取服务器状态失败，可能是未设置服务器地址"
}

export async function setAddress(ctx: Context, id: string, host: string) {
  ctx.inject(['database'], async (ctx) => {
    await ctx.database.upsert('address', () => [
      {id: id, host: host}
    ])
    nowUpdateAddress(ctx)
  })
}


//serverApi

export interface AddressApi {
  id: string
  port: string
}

export function serverApiLoad(ctx: Context) {
  ctx.model.extend('addressApi', {
    id: 'string',
    port: 'string',
  });
}

async function enableServerApi(host: string, port: string): Promise<string> {
  try {
    const address = host.split(':')[0]
    return (await axios.get(`http://${address}:${port}/enable`)).data
  } catch (e) {
    return 'false'
  }
}

export async function getEnableServerById(ctx: Context, id: string): Promise<string> {
  let ret = 'false'
  ctx.inject(['database'], async (ctx) => {

    for (const a of (await ctx.database.get('addressApi', {id: id}))) {
      for (const r of (await ctx.database.get('address', {id: id}))) {
        ret = await enableServerApi(r.host, a.port)
      }
    }
    return ret
  })
  await new Promise(resolve => setTimeout(resolve, 1000));
  return ret
}

export async function getServerApiById(ctx: Context, id: string): Promise<string> {
  let ret = ''
  ctx.inject(['database'], async (ctx) => {

    for (const a of (await ctx.database.get('addressApi', {id: id}))) {
      for (const r of (await ctx.database.get('address', {id: id}))) {
        ret = 'http://' + r.host.split(':')[0] + ':' + a.port
      }
    }
    return ret
  })
  await new Promise(resolve => setTimeout(resolve, 1000));
  return ret
}

export async function gc(ctx: Context, id: string): Promise<string> {
  if (await getEnableServerById(ctx, id) != "false") {
    return (await axios.get(`${await getServerApiById(ctx, id)}/gc`)).data
  } else {
    return '未启用api功能，请联系管理员或机器人提供者'
  }
}

export async function setApiPort(ctx: Context, id: string, port: string){
  ctx.inject(['database'], async (ctx) => {
    await ctx.database.upsert('addressApi', () => [
      {id: id, port: port}
    ])
  })
}
