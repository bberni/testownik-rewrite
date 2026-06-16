import { ref, onUnmounted } from 'vue'
import { getAssetsByQuiz } from '@/platform/assets/assetRepository'

export function useAssetUrls(quizId: string) {
  const blobUrls = ref(new Map<string, string>())

  async function load() {
    try {
      const assets = await getAssetsByQuiz(quizId)
      for (const asset of assets) {
        const url = URL.createObjectURL(asset.blob)
        blobUrls.value.set(asset.relativePath, url)
      }
    } catch {
      // Assets may be missing
    }
  }

  function getUrl(relativePath: string): string | null {
    return blobUrls.value.get(relativePath) ?? null
  }

  onUnmounted(() => {
    for (const url of blobUrls.value.values()) {
      URL.revokeObjectURL(url)
    }
  })

  return { load, getUrl }
}
