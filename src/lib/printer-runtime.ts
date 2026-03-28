import { Tenant } from './types'
import { getPrinterNameForChannel } from './device-print'

type PrintChannel = 'kitchen' | 'cashier'

export interface SystemPrinter {
  name: string
  displayName?: string
  description?: string
  status?: number
  isDefault?: boolean
}

declare global {
  interface Window {
    require?: (module: string) => any
  }
}

function getElectronIpcRenderer() {
  if (typeof window === 'undefined') return null
  try {
    return window.require?.('electron')?.ipcRenderer ?? null
  } catch {
    return null
  }
}

export function canUseNativePrinterRuntime() {
  return Boolean(getElectronIpcRenderer())
}

export async function listSystemPrinters(): Promise<SystemPrinter[]> {
  const ipcRenderer = getElectronIpcRenderer()
  if (!ipcRenderer) return []
  try {
    const printers = await ipcRenderer.invoke('printer:list')
    return Array.isArray(printers) ? printers : []
  } catch {
    return []
  }
}

async function printWithBrowserWindow(html: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=420,height=640')
  if (!printWindow) return false
  printWindow.document.write(html)
  printWindow.document.title = title
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 400)
  return true
}

export async function printHtmlDocument(
  html: string,
  title: string,
  channel: PrintChannel,
  tenant: Tenant,
  fallbackToBrowser = true,
) {
  const printerName = getPrinterNameForChannel(channel, tenant)
  const ipcRenderer = getElectronIpcRenderer()

  if (ipcRenderer && printerName) {
    try {
      const result = await ipcRenderer.invoke('printer:print', {
        html,
        title,
        printerName,
      })
      if (result?.success) return true
    } catch {
    }
  }

  if (!fallbackToBrowser) return false
  return printWithBrowserWindow(html, title)
}
