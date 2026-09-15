import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as Icons from '@element-plus/icons-vue'
import { listMenus } from '@/api/menu'

export interface MenuItem {
  id: number
  parentId: number
  menuName: string
  menuType: number // 1目录 2菜单 3按钮
  path: string
  icon: string
  sort: number
  visible: number
  permCode: string
  apiPath: string
  children?: MenuItem[]
}

export const useMenuStore = defineStore('menu', () => {
  const menuTree = ref<MenuItem[]>([])
  const loaded = ref(false)

  async function loadMenus() {
    const list = (await listMenus()) as MenuItem[]
    menuTree.value = filterAndSort(list)
    loaded.value = true
    return menuTree.value
  }

  /** 过滤按钮类型，按 sort 排序 */
  function filterAndSort(list: MenuItem[]): MenuItem[] {
    return list
      .filter((m) => m.menuType !== 3 && m.visible === 1)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((m) => ({
        ...m,
        children: m.children ? filterAndSort(m.children) : [],
      }))
  }

  /** 根据 icon 字符串解析 Element Plus 图标组件 */
  function resolveIcon(name?: string) {
    if (!name) return null
    const comp = (Icons as any)[name]
    return comp ? comp : null
  }

  function reset() {
    menuTree.value = []
    loaded.value = false
  }

  return { menuTree, loaded, loadMenus, resolveIcon, reset }
})
