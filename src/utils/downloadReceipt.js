import html2canvas from 'html2canvas'

export async function downloadReceiptPng(element, filename = 'currencyflow-receipt.png') {
  if (!element) throw new Error('Receipt element not found')

  const canvas = await html2canvas(element, {
    backgroundColor: '#f3f7f6',
    scale: 2,
    useCORS: true,
    logging: false,
    // элемент может быть за пределами viewport
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export function buildReceiptFilename(from, to) {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  return `currencyflow-${from}-to-${to}-${stamp}.png`
}
