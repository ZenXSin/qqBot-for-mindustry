import {Context} from 'koishi'
import axios from 'axios'
import {} from '@koishijs/plugin-help'
import {
  address,
  getServerStatusByGroup,
  addressLoad,
  nowUpdateAddress,
  setAddress,
  getEnableServerById, serverApiLoad, gc
} from './server/address'

export const name = 'zxs'

export function apply(ctx: Context) {
  addressLoad(ctx)
  serverApiLoad(ctx)

  ctx.command('服务器状态 查询服务器状态')
    .action(async (r) => {
      const session = r.session
      return (await getServerStatusByGroup(ctx, session.channelId))
    })
  ctx.command('设置服务器地址 <address> 设置对应服务器地址')
    .action(async (r) => {
      const session = r.session
      const address = r.args[0]
      await setAddress(ctx, session.channelId, address)
      return `设置成功，对应ID：${session.channelId}`
    })
  ctx.command('as 查询数据库内所有服务器')
    .action(() => {
      nowUpdateAddress(ctx)
      console.log(address.toString())
    })
  ctx.command('api检查 扩展功能是否开启')
    .action(async (r) => {
      const session = r.session
      const sa = (await getEnableServerById(ctx, session.channelId))
      if (sa != "false") {
        return '已开启'
      }
      return '未开启'
    })
  ctx.command('内存清理 清理服务器内存(扩展功能)')
    .alias('gc')
    .action(async (r) => {
      const id = r.session.channelId
      return gc(ctx,id)
    })
}
2
