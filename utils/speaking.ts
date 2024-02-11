import * as Speech from 'expo-speech'

export async function speak(content: string) {
  await Speech.stop()
  Speech.speak(content, { language: 'zh' })
}
