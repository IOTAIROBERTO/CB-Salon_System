// Fotos del cabello para la solicitud: se reducen en el celular a JPEG de máximo 1280 px (≈150–350 KB) antes de mandarlas.
// La API acepta hasta 4 y rechaza las de más de ~450 KB, por eso se baja la calidad si hace falta.
export async function reducirFoto(archivo: File, max = 1280): Promise<string> {
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(img.naturalWidth * k)
    lienzo.height = Math.round(img.naturalHeight * k)
    lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height)
    for (const calidad of [0.72, 0.6, 0.45]) {
      const foto = lienzo.toDataURL('image/jpeg', calidad)
      if (foto.length < 590_000) return foto
    }
    throw new Error('La foto es demasiado grande')
  } finally {
    URL.revokeObjectURL(url)
  }
}
