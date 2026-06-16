type VisibilityCallback = (hidden: boolean) => void

export function addVisibilityListener(callback: VisibilityCallback): () => void {
  const handler = () => callback(document.hidden)
  document.addEventListener('visibilitychange', handler)
  return () => document.removeEventListener('visibilitychange', handler)
}
