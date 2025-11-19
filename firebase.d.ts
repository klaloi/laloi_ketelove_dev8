// firebase.d.ts
import { ReactNativeAsyncStorage } from "@react-native-async-storage/async-storage";
import { Persistence } from "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(
    storage: typeof ReactNativeAsyncStorage
  ): Persistence;
}
