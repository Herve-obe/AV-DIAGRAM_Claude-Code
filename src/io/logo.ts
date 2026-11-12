// Logo du cartouche : lecture d'une image choisie par l'utilisateur et réduction par un canevas.

/** Réduit une image (fichier choisi) en PNG de 600 px au plus de côté. */
export async function logoFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const k = Math.min(1, 600 / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * k))
    c.height = Math.max(1, Math.round(img.naturalHeight * k))
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/png')
  } finally {
    URL.revokeObjectURL(url)
  }
}
