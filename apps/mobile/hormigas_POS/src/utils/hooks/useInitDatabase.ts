import { initDatabase } from '@/db/DataBase'
import { useEffect, useState } from 'react'

interface UseInitDatabaseResult {
    isReady: boolean
    error: Error | null
}

export const useInitDatabase = (): UseInitDatabaseResult => {
    const [isReady, setIsReady] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        initDatabase()
            .then(() => setIsReady(true))
            .catch((e: Error) => {
                console.error('[POS][DB][ERROR]', e)
                setError(e)
            })
    }, [])

    return { isReady, error }
}
