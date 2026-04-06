import { initDatabase } from "@/db/DataBase"
import { useEffect, useState } from "react"


interface UseInitDatabaseResult {
    isReady: boolean
    error: Error | null
}

export const useInitDatabase = (): UseInitDatabaseResult => {
    const [isReady, setIsReady] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        initDatabase()
            .then(() => setIsReady(true))
            .catch((e: Error) => {
                console.error(`[DATABASE][ERROR] ${e}`)
                setError(e)
            })
    }, [])

    return { isReady, error }
}