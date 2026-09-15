import { ElMessageBox } from 'element-plus'

/**
 * 居中确认弹窗（替代 ElMessageBox.confirm，确保屏幕居中显示）
 */
export function confirm(message: string, title = '提示') {
  return ElMessageBox.confirm(message, title, {
    type: 'warning',
    center: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    customClass: 'center-confirm-dialog',
  })
}
