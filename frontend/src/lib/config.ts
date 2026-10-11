import AsyncStorage from "@react-native-async-storage/async-storage";

// Supply your own API; no hosted Bokeh services are used by default.
export const PROD_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8787";
export const LOCAL_BASE = process.env.EXPO_PUBLIC_LOCAL_API_URL || PROD_BASE;
const KEY = "bokeh-editor.baseUrl.v1";

export async function loadBaseUrl(): Promise<string> {
  return (await AsyncStorage.getItem(KEY)) || PROD_BASE;
}
export async function saveBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEY, url);
}
