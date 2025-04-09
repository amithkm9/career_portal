import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface UserSession {
  userSession: any | null
  profileDetails: any | null
  setUserSessionAndProfileDetails: (session: any | null, profileDetails: any | null) => void
}

export const useStore = create(
  persist<UserSession>(
    (set) => ({
      userSession: null,
      profileDetails: null,
      setUserSessionAndProfileDetails: (session, profileDetails) =>
        set(() => ({ userSession: session, profileDetails: profileDetails })),
    }),
    {
      name: "user-session",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

